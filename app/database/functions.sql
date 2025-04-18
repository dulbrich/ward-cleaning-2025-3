-- Function to safely complete a task without triggering the problematic triggers
CREATE OR REPLACE FUNCTION complete_task_safely(
  p_task_id UUID,
  p_completion_time TIMESTAMPTZ DEFAULT now()
)
RETURNS VOID 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  task_record RECORD;
BEGIN
  -- Get the task information first without any triggers
  SELECT 
    id, 
    session_id, 
    task_id,
    assigned_to,
    assigned_to_temp_user
  INTO task_record
  FROM cleaning_session_tasks
  WHERE id = p_task_id;
  
  -- Use a more direct approach to bypass triggers entirely: delete and reinsert
  -- First delete the task - this avoids triggers that would fire on update
  DELETE FROM cleaning_session_tasks WHERE id = p_task_id;
  
  -- Then insert it back with the done status
  INSERT INTO cleaning_session_tasks (
    id,
    session_id,
    task_id,
    status,
    assigned_to,
    assigned_to_temp_user,
    assigned_at,
    completed_at,
    updated_at
  ) VALUES (
    task_record.id,
    task_record.session_id,
    task_record.task_id,
    'done',
    task_record.assigned_to,
    task_record.assigned_to_temp_user,
    task_record.assigned_at,
    p_completion_time,
    p_completion_time
  );
END;
$$; 