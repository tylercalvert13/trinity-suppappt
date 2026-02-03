import { useState, useEffect } from "react";
import { RefreshCw, Trophy, Calendar, CalendarDays, Clock, Maximize, Minimize } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAgentLeaderboard } from "@/hooks/useAgentLeaderboard";
import { TeamStatsCards } from "@/components/leaderboard/TeamStatsCards";
import { CompactLeaderboardTable } from "@/components/leaderboard/CompactLeaderboardTable";
import { RecentWinsCard } from "@/components/leaderboard/RecentWinsCard";

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-32 rounded-lg" />
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-[400px] rounded-lg" />
        ))}
      </div>
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
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // Listen for fullscreen changes (e.g., user presses Escape)
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  return (
    <div className="min-h-screen bg-slate-900 text-foreground">
      <div className={`container mx-auto max-w-[1920px] ${isFullscreen ? "px-6 py-4" : "px-4 py-6"}`}>
        {/* Header */}
        <div className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 ${isFullscreen ? "mb-4" : "mb-6"}`}>
          <div className="flex items-center gap-3">
            <Trophy className={`text-yellow-500 ${isFullscreen ? "h-10 w-10" : "h-8 w-8"}`} />
            <div>
              <h1 className={`font-bold text-white ${isFullscreen ? "text-4xl" : "text-2xl md:text-3xl"}`}>
                Agent Leaderboard
              </h1>
              {lastUpdated && (
                <p className={`text-slate-400 ${isFullscreen ? "text-sm" : "text-xs"}`}>
                  Auto-refreshes every 60s • Last: {lastUpdated.toLocaleTimeString()}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size={isFullscreen ? "default" : "sm"}
              onClick={() => refetch()}
              disabled={loading}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button
              variant="outline"
              size={isFullscreen ? "default" : "sm"}
              onClick={toggleFullscreen}
              className="flex items-center gap-2"
            >
              {isFullscreen ? (
                <>
                  <Minimize className="h-4 w-4" />
                  Exit Fullscreen
                </>
              ) : (
                <>
                  <Maximize className="h-4 w-4" />
                  Fullscreen
                </>
              )}
            </Button>
          </div>
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
          <div className={`space-y-${isFullscreen ? "4" : "6"}`}>
            {/* Team Stats Hero */}
            <TeamStatsCards
              totalAppsToday={data.all.teamStats.totalAppsToday}
              totalApproved={data.all.teamStats.totalApproved}
              teamApprovalRate={data.all.teamStats.teamApprovalRate}
              totalApps={data.all.teamStats.totalApps}
              isFullscreen={isFullscreen}
            />

            {/* All Leaderboards Side by Side */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              {/* This Week */}
              <CompactLeaderboardTable
                title="This Week"
                subtitle={getPeriodDateRange("weekly")}
                icon={<Clock className={`text-emerald-400 ${isFullscreen ? "h-6 w-6" : "h-5 w-5"}`} />}
                agents={data.weekly.agents}
                stats={data.weekly.teamStats}
                accentColor="emerald"
                isFullscreen={isFullscreen}
              />

              {/* This Month */}
              <CompactLeaderboardTable
                title="This Month"
                subtitle={getPeriodDateRange("monthly")}
                icon={<CalendarDays className={`text-blue-400 ${isFullscreen ? "h-6 w-6" : "h-5 w-5"}`} />}
                agents={data.monthly.agents}
                stats={data.monthly.teamStats}
                accentColor="blue"
                isFullscreen={isFullscreen}
              />

              {/* All Time */}
              <CompactLeaderboardTable
                title="All Time"
                subtitle="Total Performance"
                icon={<Calendar className={`text-purple-400 ${isFullscreen ? "h-6 w-6" : "h-5 w-5"}`} />}
                agents={data.all.agents}
                stats={data.all.teamStats}
                accentColor="purple"
                isFullscreen={isFullscreen}
              />

              {/* Recent Activity */}
              <RecentWinsCard activities={data.recentActivity} isFullscreen={isFullscreen} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
