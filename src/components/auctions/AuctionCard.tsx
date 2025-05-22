// Enhanced AuctionCard with detailed property information
'use client';

import Link from 'next/link';
import { 
  Heart, 
  Clock, 
  MapPin, 
  Users, 
  Eye, 
  Gavel, 
  Bed, 
  Bath, 
  Home, 
  Calendar, 
  UserCircle 
} from 'lucide-react';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';

function AuctionCard({ auction, refreshKey }) {
  const [isWatchlisted, setIsWatchlisted] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Update current time every 30 seconds for real-time status calculation
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);
  
  useEffect(() => {
    if (refreshKey) {
      setCurrentTime(new Date());
    }
  }, [refreshKey]);
  
  // Calculate current status based on dates
  const getCurrentStatus = () => {
    if (!auction?.startDate || !auction?.endDate) {
      return auction?.status || 'UNKNOWN';
    }
    
    const now = currentTime;
    const startDate = new Date(auction.startDate);
    const endDate = new Date(auction.endDate);
    
    if (auction.status === 'CANCELLED') return 'CANCELLED';
    if (now < startDate) return 'UPCOMING';
    if (now >= startDate && now < endDate) return 'LIVE';
    return 'ENDED';
  };
  
  const currentStatus = getCurrentStatus();
  
  const getStatusConfig = (status) => {
    switch (status) {
      case 'UPCOMING':
        return {
          color: 'bg-gradient-to-r from-blue-500 to-blue-600 text-white',
          icon: Clock,
          pulse: false
        };
      case 'LIVE':
        return {
          color: 'bg-gradient-to-r from-green-500 to-green-600 text-white',
          icon: Gavel,
          pulse: true
        };
      case 'ENDED':
        return {
          color: 'bg-gradient-to-r from-amber-500 to-amber-600 text-white',
          icon: Eye,
          pulse: false
        };
      case 'CANCELLED':
        return {
          color: 'bg-gradient-to-r from-red-500 to-red-600 text-white',
          icon: null,
          pulse: false
        };
      default:
        return {
          color: 'bg-gradient-to-r from-gray-500 to-gray-600 text-white',
          icon: null,
          pulse: false
        };
    }
  };
  
  const statusConfig = getStatusConfig(currentStatus);
  
  const toggleWatchlist = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsWatchlisted(!isWatchlisted);
  };
  
  const handleBidClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    window.location.href = `/auctions/${auction.id}`;
  };
  
  const formattedTimeLeft = () => {
    if (!auction?.startDate || !auction?.endDate) {
      return 'Time unknown';
    }
    
    const startDate = new Date(auction.startDate);
    const endDate = new Date(auction.endDate);
    
    if (currentStatus === 'ENDED') {
      return 'Auction ended';
    } else if (currentStatus === 'UPCOMING') {
      return `Starts ${formatDistanceToNow(startDate, { addSuffix: true })}`;
    } else if (currentStatus === 'LIVE') {
      return `Ends ${formatDistanceToNow(endDate, { addSuffix: true })}`;
    } else if (currentStatus === 'CANCELLED') {
      return 'Auction cancelled';
    }
    
    return formatDistanceToNow(endDate, { addSuffix: true });
  };
  
  const getButtonConfig = () => {
    switch (currentStatus) {
      case 'UPCOMING':
        return {
          text: 'Preview',
          icon: Eye,
          color: 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800',
          disabled: false
        };
      case 'LIVE':
        return {
          text: 'Bid Now',
          icon: Gavel,
          color: 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800',
          disabled: false
        };
      case 'ENDED':
        return {
          text: 'View Results',
          icon: Eye,
          color: 'bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800',
          disabled: false
        };
      case 'CANCELLED':
        return {
          text: 'Cancelled',
          icon: null,
          color: 'bg-gray-400',
          disabled: true
        };
      default:
        return {
          text: 'View Details',
          icon: Eye,
          color: 'bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800',
          disabled: false
        };
    }
  };
  
  const buttonConfig = getButtonConfig();
  
  // Get correct bid count
  const getBidCount = () => {
    if (auction._count?.bids !== undefined) {
      return auction._count.bids;
    }
    if (Array.isArray(auction.bids)) {
      return auction.bids.length;
    }
    if (auction.bidCount !== undefined) {
      return auction.bidCount;
    }
    return 0;
  };
  
  const bidCount = getBidCount();
  const showStatusChangeEffect = currentStatus !== auction.status;
  
  // Extract property details
  const propertyDetails = auction.propertyDetails || {};
  const hasPropertyDetails = propertyDetails && typeof propertyDetails === 'object';
  
  return (
    <div className={`group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-100 hover:border-gray-200 ${
      showStatusChangeEffect ? 'ring-2 ring-green-500 ring-opacity-50' : ''
    }`}>
      <Link href={`/auctions/${auction.id}`} className="block">
        <div className="relative overflow-hidden">
          <div className="w-full h-56 relative">
            <Image 
              src={auction.images?.[0] || '/images/placeholder.jpg'} 
              alt={auction.title || 'Property'} 
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-110"
            />
            
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
          </div>
          
          {/* Status Badge */}
          <div className="absolute top-4 right-4">
            <div className={`flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-full shadow-lg backdrop-blur-sm ${statusConfig.color} ${
              statusConfig.pulse ? 'animate-pulse' : ''
            } ${showStatusChangeEffect ? 'animate-bounce' : ''}`}>
              {statusConfig.icon && <statusConfig.icon size={14} />}
              {currentStatus}
            </div>
            {showStatusChangeEffect && (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-ping"></div>
            )}
          </div>
          
          {/* Featured Badge */}
          {auction.featured && (
            <div className="absolute top-4 left-4">
              <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white text-xs font-bold px-3 py-2 rounded-full shadow-lg backdrop-blur-sm">
                ⭐ FEATURED
              </div>
            </div>
          )}
          
          {/* Watchlist Button */}
          <button 
            className={`absolute top-4 ${auction.featured ? 'left-28' : 'left-4'} p-2.5 rounded-full shadow-lg backdrop-blur-sm transition-all duration-200 ${
              isWatchlisted 
                ? 'bg-red-100/90 hover:bg-red-200/90 scale-110' 
                : 'bg-white/90 hover:bg-white hover:scale-110'
            }`}
            onClick={toggleWatchlist}
          >
            <Heart 
              size={16} 
              className={`transition-all duration-200 ${
                isWatchlisted 
                  ? 'text-red-500 fill-red-500' 
                  : 'text-gray-600 hover:text-red-500'
              }`} 
            />
          </button>
          
          {/* Clean image without any text overlay */}
          <div className="absolute inset-0">
            {/* Only gradient overlay for image enhancement */}
          </div>
        </div>
        
        <div className="p-5">
          {/* Property title moved under image */}
          <div className="mb-3">
            <h3 className="text-lg font-bold text-gray-900 line-clamp-2 mb-2">
              {auction.title}
            </h3>
            
            {/* Property location */}
            <div className="flex items-center text-gray-600 text-sm mb-3">
              <MapPin size={16} className="mr-2" />
              <span>{auction.location}</span>
            </div>
            
            {/* Presented by Agent/Brokerage */}
            {auction.seller && (
              <div className="flex items-center text-xs text-gray-500">
                <UserCircle size={14} className="mr-2" />
                <span>
                  Presented by 
                  {auction.seller.companyName && (
                    <span> • <span className="font-medium text-gray-700">{auction.seller.companyName}</span></span>
                  )}
                </span>
              </div>
            )}
          </div>
          
          {/* Property Details Section */}
          {hasPropertyDetails && (
            <div className="mb-4 p-3 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl">
              <div className="grid grid-cols-2 gap-3">
                {propertyDetails.beds && (
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Bed size={14} className="text-blue-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Bedrooms</p>
                      <p className="font-semibold text-gray-900">{propertyDetails.beds}</p>
                    </div>
                  </div>
                )}
                
                {propertyDetails.baths && (
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Bath size={14} className="text-blue-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Bathrooms</p>
                      <p className="font-semibold text-gray-900">{propertyDetails.baths}</p>
                    </div>
                  </div>
                )}
                
                {propertyDetails.sqft && (
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                      <Home size={14} className="text-green-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Square Feet</p>
                      <p className="font-semibold text-gray-900">{Number(propertyDetails.sqft).toLocaleString()}</p>
                    </div>
                  </div>
                )}
                
                {propertyDetails.yearBuilt && (
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Calendar size={14} className="text-purple-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Year Built</p>
                      <p className="font-semibold text-gray-900">{propertyDetails.yearBuilt}</p>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Property Type and Additional Info */}
              <div className="mt-3 pt-3 border-t border-gray-200">
                <div className="flex items-center justify-between text-sm">
                  {propertyDetails.propertyType && (
                    <span className="bg-white px-3 py-1 rounded-full text-gray-700 font-medium">
                      {propertyDetails.propertyType}
                    </span>
                  )}
                  {propertyDetails.lotSize && (
                    <span className="text-gray-600">
                      Lot: {propertyDetails.lotSize}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}
          
          {/* Time remaining */}
          <div className="flex items-center justify-center mb-4 p-3 bg-gray-50 rounded-xl">
            <Clock size={16} className="mr-2 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">{formattedTimeLeft()}</span>
          </div>
          
          {/* Bid information and action in same row */}
          <div className="flex items-center justify-between gap-4 mb-4">
            {/* Left side - Bid info */}
            <div className="flex-1">
              <p className="text-xs text-gray-500 mb-1">
                {currentStatus === 'ENDED' ? 'Final Bid' : 'Current Bid'}
              </p>
              <p className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent mb-2">
                ${auction.currentBid?.toLocaleString() || auction.startingBid?.toLocaleString() || '0'}
              </p>
              
              {/* Bid count below price */}
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center w-8 h-8 bg-blue-50 rounded-full">
                  <Users size={12} className="text-blue-600" />
                </div>
                <span className="text-sm text-gray-600">
                  <span className="font-semibold text-gray-900">{bidCount}</span> {bidCount === 1 ? 'bid' : 'bids'}
                </span>
              </div>
            </div>
            
            {/* Right side - Action button - larger to match bid info */}
            <div className="flex-shrink-0">
              <button 
                onClick={handleBidClick}
                disabled={buttonConfig.disabled}
                className={`flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-semibold text-base transition-all duration-300 transform ${buttonConfig.color} text-white ${
                  buttonConfig.disabled 
                    ? 'cursor-not-allowed opacity-60' 
                    : 'hover:scale-[1.02] hover:shadow-lg active:scale-[0.98]'
                }`}
              >
                {buttonConfig.icon && <buttonConfig.icon size={18} />}
                <span>{buttonConfig.text}</span>
              </button>
            </div>
          </div>
          
          {/* Reserve price indicator */}
          {auction.reservePrice > 0 && (
            <div className={`mb-4 p-3 rounded-xl text-sm ${
              (auction.currentBid || 0) >= auction.reservePrice 
                ? 'bg-green-50 text-green-800 border border-green-200' 
                : 'bg-amber-50 text-amber-800 border border-amber-200'
            }`}>
              <div className="flex items-center justify-between">
                <span className="font-medium">Reserve: ${auction.reservePrice.toLocaleString()}</span>
                <span className="text-xs px-2 py-1 rounded-full bg-white/80 font-bold">
                  {(auction.currentBid || 0) >= auction.reservePrice ? '✅ Met' : '⚠️ Not Met'}
                </span>
              </div>
            </div>
          )}
        </div>
      </Link>
    </div>
  );
}

export default AuctionCard;