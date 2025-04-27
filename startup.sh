#!/bin/bash
cd /home/site/wwwroot

# Set environment variables
export NODE_ENV=production
export PORT=8080

# Print environment information for debugging
echo "Node version: $(node -v)"
echo "NPM version: $(npm -v)"
echo "Current directory: $(pwd)"
echo "Directory contents:"
ls -la

# Build the application if needed
if [ ! -d ".next" ]; then
  echo "Building the application..."
  npm run build
fi

# Check if the standalone directory exists
if [ -d ".next/standalone" ]; then
  echo "Using standalone output..."
  # Copy necessary files to the standalone directory
  cp -r .next/static .next/standalone/.next/
  cp -r public .next/standalone/

  # Change to the standalone directory
  cd .next/standalone

  # Start the server
  echo "Starting the server from standalone directory..."
  node server.js
else
  echo "Standalone directory not found, using custom server..."
  # Start with custom server
  node server.js
fi
