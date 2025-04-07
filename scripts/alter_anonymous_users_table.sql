-- Add unit_number column to anonymous_users table
ALTER TABLE anonymous_users
ADD COLUMN unit_number VARCHAR(10) DEFAULT '';

-- Create an index for faster lookups by unit_number
CREATE INDEX IF NOT EXISTS idx_anonymous_users_unit_number 
ON anonymous_users(unit_number);

-- Update any existing policies to include unit_number in checks if needed
CREATE OR REPLACE FUNCTION clear_anonymous_users_by_unit_number(unit_number_param VARCHAR) 
RETURNS VOID AS $$
BEGIN
    DELETE FROM anonymous_users 
    WHERE unit_number = unit_number_param;
END;
$$ LANGUAGE plpgsql; 