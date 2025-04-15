-- Create a function to populate cleaning_session_tasks from ward_tasks
CREATE OR REPLACE FUNCTION create_session_tasks(session_id UUID)
RETURNS VOID AS $$
DECLARE
  session_record RECORD;
BEGIN
  -- Get the session record
  SELECT * INTO session_record FROM cleaning_sessions WHERE id = session_id;
  
  -- Make sure the session exists
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Cleaning session with ID % not found', session_id;
  END IF;
  
  -- Insert tasks from ward_tasks for this ward into cleaning_session_tasks
  INSERT INTO cleaning_session_tasks (
    session_id,
    task_id,
    status
  )
  SELECT 
    session_id,
    id,
    'todo'
  FROM ward_tasks
  WHERE 
    ward_id = session_record.ward_branch_id
    AND active = true;
    
  -- Return success
  RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 