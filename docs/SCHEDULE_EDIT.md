# Schedule Edit Feature - Product Requirements & Specification Document

## Document Overview
**Document Type:** Combined Product Requirements Document (PRD) & Product Specification Document (PSD)  
**Product:** Ward Cleaning Management System  
**Feature:** Interactive Group Assignment Editor  
**Version:** 1.0  
**Date:** January 2025  
**Author:** Product Management Team  

---

## 1. Executive Summary

### 1.1 Feature Overview
The Schedule Edit feature introduces an interactive visual interface for ward administrators to dynamically adjust cleaning group assignments. This feature addresses the critical need for balanced group participation by providing a drag-and-drop interface to redistribute ward members across cleaning groups while maintaining household integrity and providing participation analytics.

### 1.2 Business Objectives
- **Primary:** Enable dynamic redistribution of ward members across cleaning groups to ensure balanced participation
- **Secondary:** Provide visual feedback on group sizes and participation statistics
- **Tertiary:** Maintain household groupings while allowing flexible group management

### 1.3 Success Metrics
- Reduction in time spent manually reassigning groups by 75%
- Increase in balanced group participation by 40%
- 90% user satisfaction with the visual interface
- Zero instances of household splitting during reassignment

---

## 2. Product Requirements

### 2.1 Functional Requirements

#### 2.1.1 Core Features
- **FR-001:** Interactive visual rectangle divided proportionally by group size
- **FR-002:** Drag-and-drop sliders to adjust group boundaries
- **FR-003:** Real-time numerical feedback during adjustments
- **FR-004:** Household integrity preservation
- **FR-005:** Database persistence of group changes
- **FR-006:** Participation statistics modal for each group
- **FR-007:** Mobile-responsive design optimized for iPhone display

#### 2.1.2 Data Management
- **FR-008:** Integration with existing ward member data from localStorage
- **FR-009:** Creation of new database table for custom group assignments
- **FR-010:** Automatic fallback to alphabetical grouping when no custom assignments exist
- **FR-011:** Audit trail for group assignment changes

#### 2.1.3 User Interface
- **FR-012:** Visual indicators for group boundaries and member counts
- **FR-013:** Color-coded sections for each group (A, B, C, D)
- **FR-014:** Responsive design for mobile and desktop
- **FR-015:** Loading states and error handling

### 2.2 Non-Functional Requirements

#### 2.2.1 Performance
- **NFR-001:** Page load time < 2 seconds
- **NFR-002:** Drag operations response time < 100ms
- **NFR-003:** Database updates complete within 1 second

#### 2.2.2 Usability
- **NFR-004:** Interface optimized for touch devices
- **NFR-005:** Visual feedback during all drag operations
- **NFR-006:** Undo/redo functionality for group changes

#### 2.2.3 Reliability
- **NFR-007:** 99.9% uptime for group assignment operations
- **NFR-008:** Data consistency maintained across all operations
- **NFR-009:** Graceful handling of network interruptions

---

## 3. Technical Specification

### 3.1 Architecture Overview

#### 3.1.1 Frontend Components
```typescript
// Component Hierarchy
SchedulePage
├── TabsContainer
│   ├── CalendarView
│   ├── ListView
│   ├── TextView
│   └── EditView (NEW)
│       ├── GroupAssignmentVisualizer
│       │   ├── GroupSection
│       │   ├── GroupDivider
│       │   └── DragHandle
│       ├── ParticipationModal
│       └── AssignmentControls
```

#### 3.1.2 Data Flow
1. **Initial Load:** Fetch ward members from localStorage and custom assignments from database
2. **Processing:** Calculate group distributions and prepare visual data
3. **Interaction:** Handle drag events and calculate new distributions
4. **Persistence:** Save changes to database with optimistic updates
5. **Feedback:** Update UI with new group assignments

### 3.2 Database Design

#### 3.2.1 New Table: ward_member_groups
```sql
CREATE TABLE ward_member_groups (
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

-- Index for performance
CREATE INDEX idx_ward_member_groups_lookup ON ward_member_groups(ward_branch_id, assigned_group);
CREATE INDEX idx_ward_member_groups_household ON ward_member_groups(household_id);
CREATE INDEX idx_ward_member_groups_user_hash ON ward_member_groups(user_hash);

-- Row Level Security
ALTER TABLE ward_member_groups ENABLE ROW LEVEL SECURITY;

-- Policy for ward administrators
CREATE POLICY "Ward admins can manage group assignments" ON ward_member_groups
    FOR ALL USING (
        ward_branch_id IN (
            SELECT wb.id FROM ward_branches wb
            JOIN ward_branch_members wbm ON wb.id = wbm.ward_branch_id
            WHERE wbm.user_id = auth.uid() AND wbm.role IN ('admin', 'leader')
        )
    );

-- Updated trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_ward_member_groups_updated_at BEFORE UPDATE
    ON ward_member_groups FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

#### 3.2.2 Participation Tracking View
```sql
CREATE VIEW member_participation_stats AS
SELECT 
    wm.ward_branch_id,
    wm.user_hash,
    COUNT(sp.id) as total_participations,
    COUNT(cs.id) as total_assigned_sessions,
    CASE 
        WHEN COUNT(cs.id) = 0 THEN 0 
        ELSE ROUND((COUNT(sp.id)::DECIMAL / COUNT(cs.id)) * 100, 1) 
    END as participation_percentage
FROM ward_member_groups wm
LEFT JOIN cleaning_schedules cs ON cs.ward_branch_id = wm.ward_branch_id 
    AND (cs.assigned_group = wm.assigned_group OR cs.assigned_group = 'All')
LEFT JOIN cleaning_sessions sess ON sess.schedule_id = cs.id
LEFT JOIN session_participants sp ON sp.session_id = sess.id 
    AND sp.temp_user_id = wm.user_hash
GROUP BY wm.ward_branch_id, wm.user_hash;
```

### 3.3 Component Specifications

#### 3.3.1 GroupAssignmentVisualizer Component
```typescript
interface GroupAssignmentVisualizerProps {
    wardMembers: WardMember[];
    onGroupChange: (memberId: string, newGroup: string) => void;
    height: number; // 600-700px
}

interface GroupDistribution {
    group: 'A' | 'B' | 'C' | 'D';
    members: WardMember[];
    percentage: number;
    color: string;
    boundaries: {
        start: number; // Pixel position
        end: number;   // Pixel position
    };
}
```

#### 3.3.2 DragHandle Component
```typescript
interface DragHandleProps {
    position: number; // Y coordinate
    onDrag: (deltaY: number) => void;
    onDragEnd: () => void;
    constraint: {
        min: number;
        max: number;
    };
    households: Household[]; // For boundary constraints
}
```

#### 3.3.3 ParticipationModal Component
```typescript
interface ParticipationModalProps {
    group: 'A' | 'B' | 'C' | 'D';
    members: WardMemberWithStats[];
    isOpen: boolean;
    onClose: () => void;
}

interface WardMemberWithStats extends WardMember {
    participationPercentage: number;
    totalAssigned: number;
    totalParticipated: number;
}
```

### 3.4 Business Logic Specifications

#### 3.4.1 Household Grouping Algorithm
```typescript
interface Household {
    id: string;
    members: WardMember[];
    lastNameGroup: 'A' | 'B' | 'C' | 'D'; // Current assignment
}

function groupMembersByHousehold(members: WardMember[]): Household[] {
    // Implementation details:
    // 1. Group by last name and address/phone if available
    // 2. Assign household ID
    // 3. Ensure all household members have same group assignment
}
```

#### 3.4.2 Boundary Constraint Logic
```typescript
function calculateValidBoundaries(
    households: Household[],
    currentBoundaries: number[]
): BoundaryConstraint[] {
    // Implementation details:
    // 1. Prevent splitting households
    // 2. Calculate min/max positions for each boundary
    // 3. Return constraints for drag operations
}
```

#### 3.4.3 Group Redistribution Algorithm
```typescript
function redistributeGroups(
    households: Household[],
    newBoundaryPosition: number,
    boundaryIndex: number
): GroupDistribution[] {
    // Implementation details:
    // 1. Move households between adjacent groups
    // 2. Maintain alphabetical ordering within groups
    // 3. Return new group distributions
}
```

### 3.5 API Specifications

#### 3.5.1 Group Assignment Endpoints
```typescript
// GET /api/ward-members/groups/:wardBranchId
interface GetGroupAssignmentsResponse {
    assignments: WardMemberGroup[];
    defaultAssignments: WardMemberGroup[]; // Alphabetical fallback
}

// POST /api/ward-members/groups/bulk-update
interface BulkUpdateGroupAssignmentsRequest {
    wardBranchId: string;
    assignments: {
        userHash: string;
        newGroup: 'A' | 'B' | 'C' | 'D';
        householdId: string;
    }[];
}

// GET /api/ward-members/participation-stats/:wardBranchId
interface ParticipationStatsResponse {
    stats: MemberParticipationStat[];
}
```

---

## 4. User Experience Design

### 4.1 Visual Design Specifications

#### 4.1.1 Layout Dimensions
- **Container Height:** 650px (optimal for iPhone display)
- **Container Width:** 100% with max-width 400px
- **Group Section:** Height proportional to member count percentage
- **Divider Height:** 40px with centered drag handle
- **Drag Handle:** 24px × 8px rounded rectangle

#### 4.1.2 Color Scheme
```css
:root {
  --group-a-color: #3B82F6; /* Blue */
  --group-b-color: #10B981; /* Green */
  --group-c-color: #F59E0B; /* Amber */
  --group-d-color: #8B5CF6; /* Purple */
  --divider-color: #6B7280; /* Gray */
  --drag-handle-color: #374151; /* Dark Gray */
}
```

#### 4.1.3 Typography
- **Group Labels:** 16px, font-weight: 600
- **Member Counts:** 24px, font-weight: 700
- **Percentage Text:** 14px, font-weight: 500

### 4.2 Interaction Design

#### 4.2.1 Drag Behavior
1. **Hover State:** Drag handle grows by 20% and changes opacity
2. **Active Drag:** Real-time preview of new group distributions
3. **Constraint Feedback:** Visual indicators when approaching household boundaries
4. **Release:** Smooth animation to final position

#### 4.2.2 Touch Optimization
- **Touch Target:** Minimum 44px × 44px for drag handles
- **Gesture Support:** Vertical swipe gestures for adjustment
- **Haptic Feedback:** Light feedback on successful drag operations

### 4.3 Responsive Design

#### 4.3.1 Mobile (320px - 768px)
- Full-width container with 16px margins
- Stacked layout for controls
- Touch-optimized drag handles

#### 4.3.2 Desktop (768px+)
- Centered container with side controls
- Hover states for all interactive elements
- Keyboard navigation support

---

## 5. Implementation Plan

### 5.1 Development Phases

#### Phase 1: Core Infrastructure (Week 1)
- [ ] Database table creation and migrations
- [ ] API endpoints for group management
- [ ] Basic component structure

#### Phase 2: Visual Interface (Week 2)
- [ ] GroupAssignmentVisualizer component
- [ ] Proportional layout calculations
- [ ] Basic drag functionality

#### Phase 3: Advanced Features (Week 3)
- [ ] Household constraint logic
- [ ] Participation statistics integration
- [ ] Mobile optimization

#### Phase 4: Polish & Testing (Week 4)
- [ ] Performance optimization
- [ ] Error handling and edge cases
- [ ] User testing and feedback integration

### 5.2 Testing Strategy

#### 5.2.1 Unit Tests
- Group redistribution algorithms
- Boundary constraint calculations
- Household grouping logic

#### 5.2.2 Integration Tests
- Database operations
- API endpoint functionality
- Component integration

#### 5.2.3 User Acceptance Tests
- Drag and drop functionality
- Mobile touch interactions
- Data persistence accuracy

---

## 6. Risk Analysis & Mitigation

### 6.1 Technical Risks

#### 6.1.1 Performance Risk
**Risk:** Slow drag operations with large member datasets  
**Mitigation:** Implement virtualization and debounced updates  
**Impact:** Medium | **Probability:** Low

#### 6.1.2 Data Consistency Risk
**Risk:** Concurrent edits causing data conflicts  
**Mitigation:** Optimistic locking and conflict resolution  
**Impact:** High | **Probability:** Low

### 6.2 User Experience Risks

#### 6.2.1 Complexity Risk
**Risk:** Interface too complex for administrators  
**Mitigation:** Extensive user testing and simplified workflows  
**Impact:** Medium | **Probability:** Medium

#### 6.2.2 Mobile Usability Risk
**Risk:** Drag operations difficult on mobile devices  
**Mitigation:** Touch-optimized controls and alternative input methods  
**Impact:** Medium | **Probability:** Medium

---

## 7. Acceptance Criteria

### 7.1 Functional Acceptance Criteria
- [ ] Visual rectangle displays proportional group sections
- [ ] Drag operations smoothly adjust group boundaries
- [ ] Households never split during redistribution
- [ ] Group changes persist to database immediately
- [ ] Participation modal displays accurate statistics
- [ ] Interface works on iPhone Safari and Chrome

### 7.2 Performance Acceptance Criteria
- [ ] Initial load completes within 2 seconds
- [ ] Drag operations respond within 100ms
- [ ] Database updates complete within 1 second
- [ ] Interface remains responsive with 200+ members

### 7.3 Quality Acceptance Criteria
- [ ] Zero data loss during group reassignments
- [ ] All error states handled gracefully
- [ ] Interface passes accessibility guidelines
- [ ] Cross-browser compatibility verified

---

## 8. Dependencies & Constraints

### 8.1 Technical Dependencies
- Supabase database for persistence
- React DnD or Framer Motion for drag interactions
- Ward member data from localStorage
- Existing cleaning schedule infrastructure

### 8.2 Business Constraints
- Must not disrupt existing schedule functionality
- Changes must be reversible
- Interface must be intuitive for non-technical users
- Performance acceptable on older mobile devices

---

## 9. Future Enhancements

### 9.1 Version 2.0 Features
- Automatic balancing suggestions based on participation history
- Bulk import/export of group assignments
- Integration with LDS Tools for member data
- Advanced analytics and reporting

### 9.2 Integration Opportunities
- SMS notification integration for group changes
- Calendar integration for assignment reminders
- Gamification features for participation tracking

---

## Required Database Schema

Based on the error logs, the `ward_member_groups` table doesn't exist in your Supabase database. You need to run this SQL in your Supabase SQL editor:

```sql
-- Create the ward_member_groups table
CREATE TABLE ward_member_groups (
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

-- Indexes for performance
CREATE INDEX idx_ward_member_groups_lookup ON ward_member_groups(ward_branch_id, assigned_group);
CREATE INDEX idx_ward_member_groups_household ON ward_member_groups(household_id);
CREATE INDEX idx_ward_member_groups_user_hash ON ward_member_groups(user_hash);

-- Row Level Security
ALTER TABLE ward_member_groups ENABLE ROW LEVEL SECURITY;

-- Policy for ward administrators
CREATE POLICY "Ward admins can manage group assignments" ON ward_member_groups
    FOR ALL USING (
        ward_branch_id IN (
            SELECT wb.id FROM ward_branches wb
            JOIN ward_branch_members wbm ON wb.id = wbm.ward_branch_id
            WHERE wbm.user_id = auth.uid() AND wbm.role IN ('admin', 'leader')
        )
    );

-- Updated trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_ward_member_groups_updated_at BEFORE UPDATE
    ON ward_member_groups FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

**To fix the current issues:**

1. **Copy the SQL above** and run it in your Supabase SQL Editor
2. **Restart your development server** after creating the table

---

## Appendix A: Database Migration Scripts

```sql
-- Create the ward_member_groups table
CREATE TABLE ward_member_groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ward_branch_id UUID NOT NULL REFERENCES ward_branches(id) ON DELETE CASCADE,
    user_hash VARCHAR NOT NULL,
    assigned_group VARCHAR(1) NOT NULL CHECK (assigned_group IN ('A', 'B', 'C', 'D')),
    assignment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    assigned_by UUID REFERENCES auth.users(id),
    household_id VARCHAR,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(ward_branch_id, user_hash)
);

-- Indexes for performance
CREATE INDEX idx_ward_member_groups_lookup ON ward_member_groups(ward_branch_id, assigned_group);
CREATE INDEX idx_ward_member_groups_household ON ward_member_groups(household_id);
CREATE INDEX idx_ward_member_groups_user_hash ON ward_member_groups(user_hash);

-- Row Level Security
ALTER TABLE ward_member_groups ENABLE ROW LEVEL SECURITY;

-- Policy for ward administrators
CREATE POLICY "Ward admins can manage group assignments" ON ward_member_groups
    FOR ALL USING (
        ward_branch_id IN (
            SELECT wb.id FROM ward_branches wb
            JOIN ward_branch_members wbm ON wb.id = wbm.ward_branch_id
            WHERE wbm.user_id = auth.uid() AND wbm.role IN ('admin', 'leader')
        )
    );

-- Updated trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_ward_member_groups_updated_at BEFORE UPDATE
    ON ward_member_groups FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

## Appendix A.1: Row Level Security (RLS) Documentation

### Overview
Row Level Security (RLS) is implemented on the `ward_member_groups` table to ensure that only authorized ward administrators can view and modify group assignments for their respective wards. This prevents data leakage between different wards and maintains strict access control.

### Security Model

#### 1. Authentication Requirements
- All operations require a valid authenticated user session via Supabase Auth
- Anonymous users cannot access any group assignment data
- User identity is verified through `auth.uid()` function

#### 2. Authorization Hierarchy
```
Ward Admins/Leaders → Full access to their ward's group assignments
Regular Members     → No access to group assignment management
Other Ward Admins   → No access to other ward's data
```

### RLS Policies

#### Policy 1: Ward Administrator Access Control
```sql
CREATE POLICY "Ward admins can manage group assignments" ON ward_member_groups
    FOR ALL USING (
        ward_branch_id IN (
            SELECT wb.id FROM ward_branches wb
            JOIN ward_branch_members wbm ON wb.id = wbm.ward_branch_id
            WHERE wbm.user_id = auth.uid() AND wbm.role IN ('admin', 'leader')
        )
    );
```

**Policy Details:**
- **Scope:** Applies to all operations (SELECT, INSERT, UPDATE, DELETE)
- **Access Control:** Only users with 'admin' or 'leader' roles in the specific ward
- **Join Logic:** Validates user membership and role through `ward_branch_members` table
- **Security Level:** Ward-level isolation

#### Policy 2: Read-Only Access for Regular Members (Optional Future Enhancement)
```sql
-- Future enhancement: Allow regular members to view their own group assignment
CREATE POLICY "Members can view their own group assignment" ON ward_member_groups
    FOR SELECT USING (
        ward_branch_id IN (
            SELECT wb.id FROM ward_branches wb
            JOIN ward_branch_members wbm ON wb.id = wbm.ward_branch_id
            WHERE wbm.user_id = auth.uid()
        )
        AND user_hash = (
            SELECT up.user_hash FROM user_profiles up
            WHERE up.user_id = auth.uid()
        )
    );
```

### Security Implementation Details

#### 1. Performance Considerations
```sql
-- Optimized indexes to support RLS policy queries
CREATE INDEX idx_ward_branch_members_user_role ON ward_branch_members(user_id, role, ward_branch_id);
CREATE INDEX idx_user_profiles_user_hash ON user_profiles(user_id, user_hash);
```

#### 2. Policy Testing Scenarios

**Test Case 1: Valid Ward Administrator**
```sql
-- Setup test user as ward admin
INSERT INTO ward_branch_members (ward_branch_id, user_id, role) 
VALUES ('ward-uuid-123', 'user-uuid-456', 'admin');

-- Test: Should succeed
SELECT * FROM ward_member_groups WHERE ward_branch_id = 'ward-uuid-123';
INSERT INTO ward_member_groups (ward_branch_id, user_hash, assigned_group) 
VALUES ('ward-uuid-123', 'member-hash-789', 'A');
```

**Test Case 2: Unauthorized User (Different Ward)**
```sql
-- Setup test user as admin of different ward
INSERT INTO ward_branch_members (ward_branch_id, user_id, role) 
VALUES ('other-ward-uuid', 'user-uuid-456', 'admin');

-- Test: Should return empty result set
SELECT * FROM ward_member_groups WHERE ward_branch_id = 'ward-uuid-123';
-- Result: 0 rows (due to RLS policy)
```

**Test Case 3: Regular Member (No Admin Role)**
```sql
-- Setup test user as regular member
INSERT INTO ward_branch_members (ward_branch_id, user_id, role) 
VALUES ('ward-uuid-123', 'user-uuid-789', 'member');

-- Test: Should return empty result set
SELECT * FROM ward_member_groups WHERE ward_branch_id = 'ward-uuid-123';
-- Result: 0 rows (due to RLS policy)
```

### Security Validation Functions

#### 1. RLS Policy Validation Function
```sql
CREATE OR REPLACE FUNCTION validate_ward_admin_access(target_ward_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM ward_branches wb
        JOIN ward_branch_members wbm ON wb.id = wbm.ward_branch_id
        WHERE wb.id = target_ward_id 
        AND wbm.user_id = auth.uid() 
        AND wbm.role IN ('admin', 'leader')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

#### 2. Audit Trail Function
```sql
CREATE OR REPLACE FUNCTION log_group_assignment_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Log changes for audit purposes
    INSERT INTO audit_log (
        table_name,
        operation,
        user_id,
        ward_branch_id,
        old_values,
        new_values,
        timestamp
    ) VALUES (
        'ward_member_groups',
        TG_OP,
        auth.uid(),
        COALESCE(NEW.ward_branch_id, OLD.ward_branch_id),
        to_jsonb(OLD),
        to_jsonb(NEW),
        NOW()
    );
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply audit trigger
CREATE TRIGGER ward_member_groups_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON ward_member_groups
    FOR EACH ROW EXECUTE FUNCTION log_group_assignment_change();
```

### Error Handling and Debugging

#### 1. Common RLS Issues and Solutions

**Issue: "permission denied for table ward_member_groups"**
```sql
-- Debug: Check if RLS is enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'ward_member_groups';

-- Debug: Check user's ward membership
SELECT wb.name, wbm.role 
FROM ward_branches wb
JOIN ward_branch_members wbm ON wb.id = wbm.ward_branch_id
WHERE wbm.user_id = auth.uid();
```

**Issue: Empty result set when data exists**
```sql
-- Debug: Bypass RLS temporarily (for debugging only)
SET row_security = off;
SELECT count(*) FROM ward_member_groups;
SET row_security = on;

-- Debug: Test policy manually
SELECT ward_branch_id IN (
    SELECT wb.id FROM ward_branches wb
    JOIN ward_branch_members wbm ON wb.id = wbm.ward_branch_id
    WHERE wbm.user_id = auth.uid() AND wbm.role IN ('admin', 'leader')
) as has_access
FROM ward_member_groups
LIMIT 1;
```

#### 2. Performance Monitoring
```sql
-- Monitor RLS policy performance
EXPLAIN (ANALYZE, BUFFERS) 
SELECT * FROM ward_member_groups WHERE ward_branch_id = 'target-ward-uuid';

-- Check index usage
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch
FROM pg_stat_user_indexes
WHERE tablename = 'ward_member_groups';
```

### Security Best Practices

#### 1. Regular Security Audits
```sql
-- Monthly review of ward administrator permissions
SELECT 
    wb.name as ward_name,
    up.first_name || ' ' || up.last_name as admin_name,
    wbm.role,
    wbm.joined_at,
    wbm.last_active_at
FROM ward_branches wb
JOIN ward_branch_members wbm ON wb.id = wbm.ward_branch_id
JOIN user_profiles up ON wbm.user_id = up.user_id
WHERE wbm.role IN ('admin', 'leader')
ORDER BY wb.name, wbm.joined_at;
```

#### 2. Data Integrity Checks
```sql
-- Verify no orphaned group assignments
SELECT wmg.* 
FROM ward_member_groups wmg
LEFT JOIN ward_branches wb ON wmg.ward_branch_id = wb.id
WHERE wb.id IS NULL;

-- Verify household integrity
SELECT household_id, COUNT(DISTINCT assigned_group) as group_count
FROM ward_member_groups 
WHERE household_id IS NOT NULL
GROUP BY household_id
HAVING COUNT(DISTINCT assigned_group) > 1;
```

#### 3. Backup and Recovery Considerations
```sql
-- Backup group assignments before major changes
CREATE TABLE ward_member_groups_backup AS 
SELECT * FROM ward_member_groups WHERE ward_branch_id = 'target-ward-uuid';

-- Restore from backup if needed
INSERT INTO ward_member_groups 
SELECT * FROM ward_member_groups_backup 
ON CONFLICT (ward_branch_id, user_hash) DO UPDATE SET
    assigned_group = EXCLUDED.assigned_group,
    assignment_date = EXCLUDED.assignment_date,
    assigned_by = EXCLUDED.assigned_by,
    household_id = EXCLUDED.household_id,
    updated_at = NOW();
```

### Integration with Application Code

#### 1. Supabase Client Configuration
```typescript
// Ensure RLS is enforced in client
const supabase = createClient(url, key, {
  auth: {
    autoRefreshToken: true,
    persistSession: true
  },
  db: {
    schema: 'public'
  },
  global: {
    headers: { 'x-application-name': 'ward-cleaning-app' }
  }
});
```

#### 2. Error Handling in Application
```typescript
async function updateGroupAssignments(assignments: GroupAssignment[]) {
  try {
    const { data, error } = await supabase
      .from('ward_member_groups')
      .upsert(assignments);
      
    if (error) {
      if (error.code === '42501') { // Insufficient privilege
        throw new Error('You do not have permission to modify group assignments for this ward');
      }
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Group assignment update failed:', error);
    throw error;
  }
}
```

---

## Appendix B: API Endpoint Documentation

### GET /api/ward-members/groups/:wardBranchId
Retrieves current group assignments for all members in a ward.

**Response:**
```json
{
  "success": true,
  "data": {
    "customAssignments": [
      {
        "userHash": "abc123",
        "assignedGroup": "A",
        "householdId": "household_1"
      }
    ],
    "defaultAssignments": [
      {
        "userHash": "abc123",
        "assignedGroup": "A",
        "householdId": "household_1"
      }
    ]
  }
}
```

### POST /api/ward-members/groups/bulk-update
Updates group assignments for multiple members.

**Request:**
```json
{
  "wardBranchId": "uuid",
  "assignments": [
    {
      "userHash": "abc123",
      "newGroup": "B",
      "householdId": "household_1"
    }
  ]
}
```

---

**Document Status:** Draft  
**Next Review Date:** 2 weeks from implementation start  
**Stakeholder Approval:** Pending 