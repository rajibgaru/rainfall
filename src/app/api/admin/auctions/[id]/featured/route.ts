// src/app/api/admin/auctions/[id]/featured/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'

export async function PATCH(
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

    const { featured } = await request.json()
    const auctionId = params.id

    // Update auction featured status in database
    const updatedAuction = await prisma.auction.update({
      where: { id: auctionId },
      data: { 
        featured: featured,
        updatedAt: new Date()
      }
    })

    // Log the featured change for audit purposes
    console.log(`Auction ${auctionId} featured status changed to ${featured} by admin ${session.user.email}`)

    return NextResponse.json({ 
      success: true, 
      featured: updatedAuction.featured 
    })

  } catch (error) {
    console.error('Error updating auction featured status:', error)
    
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Auction not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// src/app/api/admin/auctions/[id]/route.ts
// This endpoint handles auction deletion
export async function DELETE(
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

    const auctionId = params.id

    // Check if auction has bids (might want to prevent deletion if it does)
    const auction = await prisma.auction.findUnique({
      where: { id: auctionId },
      include: {
        _count: {
          select: { bids: true }
        }
      }
    })

    if (!auction) {
      return NextResponse.json(
        { error: 'Auction not found' },
        { status: 404 }
      )
    }

    // Optional: Prevent deletion if auction has bids
    if (auction._count.bids > 0) {
      return NextResponse.json(
        { error: 'Cannot delete auction with existing bids. Cancel the auction instead.' },
        { status: 400 }
      )
    }

    // Delete related records first (due to foreign key constraints)
    await prisma.watchlist.deleteMany({
      where: { auctionId: auctionId }
    })

    await prisma.bid.deleteMany({
      where: { auctionId: auctionId }
    })

    // Delete the auction
    await prisma.auction.delete({
      where: { id: auctionId }
    })

    // Log the deletion for audit purposes
    console.log(`Auction ${auctionId} deleted by admin ${session.user.email}`)

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error deleting auction:', error)
    
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Auction not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}