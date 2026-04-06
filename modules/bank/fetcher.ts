import type { BankData } from './types';

/** Fetch bank data from Plaid API */
export async function fetchData(): Promise<BankData> {
  // TODO: read PLAID_CLIENT_ID + PLAID_SECRET from process.env
  // TODO: call Plaid /transactions/get and /accounts/balance/get
  // Returns mock data for now
  return {
    balance: 24500,
    deposits: 12300,
    withdrawals: 4100,
    cashFlow: 8200,
    transactions: [],
  };
}
