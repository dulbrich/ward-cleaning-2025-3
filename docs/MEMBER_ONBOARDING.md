# Ward Cleaning App - Ward Member Onboarding Specification

## Overview
This document outlines the user signup flow for Ward Members who join through a cleaning session QR code. The process is designed to seamlessly transition anonymous participants into authenticated members while maintaining their connection to the ward and preserving any participation history.

## User Flow

### 1. Entry Point
A ward member arrives at a cleaning session and encounters a QR code displayed on the tasks page. When scanned, the QR code leads to an anonymous task view where the user is presented with two options:
- "Continue as Guest"
- "Sign Up"

This specification focuses on what happens when the user selects the "Sign Up" option.

### 2. Signup Process

#### Session Context Preservation
When a user clicks "Sign Up" from the anonymous task view:
1. The current `sessionId` is captured and included in the signup flow
2. The session's associated ward information is preserved for association during account creation
3. Any anonymous activity is marked for migration to the authenticated account

#### Standard Signup Flow
The user proceeds through the same signup process as documented in ONBOARDING.md:
1. Initial Signup Screen (email, password)
2. Personal Information Screen (name, username, avatar)
3. Phone Verification Screen
4. EULA Acceptance
5. Success & Welcome Screen

### 3. Ward Association Process

#### Ward Membership Connection
During account creation, the system will:
1. Determine the ward associated with the cleaning session
2. Automatically create an association between the new user and the ward
3. Set appropriate permissions for the user as a ward member (not an admin)

#### Anonymous User Conversion
After successful signup, the system will:
1. Generate a user hash from the provided personal information
2. Look up any existing anonymous user records with matching hash
3. Update these records to set `user_type = 'registered'`
4. Link the anonymous records to the new authenticated user account by setting `registered_user_id`

#### Session Participation Transfer
For users who participated in tasks anonymously before registering:
1. Update `session_participants` for the current session to link the temporary user with the new authenticated user
2. Transfer any task assignments from the temporary user to the authenticated user

### 4. Post-Registration Redirection

After completing the registration process, the user is redirected back to the original cleaning session, now as an authenticated user with:
1. Full access to the ward's cleaning calendar
2. Ability to receive notifications
3. Participation in the ward's leaderboard system
4. A persistent profile for future sessions

## Database Schema Changes

After analyzing the current database structure, the following changes are needed to support the ward member onboarding flow:

### SQL Commands for Supabase Administrator

Execute these SQL commands on the Supabase database to create the necessary tables and functions:

```sql
-- 1. Create ward_branch_members table for explicit ward membership
CREATE TABLE IF NOT EXISTS public.ward_branch_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ward_branch_id UUID NOT NULL REFERENCES public.ward_branches(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'member',
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE,
    last_active_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(ward_branch_id, user_id)
);

-- Enable row level security
ALTER TABLE public.ward_branch_members ENABLE ROW LEVEL SECURITY;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_ward_branch_members_user_id ON public.ward_branch_members(user_id);
CREATE INDEX IF NOT EXISTS idx_ward_branch_members_ward_branch_id ON public.ward_branch_members(ward_branch_id);
CREATE INDEX IF NOT EXISTS idx_ward_branch_members_role ON public.ward_branch_members(role);

-- 2. Add update_timestamp trigger to ward_branch_members
CREATE TRIGGER set_timestamp
BEFORE UPDATE ON public.ward_branch_members
FOR EACH ROW
EXECUTE FUNCTION public.update_timestamp();

-- 3. Create a function to associate users with wards
CREATE OR REPLACE FUNCTION public.associate_user_with_ward(
    p_user_id UUID,
    p_ward_branch_id UUID,
    p_role TEXT DEFAULT 'member'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_member_id UUID;
BEGIN
    -- Insert the association if it doesn't exist
    INSERT INTO public.ward_branch_members (
        user_id,
        ward_branch_id,
        role,
        joined_at,
        is_active,
        last_active_at
    )
    VALUES (
        p_user_id,
        p_ward_branch_id,
        p_role,
        NOW(),
        TRUE,
        NOW()
    )
    ON CONFLICT (ward_branch_id, user_id) 
    DO UPDATE SET
        is_active = TRUE,
        last_active_at = NOW(),
        updated_at = NOW()
    RETURNING id INTO v_member_id;
    
    RETURN v_member_id;
END;
$$;

-- 4. Create a function to transfer anonymous activity to registered user
CREATE OR REPLACE FUNCTION public.transfer_anonymous_activity(
    p_temp_user_id TEXT,
    p_user_id UUID,
    p_session_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Update session participant
    UPDATE public.session_participants
    SET 
        user_id = p_user_id,
        is_authenticated = TRUE,
        updated_at = NOW()
    WHERE 
        session_id = p_session_id AND
        temp_user_id = p_temp_user_id;
    
    -- Update task assignments
    UPDATE public.cleaning_session_tasks
    SET 
        assigned_to = p_user_id,
        assigned_to_temp_user = NULL
    WHERE 
        session_id = p_session_id AND
        assigned_to_temp_user = p_temp_user_id;
    
    -- Update task viewers
    UPDATE public.task_viewers tv
    SET 
        participant_id = (
            SELECT id FROM public.session_participants 
            WHERE session_id = p_session_id AND user_id = p_user_id
            LIMIT 1
        )
    FROM public.session_participants sp
    WHERE 
        sp.session_id = p_session_id AND
        sp.temp_user_id = p_temp_user_id AND
        tv.participant_id = sp.id;
    
    RETURN TRUE;
END;
$$;

-- 5. Create Row Level Security policies for ward_branch_members
CREATE POLICY "Users can view their own ward memberships"
ON public.ward_branch_members FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Ward admins can view all ward members"
ON public.ward_branch_members FOR SELECT
TO authenticated
USING (
    ward_branch_id IN (
        SELECT ward_branch_id 
        FROM public.ward_branch_members 
        WHERE user_id = auth.uid() AND role = 'admin'
    )
);

CREATE POLICY "Ward admins can create ward members"
ON public.ward_branch_members FOR INSERT
TO authenticated
WITH CHECK (
    ward_branch_id IN (
        SELECT ward_branch_id 
        FROM public.ward_branch_members 
        WHERE user_id = auth.uid() AND role = 'admin'
    )
);

CREATE POLICY "Ward admins can update ward members"
ON public.ward_branch_members FOR UPDATE
TO authenticated
USING (
    ward_branch_id IN (
        SELECT ward_branch_id 
        FROM public.ward_branch_members 
        WHERE user_id = auth.uid() AND role = 'admin'
    )
);

CREATE POLICY "Service role can manage all ward members"
ON public.ward_branch_members
TO service_role
USING (true)
WITH CHECK (true);
```

### Data Migration

Execute this SQL to handle the initial population of the ward_branch_members table from existing data:

```sql
-- Migrate existing relationships to the new table structure
INSERT INTO public.ward_branch_members (
    ward_branch_id,
    user_id,
    role,
    joined_at,
    is_active,
    last_active_at
)
SELECT 
    wb.id AS ward_branch_id,
    up.user_id,
    CASE WHEN wb.user_id = up.user_id THEN 'admin' ELSE 'member' END AS role,
    COALESCE(up.created_at, NOW()) AS joined_at,
    TRUE AS is_active,
    NOW() AS last_active_at
FROM 
    public.ward_branches wb
JOIN 
    public.user_profiles up ON TRUE
WHERE 
    -- Users who have participated in a cleaning session for this ward
    EXISTS (
        SELECT 1 
        FROM public.cleaning_sessions cs
        JOIN public.session_participants sp ON cs.id = sp.session_id
        WHERE cs.ward_branch_id = wb.id AND sp.user_id = up.user_id
    )
    -- Admins who created the ward
    OR wb.user_id = up.user_id
ON CONFLICT (ward_branch_id, user_id) DO NOTHING;
```

## Phased Implementation Approach

The implementation of the Ward Member onboarding flow can be broken down into these phases for incremental development and testing:

### Phase 1: Database Setup (1-2 days)
1. **Database Schema Changes:**
   - Create the `ward_branch_members` table
   - Set up indexes and RLS policies
   - Create helper functions for ward association and activity transfer
   - Test database functions with sample data

2. **Schema Validation:**
   - Verify RLS policies work correctly
   - Test queries for ward membership lookups
   - Ensure proper cascading deletions

### Phase 2: Anonymous-to-Registered User Conversion (2-3 days)
1. **Auth Flow Enhancement:**
   - Modify the signup process to handle sessionId parameter
   - Implement user hash generation and lookup
   - Add functionality to update anonymous user records
   - Test the conversion process end-to-end

2. **Session Context Preservation:**
   - Modify the AnonymousOnboardingModal component
   - Update route handlers to preserve session context
   - Implement temp user ID retrieval from localStorage
   - Test the flow for context preservation

### Phase 3: Ward Association and Activity Transfer (2-3 days)
1. **Ward Membership Creation:**
   - Implement ward lookup from session ID
   - Create ward membership association during signup
   - Test membership creation with different scenarios

2. **Activity Transfer:**
   - Implement anonymous activity migration to registered users
   - Transfer task assignments and views
   - Update session participant records
   - Test the activity transfer process

### Phase 4: UI and Experience Enhancement (1-2 days)
1. **Sign-Up Form Updates:**
   - Add hidden fields for session context
   - Update routing logic for proper redirection
   - Add visual feedback during signup process

2. **Post-Registration UI:**
   - Update success screen for session-originating signups
   - Add ward membership information to success screen
   - Implement return navigation to the cleaning session

### Phase 5: Testing and Refinement (1-2 days)
1. **Integration Testing:**
   - Complete QR code to registration to return navigation flow
   - Test edge cases (multiple sessions, expired sessions)
   - Performance testing with multiple concurrent users

2. **User Experience Optimization:**
   - Refine error messages and handling
   - Add helpful guides and tooltips
   - Optimize mobile experience for the entire flow

## Ward Transfer Workflow

### Overview
When members move to a different ward, they need a simple process to update their ward association while maintaining their account history.

### User Flow for Ward Transfer

#### 1. Access Point
Members can initiate a ward transfer from:
- Profile settings page with a "Change Ward" option
- Accepting an invitation to join a new ward (via email or QR code)
- Scanning a cleaning session QR code from a new ward and selecting "Join New Ward"

#### 2. Ward Transfer Process

##### Direct Profile Update
1. User navigates to profile settings
2. Selects "Change Ward" option
3. Presented with options:
   - Search for a ward by name/unit number
   - Enter a ward invitation code
   - Scan a ward QR code
4. After selecting a new ward, user confirms the transfer
5. System updates the user's primary ward association

##### From Cleaning Session QR Code
1. User scans a QR code from a new ward's cleaning session
2. System detects user is already registered but in a different ward
3. Shows a "Join New Ward" option alongside "View as Guest"
4. User selects "Join New Ward" and confirms
5. System adds the new ward association and redirects to the cleaning session

#### 3. Database Updates During Transfer

When a user transfers to a new ward, the system will:
1. Create a new record in `ward_branch_members` for the new ward association
2. Set the previous ward association to `is_active = FALSE` (but preserve the record)
3. Update user's profile with the new primary ward if applicable
4. Preserve all activity history from the previous ward

### Technical Implementation for Ward Transfer

Add the following SQL functions to support ward transfers:

```sql
-- Function to handle ward transfers
CREATE OR REPLACE FUNCTION public.transfer_user_to_ward(
    p_user_id UUID,
    p_new_ward_branch_id UUID,
    p_set_as_primary BOOLEAN DEFAULT TRUE
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_old_primary_ward_id UUID;
BEGIN
    -- Check if user already belongs to this ward
    IF EXISTS (
        SELECT 1 FROM public.ward_branch_members
        WHERE user_id = p_user_id AND ward_branch_id = p_new_ward_branch_id
    ) THEN
        -- Just update the existing membership
        UPDATE public.ward_branch_members
        SET 
            is_active = TRUE,
            last_active_at = NOW(),
            updated_at = NOW()
        WHERE 
            user_id = p_user_id AND 
            ward_branch_id = p_new_ward_branch_id;
    ELSE
        -- Create a new ward membership
        INSERT INTO public.ward_branch_members (
            user_id,
            ward_branch_id,
            role,
            joined_at,
            is_active,
            last_active_at
        )
        VALUES (
            p_user_id,
            p_new_ward_branch_id,
            'member',
            NOW(),
            TRUE,
            NOW()
        );
    END IF;
    
    -- If setting as primary, update other ward memberships
    IF p_set_as_primary THEN
        -- Get current primary ward if exists
        SELECT ward_branch_id INTO v_old_primary_ward_id
        FROM public.ward_branch_members
        WHERE 
            user_id = p_user_id AND 
            is_active = TRUE AND
            ward_branch_id != p_new_ward_branch_id
        ORDER BY joined_at ASC
        LIMIT 1;
        
        -- Set the old primary to inactive
        IF v_old_primary_ward_id IS NOT NULL THEN
            UPDATE public.ward_branch_members
            SET is_active = FALSE
            WHERE 
                user_id = p_user_id AND 
                ward_branch_id = v_old_primary_ward_id;
        END IF;
    END IF;
    
    RETURN TRUE;
END;
$$;
```

### Ward Transfer Component

Create a new React component to handle ward transfers:

```tsx
// app/app/profile/components/WardTransferModal.tsx
import { useState } from 'react';
import { Dialog, Button, Input } from '@/components/ui';
import { searchWards, transferToWard } from '../actions';

export const WardTransferModal = ({ 
  isOpen, 
  onClose,
  currentWardId
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedWard, setSelectedWard] = useState(null);
  const [isTransferring, setIsTransferring] = useState(false);
  
  const handleSearch = async () => {
    const results = await searchWards(searchTerm);
    setSearchResults(results);
  };
  
  const handleTransfer = async () => {
    if (!selectedWard) return;
    
    setIsTransferring(true);
    try {
      await transferToWard(selectedWard.id);
      onClose();
      // Show success message or redirect
    } catch (error) {
      console.error("Error transferring ward:", error);
      // Show error message
    } finally {
      setIsTransferring(false);
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <Dialog.Content>
        <Dialog.Header>
          <Dialog.Title>Change Ward</Dialog.Title>
          <Dialog.Description>
            Search for your new ward to transfer your membership
          </Dialog.Description>
        </Dialog.Header>
        
        <div className="space-y-4 py-4">
          <div className="flex space-x-2">
            <Input 
              placeholder="Search by ward name or unit number" 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
            <Button onClick={handleSearch}>Search</Button>
          </div>
          
          {searchResults.length > 0 && (
            <div className="max-h-60 overflow-y-auto">
              {searchResults.map(ward => (
                <div 
                  key={ward.id}
                  className={`p-3 border rounded-md mb-2 cursor-pointer ${
                    selectedWard?.id === ward.id ? 'border-primary bg-primary/10' : ''
                  }`}
                  onClick={() => setSelectedWard(ward)}
                >
                  <div className="font-medium">{ward.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {ward.unit_number} • {ward.stake_district_name}
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {searchResults.length === 0 && searchTerm && (
            <div className="text-center py-6 text-muted-foreground">
              No wards found matching "{searchTerm}"
            </div>
          )}
        </div>
        
        <Dialog.Footer>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button 
            disabled={!selectedWard || isTransferring}
            onClick={handleTransfer}
          >
            {isTransferring ? 'Transferring...' : 'Transfer to New Ward'}
          </Button>
        </Dialog.Footer>
      </Dialog.Content>
    </Dialog>
  );
};
```

### Ward Transfer Detection in Anonymous Tasks Page

Update the anonymous tasks page to detect and handle returning users from other wards:

```typescript
// Add this logic to app/public/tasks/[sessionId]/page.tsx

// Check if user is already registered but in a different ward
const checkWardMembership = async (user, sessionId) => {
  const { data: sessionData } = await supabase
    .from("cleaning_sessions")
    .select("ward_branch_id")
    .eq("id", sessionId)
    .single();
    
  if (!sessionData) return { isMember: false };
  
  const { data: membership } = await supabase
    .from("ward_branch_members")
    .select("*")
    .eq("user_id", user.id)
    .eq("ward_branch_id", sessionData.ward_branch_id)
    .maybeSingle();
    
  return { 
    isMember: !!membership, 
    wardBranchId: sessionData.ward_branch_id 
  };
};

// In the main component where authentication is checked
useEffect(() => {
  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      // User is authenticated, now check ward membership
      const { isMember, wardBranchId } = await checkWardMembership(user, sessionId);
      
      if (isMember) {
        // User is already a member of this ward, redirect to authenticated view
        router.push(`/app/tasks?sessionId=${sessionId}`);
      } else {
        // User is authenticated but not a member of this ward
        // Show ward transfer option
        setShowWardTransferOption(true);
        setNewWardBranchId(wardBranchId);
      }
    } else {
      // Check for existing temp user
      const tempUserId = localStorage.getItem(`tempUserId_${sessionId}`);
      if (tempUserId) {
        setIsReturningUser(true);
      } else {
        // Show onboarding for new users
        setShowOnboarding(true);
      }
    }
  };
  
  checkAuth();
}, [supabase, router, sessionId]);
```

## Technical Implementation Details

### Enhanced User Authentication Flow
The existing authentication flow will be enhanced to handle signups originating from cleaning sessions:

```typescript
export async function signUp(formData: FormData) {
  // ... existing code ...
  
  // New: Extract session context if coming from cleaning session
  const sessionId = formData.get("sessionId") as string;
  let wardBranchId = null;
  
  if (sessionId) {
    // Fetch ward information from the session
    const { data: sessionData } = await supabase
      .from("cleaning_sessions")
      .select("ward_branch_id")
      .eq("id", sessionId)
      .single();
      
    if (sessionData) {
      wardBranchId = sessionData.ward_branch_id;
    }
  }
  
  // ... existing user creation code ...
  
  // If coming from a session, create ward association
  if (wardBranchId && signUpData.user) {
    try {
      // Create ward member association
      await supabase
        .from('ward_branch_members')
        .insert({
          ward_branch_id: wardBranchId,
          user_id: signUpData.user.id,
          role: 'member',
          joined_at: new Date().toISOString()
        });
        
      // Update session_participants table if applicable
      const tempUserId = formData.get("tempUserId") as string;
      if (tempUserId && sessionId) {
        await supabase
          .from('session_participants')
          .update({
            user_id: signUpData.user.id,
            is_authenticated: true
          })
          .match({
            session_id: sessionId,
            temp_user_id: tempUserId
          });
          
        // Update task assignments
        await supabase
          .from('cleaning_session_tasks')
          .update({
            assigned_to: signUpData.user.id,
            assigned_to_temp_user: null
          })
          .match({
            session_id: sessionId,
            assigned_to_temp_user: tempUserId
          });
      }
      
    } catch (error) {
      console.error("Error creating ward association:", error);
      // Don't fail registration if association fails
    }
  }
  
  // ... existing hash generation and user type update ...
  
  return { success: true };
}
```

### Component Modifications

#### AnonymousOnboardingModal Updates
The modal component will be updated to pass the session context to the signup process:

```typescript
const handleSignUp = () => {
  // Modify to include session ID in the URL parameters
  router.push(`/login?returnUrl=${encodeURIComponent(`/tasks?sessionId=${sessionId}`)}&sessionId=${sessionId}`);
};
```

#### SignUp Component Updates
The signup form will be enhanced to include hidden fields for cleaning session context:

```tsx
<input type="hidden" name="sessionId" value={searchParams.get("sessionId") || ""} />
<input type="hidden" name="tempUserId" value={localStorage.getItem(`tempUserId_${searchParams.get("sessionId")}`) || ""} />
```

### Database Interactions

#### Tables Affected
1. `anonymous_users` - Update `user_type` and link to authenticated user
2. `session_participants` - Link temporary user to authenticated user
3. `cleaning_session_tasks` - Transfer task assignments
4. `ward_branch_members` - Create new association between user and ward

#### Database Operations
1. **User Creation**: Standard Supabase auth registration
2. **Ward Association**: Insert record into `ward_branch_members`
3. **Participant Conversion**: Update `session_participants` records
4. **Task Assignment Transfer**: Update `cleaning_session_tasks` records
5. **Anonymous Record Update**: Update `anonymous_users` records with registration information

### Handling Session Return URL
After successful registration, the user will be redirected back to the original session page but as an authenticated user:

1. Preserve `/tasks?sessionId={id}` as the return URL during signup
2. After registration and email verification, redirect user to this URL
3. The tasks page will detect the authenticated session and show the full member experience

## Security Considerations

1. **Session ID Validation**: Verify that the sessionId exists before creating ward associations
2. **Ward Access Control**: Ensure the user only gets member-level permissions, not admin
3. **User Hash Privacy**: Continue to use hashing for linking anonymous activities without storing PII
4. **Rate Limiting**: Apply rate limiting to prevent abuse of the signup process
5. **CSRF Protection**: Ensure all form submissions include proper CSRF tokens

## Mobile Considerations

1. **QR Code Optimization**: Ensure QR codes are high-resolution and easily scannable on various devices
2. **Form Responsiveness**: All signup forms must be mobile-optimized
3. **Session Persistence**: Handle cases where the signup process may span multiple sessions on mobile

## Development Timeline

1. **Component Updates**: 1 day
   - Update AnonymousOnboardingModal component
   - Modify SignUp component to handle session context
   
2. **Authentication Flow Enhancements**: 2 days
   - Update signUp action to handle ward association
   - Implement anonymous user conversion logic
   
3. **Database Operations**: 1 day
   - Create and test database functions for user linking
   - Ensure proper indexing for performance
   
4. **Testing**: 2 days
   - Test entire flow from QR code to completed registration
   - Verify ward association and task transfer
   
5. **Refinement**: 1 day
   - Optimize performance
   - Address edge cases

Total Estimated Development Time: 7 working days 