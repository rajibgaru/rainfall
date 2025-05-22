// src/app/api/user/profile/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 401 }
      );
    }
    
    // Get the full user profile from the database
    const user = await prisma.user.findUnique({
      where: {
        id: session.user.id
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        avatar: true,
        role: true,
        companyName: true,
        licenseNumber: true,
        licenseState: true,
        licenseExpiry: true,
        businessAddress: true,
        businessPhone: true,
        website: true,
        bio: true,
        isVerified: true,
        specialties: true
      }
    });
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' }, 
        { status: 404 }
      );
    }
    
    // Serialize dates for JSON
    const serializedUser = {
      ...user,
      licenseExpiry: user.licenseExpiry ? user.licenseExpiry.toISOString() : null
    };
    
    return NextResponse.json({ user: serializedUser });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user profile' }, 
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 401 }
      );
    }
    
    const data = await request.json();
    
    // Update the user profile
    const updatedUser = await prisma.user.update({
      where: {
        id: session.user.id
      },
      data: {
        // Only update fields that are explicitly included in the request
        ...(data.name !== undefined && { name: data.name }),
        ...(data.phone !== undefined && { phone: data.phone }),
        ...(data.avatar !== undefined && { avatar: data.avatar }),
        ...(data.companyName !== undefined && { companyName: data.companyName }),
        ...(data.licenseNumber !== undefined && { licenseNumber: data.licenseNumber }),
        ...(data.licenseState !== undefined && { licenseState: data.licenseState }),
        ...(data.businessAddress !== undefined && { businessAddress: data.businessAddress }),
        ...(data.businessPhone !== undefined && { businessPhone: data.businessPhone }),
        ...(data.website !== undefined && { website: data.website || null }),
        ...(data.bio !== undefined && { bio: data.bio || null })
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        avatar: true,
        role: true,
        companyName: true,
        licenseNumber: true,
        licenseState: true,
        licenseExpiry: true,
        businessAddress: true,
        businessPhone: true,
        website: true,
        bio: true,
        isVerified: true,
        specialties: true
      }
    });
    
    // Serialize dates for JSON
    const serializedUser = {
      ...updatedUser,
      licenseExpiry: updatedUser.licenseExpiry ? updatedUser.licenseExpiry.toISOString() : null
    };
    
    return NextResponse.json({
      message: 'Profile updated successfully',
      user: serializedUser
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json(
      { error: 'Failed to update profile' }, 
      { status: 500 }
    );
  }
}