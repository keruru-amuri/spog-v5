// standalone-server.js - A simple server that works without Next.js build
const http = require('http');
const fs = require('fs');
const path = require('path');
const { execSync, exec } = require('child_process');
const os = require('os');

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
    // Get detailed information about the .next directory
    let nextDirInfo = 'Not found';
    if (fs.existsSync('.next')) {
      try {
        const nextContents = fs.readdirSync('.next').join(', ');
        const hasStandalone = fs.existsSync('.next/standalone') ? 'Yes' : 'No';
        const hasServer = fs.existsSync('.next/server') ? 'Yes' : 'No';
        const hasStatic = fs.existsSync('.next/static') ? 'Yes' : 'No';
        nextDirInfo = `Exists (Contents: ${nextContents}, Has standalone: ${hasStandalone}, Has server: ${hasServer}, Has static: ${hasStatic})`;
      } catch (e) {
        nextDirInfo = `Exists but error reading contents: ${e.message}`;
      }
    }

    // Get disk space information
    let diskInfo = 'Unknown';
    try {
      if (process.platform === 'linux') {
        diskInfo = execSync('df -h /').toString().trim();
      } else {
        diskInfo = 'Disk space check only available on Linux';
      }
    } catch (e) {
      diskInfo = `Error getting disk info: ${e.message}`;
    }

    sysInfo = `
      <h2>System Information</h2>
      <pre>
Directory: ${process.cwd()}
Files: ${fs.readdirSync('.').join(', ')}
Node Modules: ${fs.existsSync('node_modules') ? fs.readdirSync('node_modules').slice(0, 20).join(', ') + '... (truncated)' : 'Not found'}
.next directory: ${nextDirInfo}
package.json: ${fs.existsSync('package.json') ? 'Exists' : 'Not found'}
OS Platform: ${os.platform()}
OS Release: ${os.release()}
Total Memory: ${Math.round(os.totalmem() / (1024 * 1024))} MB
Free Memory: ${Math.round(os.freemem() / (1024 * 1024))} MB
CPUs: ${os.cpus().length}

Disk Space:
${diskInfo}
      </pre>
    `;
  } catch (error) {
    sysInfo = `<p>Error getting system info: ${error.message}</p>`;
  }

  // Try to get environment variables for debugging
  let envInfo = '';
  try {
    // Get Azure-specific environment variables
    const azureVars = {
      WEBSITE_SITE_NAME: process.env.WEBSITE_SITE_NAME || 'Not set',
      WEBSITE_INSTANCE_ID: process.env.WEBSITE_INSTANCE_ID || 'Not set',
      WEBSITE_RESOURCE_GROUP: process.env.WEBSITE_RESOURCE_GROUP || 'Not set',
      WEBSITE_SKU: process.env.WEBSITE_SKU || 'Not set',
      WEBSITE_HOSTNAME: process.env.WEBSITE_HOSTNAME || 'Not set',
      WEBSITE_CONTENTSHARE: process.env.WEBSITE_CONTENTSHARE || 'Not set',
      WEBSITE_CONTENTAZUREFILECONNECTIONSTRING: process.env.WEBSITE_CONTENTAZUREFILECONNECTIONSTRING ? 'Set (hidden)' : 'Not set'
    };

    // Get database connection variables (hide sensitive parts)
    const dbVars = {
      DATABASE_URL: process.env.DATABASE_URL ? 'Set (hidden for security)' : 'Not set',
      POSTGRES_URL: process.env.POSTGRES_URL ? 'Set (hidden for security)' : 'Not set',
      POSTGRES_PRISMA_URL: process.env.POSTGRES_PRISMA_URL ? 'Set (hidden for security)' : 'Not set',
      POSTGRES_URL_NON_POOLING: process.env.POSTGRES_URL_NON_POOLING ? 'Set (hidden for security)' : 'Not set',
      POSTGRES_USER: process.env.POSTGRES_USER || 'Not set',
      POSTGRES_HOST: process.env.POSTGRES_HOST || 'Not set',
      POSTGRES_PASSWORD: process.env.POSTGRES_PASSWORD ? 'Set (hidden for security)' : 'Not set',
      POSTGRES_DATABASE: process.env.POSTGRES_DATABASE || 'Not set'
    };

    envInfo = `
      <h2>Environment Variables</h2>
      <pre>
<b>Basic Environment:</b>
NODE_ENV: ${process.env.NODE_ENV || 'Not set'}
PORT: ${process.env.PORT || 'Not set'}
HOME: ${process.env.HOME || 'Not set'}
PATH: ${process.env.PATH || 'Not set'}

<b>Azure App Service Variables:</b>
${Object.entries(azureVars).map(([key, value]) => `${key}: ${value}`).join('\n')}

<b>Database Variables:</b>
${Object.entries(dbVars).map(([key, value]) => `${key}: ${value}`).join('\n')}
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

    // Get package.json information
    let packageInfo = 'Not available';
    if (fs.existsSync('package.json')) {
      try {
        const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
        packageInfo = `Name: ${packageJson.name || 'Not specified'}\nVersion: ${packageJson.version || 'Not specified'}\nMain: ${packageJson.main || 'Not specified'}\nDependencies: ${Object.keys(packageJson.dependencies || {}).length} items\nDevDependencies: ${Object.keys(packageJson.devDependencies || {}).length} items`;
      } catch (e) {
        packageInfo = `Error parsing package.json: ${e.message}`;
      }
    }

    // Check for build scripts
    let buildScripts = 'Not available';
    try {
      if (fs.existsSync('package.json')) {
        const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
        if (packageJson.scripts) {
          buildScripts = Object.entries(packageJson.scripts)
            .filter(([key]) => key.includes('build') || key.includes('start'))
            .map(([key, value]) => `${key}: ${value}`)
            .join('\n');
        } else {
          buildScripts = 'No scripts found in package.json';
        }
      }
    } catch (e) {
      buildScripts = `Error getting build scripts: ${e.message}`;
    }

    npmInfo = `
      <h2>NPM Information</h2>
      <pre>
npm version: ${npmVersion}
node version: ${nodeVersion}

<b>Package.json Information:</b>
${packageInfo}

<b>Build & Start Scripts:</b>
${buildScripts}
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
          body { font-family: Arial, sans-serif; text-align: center; padding: 20px; background-color: #f9fafb; }
          h1 { color: #0070f3; }
          h2 { color: #2563eb; margin-top: 30px; }
          p { margin-bottom: 20px; }
          code { background: #f0f0f0; padding: 2px 5px; border-radius: 3px; }
          pre { background: #f0f0f0; padding: 10px; border-radius: 5px; text-align: left; overflow: auto; max-height: 300px; }
          .container { max-width: 900px; margin: 0 auto; }
          .status { display: inline-block; padding: 5px 10px; border-radius: 3px; }
          .status.error { background-color: #ffdddd; color: #d32f2f; }
          .status.success { background-color: #ddffdd; color: #2e7d32; }
          .debug-section { margin-top: 30px; text-align: left; border-top: 1px solid #ddd; padding-top: 20px; }
          .card { background: white; border-radius: 8px; padding: 20px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
          .tabs { display: flex; margin-bottom: 20px; }
          .tab { padding: 10px 20px; cursor: pointer; border-bottom: 2px solid transparent; }
          .tab.active { border-bottom: 2px solid #0070f3; color: #0070f3; }
          .tab-content { display: none; }
          .tab-content.active { display: block; }
          .collapsible { cursor: pointer; padding: 10px; background-color: #f0f0f0; border: none; text-align: left; width: 100%; border-radius: 5px; margin-bottom: 10px; }
          .collapsible:after { content: '\\002B'; float: right; }
          .active:after { content: '\\2212'; }
          .content { max-height: 0; overflow: hidden; transition: max-height 0.2s ease-out; }
        </style>
        <script>
          function openTab(evt, tabName) {
            var i, tabcontent, tablinks;
            tabcontent = document.getElementsByClassName("tab-content");
            for (i = 0; i < tabcontent.length; i++) {
              tabcontent[i].style.display = "none";
            }
            tablinks = document.getElementsByClassName("tab");
            for (i = 0; i < tablinks.length; i++) {
              tablinks[i].className = tablinks[i].className.replace(" active", "");
            }
            document.getElementById(tabName).style.display = "block";
            evt.currentTarget.className += " active";
          }

          function toggleCollapsible() {
            this.classList.toggle("active");
            var content = this.nextElementSibling;
            if (content.style.maxHeight) {
              content.style.maxHeight = null;
            } else {
              content.style.maxHeight = content.scrollHeight + "px";
            }
          }

          window.onload = function() {
            // Set the first tab as active by default
            document.getElementsByClassName("tab")[0].click();

            // Add click event to all collapsible elements
            var coll = document.getElementsByClassName("collapsible");
            for (var i = 0; i < coll.length; i++) {
              coll[i].addEventListener("click", toggleCollapsible);
            }
          };
        </script>
      </head>
      <body>
        <div class="container">
          <div class="card">
            <h1>MABES SPOG Inventory</h1>
            <p>We're experiencing technical difficulties with the application deployment.</p>
            <p>Our team is working to resolve this issue as quickly as possible.</p>

            <div>
              <p>Server running on port: <code>${port}</code></p>
              <p>Node version: <code>${process.version}</code></p>
              <p>Current time: <code>${new Date().toISOString()}</code></p>
            </div>
          </div>

          <div class="card">
            <h2>Troubleshooting Status</h2>
            <div class="status ${fs.existsSync('.next') ? 'success' : 'error'}">
              Next.js Build: ${fs.existsSync('.next') ? 'Found' : 'Missing'}
            </div>
            <div class="status ${fs.existsSync('node_modules') ? 'success' : 'error'}">
              Node Modules: ${fs.existsSync('node_modules') ? 'Installed' : 'Missing'}
            </div>
            <div class="status ${process.env.NODE_ENV === 'production' ? 'success' : 'error'}">
              Environment: ${process.env.NODE_ENV || 'Not set'}
            </div>

            <h3>Common Solutions:</h3>
            <ul style="text-align: left;">
              <li>Check if the build process completed successfully</li>
              <li>Verify that all required environment variables are set</li>
              <li>Ensure that the application has sufficient memory and disk space</li>
              <li>Check for any errors in the build logs</li>
            </ul>
          </div>

          <div class="debug-section">
            <h2>Diagnostic Information</h2>
            <p>This information will help our technical team resolve the issue:</p>

            <div class="tabs">
              <button class="tab" onclick="openTab(event, 'system')">System Info</button>
              <button class="tab" onclick="openTab(event, 'environment')">Environment</button>
              <button class="tab" onclick="openTab(event, 'npm')">NPM & Build</button>
            </div>

            <div id="system" class="tab-content">
              ${sysInfo}
            </div>

            <div id="environment" class="tab-content">
              ${envInfo}
            </div>

            <div id="npm" class="tab-content">
              ${npmInfo}
            </div>
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
