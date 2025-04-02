import { Button } from "../ui/button";
import { StepNavigationProps } from "./types";

export function StepNavigation({ 
  currentStep, 
  onNext, 
  onBack, 
  isNextDisabled = false 
}: StepNavigationProps) {
  const isFirstStep = currentStep === 'email';
  const isLastStep = currentStep === 'terms';
  const isSuccess = currentStep === 'success';

  if (isSuccess) return null;

  return (
    <div className="flex justify-between mt-8">
      {!isFirstStep && (
        <Button 
          type="button" 
          variant="outline" 
          onClick={onBack}
        >
          Back
        </Button>
      )}
      {isFirstStep && <div></div>}
      <Button 
        type="button" 
        onClick={onNext} 
        disabled={isNextDisabled}
      >
        {isLastStep ? 'Create Account' : 'Next'}
      </Button>
    </div>
  );
} 