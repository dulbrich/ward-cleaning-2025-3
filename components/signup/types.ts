export interface SignupFormData {
  // Step 1: Basic signup
  email: string;
  password: string;
  
  // Step 2: Personal information
  firstName: string;
  lastName: string;
  username: string;
  avatarUrl: string;
  
  // Step 3: Phone verification
  phoneNumber: string;
  isPhoneVerified: boolean;
  
  // Step 4: Terms acceptance
  hasAcceptedTerms: boolean;
}

export type SignupStep = 'email' | 'personal' | 'phone' | 'terms' | 'success';

export interface VerificationState {
  codeSent: boolean;
  isVerifying: boolean;
  verificationCode: string;
  error: string | null;
}

export interface StepNavigationProps {
  currentStep: SignupStep;
  onNext: () => void;
  onBack: () => void;
  isNextDisabled?: boolean;
} 