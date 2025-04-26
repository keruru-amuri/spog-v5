# Azure Deployment Guide for MABES SPOG Inventory

This guide provides instructions for deploying the MABES SPOG Inventory application to Azure Web App (Linux) and connecting it to Azure Database for PostgreSQL.

## Prerequisites

- Azure account with an active subscription
- GitHub repository with the application code
- Azure CLI installed (optional, for command-line deployment)

## Deployment Steps

### 1. Create Azure Resources

#### Create an Azure Web App

1. Go to the Azure Portal (https://portal.azure.com)
2. Create a new Web App resource
   - Select Linux as the operating system
   - Select Node.js as the runtime stack
   - Select Node.js 22 LTS as the version
   - Choose an appropriate App Service Plan

#### Create an Azure Database for PostgreSQL

1. Go to the Azure Portal
2. Create a new Azure Database for PostgreSQL resource
   - Choose the Flexible Server option for better performance and cost
   - Configure server name, admin credentials, and other settings
   - Create a new database for the application

### 2. Configure Web App Deployment

#### Set up GitHub Actions Deployment

1. In the Azure Portal, navigate to your Web App
2. Go to Deployment Center
3. Select GitHub as the source
4. Authenticate with GitHub and select your repository
5. Configure the build provider (GitHub Actions)
6. Review and complete the setup

#### Configure Application Settings (Environment Variables)

1. In the Azure Portal, navigate to your Web App
2. Go to Configuration > Application settings
3. Add the following application settings:
   - `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase URL (during migration)
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anon key (during migration)
   - `SUPABASE_SERVICE_KEY`: Your Supabase service key (during migration)
   - `POSTGRES_HOST`: Your Azure PostgreSQL server hostname
   - `POSTGRES_PORT`: Your Azure PostgreSQL server port (usually 5432)
   - `POSTGRES_USER`: Your Azure PostgreSQL admin username
   - `POSTGRES_PASSWORD`: Your Azure PostgreSQL admin password
   - `POSTGRES_DB`: Your Azure PostgreSQL database name
   - `NODE_ENV`: Set to "production"

#### Configure Startup Command

1. In the Azure Portal, navigate to your Web App
2. Go to Configuration > General settings
3. Set the Startup Command to: `./startup.sh`

### 3. Database Migration

#### Option 1: Direct Migration from Supabase to Azure PostgreSQL

1. Use pg_dump to export data from Supabase
   ```bash
   pg_dump -h db.YOUR_SUPABASE_PROJECT.supabase.co -U postgres -d postgres -f spog_backup.sql
   ```

2. Import the data to Azure PostgreSQL
   ```bash
   psql -h YOUR_AZURE_POSTGRES_SERVER.postgres.database.azure.com -U YOUR_ADMIN_USER -d YOUR_DATABASE -f spog_backup.sql
   ```

#### Option 2: Use the Application's Migration Scripts

1. Update the database connection configuration to point to Azure PostgreSQL
2. Run the migration scripts:
   ```bash
   npm run migrate:up
   ```

### 4. Verify Deployment

1. Navigate to your Web App URL
2. Verify that the application is running correctly
3. Check logs for any errors:
   - In the Azure Portal, navigate to your Web App
   - Go to Monitoring > Log stream

## Troubleshooting

### Common Issues

1. **Connection Issues to PostgreSQL**
   - Verify that the Azure PostgreSQL server allows connections from Azure services
   - Check firewall rules to ensure the Web App can connect to the database

2. **Node.js Version Compatibility**
   - Ensure the Node.js version in Azure matches the version specified in package.json

3. **Build Failures**
   - Check the deployment logs for specific error messages
   - Verify that all dependencies are correctly specified in package.json

4. **Runtime Errors**
   - Check the application logs in the Azure Portal
   - Verify that all required environment variables are set correctly

## Migrating from Supabase to Azure PostgreSQL

### Database Schema Migration

1. Export the database schema from Supabase
2. Modify the schema as needed for Azure PostgreSQL
3. Import the schema to Azure PostgreSQL

### Data Migration

1. Export data from Supabase tables
2. Transform data if necessary
3. Import data to Azure PostgreSQL tables

### Application Code Updates

1. Update database connection code to use Azure PostgreSQL instead of Supabase
2. Update authentication code if moving away from Supabase Auth
3. Test thoroughly before deploying to production

## Resources

- [Azure Web Apps Documentation](https://docs.microsoft.com/en-us/azure/app-service/)
- [Azure PostgreSQL Documentation](https://docs.microsoft.com/en-us/azure/postgresql/)
- [Next.js Deployment Documentation](https://nextjs.org/docs/deployment)
