-- Migration for ward_data_imports table to store import history

-- Create ward_data_imports table to store import history
CREATE TABLE IF NOT EXISTS ward_data_imports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  imported_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  record_count INTEGER NOT NULL,
  import_status TEXT NOT NULL
);

-- Enable RLS on the table
ALTER TABLE ward_data_imports ENABLE ROW LEVEL SECURITY;

-- Allow users to view only their own imports
CREATE POLICY "Users can view their own imports" 
  ON ward_data_imports 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Allow users to insert their own imports
CREATE POLICY "Users can insert their own imports" 
  ON ward_data_imports 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Create index on user_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_ward_data_imports_user_id ON ward_data_imports(user_id);

-- Create index on imported_at for faster ordering
CREATE INDEX IF NOT EXISTS idx_ward_data_imports_imported_at ON ward_data_imports(imported_at);

-- Comments for documentation
COMMENT ON TABLE ward_data_imports IS 'Records history of ward contact data imports';
COMMENT ON COLUMN ward_data_imports.user_id IS 'Reference to the user who performed the import';
COMMENT ON COLUMN ward_data_imports.imported_at IS 'Timestamp when the import occurred';
COMMENT ON COLUMN ward_data_imports.record_count IS 'Number of records in the imported file';
COMMENT ON COLUMN ward_data_imports.import_status IS 'Status of the import (success, error, etc.)'; 