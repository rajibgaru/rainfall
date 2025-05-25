import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');

    const deposits = await prisma.depositRequest.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        bankAccount: {
          select: {
            accountName: true,
            mask: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    });

    return NextResponse.json({
      success: true,
      deposits: deposits.map(deposit => ({
        id: deposit.id,
        amount: deposit.amount,
        method: deposit.method,
        status: deposit.status,
        reference: deposit.reference,
        createdAt: deposit.createdAt,
        processedAt: deposit.processedAt,
        errorMessage: deposit.errorMessage,
        bankAccount: deposit.bankAccount,
      })),
    });

  } catch (error: any) {
    console.error('Error fetching deposit requests:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch deposit requests' 
    }, { status: 500 });
  }
}