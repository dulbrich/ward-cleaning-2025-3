"use client";

import { useState } from "react";
import { EmailStep } from "./email-step";
import { PersonalInfoStep } from "./personal-info-step";
import { PhoneVerificationStep } from "./phone-verification-step";
import { ProgressIndicator } from "./progress-indicator";
import { StepNavigation } from "./step-navigation";
import { SuccessStep } from "./success-step";
import { TermsStep } from "./terms-step";
import { SignupFormData, SignupStep } from "./types";

// Initialize with empty form data
const initialFormData: SignupFormData = {
  email: "",
  password: "",
  firstName: "",
  lastName: "",
  username: "",
  avatarUrl: "/images/avatars/avatar1.png", // Updated to existing avatar
  phoneNumber: "",
  isPhoneVerified: false,
  hasAcceptedTerms: false
};

interface MultiStepSignupProps {
  onSubmit: (formData: SignupFormData) => Promise<void>;
}

export function MultiStepSignup({ onSubmit }: MultiStepSignupProps) {
  const [currentStep, setCurrentStep] = useState<SignupStep>("email");
  const [formData, setFormData] = useState<SignupFormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const updateFormData = (data: Partial<SignupFormData>) => {
    setFormData(prev => ({ ...prev, ...data }));
  };
  
  const handleNext = async () => {
    if (currentStep === "email") {
      if (!formData.email || !formData.password) {
        alert("Please fill in all required fields.");
        return;
      }
      setCurrentStep("personal");
    } 
    else if (currentStep === "personal") {
      if (!formData.firstName || !formData.lastName || !formData.username) {
        alert("Please fill in all required fields.");
        return;
      }
      setCurrentStep("phone");
    } 
    else if (currentStep === "phone") {
      if (!formData.isPhoneVerified) {
        alert("Please verify your phone number before proceeding.");
        return;
      }
      setCurrentStep("terms");
    } 
    else if (currentStep === "terms") {
      if (!formData.hasAcceptedTerms) {
        alert("You must accept the terms and conditions to continue.");
        return;
      }
      
      try {
        setIsSubmitting(true);
        await onSubmit(formData);
        setCurrentStep("success");
      } catch (error) {
        console.error("Error creating account:", error);
        alert("There was an error creating your account. Please try again.");
      } finally {
        setIsSubmitting(false);
      }
    }
  };
  
  const handleBack = () => {
    if (currentStep === "personal") setCurrentStep("email");
    else if (currentStep === "phone") setCurrentStep("personal");
    else if (currentStep === "terms") setCurrentStep("phone");
  };
  
  const isNextDisabled = () => {
    if (currentStep === "email") {
      return !formData.email || !formData.password;
    } else if (currentStep === "personal") {
      return !formData.firstName || !formData.lastName || !formData.username;
    } else if (currentStep === "phone") {
      return !formData.isPhoneVerified;
    } else if (currentStep === "terms") {
      return !formData.hasAcceptedTerms || isSubmitting;
    }
    return false;
  };
  
  return (
    <div className="max-w-md mx-auto p-4">
      <ProgressIndicator currentStep={currentStep} />
      
      <div className="mb-6">
        {currentStep === "email" && (
          <EmailStep formData={formData} updateFormData={updateFormData} />
        )}
        
        {currentStep === "personal" && (
          <PersonalInfoStep formData={formData} updateFormData={updateFormData} />
        )}
        
        {currentStep === "phone" && (
          <PhoneVerificationStep formData={formData} updateFormData={updateFormData} />
        )}
        
        {currentStep === "terms" && (
          <TermsStep formData={formData} updateFormData={updateFormData} />
        )}
        
        {currentStep === "success" && (
          <SuccessStep />
        )}
      </div>
      
      <StepNavigation 
        currentStep={currentStep}
        onNext={handleNext}
        onBack={handleBack}
        isNextDisabled={isNextDisabled()}
      />
    </div>
  );
} 