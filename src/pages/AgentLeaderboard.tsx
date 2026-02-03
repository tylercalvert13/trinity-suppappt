import { RefreshCw, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAgentLeaderboard } from "@/hooks/useAgentLeaderboard";
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

        {/* Data Display */}
        {data && (
          <div className="space-y-6">
            {/* Team Stats Hero */}
            <TeamStatsCards
              totalAppsToday={data.teamStats.totalAppsToday}
              totalApproved={data.teamStats.totalApproved}
              teamApprovalRate={data.teamStats.teamApprovalRate}
            />

            {/* Main Content: Leaderboard + Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <LeaderboardTable agents={data.agents} />
              </div>
              <div>
                <RecentWinsCard activities={data.recentActivity} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
