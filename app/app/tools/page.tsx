"use client";

import { createClient } from "@/utils/supabase/client";
import { AlertCircle, Loader2 } from "lucide-react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getLastWardDataImport, logWardDataImport, trackAnonymousUser } from "./actions";

// Dynamically import SyntaxHighlighter to prevent SSR issues
const DynamicSyntaxHighlighter = dynamic(
  () => import("react-syntax-highlighter").then((mod) => {
    // We're using a simpler import strategy to avoid polyfill issues
    return mod.Prism;
  }),
  { ssr: false }
);

// Define Ward/Branch interface
interface WardBranch {
  id: string;
  name: string;
  unit_type: "Ward" | "Branch";
  unit_number: string;
  stake_district_name?: string;
  city?: string;
  state_province?: string;
  country?: string;
  is_primary: boolean;
}

// Code block with syntax highlighting component
function CodeBlock({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  const [loaded, setLoaded] = useState(false);
  
  // Check if we're in the browser to use syntax highlighter
  useEffect(() => {
    setLoaded(typeof window !== 'undefined');
  }, []);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Theme that better matches the application design
  const customTheme = {
    'pre[class*="language-"]': {
      background: 'hsl(222.2 84% 4.9%)',
      color: 'hsl(210 40% 98%)',
      whiteSpace: 'pre' as const,
      wordBreak: 'normal' as const,
      overflowWrap: 'normal' as const,
    },
    'code[class*="language-"]': {
      color: 'hsl(210 40% 98%)',
      whiteSpace: 'pre' as const,
      wordBreak: 'normal' as const,
      overflowWrap: 'normal' as const,
    },
    'comment': { color: 'hsl(217.2 32.6% 65%)' },
    'string': { color: 'hsl(142.1 76.2% 76.5%)' },
    'keyword': { color: 'hsl(217.2 91.2% 59.8%)' },
    'function': { color: 'hsl(280 100% 70%)' },
    'number': { color: 'hsl(30 100% 70%)' },
    'operator': { color: 'hsl(280 100% 70%)' },
    'punctuation': { color: 'hsl(210 40% 70%)' },
    'property': { color: 'hsl(35.5 91.7% 75.3%)' },
    'variable': { color: 'hsl(355.7 100% 75.3%)' }
  };

  return (
    <div className="relative w-full" style={{ width: '70%' }}>
      <div className="bg-card border border-border rounded-md w-full">
        <div className="overflow-x-auto overflow-y-hidden w-full">
          {loaded ? (
            <DynamicSyntaxHighlighter 
              language="javascript" 
              style={customTheme}
              customStyle={{
                fontSize: '0.875rem',
                margin: 0,
                padding: '1rem',
                paddingRight: '2rem',
                background: 'hsl(222.2 84% 4.9%)',
                whiteSpace: 'pre',
                width: 'fit-content',
                minWidth: '100%',
                maxWidth: 'none',
              }}
              wrapLines={false}
              wrapLongLines={false}
            >
              {code}
            </DynamicSyntaxHighlighter>
          ) : (
            <pre className="font-mono p-4 pr-8 bg-card text-card-foreground whitespace-pre w-full" style={{ overflow: 'auto', width: 'fit-content', minWidth: '100%' }}>
              <code>{code}</code>
            </pre>
          )}
        </div>
        <button
          onClick={copyToClipboard}
          className="absolute top-2 right-2 bg-primary/90 text-primary-foreground px-2 py-1 rounded text-xs hover:bg-primary transition-colors z-10"
        >
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
    </div>
  );
}

// Instruction step component
function InstructionStep({ number, title, description }: { number: number; title: string; description: string | React.ReactNode }) {
  return (
    <div className="flex gap-4 mb-6">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground">
        {number}
      </div>
      <div>
        <h3 className="font-medium mb-1">{title}</h3>
        <div className="text-sm text-muted-foreground">{description}</div>
      </div>
    </div>
  );
}

// Add this after the imports
declare global {
  interface Window {
    debugAnonymousTracking: () => Promise<void>;
  }
}

export default function ToolsPage() {
  const [activeTool, setActiveTool] = useState("Ward Contact Import");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [lastImportDate, setLastImportDate] = useState<string | null>(null);
  const [authError, setAuthError] = useState(false);
  const [trackedUsers, setTrackedUsers] = useState<{ new: number, existing: number }>({ new: 0, existing: 0 });
  const [message, setMessage] = useState<string>('');
  const [importProgress, setImportProgress] = useState<number | null>(null);
  const [wardBranches, setWardBranches] = useState<WardBranch[]>([]);
  const [selectedWard, setSelectedWard] = useState<string>("");
  const [loadingWards, setLoadingWards] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  // JavaScript code to be copied - will be dynamically updated with unit number
  const [scriptCode, setScriptCode] = useState(`(function() {
  fetch('https://directory.churchofjesuschrist.org/api/v4/households?unit=2052520', {
    credentials: 'include'
  })
    .then(response => {
      if (!response.ok) {
        throw new Error('Network response was not ok: ' + response.statusText);
      }
      return response.json();
    })
    .then(data => {
      // Get today's date in YYYY-MM-DD format
      const today = new Date().toISOString().split('T')[0];
      const fileName = today + '.json';
      
      // Create a Blob from the JSON data
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      // Create a temporary link to trigger the download
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      
      // Clean up by removing the link and revoking the object URL
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    })
    .catch(error => console.error('Error fetching the ward directory:', error));
})();`);

  // Fetch wards and ward data
  useEffect(() => {
    // Check for authentication
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setAuthError(true);
        setLoadingWards(false);
        return;
      }
      
      // Fetch wards from the database
      try {
        const { data: wards, error } = await supabase
          .from('ward_branches')
          .select('*')
          .order('is_primary', { ascending: false })
          .order('name');
          
        if (error) throw error;
        
        setWardBranches(wards || []);
        
        // If we have wards, select the primary one by default
        if (wards && wards.length > 0) {
          const primaryWard = wards.find(ward => ward.is_primary);
          const defaultWardId = primaryWard?.id || wards[0].id;
          const defaultUnitNumber = primaryWard?.unit_number || wards[0]?.unit_number;
          
          setSelectedWard(defaultWardId);
          
          // Update script code with the primary ward's unit number
          if (defaultUnitNumber) {
            updateScriptWithUnitNumber(defaultUnitNumber);
          }
        }
        
        // Check for last import date in localStorage
        const storedLastImport = localStorage.getItem('wardContactLastImport');
        if (storedLastImport) {
          setLastImportDate(storedLastImport);
        }
  
        // Also fetch last import from database
        try {
          const result = await getLastWardDataImport();
          if (result.error) {
            if (result.error === "Not authenticated") {
              setAuthError(true);
            } else {
              console.error("Error fetching last import:", result.error);
            }
          } else if (result.data) {
            const dbImportDate = new Date(result.data.imported_at).toLocaleString();
            if (!storedLastImport || new Date(result.data.imported_at) > new Date(storedLastImport)) {
              setLastImportDate(dbImportDate);
              localStorage.setItem('wardContactLastImport', dbImportDate);
            }
          }
        } catch (err) {
          console.error("Error fetching last import date:", err);
        }
      } catch (error) {
        console.error("Error fetching wards:", error);
      } finally {
        setLoadingWards(false);
      }
    };

    checkAuth();
  }, [supabase]);

  // Update script with unit number
  const updateScriptWithUnitNumber = (unitNumber: string) => {
    const newScript = `(function() {
  fetch('https://directory.churchofjesuschrist.org/api/v4/households?unit=${unitNumber}', {
    credentials: 'include'
  })
    .then(response => {
      if (!response.ok) {
        throw new Error('Network response was not ok: ' + response.statusText);
      }
      return response.json();
    })
    .then(data => {
      // Get today's date in YYYY-MM-DD format
      const today = new Date().toISOString().split('T')[0];
      const fileName = today + '.json';
      
      // Create a Blob from the JSON data
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      // Create a temporary link to trigger the download
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      
      // Clean up by removing the link and revoking the object URL
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    })
    .catch(error => console.error('Error fetching the ward directory:', error));
})();`;
    setScriptCode(newScript);
  };

  // Handle ward selection change
  const handleWardChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value;
    setSelectedWard(selectedId);
    
    // Find the selected ward and update script with its unit number
    const ward = wardBranches.find(w => w.id === selectedId);
    if (ward?.unit_number) {
      updateScriptWithUnitNumber(ward.unit_number);
    }
  };

  // Modified handleFileChange
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setError(null);
    }
  };

  // Modified handleImport to include selected ward ID
  const handleImport = async () => {
    if (!file) {
      setError("Please select a file to import");
      return;
    }

    if (!selectedWard) {
      setError("Please select a ward/branch");
      return;
    }

    setLoading(true);
    setError(null);
    setImportProgress(0);
    setTrackedUsers({ new: 0, existing: 0 });
    
    try {
      // Check authentication first
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setAuthError(true);
        throw new Error("You must be logged in to import data");
      }
      
      // Find the selected ward to get its unit number
      const ward = wardBranches.find(w => w.id === selectedWard);
      if (!ward) {
        throw new Error("Selected ward not found");
      }
      
      // Read the file
      const fileContent = await file.text();
      let jsonData;
      
      // Initialize arrays before JSON parsing
      const allMembers = [];
      const trackedUsers: { firstName: string, lastName: string, result: any }[] = [];
      
      try {
        jsonData = JSON.parse(fileContent);
        
        // Log the basic structure for diagnostic purposes
        console.log("JSON Data Top-Level Structure:", Object.keys(jsonData));
        
        // Check if it's an array at the top level
        if (Array.isArray(jsonData)) {
          console.log("Top-level is an array with", jsonData.length, "items");
          console.log("First item keys:", jsonData[0] ? Object.keys(jsonData[0]) : "empty");
          
          // Add a direct approach to handle this format
          console.log("Looking for household heads in array...");
          let headCount = 0;
          let phoneCount = 0;
          
          // Filter format from docs/ward.json
          for (const household of jsonData) {
            if (household.members && Array.isArray(household.members)) {
              for (const member of household.members) {
                if (member.head === true) {
                  headCount++;
                  if (member.phone) {
                    phoneCount++;
                    // This is a household head with a phone number - add to our list
                    // Add unit_number to the member object
                    member.unit_number = ward.unit_number;
                    allMembers.push(member);
                    console.log(`Found household head with phone: ${member.givenName} ${member.surname}`);
                  } else {
                    console.log(`Found household head WITHOUT phone: ${member.givenName} ${member.surname}`);
                  }
                }
              }
            }
          }
          
          console.log(`Found ${headCount} total household heads, ${phoneCount} with phone numbers`);
        } else {
          // Original structure handling continues below
          // Extract from households if available
          if (jsonData.households && Array.isArray(jsonData.households)) {
            for (const household of jsonData.households) {
              if (household.members && Array.isArray(household.members)) {
                // Only add household heads with phone numbers
                const householdHeads = household.members.filter((member: any) => 
                  member.head === true && 
                  member.phone && 
                  (typeof member.phone === 'object' ? member.phone.number || member.phone.e164 : member.phone)
                ).map((member: any) => {
                  // Add unit_number to the member object
                  member.unit_number = ward.unit_number;
                  return member;
                });
                allMembers.push(...householdHeads);
              }
            }
          }
          
          // If we're using a different structure, handle it similarly
          if (jsonData.members && Array.isArray(jsonData.members)) {
            // Filter for household heads with phone numbers
            const householdHeads = jsonData.members.filter((member: any) => 
              member.head === true && 
              member.phone && 
              (typeof member.phone === 'object' ? member.phone.number || member.phone.e164 : member.phone)
            ).map((member: any) => {
              // Add unit_number to the member object
              member.unit_number = ward.unit_number;
              return member;
            });
            allMembers.push(...householdHeads);
          }
        }
      } catch (e) {
        throw new Error("Invalid JSON file. Please ensure you're importing the correct file.");
      }
      
      // Log the structure of the JSON data to help diagnose issues
      console.log("JSON Data Structure:", Object.keys(jsonData));
      
      // Validate basic structure
      if (!jsonData || typeof jsonData !== 'object') {
        throw new Error("Invalid data format. The file doesn't contain the expected data structure.");
      }
      
      // Store in localStorage
      localStorage.setItem('wardContactData', JSON.stringify(jsonData));
      
      // Clear existing anonymous users for this ward unit number
      try {
        // We'll implement this in the backend actions later
        console.log(`Clearing existing anonymous users for ward unit number: ${ward.unit_number}`);
      } catch (clearError) {
        console.error("Error clearing existing anonymous users:", clearError);
      }
      
      // Start tracking anonymous users
      console.log("Starting anonymous user tracking.");
      
      // Process each household/member
      const batchSize = 10; // Process 10 members at a time
      
      for (let i = 0; i < allMembers.length; i += batchSize) {
        // Update progress
        setImportProgress(Math.round((i / allMembers.length) * 100));
        
        // Get the current batch
        const batch = allMembers.slice(i, i + batchSize);
        console.log(`Processing batch ${i / batchSize + 1} of ${Math.ceil(allMembers.length / batchSize)}, with ${batch.length} members`);
        
        // Process each member in the batch
        const batchPromises = batch.map(async (member) => {
          try {
            // Extract name data
            const firstName = member.givenName || '';
            const lastName = member.surname || '';
            
            // Extract phone number
            let phoneNumber = '';
            if (typeof member.phone === 'string') {
              phoneNumber = member.phone;
            } else if (typeof member.phone === 'object' && member.phone) {
              phoneNumber = member.phone.number || member.phone.e164 || '';
            }
            
            // Skip records without sufficient data
            if (!firstName || !lastName || !phoneNumber) {
              console.log(`Skipping member due to missing data`, {
                firstName: !!firstName,
                lastName: !!lastName,
                phoneNumber: !!phoneNumber
              });
              return;
            }
            
            // Log the member we're about to track (with limited data for privacy)
            console.log(`Tracking household head: ${firstName} ${lastName}`, 
                        phoneNumber ? `phone ending in: ${phoneNumber.slice(-4)}` : 'no phone');
            
            // Track the anonymous user - adding unit number
            const result = await trackAnonymousUser(firstName, lastName, phoneNumber, ward.unit_number);
            
            if (result.success) {
              trackedUsers.push({ firstName, lastName, result });
              console.log(`Successfully tracked: ${firstName} ${lastName}`);
            } else {
              console.warn(`Failed to track: ${firstName} ${lastName}`, result.error);
              
              // If the failure is due to a database error, retry once
              if (result.error && typeof result.error === 'string' && 
                  (result.error.includes('database') || result.error.includes('timeout'))) {
                console.log(`Retrying tracking for: ${firstName} ${lastName}`);
                // Wait a bit before retrying
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                try {
                  const retryResult = await trackAnonymousUser(firstName, lastName, phoneNumber, ward.unit_number);
                  if (retryResult.success) {
                    trackedUsers.push({ firstName, lastName, result: retryResult });
                    console.log(`Successfully tracked on retry: ${firstName} ${lastName}`);
                  } else {
                    console.error(`Failed to track even after retry: ${firstName} ${lastName}`, retryResult.error);
                  }
                } catch (retryErr) {
                  console.error(`Error during retry: ${firstName} ${lastName}`, retryErr);
                }
              }
            }
          } catch (memberError) {
            console.error('Error processing individual member:', memberError);
          }
        });
        
        // Wait for all promises in the batch to complete
        await Promise.all(batchPromises);
        
        // Add a delay between batches to avoid overwhelming the database
        if (i + batchSize < allMembers.length) {
          console.log(`Batch ${i / batchSize + 1} complete, pausing before next batch...`);
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
      // Final progress update to 100%
      setImportProgress(100);
      
      console.log(`Successfully tracked ${trackedUsers.length} household heads.`);
      
      // Log the import - include ward unit number
      await logWardDataImport(allMembers.length, ward.unit_number);
      
      const trackedCount = {
        new: trackedUsers.length,
        existing: 0
      };
      
      setTrackedUsers(trackedCount);
      
      setSuccess(true);
      setMessage(`Successfully imported ${allMembers.length} contacts and tracked ${trackedCount.new} anonymous users.`);
      setTimeout(() => {
        setSuccess(false);
        setImportProgress(null); // Reset progress
      }, 3000);

      // Move the debug output up, before batch processing
      console.log(`Found ${allMembers.length} household heads to process.`);
      
      // Add a sample of the data we found for debugging
      if (allMembers.length > 0) {
        console.log("Sample of first household head found:");
        const sample = allMembers[0];
        console.log({
          givenName: sample.givenName,
          surname: sample.surname,
          phoneType: typeof sample.phone,
          phoneKeys: typeof sample.phone === 'object' ? Object.keys(sample.phone) : 'N/A',
          hasPhoneNumber: typeof sample.phone === 'object' ? !!sample.phone.number : 'N/A',
          hasE164: typeof sample.phone === 'object' ? !!sample.phone.e164 : 'N/A',
          unitNumber: sample.unit_number
        });
      } else {
        console.log("No household heads found. Check the data structure.");
      }
    } catch (error) {
      console.error('Error processing JSON:', error);
      setError(error instanceof Error ? error.message : "An unknown error occurred during import");
    } finally {
      setLoading(false);
    }
  };

  // Define available tools
  const tools = [
    { name: "Ward Contact Import" },
    { name: "Task Builder" },
    // Add more tools here later
  ];

  // Conditional rendering logic moved inside the main return
  const renderToolContent = () => {
    if (activeTool === "Ward Contact Import") {
      // Handle loading state for wards specifically for this tool
      if (loadingWards) {
        return (
          <div className="flex items-center justify-center h-60">
            <Loader2 className="w-12 h-12 animate-spin text-primary" />
          </div>
        );
      }

      // Handle Auth Error specifically for this tool
      if (authError) {
        return (
          <div className="space-y-6">
             <h1 className="text-3xl font-bold">Ward Contact Import Tool</h1>
            <div className="bg-amber-50 text-amber-800 p-6 rounded-lg border border-amber-200">
              <h2 className="text-xl font-medium mb-2">Authentication Required</h2>
              <p className="mb-4">You need to be logged in to use this tool.</p>
              <button
                onClick={() => router.push('/auth/login')}
                className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md text-sm font-medium"
              >
                Go to Login
              </button>
            </div>
          </div>
        );
      }

      // Handle No Wards Found specifically for this tool
      if (!loadingWards && wardBranches.length === 0) {
        return (
          <div className="space-y-6">
             <h1 className="text-3xl font-bold">Ward Contact Import Tool</h1>
            <div className="bg-amber-50 text-amber-800 p-6 rounded-lg border border-amber-200">
              <h2 className="text-xl font-medium mb-2">No Wards or Branches Found</h2>
              <div className="flex items-start gap-3 mb-4">
                <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                <p>
                  You need to set up at least one ward or branch before using this tool. 
                  Please go to Settings to add your ward or branch information.
                </p>
              </div>
              <button 
                onClick={() => router.push('/app/settings')}
                className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md text-sm font-medium"
              >
                Go to Settings
              </button>
            </div>
          </div>
        );
      }

      // Render the main tool content if authenticated and wards exist
      return (
        <div className="space-y-6">
           <h1 className="text-3xl font-bold">Ward Contact Import Tool</h1>

          <div className="bg-card rounded-lg border p-6 mb-6">
            <h2 className="text-xl font-medium mb-4">Data Privacy Notice</h2>
            <p className="mb-3 text-muted-foreground">
              The data you import is <strong>stored locally on your device</strong> and is not shared with anyone.
              It's used only for coordinating ward cleaning assignments within this application.
            </p>
            <p className="mb-3 text-muted-foreground">
              For tracking purposes only, a secure, anonymous hash of partial contact information is stored in the database.
              No personally identifiable information is retained in this process.
            </p>

            {lastImportDate && (
              <div className="mt-4 text-sm p-3 bg-muted rounded-md">
                <strong>Last import:</strong> {lastImportDate}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="bg-card rounded-lg border p-6 lg:col-span-7">
              <h2 className="text-xl font-medium mb-6">Step-by-Step Instructions</h2>

              <div className="mb-6">
                <label htmlFor="selectedWard" className="block text-sm font-medium mb-2">
                  Select a Ward/Branch
                </label>
                {/* Loading state handled above, directly render select */}
                <select
                  id="selectedWard"
                  value={selectedWard}
                  onChange={handleWardChange}
                  className="w-full px-3 py-2 border rounded-md bg-background" // Added bg-background
                  disabled={wardBranches.length === 0 || loading} // Disable during import loading too
                >
                  {wardBranches.map(ward => (
                    <option key={ward.id} value={ward.id}>
                      {ward.name}{ward.is_primary ? ' (Primary)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <InstructionStep
                number={1}
                title="Log in to churchofjesuschrist.org"
                description="Visit https://churchofjesuschrist.org and log in with your Church account."
              />

              <InstructionStep
                number={2}
                title="Navigate to Ward Directory"
                description="Go to the Ward Directory and Map page for the selected Ward/Branch above."
              />

              <InstructionStep
                number={3}
                title="Open Developer Tools"
                description={
                  <div>
                    Press <code className="bg-muted px-1 py-0.5 rounded">Ctrl + Shift + I</code> (or <code className="bg-muted px-1 py-0.5 rounded">Cmd + Option + I</code> on Mac) to open developer tools.
                  </div>
                }
              />

              <InstructionStep
                number={4}
                title="Enable Pasting"
                description={
                  <div>
                    Click on the Console tab, type <code className="bg-muted px-1 py-0.5 rounded">allow pasting</code> and press Enter. You might need to do this each time you open the console.
                  </div>
                }
              />

              <InstructionStep
                number={5}
                title="Run Script"
                description={
                  <div>
                    <p className="mb-3">Copy and paste the following script (updated for your selected ward) into the console and press Enter:</p>
                    <div className="w-full overflow-hidden" style={{ maxWidth: "100%" }}>
                      <CodeBlock code={scriptCode} />
                    </div>
                     <p className="text-xs text-muted-foreground mt-2">This will download a file named like YYYY-MM-DD.json.</p>
                  </div>
                }
              />

              <InstructionStep
                number={6}
                title="Import the Downloaded File"
                description="Select the downloaded JSON file below to import your ward's contact information."
              />
            </div>

            <div className="bg-card rounded-lg border p-6 lg:col-span-5">
              <h2 className="text-xl font-medium mb-4">Import Ward Contacts</h2>

              <div className="mb-6">
                <label htmlFor="fileInput" className="block text-sm font-medium mb-2">Select the downloaded JSON file</label>
                <input
                  id="fileInput"
                  type="file"
                  accept=".json"
                  onChange={handleFileChange}
                  disabled={loading} // Disable during import
                  className="block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                />
                {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
              </div>

              {loading ? (
                <div className="flex flex-col items-center justify-center">
                  <Loader2 className="w-8 h-8 text-primary animate-spin mb-2" />
                  {importProgress !== null && (
                    <div className="w-full mt-2">
                      <div className="w-full bg-muted rounded-full h-2.5">
                        <div
                          className="bg-primary h-2.5 rounded-full transition-all duration-300"
                          style={{ width: `${importProgress}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-center mt-1">{importProgress}% Complete</p>
                    </div>
                  )}
                  <p className="text-sm mt-2">Importing contacts...</p>
                </div>
              ) : (
                <button
                  onClick={handleImport}
                  disabled={!file || !selectedWard || loadingWards || authError} // More robust disabled check
                  className={`w-full px-4 py-2 rounded-md text-sm font-medium text-white transition-colors ${
                    !file || !selectedWard || loadingWards || authError
                      ? 'bg-primary/50 cursor-not-allowed'
                      : 'bg-primary hover:bg-primary/90'
                  }`}
                >
                  Import Contacts
                </button>
              )}

              {success && message && ( // Check for message content too
                <div className="mt-4 p-3 bg-green-100 text-green-700 rounded-md">
                  <p>{message}</p>
                  {(trackedUsers.new > 0) && ( // Simplified display
                    <p className="text-xs mt-1">
                      {trackedUsers.new} household head{trackedUsers.new !== 1 ? 's' : ''} tracked.
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    if (activeTool === "Task Builder") {
      return (
        <div className="bg-card rounded-lg border p-6">
          <h2 className="text-xl font-medium mb-4">Task Builder</h2>
          <p className="text-muted-foreground">This tool allows creating and managing cleaning tasks. Coming soon!</p>
        </div>
      );
    }

    // Default case if no tool matches (shouldn't happen with current setup)
    return <div>Select a tool from the menu.</div>;
  };


  return (
     <div className="space-y-6">
      <h1 className="text-3xl font-bold">Tools</h1> {/* Main page title */}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Tool Navigation */}
        <div className="md:col-span-1">
          <nav className="bg-card rounded-lg border overflow-hidden sticky top-20"> {/* Added sticky top */}
            <div className="p-2">
              {tools.map((tool) => (
                <button
                  key={tool.name}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTool === tool.name
                      ? 'bg-primary/10 text-primary'
                      : 'text-foreground hover:bg-muted' // Ensure text color contrast
                  }`}
                  onClick={() => {
                     setActiveTool(tool.name);
                     // Reset tool-specific states if necessary when switching
                     setError(null);
                     setSuccess(false);
                     setMessage('');
                     setFile(null);
                     setImportProgress(null);
                     // Don't reset ward selection or list
                  }}
                >
                  {tool.name}
                </button>
              ))}
            </div>
          </nav>
        </div>

        {/* Tool Content Area */}
        <div className="md:col-span-3 space-y-6">
          {renderToolContent()}
        </div>
      </div>
    </div>
  );
} 