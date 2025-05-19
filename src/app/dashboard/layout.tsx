'use client'

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Home, Clock, Heart, Award, Settings, LogOut } from 'lucide-react';
import Link from 'next/link';
import { signOut } from 'next-auth/react';

export default function DashboardLayout({ children }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-12 w-12 border-4 border-t-blue-600 border-gray-200 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    router.push('/login?callbackUrl=/dashboard');
    return null;
  }

  const navItems = [
    { 
      label: 'Dashboard', 
      icon: <Home size={20} />, 
      href: '/dashboard' 
    },
    { 
      label: 'My Bids', 
      icon: <Clock size={20} />, 
      href: '/dashboard/bids' 
    },
    { 
      label: 'Watchlist', 
      icon: <Heart size={20} />, 
      href: '/dashboard/watchlist' 
    },
    { 
      label: 'Won Auctions', 
      icon: <Award size={20} />, 
      href: '/dashboard/won-auctions' 
    },
    { 
      label: 'Settings', 
      icon: <Settings size={20} />, 
      href: '/dashboard/settings' 
    },
  ];

  const handleSignOut = async () => {
    await signOut({ redirect: false });
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        {/* Sidebar - Desktop */}
        <div className="hidden md:flex flex-col w-64 bg-white shadow-md">
          <div className="p-6 border-b">
            <Link href="/" className="text-2xl font-bold text-blue-600">$ Houses Auction Depot</Link>
          </div>
          
          <div className="p-6 border-b">
            <div className="flex items-center space-x-3">
              <div className="relative w-12 h-12 rounded-full overflow-hidden bg-gray-100">
                {session?.user?.image ? (
                  <img
                    src={session.user.image}
                    alt={session.user.name}
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500 text-xl font-semibold">
                    {session?.user?.name?.substring(0, 1).toUpperCase()}
                  </div>
                )}
              </div>
              <div>
                <p className="font-medium">{session?.user?.name}</p>
                <p className="text-sm text-gray-500">{session?.user?.email}</p>
              </div>
            </div>
          </div>
          
          <nav className="flex-1 p-4">
            <ul className="space-y-1">
              {navItems.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-100 text-gray-700 hover:text-blue-600"
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          
          <div className="p-4 border-t">
            <button
              onClick={handleSignOut}
              className="flex items-center space-x-3 p-3 w-full rounded-lg hover:bg-gray-100 text-gray-700 hover:text-red-600"
            >
              <LogOut size={20} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
        
        {/* Mobile Header */}
        <div className="md:hidden fixed top-0 left-0 right-0 bg-white shadow-md z-10">
          <div className="flex items-center justify-between p-4">
            <Link href="/" className="text-xl font-bold text-blue-600">$ Houses Auction Depot</Link>
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-700"
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
                        alt={session.user.name}
                        className="object-cover w-full h-full"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-500 text-lg font-semibold">
                        {session?.user?.name?.substring(0, 1).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="font-medium">{session?.user?.name}</p>
                    <p className="text-xs text-gray-500">{session?.user?.email}</p>
                  </div>
                </div>
              </div>
              
              <nav className="p-4">
                <ul className="space-y-1">
                  {navItems.map((item) => (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-100 text-gray-700 hover:text-blue-600"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        {item.icon}
                        <span>{item.label}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
              
              <div className="p-4 border-t">
                <button
                  onClick={handleSignOut}
                  className="flex items-center space-x-3 p-3 w-full rounded-lg hover:bg-gray-100 text-gray-700 hover:text-red-600"
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