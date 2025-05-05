-- Add policy to allow anonymous users to join sessions
CREATE POLICY "Anonymous users can join sessions" 
ON "public"."session_participants"
AS PERMISSIVE FOR INSERT
TO public
USING (true)
WITH CHECK (true);

-- Add policy to allow all users to see all participants
CREATE POLICY "All users can view all participants" 
ON "public"."session_participants"
AS PERMISSIVE FOR SELECT
TO public
USING (true); 