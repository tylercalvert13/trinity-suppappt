import { Trophy, Medal, Award } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { AgentLeaderboardStats } from "@/types/salesTracking";

interface CompactLeaderboardTableProps {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  agents: AgentLeaderboardStats[];
  stats: {
    totalApps: number;
    totalApproved: number;
    teamApprovalRate: number;
  };
  accentColor: "emerald" | "blue" | "purple";
}

function RankIcon({ rank }: { rank: number }) {
  if (rank === 1) {
    return <Trophy className="h-5 w-5 text-yellow-500" />;
  }
  if (rank === 2) {
    return <Medal className="h-5 w-5 text-slate-400" />;
  }
  if (rank === 3) {
    return <Award className="h-5 w-5 text-amber-600" />;
  }
  return (
    <span className="text-sm font-bold text-muted-foreground w-5 text-center inline-block">
      {rank}
    </span>
  );
}

const accentStyles = {
  emerald: {
    header: "from-emerald-500/20 to-transparent",
    badge: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    text: "text-emerald-400",
  },
  blue: {
    header: "from-blue-500/20 to-transparent",
    badge: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    text: "text-blue-400",
  },
  purple: {
    header: "from-purple-500/20 to-transparent",
    badge: "bg-purple-500/20 text-purple-400 border-purple-500/30",
    text: "text-purple-400",
  },
};

export function CompactLeaderboardTable({ 
  title, 
  subtitle, 
  icon, 
  agents, 
  stats,
  accentColor,
}: CompactLeaderboardTableProps) {
  const styles = accentStyles[accentColor];
  
  return (
    <Card className="bg-slate-800 border-slate-700 shadow-lg h-full flex flex-col">
      <CardHeader className={`pb-3 bg-gradient-to-b ${styles.header}`}>
        <div className="flex items-center gap-2">
          {icon}
          <div>
            <CardTitle className="text-lg font-bold text-white">{title}</CardTitle>
            <p className="text-xs text-slate-400">{subtitle}</p>
          </div>
        </div>
        {/* Mini Stats Row */}
        <div className="flex gap-2 mt-3">
          <Badge variant="outline" className={styles.badge}>
            {stats.totalApps} Apps
          </Badge>
          <Badge variant="outline" className={styles.badge}>
            {stats.totalApproved} Approved
          </Badge>
          <Badge variant="outline" className={styles.badge}>
            {stats.teamApprovalRate}% Rate
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex-1 pt-2 px-3 pb-3">
        {agents.length === 0 ? (
          <p className="text-slate-500 text-center py-8 text-sm">No data yet</p>
        ) : (
          <div className="space-y-1">
            {agents.slice(0, 10).map((agent) => (
              <div 
                key={agent.name}
                className={`flex items-center gap-2 p-2 rounded-lg transition-colors ${
                  agent.rank === 1 
                    ? "bg-yellow-500/10 border border-yellow-500/20" 
                    : "hover:bg-slate-700/50"
                }`}
              >
                <div className="flex-shrink-0 w-6 flex justify-center">
                  <RankIcon rank={agent.rank} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`font-medium text-sm truncate ${
                    agent.rank === 1 ? "text-yellow-400" : "text-white"
                  }`}>
                    {agent.name}
                  </p>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <span className="text-slate-400">
                    {agent.totalApps} <span className="hidden sm:inline">apps</span>
                  </span>
                  <span className={`font-bold ${styles.text}`}>
                    {agent.approved}
                  </span>
                  <span className="text-slate-500 w-10 text-right">
                    {agent.approvalRate}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
