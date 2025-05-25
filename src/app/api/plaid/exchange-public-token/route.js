import { NextResponse } from 'next/server';
import { plaidClient, isPlaidSandbox } from '@/lib/plaid';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { public_token, metadata } = await request.json();
    
    console.log('🔄 Exchanging public token for user:', session.user.id);
    console.log('🏦 Selected accounts:', metadata.accounts.length);

    // Exchange public token for access token
    const tokenResponse = await plaidClient.itemPublicTokenExchange({
      public_token,
    });

    const accessToken = tokenResponse.data.access_token;
    const itemId = tokenResponse.data.item_id;

    console.log('✅ Token exchange successful');

    // Get account details
    const accountsResponse = await plaidClient.accountsGet({
      access_token: accessToken,
    });

    console.log('📊 Retrieved account details:', accountsResponse.data.accounts.length, 'accounts');

    // Store each selected account
    const savedAccounts = [];
    
    for (const selectedAccount of metadata.accounts) {
      const accountDetails = accountsResponse.data.accounts.find(
        acc => acc.account_id === selectedAccount.id
      );

      if (accountDetails) {
        const savedAccount = await prisma.userBankAccount.create({
          data: {
            userId: session.user.id,
            plaidAccessToken: accessToken, // TODO: Encrypt this in production
            plaidItemId: itemId,
            accountId: accountDetails.account_id,
            accountName: accountDetails.name,
            accountType: accountDetails.type,
            accountSubtype: accountDetails.subtype,
            mask: accountDetails.mask,
          },
        });

        savedAccounts.push(savedAccount);
        console.log('💾 Saved account:', accountDetails.name, '****' + accountDetails.mask);
      }
    }

    return NextResponse.json({ 
      success: true,
      accounts: savedAccounts.length,
      message: `Successfully linked ${savedAccounts.length} account(s)`
    });

  } catch (error) {
    console.error('❌ Token exchange error:', error.response?.data || error.message);
    
    return NextResponse.json({ 
      error: 'Failed to link bank account',
      details: isPlaidSandbox() ? error.response?.data || error.message : 'Please try again'
    }, { status: 500 });
  }
}