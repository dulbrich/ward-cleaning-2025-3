import { Checkbox } from "../ui/checkbox";
import { Label } from "../ui/label";
import { SignupFormData } from "./types";

interface TermsStepProps {
  formData: SignupFormData;
  updateFormData: (data: Partial<SignupFormData>) => void;
}

export function TermsStep({ formData, updateFormData }: TermsStepProps) {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold mb-2">Review and Accept Terms</h1>
        <p className="text-muted-foreground">
          Please review our terms and conditions before continuing
        </p>
      </div>

      <div className="space-y-4">
        <div className="border rounded-md p-4 bg-muted/20 h-64 overflow-y-auto text-sm">
          <h3 className="font-semibold mb-2">End User License Agreement</h3>
          
          <p className="mb-4">
            By accepting this agreement, you acknowledge and agree to the following terms:
          </p>
          
          <ul className="space-y-4 list-disc pl-5">
            <li>
              Information gathered will not be sold or used for any purpose other than for sending out text messages to remind users of their responsibilities for cleaning ward buildings.
            </li>
            
            <li>
              Records may be shared with 3rd party AI systems solely for the purpose of improving the product.
            </li>
            
            <li>
              It is not the intent of the Ward Cleaning app to divulge or sell gathered information for gain.
            </li>
            
            <li>
              Users who share information will be giving the Ward Cleaning app explicit ownership of their data while it is in our possession.
            </li>
            
            <li>
              Users may delete their accounts at any time as it is not our intention to store their information indefinitely.
            </li>
            
            <li>
              The Ward Cleaning App provides this service "as is" without warranty of any kind.
            </li>
            
            <li>
              The app may send notifications related to cleaning duties and important updates to users.
            </li>
            
            <li>
              The Ward Cleaning App is not affiliated with any specific religious organization and is independently operated.
            </li>
            
            <li>
              By using this app, you agree to comply with all applicable laws and regulations.
            </li>
            
            <li>
              The Ward Cleaning App reserves the right to modify these terms at any time, with notice to users.
            </li>
          </ul>
        </div>
        
        <div className="flex items-start space-x-2">
          <Checkbox 
            id="terms" 
            checked={formData.hasAcceptedTerms}
            onCheckedChange={(checked) => 
              updateFormData({ hasAcceptedTerms: checked as boolean })
            }
          />
          <Label 
            htmlFor="terms" 
            className="text-sm font-normal cursor-pointer"
          >
            I have read and agree to the Terms and Conditions
          </Label>
        </div>
      </div>
    </div>
  );
} 