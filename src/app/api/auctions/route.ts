// Complete src/app/api/auctions/route.js file
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    
    // Check if user is authenticated and is an agent
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    if (session.user.role !== 'AGENT') {
      return NextResponse.json(
        { error: 'Only agents can create auctions' },
        { status: 403 }
      );
    }
    
    const data = await request.json();
    
    // Validate required fields
    const requiredFields = [
      'title', 'description', 'startingBid', 'currentBid',
      'incrementAmount', 'location', 'category', 'startDate', 'endDate'
    ];
    
    for (const field of requiredFields) {
      if (!data[field]) {
        return NextResponse.json(
          { error: `${field} is required` },
          { status: 400 }
        );
      }
    }
    
    // Validate reserve price is greater than or equal to starting bid
    if (data.reservePrice !== undefined && 
        parseFloat(data.reservePrice) > 0 && 
        parseFloat(data.reservePrice) < parseFloat(data.startingBid)) {
      return NextResponse.json(
        { error: 'Reserve price must be greater than or equal to starting bid' },
        { status: 400 }
      );
    }
    
    // Validate minimum escrow amount
    const minimumEscrow = data.minimumEscrow ? parseFloat(data.minimumEscrow) : 5000; // Default to $5k
    if (minimumEscrow < 1000) {
      return NextResponse.json(
        { error: 'Minimum escrow requirement must be at least $1,000' },
        { status: 400 }
      );
    }
    
    // Create the auction and bid requirement in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create the auction
      const auction = await tx.auction.create({
        data: {
          title: data.title,
          description: data.description,
          startingBid: parseFloat(data.startingBid),
          reservePrice: data.reservePrice !== undefined ? parseFloat(data.reservePrice) : 0,
          currentBid: parseFloat(data.currentBid),
          incrementAmount: parseFloat(data.incrementAmount),
          location: data.location,
          category: data.category,
          images: data.images || [],
          status: data.status || 'UPCOMING',
          featured: data.featured || false,
          startDate: new Date(data.startDate),
          endDate: new Date(data.endDate),
          propertyDetails: data.propertyDetails || {},
          sellerId: session.user.id
        }
      });
      
      // Create the bid requirement with the specified minimum escrow
      const bidRequirement = await tx.bidRequirement.create({
        data: {
          auctionId: auction.id,
          requiredAmount: minimumEscrow
        }
      });
      
      return { auction, bidRequirement };
    });
    
    console.log(`✅ Created auction "${data.title}" with minimum escrow requirement of $${minimumEscrow.toLocaleString()}`);
    
    return NextResponse.json(
      { 
        message: 'Auction created successfully',
        auction: result.auction,
        minimumEscrowSet: minimumEscrow
      }
    );
  } catch (error) {
    console.error('Create auction error:', error);
    
    return NextResponse.json(
      { error: 'Something went wrong while creating the auction' },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  try {
    // Get search params
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const status = searchParams.get('status');
    const featured = searchParams.get('featured') === 'true';
    const hasReserve = searchParams.get('hasReserve');
    
    console.log('🔍 API: Fetching auctions with filters:', {
      category,
      status,
      featured,
      hasReserve
    });
    
    // Build filter object
    const filter = {};
    
    if (category) {
      filter.category = category;
    }
    
    if (status) {
      filter.status = status;
    }
    
    if (featured) {
      filter.featured = featured;
    }
    
    // Add filter for reserve price if requested
    if (hasReserve === 'true') {
      filter.reservePrice = { gt: 0 };
    } else if (hasReserve === 'false') {
      filter.reservePrice = { equals: 0 };
    }
    
    // Get auctions from database WITH BID COUNT and BID REQUIREMENTS
    const auctions = await prisma.auction.findMany({
      where: filter,
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        seller: {
          select: {
            id: true,
            name: true,
            email: true,
            companyName: true
          }
        },
        bidRequirement: {
          select: {
            requiredAmount: true
          }
        },
        _count: {
          select: {
            bids: true  // ✅ This adds the actual bid count from database
          }
        }
      }
    });
    
    console.log(`📊 API: Found ${auctions.length} auctions with bid counts and escrow requirements`);
    
    // Return auctions as-is (let client-side handle status calculation)
    return NextResponse.json({ auctions });
    
  } catch (error) {
    console.error('Get auctions error:', error);
    
    return NextResponse.json(
      { error: 'Something went wrong while fetching auctions' },
      { status: 500 }
    );
  }
}

// Alternative: If you want server-side status calculation, add this function
function calculateAuctionStatus(auction) {
  const now = new Date();
  const startDate = new Date(auction.startDate);
  const endDate = new Date(auction.endDate);
  
  // Don't change CANCELLED status
  if (auction.status === 'CANCELLED') {
    return auction.status;
  }
  
  if (now < startDate) {
    return 'UPCOMING';
  } else if (now >= startDate && now < endDate) {
    return 'LIVE';
  } else {
    return 'ENDED';
  }
}

// If you want to use server-side status calculation, replace the return statement with:
/*
// Calculate current status for each auction
const auctionsWithCalculatedStatus = auctions.map(auction => {
  const calculatedStatus = calculateAuctionStatus(auction);
  
  return {
    ...auction,
    calculatedStatus,
    // Optionally update the status field
    status: calculatedStatus
  };
});

console.log(`📊 API: Returning ${auctionsWithCalculatedStatus.length} auctions with calculated statuses`);

return NextResponse.json({ auctions: auctionsWithCalculatedStatus });
*/