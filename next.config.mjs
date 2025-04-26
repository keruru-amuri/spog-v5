/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  output: 'standalone',
  poweredByHeader: false,
  compress: true,
  env: {
    // Provide fallback values for required environment variables
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder-supabase-url.supabase.co',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key',
  },
  // Handle Swagger UI properly
  transpilePackages: ['swagger-ui-react', 'swagger-client', 'react-syntax-highlighter'],
  // Skip API docs page during static optimization
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
  },
  // Configure critters for CSS optimization
  optimizeFonts: true,
}

export default nextConfig
