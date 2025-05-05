-- First, drop any existing policies on the session_participants table
DROP POLICY IF EXISTS "Service role can manage all participant records" ON "public"."session_participants";
DROP POLICY IF EXISTS "Users can add themselves as participants" ON "public"."session_participants";
DROP POLICY IF EXISTS "Users can delete their own participant records" ON "public"."session_participants";
DROP POLICY IF EXISTS "Users can update their own participant records" ON "public"."session_participants";
DROP POLICY IF EXISTS "Users can view participants for accessible sessions" ON "public"."session_participants";

-- Enable Row Level Security on the table if not already enabled
ALTER TABLE "public"."session_participants" ENABLE ROW LEVEL SECURITY;

-- Policy 1: Service role can manage all participant records
CREATE POLICY "Service role can manage all participant records"
ON "public"."session_participants"
AS PERMISSIVE
FOR ALL
TO public
USING (true)
WITH CHECK (true);

-- Policy 2: Users can add themselves as participants
CREATE POLICY "Users can add themselves as participants"
ON "public"."session_participants"
AS PERMISSIVE
FOR INSERT
TO public
WITH CHECK (true);

-- Policy 3: Users can delete their own participant records
CREATE POLICY "Users can delete their own participant records"
ON "public"."session_participants"
AS PERMISSIVE
FOR DELETE
TO public
USING (true);

-- Policy 4: Users can update their own participant records
CREATE POLICY "Users can update their own participant records"
ON "public"."session_participants"
AS PERMISSIVE
FOR UPDATE
TO public
USING (true)
WITH CHECK (true);

-- Policy 5: Users can view participants for accessible sessions
CREATE POLICY "Users can view participants for accessible sessions"
ON "public"."session_participants"
AS PERMISSIVE
FOR SELECT
TO public
USING (true); 