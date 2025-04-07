"use client";

export const dynamic = 'force-dynamic';

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

interface FormValues {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  wardName: string;
  role: string;
}

interface FormState {
  message: string;
  isError: boolean;
  isSubmitting: boolean;
  isSuccess: boolean;
}

export default function ComingSoonPage() {
  const [formValues, setFormValues] = useState<FormValues>({
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    wardName: "",
    role: ""
  });

  const [formState, setFormState] = useState<FormState>({
    message: "",
    isError: false,
    isSubmitting: false,
    isSuccess: false
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormValues((prev: FormValues) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!formValues.firstName || !formValues.lastName || !formValues.email) {
      setFormState({
        message: "Please fill in all required fields",
        isError: true,
        isSubmitting: false,
        isSuccess: false
      });
      return;
    }

    setFormState({
      message: "",
      isError: false,
      isSubmitting: true,
      isSuccess: false
    });

    try {
      // Simulate API call 
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // For development, let's just simulate success
      // In production, this would call the submitInterestForm function
      setFormState({
        message: "Thank you for your interest! We'll notify you when we launch.",
        isError: false,
        isSubmitting: false,
        isSuccess: true
      });
      
      // Reset form on success
      setFormValues({
        firstName: "",
        lastName: "",
        email: "",
        phoneNumber: "",
        wardName: "",
        role: ""
      });
      
    } catch (error) {
      setFormState({
        message: "An error occurred. Please try again later.",
        isError: true,
        isSubmitting: false,
        isSuccess: false
      });
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1 flex flex-col items-center py-12 px-4">
        <div className="w-full max-w-4xl mx-auto">
          {/* Logo and Header */}
          <div className="flex flex-col items-center text-center mb-12">
            <Link href="/">
              <Image 
                src="/images/logo.png" 
                alt="Ward Cleaning App Logo" 
                width={160} 
                height={160} 
                className="mb-6"
              />
            </Link>
            <h1 className="text-4xl font-bold mb-4">Coming Soon</h1>
            <div className="w-20 h-1 bg-primary rounded mb-6"></div>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-6">
              We're building something amazing to help wards organize and coordinate cleaning assignments more effectively.
            </p>
            <p className="text-lg max-w-2xl mx-auto">
              The Ward Cleaning App will be launching soon. Sign up below to be notified when we're ready!
            </p>
          </div>

          {/* Form Section */}
          <div className="bg-card border rounded-lg p-8 shadow-sm max-w-2xl mx-auto">
            <h2 className="text-2xl font-semibold mb-6 text-center">Stay Updated</h2>
            
            {formState.isSuccess ? (
              <div className="bg-green-50 border border-green-200 text-green-800 rounded-md p-4 mb-6">
                <p className="text-center">{formState.message}</p>
              </div>
            ) : formState.isError ? (
              <div className="bg-red-50 border border-red-200 text-red-800 rounded-md p-4 mb-6">
                <p className="text-center">{formState.message}</p>
              </div>
            ) : null}
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="firstName" className="text-sm font-medium">
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <input 
                    id="firstName" 
                    name="firstName" 
                    type="text" 
                    value={formValues.firstName}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border rounded-md"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="lastName" className="text-sm font-medium">
                    Last Name <span className="text-red-500">*</span>
                  </label>
                  <input 
                    id="lastName" 
                    name="lastName" 
                    type="text" 
                    value={formValues.lastName}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border rounded-md"
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium">
                  Email <span className="text-red-500">*</span>
                </label>
                <input 
                  id="email" 
                  name="email" 
                  type="email" 
                  value={formValues.email}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded-md"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="phoneNumber" className="text-sm font-medium">
                  Phone Number
                </label>
                <input 
                  id="phoneNumber" 
                  name="phoneNumber" 
                  type="tel" 
                  value={formValues.phoneNumber}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded-md"
                />
                <p className="text-xs text-muted-foreground">
                  Optional - for SMS notifications when we launch
                </p>
              </div>
              
              <div className="space-y-2">
                <label htmlFor="wardName" className="text-sm font-medium">
                  Ward Name
                </label>
                <input 
                  id="wardName" 
                  name="wardName" 
                  type="text" 
                  value={formValues.wardName}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="role" className="text-sm font-medium">
                  Your Role in Ward
                </label>
                <select
                  id="role"
                  name="role"
                  value={formValues.role}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="">Select a role (optional)</option>
                  <option value="Bishop">Bishop</option>
                  <option value="Counselor">Counselor</option>
                  <option value="Ward Clerk">Ward Clerk</option>
                  <option value="Building Representative">Building Representative</option>
                  <option value="Ward Member">Ward Member</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              
              <button 
                type="submit" 
                className="w-full mt-4 px-4 py-3 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={formState.isSubmitting}
              >
                {formState.isSubmitting ? "Submitting..." : "Notify Me When You Launch"}
              </button>
              
              <p className="text-xs text-center text-muted-foreground mt-4">
                By signing up, you agree to our {" "}
                <Link href="/terms" className="underline">Terms of Service</Link> and {" "}
                <Link href="/privacy" className="underline">Privacy Policy</Link>
              </p>
            </form>
          </div>
          
          <div className="text-center mt-12">
            <Link 
              href="/" 
              className="text-primary hover:underline"
            >
              Return to Home Page
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 