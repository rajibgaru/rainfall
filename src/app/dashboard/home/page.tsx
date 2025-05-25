'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Clock, Heart, DollarSign, Award, AlertCircle, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export default function DashboardHomePage() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    activeBidCount: 0,
    watchlistCount: 0,
    totalSpent: 0,
    wonAuctionCount: 0
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [recommendedAuctions, setRecommendedAuctions] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Fetch dashboard data
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch stats
        const statsRes = await fetch('/api/dashboard/stats');
        if (!statsRes.ok) throw new Error('Failed to fetch stats');
        const statsData = await statsRes.json();
        
        // Fetch activity
        const activityRes = await fetch('/api/dashboard/activity?limit=3');
        if (!activityRes.ok) throw new Error('Failed to fetch activity');
        const activityData = await activityRes.json();
        
        // Fetch recommended auctions
        const recommendedRes = await fetch('/api/dashboard/recommended');
        if (!recommendedRes.ok) throw new Error('Failed to fetch recommendations');
        const recommendedData = await recommendedRes.json();
        
        // Update state with fetched data
        setStats(statsData);
        setRecentActivity(activityData.activities || []);
        setRecommendedAuctions(recommendedData.auctions || []);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  // Format date for activity items
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleString();
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Welcome back, {session?.user?.name || 'User'}!</h1>
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          <div className="flex items-center">
            <AlertCircle size={20} className="mr-2" />
            <span>Error loading dashboard data: {error}</span>
          </div>
          <button 
            onClick={() => window.location.reload()}
            className="mt-2 px-3 py-1 bg-red-100 text-red-800 rounded text-sm"
          >
            Try Again
          </button>
        </div>
      )}
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Active Bids</p>
              <p className="text-2xl font-bold">{loading ? '...' : stats.activeBidCount}</p>
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
              <p className="text-2xl font-bold">{loading ? '...' : stats.watchlistCount}</p>
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
              <p className="text-2xl font-bold">${loading ? '...' : (stats.totalSpent?.toLocaleString() || 0)}</p>
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
              <p className="text-2xl font-bold">{loading ? '...' : stats.wonAuctionCount}</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-full text-purple-600">
              <Award size={24} />
            </div>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
            
            {loading ? (
              <div className="animate-pulse">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-start space-x-4 border-b pb-4 mb-4">
                    <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : recentActivity.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No recent activity</p>
            ) : (
              <div className="space-y-4">
                {recentActivity.map((activity) => {
                  // Get the appropriate icon and styles based on activity type
                  let icon;
                  let iconStyles;
                  
                  switch (activity.type) {
                    case 'BID_PLACED':
                      icon = <Clock size={20} />;
                      iconStyles = 'bg-blue-100 text-blue-600';
                      break;
                    case 'AUCTION_WON':
                      icon = <Award size={20} />;
                      iconStyles = 'bg-green-100 text-green-600';
                      break;
                    case 'WATCHLIST_ADDED':
                      icon = <Heart size={20} />;
                      iconStyles = 'bg-red-100 text-red-600';
                      break;
                    case 'RESERVE_MET':
                      icon = <DollarSign size={20} />;
                      iconStyles = 'bg-yellow-100 text-yellow-600';
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
                        <p className="text-sm text-gray-600">{activity.message}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatDate(activity.createdAt)}
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
        </div>
        
        {/* Recommended Auctions */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold mb-4">Recommended For You</h2>
            
            {loading ? (
              <div className="animate-pulse space-y-4">
                {[1, 2].map((i) => (
                  <div key={i} className="border rounded-lg overflow-hidden">
                    <div className="h-32 bg-gray-200"></div>
                    <div className="p-3">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
                      <div className="flex justify-between">
                        <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : recommendedAuctions.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-gray-500 mb-4">
                  Based on your interests, we'll show personalized auction recommendations here.
                </p>
                <Link 
                  href="/auctions" 
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  Browse All Auctions
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {recommendedAuctions.slice(0, 3).map((auction) => (
                  <Link 
                    key={auction.id} 
                    href={`/auctions/${auction.id}`}
                    className="flex flex-col border rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                  >
                    <div className="h-32 relative">
                      <Image
                        src={auction.images?.[0] || '/images/placeholder.jpg'}
                        alt={auction.title}
                        fill
                        className="object-cover"
                      />
                      <div className={`absolute top-2 right-2 text-xs font-bold px-2 py-1 rounded-full ${
                        auction.status === 'LIVE' 
                          ? 'bg-green-500 text-white' 
                          : auction.status === 'UPCOMING' 
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-500 text-white'
                      }`}>
                        {auction.status}
                      </div>
                    </div>
                    <div className="p-3">
                      <div className="font-medium line-clamp-1">{auction.title}</div>
                      <div className="text-sm text-gray-600 mb-2 line-clamp-1">{auction.location}</div>
                      <div className="flex justify-between items-center">
                        <span className="text-blue-600 font-bold">
                          ${(auction.currentBid || auction.startingBid || 0).toLocaleString()}
                        </span>
                        <span className="flex items-center text-blue-600 text-sm">
                          View <ChevronRight size={14} />
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
                
                <div className="mt-4 text-center">
                  <Link 
                    href="/auctions" 
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    View All Auctions
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}