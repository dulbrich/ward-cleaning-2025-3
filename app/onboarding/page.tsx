"use client";

export const dynamic = 'force-dynamic';

import { FormMessage } from "@/components/form-message";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { OnboardingFormData, OnboardingStep } from "@/types";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

// Client component to handle search params
function OnboardingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<OnboardingStep>("personal");
  const [selectedAvatar, setSelectedAvatar] = useState("/images/avatars/avatar1.png");
  
  // Form data state
  const [formData, setFormData] = useState<OnboardingFormData>({
    firstName: "",
    lastName: "",
    username: "",
    avatarUrl: "/images/avatars/avatar1.png",
    phoneNumber: "",
    isPhoneVerified: false,
    hasAcceptedTerms: false
  });

  // Add session context to the state
  const [sessionContext, setSessionContext] = useState<{
    sessionId: string | null;
    tempUserId: string | null;
  }>({
    sessionId: null,
    tempUserId: null
  });

  // Handle search params for success message from email verification
  useEffect(() => {
    if (searchParams) {
      const messageType = searchParams.get('type');
      const messageContent = searchParams.get('message');
      const sessionId = searchParams.get('sessionId');
      const tempUserId = searchParams.get('tempUserId');
      
      if (messageType === 'success' && messageContent) {
        setSuccess(messageContent);
      }
      
      // Set session context if available
      if (sessionId) {
        setSessionContext({
          sessionId,
          tempUserId
        });
      }
    }
  }, [searchParams]);

  // Verification state
  const [verificationState, setVerificationState] = useState({
    codeSent: false,
    isVerifying: false,
    verificationCode: '',
    error: null as string | null
  });
  
  const [timeLeft, setTimeLeft] = useState<number>(180); // 3 minutes in seconds
  
  // Default avatars array
  const defaultAvatars = [
    '/images/avatars/avatar1.png',
    '/images/avatars/avatar2.png',
    '/images/avatars/avatar3.png',
    '/images/avatars/avatar4.png',
    '/images/avatars/avatar5.png',
    '/images/avatars/default.png',
  ];
  
  // Monster avatars
  const monsterAvatars = [
    '/images/avatars/monster_1.png',
    '/images/avatars/monster_2.png',
    '/images/avatars/monster_3.png',
    '/images/avatars/monster_4.png',
    '/images/avatars/monster_6.png',
    '/images/avatars/monster_7.png',
    '/images/avatars/monster_8.png',
    '/images/avatars/monster_9.png',
    '/images/avatars/monster_10.png',
    '/images/avatars/monster_11.png',
    '/images/avatars/monster_12.png',
  ];

  // Update form data
  const updateFormData = (data: Partial<OnboardingFormData>) => {
    setFormData(prev => ({ ...prev, ...data }));
  };

  // Phone verification functions
  const sendVerificationCode = () => {
    // Simulate sending verification code
    setVerificationState({
      ...verificationState,
      codeSent: true,
      isVerifying: false,
      error: null
    });
    
    // Start countdown timer
    const countdownInterval = setInterval(() => {
      setTimeLeft((prevTime) => {
        if (prevTime <= 1) {
          clearInterval(countdownInterval);
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);
  };
  
  const verifyCode = () => {
    setVerificationState({
      ...verificationState,
      isVerifying: true
    });
    
    // Simulate verification - in a real app this would call an API
    setTimeout(() => {
      // For demo, any 6-digit code is "valid"
      if (verificationState.verificationCode.length === 6) {
        updateFormData({ isPhoneVerified: true });
        setVerificationState({
          ...verificationState,
          isVerifying: false,
          error: null
        });
      } else {
        setVerificationState({
          ...verificationState,
          isVerifying: false,
          error: 'Invalid verification code. Please try again.'
        });
      }
    }, 1000);
  };
  
  // Format time remaining as MM:SS
  const formatTimeLeft = () => {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  // Step navigation
  const handleNext = async () => {
    if (currentStep === "personal") {
      if (!formData.firstName || !formData.lastName || !formData.username) {
        setError("Please fill in all required fields.");
        return;
      }
      setCurrentStep("phone");
      setError(null);
    } 
    else if (currentStep === "phone") {
      if (!formData.isPhoneVerified) {
        setError("Please verify your phone number before proceeding.");
        return;
      }
      setCurrentStep("terms");
      setError(null);
    } 
    else if (currentStep === "terms") {
      if (!formData.hasAcceptedTerms) {
        setError("You must accept the terms and conditions to continue.");
        return;
      }
      
      await handleSubmit();
    }
  };
  
  const handleBack = () => {
    if (currentStep === "phone") setCurrentStep("personal");
    else if (currentStep === "terms") setCurrentStep("phone");
    setError(null);
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      // Create the request body with session context
      const requestBody = {
        ...formData,
        smsOptIn: true,
        sessionContext: sessionContext.sessionId ? sessionContext : undefined
      };
      
      // Send to the API
      const response = await fetch('/api/user-profile/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create profile');
      }
      
      setSuccess('Profile created successfully!');
      setCurrentStep("success");
      
      // Redirect to the appropriate page based on session context
      setTimeout(() => {
        if (sessionContext.sessionId) {
          // Redirect back to the cleaning session
          router.push(`/app/tasks?sessionId=${sessionContext.sessionId}`);
        } else {
          // Default redirect to the app home
          router.push('/app');
        }
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'An error occurred');
      setLoading(false);
    }
  };
  
  // Progress indicator
  const renderProgressIndicator = () => {
    return (
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center w-full">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
            currentStep === "personal" || currentStep === "phone" || currentStep === "terms" || currentStep === "success" 
              ? "bg-primary text-white" 
              : "bg-muted text-muted-foreground"
          }`}>
            1
          </div>
          <div className={`h-1 flex-1 ${
            currentStep === "phone" || currentStep === "terms" || currentStep === "success" 
              ? "bg-primary" 
              : "bg-muted"
          }`}></div>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
            currentStep === "phone" || currentStep === "terms" || currentStep === "success" 
              ? "bg-primary text-white" 
              : "bg-muted text-muted-foreground"
          }`}>
            2
          </div>
          <div className={`h-1 flex-1 ${
            currentStep === "terms" || currentStep === "success" 
              ? "bg-primary" 
              : "bg-muted"
          }`}></div>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
            currentStep === "terms" || currentStep === "success" 
              ? "bg-primary text-white" 
              : "bg-muted text-muted-foreground"
          }`}>
            3
          </div>
        </div>
      </div>
    );
  };

  // Render personal info step
  const renderPersonalInfoStep = () => {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold mb-2">Personal Information</h1>
          <p className="text-muted-foreground">
            Tell us a bit about yourself
          </p>
        </div>
        
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input 
                id="firstName" 
                name="firstName" 
                placeholder="Your first name"
                value={formData.firstName}
                onChange={(e) => updateFormData({ firstName: e.target.value })}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input 
                id="lastName" 
                name="lastName" 
                placeholder="Your last name"
                value={formData.lastName}
                onChange={(e) => updateFormData({ lastName: e.target.value })}
                required
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input 
              id="username" 
              name="username" 
              placeholder="Choose a username"
              value={formData.username}
              onChange={(e) => updateFormData({ username: e.target.value })}
              required
            />
            <p className="text-xs text-muted-foreground">
              This is how others will see you in the app
            </p>
          </div>
          
          <div className="space-y-2">
            <Label>Profile Avatar</Label>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
              {defaultAvatars.map((avatar, index) => (
                <div 
                  key={index}
                  onClick={() => {
                    setSelectedAvatar(avatar);
                    updateFormData({ avatarUrl: avatar });
                  }}
                  className={`
                    relative cursor-pointer rounded-md overflow-hidden h-16 w-16 border-2
                    ${formData.avatarUrl === avatar ? 'border-primary' : 'border-transparent hover:border-muted'}
                  `}
                >
                  <Image 
                    src={avatar}
                    alt={`Avatar ${index+1}`}
                    fill
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
            
            <Label className="mt-4">Monster Avatars</Label>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
              {monsterAvatars.map((avatar, index) => (
                <div 
                  key={index}
                  onClick={() => {
                    setSelectedAvatar(avatar);
                    updateFormData({ avatarUrl: avatar });
                  }}
                  className={`
                    relative cursor-pointer rounded-md overflow-hidden h-16 w-16 border-2
                    ${formData.avatarUrl === avatar ? 'border-primary' : 'border-transparent hover:border-muted'}
                  `}
                >
                  <Image 
                    src={avatar}
                    alt={`Monster Avatar ${index+1}`}
                    fill
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Render phone verification step
  const renderPhoneVerificationStep = () => {
    return (
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold mb-2">Verify Your Phone Number</h1>
          <p className="text-muted-foreground">
            We'll send you a 6-digit code to verify your phone
          </p>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="phoneNumber">Phone Number</Label>
            <div className="flex">
              <Input
                id="phoneNumber"
                name="phoneNumber"
                type="tel"
                placeholder="(555) 123-4567"
                value={formData.phoneNumber}
                onChange={(e) => updateFormData({ phoneNumber: e.target.value })}
                disabled={verificationState.codeSent}
                className="flex-1 mr-2"
              />
              
              <Button 
                type="button" 
                onClick={sendVerificationCode}
                disabled={verificationState.codeSent && timeLeft > 0}
                variant={verificationState.codeSent ? "outline" : "default"}
              >
                {verificationState.codeSent && timeLeft > 0 
                  ? formatTimeLeft() 
                  : verificationState.codeSent 
                    ? "Resend" 
                    : "Send Code"}
              </Button>
            </div>
          </div>
          
          {verificationState.codeSent && (
            <div className="space-y-2">
              <Label htmlFor="verificationCode">Verification Code</Label>
              <div className="flex">
                <Input
                  id="verificationCode"
                  name="verificationCode"
                  placeholder="Enter 6-digit code"
                  value={verificationState.verificationCode}
                  onChange={(e) => setVerificationState({
                    ...verificationState,
                    verificationCode: e.target.value.replace(/\D/g, '').slice(0, 6)
                  })}
                  className="flex-1 mr-2"
                />
                
                <Button 
                  type="button" 
                  onClick={verifyCode}
                  disabled={verificationState.verificationCode.length !== 6 || verificationState.isVerifying}
                >
                  {verificationState.isVerifying ? "Verifying..." : "Verify"}
                </Button>
              </div>
              
              {verificationState.error && (
                <p className="text-sm text-destructive mt-1">{verificationState.error}</p>
              )}
              
              {formData.isPhoneVerified && (
                <p className="text-sm text-green-600 mt-1">Phone number verified successfully!</p>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  // Render terms step
  const renderTermsStep = () => {
    return (
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold mb-2">Review and Accept Terms</h1>
          <p className="text-muted-foreground">
            Please review our terms and conditions before continuing
          </p>
        </div>

        <div className="space-y-4">
          <div className="border rounded-md p-4 bg-muted/20 h-64 overflow-y-auto text-sm">
            <h3 className="font-semibold mb-2">End User License Agreement</h3>
            
            <p className="mb-4">
              By accepting this agreement, you acknowledge and agree to the following terms:
            </p>
            
            <ul className="space-y-4 list-disc pl-5">
              <li>
                Information gathered will not be sold or used for any purpose other than for sending out text messages to remind users of their responsibilities for cleaning ward buildings.
              </li>
              
              <li>
                Records may be shared with 3rd party AI systems solely for the purpose of improving the product.
              </li>
              
              <li>
                It is not the intent of the Ward Cleaning app to divulge or sell gathered information for gain.
              </li>
              
              <li>
                Users who share information will be giving the Ward Cleaning app explicit ownership of their data while it is in our possession.
              </li>
              
              <li>
                Users may delete their accounts at any time as it is not our intention to store their information indefinitely.
              </li>
              
              <li>
                The Ward Cleaning App provides this service "as is" without warranty of any kind.
              </li>
              
              <li>
                The app may send notifications related to cleaning duties and important updates to users.
              </li>
              
              <li>
                The Ward Cleaning App is not affiliated with any specific religious organization and is independently operated.
              </li>
              
              <li>
                By using this app, you agree to comply with all applicable laws and regulations.
              </li>
              
              <li>
                The Ward Cleaning App reserves the right to modify these terms at any time, with notice to users.
              </li>
            </ul>
          </div>
          
          <div className="flex items-start space-x-2">
            <Checkbox 
              id="terms" 
              checked={formData.hasAcceptedTerms}
              onCheckedChange={(checked) => 
                updateFormData({ hasAcceptedTerms: checked as boolean })
              }
            />
            <Label 
              htmlFor="terms" 
              className="text-sm font-normal cursor-pointer"
            >
              I have read and agree to the Terms and Conditions
            </Label>
          </div>
        </div>
      </div>
    );
  };

  // Render success step
  const renderSuccessStep = () => {
    return (
      <div className="text-center space-y-4">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold">Profile Created!</h1>
        <p className="text-muted-foreground">
          Your profile has been successfully created.
        </p>
        
        {sessionContext.sessionId && (
          <div className="mt-2 p-4 bg-blue-50 rounded-md border border-blue-100 text-left">
            <h3 className="font-medium text-blue-800 text-base mb-2 text-center">Ward Membership</h3>
            <p className="text-blue-700 text-sm mb-2">
              You've been added to the ward associated with the cleaning session.
            </p>
            <p className="text-blue-700 text-sm">
              You'll be redirected back to the cleaning tasks momentarily.
            </p>
          </div>
        )}
        
        <p className="text-muted-foreground mt-2">
          {sessionContext.sessionId 
            ? "Redirecting you to the cleaning session..." 
            : "Redirecting you to the dashboard..."}
        </p>
      </div>
    );
  };
  
  // Render email verified welcome message
  const renderEmailVerifiedMessage = () => {
    return (
      <div className="text-center space-y-6">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div>
          <h1 className="text-2xl font-bold mb-2">Email Verified Successfully!</h1>
          <p className="text-muted-foreground mb-4">
            Thank you for verifying your email. Now let's complete your profile.
          </p>
        </div>
        <Button 
          onClick={() => {
            setSuccess(null);
            setCurrentStep("personal");
          }}
          className="mx-auto"
        >
          Continue to Profile Setup
        </Button>
      </div>
    );
  };
  
  return (
    <div className="w-full max-w-md mx-auto p-6">
      {/* Show email verified message if coming from email verification */}
      {success && success.includes("Email verified successfully") ? (
        renderEmailVerifiedMessage()
      ) : (
        <>
          {renderProgressIndicator()}
          
          {error && <FormMessage message={{ error }} />}
          {success && !success.includes("Email verified") && <FormMessage message={{ success }} />}
          
          <div className="space-y-6">
            {currentStep === "personal" && renderPersonalInfoStep()}
            {currentStep === "phone" && renderPhoneVerificationStep()}
            {currentStep === "terms" && renderTermsStep()}
            {currentStep === "success" && renderSuccessStep()}
            
            {currentStep !== "success" && (
              <div className="flex justify-between pt-6">
                {currentStep !== "personal" && (
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={handleBack}
                  >
                    Back
                  </Button>
                )}
                {currentStep === "personal" && <div></div>}
                <Button 
                  type="button" 
                  onClick={handleNext}
                  disabled={loading}
                >
                  {currentStep === "terms" 
                    ? (loading ? "Creating Profile..." : "Complete Profile") 
                    : "Next"
                  }
                </Button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// Main component with Suspense
export default function OnboardingPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <OnboardingContent />
    </Suspense>
  );
} 