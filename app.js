// app.js - Entry point for Azure Web App
const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

// Set up environment variables
const port = process.env.PORT || 8080;

console.log(`Starting app.js on port ${port}`);
console.log(`Current directory: ${process.cwd()}`);
console.log(`Node version: ${process.version}`);
console.log(`Directory contents: ${fs.readdirSync('.').join(', ')}`);

// Check if server.js exists
if (fs.existsSync(path.join(process.cwd(), 'server.js'))) {
  console.log('Found server.js, starting it...');
  
  // Start server.js as a child process
  const serverProcess = spawn('node', ['server.js'], {
    stdio: 'inherit',
    env: { ...process.env, PORT: port }
  });
  
  serverProcess.on('error', (err) => {
    console.error('Failed to start server.js:', err);
    startFallbackServer();
  });
  
  serverProcess.on('exit', (code, signal) => {
    console.log(`server.js exited with code ${code} and signal ${signal}`);
    if (code !== 0) {
      startFallbackServer();
    }
  });
} else {
  console.log('server.js not found, starting fallback server...');
  startFallbackServer();
}

// Fallback server function
function startFallbackServer() {
  console.log('Starting fallback server...');
  
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
          <h1>SPOG Inventory</h1>
          <p>The application is starting up. Please try again in a few minutes.</p>
          <p>If the problem persists, please contact the administrator.</p>
          <p>Server running on port: <code>${port}</code></p>
          <p>Node version: <code>${process.version}</code></p>
          <p>Current time: <code>${new Date().toISOString()}</code></p>
          <p>Directory contents:</p>
          <pre>${fs.readdirSync('.').join('\n')}</pre>
        </body>
      </html>
    `);
  });
  
  // Start the server
  server.listen(port, () => {
    console.log(`Fallback server running at http://localhost:${port}/`);
  });
}
