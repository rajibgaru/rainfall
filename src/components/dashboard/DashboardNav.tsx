// src/components/dashboard/DashboardNav.tsx
'use client';

import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { 
  Home, 
  Clock, 
  Heart, 
  Award, 
  Settings, 
  LogOut,
  Building,
  DollarSign,
  List,
  Users,
  PlusCircle,
  Bell,
  Wallet
} from 'lucide-react';

// Function to check if a path is active
const isPathActive = (pathname, href) => {
  if (href === '/dashboard/home' && pathname === '/dashboard') {
    return true;
  }
  
  return pathname === href || pathname.startsWith(`${href}/`);
};

export default function DashboardNav({ onNavClick }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  
  // Define different navigation items based on user role
  const userNavItems = [
    { 
      label: 'Dashboard', 
      icon: <Home size={20} />, 
      href: '/dashboard/home' 
    },
    { 
      label: 'Escrow Wallet', 
      icon: <Wallet size={20} />, 
      href: '/dashboard/wallet' 
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
      label: 'Notifications',
      icon: <Bell size={20} />,
      href: '/dashboard/notifications'
    }
  ];
  
  const agentNavItems = [
    { 
      label: 'Dashboard', 
      icon: <Home size={20} />, 
      href: '/dashboard/agent' 
    },
    { 
      label: 'My Auctions', 
      icon: <Building size={20} />, 
      href: '/dashboard/agent/auctions' 
    },
    { 
      label: 'Create Auction', 
      icon: <PlusCircle size={20} />, 
      href: '/auctions/create' 
    },
    {
      label: 'Notifications',
      icon: <Bell size={20} />,
      href: '/dashboard/notifications'
    },
    { 
      label: 'Profile', 
      icon: <Settings size={20} />, 
      href: '/dashboard/profile' 
    },
  ];
  
  const adminNavItems = [
    { 
      label: 'Dashboard', 
      icon: <Home size={20} />, 
      href: '/admin' 
    },
    { 
      label: 'Escrow Management', 
      icon: <Wallet size={20} />, 
      href: '/admin/escrow' 
    },
    { 
      label: 'All Auctions', 
      icon: <List size={20} />, 
      href: '/admin/auctions' 
    },
    { 
      label: 'Manage Users', 
      icon: <Users size={20} />, 
      href: '/admin/users' 
    },
    { 
      label: 'Manage Agents', 
      icon: <Building size={20} />, 
      href: '/admin/agents' 
    },
  ];
  
  // Get the right navigation items based on user role
  let navItems = userNavItems;
  if (session?.user?.role === 'AGENT') {
    navItems = agentNavItems;
  } else if (session?.user?.role === 'ADMIN') {
    navItems = adminNavItems;
  }
  
  // Add common items - Settings is already in the agent items
  if (session?.user?.role !== 'AGENT') {
    navItems.push({ 
      label: 'Settings', 
      icon: <Settings size={20} />, 
      href: '/dashboard/settings' 
    });
  }

  const handleNavClick = () => {
    if (onNavClick) {
      onNavClick();
    }
  };
  
  return (
    <ul className="space-y-1">
      {navItems.map((item) => {
        // Check if this nav item is active
        const active = isPathActive(pathname, item.href);
        
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              onClick={handleNavClick}
              className={`flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                active
                  ? 'bg-blue-50 text-blue-700'
                  : 'hover:bg-gray-100 text-gray-700 hover:text-blue-600'
              }`}
            >
              <span className={active ? 'text-blue-600' : ''}>{item.icon}</span>
              <span>{item.label}</span>
              
              {/* Active indicator */}
              {active && (
                <span className="ml-auto w-2 h-2 bg-blue-600 rounded-full"></span>
              )}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}