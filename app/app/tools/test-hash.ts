"use server";

import { generateUserHash } from "./actions";

export async function testHash(firstName: string, lastName: string, phoneNumber: string) {
  try {
    // Generate the hash
    const hash = await generateUserHash(firstName, lastName, phoneNumber);
    
    return { success: true, hash };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error generating hash" 
    };
  }
} 