# Anonymous User Tracking System Specification

## Overview
This document specifies a system for anonymously tracking users who interact with the ward cleaning application through two different channels: those imported via the Ward Contact Import Tool and those who sign up directly to use the app. The system complements the existing user profiles table by providing a privacy-focused way to link imported contacts with registered users.

## Purpose
- Distinguish between imported contacts and self-registered users
- Maintain user privacy by avoiding storage of personally identifiable information
- Enable linking imported contacts with their eventual self-registration
- Prevent duplicate entries when the same contact is imported multiple times
- Connect imported contacts to existing user profiles when they register

## User Types
1. **Imported User**: A ward member whose information was imported by an administrator using the Ward Contact Import Tool
2. **Registered User**: A ward member who has created their own account to access the application

## Anonymous User Identification

### Hashing Algorithm
The system will create a unique, anonymous identifier for each user by:

1. Extracting partial identity components:
   - First 3 letters of the person's first name
   - First 3 letters of the person's last name
   - Last 4 digits of their phone number
2. Normalizing the data:
   - Convert all letters to uppercase
   - Remove any non-alphanumeric characters
   - Concatenate the three parts (e.g., "JOHSMI1234")
3. Securely hash the normalized string:
   - Use a cryptographic hash function (SHA-256)
   - Store only the resulting hash in the database

### Example
```
User: John Smith, Phone: (555) 123-4567
Extraction: "JOH" + "SMI" + "4567"
Normalized: "JOHSMI4567"
Stored value: SHA-256("JOHSMI4567")
```

## Technical Requirements

### Database Schema
Create a new `anonymous_users` table in the Supabase database that will complement the existing user profiles table:

```sql
CREATE TABLE IF NOT EXISTS anonymous_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_hash TEXT UNIQUE NOT NULL,
  user_type TEXT NOT NULL DEFAULT 'imported',
  first_import_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_import_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  import_count INTEGER DEFAULT 1,
  registered_at TIMESTAMP WITH TIME ZONE,
  registered_user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on the table
ALTER TABLE anonymous_users ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view anonymous user records
CREATE POLICY "Authenticated users can view anonymous users" 
  ON anonymous_users 
  FOR SELECT 
  USING (auth.role() = 'authenticated');

-- Allow authenticated users to insert/update anonymous users
CREATE POLICY "Authenticated users can insert/update anonymous users" 
  ON anonymous_users 
  FOR INSERT 
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update anonymous users" 
  ON anonymous_users 
  FOR UPDATE
  USING (auth.role() = 'authenticated');
```

### Integration with Existing User Profiles Table
The `anonymous_users` table is designed to work alongside the existing user profiles table:

- The `registered_user_id` field in the `anonymous_users` table will link to the user's ID in the auth.users table
- When a user registers, their anonymous record (if it exists) will be updated to link to their user profile
- This provides a privacy-preserving bridge between imported contacts and registered user profiles

### Implementation Details

#### Import Process Updates
1. When processing the ward contact JSON data in the Ward Contact Import Tool:
   - For each contact, generate the anonymous hash
   - Check if the hash already exists in the `anonymous_users` table
   - If the hash exists, increment the `import_count` and update `last_import_at`
   - If the hash doesn't exist, create a new record with `user_type` set to 'imported'

#### Registration Process Updates
1. When a user registers in the application:
   - Generate the anonymous hash based on their provided information
   - Check if the hash exists in the `anonymous_users` table
   - If the hash exists and `user_type` is 'imported', update:
     - `user_type` to 'registered'
     - `registered_at` to the current timestamp
     - `registered_user_id` to the user's auth ID from the existing user profiles system
   - If the hash doesn't exist, create a new record with `user_type` set to 'registered'
   - The user's complete profile information continues to be stored in the existing user profiles table

### Hash Generation Function
Create a server-side function to generate consistent hash values:

```typescript
const generateAnonymousHash = (firstName: string, lastName: string, phoneNumber: string): string => {
  // Extract the required parts
  const firstNamePart = firstName.slice(0, 3).toUpperCase();
  const lastNamePart = lastName.slice(0, 3).toUpperCase();
  
  // Extract last 4 digits of phone number (remove non-numeric characters first)
  const cleanPhoneNumber = phoneNumber.replace(/\D/g, '');
  const phonePart = cleanPhoneNumber.slice(-4);
  
  // Combine the parts
  const combinedString = `${firstNamePart}${lastNamePart}${phonePart}`;
  
  // Hash the combined string using SHA-256
  // Use a crypto library like crypto-js or the Node.js crypto module
  return sha256(combinedString).toString();
};
```

## Privacy Considerations
- No personally identifiable information is stored in the `anonymous_users` table
- The hash function is one-way and cannot be reversed to obtain original user data
- The system complies with data minimization principles by storing only the minimum necessary information
- Full user profile data remains in the existing user profiles table, with appropriate security controls

## Integration Points
1. **Ward Contact Import Tool** (`app/tools/page.tsx`):
   - Update to generate and check hashes during import
   - Handle duplicate detection and update import counters

2. **User Registration Flow**:
   - Update to generate and check hashes during registration
   - Link registered users to their import records if available
   - Continue storing complete user profile data in the existing user profiles table

## Future Considerations
- Implement a mechanism to periodically clean up unregistered import records
- Add analytics on conversion rates (imported users who later register)
- Enhance the security of the hashing algorithm as needed
- Add functionality to analyze which imported users have not yet registered 