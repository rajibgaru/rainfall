'use client'

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Clock, Heart, DollarSign, Award } from 'lucide-react';
import Link from 'next/link';

export default function DashboardHome() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);

  useEffect(() => {
    // Simulate API call with timeout
    const timeout = setTimeout(() => {
      // Mock data - in a real app, this would be an API call
      setStats({
        activeBids: 3,
        watchlistCount: 5,
        totalSpent: 750000,
        wonAuctions: 2
      });
      
      setRecentActivity([
        {
          id: 'act1',
          type: 'bid',
          title: 'Bid Placed',
          description: 'You placed a bid of $450,000 on Modern Beachfront Property',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2) // 2 hours ago
        },
        {
          id: 'act2',
          type: 'watchlist',
          title: 'Added to Watchlist',
          description: 'You added Historic Brownstone to your watchlist',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 6) // 6 hours ago
        },
        {
          id: 'act3',
          type: 'won',
          title: 'Auction Won',
          description: 'You won the auction for Downtown Luxury Condo with a bid of $320,000',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2) // 2 days ago
        }
      ]);
      
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timeout);
  }, []);

  if (loading) {
    return (
      <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[1, 2, 3, 4].map((item) => (
              <div key={item} className="bg-white rounded-lg shadow-md p-6">
                <div className="h-6 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
              </div>
            ))}
          </div>
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="space-y-4">
              {[1, 2, 3].map((item) => (
                <div key={item} className="flex items-start space-x-4 border-b pb-4">
                  <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-5 bg-gray-200 rounded w-1/3 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-1"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Welcome back, {session?.user?.name}!</h1>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Active Bids</p>
              <p className="text-2xl font-bold">{stats?.activeBids || 0}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full text-blue-600">
              <Clock size={24} />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Watchlist</p>
              <p className="text-2xl font-bold">{stats?.watchlistCount || 0}</p>
            </div>
            <div className="p-3 bg-red-100 rounded-full text-red-600">
              <Heart size={24} />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Spent</p>
              <p className="text-2xl font-bold">${stats?.totalSpent?.toLocaleString() || 0}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full text-green-600">
              <DollarSign size={24} />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Won Auctions</p>
              <p className="text-2xl font-bold">{stats?.wonAuctions || 0}</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-full text-purple-600">
              <Award size={24} />
            </div>
          </div>
        </div>
      </div>
      
      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
        
        {recentActivity.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No recent activity</p>
        ) : (
          <div className="space-y-4">
            {recentActivity.map((activity) => {
              // Get the appropriate icon and styles based on activity type
              let icon;
              let iconStyles;
              
              switch (activity.type) {
                case 'bid':
                  icon = <Clock size={20} />;
                  iconStyles = 'bg-blue-100 text-blue-600';
                  break;
                case 'won':
                  icon = <Award size={20} />;
                  iconStyles = 'bg-green-100 text-green-600';
                  break;
                case 'watchlist':
                  icon = <Heart size={20} />;
                  iconStyles = 'bg-red-100 text-red-600';
                  break;
                default:
                  icon = <Clock size={20} />;
                  iconStyles = 'bg-gray-100 text-gray-600';
              }
              
              return (
                <div key={activity.id} className="flex items-start space-x-4 border-b pb-4">
                  <div className={`p-2 rounded-full ${iconStyles}`}>
                    {icon}
                  </div>
                  <div>
                    <p className="font-medium">{activity.title}</p>
                    <p className="text-sm text-gray-600">{activity.description}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {activity.timestamp.toLocaleString()}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        
        <div className="mt-4 text-center">
          <Link 
            href="/dashboard/activity" 
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            View All Activity
          </Link>
        </div>
      </div>
      
      {/* Recommended Auctions */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold mb-4">Recommended For You</h2>
        
        {/* Recommended auctions content */}
        <div className="text-center py-4">
          <p className="text-gray-500">
            Based on your interests, we'll show personalized auction recommendations here.
          </p>
          <Link 
            href="/auctions" 
            className="text-blue-600 hover:text-blue-800 text-sm font-medium mt-2 inline-block"
          >
            Browse All Auctions
          </Link>
        </div>
      </div>
    </div>
  );
}