-- Migration script for profile settings

-- Create phone verifications table if it doesn't exist
CREATE TABLE IF NOT EXISTS phone_verifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  phone_number TEXT NOT NULL,
  code TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS phone_verifications_user_id_idx ON phone_verifications(user_id);
CREATE INDEX IF NOT EXISTS phone_verifications_phone_number_idx ON phone_verifications(phone_number);

-- Make sure user_profiles table has the needed columns
DO $$ 
BEGIN
  -- Add is_phone_verified column if it doesn't exist
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'user_profiles' AND column_name = 'is_phone_verified'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN is_phone_verified BOOLEAN DEFAULT FALSE;
  END IF;
  
  -- Add avatar_url column if it doesn't exist
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'user_profiles' AND column_name = 'avatar_url'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN avatar_url TEXT DEFAULT '/images/avatars/default.png';
  END IF;
  
  -- Add bio column if it doesn't exist
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'user_profiles' AND column_name = 'bio'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN bio TEXT;
  END IF;
  
  -- Add updated_at column if it doesn't exist
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'user_profiles' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
  END IF;
END $$; 