import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { SignupFormData } from "./types";

interface EmailStepProps {
  formData: SignupFormData;
  updateFormData: (data: Partial<SignupFormData>) => void;
}

export function EmailStep({ formData, updateFormData }: EmailStepProps) {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold mb-2">Create Your Account</h1>
        <p className="text-muted-foreground">
          Join the many wards already using our platform to organize their building cleaning efforts.
        </p>
      </div>

      <div className="space-y-3">
        <div className="space-y-2">
          <Label htmlFor="email">Email Address</Label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            value={formData.email}
            onChange={(e) => updateFormData({ email: e.target.value })}
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            placeholder="Create a strong password"
            value={formData.password}
            onChange={(e) => updateFormData({ password: e.target.value })}
            required
            minLength={8}
          />
          <p className="text-xs text-muted-foreground">
            Password should be at least 8 characters with a mix of letters, numbers, and special characters.
          </p>
        </div>
      </div>
    </div>
  );
} 