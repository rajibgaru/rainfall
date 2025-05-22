// src/components/AuthStatus.tsx
'use client';

import { useSession } from 'next-auth/react';
import Link from 'next/link';

export default function AuthStatus() {
  const { data: session, status } = useSession();
  
  if (status === 'loading') {
    return <div className="animate-pulse h-4 bg-gray-200 rounded w-20"></div>;
  }
  
  if (status === 'authenticated') {
    return (
      <div className="flex items-center">
        <span className="mr-2">
          Signed in as <strong>{session.user.name}</strong>
        </span>
        <Link
          href="/dashboard"
          className="bg-blue-600 text-white px-3 py-1 rounded-md text-sm hover:bg-blue-700"
        >
          Dashboard
        </Link>
      </div>
    );
  }
  
  return (
    <div className="flex items-center space-x-2">
      <Link
        href="/login"
        className="text-blue-600 hover:text-blue-800"
      >
        Sign In
      </Link>
      <Link
        href="/register"
        className="bg-blue-600 text-white px-3 py-1 rounded-md text-sm hover:bg-blue-700"
      >
        Register
      </Link>
    </div>
  );
}