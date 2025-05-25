import { Configuration, PlaidApi, PlaidEnvironments } from 'plaid';

const configuration = new Configuration({
  basePath: PlaidEnvironments[process.env.PLAID_ENV || 'sandbox'],
  baseOptions: {
    headers: {
      'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID,
      'PLAID-SECRET': process.env.PLAID_SECRET,
    },
  },
});

export const plaidClient = new PlaidApi(configuration);

// Helper function to check if we're in sandbox
export const isPlaidSandbox = () => process.env.PLAID_ENV === 'sandbox';

// Sandbox test credentials (for testing)
export const SANDBOX_CREDENTIALS = {
  // These are Plaid's official test credentials
  goodAuth: {
    username: 'user_good',
    password: 'pass_good'
  },
  customAuth: {
    username: 'custom_user',
    password: 'custom_pass'
  }
};