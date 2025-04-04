"use client";

import { createClient } from "@/utils/supabase/client";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getLastWardDataImport, logWardDataImport } from "./actions";

// Dynamically import SyntaxHighlighter to prevent SSR issues
const DynamicSyntaxHighlighter = dynamic(
  () => import("react-syntax-highlighter").then((mod) => {
    // We're using a simpler import strategy to avoid polyfill issues
    return mod.Prism;
  }),
  { ssr: false }
);

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

export default function WardContactImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [lastImportDate, setLastImportDate] = useState<string | null>(null);
  const [authError, setAuthError] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  // JavaScript code to be copied
  const scriptCode = `(function() {
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
})();`;

  useEffect(() => {
    // Check for authentication
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setAuthError(true);
        return;
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
          return;
        }
        
        if (result.data) {
          const dbImportDate = new Date(result.data.imported_at).toLocaleString();
          if (!storedLastImport || new Date(result.data.imported_at) > new Date(storedLastImport)) {
            setLastImportDate(dbImportDate);
            localStorage.setItem('wardContactLastImport', dbImportDate);
          }
        }
      } catch (err) {
        console.error("Error fetching last import date:", err);
      }
    };

    checkAuth();
  }, [supabase]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setError(null);
    }
  };

  const handleImport = async () => {
    if (!file) {
      setError("Please select a file to import");
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      // Check authentication first
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setAuthError(true);
        throw new Error("You must be logged in to import data");
      }
      
      // Read the file
      const fileContent = await file.text();
      let jsonData;
      
      try {
        jsonData = JSON.parse(fileContent);
      } catch (e) {
        throw new Error("Invalid JSON file. Please ensure you're importing the correct file.");
      }
      
      // Validate basic structure (this is a simple check, enhance as needed)
      if (!jsonData || typeof jsonData !== 'object') {
        throw new Error("Invalid data format. The file doesn't contain the expected data structure.");
      }
      
      // Store in localStorage
      localStorage.setItem('wardContactData', JSON.stringify(jsonData));
      
      // Get record count (assuming households is an array in the JSON structure)
      const recordCount = Array.isArray(jsonData.households) ? jsonData.households.length : 
                         (typeof jsonData === 'object' ? Object.keys(jsonData).length : 0);
      
      // Log import in database using server action
      const result = await logWardDataImport(recordCount);
      
      if (result.error) {
        if (result.error === "Not authenticated") {
          setAuthError(true);
          throw new Error("You must be logged in to complete the import process");
        } else {
          console.error("Database error:", result.error);
          // Don't throw, we'll still mark the import as successful since the data is in localStorage
        }
      }
      
      // Update last import date
      const now = new Date().toLocaleString();
      localStorage.setItem('wardContactLastImport', now);
      setLastImportDate(now);
      
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
      }, 3000);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred during import");
    } finally {
      setLoading(false);
    }
  };

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

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Ward Contact Import Tool</h1>
      
      <div className="bg-card rounded-lg border p-6 mb-6">
        <h2 className="text-xl font-medium mb-4">Data Privacy Notice</h2>
        <p className="mb-3 text-muted-foreground">
          The data you import is <strong>stored locally on your device</strong> and is not shared with anyone.
          It's used only for coordinating ward cleaning assignments within this application.
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
          
          <InstructionStep 
            number={1} 
            title="Log in to churchofjesuschrist.org" 
            description="Visit https://churchofjesuschrist.org and log in with your Church account."
          />
          
          <InstructionStep 
            number={2} 
            title="Navigate to Ward Directory" 
            description="Go to the Ward Directory and Map page."
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
                Click on the Console tab, type <code className="bg-muted px-1 py-0.5 rounded">allow pasting</code> and press Enter.
              </div>
            }
          />
          
          <InstructionStep 
            number={5} 
            title="Run Script" 
            description={
              <div>
                <p className="mb-3">Copy and paste the following script into the console and press Enter:</p>
                <div className="w-full overflow-hidden" style={{ maxWidth: "100%" }}>
                  <CodeBlock code={scriptCode} />
                </div>
              </div>
            }
          />
          
          <InstructionStep 
            number={6} 
            title="Import the Downloaded File" 
            description="Import the downloaded JSON file below to import your ward's contact information."
          />
        </div>
        
        <div className="bg-card rounded-lg border p-6 lg:col-span-5">
          <h2 className="text-xl font-medium mb-4">Import Ward Contacts</h2>
          
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Select the downloaded JSON file</label>
            <input
              type="file"
              accept=".json"
              onChange={handleFileChange}
              className="block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
            />
            {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
          </div>
          
          <button
            onClick={handleImport}
            disabled={loading || !file}
            className={`w-full px-4 py-2 rounded-md text-sm font-medium text-white ${
              loading || !file ? 'bg-primary/50 cursor-not-allowed' : 'bg-primary hover:bg-primary/90'
            }`}
          >
            {loading ? "Importing..." : "Import Contacts"}
          </button>
          
          {success && (
            <div className="mt-4 p-3 bg-green-100 text-green-700 rounded-md">
              Ward contacts imported successfully! The data is now available for use in the application.
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 