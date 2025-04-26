#!/bin/bash
# Script to export schema and data from Supabase

# Load environment variables
source .env.local

# Check if required environment variables are set
if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_KEY" ]; then
  echo "Error: Supabase environment variables are not set."
  echo "Please make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_KEY are set in .env.local"
  exit 1
fi

# Extract host from Supabase URL
SUPABASE_HOST=$(echo $NEXT_PUBLIC_SUPABASE_URL | sed -e 's|^https://||' -e 's|\.supabase\.co.*$||')
SUPABASE_DB_HOST="db.${SUPABASE_HOST}.supabase.co"
SUPABASE_DB_PORT=5432
SUPABASE_DB_NAME="postgres"
SUPABASE_DB_USER="postgres"

# Get password from service key (this is a simplification, you might need to adjust)
SUPABASE_DB_PASSWORD=$SUPABASE_SERVICE_KEY

# Create output directory
mkdir -p db_export

# Export schema only (no data)
echo "Exporting database schema..."
PGPASSWORD=$SUPABASE_DB_PASSWORD pg_dump -h $SUPABASE_DB_HOST -p $SUPABASE_DB_PORT -U $SUPABASE_DB_USER -d $SUPABASE_DB_NAME --schema-only -f db_export/schema.sql

# Export data only (no schema)
echo "Exporting database data..."
PGPASSWORD=$SUPABASE_DB_PASSWORD pg_dump -h $SUPABASE_DB_HOST -p $SUPABASE_DB_PORT -U $SUPABASE_DB_USER -d $SUPABASE_DB_NAME --data-only -f db_export/data.sql

# Export specific tables with both schema and data
echo "Exporting specific tables..."
for table in "users" "inventory_items" "consumption_records" "departments" "categories" "locations" "units_of_measure"
do
  echo "Exporting table: $table"
  PGPASSWORD=$SUPABASE_DB_PASSWORD pg_dump -h $SUPABASE_DB_HOST -p $SUPABASE_DB_PORT -U $SUPABASE_DB_USER -d $SUPABASE_DB_NAME -t $table -f "db_export/${table}.sql"
done

echo "Export completed. Files are in the db_export directory."
