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
  echo "Building the application..."
  npm run build
fi

# Start the application using our custom server
echo "Starting the application with custom server..."
node app.js
