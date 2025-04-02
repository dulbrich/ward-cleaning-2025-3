import { useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { SignupFormData, VerificationState } from "./types";

interface PhoneVerificationStepProps {
  formData: SignupFormData;
  updateFormData: (data: Partial<SignupFormData>) => void;
}

export function PhoneVerificationStep({ formData, updateFormData }: PhoneVerificationStepProps) {
  const [verificationState, setVerificationState] = useState<VerificationState>({
    codeSent: false,
    isVerifying: false,
    verificationCode: '',
    error: null
  });
  
  const [timeLeft, setTimeLeft] = useState<number>(180); // 3 minutes in seconds
  
  // In a real app, this would connect to a backend verification service
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
} 