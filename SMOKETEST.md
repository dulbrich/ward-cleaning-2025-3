# Ward Cleaning App - "Coming Soon" Feature Specification

## Overview
This document specifies the implementation of a "Coming Soon" page that will replace the current sign-up flow. When users click "Sign Up" or "Get Started" buttons, they will be redirected to a new page indicating the application is still under construction. This page will include a form allowing users to register their interest and receive updates when the application launches.

## Purpose
- Inform users that the full application is not yet available
- Capture potential user information for future marketing
- Maintain brand presence while development continues
- Collect a list of interested parties for the launch

## Technical Requirements

### 1. Database Changes

#### Create Interest Signup Table
Create a new `interest_signups` table in the Supabase database:

```sql
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
```

### 2. UI Changes

#### Modify Sign-Up Button Links
Update all "Sign Up" and "Get Started" buttons throughout the application to point to the new `/coming-soon` route instead of the current `/sign-up` route.

Specifically:
- Update the "Get Started" button in `components/hero.tsx`
- Update the "Get Started" button in the CTA section of `app/page.tsx`
- Add a redirect from `/sign-up` to `/coming-soon` to handle existing links

#### Create Coming Soon Page
Create a new page at `app/coming-soon/page.tsx` with:
- Clear messaging that the application is under development
- Brief overview of application features
- Expected launch timeline (if available)
- Interest sign-up form
- Attractive design consistent with the application's branding

### 3. Backend Functionality

#### Create API Endpoint
Implement a server action to:
1. Validate the form data
2. Insert the data into the `interest_signups` table
3. Provide appropriate success and error feedback

### 4. Implementation Tasks

1. **Database**
   - Create the `interest_signups` table in Supabase

2. **UI Components**
   - Create the `app/coming-soon/page.tsx` file
   - Modify the sign-up links in `components/hero.tsx` and `app/page.tsx`
   - Add a redirect from `/sign-up` to `/coming-soon`

3. **Server Actions**
   - Implement form validation and submission logic
   - Create error handling for duplicate emails

4. **Testing**
   - Verify all sign-up links redirect to the coming soon page
   - Test form submission with valid and invalid data
   - Confirm records are stored correctly in the database

## Design Mockup

```
┌───────────────────────────────────────────────────────────┐
│                        HEADER                            │
├───────────────────────────────────────────────────────────┤
│                                                           │
│           ┌───────────────────────────────┐               │
│           │           LOGO                │               │
│           └───────────────────────────────┘               │
│                                                           │
│           COMING SOON                                     │
│                                                           │
│           We're building something amazing!               │
│                                                           │
│           The Ward Cleaning App will launch soon, helping │
│           wards organize and coordinate cleaning          │
│           assignments more effectively.                   │
│                                                           │
│           Sign up below to be notified when we launch.    │
│                                                           │
│           ┌───────────────────────────────┐               │
│           │      INTEREST SIGNUP FORM     │               │
│           │                               │               │
│           │  First Name:  [          ]    │               │
│           │  Last Name:   [          ]    │               │
│           │  Email:       [          ]    │               │
│           │  Phone:       [          ]    │               │
│           │  Ward Name:   [          ]    │               │
│           │  Role:        [          ]    │               │
│           │                               │               │
│           │      [    SIGN UP     ]       │               │
│           │                               │               │
│           └───────────────────────────────┘               │
│                                                           │
├───────────────────────────────────────────────────────────┤
│                        FOOTER                            │
└───────────────────────────────────────────────────────────┘
```

## Timeline
- Database changes: 1 day
- UI implementation: 2 days
- Backend functionality: 1 day
- Testing and refinement: 1 day
- Total estimated time: 5 days 