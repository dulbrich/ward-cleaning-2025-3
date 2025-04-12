-- Add new fields to ward_tasks table
ALTER TABLE ward_tasks 
  ADD COLUMN IF NOT EXISTS priority VARCHAR(50),
  ADD COLUMN IF NOT EXISTS kid_friendly BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS points INTEGER DEFAULT 5;

-- Add comment to new columns for documentation
COMMENT ON COLUMN ward_tasks.priority IS 'Task priority (do first, do last)';
COMMENT ON COLUMN ward_tasks.kid_friendly IS 'Whether task is suitable for kids';
COMMENT ON COLUMN ward_tasks.points IS 'Points awarded for task difficulty (5-25 in increments of 5)';

-- Create index for new fields to optimize queries
CREATE INDEX IF NOT EXISTS idx_ward_tasks_priority ON ward_tasks(priority);
CREATE INDEX IF NOT EXISTS idx_ward_tasks_kid_friendly ON ward_tasks(kid_friendly);
CREATE INDEX IF NOT EXISTS idx_ward_tasks_points ON ward_tasks(points);

-- Update any tasks with "vacuum" or "vacuuming" in title or instructions 
-- to automatically set kid_friendly to true (as an example)
UPDATE ward_tasks
SET kid_friendly = true
WHERE 
  LOWER(title) LIKE '%vacuum%' OR 
  LOWER(title) LIKE '%vacuuming%' OR
  LOWER(instructions) LIKE '%vacuum%' OR 
  LOWER(instructions) LIKE '%vacuuming%'; 