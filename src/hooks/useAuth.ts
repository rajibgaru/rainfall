// src/hooks/useAuth.ts
'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export function useAuth(options = {}) {
  const { required = false, adminOnly = false } = options;
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const isLoading = status === 'loading';
  const isAuthenticated = status === 'authenticated';
  const isAdmin = session?.user?.role === 'ADMIN';
  
  useEffect(() => {
    if (!isLoading) {
      if (required && !isAuthenticated) {
        router.push('/login');
      } else if (adminOnly && (!isAuthenticated || !isAdmin)) {
        router.push('/');
      }
    }
  }, [isLoading, isAuthenticated, isAdmin, required, adminOnly, router]);
  
  return {
    session,
    status,
    isLoading,
    isAuthenticated,
    isAdmin,
    user: session?.user
  };
}