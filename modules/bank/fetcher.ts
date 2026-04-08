import {
  Configuration,
  PlaidApi,
  PlaidEnvironments,
  Products,
  CountryCode,
} from 'plaid';
import type { BankData, BankDailyRow, BankCategoryRow } from './types';

/** Determine Plaid environment from env var, default to sandbox */
function getPlaidEnv(): string {
  const env = process.env.PLAID_ENV ?? 'sandbox';
  if (env === 'production') return PlaidEnvironments.production;
  if (env === 'development') return PlaidEnvironments.development;
  return PlaidEnvironments.sandbox;
}

function getPlaidClient(): PlaidApi {
  const config = new Configuration({
    basePath: getPlaidEnv(),
    baseOptions: {
      headers: {
        'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID ?? '',
        'PLAID-SECRET': process.env.PLAID_SECRET ?? '',
      },
    },
  });
  return new PlaidApi(config);
}

/**
 * Create a Plaid Link token for the client-side Plaid Link flow.
 * Called from /api/plaid/link-token route.
 */
export async function createLinkToken(clientUserId: string): Promise<string> {
  const client = getPlaidClient();
  const response = await client.linkTokenCreate({
    user: { client_user_id: clientUserId },
    client_name: 'Wellness BI Dashboard',
    products: [Products.Transactions],
    country_codes: [CountryCode.Us],
    language: 'en',
  });
  return response.data.link_token;
}

/**
 * Exchange a public_token from Plaid Link for an access_token.
 * Called from /api/plaid/exchange route.
 */
export async function exchangePublicToken(publicToken: string): Promise<string> {
  const client = getPlaidClient();
  const response = await client.itemPublicTokenExchange({
    public_token: publicToken,
  });
  return response.data.access_token;
}

/**
 * Fetch bank data using a stored access_token.
 * @param accessToken — stored in connector_credentials.api_key
 * @param from — YYYY-MM-DD
 * @param to — YYYY-MM-DD
 */
export async function fetchData(
  accessToken: string,
  from: string,
  to: string
): Promise<BankData> {
  const client = getPlaidClient();

  // Fetch balance and transactions in parallel
  const [balanceRes, txRes] = await Promise.all([
    client.accountsBalanceGet({ access_token: accessToken }),
    client.transactionsGet({
      access_token: accessToken,
      start_date: from,
      end_date: to,
      options: { count: 500, offset: 0 },
    }),
  ]);

  // --- Balance ---
  const accounts = balanceRes.data.accounts;
  let currentBalance = 0;
  let availableBalance = 0;
  for (const acct of accounts) {
    currentBalance += acct.balances.current ?? 0;
    availableBalance += acct.balances.available ?? acct.balances.current ?? 0;
  }

  // --- Transactions ---
  let allTransactions = txRes.data.transactions;
  const totalTx = txRes.data.total_transactions;

  // Paginate if more than 500
  while (allTransactions.length < totalTx) {
    const more = await client.transactionsGet({
      access_token: accessToken,
      start_date: from,
      end_date: to,
      options: { count: 500, offset: allTransactions.length },
    });
    allTransactions = allTransactions.concat(more.data.transactions);
  }

  let deposits = 0;
  let withdrawals = 0;
  const dailyMap = new Map<string, number>();
  const categoryMap = new Map<string, number>();

  for (const tx of allTransactions) {
    if (tx.pending) continue;

    // Plaid amounts: positive = debit (money out), negative = credit (money in)
    const amount = tx.amount;
    if (amount < 0) {
      deposits += Math.abs(amount);
    } else {
      withdrawals += amount;
    }

    // Daily net flow
    const day = tx.date;
    dailyMap.set(day, (dailyMap.get(day) ?? 0) - amount); // negate: positive = inflow

    // Category spending (only debits)
    if (amount > 0) {
      const cat = tx.personal_finance_category?.primary ?? tx.category?.[0] ?? 'Other';
      categoryMap.set(cat, (categoryMap.get(cat) ?? 0) + amount);
    }
  }

  const transactionCount = allTransactions.filter((t) => !t.pending).length;
  const cashFlow = deposits - withdrawals;

  const dailyBalance: BankDailyRow[] = Array.from(dailyMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, amount]) => ({ date, amount }));

  const categorySpending: BankCategoryRow[] = Array.from(categoryMap.entries())
    .sort(([, a], [, b]) => b - a)
    .slice(0, 7)
    .map(([category, amount]) => ({ category, amount }));

  return {
    currentBalance,
    availableBalance,
    deposits,
    withdrawals,
    cashFlow,
    transactionCount,
    dailyBalance,
    categorySpending,
  };
}
