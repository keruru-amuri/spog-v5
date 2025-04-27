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

# Check if server.js exists
if [ ! -f "server.js" ]; then
  echo "server.js not found, creating a simple one..."
  cat > server.js << 'EOL'
const { createServer } = require('http');
const { parse } = require('url');
const path = require('path');
const { existsSync } = require('fs');

const dev = process.env.NODE_ENV !== 'production';
const hostname = process.env.HOST || 'localhost';
const port = process.env.PORT || 3000;

console.log(`Starting server with NODE_ENV=${process.env.NODE_ENV}, PORT=${port}`);
console.log(`Current directory: ${process.cwd()}`);

// Try to require Next.js
let next;
try {
  next = require('next');
  console.log('Successfully loaded Next.js');
} catch (error) {
  console.error('Failed to load Next.js:', error);
  process.exit(1);
}

// Initialize Next.js
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('Internal Server Error');
    }
  }).listen(port, (err) => {
    if (err) throw err;
    console.log(`> Ready on http://${hostname}:${port}`);
  });
});
EOL
  echo "Created simple server.js"
fi

# Build the application if needed
if [ ! -d ".next" ]; then
  echo "Building the application..."
  npm run build
fi

# Check if the standalone directory exists
if [ -d ".next/standalone" ]; then
  echo "Using standalone output..."
  # Copy necessary files to the standalone directory
  cp -r .next/static .next/standalone/.next/ || echo "Failed to copy static files"
  cp -r public .next/standalone/ || echo "Failed to copy public files"
  cp server.js .next/standalone/ || echo "Failed to copy server.js"

  # Change to the standalone directory
  cd .next/standalone

  # Start the server
  echo "Starting the server from standalone directory..."
  node server.js
else
  echo "Standalone directory not found, using custom server..."
  # Start with custom server
  echo "Starting server.js directly..."
  node server.js
fi
