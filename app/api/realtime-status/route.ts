import { createClient } from "@/utils/supabase/server";
import { SupabaseClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from "next/server";

interface TableStatus {
  table: string;
  exists: boolean;
  count: number;
  error: string | null;
}

interface PublicationTable {
  table: string;
  inPublication: boolean;
}

interface Publication {
  exists?: boolean;
  error?: string;
  details?: string;
  tables: PublicationTable[];
}

interface ReplicaIdentity {
  table: string;
  identityType: string;
  isCorrect: boolean;
  error?: string;
}

interface TaskViewerCleanupResult {
  session_task_id: string;
  participant_id: string;
  success: boolean;
  error?: string;
  removed?: number;
}

interface DuplicateCleanupResult {
  success: boolean;
  error?: string;
  duplicateSets?: number;
  totalDuplicatesRemoved?: number;
  details?: TaskViewerCleanupResult[];
}

export async function GET(request: NextRequest) {
  try {
    // Create server-side Supabase client
    const supabase = await createClient();
    
    // Check if we should fix duplicate viewers
    const shouldFixDuplicates = request.nextUrl.searchParams.get('fix_duplicates') === 'true';
    
    // If requested, cleanup duplicate task viewers
    let duplicateCleanupResult: DuplicateCleanupResult | null = null;
    if (shouldFixDuplicates) {
      duplicateCleanupResult = await cleanupDuplicateTaskViewers(supabase);
    }
    
    // Check if necessary tables exist
    const tables = [
      'cleaning_session_tasks',
      'cleaning_sessions',
      'session_participants',
      'task_viewers'
    ];
    
    const tableStatuses: TableStatus[] = [];
    
    // Check each table
    for (const table of tables) {
      try {
        const { count, error } = await supabase
          .from(table)
          .select("*", { count: "exact", head: true });
        
        tableStatuses.push({
          table,
          exists: !error,
          count: count || 0,
          error: error ? error.message : null
        });
      } catch (error) {
        tableStatuses.push({
          table,
          exists: false,
          count: 0,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }
    
    // Check publication configuration
    let publication: Publication = { tables: [] };
    
    try {
      const { data: publicationData, error } = await supabase.rpc('get_publication_tables', {
        publication_name: 'supabase_realtime'
      });
      
      if (error) {
        publication = {
          error: error.message,
          tables: []
        };
      } else {
        const pubTables = new Set((publicationData as Array<{schemaname: string, tablename: string}> || [])
          .map(row => row.tablename));
        
        publication = {
          exists: true,
          tables: tables.map(table => ({
            table,
            inPublication: pubTables.has(table)
          }))
        };
      }
    } catch (error) {
      // Create helper function if it doesn't exist
      try {
        // Using any here because Supabase types don't properly expose sql method
        await (supabase as any).sql(`
          CREATE OR REPLACE FUNCTION public.get_publication_tables(publication_name text)
          RETURNS TABLE(schemaname text, tablename text)
          LANGUAGE plpgsql
          SECURITY DEFINER
          AS $$
          BEGIN
            RETURN QUERY
            SELECT n.nspname::text, c.relname::text
            FROM pg_publication p
            JOIN pg_publication_rel pr ON p.oid = pr.prpubid
            JOIN pg_class c ON c.oid = pr.prrelid
            JOIN pg_namespace n ON n.oid = c.relnamespace
            WHERE p.pubname = publication_name;
          END;
          $$;
        `);
        
        publication = {
          error: "Helper function created, please try again",
          tables: []
        };
      } catch (sqlError) {
        publication = {
          error: "Could not check publication status",
          details: error instanceof Error ? error.message : String(error),
          tables: []
        };
      }
    }
    
    // Check replica identity
    const replicaIdentities: ReplicaIdentity[] = [];
    
    try {
      for (const table of tables) {
        try {
          // Using any here because Supabase types don't properly expose sql method
          const { data } = await (supabase as any).sql(`
            SELECT relreplident
            FROM pg_class
            WHERE relname = '${table}'
          `);
          
          let identityType = "unknown";
          if (data && data.length > 0) {
            const code = data[0].relreplident;
            identityType = 
              code === "d" ? "default" :
              code === "n" ? "nothing" :
              code === "f" ? "full" :
              code === "i" ? "index" : "unknown";
          }
          
          replicaIdentities.push({
            table,
            identityType,
            isCorrect: identityType === "full"
          });
        } catch (error) {
          replicaIdentities.push({
            table,
            identityType: "error",
            error: error instanceof Error ? error.message : String(error),
            isCorrect: false
          });
        }
      }
    } catch (error) {
      // Ignore error checking replica identities
    }
    
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      tables: tableStatuses,
      publication,
      replicaIdentities,
      duplicateCleanupResult,
      suggestions: getSuggestions(tableStatuses, publication, replicaIdentities)
    });
  } catch (error) {
    return NextResponse.json({
      error: "Failed to check realtime status",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

// Function to clean up duplicate task viewer records
async function cleanupDuplicateTaskViewers(supabase: SupabaseClient): Promise<DuplicateCleanupResult> {
  try {
    // First, identify all duplicates (same participant viewing the same task multiple times)
    const { data: duplicates, error: findError } = await (supabase as any).sql(`
      SELECT session_task_id, participant_id, COUNT(*) as count
      FROM task_viewers
      GROUP BY session_task_id, participant_id
      HAVING COUNT(*) > 1
    `);
    
    if (findError) {
      return {
        success: false,
        error: findError.message
      };
    }
    
    let cleanupResults: TaskViewerCleanupResult[] = [];
    let totalDuplicatesRemoved = 0;
    
    // For each duplicate set, keep only the most recent record
    for (const dup of duplicates || []) {
      try {
        // Get all records for this participant/task combination
        const { data: records, error: recordsError } = await supabase
          .from('task_viewers')
          .select('*')
          .eq('session_task_id', dup.session_task_id)
          .eq('participant_id', dup.participant_id)
          .order('started_viewing_at', { ascending: false });
        
        if (recordsError || !records || records.length <= 1) {
          cleanupResults.push({
            session_task_id: dup.session_task_id,
            participant_id: dup.participant_id,
            success: false,
            error: recordsError?.message || 'No records found'
          });
          continue;
        }
        
        // Keep the first one (most recent), delete the rest
        const recordsToDelete = records.slice(1);
        const idsToDelete = recordsToDelete.map((r: any) => r.id);
        
        // Delete the duplicate records
        const { error: deleteError } = await supabase
          .from('task_viewers')
          .delete()
          .in('id', idsToDelete);
        
        if (deleteError) {
          cleanupResults.push({
            session_task_id: dup.session_task_id,
            participant_id: dup.participant_id,
            success: false,
            error: deleteError.message
          });
        } else {
          totalDuplicatesRemoved += recordsToDelete.length;
          cleanupResults.push({
            session_task_id: dup.session_task_id,
            participant_id: dup.participant_id,
            success: true,
            removed: recordsToDelete.length
          });
        }
      } catch (itemError) {
        cleanupResults.push({
          session_task_id: dup.session_task_id,
          participant_id: dup.participant_id,
          success: false,
          error: itemError instanceof Error ? itemError.message : String(itemError)
        });
      }
    }
    
    return {
      success: true,
      duplicateSets: duplicates?.length || 0,
      totalDuplicatesRemoved,
      details: cleanupResults
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

function getSuggestions(
  tables: TableStatus[], 
  publication: Publication, 
  replicaIdentities: ReplicaIdentity[]
): string[] {
  const suggestions: string[] = [];
  
  // Check tables
  const missingTables = tables.filter(t => !t.exists).map(t => t.table);
  if (missingTables.length > 0) {
    suggestions.push(`Missing tables: ${missingTables.join(", ")}`);
  }
  
  // Check publication
  if (publication.error) {
    suggestions.push(`Publication issue: ${publication.error}`);
  } else {
    const tablesNotInPublication = publication.tables
      .filter(t => !t.inPublication)
      .map(t => t.table);
      
    if (tablesNotInPublication.length > 0) {
      suggestions.push(`Tables not in publication: ${tablesNotInPublication.join(", ")}`);
    }
  }
  
  // Check replica identity
  const incorrectIdentities = replicaIdentities
    .filter(r => !r.isCorrect)
    .map(r => `${r.table} (${r.identityType})`);
    
  if (incorrectIdentities.length > 0) {
    suggestions.push(`Tables with incorrect REPLICA IDENTITY: ${incorrectIdentities.join(", ")}`);
  }
  
  if (suggestions.length === 0) {
    suggestions.push("All Supabase realtime configurations appear correct! If you're still having issues, check the Supabase dashboard to ensure realtime is enabled.");
  }
  
  return suggestions;
} 