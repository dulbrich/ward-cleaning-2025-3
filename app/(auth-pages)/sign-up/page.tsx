"use client";

import { signUpAction } from "@/app/actions";
import { FormMessage, Message } from "@/components/form-message";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
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
  const [message, setMessage] = useState<Message | null>(null);

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
        </div>
      </div>

      <SimpleSignupForm setMessage={setMessage} />
      
      <div className="mt-6">
        <SmtpMessage />
      </div>
    </div>
  );
}

function SimpleSignupForm({ setMessage }: { setMessage: (message: Message) => void }) {
  const [loading, setLoading] = useState(false);

  const handleFormSubmit = async (formData: FormData) => {
    try {
      setLoading(true);
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
    } finally {
      setLoading(false);
    }
  };

  return (
    <form action={handleFormSubmit} className="flex flex-col w-full max-w-sm mx-auto">
      <h1 className="text-2xl font-medium mb-6">Create an account</h1>
      <div className="flex flex-col gap-4">
        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-medium">Email</label>
          <input 
            id="email" 
            name="email" 
            type="email" 
            placeholder="you@example.com" 
            required 
            className="w-full px-3 py-2 border rounded-md"
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="password" className="text-sm font-medium">Password</label>
          <input 
            id="password" 
            name="password" 
            type="password" 
            placeholder="Your password" 
            minLength={6} 
            required 
            className="w-full px-3 py-2 border rounded-md"
          />
          <p className="text-xs text-muted-foreground">
            Password must be at least 6 characters long
          </p>
        </div>
        <button 
          type="submit" 
          className="mt-2 bg-primary text-white px-4 py-2 rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={loading}
        >
          {loading ? "Signing up..." : "Sign up"}
        </button>
      </div>
      <p className="text-xs text-muted-foreground text-center mt-4">
        By signing up, you agree to our{" "}
        <Link href="/terms" className="underline">Terms of Service</Link>{" "}
        and{" "}
        <Link href="/privacy" className="underline">Privacy Policy</Link>
      </p>
    </form>
  );
}
