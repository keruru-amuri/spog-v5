import { NextResponse } from 'next/server';
import { getApiDocs } from '@/lib/swagger';

/**
 * GET /api/api-docs
 * Get the OpenAPI specification
 */
export async function GET() {
  const spec = getApiDocs();
  return NextResponse.json(spec);
}
