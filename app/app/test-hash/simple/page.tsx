"use client";

import { useEffect, useState } from 'react';

export default function SimpleHashPage() {
  const [hash, setHash] = useState<string>("");
  const [combined, setCombined] = useState<string>("");
  
  useEffect(() => {
    // Input data
    const firstName = "David";
    const lastName = "Ulbrich";
    const phoneNumber = "801-971-9802";
    
    // Extract parts according to the algorithm
    const firstNamePart = firstName.slice(0, 3).toUpperCase();
    const lastNamePart = lastName.slice(0, 3).toUpperCase();
    
    // Clean phone number and get last 4 digits
    const cleanPhoneNumber = phoneNumber.replace(/\D/g, '');
    const phonePart = cleanPhoneNumber.slice(-4);
    
    // Combine parts
    const combinedString = `${firstNamePart}${lastNamePart}${phonePart}`;
    setCombined(combinedString);
    
    // Hash using SHA-256
    const encoder = new TextEncoder();
    const data = encoder.encode(combinedString);
    
    crypto.subtle.digest('SHA-256', data).then(hashBuffer => {
      // Convert hash to hex string
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      setHash(hashHex);
    });
  }, []);
  
  return (
    <div className="p-8">
      <div className="mb-4">
        <h2 className="font-bold text-lg">Input: David Ulbrich 801-971-9802</h2>
        <p className="font-mono text-sm bg-gray-100 dark:bg-gray-800 p-2 rounded">
          Combined: {combined || "Calculating..."}
        </p>
      </div>
      <div>
        <h2 className="font-bold text-lg">Hash (SHA-256):</h2>
        <p className="font-mono text-sm bg-gray-100 dark:bg-gray-800 p-2 rounded break-all">
          {hash || "Calculating hash..."}
        </p>
      </div>
    </div>
  );
} 