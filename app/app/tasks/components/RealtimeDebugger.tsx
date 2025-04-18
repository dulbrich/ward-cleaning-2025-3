"use client";

import { createClient } from "@/utils/supabase/client";
import { useEffect, useState } from "react";

interface RealtimeDebuggerProps {
  sessionId: string;
}

export default function RealtimeDebugger({ sessionId }: RealtimeDebuggerProps) {
  const [status, setStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  const [events, setEvents] = useState<{ type: string; message: string; timestamp: Date }[]>([]);
  const [manualChannelId, setManualChannelId] = useState('');
  const [manualMessage, setManualMessage] = useState('');
  
  useEffect(() => {
    if (!sessionId) return;
    
    // Create a separate client for debugging purposes
    const supabase = createClient();
    
    // Helper function to add an event to the log
    function addEvent(type: string, message: string) {
      setEvents(prev => [
        { type, message, timestamp: new Date() },
        ...prev.slice(0, 19) // Keep only the last 20 events
      ]);
    }
    
    // Initially set status to connecting
    setStatus('connecting');
    addEvent('status', 'Initializing realtime connections...');
    
    // Create a test channel subscription
    const channel = supabase.channel(`debug_${sessionId}`, {
      config: {
        presence: {
          key: 'debugger',
        },
      }
    });
    
    // Add channel listeners
    channel
      .on('presence', { event: 'sync' }, () => {
        addEvent('presence', 'Presence state synchronized');
        setStatus('connected');
      })
      .on('presence', { event: 'join' }, ({ newPresences }) => {
        addEvent('presence', `User joined: ${newPresences.length} new presences`);
      })
      .on('presence', { event: 'leave' }, ({ leftPresences }) => {
        addEvent('presence', `User left: ${leftPresences.length} left presences`);
      })
      .on('system', { event: 'disconnect' }, () => {
        addEvent('status', 'Disconnected from realtime service');
        setStatus('disconnected');
      })
      .on('system', { event: 'reconnect' }, () => {
        addEvent('status', 'Attempting to reconnect...');
        setStatus('connecting');
      })
      .on('system', { event: 'connected' }, () => {
        addEvent('status', 'Connected to realtime service');
        setStatus('connected');
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          addEvent('channel', 'Debug channel subscribed');
          setStatus('connected');
        } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
          addEvent('channel', `Channel status: ${status}`);
          setStatus('disconnected');
        } else if (status === 'TIMED_OUT') {
          addEvent('channel', 'Channel connection timed out');
          setStatus('disconnected');
        } else {
          addEvent('channel', `Channel status: ${status}`);
        }
      });
    
    // Task-specific subscription to monitor realtime updates
    const taskChannel = supabase
      .channel(`cleaning_session_tasks:${sessionId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'cleaning_session_tasks',
        filter: `session_id=eq.${sessionId}`
      }, (payload) => {
        // Safely access ID properties
        const taskId = (payload.new && 'id' in payload.new) ? payload.new.id : 
                       (payload.old && 'id' in payload.old) ? payload.old.id : 
                       'unknown';
        addEvent('task', `${payload.eventType} on task ${taskId}`);
      })
      .subscribe((status) => {
        addEvent('task_channel', `Task channel status: ${status}`);
      });
    
    // Track presence for debugging
    setTimeout(() => {
      channel.track({
        online_at: new Date().toISOString(),
        user_agent: navigator.userAgent,
      });
    }, 1000);
    
    return () => {
      // Clean up subscription
      channel.unsubscribe();
      taskChannel.unsubscribe();
      addEvent('status', 'Realtime debugger unmounted');
    };
  }, [sessionId]);
  
  // Function to manually send a broadcast message
  const sendManualBroadcast = async () => {
    if (!sessionId || !manualChannelId || !manualMessage) return;
    
    try {
      const supabase = createClient();
      const channel = supabase.channel(manualChannelId);
      
      // Subscribe to the channel
      await channel.subscribe((status) => {
        addEvent('manual', `Manual channel status: ${status}`);
      });
      
      // Send a broadcast message
      channel.send({
        type: 'broadcast',
        event: 'manual_test',
        payload: {
          message: manualMessage,
          timestamp: new Date().toISOString(),
          source: 'debugger'
        }
      });
      
      addEvent('manual', `Sent message to ${manualChannelId}: ${manualMessage}`);
      
      // Unsubscribe after a delay
      setTimeout(() => {
        channel.unsubscribe();
      }, 2000);
    } catch (error) {
      addEvent('error', `Broadcast error: ${error instanceof Error ? error.message : String(error)}`);
    }
  };
  
  if (!sessionId) return null;
  
  return (
    <div className="fixed bottom-0 right-0 z-50 w-80 h-64 bg-white shadow-lg border border-gray-200 rounded-tl-lg overflow-hidden">
      <div className="bg-gray-100 p-2 flex justify-between items-center border-b border-gray-200">
        <h3 className="text-sm font-medium">Realtime Debugger</h3>
        <div className="flex items-center gap-2">
          <span className="text-xs">Status:</span>
          <span className={`w-2 h-2 rounded-full ${
            status === 'connected' ? 'bg-green-500' : 
            status === 'connecting' ? 'bg-yellow-500' : 'bg-red-500'
          }`}></span>
          <span className="text-xs">{status}</span>
        </div>
      </div>
      
      <div className="p-2 border-b border-gray-200 flex items-center text-xs">
        <input 
          type="text" 
          placeholder="Channel ID" 
          className="flex-1 p-1 border rounded text-xs mr-1"
          value={manualChannelId}
          onChange={(e) => setManualChannelId(e.target.value)}
        />
        <input 
          type="text" 
          placeholder="Message" 
          className="flex-1 p-1 border rounded text-xs mr-1"
          value={manualMessage}
          onChange={(e) => setManualMessage(e.target.value)}
        />
        <button 
          className="bg-blue-500 text-white rounded px-2 py-1 text-xs"
          onClick={sendManualBroadcast}
        >
          Send
        </button>
      </div>
      
      <div className="overflow-y-auto h-full max-h-36 p-2">
        {events.length === 0 ? (
          <p className="text-xs text-gray-500 italic">No events logged yet...</p>
        ) : (
          events.map((event, i) => (
            <div key={i} className="text-xs mb-1">
              <span className="text-gray-500">{event.timestamp.toLocaleTimeString()}</span>{' '}
              <span className={`font-medium ${
                event.type === 'status' ? 'text-blue-600' : 
                event.type === 'presence' ? 'text-purple-600' : 
                event.type === 'task' ? 'text-green-600' : 
                event.type === 'manual' ? 'text-amber-600' :
                event.type === 'error' ? 'text-red-600' :
                'text-gray-600'
              }`}>[{event.type}]</span>{' '}
              <span>{event.message}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
} 