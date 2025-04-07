"use client";

export const dynamic = 'force-dynamic';

import { forgotPasswordAction } from "@/app/actions";
import { FormMessage } from "@/components/form-message";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { Suspense } from "react";
import { SmtpMessage } from "../smtp-message";

// Import useSearchParams inside the client component
import { useSearchParams } from "next/navigation";

// Client component to handle search params
function ForgotPasswordContent() {
  const searchParams = useSearchParams();
  const message = searchParams?.get("message");
  const type = searchParams?.get("type");

  return (
    <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
      <div className="flex flex-col space-y-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">
          Forgot Password
        </h1>
        <p className="text-sm text-muted-foreground">
          Enter your email address and we'll send you a link to reset your
          password.
        </p>
      </div>

      <div className="grid gap-6">
        <FormMessage
          message={
            type && message
              ? {
                  [type === "error" ? "error" : "success"]: message,
                }
              : null
          }
        />

        <form action={forgotPasswordAction}>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                placeholder="name@example.com"
                type="email"
                autoCapitalize="none"
                autoComplete="email"
                autoCorrect="off"
                required
              />
            </div>
            <SmtpMessage />
            <Button type="submit" className="w-full">
              Send Reset Link
            </Button>
          </div>
        </form>

        <div className="text-center text-sm">
          <Link
            href="/sign-in"
            className="underline underline-offset-4 hover:text-primary"
          >
            Back to sign in
          </Link>
        </div>
      </div>
    </div>
  );
}

// Main component with Suspense
export default function ForgotPassword() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ForgotPasswordContent />
    </Suspense>
  );
}
