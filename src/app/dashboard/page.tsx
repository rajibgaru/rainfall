// src/app/dashboard/page.tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

export default function DashboardPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    // Only redirect if we're authenticated
    if (status === 'authenticated') {
      // Check user role and redirect accordingly
      if (session?.user?.role === 'AGENT') {
        router.push('/dashboard/agent');
      } else if (session?.user?.role === 'ADMIN') {
        router.push('/admin');
      } else {
        // Regular users go to dashboard/home
        router.push('/dashboard/home');
      }
    }
  }, [status, session, router]);

  // Show a simple loading message while we redirect
  return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Redirecting to your dashboard...</p>
      </div>
    </div>
  );
}