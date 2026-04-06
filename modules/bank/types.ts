/** Data shape for the Bank (Plaid) connector */
export interface BankData {
  balance: number;
  deposits: number;
  withdrawals: number;
  cashFlow: number;
  transactions: BankTransaction[];
}

export interface BankTransaction {
  id: string;
  date: string;
  amount: number;
  name: string;
  category: string;
  pending: boolean;
}
