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

    // Create the stored procedure for total hours calculation
    const { error: error1 } = await supabase.rpc("exec_sql", {
      sql_query: `
        CREATE OR REPLACE FUNCTION calculate_user_hours(user_id UUID)
        RETURNS TABLE (total_hours NUMERIC) 
        LANGUAGE SQL
        AS $$
          SELECT 
            SUM(
              LEAST(
                EXTRACT(EPOCH FROM (completed_at - assigned_at)) / 3600,
                2
              )
            ) AS total_hours
          FROM cleaning_session_tasks
          WHERE 
            assigned_to = user_id
            AND status = 'done'
            AND completed_at IS NOT NULL
            AND assigned_at IS NOT NULL
            AND (completed_at - assigned_at) >= INTERVAL '1 minute';
        $$;
      `
    });

    if (error1) {
      console.error("Error creating calculate_user_hours procedure:", error1);
      return NextResponse.json({ error: error1.message }, { status: 500 });
    }

    // Create the stored procedure for hours by day
    const { error: error2 } = await supabase.rpc("exec_sql", {
      sql_query: `
        CREATE OR REPLACE FUNCTION get_hours_by_day(user_id UUID, start_date TIMESTAMP WITH TIME ZONE)
        RETURNS TABLE (date TEXT, hours NUMERIC, tasks BIGINT) 
        LANGUAGE SQL
        AS $$
          WITH daily_hours AS (
            SELECT 
              TO_CHAR(DATE_TRUNC('day', completed_at), 'YYYY-MM-DD') AS day,
              LEAST(
                EXTRACT(EPOCH FROM (completed_at - assigned_at)) / 3600,
                2
              ) AS hours_spent
            FROM cleaning_session_tasks
            WHERE 
              assigned_to = user_id
              AND status = 'done'
              AND completed_at IS NOT NULL
              AND assigned_at IS NOT NULL
              AND (completed_at - assigned_at) >= INTERVAL '1 minute'
              AND completed_at >= start_date
          ),
          day_series AS (
            SELECT 
              TO_CHAR(d, 'YYYY-MM-DD') AS day
            FROM 
              generate_series(
                DATE_TRUNC('day', start_date), 
                DATE_TRUNC('day', CURRENT_TIMESTAMP), 
                '1 day'::interval
              ) d
          )
          SELECT 
            s.day AS date,
            COALESCE(ROUND(SUM(h.hours_spent)::numeric, 1), 0) AS hours,
            COUNT(h.hours_spent) AS tasks
          FROM 
            day_series s
          LEFT JOIN 
            daily_hours h ON s.day = h.day
          GROUP BY 
            s.day
          ORDER BY 
            s.day;
        $$;
      `
    });

    if (error2) {
      console.error("Error creating get_hours_by_day procedure:", error2);
      return NextResponse.json({ error: error2.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 