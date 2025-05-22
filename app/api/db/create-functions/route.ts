import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Only allow admin users to create database functions
    const { data: userProfile } = await supabase
      .from("user_profiles")
      .select("role")
      .eq("user_id", user?.id)
      .single();

    if (!user || userProfile?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Create the stored procedure for category breakdown
    const { error } = await supabase.rpc("exec_sql", {
      sql_query: `
        CREATE OR REPLACE FUNCTION get_category_breakdown(user_id UUID)
        RETURNS TABLE (category TEXT, total BIGINT) 
        LANGUAGE SQL
        AS $$
          SELECT 
            COALESCE(tt.category, 'Uncategorized') as category,
            COUNT(*) as total
          FROM cleaning_session_tasks cst
          JOIN ward_tasks wt ON cst.task_id = wt.id
          LEFT JOIN task_templates tt ON wt.template_id = tt.id
          WHERE cst.assigned_to = user_id
            AND cst.status = 'done'
          GROUP BY COALESCE(tt.category, 'Uncategorized')
          ORDER BY total DESC;
        $$;
      `
    });

    if (error) {
      console.error("Error creating stored procedure:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 