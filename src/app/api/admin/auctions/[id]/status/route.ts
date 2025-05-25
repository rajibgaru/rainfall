// src/app/api/admin/auctions/[id]/status/route.ts
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

    const { status } = await request.json()
    const auctionId = params.id

    // Validate status
    const validStatuses = ['UPCOMING', 'LIVE', 'ENDED', 'CANCELLED']
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      )
    }

    // Update auction status in database
    const updatedAuction = await prisma.auction.update({
      where: { id: auctionId },
      data: { 
        status: status,
        updatedAt: new Date()
      },
      include: {
        seller: {
          select: {
            name: true,
            email: true
          }
        }
      }
    })

    // Log the status change for audit purposes
    console.log(`Auction ${auctionId} status changed to ${status} by admin ${session.user.email}`)

    return NextResponse.json({ 
      success: true, 
      auction: updatedAuction 
    })

  } catch (error) {
    console.error('Error updating auction status:', error)
    
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