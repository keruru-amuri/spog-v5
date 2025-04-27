// Simple fallback server for Azure Web App
const http = require('http');

// Set up environment variables
const port = process.env.PORT || 8080;

console.log(`Starting fallback server on port ${port}`);
console.log(`Current directory: ${process.cwd()}`);
console.log(`Node version: ${process.version}`);

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
        </style>
      </head>
      <body>
        <h1>SPOG Inventory</h1>
        <p>The application is starting up. Please try again in a few minutes.</p>
        <p>If the problem persists, please contact the administrator.</p>
        <p>Server running on port: <code>${port}</code></p>
        <p>Node version: <code>${process.version}</code></p>
        <p>Current time: <code>${new Date().toISOString()}</code></p>
      </body>
    </html>
  `);
});

// Start the server
server.listen(port, () => {
  console.log(`Fallback server running at http://localhost:${port}/`);
});
