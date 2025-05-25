// src/app/api/admin/auctions/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    console.log('Checking authentication...')
    
    // Check if user is authenticated and has admin role
    const session = await getServerSession(authOptions)
    
    console.log('Session:', JSON.stringify(session, null, 2))
    
    if (!session) {
      console.log('No session found')
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    if (!session.user) {
      console.log('No user in session')
      return NextResponse.json(
        { error: 'No user information' },
        { status: 401 }
      )
    }

    console.log('User role:', session.user.role)

    if (session.user.role !== 'ADMIN') {
      console.log('User is not admin, role:', session.user.role)
      return NextResponse.json(
        { error: `Access denied. Admin privileges required. Current role: ${session.user.role}` },
        { status: 403 }
      )
    }

    console.log('Authentication successful, fetching auctions...')

    // Fetch real auction data from database
    const auctions = await prisma.auction.findMany({
      include: {
        seller: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        },
        _count: {
          select: {
            bids: true,
            watchlist: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    console.log(`Found ${auctions.length} auctions`)
    return NextResponse.json(auctions)

  } catch (error) {
    console.error('Error in auctions API:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}