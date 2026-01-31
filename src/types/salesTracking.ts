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
  appointments: number;
  costPerLead: number;
  costPerAppointment: number;
  leadToApptRate: number;
}

export interface AdsData {
  totalSpend: number;
  totalLeads: number;
  totalAppointments: number;
  avgCostPerLead: number;
  avgCostPerAppointment: number;
  dailyStats: DailyAdsStats[];
}

export interface CombinedAdsMetrics {
  totalSpend: number;
  totalLeads: number;
  totalAppointments: number;
  avgCostPerLead: number;
  avgCostPerAppointment: number;
  costPerSale: number;
  leadToApptRate: number;
  apptToSaleRate: number;
  leadToSaleRate: number;
  roas: number;
  revenuePerLead: number;
  profit: number;
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
