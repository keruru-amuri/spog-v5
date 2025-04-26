#!/bin/bash
# Script to import schema and data to Azure PostgreSQL

# Azure PostgreSQL connection details
AZURE_DB_HOST="spog-inventory-db.postgres.database.azure.com"
AZURE_DB_PORT=5432
AZURE_DB_NAME="postgres"  # Change this if you created a different database
AZURE_DB_USER="spogadmin"
AZURE_DB_PASSWORD="your_password_here"  # Replace with actual password

# Check if db_export directory exists
if [ ! -d "db_export" ]; then
  echo "Error: db_export directory not found. Run export-supabase.sh first."
  exit 1
fi

# Create database objects
echo "Creating database schema..."
PGPASSWORD=$AZURE_DB_PASSWORD psql -h $AZURE_DB_HOST -p $AZURE_DB_PORT -U $AZURE_DB_USER -d $AZURE_DB_NAME -f db_export/schema.sql

# Import data
echo "Importing data..."
PGPASSWORD=$AZURE_DB_PASSWORD psql -h $AZURE_DB_HOST -p $AZURE_DB_PORT -U $AZURE_DB_USER -d $AZURE_DB_NAME -f db_export/data.sql

echo "Import completed."
