// src/components/dashboard/DashboardNav.tsx
'use client';

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
  Users
} from 'lucide-react';

export default function DashboardNav() {
  const { data: session } = useSession();
  
  // Define different navigation items based on user role
  const userNavItems = [
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
      icon: <DollarSign size={20} />, 
      href: '/auctions/create' 
    },
    { 
      label: 'Profile', 
      icon: <Settings size={20} />, 
      href: '/dashboard/agent/profile' 
    },
  ];
  
  const adminNavItems = [
    { 
      label: 'Dashboard', 
      icon: <Home size={20} />, 
      href: '/admin' 
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
  
  // Add common items
  navItems.push({ 
    label: 'Settings', 
    icon: <Settings size={20} />, 
    href: '/dashboard/settings' 
  });
  
  return (
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
  );
}