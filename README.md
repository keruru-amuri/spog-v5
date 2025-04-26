# MABES SPOG Inventory Management System

A comprehensive inventory management system for MABES SPOG, built with Next.js, React, and Azure.

## Features

- User authentication and role-based access control
- Inventory management with categorization (S/P/O/G)
- Consumption tracking
- Reporting and analytics
- User management for administrators

## Deployment

### Vercel Deployment

To deploy this application to Vercel:

1. Connect your GitHub repository to Vercel
2. Configure the following environment variables in Vercel:
   - `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anonymous key
   - `SUPABASE_SERVICE_KEY`: Your Supabase service key (for admin operations)

3. Deploy the application

### Azure Deployment

To deploy this application to Azure:

1. Create an Azure Web App
2. Configure the deployment source to your GitHub repository
3. Set up the environment variables in the Azure Web App Configuration
4. Deploy the application

## Development

### Prerequisites

- Node.js 18.x or later
- pnpm package manager

### Setup

1. Clone the repository
2. Install dependencies:
   ```
   pnpm install
   ```
3. Create a `.env.local` file with the required environment variables
4. Start the development server:
   ```
   pnpm dev
   ```

### Testing

Run tests with:
```
pnpm test
```

## License

This project is proprietary and confidential.
