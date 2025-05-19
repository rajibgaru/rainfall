import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import Image from 'next/image';

export default function Home() {
  return (
    <main>
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-16 md:py-24">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="flex flex-col md:flex-row items-center">
            <div className="md:w-1/2 mb-8 md:mb-0">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                Unlock Real Estate Opportunities
              </h1>
              <p className="text-xl mb-8 text-blue-100">
                Find unbeatable deals and maximize your profits with our cutting-edge 
                auction platform for residential and commercial properties.
              </p>
              <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                <Link
                  href="/auctions"
                  className="bg-white text-blue-600 font-semibold px-6 py-3 rounded-lg hover:bg-gray-100 transition-colors text-center"
                >
                  Browse Auctions
                </Link>
                <Link
                  href="/how-it-works"
                  className="bg-transparent border-2 border-white text-white font-semibold px-6 py-3 rounded-lg hover:bg-white hover:text-blue-600 transition-colors text-center"
                >
                  Learn More
                </Link>
              </div>
            </div>
            <div className="md:w-1/2 md:pl-10">
              <div className="relative w-full h-64 md:h-96 rounded-lg overflow-hidden shadow-xl">
                <Image
                  src="/images/hero-property.jpg"
                  alt="Auction Property"
                  fill
                  className="object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Auctions Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold">Featured Auctions</h2>
            <Link
              href="/auctions?featured=true"
              className="flex items-center text-blue-600 hover:text-blue-800 font-medium"
            >
              View All
              <ChevronRight size={16} className="ml-1" />
            </Link>
          </div>
          
          {/* Placeholder for FeaturedAuctions component */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* We'll add auction cards here later */}
            {[1, 2, 3, 4].map((item) => (
              <div key={item} className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="h-48 bg-gray-200"></div>
                <div className="p-4">
                  <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2 mb-3"></div>
                  <div className="h-8 bg-gray-200 rounded w-full mt-4"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">How It Works</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Our auction platform makes buying and selling properties simple and transparent.
              Follow these steps to get started.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                title: 'Find Properties',
                description: 'Browse through our extensive catalog of residential and commercial properties up for auction.'
              },
              {
                title: 'Register & Due Diligence',
                description: 'Create an account and research the properties that interest you. Review all available documents.'
              },
              {
                title: 'Bid & Win',
                description: 'Place your bids online from anywhere. Set maximum bids and get notifications when you\'re outbid.'
              },
              {
                title: 'Close & Move In',
                description: 'Complete the payment process and finalize the transaction with our support team.'
              }
            ].map((step, index) => (
              <div key={index} className="bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 text-blue-600 mb-4">
                  {index + 1}
                </div>
                <h3 className="text-xl font-semibold mb-2">
                  <span className="text-blue-600 mr-2">{index + 1}.</span>
                  {step.title}
                </h3>
                <p className="text-gray-600">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">What Our Clients Say</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Hear from buyers and sellers who have successfully used our platform.
            </p>
          </div>
          
          <div className="bg-white rounded-lg shadow-lg p-8 md:p-12">
            <div className="flex flex-col md:flex-row items-center">
              <div className="md:w-1/3 mb-6 md:mb-0 md:pr-8">
                <div className="relative w-32 h-32 mx-auto rounded-full bg-gray-200">
                  {/* Add testimonial user image here */}
                </div>
                <div className="text-center mt-4">
                  <h3 className="text-xl font-bold">John Smith</h3>
                  <p className="text-gray-600">Property Investor</p>
                </div>
              </div>
              <div className="md:w-2/3">
                <div className="relative">
                  <p className="text-gray-700 text-lg relative z-10 italic">
                    "$ Houses Auction Depot's platform made property acquisition incredibly streamlined. I was able to find and bid on multiple properties from my home office, saving me countless hours of travel and paperwork."
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Download App Banner */}
      <section className="py-16 bg-blue-600 text-white">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="md:w-2/3 mb-8 md:mb-0">
              <h2 className="text-3xl font-bold mb-4">Get the $ Houses Auction Depot Mobile App</h2>
              <p className="text-blue-100 text-lg mb-6">
                Never miss an auction opportunity. Bid on properties, receive notifications, 
                and manage your watchlist from anywhere.
              </p>
              <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                <Link
                  href="#"
                  className="flex items-center justify-center space-x-2 bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-900 transition-colors"
                >
                  <span>App Store</span>
                </Link>
                <Link
                  href="#"
                  className="flex items-center justify-center space-x-2 bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-900 transition-colors"
                >
                  <span>Google Play</span>
                </Link>
              </div>
            </div>
            <div className="md:w-1/3 flex justify-center">
              <div className="relative w-64 h-64 bg-blue-700 rounded-lg">
                {/* Mobile app mockup image */}
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}