# Ward Cleaning App - User Onboarding Specification

## Overview
This document outlines the user signup flow for the Ward Cleaning App. The process is designed to be intuitive, secure, and compliant with data privacy best practices while collecting necessary information to facilitate the app's core functionality.

## User Signup Flow

### 1. Initial Signup Screen
The signup process begins from the landing page with a "Sign Up" button placed alongside the existing "Sign In" option in the header or hero section.

#### UI Components:
- **Header:** "Create Your Account" 
- **Subheader:** "Join the many wards already using our platform to organize their building cleaning efforts."
- **Sign Up Form** (Step 1 of 4)
  - Email Address field (with validation)
  - Password field (with strength indicator)
  - Password confirmation field
  - "Next" button (leading to Personal Information)
  - "Already have an account? Sign In" link

#### Validation:
- Email must be valid format
- Password must be at least 8 characters and include a mix of letters, numbers, and special characters
- Passwords must match

### 2. Personal Information Screen
After basic account creation, users will provide personal identification information.

#### UI Components:
- **Header:** "Tell Us About Yourself"
- **Subheader:** "This information helps us personalize your experience"
- **Personal Info Form** (Step 2 of 4)
  - First Name field
  - Last Name field
  - Username field (how others will see you in the app)
  - Profile Avatar selection
    - Option to upload custom image
    - Grid of default avatars to choose from
  - "Back" button (return to previous step)
  - "Next" button (leading to Phone Verification)

#### Validation:
- All text fields are required
- Username must be unique within the system
- Avatar selection is required (default avatar can be pre-selected)

### 3. Phone Verification Screen
Users provide and verify their phone number to enable notification functionality.

#### UI Components:
- **Header:** "Verify Your Phone Number"
- **Subheader:** "We'll send you a 6-digit code to verify your phone"
- **Phone Verification Form** (Step 3 of 4)
  - Phone number input with country code selector
  - "Send Code" button
  - 6-digit verification code input (appears after code is sent)
  - Timer showing countdown for code expiration (3 minutes)
  - "Resend Code" option (enabled after timer expires)
  - "Back" button (return to previous step)
  - "Verify & Continue" button (leading to EULA)

#### Verification Process:
1. User enters phone number and clicks "Send Code"
2. System sends SMS with 6-digit code to the provided number
3. User receives code and enters it in the verification field
4. System validates the code:
   - If correct, user proceeds to EULA step
   - If incorrect, user is prompted to try again or request a new code

#### Validation:
- Phone number must be in valid format
- Verification code must match the one sent to user's phone

### 4. End User License Agreement (EULA)
Final step before account creation where users review and accept the terms of service.

#### UI Components:
- **Header:** "Review and Accept Terms"
- **Subheader:** "Please review our terms and conditions before continuing"
- **EULA Form** (Step 4 of 4)
  - Scrollable text container with EULA content
  - Checkbox to confirm: "I have read and agree to the Terms and Conditions"
  - "Back" button (return to previous step)
  - "Create Account" button (completes signup process)

#### EULA Content Highlights:
- Information gathered will not be sold or used for any purpose other than for sending out text messages to remind users of their responsibilities for cleaning ward buildings
- Records may be shared with 3rd party AI systems solely for the purpose of improving the product
- It is not the intent of the Ward Cleaning app to divulge or sell gathered information for gain
- Users who share information will be giving the Ward Cleaning app explicit ownership of their data while it is in our possession
- Users may delete their accounts at any time as it is not our intention to store their information indefinitely

#### Validation:
- User must scroll through the entire EULA text
- Agreement checkbox must be checked before proceeding

### 5. Success & Welcome Screen
Upon successful signup, users see a confirmation and are directed to the dashboard.

#### UI Components:
- **Header:** "Welcome to Ward Cleaning!"
- **Subheader:** "Your account has been successfully created"
- Brief animation or graphic celebrating successful signup
- "Continue to Dashboard" button
- Optional: Quick introduction to key features (can be dismissed)

## Technical Implementation Notes

### Components to Create:
1. `signup-dialog.tsx` - Main container for the signup process
2. `signup-email-step.tsx` - Initial email and password collection
3. `signup-personal-info-step.tsx` - Personal information collection
4. `signup-phone-verification-step.tsx` - Phone verification process
5. `signup-eula-step.tsx` - EULA presentation and acceptance
6. `signup-success.tsx` - Success confirmation

### State Management:
- Use a multi-step form with state management to track progress
- Store form data across steps in a single state object
- Implement form validation at each step before allowing progression

### API Endpoints Needed:
1. `/api/auth/register` - Create new user account
2. `/api/auth/verifyEmail` - Verify email address existence
3. `/api/auth/sendVerificationCode` - Send SMS verification code
4. `/api/auth/verifyPhone` - Verify phone with code
5. `/api/auth/completeSignup` - Complete signup process after EULA acceptance

### Security Considerations:
- Implement rate limiting for verification code requests
- Store passwords with proper hashing (bcrypt recommended)
- Implement CSRF protection for form submissions
- Use secure HTTP-only cookies for session management

### Accessibility:
- All forms must be fully keyboard navigable
- Include proper ARIA labels for screen readers
- Ensure color contrast meets WCAG 2.1 AA standards
- Provide clear error messages for all validation failures

## Mobile Considerations
- All forms should be responsive and usable on mobile devices
- Phone verification step should be optimized for mobile experience
- Consider auto-detection of SMS verification codes on supported mobile devices

## Development Timeline
- Component Development: 3 days
- API Implementation: 2 days
- Integration Testing: 2 days
- User Testing: 2 days
- Refinement: 1 day

Total Estimated Development Time: 10 working days 