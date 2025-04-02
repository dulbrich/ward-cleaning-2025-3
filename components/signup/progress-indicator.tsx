import { SignupStep } from "./types";

interface ProgressIndicatorProps {
  currentStep: SignupStep;
}

export function ProgressIndicator({ currentStep }: ProgressIndicatorProps) {
  const steps: SignupStep[] = ['email', 'personal', 'phone', 'terms'];
  const currentStepIndex = steps.indexOf(currentStep);
  
  if (currentStep === 'success') return null;

  return (
    <div className="flex items-center justify-center mb-8 w-full">
      <div className="flex items-center w-full max-w-xs">
        {steps.map((step, index) => (
          <div key={step} className="flex items-center flex-1">
            <div className={`
              flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs
              ${index <= currentStepIndex ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'}
            `}>
              {index + 1}
            </div>
            {index < steps.length - 1 && (
              <div className={`
                flex-1 h-1 mx-2
                ${index < currentStepIndex ? 'bg-primary' : 'bg-muted'}
              `} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
} 