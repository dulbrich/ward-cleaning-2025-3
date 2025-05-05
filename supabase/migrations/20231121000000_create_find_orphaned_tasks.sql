-- Function to find orphaned task assignments (assigned to non-existent temp users)
CREATE OR REPLACE FUNCTION find_orphaned_tasks()
RETURNS TABLE (
  id uuid,
  session_id uuid,
  task_id uuid,
  assigned_to_temp_user text,
  status text,
  assigned_at timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    cst.id,
    cst.session_id,
    cst.task_id,
    cst.assigned_to_temp_user,
    cst.status,
    cst.assigned_at
  FROM
    cleaning_session_tasks cst
  WHERE
    cst.assigned_to_temp_user IS NOT NULL
    AND NOT EXISTS (
      SELECT 1
      FROM session_participants sp
      WHERE sp.temp_user_id = cst.assigned_to_temp_user
    );
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER; 