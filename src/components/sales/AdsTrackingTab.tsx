import { DollarSign, Users, TrendingUp, Target, Percent } from "lucide-react";
import { StatCard } from "./StatCard";
import { AdsPerformanceChart } from "./AdsPerformanceChart";
import { AdsFunnelChart } from "./AdsFunnelChart";
import { DailyAdsTable } from "./DailyAdsTable";
import type { AdsData, DashboardData } from "@/types/salesTracking";

interface AdsTrackingTabProps {
  adsData: AdsData | null;
  salesData: DashboardData | null;
  loading: boolean;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

export function AdsTrackingTab({ adsData, salesData, loading }: AdsTrackingTabProps) {
  const approvedSales = salesData?.approved ?? 0;
  const totalCommission = salesData?.totalCommission ?? 0;

  const totalSpend = adsData?.totalSpend ?? 0;
  const totalLeads = adsData?.totalLeads ?? 0;

  // Calculated metrics
  const costPerSale = approvedSales > 0 ? totalSpend / approvedSales : 0;
  const roas = totalSpend > 0 ? totalCommission / totalSpend : 0;
  const profit = totalCommission - totalSpend;
  const avgCostPerLead = adsData?.avgCostPerLead ?? 0;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Row 1: Primary KPIs */}
      <div className="flex gap-3 overflow-x-auto pb-2 sm:pb-0 sm:grid sm:grid-cols-3 sm:gap-4 sm:overflow-visible -mx-3 px-3 sm:mx-0 sm:px-0">
        <div className="min-w-[140px] sm:min-w-0 flex-shrink-0 sm:flex-shrink">
          <StatCard
            title="Total Spend"
            value={loading ? null : formatCurrency(totalSpend)}
            icon={<DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-red-500" />}
            subtitle="Ad investment"
            loading={loading}
          />
        </div>
        <div className="min-w-[140px] sm:min-w-0 flex-shrink-0 sm:flex-shrink">
          <StatCard
            title="Total Leads"
            value={loading ? null : totalLeads}
            icon={<Users className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500" />}
            subtitle="From ads"
            loading={loading}
          />
        </div>
        <div className="min-w-[140px] sm:min-w-0 flex-shrink-0 sm:flex-shrink">
          <StatCard
            title="Approved Sales"
            value={loading ? null : approvedSales}
            icon={<TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" />}
            subtitle="Closed deals"
            loading={loading}
          />
        </div>
      </div>

      {/* Row 2: Performance KPIs */}
      <div className="flex gap-3 overflow-x-auto pb-2 sm:pb-0 sm:grid sm:grid-cols-4 sm:gap-4 sm:overflow-visible -mx-3 px-3 sm:mx-0 sm:px-0">
        <div className="min-w-[140px] sm:min-w-0 flex-shrink-0 sm:flex-shrink">
          <StatCard
            title="Cost Per Lead"
            value={loading ? null : formatCurrency(avgCostPerLead)}
            icon={<Target className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500" />}
            subtitle="Avg acquisition"
            loading={loading}
          />
        </div>
        <div className="min-w-[140px] sm:min-w-0 flex-shrink-0 sm:flex-shrink">
          <StatCard
            title="Cost Per Sale"
            value={loading ? null : formatCurrency(costPerSale)}
            icon={<DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-orange-500" />}
            subtitle="Per closed deal"
            loading={loading}
          />
        </div>
        <div className="min-w-[140px] sm:min-w-0 flex-shrink-0 sm:flex-shrink">
          <StatCard
            title="ROAS"
            value={loading ? null : `${roas.toFixed(2)}x`}
            icon={<Percent className="h-4 w-4 sm:h-5 sm:w-5 text-purple-500" />}
            subtitle="Return on ad spend"
            loading={loading}
          />
        </div>
        <div className="min-w-[140px] sm:min-w-0 flex-shrink-0 sm:flex-shrink">
          <StatCard
            title="Profit"
            value={loading ? null : formatCurrency(profit)}
            icon={<TrendingUp className={`h-4 w-4 sm:h-5 sm:w-5 ${profit >= 0 ? "text-green-500" : "text-red-500"}`} />}
            subtitle="Commission - Spend"
            loading={loading}
          />
        </div>
      </div>

      {/* Row 3: Charts */}
      <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
        <AdsPerformanceChart data={adsData?.dailyStats || []} loading={loading} />
        <AdsFunnelChart
          totalLeads={totalLeads}
          approvedSales={approvedSales}
          loading={loading}
        />
      </div>

      {/* Row 4: Daily Table */}
      <DailyAdsTable data={adsData?.dailyStats || []} loading={loading} />
    </div>
  );
}
