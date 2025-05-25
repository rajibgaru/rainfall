import { NextResponse } from 'next/server';
import { plaidClient, isPlaidSandbox } from '@/lib/plaid';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🔗 Creating Plaid Link token for user:', session.user.id);
    console.log('🧪 Sandbox mode:', isPlaidSandbox());

    const linkTokenRequest = {
      user: {
        client_user_id: session.user.id,
      },
      client_name: 'BargainAuctions Escrow',
      products: ['transactions', 'auth'],
      country_codes: ['US'],
      language: 'en',
      // Add webhook URL for production
      webhook: process.env.PLAID_WEBHOOK_URL,
    };

    // Add Transfer product if available
    if (process.env.PLAID_TRANSFER_ENABLED === 'true') {
      linkTokenRequest.products.push('transfer');
    }

    const createTokenResponse = await plaidClient.linkTokenCreate(linkTokenRequest);
    
    console.log('✅ Link token created successfully');
    
    return NextResponse.json({
      link_token: createTokenResponse.data.link_token,
      expiration: createTokenResponse.data.expiration,
    });

  } catch (error) {
    console.error('❌ Error creating link token:', error.response?.data || error.message);
    
    return NextResponse.json({ 
      error: 'Failed to create link token',
      details: isPlaidSandbox() ? error.response?.data || error.message : 'Please try again'
    }, { status: 500 });
  }
}