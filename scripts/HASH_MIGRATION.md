# User Hash Migration Guide

This guide explains how to update all existing user hashes in the system to use a single consistent format.

## Background

The application previously used two different hash functions:

1. `generateUserHash`: Used for user profiles with format `firstname|lastname|phonenumber` (lowercase)
2. `createAnonymousIdentifier`: Used for anonymous tracking with format `FIRLAS1234` (first 3 letters of first/last name + last 4 digits of phone)

We're unifying the system to use only the second format (`FIRLAS1234`) everywhere.

## Migration Steps

### 1. Update the Code

The code has been modified to use `createAnonymousIdentifier` for all hash generation:

```typescript
export async function generateUserHash(firstName: string, lastName: string, phoneNumber: string): Promise<string> {
  // Simply use the existing createAnonymousIdentifier function to ensure consistency
  return createAnonymousIdentifier(firstName, lastName, phoneNumber);
}
```

### 2. Run the Migration Script

To update existing hash values in the database:

1. Make sure you have the correct environment variables set up:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY` (admin access required)

2. Run the migration script:
   ```bash
   node scripts/migrate-hashes.js
   ```

This script will:
- Update all user_hash values in the user_profiles table
- Update corresponding user_hash values in the anonymous_users table

### 3. Monitor for Issues

After migrating, monitor for any authorization issues or unexpected behavior:

- Check if users can still update their profiles
- Verify that anonymous users are properly linked to registered accounts
- Ensure any features relying on user hashes continue to work properly

### Technical Details

The new hash format:
1. Takes the first 3 letters of the first name (uppercase)
2. Takes the first 3 letters of the last name (uppercase)
3. Takes the last 4 digits of the phone number
4. Combines them into a string (e.g., "DAVULB9802")
5. Creates a SHA-256 hash of this string

This approach provides:
- Consistency across the system
- Better privacy protection while still allowing for user identification
- Simpler code maintenance with a single hashing approach

### Troubleshooting

If you encounter issues:

1. Check Supabase logs for any database errors
2. Verify that all required user data (first/last name, phone) is present
3. If needed, you can manually update user hashes using the Supabase Admin UI 