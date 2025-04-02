"use client";

import { createUserProfileAction, signUpAction } from "@/app/actions";
import { FormMessage, Message } from "@/components/form-message";
import { MultiStepSignup } from "@/components/signup/multi-step-signup";
import { SignupFormData } from "@/components/signup/types";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { SmtpMessage } from "../smtp-message";

// Suspense fallback component
function SignupLoading() {
  return (
    <div className="flex flex-col w-full max-w-md mx-auto">
      <div className="mb-6 text-center">
        <p>Loading signup form...</p>
      </div>
    </div>
  );
}

// Main component wrapped with Suspense
export default function SignupPage() {
  return (
    <Suspense fallback={<SignupLoading />}>
      <Signup />
    </Suspense>
  );
}

function Signup() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [message, setMessage] = useState<Message | null>(null);
  const [isSimpleForm, setIsSimpleForm] = useState(false);

  // Handle search params on initial load
  useEffect(() => {
    const type = searchParams.get("type");
    const messageText = searchParams.get("message");
    
    if (type && messageText) {
      if (type === "error") {
        setMessage({ error: messageText });
      } else if (type === "success") {
        setMessage({ success: messageText });
      } else {
        setMessage({ message: messageText });
      }
    }
  }, [searchParams]);

  const handleMultiStepFormSubmit = async (formData: SignupFormData): Promise<void> => {
    try {
      // First, create the Supabase Auth user
      const formDataObj = new FormData();
      formDataObj.append("email", formData.email);
      formDataObj.append("password", formData.password);
      
      const result = await signUpAction(formDataObj);
      
      // Parse the redirected URL to get message data
      if (result) {
        const urlParams = new URLSearchParams(result.split("?")[1]);
        const messageType = urlParams.get("type");
        const messageContent = urlParams.get("message");
        
        if (messageType && messageContent) {
          if (messageType === "error") {
            setMessage({ error: messageContent });
          } else {
            setMessage({ success: messageContent });
            
            // If sign-up was successful, create the user profile
            if (messageType === "success") {
              await createUserProfileAction(formData);
            }
          }
        }
      }
    } catch (error) {
      console.error("Error in signup process:", error);
      setMessage({ error: "An error occurred during signup" });
    }
  };

  // Show message if there is one
  if (message) {
    return (
      <div className="w-full flex-1 flex items-center sm:max-w-md justify-center gap-2 p-4">
        <FormMessage message={message} />
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full max-w-md mx-auto">
      <div className="mb-6 text-center">
        <div className="flex justify-between items-center">
          <Link className="text-sm text-foreground hover:underline" href="/sign-in">
            Already have an account? Sign in
          </Link>
          <button 
            onClick={() => setIsSimpleForm(!isSimpleForm)}
            className="text-xs text-muted-foreground hover:underline"
          >
            {isSimpleForm ? "Use detailed signup" : "Simple signup"}
          </button>
        </div>
      </div>

      {isSimpleForm ? (
        <SimpleSignupForm setMessage={setMessage} />
      ) : (
        <MultiStepSignup onSubmit={handleMultiStepFormSubmit} />
      )}
      
      <div className="mt-6">
        <SmtpMessage />
      </div>
    </div>
  );
}

// Simple form for backward compatibility
function SimpleSignupForm({ setMessage }: { setMessage: (message: Message) => void }) {
  const handleFormSubmit = async (formData: FormData) => {
    try {
      const result = await signUpAction(formData);
      
      // Parse the redirected URL to get message data
      if (result) {
        const urlParams = new URLSearchParams(result.split("?")[1]);
        const messageType = urlParams.get("type");
        const messageContent = urlParams.get("message");
        
        if (messageType && messageContent) {
          if (messageType === "error") {
            setMessage({ error: messageContent });
          } else {
            setMessage({ success: messageContent });
          }
        }
      }
    } catch (error) {
      console.error("Error in signup process:", error);
      setMessage({ error: "An error occurred during signup" });
    }
  };

  return (
    <form action={handleFormSubmit} className="flex flex-col min-w-64 max-w-64 mx-auto">
      <h1 className="text-2xl font-medium">Sign up</h1>
      <div className="flex flex-col gap-2 [&>input]:mb-3 mt-8">
        <label htmlFor="email">Email</label>
        <input 
          id="email" 
          name="email" 
          type="email" 
          placeholder="you@example.com" 
          required 
          className="px-3 py-2 border rounded-md"
        />
        <label htmlFor="password">Password</label>
        <input 
          id="password" 
          name="password" 
          type="password" 
          placeholder="Your password" 
          minLength={6} 
          required 
          className="px-3 py-2 border rounded-md"
        />
        <button 
          type="submit" 
          className="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary/90"
        >
          Sign up
        </button>
      </div>
    </form>
  );
}
