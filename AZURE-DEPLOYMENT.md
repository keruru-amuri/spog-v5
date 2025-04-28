# Azure Deployment Instructions for MABES SPOG Inventory

This document provides instructions for deploying the MABES SPOG Inventory application to Azure App Service.

## Current Deployment Status

The application is currently experiencing build issues in Azure. We've implemented a fallback standalone server to help diagnose and resolve these issues.

## Deployment Files

The following files have been created or modified to support Azure deployment:

1. `standalone-server.js` - A simple HTTP server that works without requiring a Next.js build
2. `server.js` - Modified to use the standalone server as a fallback
3. `web.config` - Updated to use the standalone server
4. `package.json` - Updated with Azure-specific scripts and relaxed Node.js version requirements
5. `azure-simple-startup.sh` - A simple startup script for Azure

## Deployment Steps

1. **Push the latest code to your repository**

2. **Deploy to Azure App Service**
   - Use the Azure Portal or Azure CLI to deploy the application
   - Make sure to set the startup command to one of the following:
     - `npm run azure-start`
     - `node standalone-server.js`

3. **Configure Environment Variables**
   - Set the following environment variables in the Azure Portal:
     - `NODE_ENV=production`
     - `PORT=8080` (or the port assigned by Azure)
     - Any other environment variables required by your application

4. **Monitor the Application**
   - After deployment, monitor the application logs in the Azure Portal
   - The standalone server will provide diagnostic information to help troubleshoot issues

## Troubleshooting

If you encounter issues with the deployment, check the following:

1. **Application Logs**
   - Review the application logs in the Azure Portal
   - Look for error messages related to the build process or server startup

2. **Node.js Version**
   - Make sure Azure is using a compatible Node.js version
   - The package.json has been updated to require Node.js 18.0.0 or higher

3. **Build Process**
   - If the Next.js build is failing, try using the standalone server as a temporary solution
   - Once the application is accessible, you can work on fixing the build issues

4. **File Permissions**
   - Make sure the startup script has execute permissions
   - You may need to run `chmod +x azure-simple-startup.sh` before deployment

## Next Steps

Once the application is successfully deployed and accessible, focus on the following:

1. **Fix the Next.js build process**
   - Identify and resolve any issues preventing the Next.js build from completing

2. **Migrate from Supabase to Azure PostgreSQL**
   - Update the database connection configuration to use Azure PostgreSQL
   - Test the database connection and functionality

3. **Implement proper authentication**
   - Migrate authentication from Supabase to Azure AD or another authentication provider
   - Implement row-level security policies

4. **Enable full application functionality**
   - Once the core infrastructure is working, enable all application features
   - Test thoroughly to ensure everything works as expected
