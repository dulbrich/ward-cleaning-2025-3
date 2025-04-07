# Profile Settings Implementation Guide

## Overview

This document outlines the implementation details of the Profile Settings feature for the Ward Cleaning App. The feature allows users to edit their profile information, update their avatar, and change their phone number with verification.

## Components Structure

The implementation consists of the following components:

1. `app/app/settings/page.tsx` - Main settings page with tabbed navigation
2. `components/profile/profile-form.tsx` - Form for editing user profile data
3. `components/profile/avatar-selector.tsx` - Dialog for selecting or uploading an avatar
4. `components/profile/phone-verification-dialog.tsx` - Dialog for verifying phone numbers

## API Routes

The feature uses the following API endpoints:

1. `GET /api/profile` - Fetches the current user's profile data
2. `PUT /api/profile` - Updates the user's profile data
3. `POST /api/profile/verify-phone` - Sends a verification code to the user's phone
4. `POST /api/profile/confirm-phone` - Verifies the code and confirms the phone number

## Database Schema

The feature uses two main tables in the database:

1. `user_profiles` - Stores user profile information 
2. `phone_verifications` - Stores phone verification codes

A migration script (`migrations/profile-settings.sql`) is provided to create the necessary table and add required columns.

## Setup Instructions

To set up the Profile Settings feature:

1. Run the migration script to create required database tables and columns:

```bash
psql -d your_database_name -f migrations/profile-settings.sql
```

2. Install required dependencies:

```bash
npm install @clerk/nextjs @tanstack/react-query @radix-ui/react-dialog @radix-ui/react-label @radix-ui/react-slot @radix-ui/react-tabs class-variance-authority clsx tailwind-merge lucide-react
```

3. Make sure the UI components are available in the components/ui directory:
   - dialog.tsx
   - button.tsx
   - input.tsx
   - label.tsx
   - tabs.tsx

4. Create the necessary API routes:
   - app/api/profile/route.ts
   - app/api/profile/verify-phone/route.ts
   - app/api/profile/confirm-phone/route.ts

5. Ensure the correct avatar images are available in `public/images/avatars/`

## Phone Verification Process

The phone verification process works as follows:

1. When a user changes their phone number and submits the form, a verification dialog appears
2. The user clicks "Send Code" to receive a verification code via SMS
3. The verification code is stored in the database with a 3-minute expiration time
4. The user enters the code to verify their phone number
5. If the code is correct and not expired, the phone number is updated and marked as verified

For development purposes, the verification code is logged to the console instead of sending an actual SMS. In production, you should integrate with an SMS service like Twilio.

## Avatar Selection

The avatar selection process allows users to:

1. Choose from default avatars (default.png, avatar1.png through avatar5.png)
2. Choose from monster avatars (monster_1.png through monster_12.png)
3. Upload a custom image

## Admin Features

Users with the 'admin' role have additional capabilities:

1. They can edit the 'role' field for their profile
2. They can see additional settings if implemented

## Mobile Considerations

All components are designed to be responsive:

1. The settings page uses a responsive grid layout
2. The avatar selector adjusts to different screen sizes
3. The phone verification dialog is usable on mobile devices
4. Form inputs are properly sized for touch interactions

## Security Considerations

The implementation includes several security measures:

1. Server-side authorization checks to ensure users can only modify their own profile
2. Role-based access control for admin features
3. Rate limiting for verification code requests
4. CSRF protection for all form submissions
5. Email field is read-only to prevent unauthorized email changes

## Future Enhancements

Potential future enhancements include:

1. Social media profile links
2. Profile visibility settings
3. Profile completeness indicator
4. Integration with Twilio or another SMS service for verification
5. Improved avatar image editing capabilities 