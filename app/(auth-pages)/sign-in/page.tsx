"use client";

export const dynamic = 'force-dynamic';

import { signInAction } from "@/app/actions";
import { FormMessage } from "@/components/form-message";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

// Client component to handle search params
function SignInContent() {
  const searchParams = useSearchParams();
  const message = searchParams?.get("message");
  const type = searchParams?.get("type");
  const sessionId = searchParams?.get("sessionId");
  const tempUserId = searchParams?.get("tempUserId");
  const returnUrl = searchParams?.get("returnUrl");
  
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

      <form
        className="flex-1 flex flex-col w-full justify-center gap-2 text-foreground"
        action={signInAction}
      >
        <div className="text-center mb-4">
          <h1 className="text-2xl font-medium mb-1">Welcome back</h1>
          <p className="text-sm text-secondary-foreground">
            Enter your credentials to sign in
          </p>
        </div>

        <FormMessage
          message={
            type && message
              ? {
                  [type === "error" ? "error" : "success"]: message,
                }
              : null
          }
        />

        <Label className="text-md" htmlFor="email">
          Email
        </Label>
        <Input
          className="mb-3"
          name="email"
          placeholder="you@example.com"
          required
        />
        <Label className="text-md" htmlFor="password">
          Password
        </Label>
        <Input
          className="mb-6"
          type="password"
          name="password"
          placeholder="••••••••"
          required
        />
        <input type="hidden" name="origin" value={returnUrl || '/'} />
        {sessionId && <input type="hidden" name="sessionId" value={sessionId} />}
        {tempUserId && <input type="hidden" name="tempUserId" value={tempUserId} />}
        {sessionId && returnUrl && returnUrl.includes('sessionId') && (
          <div className="mb-4 p-3 bg-blue-50 rounded-md text-sm text-blue-700 border border-blue-100">
            <p>You're signing in from a ward cleaning session. After signing in, you'll be redirected back to your tasks.</p>
          </div>
        )}
        <Button className="mb-2">Sign In</Button>
        <div className="text-center text-sm mt-4">
          <Link
            href="/forgot-password"
            className="underline underline-offset-4 hover:text-primary text-sm"
          >
            Forgot your password?
          </Link>
          <div className="mt-2">
            Don't have an account?{" "}
            <Link
              href={`/sign-up${searchParams ? `?${new URLSearchParams({
                sessionId: sessionId || '',
                tempUserId: tempUserId || '',
                returnUrl: returnUrl || '/'
              }).toString()}` : ''}`}
              className="underline underline-offset-4 hover:text-primary text-sm"
            >
              Sign Up
            </Link>
          </div>
        </div>
      </form>
    </div>
  );
}

// Main component with Suspense
export default function SignIn() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SignInContent />
    </Suspense>
  );
}
