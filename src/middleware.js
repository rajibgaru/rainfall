import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request) {
  const { pathname } = request.nextUrl;
  
  // Check if the path is protected
  if (
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/api/dashboard') ||
    pathname.startsWith('/api/auctions') && (
      pathname.includes('/bid') ||
      pathname.includes('/watchlist')
    )
  ) {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });
    
    // If not logged in, redirect to login
    if (!token) {
      const url = new URL('/login', request.url);
      url.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(url);
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/api/dashboard/:path*',
    '/api/auctions/:path*/bid',
    '/api/auctions/:path*/watchlist',
  ],
};