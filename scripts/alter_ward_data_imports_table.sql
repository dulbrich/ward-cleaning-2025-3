-- Add unit_number column to ward_data_imports table
ALTER TABLE ward_data_imports
ADD COLUMN unit_number VARCHAR(10) DEFAULT '';

-- Create an index for faster lookups by unit_number
CREATE INDEX IF NOT EXISTS idx_ward_data_imports_unit_number 
ON ward_data_imports(unit_number); 