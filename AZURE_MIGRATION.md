# Supabase to Azure PostgreSQL Migration Guide

This document provides instructions for migrating the MABES SPOG Inventory application database from Supabase to Azure PostgreSQL.

## Prerequisites

- Azure PostgreSQL Flexible Server (already set up)
- PostgreSQL client tools (`psql`, `pg_dump`)
- Access to Supabase database credentials
- Node.js and npm/pnpm

## Migration Steps

### 1. Export Data from Supabase

1. Make sure your `.env.local` file contains the Supabase credentials:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_KEY=your_supabase_service_key
   ```

2. Run the export script:
   ```bash
   chmod +x scripts/export-supabase.sh
   ./scripts/export-supabase.sh
   ```

3. This will create a `db_export` directory with the following files:
   - `schema.sql`: Database schema without data
   - `data.sql`: Data without schema
   - Individual table exports (e.g., `users.sql`, `inventory_items.sql`, etc.)

### 2. Import Data to Azure PostgreSQL

1. Create a `.env.azure` file based on the `.env.azure.example` template:
   ```
   DB_PROVIDER=azure
   POSTGRES_HOST=spog-inventory-db.postgres.database.azure.com
   POSTGRES_PORT=5432
   POSTGRES_DB=postgres
   POSTGRES_USER=spogadmin
   POSTGRES_PASSWORD=your_actual_password
   ```

2. Update the password in the import script:
   ```bash
   nano scripts/import-to-azure.sh
   # Update AZURE_DB_PASSWORD with your actual password
   ```

3. Run the import script:
   ```bash
   chmod +x scripts/import-to-azure.sh
   ./scripts/import-to-azure.sh
   ```

### 3. Verify the Migration

1. Connect to Azure PostgreSQL to verify the data:
   ```bash
   psql -h spog-inventory-db.postgres.database.azure.com -U spogadmin -d postgres
   ```

2. Run some queries to check the data:
   ```sql
   SELECT COUNT(*) FROM users;
   SELECT COUNT(*) FROM inventory_items;
   ```

### 4. Update Application Configuration

1. Update the environment variables in Azure Web App:
   - Go to Azure Portal > App Services > your-app > Configuration
   - Add the following Application settings:
     ```
     DB_PROVIDER=azure
     POSTGRES_HOST=spog-inventory-db.postgres.database.azure.com
     POSTGRES_PORT=5432
     POSTGRES_DB=postgres
     POSTGRES_USER=spogadmin
     POSTGRES_PASSWORD=your_actual_password
     ```

2. Keep the Supabase environment variables for now (for authentication):
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_KEY=your_supabase_service_key
   ```

### 5. Deploy the Updated Application

1. Commit and push the changes to GitHub:
   ```bash
   git add .
   git commit -m "Add Azure PostgreSQL support"
   git push origin master
   ```

2. The GitHub Actions workflow will deploy the updated application to Azure Web App.

### 6. Test the Application

1. Test all functionality to ensure it works with Azure PostgreSQL.
2. Check for any errors in the application logs.

### 7. Complete the Migration

Once you've verified that everything works correctly with Azure PostgreSQL:

1. Update the application to use Azure for authentication (if needed).
2. Remove the Supabase environment variables from Azure Web App.
3. Close your Supabase account or project (if no longer needed).

## Troubleshooting

### Connection Issues

If you encounter connection issues to Azure PostgreSQL:

1. Check that the firewall rules allow connections from your Azure Web App.
2. Verify that the connection string is correct.
3. Check that SSL is enabled for the connection.

### Data Migration Issues

If you encounter issues during data migration:

1. Check for any errors in the export or import scripts.
2. Verify that the database schema is compatible with Azure PostgreSQL.
3. Check for any Supabase-specific functions or extensions that might not be available in Azure PostgreSQL.

### Application Issues

If the application doesn't work correctly after migration:

1. Check the application logs for errors.
2. Verify that the database queries are compatible with Azure PostgreSQL.
3. Check that the connection pool is configured correctly.

## Resources

- [Azure PostgreSQL Documentation](https://docs.microsoft.com/en-us/azure/postgresql/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Node-Postgres Documentation](https://node-postgres.com/)
