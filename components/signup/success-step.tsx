import Link from "next/link";
import { Button } from "../ui/button";

export function SuccessStep() {
  return (
    <div className="space-y-6 text-center">
      <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-600">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
      </div>
      
      <div>
        <h1 className="text-2xl font-bold mb-2">Welcome to Ward Cleaning!</h1>
        <p className="text-muted-foreground">
          Your account has been successfully created
        </p>
      </div>
      
      <div className="bg-muted/20 p-4 rounded-md text-left">
        <h3 className="font-medium mb-2">What's Next?</h3>
        <ul className="space-y-2 text-sm list-disc list-inside">
          <li>Complete your profile and set your preferences</li>
          <li>Join your ward's cleaning schedule</li>
          <li>Set up notifications for cleaning reminders</li>
          <li>Explore available cleaning tasks in your ward</li>
        </ul>
      </div>
      
      <Button asChild className="w-full">
        <Link href="/protected">
          Continue to Dashboard
        </Link>
      </Button>
    </div>
  );
} 