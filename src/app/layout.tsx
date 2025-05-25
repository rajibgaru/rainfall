import { Inter } from 'next/font/google';
import { AuthProvider } from '@/context/AuthProvider';
import ToastProvider from '@/components/ui/ToastProvider';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'BargainAuctions.com - Real Estate Auction Platform',
  description: 'Find unbeatable deals and maximize your profits with our cutting-edge auction platform.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <div className="flex flex-col min-h-screen">
            <Header />
            <main className="flex-grow">{children}</main>
            <Footer />
          </div>
          <ToastProvider />
        </AuthProvider>
      </body>
    </html>
  );
}