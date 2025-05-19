'use client'

import { useState, useEffect } from 'react';
import AuctionCard from './AuctionCard';

export default function FeaturedAuctions() {
  const [auctions, setAuctions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate API call with timeout
    const timeout = setTimeout(() => {
      // Mock data - in a real app, this would be an API call
      setAuctions([
        {
          id: '1',
          title: 'Modern Beachfront Property',
          location: 'Malibu, California',
          currentBid: 450000,
          endDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3), // 3 days from now
          bids: 12,
          featured: true,
          images: ['/images/placeholder.jpg']
        },
        {
          id: '2',
          title: 'Downtown Luxury Condo',
          location: 'Chicago, Illinois',
          currentBid: 320000,
          endDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 1), // 1 day from now
          bids: 8,
          featured: true,
          images: ['/images/placeholder.jpg']
        },
        {
          id: '3',
          title: 'Rustic Mountain Cabin',
          location: 'Aspen, Colorado',
          currentBid: 180000,
          endDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 5), // 5 days from now
          bids: 5,
          featured: true,
          images: ['/images/placeholder.jpg']
        },
        {
          id: '4',
          title: 'Historic Brownstone',
          location: 'Boston, Massachusetts',
          currentBid: 550000,
          endDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 2), // 2 days from now
          bids: 15,
          featured: true,
          images: ['/images/placeholder.jpg']
        }
      ]);
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timeout);
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((item) => (
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
    );
  }

  if (auctions.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-lg shadow-sm">
        <p className="text-gray-500">No featured auctions available at the moment</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {auctions.map((auction) => (
        <AuctionCard key={auction.id} auction={auction} />
      ))}
    </div>
  );
}