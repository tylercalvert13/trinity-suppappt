import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { RefreshCw, TrendingUp, DollarSign, CheckCircle, Clock, XCircle } from "lucide-react";
import { useSalesData, formatCurrency } from "@/hooks/useSalesData";
import { StatCard } from "@/components/sales/StatCard";
import { DailySalesChart } from "@/components/sales/DailySalesChart";
import { CarrierChart } from "@/components/sales/CarrierChart";
import { AgentTable } from "@/components/sales/AgentTable";
import { RecentSubmissionsTable } from "@/components/sales/RecentSubmissionsTable";

export default function SalesTracking() {
  const { data, loading, error, lastUpdated, refetch } = useSalesData();

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <p className="text-destructive mb-4">{error}</p>
            <Button onClick={refetch}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl md:text-4xl font-bold text-white flex items-center justify-center gap-2">
            🏥 Health Helpers Dashboard
          </h1>
          <p className="text-blue-200 text-lg">Medicare Supplement Sales Tracker</p>
          <div className="flex items-center justify-center gap-4 text-sm text-blue-300">
            <span>
              Last updated: {lastUpdated ? lastUpdated.toLocaleString() : "—"}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={refetch}
              disabled={loading}
              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              <RefreshCw className={`h-4 w-4 mr-1 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Stats Grid - 6 Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <StatCard
            title="Total Applications"
            value={loading ? null : data?.totalSales ?? 0}
            icon={<TrendingUp className="h-5 w-5" />}
            subtitle="All submissions"
            loading={loading}
          />
          <StatCard
            title="Approved"
            value={loading ? null : data?.approved ?? 0}
            icon={<CheckCircle className="h-5 w-5 text-green-500" />}
            subtitle={
              data && data.totalSales > 0
                ? `${Math.round((data.approved / data.totalSales) * 100)}% rate`
                : "—"
            }
            loading={loading}
          />
          <StatCard
            title="Pending"
            value={loading ? null : data?.pending ?? 0}
            icon={<Clock className="h-5 w-5 text-yellow-500" />}
            subtitle={
              data && data.pendingPremium > 0
                ? `${formatCurrency(data.pendingPremium)} potential`
                : "Awaiting decision"
            }
            loading={loading}
          />
          <StatCard
            title="Denied"
            value={loading ? null : data?.denied ?? 0}
            icon={<XCircle className="h-5 w-5 text-red-500" />}
            subtitle={
              data && data.totalSales > 0
                ? `${Math.round((data.denied / data.totalSales) * 100)}% rate`
                : "—"
            }
            loading={loading}
          />
          <StatCard
            title="Total Premium"
            value={loading ? null : formatCurrency(data?.totalPremium ?? 0)}
            icon={<DollarSign className="h-5 w-5 text-green-500" />}
            subtitle="Approved only"
            loading={loading}
          />
          <StatCard
            title="Total Commission"
            value={loading ? null : formatCurrency(data?.totalCommission ?? 0)}
            icon={<DollarSign className="h-5 w-5 text-blue-500" />}
            subtitle={
              data && data.avgCommission > 0
                ? `Avg: ${formatCurrency(data.avgCommission)}/sale`
                : "Approved only"
            }
            loading={loading}
          />
        </div>

        {/* Charts Row */}
        <div className="grid md:grid-cols-2 gap-6">
          <DailySalesChart data={data?.dailyStats || []} loading={loading} />
          <CarrierChart data={data?.carrierStats || []} loading={loading} />
        </div>

        {/* Tables Row */}
        <div className="grid md:grid-cols-2 gap-6">
          <AgentTable data={data?.agentStats || []} loading={loading} />
          <RecentSubmissionsTable data={data?.recentSubmissions || []} loading={loading} />
        </div>
      </div>
    </div>
  );
}
