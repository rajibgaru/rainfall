'use client'

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import { LogOut } from 'lucide-react';
import Link from 'next/link';
import { signOut } from 'next-auth/react';
import DashboardNav from '@/components/dashboard/DashboardNav';

export default function DashboardLayout({ children }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const redirectAttempted = useRef(false);
  
  console.log("Dashboard Layout - Status:", status, "Path:", pathname, "RedirectAttempted:", redirectAttempted.current);

  useEffect(() => {
    // This will break the redirection loop
    if (redirectAttempted.current) {
      console.log("Redirection already attempted, skipping");
      return;
    }
    
    if (status === 'unauthenticated') {
      console.log("Redirecting to login - Not authenticated");
      redirectAttempted.current = true;
      router.push('/login?callbackUrl=/dashboard');
      return;
    }
    
    // Only attempt role-based redirection if we're authenticated and exactly at /dashboard
    if (status === 'authenticated' && pathname === '/dashboard' && session?.user?.role) {
      console.log("Redirecting based on role:", session.user.role);
      redirectAttempted.current = true;
      
      if (session.user.role === 'AGENT') {
        router.push('/dashboard/agent');
      } else if (session.user.role === 'ADMIN') {
        router.push('/admin');
      } else {
        // If we're a regular user, we can stay on /dashboard
        // But mark redirection as attempted to prevent loops
        redirectAttempted.current = true;
      }
    }
  }, [status, session, pathname, router]);

  // Show loading spinner only when we're waiting for authentication, not during redirection
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <div className="h-12 w-12 border-4 border-t-blue-600 border-gray-200 rounded-full animate-spin mb-4"></div>
        <p className="text-gray-500">Loading authentication...</p>
      </div>
    );
  }

  // Handle unauthenticated state
  if (status === 'unauthenticated') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <p className="text-red-500 mb-4">Not authenticated. Redirecting to login...</p>
        <button 
          onClick={() => router.push('/login')}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg"
        >
          Go to Login
        </button>
      </div>
    );
  }

  // If we are stuck in redirection, show a manual override
  if (redirectAttempted.current && pathname === '/dashboard' && session?.user?.role) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <p className="text-amber-600 mb-4">Redirection issue detected. Please select your dashboard:</p>
        <div className="flex gap-4">
          <button 
            onClick={() => router.push('/dashboard/home')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg"
          >
            User Dashboard
          </button>
          {session.user.role === 'AGENT' && (
            <button 
              onClick={() => router.push('/dashboard/agent')}
              className="px-4 py-2 bg-green-600 text-white rounded-lg"
            >
              Agent Dashboard
            </button>
          )}
          {session.user.role === 'ADMIN' && (
            <button 
              onClick={() => router.push('/admin')}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg"
            >
              Admin Dashboard
            </button>
          )}
        </div>
      </div>
    );
  }

  // If we get here, we're authenticated and either not at /dashboard or redirection was successful
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        {/* Sidebar - Desktop */}
        <div className="hidden md:flex flex-col w-64 bg-white shadow-md">
          <div className="p-6 border-b">
            <div className="flex items-center space-x-3">
              <div className="relative w-12 h-12 rounded-full overflow-hidden bg-gray-100">
                {session?.user?.image ? (
                  <img
                    src={session.user.image}
                    alt={session.user.name || 'User'}
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500 text-xl font-semibold">
                    {session?.user?.name?.substring(0, 1).toUpperCase() || 'U'}
                  </div>
                )}
              </div>
              <div>
                <p className="font-medium">{session?.user?.name || 'User'}</p>
                <p className="text-sm text-gray-500">{session?.user?.email || ''}</p>
                {session?.user?.role && (
                  <p className="text-xs text-blue-600 mt-1 font-medium">
                    {session.user.role === 'AGENT' 
                      ? 'Real Estate Agent' 
                      : session.user.role === 'ADMIN' 
                        ? 'Administrator' 
                        : 'User'}
                  </p>
                )}
              </div>
            </div>
          </div>
          
          <nav className="flex-1 p-4">
            <DashboardNav />
          </nav>
          
          <div className="p-4 border-t">
            <button
              onClick={() => signOut({ redirect: false }).then(() => router.push('/'))}
              className="flex items-center space-x-3 p-3 w-full rounded-lg hover:bg-gray-100 text-gray-700 hover:text-red-600 transition-colors"
            >
              <LogOut size={20} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
        
        {/* Mobile Header */}
        <div className="md:hidden fixed top-0 left-0 right-0 bg-white shadow-md z-10">
          <div className="flex items-center justify-between p-4">
            <Link href="/" className="text-xl font-bold text-blue-600 truncate max-w-[200px]">
              BargainAuctions.com
            </Link>
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-700 p-2"
              aria-label={isMenuOpen ? "Close menu" : "Open menu"}
            >
              {isMenuOpen ? (
                <span className="text-2xl">×</span>
              ) : (
                <span className="text-2xl">≡</span>
              )}
            </button>
          </div>
          
          {/* Mobile Menu */}
          {isMenuOpen && (
            <div className="bg-white shadow-lg">
              <div className="p-4 border-b">
                <div className="flex items-center space-x-3">
                  <div className="relative w-10 h-10 rounded-full overflow-hidden bg-gray-100">
                    {session?.user?.image ? (
                      <img
                        src={session.user.image}
                        alt={session.user.name || 'User'}
                        className="object-cover w-full h-full"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-500 text-lg font-semibold">
                        {session?.user?.name?.substring(0, 1).toUpperCase() || 'U'}
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="font-medium">{session?.user?.name || 'User'}</p>
                    <p className="text-xs text-gray-500">{session?.user?.email || ''}</p>
                    {session?.user?.role && (
                      <p className="text-xs text-blue-600 mt-1 font-medium">
                        {session.user.role === 'AGENT' 
                          ? 'Real Estate Agent' 
                          : session.user.role === 'ADMIN' 
                            ? 'Administrator' 
                            : 'User'}
                      </p>
                    )}
                  </div>
                </div>
              </div>
              
              <nav className="p-4">
                <DashboardNav onNavClick={() => setIsMenuOpen(false)} />
              </nav>
              
              <div className="p-4 border-t">
                <button
                  onClick={() => signOut({ redirect: false }).then(() => router.push('/'))}
                  className="flex items-center space-x-3 p-3 w-full rounded-lg hover:bg-gray-100 text-gray-700 hover:text-red-600 transition-colors"
                >
                  <LogOut size={20} />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
        
        {/* Main Content */}
        <div className="flex-1 md:ml-64 md:pl-0 pt-0 md:pt-0 mt-16 md:mt-0">
          <div className="p-6">{children}</div>
        </div>
      </div>
    </div>
  );
}