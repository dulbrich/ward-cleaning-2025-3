-- Create interest_signups table to store potential user information
CREATE TABLE IF NOT EXISTS interest_signups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone_number TEXT,
  ward_name TEXT,
  role TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on the table
ALTER TABLE interest_signups ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert records for signing up
CREATE POLICY "Anyone can register interest" 
  ON interest_signups 
  FOR INSERT 
  WITH CHECK (true);

-- Only authenticated users can view the records
CREATE POLICY "Only authenticated users can view interest signups" 
  ON interest_signups 
  FOR SELECT 
  USING (auth.role() = 'authenticated');

-- Create update trigger for updated_at
CREATE TRIGGER update_interest_signups_modtime
BEFORE UPDATE ON interest_signups
FOR EACH ROW
EXECUTE FUNCTION update_modified_column(); 