"use client";

export const dynamic = 'force-dynamic';

import { signUpAction } from "@/app/actions";
import { FormMessage } from "@/components/form-message";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

// Client component to handle search params
function SignUpContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const message = searchParams?.get("message");
  const type = searchParams?.get("type");
  const sessionId = searchParams?.get("sessionId");
  const tempUserId = searchParams?.get("tempUserId");
  const returnUrl = searchParams?.get("returnUrl");
  
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [passwordMessage, setPasswordMessage] = useState("");
  
  // Wrapper for signUpAction that returns Promise<void>
  const handleSignUp = async (formData: FormData) => {
    const result = await signUpAction(formData);
    // After form submission, just let the redirect happen or stay on the page with error message
  };
  
  const checkPasswordStrength = (password: string) => {
    let strength = 0;
    
    // Check length
    if (password.length >= 8) strength += 1;
    
    // Check for mixed case
    if (password.match(/[a-z]/) && password.match(/[A-Z]/)) strength += 1;
    
    // Check for numbers
    if (password.match(/\d/)) strength += 1;
    
    // Check for special characters
    if (password.match(/[^a-zA-Z\d]/)) strength += 1;
    
    setPasswordStrength(strength);
    
    switch (strength) {
      case 0:
      case 1:
        setPasswordMessage("Weak password");
        break;
      case 2:
        setPasswordMessage("Fair password");
        break;
      case 3:
        setPasswordMessage("Good password");
        break;
      case 4:
        setPasswordMessage("Strong password");
        break;
      default:
        setPasswordMessage("");
    }
  };
  
  return (
    <div className="flex-1 flex flex-col w-full px-8 sm:max-w-md justify-center gap-2">
      <Link
        href="/"
        className="absolute left-8 top-8 py-2 px-4 rounded-md no-underline text-foreground bg-btn-background hover:bg-btn-background-hover flex items-center group text-sm"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1"
        >
          <polyline points="15 18 9 12 15 6" />
        </svg>{" "}
        Back
      </Link>

      {type === "success" && message ? (
        <div className="bg-green-50 p-4 rounded-md border border-green-200 my-8">
          <h2 className="font-semibold text-green-800 text-lg mb-2">Success!</h2>
          <p className="text-green-700">{message}</p>
          <Button asChild className="mt-4">
            <Link href="/sign-in">Sign In</Link>
          </Button>
        </div>
      ) : (
        <form
          className="flex-1 flex flex-col w-full justify-center gap-2 text-foreground"
          action={handleSignUp}
        >
          <div className="text-center mb-4">
            <h1 className="text-2xl font-medium mb-1">Create your account</h1>
            <p className="text-sm text-secondary-foreground">
              Join Ward Cleaning to get started
            </p>
          </div>

          <FormMessage
            message={
              type && message && type !== "success"
                ? {
                    [type === "error" ? "error" : "success"]: message,
                  }
                : null
            }
          />

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label className="text-md" htmlFor="firstName">
                First Name
              </Label>
              <Input
                name="firstName"
                placeholder="First Name"
                required
              />
            </div>
            
            <div className="space-y-1">
              <Label className="text-md" htmlFor="lastName">
                Last Name
              </Label>
              <Input
                name="lastName"
                placeholder="Last Name"
                required
              />
            </div>
          </div>
          
          <div className="space-y-1 mt-2">
            <Label className="text-md" htmlFor="phoneNumber">
              Phone Number
            </Label>
            <Input
              name="phoneNumber"
              placeholder="(123) 456-7890"
              required
            />
          </div>

          <div className="space-y-1 mt-2">
            <Label className="text-md" htmlFor="email">
              Email
            </Label>
            <Input
              name="email"
              placeholder="you@example.com"
              required
            />
          </div>
          
          <div className="space-y-1 mt-2">
            <Label className="text-md" htmlFor="password">
              Password
            </Label>
            <Input
              type="password"
              name="password"
              placeholder="••••••••"
              required
              onChange={(e) => checkPasswordStrength(e.target.value)}
            />
            {passwordMessage && (
              <div className="mt-1">
                <div className="h-1 grid grid-cols-4 gap-1">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div 
                      key={i}
                      className={`h-full rounded-sm ${
                        i < passwordStrength 
                          ? passwordStrength <= 1 
                            ? 'bg-red-400' 
                            : passwordStrength === 2 
                              ? 'bg-yellow-400' 
                              : passwordStrength === 3 
                                ? 'bg-blue-400' 
                                : 'bg-green-400'
                          : 'bg-gray-200'
                      }`}
                    />
                  ))}
                </div>
                <p className={`text-xs mt-1 ${
                  passwordStrength <= 1 
                    ? 'text-red-500' 
                    : passwordStrength === 2 
                      ? 'text-yellow-500' 
                      : passwordStrength === 3 
                        ? 'text-blue-500' 
                        : 'text-green-500'
                }`}>
                  {passwordMessage}
                </p>
              </div>
            )}
          </div>
          
          <input type="hidden" name="origin" value={typeof window !== 'undefined' ? window.location.origin : ""} />
          {sessionId && <input type="hidden" name="sessionId" value={sessionId} />}
          {tempUserId && <input type="hidden" name="tempUserId" value={tempUserId} />}
          {returnUrl && <input type="hidden" name="returnUrl" value={returnUrl} />}
          
          <Button className="mt-6">Sign Up</Button>
          
          <div className="text-center text-sm mt-4">
            Already have an account?{" "}
            <Link
              href={`/sign-in${searchParams ? `?${new URLSearchParams({
                sessionId: sessionId || '',
                tempUserId: tempUserId || '',
                returnUrl: returnUrl || '/'
              }).toString()}` : ''}`}
              className="underline underline-offset-4 hover:text-primary text-sm"
            >
              Sign In
            </Link>
          </div>
        </form>
      )}
    </div>
  );
}

// Main component with Suspense
export default function SignUp() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SignUpContent />
    </Suspense>
  );
}
