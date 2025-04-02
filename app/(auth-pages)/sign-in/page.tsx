"use client";

import { signInAction } from "@/app/actions";
import { FormMessage, Message } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

export default function Login() {
  const searchParams = useSearchParams();
  
  // Extract message from search params
  const messageType = searchParams.get('type');
  const messageContent = searchParams.get('message');
  
  const searchParamsMessage: Message | null = messageType && messageContent 
    ? messageType === 'error' 
      ? { error: messageContent }
      : messageType === 'success'
        ? { success: messageContent }
        : { message: messageContent }
    : null;

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] w-full px-4">
      <div className="w-full max-w-sm mx-auto">
        <form action={signInAction} className="flex flex-col w-full">
          <h1 className="text-2xl font-medium mb-2">Sign in</h1>
          <p className="text-sm text-foreground mb-6">
            Don't have an account?{" "}
            <Link className="text-foreground font-medium underline" href="/sign-up">
              Sign up
            </Link>
          </p>
          
          <div className="flex flex-col gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input name="email" placeholder="you@example.com" required />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="password">Password</Label>
                <Link
                  className="text-xs text-foreground underline"
                  href="/forgot-password"
                >
                  Forgot Password?
                </Link>
              </div>
              <Input
                type="password"
                name="password"
                placeholder="Your password"
                required
              />
            </div>
            
            <SubmitButton pendingText="Signing In..." className="mt-2">
              Sign in
            </SubmitButton>
            
            {searchParamsMessage && <FormMessage message={searchParamsMessage} />}
          </div>
        </form>
      </div>
    </div>
  );
}
