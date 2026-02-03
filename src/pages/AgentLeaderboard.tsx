import { RefreshCw, Trophy, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAgentLeaderboard, TimePeriod } from "@/hooks/useAgentLeaderboard";
import { TeamStatsCards } from "@/components/leaderboard/TeamStatsCards";
import { LeaderboardTable } from "@/components/leaderboard/LeaderboardTable";
import { RecentWinsCard } from "@/components/leaderboard/RecentWinsCard";

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-40 rounded-lg" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Skeleton className="h-96 rounded-lg" />
        </div>
        <Skeleton className="h-96 rounded-lg" />
      </div>
    </div>
  );
}

function getPeriodLabel(period: TimePeriod): string {
  const today = new Date();
  
  if (period === "weekly") {
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    
    const formatDate = (d: Date) => 
      `${d.getMonth() + 1}/${d.getDate()}`;
    
    return `Week of ${formatDate(startOfWeek)} - ${formatDate(endOfWeek)}`;
  }
  
  if (period === "monthly") {
    return today.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  }
  
  return "All Time";
}

export default function AgentLeaderboard() {
  const { data, loading, error, lastUpdated, refetch } = useAgentLeaderboard();

  return (
    <div className="min-h-screen bg-slate-900 text-foreground">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <Trophy className="h-10 w-10 text-yellow-500" />
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-white">
                Agent Leaderboard
              </h1>
              {lastUpdated && (
                <p className="text-sm text-slate-400">
                  Last updated: {lastUpdated.toLocaleTimeString()}
                </p>
              )}
            </div>
          </div>
          <Button
            variant="outline"
            size="lg"
            onClick={() => refetch()}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-destructive/10 border border-destructive/30 text-destructive-foreground rounded-lg p-4 mb-6">
            <p className="font-medium">Error loading leaderboard</p>
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* Loading State */}
        {loading && !data && <LoadingSkeleton />}

        {/* Data Display with Tabs */}
        {data && (
          <Tabs defaultValue="all" className="space-y-6">
            <TabsList className="bg-slate-800 border border-slate-700 p-1">
              <TabsTrigger 
                value="all" 
                className="data-[state=active]:bg-slate-600 data-[state=active]:text-white text-slate-300"
              >
                All Time
              </TabsTrigger>
              <TabsTrigger 
                value="monthly"
                className="data-[state=active]:bg-slate-600 data-[state=active]:text-white text-slate-300"
              >
                This Month
              </TabsTrigger>
              <TabsTrigger 
                value="weekly"
                className="data-[state=active]:bg-slate-600 data-[state=active]:text-white text-slate-300"
              >
                This Week
              </TabsTrigger>
            </TabsList>

            {(["all", "monthly", "weekly"] as TimePeriod[]).map((period) => (
              <TabsContent key={period} value={period} className="space-y-6">
                {/* Period Label */}
                <div className="flex items-center gap-2 text-slate-400">
                  <Calendar className="h-4 w-4" />
                  <span className="text-sm font-medium">{getPeriodLabel(period)}</span>
                </div>

                {/* Team Stats Hero */}
                <TeamStatsCards
                  totalAppsToday={data[period].teamStats.totalAppsToday}
                  totalApproved={data[period].teamStats.totalApproved}
                  teamApprovalRate={data[period].teamStats.teamApprovalRate}
                  periodLabel={period === "all" ? "Today" : period === "weekly" ? "This Week" : "This Month"}
                  totalApps={data[period].teamStats.totalApps}
                />

                {/* Main Content: Leaderboard + Recent Activity */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2">
                    <LeaderboardTable agents={data[period].agents} />
                  </div>
                  <div>
                    <RecentWinsCard activities={data.recentActivity} />
                  </div>
                </div>
              </TabsContent>
            ))}
          </Tabs>
        )}
      </div>
    </div>
  );
}
