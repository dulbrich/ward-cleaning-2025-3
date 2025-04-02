"use client";

import { resetPasswordAction } from "@/app/actions";
import { FormMessage } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter, useSearchParams } from "next/navigation";

export default function ResetPassword() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  // Extract message from search params
  const messageType = searchParams.get('type');
  const messageContent = searchParams.get('message');
  
  const searchParamsMessage = messageType && messageContent 
    ? { type: messageType, message: messageContent } 
    : null;

  // Create a wrapper function that handles the Promise<string> return
  const handleResetPassword = async (formData: FormData) => {
    try {
      const result = await resetPasswordAction(formData);
      if (result && result.includes("?")) {
        router.push(`/protected/reset-password${result}`);
      }
    } catch (error) {
      console.error("Error resetting password:", error);
    }
  };

  return (
    <form action={handleResetPassword} className="flex flex-col w-full max-w-md p-4 gap-2 [&>input]:mb-4">
      <h1 className="text-2xl font-medium">Reset password</h1>
      <p className="text-sm text-foreground/60">
        Please enter your new password below.
      </p>
      <Label htmlFor="password">New password</Label>
      <Input
        type="password"
        name="password"
        placeholder="New password"
        required
      />
      <Label htmlFor="confirmPassword">Confirm password</Label>
      <Input
        type="password"
        name="confirmPassword"
        placeholder="Confirm password"
        required
      />
      <SubmitButton>
        Reset password
      </SubmitButton>
      {searchParamsMessage && <FormMessage message={searchParamsMessage} />}
    </form>
  );
}
