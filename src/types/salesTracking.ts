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

export interface DailyAdsStats {
  date: string;
  spend: number;
  leads: number;
  costPerLead: number;
}

export interface AdsData {
  totalSpend: number;
  totalLeads: number;
  avgCostPerLead: number;
  dailyStats: DailyAdsStats[];
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

export interface AgentLeaderboardStats {
  name: string;
  rank: number;
  totalApps: number;
  approved: number;
  pending: number;
  declined: number;
  approvalRate: number;
  todayApps: number;
}

export interface RecentActivity {
  id: string;
  agent: string;
  action: string;
  timestamp: string;
  type: "approved" | "submitted";
}
