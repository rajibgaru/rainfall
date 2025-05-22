import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-gray-800 text-white py-12">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-xl font-bold mb-4">BargainAuctions.com</h3>
            <p className="text-gray-400 mb-4">
              Transforming real estate transactions with our cutting-edge auction platform.
            </p>
            <div className="flex space-x-4">
              {/* Social icons */}
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li><Link href="/" className="text-gray-400 hover:text-white">Home</Link></li>
              <li><Link href="/auctions" className="text-gray-400 hover:text-white">Auctions</Link></li>
              <li><Link href="/how-it-works" className="text-gray-400 hover:text-white">How It Works</Link></li>
              <li><Link href="/faq" className="text-gray-400 hover:text-white">FAQ</Link></li>
              <li><Link href="/contact" className="text-gray-400 hover:text-white">Contact Us</Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4">Resources</h3>
            <ul className="space-y-2">
              <li><Link href="/guides/bidding" className="text-gray-400 hover:text-white">Bidding Guide</Link></li>
              <li><Link href="/resources" className="text-gray-400 hover:text-white">Property Resources</Link></li>
              <li><Link href="/blog" className="text-gray-400 hover:text-white">Real Estate Blog</Link></li>
              <li><Link href="/privacy" className="text-gray-400 hover:text-white">Privacy Policy</Link></li>
              <li><Link href="/terms" className="text-gray-400 hover:text-white">Terms of Service</Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4">Subscribe</h3>
            <p className="text-gray-400 mb-4">Stay updated with our latest auctions and real estate opportunities.</p>
            <div className="flex">
              <input 
                type="email" 
                placeholder="Your email" 
                className="px-4 py-2 w-full rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              />
              <button className="bg-blue-600 text-white px-4 py-2 rounded-r-md hover:bg-blue-700">
                Subscribe
              </button>
            </div>
          </div>
        </div>
        
        <div className="border-t border-gray-700 mt-8 pt-8 text-center">
          <p className="text-gray-400">© {new Date().getFullYear()} BargainAuctions.com. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}