"use server";

import { generateAnonymousHash } from "./actions";

export async function calculateTestHash() {
  const firstName = "David";
  const lastName = "Ulbrich";
  const phoneNumber = "801-971-9802";
  
  const hash = await generateAnonymousHash(firstName, lastName, phoneNumber);
  
  return {
    input: {
      firstName,
      lastName,
      phoneNumber
    },
    hash
  };
} 