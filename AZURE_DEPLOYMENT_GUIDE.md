# MABES SPOG Inventory - Azure Deployment Guide

This guide provides detailed instructions for deploying the MABES SPOG Inventory application to Azure App Service.

## Prerequisites

- Azure account with an active subscription
- Azure CLI installed locally (optional, for command-line deployment)
- Git installed locally

## Deployment Options

### Option 1: Azure Portal Deployment

1. **Create an Azure App Service**:
   - Log in to the Azure Portal
   - Create a new Web App resource
   - Select the appropriate subscription and resource group
   - Configure the following settings:
     - **Name**: Choose a unique name for your app
     - **Publish**: Code
     - **Runtime stack**: Node.js 18 LTS or newer
     - **Operating System**: Linux
     - **Region**: Choose a region close to your users
     - **App Service Plan**: Create a new plan or select an existing one
   - Click "Review + create" and then "Create"

2. **Configure Deployment Source**:
   - In the App Service resource, go to "Deployment Center"
   - Select "GitHub" as the source
   - Connect your GitHub account and select the repository
   - Configure the build provider (Kudu/App Service build service)
   - Click "Save"

3. **Configure Application Settings**:
   - In the App Service resource, go to "Configuration" > "Application settings"
   - Add the following settings:
     - `NODE_ENV`: `production`
     - `PORT`: `8080`
     - Database connection settings (see Database Configuration section)
   - Click "Save"

4. **Configure Startup Command**:
   - In the App Service resource, go to "Configuration" > "General settings"
   - Set the startup command to: `/home/site/wwwroot/azure-startup.sh`
   - Click "Save"

### Option 2: Azure CLI Deployment

1. **Create an Azure App Service**:
   ```bash
   # Login to Azure
   az login

   # Create a resource group (if needed)
   az group create --name myResourceGroup --location eastus

   # Create an App Service Plan
   az appservice plan create --name myAppServicePlan --resource-group myResourceGroup --sku B1 --is-linux

   # Create a Web App
   az webapp create --name myWebApp --resource-group myResourceGroup --plan myAppServicePlan --runtime "NODE|18-lts"
   ```

2. **Configure Application Settings**:
   ```bash
   # Set application settings
   az webapp config appsettings set --name myWebApp --resource-group myResourceGroup --settings NODE_ENV=production PORT=8080
   
   # Set database connection settings
   az webapp config appsettings set --name myWebApp --resource-group myResourceGroup --settings DATABASE_URL="your-database-connection-string"
   ```

3. **Configure Startup Command**:
   ```bash
   # Set startup command
   az webapp config set --name myWebApp --resource-group myResourceGroup --startup-file "/home/site/wwwroot/azure-startup.sh"
   ```

4. **Deploy from Git**:
   ```bash
   # Configure local Git deployment
   az webapp deployment source config-local-git --name myWebApp --resource-group myResourceGroup

   # Add Azure as a remote
   git remote add azure <git-url-from-previous-command>

   # Push to Azure
   git push azure main
   ```

## Database Configuration

### Azure PostgreSQL Database

1. **Create an Azure Database for PostgreSQL**:
   - In the Azure Portal, create a new "Azure Database for PostgreSQL" resource
   - Select the appropriate subscription and resource group
   - Configure the server details (name, admin username, password)
   - Click "Review + create" and then "Create"

2. **Configure Firewall Rules**:
   - In the PostgreSQL resource, go to "Connection security"
   - Add a firewall rule to allow connections from Azure services
   - Add your client IP address if you need to connect from your local machine
   - Click "Save"

3. **Create the Database**:
   - Connect to the PostgreSQL server using a tool like pgAdmin or psql
   - Create a new database for the application

4. **Configure Environment Variables**:
   - In the App Service resource, add the following environment variables:
     - `POSTGRES_HOST`: Your PostgreSQL server hostname
     - `POSTGRES_USER`: Your PostgreSQL admin username
     - `POSTGRES_PASSWORD`: Your PostgreSQL admin password
     - `POSTGRES_DATABASE`: Your database name
     - `DATABASE_URL`: The full connection string in the format:
       `postgresql://<username>:<password>@<hostname>:5432/<database>`

## Troubleshooting

### Common Issues

1. **Application fails to start**:
   - Check the application logs in the Azure Portal (App Service > Logs)
   - Verify that the startup command is correctly set
   - Ensure all required environment variables are configured

2. **Database connection issues**:
   - Verify that the database connection string is correct
   - Check that the firewall rules allow connections from the App Service
   - Ensure the database user has the necessary permissions

3. **Build failures**:
   - Check the deployment logs in the Azure Portal
   - Verify that the Node.js version is compatible with your application
   - Ensure that all dependencies are correctly specified in package.json

### Diagnostic Tools

1. **Log Streaming**:
   - In the App Service resource, go to "Log stream" to view real-time logs

2. **Kudu Console**:
   - Access the Kudu console at `https://<app-name>.scm.azurewebsites.net/DebugConsole`
   - Use the console to navigate the file system and run commands

3. **Application Insights**:
   - Consider enabling Application Insights for more detailed monitoring

## Maintenance

### Scaling

- In the App Service resource, go to "Scale up (App Service plan)" to change the pricing tier
- Go to "Scale out" to configure auto-scaling rules

### Monitoring

- In the App Service resource, go to "Metrics" to view performance metrics
- Set up alerts for important metrics like CPU usage and response time

### Updates

- Deploy updates using the same method as the initial deployment
- Consider setting up a CI/CD pipeline for automated deployments

## Security Best Practices

1. **Enable HTTPS Only**:
   - In the App Service resource, go to "TLS/SSL settings"
   - Enable "HTTPS Only"

2. **Configure Authentication**:
   - In the App Service resource, go to "Authentication"
   - Configure authentication providers as needed

3. **Secure Secrets**:
   - Use Azure Key Vault to store sensitive information
   - Configure the App Service to access Key Vault using a managed identity

## Additional Resources

- [Azure App Service Documentation](https://docs.microsoft.com/en-us/azure/app-service/)
- [Node.js on Azure App Service](https://docs.microsoft.com/en-us/azure/app-service/quickstart-nodejs)
- [Azure Database for PostgreSQL Documentation](https://docs.microsoft.com/en-us/azure/postgresql/)
