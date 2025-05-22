// src/middleware.js
import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request) {
  const { pathname } = request.nextUrl;
  
  // Get the token
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });
  
  const isAuthenticated = !!token;
  
  // Define protected routes
  const protectedRoutes = [
    '/dashboard',
    '/api/dashboard',
    '/api/auctions',
    '/profile',
    '/auctions/create',
  ];
  
  // Define agent-only routes
  const agentRoutes = ['/dashboard/agent', '/auctions/create'];
  
  // Define admin-only routes
  const adminRoutes = ['/admin'];
  
  // Define auth routes (login/register)
  const authRoutes = ['/login', '/register', '/register/agent'];
  
  // Check if path is protected
  const isProtectedPath = protectedRoutes.some(route => 
    pathname === route || pathname.startsWith(`${route}/`)
  );
  
  // Check if path is agent-only
  const isAgentPath = agentRoutes.some(route => 
    pathname === route || pathname.startsWith(`${route}/`)
  );
  
  // Check if path is admin-only
  const isAdminPath = adminRoutes.some(route => 
    pathname === route || pathname.startsWith(`${route}/`)
  );
  
  // Check if path is auth route
  const isAuthPath = authRoutes.some(route => pathname === route);
  
  // Already authenticated users should be redirected from auth pages
  if (isAuthenticated && isAuthPath) {
    if (token.role === 'AGENT') {
      return NextResponse.redirect(new URL('/dashboard/agent', request.url));
    } else if (token.role === 'ADMIN') {
      return NextResponse.redirect(new URL('/admin', request.url));
    } else {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }
  
  // Unauthenticated users should be redirected from protected pages
  if (!isAuthenticated && isProtectedPath) {
    const url = new URL('/login', request.url);
    url.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(url);
  }
  
  // Non-agent users should be redirected from agent pages
  if (isAuthenticated && isAgentPath && token.role !== 'AGENT' && token.role !== 'ADMIN') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }
  
  // Non-admin users should be redirected from admin pages
  if (isAuthenticated && isAdminPath && token.role !== 'ADMIN') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }
  
  // After login, redirect based on role
  if (isAuthenticated && pathname === '/dashboard') {
    if (token.role === 'AGENT') {
      return NextResponse.redirect(new URL('/dashboard/agent', request.url));
    } else if (token.role === 'ADMIN') {
      return NextResponse.redirect(new URL('/admin', request.url));
    }
    // Regular users go to the standard dashboard
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/admin/:path*',
    '/profile/:path*',
    '/auctions/create/:path*',
    '/api/dashboard/:path*',
    '/api/admin/:path*',
    '/api/auctions/:path*/bid',
    '/login',
    '/register',
    '/register/agent',
  ],
};