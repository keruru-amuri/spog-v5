// azure-server.js - A simple server specifically for Azure App Service
const http = require('http');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Set up environment variables
const port = process.env.PORT || 8080;

console.log(`Starting Azure server on port ${port}`);
console.log(`Current directory: ${process.cwd()}`);
console.log(`Node version: ${process.version}`);

// Check if we have a Next.js build
const hasNextBuild = fs.existsSync('.next');
const hasStandalone = fs.existsSync('.next/standalone');

// Try to start the appropriate server
let serverProcess;
try {
  if (hasNextBuild && hasStandalone) {
    console.log('Found Next.js standalone build, starting Next.js server...');
    
    // Try to start the Next.js server
    if (fs.existsSync('server.js')) {
      console.log('Starting with server.js...');
      serverProcess = require('./server.js');
      console.log('Next.js server started successfully!');
    } else {
      console.log('server.js not found, falling back to standalone server');
      serverProcess = require('./standalone-server.js');
    }
  } else {
    console.log('Next.js build not found, starting standalone server...');
    serverProcess = require('./standalone-server.js');
  }
} catch (error) {
  console.error(`Error starting server: ${error.message}`);
  console.error(error.stack);
  
  // Create a simple fallback server
  const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>MABES SPOG Inventory - Server Error</title>
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 20px; }
            h1 { color: #d32f2f; }
            pre { background: #f0f0f0; padding: 10px; border-radius: 5px; text-align: left; overflow: auto; }
          </style>
        </head>
        <body>
          <h1>MABES SPOG Inventory - Server Error</h1>
          <p>We encountered an error while starting the server:</p>
          <pre>${error.stack}</pre>
          <p>Please check the server logs for more information.</p>
        </body>
      </html>
    `);
  });
  
  server.listen(port, () => {
    console.log(`Fallback server running at http://localhost:${port}/`);
  });
}
