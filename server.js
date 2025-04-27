// server.js
const { createServer } = require('http');
const { parse } = require('url');
const { join } = require('path');
const { existsSync } = require('fs');

// Set up environment variables
const dev = process.env.NODE_ENV !== 'production';
const hostname = process.env.HOST || 'localhost';
const port = parseInt(process.env.PORT || '3000', 10);

// Log environment for debugging
console.log(`Starting server with NODE_ENV=${process.env.NODE_ENV}, PORT=${port}`);
console.log(`Current directory: ${process.cwd()}`);
console.log(`Directory contents: ${require('fs').readdirSync('.').join(', ')}`);

// Try to require Next.js with multiple fallbacks
let next;
try {
  // First try the regular next module
  next = require('next');
  console.log('Successfully loaded Next.js from node_modules');
} catch (error) {
  console.error('Failed to load Next.js from node_modules:', error);

  try {
    // Try to find next in the standalone directory
    const standalonePath = join(process.cwd(), '.next/standalone/node_modules/next');
    next = require(standalonePath);
    console.log(`Successfully loaded Next.js from ${standalonePath}`);
  } catch (standaloneError) {
    console.error('Failed to load Next.js from standalone path:', standaloneError);

    try {
      // Try to find next in the parent directory
      const parentPath = join(process.cwd(), '../node_modules/next');
      next = require(parentPath);
      console.log(`Successfully loaded Next.js from ${parentPath}`);
    } catch (parentError) {
      console.error('Failed to load Next.js from parent path:', parentError);

      // As a last resort, create a simple HTTP server
      console.log('Creating a simple HTTP server as fallback');
      const server = createServer((req, res) => {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>MABES SPOG Inventory</title>
              <style>
                body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
                h1 { color: #0070f3; }
                p { margin-bottom: 20px; }
              </style>
            </head>
            <body>
              <h1>MABES SPOG Inventory</h1>
              <p>The application is starting up. Please try again in a few minutes.</p>
              <p>If the problem persists, please contact the administrator.</p>
              <p>Error: ${error.message}</p>
            </body>
          </html>
        `);
      });

      server.listen(port, () => {
        console.log(`> Fallback server ready on http://${hostname}:${port}`);
      });

      return; // Exit the script here
    }
  }
}

// Initialize Next.js
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// Check if we're in the standalone directory
const inStandalone = existsSync(join(process.cwd(), 'server.js')) &&
                    existsSync(join(process.cwd(), '.next/standalone'));

console.log(`Running in standalone mode: ${inStandalone}`);

// If we're not in the standalone directory but it exists, copy the necessary files
if (!inStandalone && existsSync(join(process.cwd(), '.next/standalone'))) {
  console.log('Not in standalone directory, but it exists. Consider using it directly.');
}

// Prepare the Next.js app and start the server
app.prepare().then(() => {
  createServer(async (req, res) => {
    try {
      // Parse the URL
      const parsedUrl = parse(req.url, true);

      // Let Next.js handle the request
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
}).catch(err => {
  console.error('Error preparing Next.js app:', err);

  // Create a fallback server if Next.js fails to start
  const server = createServer((req, res) => {
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
            pre { background: #f0f0f0; padding: 10px; border-radius: 5px; text-align: left; overflow: auto; }
          </style>
        </head>
        <body>
          <h1>SPOG Inventory</h1>
          <p>The application encountered an error during startup.</p>
          <p>Please try again in a few minutes or contact the administrator.</p>
          <pre>${err.stack || err.message}</pre>
        </body>
      </html>
    `);
  });

  server.listen(port, () => {
    console.log(`> Error fallback server ready on http://${hostname}:${port}`);
  });
});
