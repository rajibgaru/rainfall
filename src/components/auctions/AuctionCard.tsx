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
  UserCircle,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  ImageIcon,
  Loader2
} from 'lucide-react';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { useSession } from 'next-auth/react';
import { toast } from 'react-hot-toast'; // Make sure to install react-hot-toast

function AuctionCard({ auction, refreshKey }) {
  const [isWatchlisted, setIsWatchlisted] = useState(false);
  const [watchlistLoading, setWatchlistLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const { data: session, status } = useSession();
  
  // Check if user is an agent
  const isAgent = session?.user?.role === 'AGENT';
  
  // Check initial watchlist status
  useEffect(() => {
    if (status === 'authenticated' && auction?.id) {
      checkWatchlistStatus();
    }
  }, [status, auction?.id]);
  
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
  
  // Check if auction is in user's watchlist
  const checkWatchlistStatus = async () => {
    try {
      const response = await fetch(`/api/auctions/${auction.id}/watchlist`);
      
      if (response.ok) {
        const data = await response.json();
        setIsWatchlisted(data.isWatchlisted);
      }
    } catch (error) {
      console.error('Error checking watchlist status:', error);
    }
  };
  
  // Get auction images with fallback
  const images = auction.images?.length > 0 
    ? auction.images 
    : ['/images/placeholder.jpg'];
  
  // Navigate to previous image
  const prevImage = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImageIndex((prevIndex) => 
      prevIndex === 0 ? images.length - 1 : prevIndex - 1
    );
  };
  
  // Navigate to next image
  const nextImage = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImageIndex((prevIndex) => 
      prevIndex === images.length - 1 ? 0 : prevIndex + 1
    );
  };
  
  // Jump to specific image
  const jumpToImage = (index, e) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImageIndex(index);
  };
  
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
    
    // Check if user is logged in
    if (status !== 'authenticated') {
      toast.error('Please sign in to use the watchlist feature');
      return;
    }
    
    setWatchlistLoading(true);
    
    try {
      const method = isWatchlisted ? 'DELETE' : 'POST';
      
      const response = await fetch(`/api/auctions/${auction.id}/watchlist`, {
        method
      });
      
      if (!response.ok) {
        throw new Error('Failed to update watchlist');
      }
      
      const data = await response.json();
      setIsWatchlisted(data.isWatchlisted);
      
      // Show success message
      toast.success(data.message);
      
    } catch (error) {
      console.error('Error updating watchlist:', error);
      toast.error('Failed to update watchlist');
    } finally {
      setWatchlistLoading(false);
    }
  };
  
  const handleBidClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    // If user is an agent, show a tooltip or alert instead of navigating
    if (isAgent && currentStatus === 'LIVE') {
      toast.error('Agents cannot bid on auctions');
      return;
    }
    
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
    // If user is an agent and auction is live, disable bidding
    if (isAgent && currentStatus === 'LIVE') {
      return {
        text: 'Agents Cannot Bid',
        icon: AlertCircle,
        color: 'bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-500 hover:to-gray-600',
        disabled: true
      };
    }
    
    // Regular button config based on auction status
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
          {/* Image Gallery */}
          <div className="w-full h-72 relative">
            <Image 
              src={images[currentImageIndex]} 
              alt={auction.title || 'Property'} 
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-110"
            />
            
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
            
            {/* Image counter */}
            {images.length > 1 && (
              <div className="absolute bottom-4 right-4 bg-black/70 text-white text-xs px-2 py-1 rounded-full backdrop-blur-sm">
                <div className="flex items-center gap-1">
                  <ImageIcon size={12} />
                  <span>{currentImageIndex + 1}/{images.length}</span>
                </div>
              </div>
            )}
            
            {/* Image navigation buttons */}
            {images.length > 1 && (
              <>
                <button 
                  onClick={prevImage}
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white p-1.5 rounded-full backdrop-blur-sm transition-all"
                >
                  <ChevronLeft size={20} />
                </button>
                <button 
                  onClick={nextImage}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white p-1.5 rounded-full backdrop-blur-sm transition-all"
                >
                  <ChevronRight size={20} />
                </button>
              </>
            )}
            
            {/* Image dot indicators */}
            {images.length > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
                {images.map((_, index) => (
                  <button
                    key={index}
                    onClick={(e) => jumpToImage(index, e)}
                    className={`w-2 h-2 rounded-full transition-all ${
                      index === currentImageIndex 
                        ? 'bg-white scale-125' 
                        : 'bg-white/50 hover:bg-white/80'
                    }`}
                    aria-label={`View image ${index + 1}`}
                  />
                ))}
              </div>
            )}
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
          
          {/* Agent restriction badge */}
          {isAgent && currentStatus === 'LIVE' && (
            <div className="absolute top-16 right-4">
              <div className="bg-gradient-to-r from-red-500 to-red-600 text-white text-xs font-bold px-3 py-2 rounded-full shadow-lg backdrop-blur-sm">
                Agent Restricted
              </div>
            </div>
          )}
          
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
            disabled={watchlistLoading}
          >
            {watchlistLoading ? (
              <Loader2 size={16} className="animate-spin text-gray-600" />
            ) : (
              <Heart 
                size={16} 
                className={`transition-all duration-200 ${
                  isWatchlisted 
                    ? 'text-red-500 fill-red-500' 
                    : 'text-gray-600 hover:text-red-500'
                }`} 
              />
            )}
          </button>
        </div>
        
        <div className="p-4">
          {/* Property title */}
          <div className="mb-2">
            <h3 className="text-lg font-bold text-gray-900 line-clamp-2 mb-1">
              {auction.title}
            </h3>
            
            {/* Property location */}
            <div className="flex items-center text-gray-600 text-sm mb-2">
              <MapPin size={14} className="mr-1.5" />
              <span>{auction.location}</span>
            </div>
            
            {/* Presented by Agent/Brokerage */}
            {auction.seller && (
              <div className="flex items-center text-xs text-gray-500">
                <UserCircle size={12} className="mr-1.5" />
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
            <div className="mb-3 p-2.5 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl">
              <div className="grid grid-cols-2 gap-2">
                {propertyDetails.beds !== undefined && (
                  <div className="flex items-center gap-1.5">
                    <div className="w-7 h-7 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Bed size={12} className="text-blue-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 leading-tight">Bedrooms</p>
                      <p className="font-semibold text-gray-900 leading-tight">{propertyDetails.beds}</p>
                    </div>
                  </div>
                )}
                
                {propertyDetails.baths !== undefined && (
                  <div className="flex items-center gap-1.5">
                    <div className="w-7 h-7 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Bath size={12} className="text-blue-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 leading-tight">Bathrooms</p>
                      <p className="font-semibold text-gray-900 leading-tight">{propertyDetails.baths}</p>
                    </div>
                  </div>
                )}
                
                {propertyDetails.sqft && (
                  <div className="flex items-center gap-1.5">
                    <div className="w-7 h-7 bg-green-100 rounded-lg flex items-center justify-center">
                      <Home size={12} className="text-green-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 leading-tight">Square Feet</p>
                      <p className="font-semibold text-gray-900 leading-tight">{Number(propertyDetails.sqft).toLocaleString()}</p>
                    </div>
                  </div>
                )}
                
                {propertyDetails.yearBuilt && (
                  <div className="flex items-center gap-1.5">
                    <div className="w-7 h-7 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Calendar size={12} className="text-purple-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 leading-tight">Year Built</p>
                      <p className="font-semibold text-gray-900 leading-tight">{propertyDetails.yearBuilt}</p>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Property Type and Additional Info */}
              <div className="mt-2 pt-2 border-t border-gray-200">
                <div className="flex items-center justify-between text-xs">
                  {propertyDetails.propertyType && (
                    <span className="bg-white px-2 py-0.5 rounded-full text-gray-700 font-medium">
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
          <div className="flex items-center justify-center mb-3 p-2 bg-gray-50 rounded-xl">
            <Clock size={14} className="mr-1.5 text-gray-600" />
            <span className="text-xs font-medium text-gray-700">{formattedTimeLeft()}</span>
          </div>
          
          {/* Agent Warning Message */}
          {isAgent && currentStatus === 'LIVE' && (
            <div className="mb-3 p-2 bg-red-50 border border-red-200 text-red-700 rounded-xl">
              <div className="flex items-center gap-1.5">
                <AlertCircle size={14} />
                <span className="text-xs font-medium">Agents cannot place bids on auctions</span>
              </div>
            </div>
          )}
          
          {/* Bid information and action */}
          <div className="flex items-center justify-between gap-3 mb-3">
            {/* Left side - Bid info */}
            <div className="flex-1">
              <p className="text-xs text-gray-500 mb-0.5">
                {currentStatus === 'ENDED' ? 'Final Bid' : 'Current Bid'}
              </p>
              <p className="text-xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent mb-1">
                ${auction.currentBid?.toLocaleString() || auction.startingBid?.toLocaleString() || '0'}
              </p>
              
              {/* Bid count below price */}
              <div className="flex items-center gap-1.5">
                <div className="flex items-center justify-center w-6 h-6 bg-blue-50 rounded-full">
                  <Users size={10} className="text-blue-600" />
                </div>
                <span className="text-xs text-gray-600">
                  <span className="font-semibold text-gray-900">{bidCount}</span> {bidCount === 1 ? 'bid' : 'bids'}
                </span>
              </div>
            </div>
            
            {/* Right side - Action button */}
            <div className="flex-shrink-0">
              <button 
                onClick={handleBidClick}
                disabled={buttonConfig.disabled}
                className={`flex items-center justify-center gap-1.5 px-6 py-3 rounded-xl font-semibold text-sm transition-all duration-300 transform ${buttonConfig.color} text-white ${
                  buttonConfig.disabled 
                    ? 'cursor-not-allowed opacity-60' 
                    : 'hover:scale-[1.02] hover:shadow-lg active:scale-[0.98]'
                }`}
              >
                {buttonConfig.icon && <buttonConfig.icon size={16} />}
                <span>{buttonConfig.text}</span>
              </button>
            </div>
          </div>
          
          {/* Reserve price indicator - UPDATED: Hide actual amount */}
          {auction.reservePrice > 0 && (
            <div className={`mb-3 p-2 rounded-xl text-xs ${
              (auction.currentBid || 0) >= auction.reservePrice 
                ? 'bg-green-50 text-green-800 border border-green-200' 
                : 'bg-amber-50 text-amber-800 border border-amber-200'
            }`}>
              <div className="flex items-center justify-between">
                <span className="font-medium">Reserve Price</span>
                <span className="text-xs px-1.5 py-0.5 rounded-full bg-white/80 font-bold">
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