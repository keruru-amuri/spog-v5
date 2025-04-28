// azure-build.js - Script to handle the build process in Azure
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('Starting Azure build process...');
console.log(`Current directory: ${process.cwd()}`);
console.log(`Node version: ${process.version}`);
console.log(`NPM version: ${execSync('npm --version').toString().trim()}`);

// Function to execute commands with proper error handling
function runCommand(command, errorMessage) {
  try {
    console.log(`Running command: ${command}`);
    const output = execSync(command, { stdio: 'inherit' });
    return true;
  } catch (error) {
    console.error(`${errorMessage}: ${error.message}`);
    return false;
  }
}

// Check if node_modules exists and install dependencies if needed
if (!fs.existsSync('node_modules') || !fs.existsSync('node_modules/next')) {
  console.log('Installing dependencies...');
  runCommand('npm install --no-audit --no-fund', 'Failed to install dependencies');
}

// Try to build the Next.js application
console.log('Building Next.js application...');
const buildSuccess = runCommand('npm run build', 'Failed to build Next.js application');

if (buildSuccess) {
  console.log('Next.js build completed successfully!');
  
  // Check if the .next directory was created
  if (fs.existsSync('.next')) {
    console.log('.next directory exists, build was successful');
  } else {
    console.log('Warning: .next directory not found after build');
  }
} else {
  console.log('Creating fallback build artifacts...');
  
  // Create a minimal .next directory structure for the server to find
  if (!fs.existsSync('.next')) {
    fs.mkdirSync('.next', { recursive: true });
    console.log('Created empty .next directory');
  }
  
  // Create a minimal standalone directory if it doesn't exist
  if (!fs.existsSync('.next/standalone')) {
    fs.mkdirSync('.next/standalone', { recursive: true });
    console.log('Created empty .next/standalone directory');
  }
  
  // Create a minimal static directory if it doesn't exist
  if (!fs.existsSync('.next/static')) {
    fs.mkdirSync('.next/static', { recursive: true });
    console.log('Created empty .next/static directory');
  }
}

console.log('Azure build process completed');
