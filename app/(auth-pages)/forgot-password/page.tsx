"use client";

import { forgotPasswordAction } from "@/app/actions";
import { FormMessage } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { SmtpMessage } from "../smtp-message";

export default function ForgotPassword() {
  const searchParams = useSearchParams();
  
  // Extract message from search params
  const messageType = searchParams.get('type');
  const messageContent = searchParams.get('message');
  
  const searchParamsMessage = messageType && messageContent 
    ? { type: messageType, message: messageContent } 
    : null;
    
  return (
    <>
      <form className="flex-1 flex flex-col w-full gap-2 text-foreground [&>input]:mb-6 min-w-64 max-w-64 mx-auto">
        <div>
          <h1 className="text-2xl font-medium">Reset Password</h1>
          <p className="text-sm text-secondary-foreground">
            Already have an account?{" "}
            <Link className="text-primary underline" href="/sign-in">
              Sign in
            </Link>
          </p>
        </div>
        <div className="flex flex-col gap-2 [&>input]:mb-3 mt-8">
          <Label htmlFor="email">Email</Label>
          <Input name="email" placeholder="you@example.com" required />
          <SubmitButton formAction={forgotPasswordAction}>
            Reset Password
          </SubmitButton>
          {searchParamsMessage && <FormMessage message={searchParamsMessage} />}
        </div>
      </form>
      <SmtpMessage />
    </>
  );
}
