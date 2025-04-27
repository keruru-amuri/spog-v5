// server.js
const { createServer } = require('http');
const { parse } = require('url');
const path = require('path');

// In production, we need to use the standalone output
const dev = process.env.NODE_ENV !== 'production';
const hostname = process.env.HOST || 'localhost';
const port = process.env.PORT || 3000;

// Log environment for debugging
console.log(`Starting server with NODE_ENV=${process.env.NODE_ENV}, PORT=${port}`);
console.log(`Current directory: ${process.cwd()}`);

// Determine the location of the Next.js installation
let nextPath;
if (dev) {
  // In development, use the local next module
  nextPath = 'next';
} else {
  // In production with standalone output, use the bundled next
  nextPath = path.join(process.cwd(), '.next/standalone/node_modules/next');
}

console.log(`Using Next.js from: ${nextPath}`);

// Try to require Next.js
let next;
try {
  next = require(nextPath);
  console.log('Successfully loaded Next.js');
} catch (error) {
  console.error('Failed to load Next.js:', error);
  // Fallback to regular next
  try {
    next = require('next');
    console.log('Loaded Next.js from node_modules');
  } catch (fallbackError) {
    console.error('Failed to load Next.js from node_modules:', fallbackError);
    process.exit(1);
  }
}

// Initialize Next.js
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

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
});
