export interface UserProfile {
  user_id: string;
  first_name: string;
  last_name: string;
  username: string;
  avatar_url?: string;
  phone_number?: string;
  is_phone_verified?: boolean;
  has_accepted_terms: boolean;
  created_at: string;
  updated_at: string;
  role?: string;
}

export interface OnboardingFormData {
  firstName: string;
  lastName: string;
  username: string;
  avatarUrl?: string;
  phoneNumber?: string;
  isPhoneVerified: boolean;
  hasAcceptedTerms: boolean;
}

export type OnboardingStep = 'personal' | 'phone' | 'terms' | 'success'; 