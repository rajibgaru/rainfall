// src/hooks/useRoleProtection.ts
'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export function useRoleProtection(allowedRoles: string[] = ['USER', 'AGENT', 'ADMIN']) {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session) {
      router.push('/login');
      return;
    }
    
    if (!allowedRoles.includes(session.user.role)) {
      if (session.user.role === 'AGENT') {
        router.push('/dashboard/agent');
      } else if (session.user.role === 'ADMIN') {
        router.push('/admin');
      } else {
        router.push('/dashboard');
      }
    }
  }, [session, status, allowedRoles, router]);
  
  return {
    session,
    status,
    isLoading: status === 'loading',
    isAuthenticated: status === 'authenticated',
    isAuthorized: session && allowedRoles.includes(session.user.role),
    user: session?.user
  };
}