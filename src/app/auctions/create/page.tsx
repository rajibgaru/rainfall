'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

// Updated schema with minimum escrow requirement
const auctionSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters'),
  description: z.string().min(20, 'Description must be at least 20 characters'),
  startingBid: z.coerce.number().positive('Starting bid must be greater than 0'),
  reservePrice: z.coerce.number().nonnegative('Reserve price must be a non-negative number'),
  incrementAmount: z.coerce.number().positive('Increment amount must be greater than 0'),
  minimumEscrow: z.coerce.number().positive('Minimum escrow amount must be greater than 0'),
  city: z.string().min(2, 'City is required'),
  state: z.string().min(2, 'State is required'),
  category: z.string().min(1, 'Category is required'),
  startDate: z.string().refine(date => new Date(date) > new Date(), {
    message: 'Start date must be in the future'
  }),
  endDate: z.string().refine(date => new Date(date) > new Date(), {
    message: 'End date must be in the future'
  }),
  // Property detail fields
  bedrooms: z.coerce.number().int().min(0, 'Bedrooms must be a non-negative number'),
  bathrooms: z.coerce.number().min(0, 'Bathrooms must be a non-negative number'),
  sqft: z.coerce.number().int().positive('Square footage must be greater than 0'),
  yearBuilt: z.coerce.number().int().min(1800, 'Year built must be 1800 or later')
    .max(new Date().getFullYear(), `Year built cannot be later than ${new Date().getFullYear()}`),
  propertyType: z.string().min(1, 'Property type is required'),
  lotSize: z.string().optional(),
  parking: z.string().optional(),
  features: z.array(z.string()).optional(),
}).refine(data => new Date(data.endDate) > new Date(data.startDate), {
  message: "End date must be after start date",
  path: ['endDate']
}).refine(data => data.reservePrice >= data.startingBid, {
  message: "Reserve price must be equal to or greater than the starting bid",
  path: ['reservePrice']
}).refine(data => data.minimumEscrow >= 1000, {
  message: "Minimum escrow must be at least $1,000",
  path: ['minimumEscrow']
});

type AuctionFormValues = z.infer<typeof auctionSchema>;

export default function CreateAuctionPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [images, setImages] = useState<File[]>([]);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  
  // Redirect if not an agent
  if (session && session.user.role !== 'AGENT') {
    router.push('/dashboard');
  }
  
  const { register, handleSubmit, formState: { errors }, watch } = useForm<AuctionFormValues>({
    resolver: zodResolver(auctionSchema),
    defaultValues: {
      category: '',
      incrementAmount: 100,
      minimumEscrow: 5000, // Default $5k minimum escrow
      propertyType: '',
      bedrooms: 0,
      bathrooms: 0,
      sqft: 0,
      yearBuilt: new Date().getFullYear() - 10,
      reservePrice: 0,
      features: []
    }
  });
  
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFiles = Array.from(e.target.files);
      setImages(prev => [...prev, ...selectedFiles]);
      
      // Create preview URLs
      const newImageUrls = selectedFiles.map(file => URL.createObjectURL(file));
      setImageUrls(prev => [...prev, ...newImageUrls]);
    }
  };
  
  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    
    // Revoke the object URL to avoid memory leaks
    URL.revokeObjectURL(imageUrls[index]);
    setImageUrls(prev => prev.filter((_, i) => i !== index));
  };

  const handleFeatureToggle = (feature: string) => {
    setSelectedFeatures(prev => 
      prev.includes(feature)
        ? prev.filter(f => f !== feature)
        : [...prev, feature]
    );
  };
  
  const onSubmit = async (data: AuctionFormValues) => {
    setLoading(true);
    setError('');
    
    try {
      if (images.length === 0) {
        throw new Error('Please upload at least one image');
      }
      
      // First upload the images
      const imageUploadPromises = images.map(async (image) => {
        const formData = new FormData();
        formData.append('file', image);
        
        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        });
        
        if (!response.ok) {
          throw new Error('Failed to upload images');
        }
        
        const { fileUrl } = await response.json();
        return fileUrl;
      });
      
      const uploadedImageUrls = await Promise.all(imageUploadPromises);
      
      // Property details as JSON
      const propertyDetails = {
        beds: data.bedrooms,
        baths: data.bathrooms,
        sqft: data.sqft,
        yearBuilt: data.yearBuilt,
        lotSize: data.lotSize || '0.25 acres',
        propertyType: data.propertyType,
        parking: data.parking || 'Garage - 2 cars',
        features: selectedFeatures.length > 0 ? selectedFeatures : ['Central Air', 'Fireplace', 'Hardwood Floors']
      };
      
      // Combine city and state for the location field
      const location = `${data.city}, ${data.state}`;
      
      // Create the auction with minimum escrow requirement
      const response = await fetch('/api/auctions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: data.title,
          description: data.description,
          startingBid: data.startingBid,
          reservePrice: data.reservePrice,
          incrementAmount: data.incrementAmount,
          minimumEscrow: data.minimumEscrow, // Add minimum escrow to the request
          location: location,
          category: data.category,
          startDate: data.startDate,
          endDate: data.endDate,
          images: uploadedImageUrls,
          currentBid: data.startingBid,
          status: 'UPCOMING',
          propertyDetails
        })
      });
      
      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Failed to create auction');
      }
      
      const { auction } = await response.json();
      
      // Redirect to the new auction page
      router.push(`/auctions/${auction.id}`);
      
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };
  
  // Property categories
  const categories = [
    'Residential',
    'Commercial',
    'Land',
    'Industrial',
    'Multi-Family',
    'Luxury'
  ];

  // Property types
  const propertyTypes = [
    'Single Family',
    'Condo',
    'Townhouse',
    'Multi-Family',
    'Commercial',
    'Land',
    'Industrial',
    'Other'
  ];

  // US States for dropdown
  const usStates = [
    { value: 'AL', label: 'Alabama' },
    { value: 'AK', label: 'Alaska' },
    { value: 'AZ', label: 'Arizona' },
    { value: 'AR', label: 'Arkansas' },
    { value: 'CA', label: 'California' },
    { value: 'CO', label: 'Colorado' },
    { value: 'CT', label: 'Connecticut' },
    { value: 'DE', label: 'Delaware' },
    { value: 'FL', label: 'Florida' },
    { value: 'GA', label: 'Georgia' },
    { value: 'HI', label: 'Hawaii' },
    { value: 'ID', label: 'Idaho' },
    { value: 'IL', label: 'Illinois' },
    { value: 'IN', label: 'Indiana' },
    { value: 'IA', label: 'Iowa' },
    { value: 'KS', label: 'Kansas' },
    { value: 'KY', label: 'Kentucky' },
    { value: 'LA', label: 'Louisiana' },
    { value: 'ME', label: 'Maine' },
    { value: 'MD', label: 'Maryland' },
    { value: 'MA', label: 'Massachusetts' },
    { value: 'MI', label: 'Michigan' },
    { value: 'MN', label: 'Minnesota' },
    { value: 'MS', label: 'Mississippi' },
    { value: 'MO', label: 'Missouri' },
    { value: 'MT', label: 'Montana' },
    { value: 'NE', label: 'Nebraska' },
    { value: 'NV', label: 'Nevada' },
    { value: 'NH', label: 'New Hampshire' },
    { value: 'NJ', label: 'New Jersey' },
    { value: 'NM', label: 'New Mexico' },
    { value: 'NY', label: 'New York' },
    { value: 'NC', label: 'North Carolina' },
    { value: 'ND', label: 'North Dakota' },
    { value: 'OH', label: 'Ohio' },
    { value: 'OK', label: 'Oklahoma' },
    { value: 'OR', label: 'Oregon' },
    { value: 'PA', label: 'Pennsylvania' },
    { value: 'RI', label: 'Rhode Island' },
    { value: 'SC', label: 'South Carolina' },
    { value: 'SD', label: 'South Dakota' },
    { value: 'TN', label: 'Tennessee' },
    { value: 'TX', label: 'Texas' },
    { value: 'UT', label: 'Utah' },
    { value: 'VT', label: 'Vermont' },
    { value: 'VA', label: 'Virginia' },
    { value: 'WA', label: 'Washington' },
    { value: 'WV', label: 'West Virginia' },
    { value: 'WI', label: 'Wisconsin' },
    { value: 'WY', label: 'Wyoming' },
    { value: 'DC', label: 'District of Columbia' },
  ];

  // Common property features
  const commonFeatures = [
    'Central Air',
    'Fireplace',
    'Hardwood Floors',
    'Swimming Pool',
    'Garage',
    'Basement',
    'Waterfront',
    'Mountain View',
    'Smart Home',
    'Solar Panels',
    'EV Charging',
    'Gated Community'
  ];
  
  return (
    <div className="container mx-auto py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Create New Auction</h1>
          <Link 
            href="/dashboard/agent" 
            className="text-blue-600 hover:underline"
          >
            Back to Dashboard
          </Link>
        </div>
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* Basic Information */}
          <div className="border-b border-gray-200 pb-6">
            <h2 className="text-lg font-medium mb-4">Basic Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label htmlFor="title" className="block text-gray-700 font-medium mb-1">
                  Property Title
                </label>
                <input
                  id="title"
                  type="text"
                  {...register('title')}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Modern Beachfront Villa"
                />
                {errors.title && (
                  <p className="text-red-600 text-sm mt-1">{errors.title.message}</p>
                )}
              </div>
              
              <div className="md:col-span-2">
                <label htmlFor="description" className="block text-gray-700 font-medium mb-1">
                  Description
                </label>
                <textarea
                  id="description"
                  {...register('description')}
                  rows={4}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Describe the property, its features, and any special conditions..."
                ></textarea>
                {errors.description && (
                  <p className="text-red-600 text-sm mt-1">{errors.description.message}</p>
                )}
              </div>
              
              {/* Separated City and State fields */}
              <div>
                <label htmlFor="city" className="block text-gray-700 font-medium mb-1">
                  City
                </label>
                <input
                  id="city"
                  type="text"
                  {...register('city')}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter city"
                />
                {errors.city && (
                  <p className="text-red-600 text-sm mt-1">{errors.city.message}</p>
                )}
              </div>
              
              <div>
                <label htmlFor="state" className="block text-gray-700 font-medium mb-1">
                  State
                </label>
                <select
                  id="state"
                  {...register('state')}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select state</option>
                  {usStates.map((state) => (
                    <option key={state.value} value={state.value}>
                      {state.label}
                    </option>
                  ))}
                </select>
                {errors.state && (
                  <p className="text-red-600 text-sm mt-1">{errors.state.message}</p>
                )}
              </div>
              
              <div>
                <label htmlFor="category" className="block text-gray-700 font-medium mb-1">
                  Property Category
                </label>
                <select
                  id="category"
                  {...register('category')}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a category</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
                {errors.category && (
                  <p className="text-red-600 text-sm mt-1">{errors.category.message}</p>
                )}
              </div>
            </div>
          </div>
          
          {/* Property Details */}
          <div className="border-b border-gray-200 pb-6">
            <h2 className="text-lg font-medium mb-4">Property Details</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="bedrooms" className="block text-gray-700 font-medium mb-1">
                  Bedrooms
                </label>
                <input
                  id="bedrooms"
                  type="number"
                  min="0"
                  {...register('bedrooms')}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {errors.bedrooms && (
                  <p className="text-red-600 text-sm mt-1">{errors.bedrooms.message}</p>
                )}
              </div>
              
              <div>
                <label htmlFor="bathrooms" className="block text-gray-700 font-medium mb-1">
                  Bathrooms
                </label>
                <input
                  id="bathrooms"
                  type="number"
                  min="0"
                  step="0.5"
                  {...register('bathrooms')}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="2.5"
                />
                {errors.bathrooms && (
                  <p className="text-red-600 text-sm mt-1">{errors.bathrooms.message}</p>
                )}
              </div>
              
              <div>
                <label htmlFor="sqft" className="block text-gray-700 font-medium mb-1">
                  Square Footage
                </label>
                <input
                  id="sqft"
                  type="number"
                  min="1"
                  {...register('sqft')}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="1800"
                />
                {errors.sqft && (
                  <p className="text-red-600 text-sm mt-1">{errors.sqft.message}</p>
                )}
              </div>
              
              <div>
                <label htmlFor="yearBuilt" className="block text-gray-700 font-medium mb-1">
                  Year Built
                </label>
                <input
                  id="yearBuilt"
                  type="number"
                  min="1800"
                  max={new Date().getFullYear()}
                  {...register('yearBuilt')}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="2010"
                />
                {errors.yearBuilt && (
                  <p className="text-red-600 text-sm mt-1">{errors.yearBuilt.message}</p>
                )}
              </div>
              
              <div>
                <label htmlFor="propertyType" className="block text-gray-700 font-medium mb-1">
                  Property Type
                </label>
                <select
                  id="propertyType"
                  {...register('propertyType')}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select property type</option>
                  {propertyTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
                {errors.propertyType && (
                  <p className="text-red-600 text-sm mt-1">{errors.propertyType.message}</p>
                )}
              </div>
              
              <div>
                <label htmlFor="lotSize" className="block text-gray-700 font-medium mb-1">
                  Lot Size (optional)
                </label>
                <input
                  id="lotSize"
                  type="text"
                  {...register('lotSize')}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., 0.25 acres"
                />
              </div>
              
              <div>
                <label htmlFor="parking" className="block text-gray-700 font-medium mb-1">
                  Parking (optional)
                </label>
                <input
                  id="parking"
                  type="text"
                  {...register('parking')}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Garage - 2 cars"
                />
              </div>
            </div>
            
            {/* Property Features */}
            <div className="mt-6">
              <label className="block text-gray-700 font-medium mb-2">
                Property Features
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {commonFeatures.map((feature) => (
                  <div key={feature} className="flex items-center">
                    <input
                      type="checkbox"
                      id={`feature-${feature}`}
                      checked={selectedFeatures.includes(feature)}
                      onChange={() => handleFeatureToggle(feature)}
                      className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor={`feature-${feature}`} className="text-sm text-gray-700">
                      {feature}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Auction Details - Updated with Minimum Escrow */}
          <div className="border-b border-gray-200 pb-6">
            <h2 className="text-lg font-medium mb-4">Auction Details</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="startingBid" className="block text-gray-700 font-medium mb-1">
                  Starting Bid ($)
                </label>
                <input
                  id="startingBid"
                  type="number"
                  step="0.01"
                  min="0"
                  {...register('startingBid')}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                />
                {errors.startingBid && (
                  <p className="text-red-600 text-sm mt-1">{errors.startingBid.message}</p>
                )}
              </div>
              
              <div>
                <label htmlFor="reservePrice" className="block text-gray-700 font-medium mb-1">
                  Reserve Price ($)
                </label>
                <input
                  id="reservePrice"
                  type="number"
                  step="0.01"
                  min={watch('startingBid') || 0}
                  {...register('reservePrice')}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter reserve price"
                />
                <p className="text-xs text-gray-500 mt-1">
                  The reserve price is the minimum amount you're willing to accept. If bids don't reach this amount, you're not obligated to sell. Leave blank to sell to the highest bidder regardless of amount.
                </p>
                {errors.reservePrice && (
                  <p className="text-red-600 text-sm mt-1">{errors.reservePrice.message}</p>
                )}
              </div>
              
              <div>
                <label htmlFor="minimumEscrow" className="block text-gray-700 font-medium mb-1">
                  Minimum Escrow Requirement ($)
                </label>
                <input
                  id="minimumEscrow"
                  type="number"
                  step="100"
                  min="1000"
                  {...register('minimumEscrow')}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="5000.00"
                />
                <p className="text-xs text-gray-500 mt-1">
                  The minimum amount bidders must have in their escrow wallet to participate in this auction.
                </p>
                {errors.minimumEscrow && (
                  <p className="text-red-600 text-sm mt-1">{errors.minimumEscrow.message}</p>
                )}
              </div>
              
              <div>
                <label htmlFor="incrementAmount" className="block text-gray-700 font-medium mb-1">
                  Bid Increment ($)
                </label>
                <input
                  id="incrementAmount"
                  type="number"
                  step="0.01"
                  min="0"
                  {...register('incrementAmount')}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="100.00"
                />
                {errors.incrementAmount && (
                  <p className="text-red-600 text-sm mt-1">{errors.incrementAmount.message}</p>
                )}
              </div>
              
              <div>
                <label htmlFor="startDate" className="block text-gray-700 font-medium mb-1">
                  Start Date & Time
                </label>
                <input
                  id="startDate"
                  type="datetime-local"
                  {...register('startDate')}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {errors.startDate && (
                  <p className="text-red-600 text-sm mt-1">{errors.startDate.message}</p>
                )}
              </div>
              
              <div>
                <label htmlFor="endDate" className="block text-gray-700 font-medium mb-1">
                  End Date & Time
                </label>
                <input
                  id="endDate"
                  type="datetime-local"
                  {...register('endDate')}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {errors.endDate && (
                  <p className="text-red-600 text-sm mt-1">{errors.endDate.message}</p>
                )}
              </div>
            </div>
          </div>
          
          {/* Image Upload */}
          <div>
            <h2 className="text-lg font-medium mb-4">Property Images</h2>
            
            <div className="mb-4">
              <label 
                htmlFor="images" 
                className="block w-full p-4 border-2 border-dashed border-gray-300 rounded-lg text-center cursor-pointer hover:bg-gray-50"
              >
                <div className="space-y-1 text-center">
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400"
                    stroke="currentColor"
                    fill="none"
                    viewBox="0 0 48 48"
                    aria-hidden="true"
                  >
                    <path
                      d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <p className="text-sm text-gray-500">
                    Click to upload images or drag and drop
                  </p>
                  <p className="text-xs text-gray-500">
                    PNG, JPG, JPEG up to 10MB each
                  </p>
                </div>
                <input 
                  id="images" 
                  type="file" 
                  accept="image/*" 
                  multiple 
                  className="hidden" 
                  onChange={handleImageChange} 
                />
              </label>
            </div>
            
            {/* Image Preview */}
            {imageUrls.length > 0 && (
              <div className="mt-4">
                <h3 className="text-sm font-medium mb-2">Uploaded Images:</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {imageUrls.map((url, index) => (
                    <div key={index} className="relative group">
                      <img 
                        src={url} 
                        alt={`Property image ${index + 1}`} 
                        className="h-32 w-full object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          {/* Submit Button */}
          <div className="flex justify-center pt-4">
            <button
              type="submit"
              disabled={loading}
              className="w-full md:w-1/2 bg-blue-600 text-white font-medium py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-400"
            >
              {loading ? 'Creating Auction...' : 'Create Auction'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}