-- Enable Row Level Security on the ward_branches table
ALTER TABLE ward_branches ENABLE ROW LEVEL SECURITY;

-- Verify if policies exist
DO $$
DECLARE
   policy_count integer;
BEGIN
   SELECT COUNT(*) INTO policy_count FROM pg_policies WHERE tablename = 'ward_branches';
   
   -- Output the result for verification
   RAISE NOTICE 'Number of policies found for ward_branches: %', policy_count;
   
   -- If no policies exist, create them
   IF policy_count = 0 THEN
      -- Create policies
      EXECUTE 'CREATE POLICY "Users can view their own ward/branch entries" ON ward_branches FOR SELECT USING (auth.uid() = user_id)';
      EXECUTE 'CREATE POLICY "Users can insert their own ward/branch entries" ON ward_branches FOR INSERT WITH CHECK (auth.uid() = user_id)';
      EXECUTE 'CREATE POLICY "Users can update their own ward/branch entries" ON ward_branches FOR UPDATE USING (auth.uid() = user_id)';
      EXECUTE 'CREATE POLICY "Users can delete their own ward/branch entries" ON ward_branches FOR DELETE USING (auth.uid() = user_id)';
      
      RAISE NOTICE 'Created new policies for ward_branches table';
   ELSE
      RAISE NOTICE 'Policies already exist, no new policies created';
   END IF;
END $$; 