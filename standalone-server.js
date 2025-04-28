// standalone-server.js - A simple server that works without Next.js build
const http = require('http');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Set up environment variables
const port = process.env.PORT || 8080;

console.log(`Starting standalone server on port ${port}`);
console.log(`Current directory: ${process.cwd()}`);
console.log(`Node version: ${process.version}`);

// Create a simple HTTP server
const server = http.createServer((req, res) => {
  console.log(`Received request for ${req.url}`);
  
  // Try to get system information for debugging
  let sysInfo = '';
  try {
    sysInfo = `
      <h2>System Information</h2>
      <pre>
Directory: ${process.cwd()}
Files: ${fs.readdirSync('.').join(', ')}
Node Modules: ${fs.existsSync('node_modules') ? fs.readdirSync('node_modules').join(', ') : 'Not found'}
.next directory: ${fs.existsSync('.next') ? 'Exists' : 'Not found'}
package.json: ${fs.existsSync('package.json') ? 'Exists' : 'Not found'}
      </pre>
    `;
  } catch (error) {
    sysInfo = `<p>Error getting system info: ${error.message}</p>`;
  }

  // Try to get environment variables for debugging
  let envInfo = '';
  try {
    envInfo = `
      <h2>Environment Variables</h2>
      <pre>
NODE_ENV: ${process.env.NODE_ENV || 'Not set'}
PORT: ${process.env.PORT || 'Not set'}
HOME: ${process.env.HOME || 'Not set'}
PATH: ${process.env.PATH || 'Not set'}
      </pre>
    `;
  } catch (error) {
    envInfo = `<p>Error getting environment info: ${error.message}</p>`;
  }

  // Try to run npm commands for debugging
  let npmInfo = '';
  try {
    const npmVersion = execSync('npm --version').toString().trim();
    const nodeVersion = execSync('node --version').toString().trim();
    npmInfo = `
      <h2>NPM Information</h2>
      <pre>
npm version: ${npmVersion}
node version: ${nodeVersion}
      </pre>
    `;
  } catch (error) {
    npmInfo = `<p>Error getting npm info: ${error.message}</p>`;
  }

  // Send the response
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>MABES SPOG Inventory</title>
        <style>
          body { font-family: Arial, sans-serif; text-align: center; padding: 20px; }
          h1 { color: #0070f3; }
          p { margin-bottom: 20px; }
          code { background: #f0f0f0; padding: 2px 5px; border-radius: 3px; }
          pre { background: #f0f0f0; padding: 10px; border-radius: 5px; text-align: left; overflow: auto; max-height: 300px; }
          .container { max-width: 800px; margin: 0 auto; }
          .status { display: inline-block; padding: 5px 10px; border-radius: 3px; }
          .status.error { background-color: #ffdddd; color: #d32f2f; }
          .debug-section { margin-top: 30px; text-align: left; border-top: 1px solid #ddd; padding-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>MABES SPOG Inventory</h1>
          <p>We're experiencing technical difficulties with the application deployment.</p>
          <p>Our team is working to resolve this issue as quickly as possible.</p>
          
          <div>
            <p>Server running on port: <code>${port}</code></p>
            <p>Node version: <code>${process.version}</code></p>
            <p>Current time: <code>${new Date().toISOString()}</code></p>
          </div>
          
          <div class="debug-section">
            <h2>Diagnostic Information</h2>
            <p>This information will help our technical team resolve the issue:</p>
            ${sysInfo}
            ${envInfo}
            ${npmInfo}
          </div>
        </div>
      </body>
    </html>
  `);
});

// Start the server
server.listen(port, () => {
  console.log(`Standalone server running at http://localhost:${port}/`);
});
