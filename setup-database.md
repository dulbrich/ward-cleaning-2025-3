# Database Setup Instructions

## Step 1: Create the Required Table

The 500 error you're seeing is because the `ward_member_groups` table doesn't exist in your Supabase database yet.

### Go to Supabase SQL Editor:
1. Open your Supabase project dashboard
2. Navigate to the "SQL Editor" tab
3. Click "New Query"
4. Copy and paste the following SQL:

```sql
-- Ward Member Groups Table Setup
-- This table stores custom group assignments for ward members

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
```

### Step 2: Run the SQL
1. Click the "Run" button in the SQL Editor
2. You should see a success message

### Step 3: Verify Table Creation
Run this query to verify the table was created:
```sql
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'ward_member_groups'
ORDER BY ordinal_position;
```

### Step 4: Restart Your Development Server
After creating the table, restart your development server:
```bash
npm run dev
```

## Expected Results
- The table should be created successfully
- The 500 error should be resolved
- Group assignment drag-and-drop should work

## Troubleshooting

### If you get a "relation does not exist" error:
Make sure the `ward_branches` and `ward_branch_members` tables exist first.

### If you get permission errors:
Make sure you're running this as the database owner/admin in Supabase.

### To check if the table exists:
```sql
SELECT EXISTS (
   SELECT FROM information_schema.tables 
   WHERE table_name = 'ward_member_groups'
);
```

This should return `true` if the table exists. 