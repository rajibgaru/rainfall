// Create/Fix src/app/api/auctions/[id]/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isValidObjectId } from '@/lib/objectId';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params; // ✅ Await params for Next.js 15
    
    console.log('🔍 API: Fetching auction with ID:', id);
    
    // Validate ObjectId format (if using MongoDB)
    if (!isValidObjectId(id)) {
      console.log('❌ Invalid ObjectId format:', id);
      return NextResponse.json(
        { error: 'Invalid auction ID format' },
        { status: 400 }
      );
    }

    const auction = await prisma.auction.findUnique({
      where: { id },
      include: {
        seller: {
          select: {
            id: true,
            name: true,
            email: true,
            companyName: true,
            phone: true,
            avatar: true
          }
        },
        bids: {
          take: 5,
          orderBy: { createdAt: 'desc' },
          include: {
            bidder: {
              select: {
                name: true,
                avatar: true
              }
            }
          }
        }
      }
    });

    if (!auction) {
      console.log('❌ Auction not found:', id);
      return NextResponse.json(
        { error: 'Auction not found' },
        { status: 404 }
      );
    }

    console.log('✅ Found auction:', auction.title);
    return NextResponse.json({ auction });
    
  } catch (error) {
    console.error('❌ Error fetching auction:', error);
    return NextResponse.json(
      { error: 'Failed to fetch auction' },
      { status: 500 }
    );
  }
}

// If you need to update auction details
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const data = await request.json();
    
    if (!isValidObjectId(id)) {
      return NextResponse.json(
        { error: 'Invalid auction ID format' },
        { status: 400 }
      );
    }

    const auction = await prisma.auction.update({
      where: { id },
      data,
      include: {
        seller: {
          select: {
            id: true,
            name: true,
            email: true,
            companyName: true
          }
        }
      }
    });

    return NextResponse.json({ auction });
    
  } catch (error) {
    console.error('Error updating auction:', error);
    return NextResponse.json(
      { error: 'Failed to update auction' },
      { status: 500 }
    );
  }
}