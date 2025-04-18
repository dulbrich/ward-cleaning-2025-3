-- Script to fix the ambiguous ward_id reference in the award_points_on_task_completion function

-- First create a fixed version of the function
CREATE OR REPLACE FUNCTION award_points_on_task_completion()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  task_points INTEGER;
  branch_id UUID;
BEGIN
  -- Only proceed if task is being marked as done and has an authenticated user assigned
  IF NEW.status = 'done' AND OLD.status != 'done' AND NEW.assigned_to IS NOT NULL THEN
    -- Get the points value for this task with explicitly qualified column names
    SELECT 
      wt.points, 
      cs.ward_branch_id 
    INTO 
      task_points, 
      branch_id
    FROM 
      ward_tasks wt
      JOIN cleaning_sessions cs ON cs.id = NEW.session_id
    WHERE 
      wt.id = NEW.task_id;
    
    -- Default to 5 points if not specified
    IF task_points IS NULL THEN
      task_points := 5;
    END IF;
    
    -- Record the points in user_points table
    INSERT INTO user_points (
      user_id,
      ward_branch_id,
      points,
      source,
      source_id,
      awarded_at
    ) VALUES (
      NEW.assigned_to,
      branch_id,
      task_points,
      'task_completion',
      NEW.id,
      NOW()
    );
    
    -- Store the points awarded in the task record
    NEW.points_awarded := task_points;
  END IF;
  
  RETURN NEW;
END;
$$; 