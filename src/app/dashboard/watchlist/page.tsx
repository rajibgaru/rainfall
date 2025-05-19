'use client'

import { useState, useEffect } from 'react';
import AuctionCard from '@/components/auctions/AuctionCard';
import Link from 'next/link';

export default function WatchlistPage() {
  const [watchlist, setWatchlist] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate API call with timeout
    const timeout = setTimeout(() => {
      // Mock data - in a real app, this would be an API call
      setWatchlist([
        {
          id: '1',
          title: 'Modern Beachfront Property',
          location: 'Malibu, California',
          currentBid: 450000,
          endDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3), // 3 days from now
          bids: 12,
          featured: true,
          images: ['/images/placeholder.jpg'],
          isWatchlisted: true
        },
        {
          id: '2',
          title: 'Downtown Luxury Condo',
          location: 'Chicago, Illinois',
          currentBid: 320000,
          endDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 1), // 1 day from now
          bids: 8,
          featured: false,
          images: ['/images/placeholder.jpg'],
          isWatchlisted: true
        },
        {
          id: '4',
          title: 'Historic Brownstone',
          location: 'Boston, Massachusetts',
          currentBid: 550000,
          endDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 2), // 2 days from now
          bids: 15,
          featured: true,
          images: ['/images/placeholder.jpg'],
          isWatchlisted: true
        },
        {
          id: '6',
          title: 'Waterfront Cottage',
          location: 'Lake Tahoe, Nevada',
          currentBid: 425000,
          endDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 6), // 6 days from now
          bids: 9,
          featured: false,
          images: ['/images/placeholder.jpg'],
          isWatchlisted: true
        },
        {
          id: '7',
          title: 'Urban Loft Space',
          location: 'New York, New York',
          currentBid: 680000,
          endDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3), // 3 days from now
          bids: 19,
          featured: false,
          images: ['/images/placeholder.jpg'],
          isWatchlisted: true
        }
      ]);
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timeout);
  }, []);

  const removeFromWatchlist = (auctionId) => {
    // In a real app, you'd call an API to remove the auction from the watchlist
    setWatchlist(watchlist.filter(auction => auction.id !== auctionId));
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5].map((item) => (
            <div key={item} className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="h-48 bg-gray-200 animate-pulse"></div>
              <div className="p-4">
                <div className="h-6 bg-gray-200 rounded w-3/4 mb-2 animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-3 animate-pulse"></div>
                <div className="h-8 bg-gray-200 rounded w-full mt-4 animate-pulse"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">My Watchlist</h1>
      
      {watchlist.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <h3 className="text-lg font-medium mb-2">Your watchlist is empty</h3>
          <p className="text-gray-600 mb-4">
            Start adding properties to your watchlist to keep track of auctions you're interested in.
          </p>
          <Link
            href="/auctions"
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 inline-block"
          >
            Browse Auctions
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {watchlist.map((auction) => (
            <AuctionCard key={auction.id} auction={auction} />
          ))}
        </div>
      )}
    </div>
  );
}