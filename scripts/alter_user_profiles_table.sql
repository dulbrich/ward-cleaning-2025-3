-- Add user_hash column to user_profiles table
ALTER TABLE user_profiles
ADD COLUMN user_hash VARCHAR(64) DEFAULT NULL;

-- Create an index for faster lookups by user_hash
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_hash 
ON user_profiles(user_hash);

-- Create function to find registered user by hash
CREATE OR REPLACE FUNCTION find_registered_user_by_hash(hash_param VARCHAR) 
RETURNS UUID AS $$
DECLARE
    found_user_id UUID;
BEGIN
    SELECT user_id INTO found_user_id 
    FROM user_profiles 
    WHERE user_hash = hash_param
    LIMIT 1;
    
    RETURN found_user_id;
END;
$$ LANGUAGE plpgsql; 