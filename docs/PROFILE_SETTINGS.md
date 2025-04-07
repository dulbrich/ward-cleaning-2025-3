# Ward Cleaning App - Profile Settings Specification

## Overview
This document outlines the functionality and UI components for the Profile Settings page of the Ward Cleaning App. The Profile Settings page allows users to update their personal information, manage their avatar, and update their phone number with verification.

## User Profile Settings Flow

### 1. Profile Settings Main View
The Profile Settings interface is accessed through the Settings page under the Profile tab.

#### UI Components:
- **Header:** "Profile Settings"
- **Save Changes Button:** Located at the top right corner of the form
- **Profile Information Form** with the following fields:
  - Profile Avatar (with selection options)
  - First Name field (editable)
  - Last Name field (editable)
  - Email field (read-only)
  - Phone field (editable with verification)
  - Username field (editable)
  - Bio/Description field (editable)
  - Role field (editable if admin, otherwise read-only)

### 2. Avatar Selection
Users can update their profile picture by selecting from pre-defined avatars or uploading a custom image.

#### UI Components:
- **Current Avatar Display:** Shows the user's current avatar
- **Avatar Selection Dialog:** Triggered by "Upload new image" button
  - Grid of available avatars from `/public/images/avatars/` 
    - Default avatars (default.png, avatar1.png through avatar5.png)
    - Monster avatars (monster_1.png through monster_12.png)
  - Option to upload a custom image
  - "Cancel" button to close without changes
  - "Select" button to confirm avatar choice
- **Remove Avatar Button:** Resets to default avatar

#### Functionality:
- When user selects a new avatar, preview is updated immediately
- Only after "Save Changes" is clicked, the avatar change is persisted to database
- Custom image uploads should be resized and optimized before storage
- Supported formats: JPG, PNG, or GIF (square aspect ratio recommended)

### 3. Phone Number Verification
When a user attempts to change their phone number, they must go through the verification process.

#### UI Components:
- **Phone Update Dialog:** Opens when user modifies and submits phone number
  - Header: "Verify Your Phone Number"
  - Subheader: "We'll send you a 6-digit code to verify your phone"
  - Phone number display (pre-filled with new number)
  - "Send Code" button
  - 6-digit verification code input field (appears after code is sent)
  - Timer showing countdown for code expiration (3 minutes)
  - "Resend Code" option (enabled after timer expires)
  - "Cancel" button
  - "Verify & Save" button

#### Verification Process:
1. User changes phone number in the profile form and clicks "Save Changes"
2. System detects phone number change and triggers verification process
3. Verification dialog appears with the new phone number
4. User clicks "Send Code"
5. System sends SMS with 6-digit code to the provided number
6. User receives code and enters it in the verification field
7. System validates the code:
   - If correct, phone number is updated and dialog closes
   - If incorrect, user is prompted to try again or request a new code
8. The `is_phone_verified` flag in the database is updated accordingly

#### Validation:
- Phone number must be in valid format
- Verification code must match the one sent to user's phone
- If verification is cancelled, phone number reverts to previous value

## Technical Implementation

### Components to Create/Update:
1. `app/settings/page.tsx` - Update to implement tabbed interface with Active Profile tab
2. `components/profile/profile-form.tsx` - Main profile information form
3. `components/profile/avatar-selector.tsx` - Avatar selection component
4. `components/profile/phone-verification-dialog.tsx` - Phone verification process

### State Management:
- Use form state management to track changes in profile data
- Implement optimistic UI updates with error handling
- Track dirty state to enable/disable Save button
- Use a dialog/modal state for avatar selection and phone verification

### Database Updates:
- Update `user_profiles` table with changes
- Fields to update:
  - `first_name`
  - `last_name`
  - `username` 
  - `avatar_url`
  - `phone_number` (with verification)
  - `is_phone_verified` (boolean)
  - `updated_at` (timestamp)

### API Endpoints Needed:
1. `PUT /api/profile` - Update user profile information
2. `POST /api/profile/verify-phone` - Send verification code to phone
3. `POST /api/profile/confirm-phone` - Verify phone with code
4. `PUT /api/profile/avatar` - Update user avatar

### Security Considerations:
- Implement rate limiting for verification code requests
- Validate all input on both client and server
- Ensure email remains read-only
- Check user permissions before allowing updates
- Implement CSRF protection for form submissions
- Use secure HTTP-only cookies for session management

### Accessibility:
- All forms must be fully keyboard navigable
- Include proper ARIA labels for screen readers
- Ensure color contrast meets WCAG 2.1 AA standards
- Provide clear error messages for all validation failures

## Mobile Considerations
- Avatar selector should be responsive and usable on mobile devices
- Phone verification dialog should be optimized for mobile experience
- Consider auto-detection of SMS verification codes on supported mobile devices

## Development Timeline
- Component Development: 2 days
- API Implementation: 1 day
- Integration Testing: 1 day
- User Testing: 1 day
- Refinement: 1 day

Total Estimated Development Time: 6 working days 