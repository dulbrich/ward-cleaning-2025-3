-- Script to update existing user_hash values to use the new format
-- This script should be run after modifying the generateUserHash function

-- NOTE: This script requires that all user_profiles have first_name, last_name and phone_number populated

-- Function to generate the new hash value from user data
CREATE OR REPLACE FUNCTION generate_new_hash(
  p_first_name TEXT,
  p_last_name TEXT,
  p_phone_number TEXT
) RETURNS TEXT AS $$
DECLARE
  first_part TEXT;
  last_part TEXT;
  phone_part TEXT;
  combined_identifier TEXT;
BEGIN
  -- Extract first 3 letters of first name (uppercase)
  first_part := UPPER(REGEXP_REPLACE(p_first_name, '[^a-zA-Z]', '', 'g'));
  first_part := SUBSTRING(first_part, 1, 3);
  
  -- Extract first 3 letters of last name (uppercase)
  last_part := UPPER(REGEXP_REPLACE(p_last_name, '[^a-zA-Z]', '', 'g'));
  last_part := SUBSTRING(last_part, 1, 3);
  
  -- Extract last 4 digits of phone number
  phone_part := REGEXP_REPLACE(p_phone_number, '[^0-9]', '', 'g');
  phone_part := RIGHT(phone_part, 4);
  
  -- Combine the parts
  combined_identifier := first_part || last_part || phone_part;
  
  -- Return SHA-256 hash (would need to be handled in application code)
  -- For this migration, we'll just return the combined identifier for logging
  RETURN combined_identifier;
END;
$$ LANGUAGE plpgsql;

-- Create a temporary table to store old and new hash mappings
CREATE TEMPORARY TABLE hash_mappings (
  user_id UUID PRIMARY KEY,
  old_hash TEXT,
  new_hash TEXT,
  combined_string TEXT
);

-- Populate the temporary table with old and new hash values
INSERT INTO hash_mappings (user_id, old_hash, combined_string)
SELECT 
  user_id,
  user_hash,
  generate_new_hash(first_name, last_name, phone_number)
FROM 
  user_profiles
WHERE 
  first_name IS NOT NULL AND 
  last_name IS NOT NULL AND 
  phone_number IS NOT NULL;

-- Display the mapping for verification (comment out in production)
SELECT * FROM hash_mappings;

-- NOTE: The following update would need to be run in application code
-- since database cannot compute SHA-256 hashes directly
-- This script serves as documentation for the migration process
-- The actual updates will be done gradually as users interact with the system

-- Clean up
DROP FUNCTION generate_new_hash;
DROP TABLE hash_mappings;

-- The actual migration will happen as users interact with the system
-- and their profiles are updated with the new hash values 