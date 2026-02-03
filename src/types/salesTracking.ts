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

export interface DailyAppointmentStats {
  date: string;
  due: number;
  showed: number;
  showRate: number;
  closed: number;
  apptToCloseRate: number;
  showToCloseRate: number;
}

export interface AppointmentData {
  totalDue: number;
  totalShowed: number;
  totalClosed: number;
  totalNoShows: number;
  avgShowRate: number;
  avgCloseRate: number;
  avgShowToCloseRate: number;
  dailyStats: DailyAppointmentStats[];
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
