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

# Check if Next.js is installed correctly
if [ ! -d "node_modules/next" ]; then
  echo "Next.js not found, installing..."
  npm install next@latest --no-save
fi

# Check if we need to build the application
if [ ! -d ".next" ]; then
  echo "Building the application using azure-build.js..."
  node azure-build.js
fi

# Try to start with the standalone server first
echo "Starting the application with standalone server..."
if [ -f "standalone-server.js" ]; then
  node standalone-server.js
else
  # Fall back to the regular server if standalone doesn't exist
  echo "Standalone server not found, using regular server..."
  node server.js
fi
