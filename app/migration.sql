-- Add unique constraint to task_viewers to prevent duplicates
-- Note: This will fail if there are existing duplicates, so run the cleanup API endpoint first
ALTER TABLE task_viewers ADD CONSTRAINT task_viewers_participant_task_unique UNIQUE (session_task_id, participant_id);

-- Create a function to handle task viewer inserts and updates
CREATE OR REPLACE FUNCTION handle_task_viewer_upsert()
RETURNS TRIGGER AS $$
BEGIN
  -- Delete any existing records for the same participant and task (except this one if it's an update)
  DELETE FROM task_viewers 
  WHERE 
    session_task_id = NEW.session_task_id 
    AND participant_id = NEW.participant_id
    AND id != NEW.id;
    
  -- Set the started_viewing_at timestamp if not provided
  IF NEW.started_viewing_at IS NULL THEN
    NEW.started_viewing_at = NOW();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to run before insert or update
DROP TRIGGER IF EXISTS task_viewers_upsert_trigger ON task_viewers;
CREATE TRIGGER task_viewers_upsert_trigger
BEFORE INSERT OR UPDATE ON task_viewers
FOR EACH ROW
EXECUTE FUNCTION handle_task_viewer_upsert(); 