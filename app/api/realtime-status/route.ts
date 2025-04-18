import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    // Create server-side Supabase client
    const supabase = await createClient();
    
    // Check if necessary tables exist
    const tables = [
      'cleaning_session_tasks',
      'cleaning_sessions',
      'session_participants',
      'task_viewers'
    ];
    
    const tableStatuses = [];
    
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
    let publication = null;
    
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
        const pubTables = new Set((publicationData || []).map(row => row.tablename));
        
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
        await supabase.sql(`
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
    const replicaIdentities = [];
    
    try {
      for (const table of tables) {
        try {
          const { data } = await supabase.sql(`
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
      suggestions: getSuggestions(tableStatuses, publication, replicaIdentities)
    });
  } catch (error) {
    return NextResponse.json({
      error: "Failed to check realtime status",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

function getSuggestions(tables, publication, replicaIdentities) {
  const suggestions = [];
  
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