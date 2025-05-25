-- Ward Member Groups Table Setup
-- This table stores custom group assignments for ward members
-- Run this SQL in your Supabase SQL Editor to enable the Schedule Edit feature

-- Create the ward_member_groups table
CREATE TABLE IF NOT EXISTS ward_member_groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ward_branch_id UUID NOT NULL REFERENCES ward_branches(id) ON DELETE CASCADE,
    user_hash VARCHAR NOT NULL,
    assigned_group VARCHAR(1) NOT NULL CHECK (assigned_group IN ('A', 'B', 'C', 'D')),
    assignment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    assigned_by UUID REFERENCES auth.users(id),
    household_id VARCHAR, -- For grouping household members
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(ward_branch_id, user_hash)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_ward_member_groups_lookup ON ward_member_groups(ward_branch_id, assigned_group);
CREATE INDEX IF NOT EXISTS idx_ward_member_groups_household ON ward_member_groups(household_id);
CREATE INDEX IF NOT EXISTS idx_ward_member_groups_user_hash ON ward_member_groups(user_hash);

-- Enable Row Level Security
ALTER TABLE ward_member_groups ENABLE ROW LEVEL SECURITY;

-- Create policy for ward administrators
DROP POLICY IF EXISTS "Ward admins can manage group assignments" ON ward_member_groups;
CREATE POLICY "Ward admins can manage group assignments" ON ward_member_groups
    FOR ALL USING (
        ward_branch_id IN (
            SELECT wb.id FROM ward_branches wb
            JOIN ward_branch_members wbm ON wb.id = wbm.ward_branch_id
            WHERE wbm.user_id = auth.uid() AND wbm.role IN ('admin', 'leader')
        )
    );

-- Create or replace the trigger function for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create the trigger for automatic updated_at updates
DROP TRIGGER IF EXISTS update_ward_member_groups_updated_at ON ward_member_groups;
CREATE TRIGGER update_ward_member_groups_updated_at 
    BEFORE UPDATE ON ward_member_groups 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Grant necessary permissions (if needed)
-- GRANT ALL ON ward_member_groups TO authenticated;
-- GRANT ALL ON ward_member_groups TO service_role; 