-- Fix for infinite recursion in ward_branch_members RLS policies
-- Drop the existing problematic policies

DROP POLICY IF EXISTS "Ward admins can view all ward members" ON public.ward_branch_members;
DROP POLICY IF EXISTS "Ward admins can create ward members" ON public.ward_branch_members;
DROP POLICY IF EXISTS "Ward admins can update ward members" ON public.ward_branch_members;

-- Create new policies with fixed logic to avoid recursion

-- Create a helper function to check if user is a ward admin without using the table directly
CREATE OR REPLACE FUNCTION public.is_ward_admin(p_user_id UUID, p_ward_branch_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM public.ward_branches 
    WHERE id = p_ward_branch_id AND user_id = p_user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the policies using the helper function to prevent recursion
CREATE POLICY "Ward admins can view all ward members (fixed)"
ON public.ward_branch_members FOR SELECT
TO authenticated
USING (
  user_id = auth.uid() OR 
  public.is_ward_admin(auth.uid(), ward_branch_id)
);

CREATE POLICY "Ward admins can create ward members (fixed)"
ON public.ward_branch_members FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid() OR 
  public.is_ward_admin(auth.uid(), ward_branch_id)
);

CREATE POLICY "Ward admins can update ward members (fixed)"
ON public.ward_branch_members FOR UPDATE
TO authenticated
USING (
  user_id = auth.uid() OR 
  public.is_ward_admin(auth.uid(), ward_branch_id)
);

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION public.is_ward_admin TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_ward_admin TO anon;
GRANT EXECUTE ON FUNCTION public.is_ward_admin TO service_role; 