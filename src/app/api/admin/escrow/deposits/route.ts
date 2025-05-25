import { EscrowWalletService } from '@/lib/services/escrowWallet';
import { getServerSession } from 'next-auth/next';
// Update this import path to match your NextAuth config
import { authOptions } from "@/lib/auth";
import { NextResponse } from 'next/server';

const escrowService = new EscrowWalletService();

export async function POST(request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const adminId = session.user.id;
    const body = await request.json();
    const { userId, amount, reference, description } = body;

    // Validation
    if (!userId || !amount || !reference) {
      return NextResponse.json({ 
        error: 'User ID, amount, and reference are required' 
      }, { status: 400 });
    }

    if (amount <= 0) {
      return NextResponse.json({ error: 'Amount must be positive' }, { status: 400 });
    }

    // Process deposit
    const result = await escrowService.processDeposit(
      userId,
      parseFloat(amount),
      reference,
      adminId,
      description
    );

    return NextResponse.json({
      success: true,
      message: 'Deposit processed successfully',
      data: {
        transaction: {
          id: result.transaction.id,
          amount: result.transaction.amount,
          reference: result.transaction.reference,
          description: result.transaction.description,
          processedAt: result.transaction.processedAt
        },
        wallet: {
          id: result.wallet.id,
          balance: result.wallet.balance,
          frozenAmount: result.wallet.frozenAmount
        }
      }
    });
  } catch (error) {
    console.error('Process deposit error:', error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}