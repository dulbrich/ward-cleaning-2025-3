-- Migration to fix uppercase DONE tasks
-- This script will update all tasks with status 'DONE' to 'done'

-- First disable the problematic trigger
CREATE OR REPLACE FUNCTION temporarily_disable_triggers()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Disable the award_points_on_completion trigger temporarily
  ALTER TABLE cleaning_session_tasks DISABLE TRIGGER award_points_on_completion;
END;
$$;

-- Run the function to disable triggers
SELECT temporarily_disable_triggers();

-- Function to fix the task statuses without triggering problematic triggers
CREATE OR REPLACE FUNCTION fix_task_status_case()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Now update the statuses without the trigger firing
  UPDATE cleaning_session_tasks
  SET status = 'done'
  WHERE status = 'DONE';
  
  -- Update any tasks with other uppercase variants
  UPDATE cleaning_session_tasks
  SET status = 'done'
  WHERE status IN ('Done', 'DONE', 'dONE', 'DoNe');
  
  -- Update any tasks with uppercase TODO to lowercase todo
  UPDATE cleaning_session_tasks
  SET status = 'todo'
  WHERE status IN ('TODO', 'Todo', 'TOdo');
  
  -- Update any tasks with uppercase DOING to lowercase doing
  UPDATE cleaning_session_tasks
  SET status = 'doing'
  WHERE status IN ('DOING', 'Doing', 'DOing');
END;
$$;

-- Execute the function
SELECT fix_task_status_case();

-- Finally, re-enable the trigger
CREATE OR REPLACE FUNCTION reenable_triggers()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Re-enable the award_points_on_completion trigger
  ALTER TABLE cleaning_session_tasks ENABLE TRIGGER award_points_on_completion;
END;
$$;

-- Run the function to re-enable triggers
SELECT reenable_triggers(); 