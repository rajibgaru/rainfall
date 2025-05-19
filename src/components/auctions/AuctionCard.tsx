import Link from 'next/link';
import { Heart, Clock } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';

export default function AuctionCard({ auction }) {
  const [isWatchlisted, setIsWatchlisted] = useState(auction?.isWatchlisted || false);
  
  // This is a placeholder for the auction data
  // In a real app, you'd pass this data as props
  const defaultAuction = {
    id: '1',
    title: 'Modern Beachfront Property',
    location: 'Malibu, California',
    currentBid: 450000,
    endDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3), // 3 days from now
    bids: 12,
    featured: true,
    images: ['/images/placeholder.jpg']
  };
  
  const auctionData = auction || defaultAuction;
  
  const toggleWatchlist = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Toggle state locally first for UI responsiveness
    setIsWatchlisted(!isWatchlisted);
    
    // In a real app, you'd call an API to update the watchlist
    // try {
    //   const response = await fetch(`/api/auctions/${auction.id}/watchlist`, {
    //     method: isWatchlisted ? 'DELETE' : 'POST',
    //   });
    // } catch (error) {
    //   console.error('Failed to toggle watchlist:', error);
    //   // Revert state on error
    //   setIsWatchlisted(isWatchlisted);
    // }
  };
  
  const formattedTimeLeft = () => {
    if (new Date(auctionData.endDate) < new Date()) {
      return 'Auction ended';
    }
    
    return formatDistanceToNow(new Date(auctionData.endDate), { addSuffix: true });
  };
  
  return (
    <Link href={`/auctions/${auctionData.id}`}>
      <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
        <div className="relative">
          <div className="w-full h-48 relative">
            <Image 
              src={auctionData.images[0] || '/images/placeholder.jpg'} 
              alt={auctionData.title} 
              fill
              className="object-cover"
            />
          </div>
          {auctionData.featured && (
            <div className="absolute top-3 right-3 bg-blue-600 text-white text-sm font-semibold px-2 py-1 rounded">
              Featured
            </div>
          )}
          <button 
            className={`absolute top-3 left-3 p-1.5 rounded-full ${
              isWatchlisted ? 'bg-red-100' : 'bg-white'
            }`}
            onClick={toggleWatchlist}
          >
            <Heart 
              size={18} 
              className={isWatchlisted ? 'text-red-500 fill-red-500' : 'text-gray-600'} 
            />
          </button>
        </div>
        
        <div className="p-4">
          <h3 className="text-lg font-semibold mb-2 truncate">{auctionData.title}</h3>
          <p className="text-gray-600 text-sm mb-2">{auctionData.location}</p>
          
          <div className="flex items-center space-x-1 text-sm text-gray-600 mb-3">
            <Clock size={16} />
            <span>{formattedTimeLeft()}</span>
          </div>
          
          <div className="flex justify-between items-end">
            <div>
              <p className="text-xs text-gray-500">Current Bid</p>
              <p className="text-xl font-bold text-blue-600">${auctionData.currentBid.toLocaleString()}</p>
              <p className="text-xs text-gray-500">{auctionData.bids || 0} bids</p>
            </div>
            <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
              Bid Now
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
}