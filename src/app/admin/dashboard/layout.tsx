// src/app/admin/dashboard/layout.tsx
'use client'

import AdminNavigation from '@/components/admin/AdminNavigation'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'loading') return // Still loading

    if (!session || session.user?.role !== 'ADMIN') {
      router.push('/admin/login')
      return
    }
  }, [session, status, router])

  // Hide main site header in admin area
  useEffect(() => {
    // Hide the main site header when in admin
    const mainHeader = document.querySelector('header:not([data-admin-header])')
    const mainNav = document.querySelector('nav:not([data-admin-nav])')
    
    if (mainHeader) {
      mainHeader.style.display = 'none'
    }
    if (mainNav) {
      mainNav.style.display = 'none'
    }

    // Cleanup: Show header when leaving admin area
    return () => {
      if (mainHeader) {
        mainHeader.style.display = ''
      }
      if (mainNav) {
        mainNav.style.display = ''
      }
    }
  }, [])

  // Show loading while checking authentication
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // Don't render if not authenticated
  if (!session || session.user?.role !== 'ADMIN') {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNavigation />
      
      {/* Main content */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  )
}