// src/app/api/dashboard/recommended/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth'; // Adjust path as needed
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    // Get the user session
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '6');

    // Get user's bidding history to understand preferences
    const userBids = await prisma.bid.findMany({
      where: { bidderId: userId },
      include: {
        auction: {
          select: { category: true, location: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 20, // Look at recent bidding activity
    });

    // Get user's watchlist to understand interests
    const userWatchlist = await prisma.watchlist.findMany({
      where: { userId },
      include: {
        auction: {
          select: { category: true, location: true }
        }
      },
      take: 20,
    });

    // Extract preferred categories and locations
    const preferredCategories = new Set<string>();
    const preferredLocations = new Set<string>();

    [...userBids, ...userWatchlist].forEach(item => {
      if (item.auction.category) {
        preferredCategories.add(item.auction.category);
      }
      if (item.auction.location) {
        preferredLocations.add(item.auction.location);
      }
    });

    // Build recommendation query
    const whereClause: any = {
      status: { in: ['UPCOMING', 'LIVE'] },
      // Exclude auctions user is already watching
      watchlist: {
        none: { userId }
      },
      // Exclude auctions user has already bid on
      bids: {
        none: { bidderId: userId }
      }
    };

    // If user has preferences, use them
    if (preferredCategories.size > 0 || preferredLocations.size > 0) {
      whereClause.OR = [];
      
      if (preferredCategories.size > 0) {
        whereClause.OR.push({
          category: { in: Array.from(preferredCategories) }
        });
      }
      
      if (preferredLocations.size > 0) {
        whereClause.OR.push({
          location: { in: Array.from(preferredLocations) }
        });
      }
    }

    // Get recommended auctions
    let recommendedAuctions = await prisma.auction.findMany({
      where: whereClause,
      orderBy: [
        { featured: 'desc' }, // Featured auctions first
        { startDate: 'asc' }, // Then by start date
      ],
      take: limit,
    });

    // If we don't have enough recommendations based on preferences,
    // fill with other active auctions
    if (recommendedAuctions.length < limit) {
      const additionalAuctions = await prisma.auction.findMany({
        where: {
          status: { in: ['UPCOMING', 'LIVE'] },
          watchlist: {
            none: { userId }
          },
          bids: {
            none: { bidderId: userId }
          },
          // Exclude already selected auctions
          id: {
            notIn: recommendedAuctions.map(a => a.id)
          }
        },
        orderBy: [
          { featured: 'desc' },
          { createdAt: 'desc' },
        ],
        take: limit - recommendedAuctions.length,
      });

      recommendedAuctions = [...recommendedAuctions, ...additionalAuctions];
    }

    return NextResponse.json({
      auctions: recommendedAuctions,
      total: recommendedAuctions.length,
      basedOnPreferences: preferredCategories.size > 0 || preferredLocations.size > 0,
      preferences: {
        categories: Array.from(preferredCategories),
        locations: Array.from(preferredLocations),
      }
    });

  } catch (error) {
    console.error('Error fetching recommended auctions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}