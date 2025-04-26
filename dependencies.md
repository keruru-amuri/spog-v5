# Dependencies Document
# SPOG Inventory Management Web App

## 1. Introduction

This document outlines the dependencies required for the SPOG Inventory Management Web App. It includes frontend dependencies, backend dependencies, development dependencies, and external services that the application relies on.

## 2. Core Dependencies

### 2.1 Frontend Dependencies

| Dependency | Version | Purpose |
|------------|---------|---------|
| Next.js | 15.2.4 | React framework for server-rendered applications |
| React | ^19 | JavaScript library for building user interfaces |
| React DOM | ^19 | React package for DOM rendering |
| TypeScript | ^5 | Typed JavaScript |
| Tailwind CSS | ^3.4.17 | Utility-first CSS framework |
| tailwindcss-animate | ^1.0.7 | Animation utilities for Tailwind CSS |

### 2.2 UI Component Libraries

| Dependency | Version | Purpose |
|------------|---------|---------|
| @radix-ui/* | Various | Unstyled, accessible UI components |
| class-variance-authority | ^0.7.1 | Utility for creating variant components |
| clsx | ^2.1.1 | Utility for constructing className strings |
| cmdk | 1.0.4 | Command menu component |
| lucide-react | ^0.454.0 | Icon library |
| tailwind-merge | ^2.5.5 | Utility for merging Tailwind CSS classes |
| shadcn/ui | N/A | Component library built on Radix UI and Tailwind |

### 2.3 Form Handling

| Dependency | Version | Purpose |
|------------|---------|---------|
| react-hook-form | ^7.54.1 | Form state management and validation |
| @hookform/resolvers | ^3.9.1 | Form validation resolvers |
| zod | ^3.24.1 | TypeScript-first schema validation |

### 2.4 Data Visualization

| Dependency | Version | Purpose |
|------------|---------|---------|
| recharts | 2.15.0 | Composable charting library |
| date-fns | 4.1.0 | Date utility library |

### 2.5 UI Enhancements

| Dependency | Version | Purpose |
|------------|---------|---------|
| sonner | ^1.7.1 | Toast notifications |
| react-day-picker | 8.10.1 | Date picker component |
| embla-carousel-react | 8.5.1 | Carousel component |
| vaul | ^0.9.6 | Drawer component |
| next-themes | ^0.4.4 | Theme management for Next.js |
| react-resizable-panels | ^2.1.7 | Resizable panel components |

## 3. Backend Dependencies

### 3.1 Database

Choose one of the following database options:

#### 3.1.1 PostgreSQL Option

| Dependency | Version | Purpose |
|------------|---------|---------|
| pg | ^8.11.3 | PostgreSQL client for Node.js |
| drizzle-orm | ^0.29.3 | TypeScript ORM for PostgreSQL |
| drizzle-kit | ^0.20.13 | Migration toolkit for Drizzle ORM |

#### 3.1.2 MongoDB Option

| Dependency | Version | Purpose |
|------------|---------|---------|
| mongodb | ^6.3.0 | MongoDB driver for Node.js |
| mongoose | ^8.1.1 | MongoDB object modeling |

#### 3.1.3 Supabase Option

| Dependency | Version | Purpose |
|------------|---------|---------|
| @supabase/supabase-js | ^2.39.3 | Supabase JavaScript client |

### 3.2 Authentication

| Dependency | Version | Purpose |
|------------|---------|---------|
| next-auth | ^4.24.5 | Authentication for Next.js |
| bcrypt | ^5.1.1 | Password hashing |
| jsonwebtoken | ^9.0.2 | JWT implementation |

### 3.3 API and Server

| Dependency | Version | Purpose |
|------------|---------|---------|
| axios | ^1.6.5 | HTTP client |
| cors | ^2.8.5 | CORS middleware |
| cookie | ^0.6.0 | Cookie parsing and serialization |

## 4. Development Dependencies

### 4.1 Build and Development Tools

| Dependency | Version | Purpose |
|------------|---------|---------|
| eslint | ^8.56.0 | JavaScript linter |
| prettier | ^3.2.4 | Code formatter |
| postcss | ^8 | CSS transformation tool |
| autoprefixer | ^10.4.20 | PostCSS plugin to parse CSS and add vendor prefixes |

### 4.2 Testing

| Dependency | Version | Purpose |
|------------|---------|---------|
| jest | ^29.7.0 | JavaScript testing framework |
| @testing-library/react | ^14.1.2 | React testing utilities |
| @testing-library/jest-dom | ^6.2.0 | DOM testing utilities |
| cypress | ^13.6.3 | End-to-end testing framework |
| msw | ^2.1.5 | API mocking library |

### 4.3 Type Definitions

| Dependency | Version | Purpose |
|------------|---------|---------|
| @types/node | ^22 | TypeScript definitions for Node.js |
| @types/react | ^19 | TypeScript definitions for React |
| @types/react-dom | ^19 | TypeScript definitions for React DOM |
| @types/jest | ^29.5.11 | TypeScript definitions for Jest |

## 5. DevOps and Deployment

### 5.1 CI/CD

| Tool | Purpose |
|------|---------|
| GitHub Actions | Continuous integration and deployment |
| MABES SPOG Server | Deployment platform |
| Netlify | Deployment platform (optional) |

### 5.2 Containerization (Optional)

| Tool | Purpose |
|------|---------|
| Docker | Application containerization |
| Docker Compose | Multi-container Docker applications |

### 5.3 Monitoring and Logging

| Tool/Service | Purpose |
|--------------|---------|
| Sentry | Error tracking |
| LogRocket | Session replay and error tracking |
| Google Analytics | Usage analytics |

## 6. External Services

### 6.1 Email Services

| Service | Purpose |
|---------|---------|
| SendGrid | Transactional email service |
| Mailchimp | Email marketing service |
| Nodemailer | Email sending library |

### 6.2 File Storage (Optional)

| Service | Purpose |
|---------|---------|
| AWS S3 | Cloud storage service |
| Cloudinary | Media management service |

### 6.3 Payment Processing (Future Enhancement)

| Service | Purpose |
|---------|---------|
| Stripe | Payment processing |
| PayPal | Payment processing |

## 7. Installation Instructions

### 7.1 Prerequisites

- Node.js (v18.x or later)
- npm (v9.x or later) or pnpm (v8.x or later)
- Database system (PostgreSQL, MongoDB, or Supabase account)

### 7.2 Installation Steps

1. Clone the repository
   ```bash
   git clone <repository-url>
   cd spog-inventory
   ```

2. Install dependencies
   ```bash
   npm install
   # or
   pnpm install
   ```

3. Set up environment variables
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your configuration
   ```

4. Set up the database
   ```bash
   # For PostgreSQL with Drizzle
   npx drizzle-kit push

   # For MongoDB with Mongoose
   # Database will be set up automatically on first run

   # For Supabase
   # Configure Supabase URL and key in .env.local
   ```

5. Run the development server
   ```bash
   npm run dev
   # or
   pnpm dev
   ```

## 8. Dependency Management

### 8.1 Updating Dependencies

```bash
# Check for outdated packages
npm outdated
# or
pnpm outdated

# Update packages
npm update
# or
pnpm update
```

### 8.2 Adding New Dependencies

```bash
# Add a production dependency
npm install package-name
# or
pnpm add package-name

# Add a development dependency
npm install --save-dev package-name
# or
pnpm add -D package-name
```

## 9. Dependency Considerations

### 9.1 Security

- Regular dependency updates to patch security vulnerabilities
- Use of npm audit or similar tools to check for security issues
- Careful evaluation of third-party packages

### 9.2 Performance

- Minimize bundle size by using tree-shaking compatible libraries
- Consider the performance impact of dependencies
- Use code splitting to reduce initial load time

### 9.3 Maintenance

- Prefer well-maintained libraries with active communities
- Consider the long-term support of dependencies
- Document any custom modifications to dependencies
