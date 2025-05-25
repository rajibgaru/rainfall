import { NextResponse } from 'next/server';
import { plaidClient, isPlaidSandbox } from '@/lib/plaid';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

interface ACHDepositRequest {
  amount: number;
  accountId: string; // User's bank account ID from our database
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: ACHDepositRequest = await request.json();
    const { amount, accountId } = body;

    console.log('💰 Processing ACH deposit request:', { 
      userId: session.user.id, 
      amount, 
      accountId,
      sandbox: isPlaidSandbox()
    });

    // Validation
    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Valid amount is required' }, { status: 400 });
    }

    if (amount < 100) {
      return NextResponse.json({ error: 'Minimum deposit amount is $100' }, { status: 400 });
    }

    if (amount > 50000) {
      return NextResponse.json({ error: 'Maximum deposit amount is $50,000' }, { status: 400 });
    }

    if (!accountId) {
      return NextResponse.json({ error: 'Bank account selection is required' }, { status: 400 });
    }

    // Get user's linked bank account
    const userBankAccount = await prisma.userBankAccount.findFirst({
      where: {
        id: accountId,
        userId: session.user.id,
        isActive: true,
      },
    });

    if (!userBankAccount) {
      return NextResponse.json({ error: 'Bank account not found or inactive' }, { status: 404 });
    }

    console.log('🏦 Found user bank account:', userBankAccount.accountName);

    // Generate unique reference
    const reference = `ACH-${session.user.id.substring(0, 8)}-${Date.now()}`;

    // In sandbox mode, we'll simulate the transfer
    if (isPlaidSandbox()) {
      console.log('🧪 Sandbox mode: Simulating ACH transfer');
      
      // Create deposit request record
      const depositRequest = await prisma.depositRequest.create({
        data: {
          userId: session.user.id,
          bankAccountId: userBankAccount.id,
          amount: amount,
          method: 'ACH',
          status: 'PROCESSING',
          reference: reference,
          // In sandbox, we don't have a real transfer ID
          plaidTransferId: `sandbox_${reference}`,
        },
      });

      // In sandbox, we'll auto-complete after a short delay
      // In real implementation, this would be handled by Plaid webhooks
      setTimeout(async () => {
        try {
          await simulateACHCompletion(depositRequest.id);
        } catch (error) {
          console.error('Error simulating ACH completion:', error);
        }
      }, 5000); // Simulate 5-second processing time

      return NextResponse.json({
        success: true,
        transferId: depositRequest.plaidTransferId,
        status: 'PROCESSING',
        reference: reference,
        message: 'ACH transfer initiated successfully',
        sandbox: true,
        estimatedCompletion: '5 seconds (sandbox simulation)',
      });
    }

    // Production mode - Real Plaid Transfer
    try {
      const transferResponse = await plaidClient.transferCreate({
        access_token: userBankAccount.plaidAccessToken,
        account_id: userBankAccount.accountId,
        amount: amount.toString(),
        description: `Escrow deposit - ${session.user.name}`,
        type: 'debit', // Take money from user's account
        network: 'same-day-ach', // Faster processing
        ach_class: 'ppd',
        user: {
          legal_name: session.user.name || 'Account Holder',
        },
      });

      console.log('✅ Plaid transfer created:', transferResponse.data.transfer.id);

      // Store transfer request in database
      const depositRequest = await prisma.depositRequest.create({
        data: {
          userId: session.user.id,
          bankAccountId: userBankAccount.id,
          amount: amount,
          method: 'ACH',
          status: 'PROCESSING',
          reference: reference,
          plaidTransferId: transferResponse.data.transfer.id,
        },
      });

      return NextResponse.json({
        success: true,
        transferId: transferResponse.data.transfer.id,
        status: transferResponse.data.transfer.status,
        reference: reference,
        message: 'ACH transfer initiated successfully',
        estimatedCompletion: '1-3 business days',
      });

    } catch (plaidError: any) {
      console.error('❌ Plaid transfer error:', plaidError.response?.data || plaidError.message);
      
      // Store failed request
      await prisma.depositRequest.create({
        data: {
          userId: session.user.id,
          bankAccountId: userBankAccount.id,
          amount: amount,
          method: 'ACH',
          status: 'FAILED',
          reference: reference,
          errorMessage: plaidError.response?.data?.error_message || plaidError.message,
        },
      });

      return NextResponse.json({
        error: 'Failed to initiate ACH transfer',
        details: isPlaidSandbox() ? plaidError.response?.data || plaidError.message : 'Please try again or contact support',
      }, { status: 500 });
    }

  } catch (error: any) {
    console.error('❌ ACH deposit error:', error);
    return NextResponse.json({
      error: 'Failed to process deposit request',
      details: isPlaidSandbox() ? error.message : 'Internal server error',
    }, { status: 500 });
  }
}

// Sandbox simulation function
async function simulateACHCompletion(depositRequestId: string) {
  try {
    console.log('🎭 Simulating ACH completion for:', depositRequestId);
    
    const depositRequest = await prisma.depositRequest.findUnique({
      where: { id: depositRequestId },
      include: { user: true },
    });

    if (!depositRequest) return;

    // Update deposit request to completed
    await prisma.depositRequest.update({
      where: { id: depositRequestId },
      data: {
        status: 'COMPLETED',
        processedAt: new Date(),
      },
    });

    // Add funds to user's escrow wallet
    const { EscrowWalletService } = await import('@/lib/services/escrowWallet');
    const escrowService = new EscrowWalletService();
    
    await escrowService.processDeposit(
      depositRequest.userId,
      depositRequest.amount,
      depositRequest.reference,
      'PLAID_AUTO',
      'ACH transfer completed (sandbox simulation)'
    );

    console.log('✅ Sandbox ACH completion simulated successfully');

  } catch (error) {
    console.error('❌ Error simulating ACH completion:', error);
  }
}