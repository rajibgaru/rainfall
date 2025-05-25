import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const accounts = await prisma.userBankAccount.findMany({
      where: {
        userId: session.user.id,
        isActive: true,
      },
      select: {
        id: true,
        accountId: true,
        accountName: true,
        accountType: true,
        accountSubtype: true,
        mask: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({
      success: true,
      accounts,
    });

  } catch (error) {
    console.error('Error fetching bank accounts:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch bank accounts' 
    }, { status: 500 });
  }
}