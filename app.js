// app.js - Entry point for Azure Web App
const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn, execSync } = require('child_process');

// Set up environment variables
const port = process.env.PORT || 8080;

console.log(`Starting app.js on port ${port}`);
console.log(`Current directory: ${process.cwd()}`);
console.log(`Node version: ${process.version}`);
console.log(`Directory contents: ${fs.readdirSync('.').join(', ')}`);

// Check if we need to build the application
if (!fs.existsSync(path.join(process.cwd(), '.next/BUILD_ID'))) {
  console.log('No production build found, building the application...');
  try {
    console.log('Running npm run build...');
    execSync('npm run build', { stdio: 'inherit' });
    console.log('Build completed successfully');
  } catch (error) {
    console.error('Build failed:', error);
    startFallbackServer('Failed to build the application. Please check the logs for more information.');
    return;
  }
}

// Check if server.js exists
if (fs.existsSync(path.join(process.cwd(), 'server.js'))) {
  console.log('Found server.js, starting it...');

  // Start server.js as a child process
  const serverProcess = spawn('node', ['server.js'], {
    stdio: 'inherit',
    env: { ...process.env, PORT: port, NODE_ENV: 'production' }
  });

  serverProcess.on('error', (err) => {
    console.error('Failed to start server.js:', err);
    startFallbackServer('Failed to start the server. Please try again later.');
  });

  serverProcess.on('exit', (code, signal) => {
    console.log(`server.js exited with code ${code} and signal ${signal}`);
    if (code !== 0) {
      startFallbackServer('The server exited unexpectedly. Please try again later.');
    }
  });
} else {
  console.log('server.js not found, starting fallback server...');
  startFallbackServer('Server configuration not found. Please contact the administrator.');
}

// Fallback server function
function startFallbackServer(message = 'The application is starting up. Please try again in a few minutes.') {
  console.log('Starting fallback server with message:', message);

  // Create a simple HTTP server
  const server = http.createServer((req, res) => {
    console.log(`Received request for ${req.url}`);

    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>SPOG Inventory</title>
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
            h1 { color: #0070f3; }
            p { margin-bottom: 20px; }
            code { background: #f0f0f0; padding: 2px 5px; border-radius: 3px; }
            pre { background: #f0f0f0; padding: 10px; border-radius: 5px; text-align: left; overflow: auto; max-height: 300px; }
          </style>
        </head>
        <body>
          <h1>MABES SPOG Inventory</h1>
          <p>${message}</p>
          <p>If the problem persists, please contact the administrator.</p>
          <p>Server running on port: <code>${port}</code></p>
          <p>Node version: <code>${process.version}</code></p>
          <p>Current time: <code>${new Date().toISOString()}</code></p>
          <p>Build status: <code>${fs.existsSync(path.join(process.cwd(), '.next/BUILD_ID')) ? 'Build exists' : 'No build found'}</code></p>
          <p>Server.js status: <code>${fs.existsSync(path.join(process.cwd(), 'server.js')) ? 'File exists' : 'File not found'}</code></p>
        </body>
      </html>
    `);
  });

  // Start the server
  server.listen(port, () => {
    console.log(`Fallback server running at http://localhost:${port}/`);
  });
}
