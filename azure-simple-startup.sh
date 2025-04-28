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

# Check if we need to build the application
if [ ! -d ".next" ]; then
  echo "Building the application using azure-build.js..."
  node azure-build.js
fi

# Try to start with the Azure server first
echo "Starting the application with Azure server..."
if [ -f "azure-server.js" ]; then
  node azure-server.js
else
  # Fall back to standalone server
  echo "Azure server not found, using standalone server..."
  node standalone-server.js
fi
