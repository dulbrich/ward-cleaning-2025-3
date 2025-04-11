-- Add new fields to ward_tasks table
ALTER TABLE ward_tasks 
  ADD COLUMN IF NOT EXISTS priority VARCHAR(50),
  ADD COLUMN IF NOT EXISTS kid_friendly BOOLEAN DEFAULT false;

-- Add comment to new columns for documentation
COMMENT ON COLUMN ward_tasks.priority IS 'Task priority (do first, do last)';
COMMENT ON COLUMN ward_tasks.kid_friendly IS 'Whether task is suitable for kids';

-- Create index for new fields to optimize queries
CREATE INDEX IF NOT EXISTS idx_ward_tasks_priority ON ward_tasks(priority);
CREATE INDEX IF NOT EXISTS idx_ward_tasks_kid_friendly ON ward_tasks(kid_friendly);

-- Update any tasks with "vacuum" or "vacuuming" in title or instructions 
-- to automatically set kid_friendly to true (as an example)
UPDATE ward_tasks
SET kid_friendly = true
WHERE 
  LOWER(title) LIKE '%vacuum%' OR 
  LOWER(title) LIKE '%vacuuming%' OR
  LOWER(instructions) LIKE '%vacuum%' OR
  LOWER(instructions) LIKE '%vacuuming%'; 