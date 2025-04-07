"use server";

import { createClient } from "@/utils/supabase/server";
import { z } from "zod";

// Define schema for validation
const InterestSignupSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  phoneNumber: z.string().optional(),
  wardName: z.string().optional(),
  role: z.string().optional()
});

export type InterestSignupFormData = z.infer<typeof InterestSignupSchema>;

export async function submitInterestForm(formData: InterestSignupFormData) {
  try {
    // Validate the form data
    const validatedData = InterestSignupSchema.parse(formData);
    
    // Initialize Supabase client
    const supabase = await createClient();
    
    // Insert the data into the interest_signups table
    const { error } = await supabase
      .from('interest_signups')
      .insert([
        {
          first_name: validatedData.firstName,
          last_name: validatedData.lastName,
          email: validatedData.email,
          phone_number: validatedData.phoneNumber || null,
          ward_name: validatedData.wardName || null,
          role: validatedData.role || null
        }
      ]);
    
    if (error) {
      console.error("Error inserting interest signup:", error);
      
      // Check for duplicate email error
      if (error.code === "23505") {
        return { 
          success: false, 
          message: "This email is already registered. We'll notify you when we launch!" 
        };
      }
      
      return { 
        success: false, 
        message: "Failed to register your interest. Please try again later." 
      };
    }
    
    return { 
      success: true, 
      message: "Thank you for your interest! We'll notify you when we launch." 
    };
  } catch (error: unknown) {
    console.error("Error in submitInterestForm:", error);
    
    if (error instanceof z.ZodError) {
      // Return validation errors
      return { 
        success: false, 
        message: (error as z.ZodError).errors[0].message || "Invalid form data" 
      };
    }
    
    return { 
      success: false, 
      message: "An unexpected error occurred. Please try again later." 
    };
  }
} 