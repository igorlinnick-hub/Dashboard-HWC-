/** Data shape for the Square connector */
export interface SquareData {
  totalSales: number;
  transactions: number;
  avgTicket: number;
  topServices: SquareService[];
}

export interface SquareService {
  name: string;
  revenue: number;
  count: number;
}
