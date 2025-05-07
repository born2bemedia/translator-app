import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

export async function middleware(request: NextRequest) {
  // Skip middleware for login and public routes
  if (request.nextUrl.pathname.startsWith('/api/auth') || 
      request.nextUrl.pathname === '/login') {
    return NextResponse.next();
  }

  const token = request.headers.get('authorization')?.split(' ')[1];

  if (!token) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const secret = new TextEncoder().encode(
      process.env.JWT_SECRET || 'your-secret-key'
    );
    await jwtVerify(token, secret);
    return NextResponse.next();
  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid token' },
      { status: 401 }
    );
  }
}

export const config = {
  matcher: [
    '/api/admin/:path*',
    '/api/projects/:path*',
    '/api/projects',
    // Додайте інші API, які треба захищати
  ],
}; 