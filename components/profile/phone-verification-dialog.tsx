"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

interface PhoneVerificationDialogProps {
  phoneNumber: string;
  onVerified: (verifiedPhone: string) => void;
  onCancel: () => void;
}

export function PhoneVerificationDialog({ phoneNumber, onVerified, onCancel }: PhoneVerificationDialogProps) {
  const [step, setStep] = useState<"send" | "verify">("send");
  const [verificationCode, setVerificationCode] = useState<string>("");
  const [timeLeft, setTimeLeft] = useState<number>(180); // 3 minutes
  const [isSending, setIsSending] = useState<boolean>(false);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [codeExpired, setCodeExpired] = useState<boolean>(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Handle countdown timer
  useEffect(() => {
    if (step === "verify" && timeLeft > 0) {
      timerRef.current = setTimeout(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setCodeExpired(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [step, timeLeft]);

  // Format time as MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSendCode = async () => {
    setIsSending(true);
    
    try {
      // Call API to send verification code
      const response = await fetch("/api/profile/verify-phone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone_number: phoneNumber }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to send verification code");
      }
      
      // Reset timer and move to verification step
      setTimeLeft(180);
      setCodeExpired(false);
      setStep("verify");
      toast.success("Verification code sent to your phone");
    } catch (error) {
      console.error("Error sending verification code:", error);
      toast.error("Failed to send verification code. Please try again.");
    } finally {
      setIsSending(false);
    }
  };

  const handleResendCode = () => {
    setVerificationCode("");
    setCodeExpired(false);
    handleSendCode();
  };

  const handleVerifyCode = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      toast.error("Please enter a valid 6-digit verification code");
      return;
    }
    
    setIsVerifying(true);
    
    try {
      // Call API to verify code
      const response = await fetch("/api/profile/confirm-phone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          phone_number: phoneNumber,
          code: verificationCode
        }),
      });
      
      if (!response.ok) {
        throw new Error("Invalid verification code");
      }
      
      // Verification successful
      toast.success("Phone number verified successfully");
      onVerified(phoneNumber);
    } catch (error) {
      console.error("Error verifying code:", error);
      toast.error("Invalid verification code. Please try again.");
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onCancel}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Verify Your Phone Number</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            We'll send you a 6-digit code to verify your phone
          </p>
          
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              value={phoneNumber}
              readOnly
              className="bg-muted"
            />
          </div>
          
          {step === "verify" && (
            <>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="code">Verification Code</Label>
                  <span className={`text-xs ${codeExpired ? 'text-destructive' : 'text-muted-foreground'}`}>
                    {codeExpired ? "Code expired" : `Code expires in ${formatTime(timeLeft)}`}
                  </span>
                </div>
                <Input
                  id="code"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').substring(0, 6))}
                  placeholder="Enter 6-digit code"
                  maxLength={6}
                  className="text-center tracking-widest text-lg"
                />
              </div>
              
              {codeExpired && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleResendCode}
                  disabled={isSending}
                >
                  {isSending ? "Sending..." : "Resend Code"}
                </Button>
              )}
            </>
          )}
        </div>
        
        <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-between gap-2">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          
          {step === "send" ? (
            <Button onClick={handleSendCode} disabled={isSending}>
              {isSending ? "Sending..." : "Send Code"}
            </Button>
          ) : (
            <Button onClick={handleVerifyCode} disabled={isVerifying || codeExpired || verificationCode.length !== 6}>
              {isVerifying ? "Verifying..." : "Verify & Save"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 