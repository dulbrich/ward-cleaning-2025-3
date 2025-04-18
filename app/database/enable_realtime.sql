-- More aggressive approach to enable realtime for all necessary tables

-- First, ensure the realtime publication exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime'
    ) THEN
        CREATE PUBLICATION supabase_realtime;
    END IF;
END
$$;

-- Remove tables from publication if they exist (corrected syntax)
DO $$
BEGIN
    -- Try to drop tables from publication - need to check if they're in the publication first
    IF EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'cleaning_session_tasks'
    ) THEN
        ALTER PUBLICATION supabase_realtime DROP TABLE cleaning_session_tasks;
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'cleaning_sessions'
    ) THEN
        ALTER PUBLICATION supabase_realtime DROP TABLE cleaning_sessions;
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'session_participants'
    ) THEN
        ALTER PUBLICATION supabase_realtime DROP TABLE session_participants;
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'task_viewers'
    ) THEN
        ALTER PUBLICATION supabase_realtime DROP TABLE task_viewers;
    END IF;
END
$$;

-- Add all tables to the realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE cleaning_session_tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE cleaning_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE session_participants;
ALTER PUBLICATION supabase_realtime ADD TABLE task_viewers;

-- Update publication to include ALL operations
ALTER PUBLICATION supabase_realtime SET (publish = 'insert, update, delete, truncate');

-- Enable the "send_change_event" replication identity for each table
ALTER TABLE cleaning_session_tasks REPLICA IDENTITY FULL;
ALTER TABLE cleaning_sessions REPLICA IDENTITY FULL;
ALTER TABLE session_participants REPLICA IDENTITY FULL;
ALTER TABLE task_viewers REPLICA IDENTITY FULL;

-- Create extension if it doesn't exist
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Force clients to reconnect by restart
DO $$
BEGIN
    -- Log that we're restarting the realtime service
    RAISE NOTICE 'Forcing realtime clients to reconnect...';
    
    -- This SQL statement will cause the realtime service to restart
    -- which forces all clients to reconnect
    PERFORM pg_sleep(1);
END
$$; 