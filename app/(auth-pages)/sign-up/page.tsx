"use client";

import { redirect } from "next/navigation";

export default function SignupPage() {
  redirect('/coming-soon');
  // This will never be rendered
  return null;
}
