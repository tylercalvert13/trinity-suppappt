import { RefreshCw, Trophy, Calendar, CalendarDays, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAgentLeaderboard } from "@/hooks/useAgentLeaderboard";
import { CompactLeaderboardTable } from "@/components/leaderboard/CompactLeaderboardTable";
import { RecentWinsCard } from "@/components/leaderboard/RecentWinsCard";

function LoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {[1, 2, 3, 4].map((i) => (
        <Skeleton key={i} className="h-[500px] rounded-lg" />
      ))}
    </div>
  );
}

function getPeriodDateRange(period: "weekly" | "monthly"): string {
  const today = new Date();
  
  if (period === "weekly") {
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    
    const formatDate = (d: Date) => `${d.getMonth() + 1}/${d.getDate()}`;
    return `${formatDate(startOfWeek)} - ${formatDate(endOfWeek)}`;
  }
  
  return today.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

export default function AgentLeaderboard() {
  const { data, loading, error, lastUpdated, refetch } = useAgentLeaderboard();

  return (
    <div className="min-h-screen bg-slate-900 text-foreground">
      <div className="container mx-auto px-4 py-6 max-w-[1920px]">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <Trophy className="h-8 w-8 text-yellow-500" />
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white">
                Agent Leaderboard
              </h1>
              {lastUpdated && (
                <p className="text-xs text-slate-400">
                  Auto-refreshes every 60s • Last: {lastUpdated.toLocaleTimeString()}
                </p>
              )}
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
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

        {/* All Leaderboards Side by Side */}
        {data && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {/* This Week */}
            <CompactLeaderboardTable
              title="This Week"
              subtitle={getPeriodDateRange("weekly")}
              icon={<Clock className="h-5 w-5 text-emerald-400" />}
              agents={data.weekly.agents}
              stats={data.weekly.teamStats}
              accentColor="emerald"
            />

            {/* This Month */}
            <CompactLeaderboardTable
              title="This Month"
              subtitle={getPeriodDateRange("monthly")}
              icon={<CalendarDays className="h-5 w-5 text-blue-400" />}
              agents={data.monthly.agents}
              stats={data.monthly.teamStats}
              accentColor="blue"
            />

            {/* All Time */}
            <CompactLeaderboardTable
              title="All Time"
              subtitle="Total Performance"
              icon={<Calendar className="h-5 w-5 text-purple-400" />}
              agents={data.all.agents}
              stats={data.all.teamStats}
              accentColor="purple"
            />

            {/* Recent Activity */}
            <RecentWinsCard activities={data.recentActivity} />
          </div>
        )}
      </div>
    </div>
  );
}
