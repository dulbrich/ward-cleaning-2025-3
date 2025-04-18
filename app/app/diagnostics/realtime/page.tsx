"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/utils/supabase/client";
import { Check, X } from "lucide-react";
import { useEffect, useState } from "react";

export default function RealtimeDiagnosticsPage() {
  const [loading, setLoading] = useState(true);
  const [testOutput, setTestOutput] = useState<any>(null);
  const [connectStatus, setConnectStatus] = useState<'connected' | 'connecting' | 'disconnected'>('connecting');
  const [lastMessage, setLastMessage] = useState<string | null>(null);
  
  // Run a realtime test on first load
  useEffect(() => {
    const runTest = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/realtime-status');
        const data = await res.json();
        setTestOutput(data);
      } catch (error) {
        console.error('Error running diagnostic test:', error);
      } finally {
        setLoading(false);
      }
    };
    
    runTest();
  }, []);
  
  // Set up a test channel to check realtime connectivity
  useEffect(() => {
    const supabase = createClient();
    const testChannel = supabase.channel('diagnostics_test', {
      config: {
        broadcast: {
          self: true
        }
      }
    });
    
    // Add listeners
    testChannel
      .on('system', { event: 'connected' }, () => {
        setConnectStatus('connected');
      })
      .on('system', { event: 'disconnected' }, () => {
        setConnectStatus('disconnected');
      })
      .on('broadcast', { event: '*' }, (payload) => {
        setLastMessage(JSON.stringify(payload));
      })
      .subscribe((status) => {
        console.log('Channel status:', status);
      });
      
    // Clean up
    return () => {
      supabase.removeChannel(testChannel);
    };
  }, []);
  
  // Function to broadcast a test message
  const sendTestMessage = async () => {
    const supabase = createClient();
    const channel = supabase.channel('diagnostics_test');
    
    await channel.send({
      type: 'broadcast',
      event: 'test',
      payload: {
        message: 'Test message',
        timestamp: new Date().toISOString()
      }
    });
  };
  
  // Function to run the check again
  const runCheck = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/realtime-status');
      const data = await res.json();
      setTestOutput(data);
    } catch (error) {
      console.error('Error running diagnostic test:', error);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6">Supabase Realtime Diagnostics</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Realtime Connection Status</CardTitle>
            <CardDescription>Current connection to Supabase Realtime</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 mb-4">
              <div 
                className={`w-3 h-3 rounded-full ${
                  connectStatus === 'connected' ? 'bg-green-500' : 
                  connectStatus === 'connecting' ? 'bg-amber-500' : 'bg-red-500'
                }`} 
              />
              <span className="font-medium">
                {connectStatus === 'connected' ? 'Connected' : 
                 connectStatus === 'connecting' ? 'Connecting...' : 'Disconnected'}
              </span>
            </div>
            
            <Button 
              onClick={sendTestMessage} 
              disabled={connectStatus !== 'connected'}
              className="mb-4"
            >
              Send Test Message
            </Button>
            
            {lastMessage && (
              <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded text-sm font-mono overflow-x-auto">
                {lastMessage}
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Configuration Check</CardTitle>
            <CardDescription>Database configuration for realtime</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center items-center h-40">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <div>
                <h3 className="font-semibold mb-2">Suggestions:</h3>
                <ul className="space-y-1 mb-4">
                  {testOutput?.suggestions?.map((suggestion: string, i: number) => (
                    <li key={i} className="text-sm">{suggestion}</li>
                  ))}
                </ul>
                
                <Button onClick={runCheck} className="w-full">
                  Run Check Again
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {testOutput && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Table Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-4">Table</th>
                      <th className="text-left py-2 px-4">Exists</th>
                      <th className="text-left py-2 px-4">Row Count</th>
                      <th className="text-left py-2 px-4">In Publication</th>
                      <th className="text-left py-2 px-4">Replica Identity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {testOutput.tables.map((table: any, i: number) => {
                      const publicationStatus = testOutput.publication?.tables?.find(
                        (t: any) => t.table === table.table
                      );
                      const identityStatus = testOutput.replicaIdentities?.find(
                        (r: any) => r.table === table.table
                      );
                      
                      return (
                        <tr key={i} className="border-b">
                          <td className="py-2 px-4 font-mono">{table.table}</td>
                          <td className="py-2 px-4">
                            {table.exists ? (
                              <Check className="h-4 w-4 text-green-500" />
                            ) : (
                              <X className="h-4 w-4 text-red-500" />
                            )}
                          </td>
                          <td className="py-2 px-4">{table.count}</td>
                          <td className="py-2 px-4">
                            {publicationStatus?.inPublication ? (
                              <Check className="h-4 w-4 text-green-500" />
                            ) : (
                              <X className="h-4 w-4 text-red-500" />
                            )}
                          </td>
                          <td className="py-2 px-4">
                            <span className={identityStatus?.isCorrect ? 'text-green-500' : 'text-red-500'}>
                              {identityStatus?.identityType || 'Unknown'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Raw Data</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded-md overflow-x-auto text-xs">
                {JSON.stringify(testOutput, null, 2)}
              </pre>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
} 