import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RefreshCw, TrendingUp, DollarSign, CheckCircle, Clock, XCircle } from "lucide-react";
import { useSalesData, formatCurrency } from "@/hooks/useSalesData";
import { useAdsData } from "@/hooks/useAdsData";
import { StatCard } from "@/components/sales/StatCard";
import { DailySalesChart } from "@/components/sales/DailySalesChart";
import { CarrierChart } from "@/components/sales/CarrierChart";
import { AgentTable } from "@/components/sales/AgentTable";
import { RecentSubmissionsTable } from "@/components/sales/RecentSubmissionsTable";
import { AdsTrackingTab } from "@/components/sales/AdsTrackingTab";
import { DateRangeFilter, type DateRangeValue } from "@/components/sales/DateRangeFilter";

export default function SalesTracking() {
  const [dateRange, setDateRange] = useState<DateRangeValue>({ from: null, to: null });
  const { data: salesData, loading: salesLoading, error: salesError, lastUpdated, refetch: refetchSales } = useSalesData(dateRange);
  const { data: adsData, loading: adsLoading, error: adsError, refetch: refetchAds } = useAdsData(dateRange);

  const loading = salesLoading || adsLoading;
  const error = salesError || adsError;

  const handleRefresh = () => {
    refetchSales();
    refetchAds();
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <p className="text-destructive mb-4">{error}</p>
            <Button onClick={handleRefresh}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-3 sm:p-4 md:p-8 overflow-x-hidden">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white flex items-center justify-center gap-2">
            🏥 Health Helpers Dashboard
          </h1>
          <p className="text-blue-200 text-sm sm:text-base md:text-lg">Medicare Supplement Sales Tracker</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 text-xs sm:text-sm text-blue-300">
            <span>
              Last updated: {lastUpdated ? lastUpdated.toLocaleString() : "—"}
            </span>
            <DateRangeFilter value={dateRange} onChange={setDateRange} />
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={loading}
              className="bg-white/10 border-white/20 text-white hover:bg-white/20 min-h-[44px] px-4"
            >
              <RefreshCw className={`h-4 w-4 mr-1 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="sales" className="w-full">
          <TabsList className="grid w-full max-w-lg mx-auto grid-cols-2 bg-white/10 h-11 sm:h-10">
            <TabsTrigger value="sales" className="data-[state=active]:bg-white data-[state=active]:text-slate-900 text-white text-xs sm:text-sm min-h-[40px]">
              Sales
            </TabsTrigger>
            <TabsTrigger value="ads" className="data-[state=active]:bg-white data-[state=active]:text-slate-900 text-white text-xs sm:text-sm min-h-[40px]">
              Ads
            </TabsTrigger>
          </TabsList>

          <TabsContent value="sales" className="space-y-4 sm:space-y-6 mt-4 sm:mt-6">
            {/* Stats Grid */}
            <div className="flex gap-3 overflow-x-auto pb-2 sm:pb-0 sm:grid sm:grid-cols-3 lg:grid-cols-6 sm:gap-4 sm:overflow-visible -mx-3 px-3 sm:mx-0 sm:px-0">
              <div className="min-w-[140px] sm:min-w-0 flex-shrink-0 sm:flex-shrink">
                <StatCard
                  title="Total Applications"
                  value={salesLoading ? null : salesData?.totalSales ?? 0}
                  icon={<TrendingUp className="h-5 w-5" />}
                  subtitle="All submissions"
                  loading={salesLoading}
                />
              </div>
              <div className="min-w-[140px] sm:min-w-0 flex-shrink-0 sm:flex-shrink">
                <StatCard
                  title="Approved"
                  value={salesLoading ? null : salesData?.approved ?? 0}
                  icon={<CheckCircle className="h-5 w-5 text-green-500" />}
                  subtitle={
                    salesData && salesData.totalSales > 0
                      ? `${Math.round((salesData.approved / salesData.totalSales) * 100)}% rate`
                      : "—"
                  }
                  loading={salesLoading}
                />
              </div>
              <div className="min-w-[140px] sm:min-w-0 flex-shrink-0 sm:flex-shrink">
                <StatCard
                  title="Pending"
                  value={salesLoading ? null : salesData?.pending ?? 0}
                  icon={<Clock className="h-5 w-5 text-yellow-500" />}
                  subtitle={
                    salesData && salesData.pendingPremium > 0
                      ? `${formatCurrency(salesData.pendingPremium)} potential`
                      : "Awaiting decision"
                  }
                  loading={salesLoading}
                />
              </div>
              <div className="min-w-[140px] sm:min-w-0 flex-shrink-0 sm:flex-shrink">
                <StatCard
                  title="Denied"
                  value={salesLoading ? null : salesData?.denied ?? 0}
                  icon={<XCircle className="h-5 w-5 text-red-500" />}
                  subtitle={
                    salesData && salesData.totalSales > 0
                      ? `${Math.round((salesData.denied / salesData.totalSales) * 100)}% rate`
                      : "—"
                  }
                  loading={salesLoading}
                />
              </div>
              <div className="min-w-[140px] sm:min-w-0 flex-shrink-0 sm:flex-shrink">
                <StatCard
                  title="Total AP"
                  value={salesLoading ? null : formatCurrency((salesData?.totalPremium ?? 0) * 12)}
                  icon={<DollarSign className="h-5 w-5 text-green-500" />}
                  subtitle="Annualized premium"
                  loading={salesLoading}
                />
              </div>
              <div className="min-w-[140px] sm:min-w-0 flex-shrink-0 sm:flex-shrink">
                <StatCard
                  title="Total Commission"
                  value={salesLoading ? null : formatCurrency(salesData?.totalCommission ?? 0)}
                  icon={<DollarSign className="h-5 w-5 text-blue-500" />}
                  subtitle={
                    salesData && salesData.avgCommission > 0
                      ? `Avg: ${formatCurrency(salesData.avgCommission)}/sale`
                      : "Approved only"
                  }
                  loading={salesLoading}
                />
              </div>
            </div>

            {/* Charts Row */}
            <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
              <DailySalesChart data={salesData?.dailyStats || []} loading={salesLoading} />
              <CarrierChart data={salesData?.carrierStats || []} loading={salesLoading} />
            </div>

            {/* Tables Row */}
            <div className="grid md:grid-cols-2 gap-4 sm:gap-6 min-w-0">
              <div className="min-w-0">
                <AgentTable data={salesData?.agentStats || []} loading={salesLoading} />
              </div>
              <div className="min-w-0">
                <RecentSubmissionsTable data={salesData?.recentSubmissions || []} loading={salesLoading} />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="ads" className="mt-6">
            <AdsTrackingTab
              adsData={adsData}
              salesData={salesData}
              loading={loading}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
