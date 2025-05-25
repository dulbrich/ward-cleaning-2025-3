# Fix Audit Log Error

The error you're seeing is because an audit trigger is trying to write to an `audit_log` table that doesn't exist.

## Run this SQL in your Supabase SQL Editor to fix the error:

```sql
-- Remove any existing audit triggers that might be causing issues
DROP TRIGGER IF EXISTS ward_member_groups_audit_trigger ON ward_member_groups;

-- Remove the audit function if it exists
DROP FUNCTION IF EXISTS log_group_assignment_change();

-- Verify the triggers are gone
SELECT 
    trigger_name, 
    table_name, 
    action_statement 
FROM information_schema.triggers 
WHERE table_name = 'ward_member_groups';

-- This should return no rows if the trigger was successfully removed
```

## After running this SQL:

1. **Restart your development server**: `npm run dev`
2. **Test the drag-and-drop functionality** - it should work now without the 500 error

## What this does:

- Removes the problematic audit trigger that was trying to write to the non-existent `audit_log` table
- Removes the associated audit function
- Verifies that no triggers remain on the `ward_member_groups` table

The core functionality will work perfectly without audit logging - that was an optional feature that was causing the error. 