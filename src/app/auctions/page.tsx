'use client'

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Filter, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import AuctionCard from '@/components/auctions/AuctionCard';

export default function AuctionsPage() {
  const searchParams = useSearchParams();
  const [auctions, setAuctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    category: searchParams.get('category') || '',
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
    status: searchParams.get('status') || '',
    sort: searchParams.get('sort') || 'endingSoon',
  });

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
          featured: false,
          images: ['/images/placeholder.jpg']
        },
        {
          id: '3',
          title: 'Rustic Mountain Cabin',
          location: 'Aspen, Colorado',
          currentBid: 180000,
          endDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 5), // 5 days from now
          bids: 5,
          featured: false,
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
        },
        {
          id: '5',
          title: 'Suburban Family Home',
          location: 'Portland, Oregon',
          currentBid: 275000,
          endDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 4), // 4 days from now
          bids: 7,
          featured: false,
          images: ['/images/placeholder.jpg']
        },
        {
          id: '6',
          title: 'Waterfront Cottage',
          location: 'Lake Tahoe, Nevada',
          currentBid: 425000,
          endDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 6), // 6 days from now
          bids: 9,
          featured: false,
          images: ['/images/placeholder.jpg']
        },
        {
          id: '7',
          title: 'Urban Loft Space',
          location: 'New York, New York',
          currentBid: 680000,
          endDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3), // 3 days from now
          bids: 19,
          featured: false,
          images: ['/images/placeholder.jpg']
        },
        {
          id: '8',
          title: 'Ranch Style Property',
          location: 'Austin, Texas',
          currentBid: 360000,
          endDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7), // 7 days from now
          bids: 4,
          featured: false,
          images: ['/images/placeholder.jpg']
        }
      ]);
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timeout);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    // In a real app, you'd apply the search query here
    console.log('Search for:', searchQuery);
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const applyFilters = () => {
    // In a real app, you'd apply the filters here
    console.log('Apply filters:', filters);
    // Close the filter panel
    setShowFilters(false);
  };

  const resetFilters = () => {
    setFilters({
      category: '',
      minPrice: '',
      maxPrice: '',
      status: '',
      sort: 'endingSoon',
    });
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <h1 className="text-3xl font-bold mb-6">Property Auctions</h1>
      
      {/* Search and Filter */}
      <div className="flex flex-col md:flex-row items-center justify-between mb-6 space-y-4 md:space-y-0">
        <form onSubmit={handleSearch} className="relative w-full md:w-1/3">
          <input 
            type="text" 
            placeholder="Search auctions..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <Search size={18} className="absolute left-3 top-2.5 text-gray-400" />
          <button type="submit" className="sr-only">Search</button>
        </form>
        
        <div className="flex items-center space-x-4 w-full md:w-auto">
          <button 
            className="flex items-center space-x-2 px-4 py-2 border rounded-lg bg-white hover:bg-gray-50"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter size={18} />
            <span>Filters</span>
          </button>
          <select 
            value={filters.sort}
            onChange={(e) => setFilters({...filters, sort: e.target.value})}
            className="px-4 py-2 border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="endingSoon">Sort by: Ending Soon</option>
            <option value="priceLow">Price: Low to High</option>
            <option value="priceHigh">Price: High to Low</option>
            <option value="mostBids">Most Bids</option>
            <option value="newest">Recently Added</option>
          </select>
        </div>
      </div>
      
      {/* Filter Panel */}
      {showFilters && (
        <div className="bg-white p-4 rounded-lg shadow-md mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select 
                name="category"
                value={filters.category}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="">All Categories</option>
                <option value="residential">Residential</option>
                <option value="commercial">Commercial</option>
                <option value="land">Land</option>
                <option value="industrial">Industrial</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Price Range</label>
              <div className="flex space-x-2">
                <input 
                  type="number" 
                  name="minPrice"
                  placeholder="Min" 
                  value={filters.minPrice}
                  onChange={handleFilterChange}
                  className="w-1/2 px-3 py-2 border rounded-md"
                />
                <input 
                  type="number" 
                  name="maxPrice"
                  placeholder="Max" 
                  value={filters.maxPrice}
                  onChange={handleFilterChange}
                  className="w-1/2 px-3 py-2 border rounded-md"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select 
                name="status"
                value={filters.status}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="">All Statuses</option>
                <option value="LIVE">Live Auctions</option>
                <option value="UPCOMING">Upcoming Auctions</option>
                <option value="ENDED">Ended Auctions</option>
              </select>
            </div>
          </div>
          
          <div className="flex justify-end mt-4 space-x-2">
            <button 
              onClick={resetFilters}
              className="px-4 py-2 border rounded-md hover:bg-gray-50"
            >
              Reset
            </button>
            <button 
              onClick={applyFilters}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Apply Filters
            </button>
          </div>
          </div>
      )}
      
      {/* Auctions Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((item) => (
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
      ) : auctions.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow-sm">
          <p className="text-gray-500">No auctions found matching your criteria</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {auctions.map((auction) => (
            <AuctionCard key={auction.id} auction={auction} />
          ))}
        </div>
      )}
      
      {/* Pagination */}
      {!loading && auctions.length > 0 && (
        <div className="flex justify-center mt-8">
          <div className="flex space-x-2">
            <button className="w-10 h-10 rounded-full flex items-center justify-center bg-white border hover:bg-gray-50">
              <ChevronLeft size={18} />
            </button>
            <button className="w-10 h-10 rounded-full flex items-center justify-center bg-blue-600 text-white">
              1
            </button>
            <button className="w-10 h-10 rounded-full flex items-center justify-center bg-white border hover:bg-gray-50">
              2
            </button>
            <button className="w-10 h-10 rounded-full flex items-center justify-center bg-white border hover:bg-gray-50">
              3
            </button>
            <button className="w-10 h-10 rounded-full flex items-center justify-center bg-white border hover:bg-gray-50">
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}