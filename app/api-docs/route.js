import { NextResponse } from 'next/server';

// This route is needed to ensure the API docs page is properly rendered
export async function GET() {
  return NextResponse.json({ message: 'API Documentation is available at this route' });
}
