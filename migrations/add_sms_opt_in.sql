-- Add sms_opt_in boolean preference to user_profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'user_profiles'
      AND column_name = 'sms_opt_in'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN sms_opt_in BOOLEAN DEFAULT FALSE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'user_profiles'
      AND column_name = 'sms_opt_in_at'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN sms_opt_in_at TIMESTAMP WITH TIME ZONE;
  END IF;
END $$;
