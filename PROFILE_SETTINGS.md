# Profile Settings Specification

## Overview
This document describes the implementation of the Profile Settings feature in the application. The Profile tab in the Settings page allows users to edit and save their profile information, including fields like first name, last name, username, and phone number. Some fields, like email, are read-only.

## User Interface
The Profile tab in the Settings page contains a form with the following fields:
- **Avatar Selection**: Users can select an avatar from a list of predefined images located in the `/public/images/avatars` directory.
- **First Name**: Text input field for the user's first name.
- **Last Name**: Text input field for the user's last name.
- **Username**: Text input field for the user's username.
- **Email**: Read-only field displaying the user's email address.
- **Phone Number**: Input field for the user's phone number with formatting.

## Field Requirements

### First Name
- Required field
- Text input
- Maximum length: 50 characters

### Last Name
- Required field
- Text input
- Maximum length: 50 characters

### Username
- Required field
- Text input
- Maximum length: 30 characters
- Allowed characters: alphanumeric, underscores, and hyphens

### Email
- Read-only field
- Displays the user's email address
- Cannot be changed via the profile settings page

### Phone Number
- Required field
- Must be in the format: +1 (###) ###-####
- When changed, requires verification (see Verification Process)
- Uses the `react-imask` library for input masking and formatting
- Displays as formatted phone number but stored as plain digits in the database

### Avatar
- Optional field
- Selection from predefined avatars in `/public/images/avatars` directory
- Default: `01.png`

## Verification Process
When a user changes their phone number, they need to verify the new number before the change is saved:
1. User enters a new phone number and submits the form
2. A verification code is sent to the new phone number (simulated in this implementation)
3. A modal dialog opens, prompting the user to enter the verification code
4. User enters the code and submits
5. If the code is correct, the phone number change is saved
6. If the code is incorrect, an error is displayed, and the user can try again

For testing purposes, the verification code is always "123456".

### Phone Verification API
Phone verification is handled by a dedicated API endpoint:
- **POST `/api/user/verify-phone`**: Verifies a phone number with a provided code
  - Request body:
    ```json
    {
      "phone_number": "5551234567",
      "verification_code": "123456"
    }
    ```
  - Response (success):
    ```json
    {
      "success": true,
      "message": "Phone number verified successfully",
      "verified": true
    }
    ```
  - Response (failure):
    ```json
    {
      "success": false,
      "message": "Invalid verification code",
      "verified": false
    }
    ```

### Verification UI Components
- **Verification Modal**: A modal dialog that appears when a user changes their phone number
  - Displays the phone number being verified
  - Provides an input field for the verification code
  - Includes buttons to submit the code or cancel the verification
  - Shows feedback on verification success or failure
  - Offers an option to resend the verification code

## Data Persistence
The user profile data is persisted using the following methods:
1. **API Endpoints**:
   - GET `/api/user/profile`: Fetches the user's profile data
   - PUT `/api/user/profile`: Updates the user's profile data
   - POST `/api/user/verify-phone`: Verifies a phone number

2. **Database Schema**:
```sql
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users NOT NULL,
    first_name VARCHAR(50),
    last_name VARCHAR(50),
    username VARCHAR(30) UNIQUE,
    avatar_url VARCHAR(255),
    phone_number VARCHAR(15),
    is_phone_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

## Dependencies
- **react-imask**: Used for phone number input masking and formatting
- **react**: Used for component rendering and state management
- **next/navigation**: Used for routing
- **sonner**: Used for toast notifications

## Implementation Notes
1. **Form Validation**: Client-side validation ensures that all required fields are filled and that the phone number is in the correct format.
2. **User Feedback**: Toast notifications inform the user of successful submissions or errors.
3. **Read-only Fields**: The email field is visually distinct to indicate it's read-only.
4. **Phone Number Formatting**: The phone number input field uses `react-imask` to automatically format the input as the user types, providing a clear visual indication of the expected format.
5. **Phone Verification Flow**:
   - When a user changes their phone number, the verification process is triggered
   - The verification modal appears, prompting for a verification code
   - The user must enter the correct code to save the new phone number
   - Phone numbers are stored with a verification status flag in the database

## Future Enhancements
1. Integration with a real authentication system
2. Add email change functionality (with verification)
3. Add password change functionality
4. Add additional profile fields like bio, address, etc.
5. Implement a real SMS service for sending verification codes

## Demo Implementation
A working prototype has been implemented:
- Profile form component: `/components/profile/profile-form.tsx`
- Settings page: `/app/settings-new/page.tsx`
- API endpoints: 
  - `/app/api/user/profile/route.ts`
  - `/app/api/user/verify-phone/route.ts`

The implementation demonstrates:
- Avatar selection from multiple options
- Phone verification process with modal dialog
- Phone number formatting as +1 (###) ###-#### using react-imask
- Form validation and submission
- Read-only email field
- User feedback messages
- Database integration with Supabase

## Future Enhancements
- Integration with actual authentication system
- Email change workflow (separate from profile settings)
- Password change functionality
- Two-factor authentication setup
- Social media account linking 