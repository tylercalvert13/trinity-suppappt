export interface Submission {
  date: string;
  agent: string;
  clientName: string;
  state: string;
  previousCarrier: string;
  newCarrier: string;
  premium: number;
  status: string;
  commission: number;
}

export interface AgentStats {
  name: string;
  sales: number;
  premium: number;
  commission: number;
  approved: number;
}

export interface DailyStats {
  date: string;
  approved: number;
  pending: number;
  denied: number;
  total: number;
}

export interface CarrierStats {
  name: string;
  count: number;
  premium: number;
}

export interface DashboardData {
  totalSales: number;
  approved: number;
  pending: number;
  denied: number;
  totalPremium: number;
  totalCommission: number;
  pendingPremium: number;
  avgCommission: number;
  dailyStats: DailyStats[];
  agentStats: AgentStats[];
  carrierStats: CarrierStats[];
  recentSubmissions: Submission[];
}
