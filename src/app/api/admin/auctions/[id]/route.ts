// src/app/api/admin/auctions/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('Delete auction request for ID:', params.id)
    
    // Check if user is authenticated and has admin role
    const session = await getServerSession(authOptions)
    
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const auctionId = params.id

    // First, check if auction exists and get auction details
    const auction = await prisma.auction.findUnique({
      where: { id: auctionId },
      include: {
        _count: {
          select: { 
            bids: true,
            watchlist: true 
          }
        },
        seller: {
          select: {
            name: true,
            email: true
          }
        }
      }
    })

    if (!auction) {
      return NextResponse.json(
        { error: 'Auction not found' },
        { status: 404 }
      )
    }

    console.log(`Auction "${auction.title}" has ${auction._count.bids} bids and ${auction._count.watchlist} watchers`)

    // Business rule: Prevent deletion if auction has bids and is LIVE or ENDED
    if (auction._count.bids > 0 && (auction.status === 'LIVE' || auction.status === 'ENDED')) {
      return NextResponse.json(
        { 
          error: 'Cannot delete auction with existing bids. Please cancel the auction instead.',
          details: {
            bidCount: auction._count.bids,
            status: auction.status,
            title: auction.title
          }
        },
        { status: 400 }
      )
    }

    // If auction has bids but is UPCOMING or CANCELLED, warn but allow deletion
    if (auction._count.bids > 0) {
      console.log(`Warning: Deleting ${auction.status} auction with ${auction._count.bids} bids`)
    }

    // Delete in the correct order due to foreign key constraints
    console.log('Deleting related records...')

    // 1. Delete watchlist entries
    if (auction._count.watchlist > 0) {
      await prisma.watchlist.deleteMany({
        where: { auctionId: auctionId }
      })
      console.log(`Deleted ${auction._count.watchlist} watchlist entries`)
    }

    // 2. Delete bids
    if (auction._count.bids > 0) {
      await prisma.bid.deleteMany({
        where: { auctionId: auctionId }
      })
      console.log(`Deleted ${auction._count.bids} bids`)
    }

    // 3. Delete notifications related to this auction (if you have them)
    const deletedNotifications = await prisma.notification.deleteMany({
      where: {
        OR: [
          { message: { contains: auctionId } },
          { title: { contains: auction.title } }
        ]
      }
    })
    console.log(`Deleted ${deletedNotifications.count} related notifications`)

    // 4. Finally, delete the auction
    await prisma.auction.delete({
      where: { id: auctionId }
    })

    // Log the deletion for audit purposes
    console.log(`✅ Auction "${auction.title}" (ID: ${auctionId}) deleted by admin ${session.user.email}`)
    console.log(`   - Seller: ${auction.seller.name} (${auction.seller.email})`)
    console.log(`   - Status: ${auction.status}`)
    console.log(`   - Bids removed: ${auction._count.bids}`)
    console.log(`   - Watchlist entries removed: ${auction._count.watchlist}`)

    return NextResponse.json({ 
      success: true,
      message: `Auction "${auction.title}" deleted successfully`,
      details: {
        auctionTitle: auction.title,
        bidsRemoved: auction._count.bids,
        watchlistRemoved: auction._count.watchlist,
        notificationsRemoved: deletedNotifications.count
      }
    })

  } catch (error) {
    console.error('Error deleting auction:', error)
    
    // Handle specific Prisma errors
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Auction not found' },
        { status: 404 }
      )
    }

    if (error.code === 'P2003') {
      return NextResponse.json(
        { error: 'Cannot delete auction due to existing references. Please contact support.' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

// Optional: GET method to view auction details before deletion
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const auction = await prisma.auction.findUnique({
      where: { id: params.id },
      include: {
        seller: {
          select: {
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
      }
    })

    if (!auction) {
      return NextResponse.json(
        { error: 'Auction not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(auction)

  } catch (error) {
    console.error('Error fetching auction details:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}