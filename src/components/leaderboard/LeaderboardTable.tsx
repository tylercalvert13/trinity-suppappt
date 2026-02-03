import { Trophy, Medal, Award } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { AgentLeaderboardStats } from "@/types/salesTracking";

interface LeaderboardTableProps {
  agents: AgentLeaderboardStats[];
}

function RankIcon({ rank }: { rank: number }) {
  if (rank === 1) {
    return <Trophy className="h-6 w-6 text-yellow-500" />;
  }
  if (rank === 2) {
    return <Medal className="h-6 w-6 text-slate-400" />;
  }
  if (rank === 3) {
    return <Award className="h-6 w-6 text-amber-600" />;
  }
  return (
    <span className="text-xl font-bold text-muted-foreground w-6 text-center inline-block">
      {rank}
    </span>
  );
}

export function LeaderboardTable({ agents }: LeaderboardTableProps) {
  return (
    <Card className="shadow-lg">
      <CardHeader className="pb-3">
        <CardTitle className="text-2xl font-bold">Agent Leaderboard</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-16 text-center text-base">Rank</TableHead>
              <TableHead className="text-base">Agent</TableHead>
              <TableHead className="text-center text-base">Apps</TableHead>
              <TableHead className="text-center text-base">Approved</TableHead>
              <TableHead className="text-center text-base">Rate</TableHead>
              <TableHead className="text-center text-base">Today</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {agents.map((agent) => (
              <TableRow 
                key={agent.name}
                className={agent.rank === 1 ? "bg-yellow-50 dark:bg-yellow-950/20" : ""}
              >
                <TableCell className="text-center">
                  <div className="flex justify-center">
                    <RankIcon rank={agent.rank} />
                  </div>
                </TableCell>
                <TableCell className="font-semibold text-lg">
                  {agent.name}
                </TableCell>
                <TableCell className="text-center text-lg font-medium">
                  {agent.totalApps}
                </TableCell>
                <TableCell className="text-center text-lg font-medium text-emerald-600 dark:text-emerald-400">
                  {agent.approved}
                </TableCell>
                <TableCell className="text-center text-lg">
                  <Badge 
                    variant={agent.approvalRate >= 75 ? "default" : "secondary"}
                    className={agent.approvalRate >= 75 ? "bg-emerald-500" : ""}
                  >
                    {agent.approvalRate}%
                  </Badge>
                </TableCell>
                <TableCell className="text-center">
                  {agent.todayApps > 0 ? (
                    <Badge variant="outline" className="border-emerald-500 text-emerald-600 dark:text-emerald-400 font-bold">
                      +{agent.todayApps}
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
