"use client";

import { useEffect, useState } from 'react';

export default function HashContent() {
  const [hash, setHash] = useState<string>("");
  const [combinedString, setCombinedString] = useState<string>("");
  
  useEffect(() => {
    const firstName = "David";
    const lastName = "Ulbrich";
    const phoneNumber = "801-971-9802";
    
    // Extract parts according to the algorithm
    const firstNamePart = firstName.slice(0, 3).toUpperCase();
    const lastNamePart = lastName.slice(0, 3).toUpperCase();
    
    // Extract last 4 digits of phone number
    const cleanPhoneNumber = phoneNumber.replace(/\D/g, '');
    const phonePart = cleanPhoneNumber.slice(-4);
    
    // Combine parts
    const combined = `${firstNamePart}${lastNamePart}${phonePart}`;
    setCombinedString(combined);
    
    // Hash using SHA-256 (using the Web Crypto API)
    const encoder = new TextEncoder();
    const data = encoder.encode(combined);
    
    crypto.subtle.digest('SHA-256', data).then(hashBuffer => {
      // Convert hash to hex string
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      setHash(hashHex);
    });
  }, []);
  
  return (
    <div className="p-8 space-y-4">
      <h1 className="text-2xl font-bold">Hash for David Ulbrich 801-971-9802</h1>
      
      <div className="p-4 border rounded-md bg-card">
        <h2 className="text-xl font-semibold mb-2">Input Data</h2>
        <div className="grid grid-cols-2 gap-2">
          <div className="font-medium">First Name:</div>
          <div>David</div>
          
          <div className="font-medium">Last Name:</div>
          <div>Ulbrich</div>
          
          <div className="font-medium">Phone Number:</div>
          <div>801-971-9802</div>
        </div>
      </div>
      
      <div className="p-4 border rounded-md bg-card">
        <h2 className="text-xl font-semibold mb-2">Combined String</h2>
        <div className="p-3 bg-muted rounded border font-mono break-all text-sm">
          {combinedString || "Calculating..."}
        </div>
      </div>
      
      <div className="p-4 border rounded-md bg-card">
        <h2 className="text-xl font-semibold mb-2">Generated Hash</h2>
        {hash ? (
          <div className="p-3 bg-muted rounded border font-mono break-all text-sm">
            {hash}
          </div>
        ) : (
          <div className="p-3 bg-muted rounded border text-sm animate-pulse">
            Calculating hash...
          </div>
        )}
      </div>
      
      <div className="p-4 border rounded-md bg-amber-50 dark:bg-amber-950 text-amber-800 dark:text-amber-300">
        <h2 className="text-lg font-semibold mb-2">How This Works</h2>
        <p>The hash is generated from:</p>
        <ul className="list-disc ml-5 mt-2 space-y-1">
          <li>First 3 letters of first name (uppercase): <span className="font-mono bg-amber-100 dark:bg-amber-900 px-1 rounded">DAV</span></li>
          <li>First 3 letters of last name (uppercase): <span className="font-mono bg-amber-100 dark:bg-amber-900 px-1 rounded">ULB</span></li>
          <li>Last 4 digits of phone: <span className="font-mono bg-amber-100 dark:bg-amber-900 px-1 rounded">9802</span></li>
        </ul>
        <p className="mt-2">These are combined into <span className="font-mono bg-amber-100 dark:bg-amber-900 px-1 rounded">DAVULB9802</span> and then hashed using SHA-256.</p>
      </div>
    </div>
  );
} 