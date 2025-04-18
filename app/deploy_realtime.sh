#!/bin/bash

# Supabase Realtime Configuration Deployment Script

# Check if the DATABASE_URL is provided
if [ -z "$1" ]; then
  echo "Please provide your Supabase database URL as an argument:"
  echo "  ./deploy_realtime.sh <DATABASE_URL>"
  exit 1
fi

DATABASE_URL=$1
echo "Using database URL: $DATABASE_URL"
echo "Applying realtime configuration..."

# Apply the realtime configuration SQL
psql $DATABASE_URL -f database/enable_realtime.sql

if [ $? -eq 0 ]; then
  echo "✅ Realtime configuration successfully applied to database!"
  echo "Now test your application with multiple tabs to verify real-time updates."
else
  echo "❌ Error applying realtime configuration. Please check the database URL and try again."
  exit 1
fi

echo "✨ For more information about Supabase Realtime, visit: https://supabase.com/docs/guides/realtime" 