import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, CheckCircle2, Target } from "lucide-react";

interface TeamStatsCardsProps {
  totalAppsToday: number;
  totalApproved: number;
  teamApprovalRate: number;
}

export function TeamStatsCards({ 
  totalAppsToday, 
  totalApproved, 
  teamApprovalRate 
}: TeamStatsCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 border-0 shadow-lg">
        <CardContent className="p-6 text-center">
          <div className="flex items-center justify-center mb-3">
            <TrendingUp className="h-8 w-8 text-white/80" />
          </div>
          <p className="text-6xl font-bold text-white mb-2">{totalAppsToday}</p>
          <p className="text-lg text-white/80 font-medium">Apps Today</p>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-blue-500 to-blue-600 border-0 shadow-lg">
        <CardContent className="p-6 text-center">
          <div className="flex items-center justify-center mb-3">
            <CheckCircle2 className="h-8 w-8 text-white/80" />
          </div>
          <p className="text-6xl font-bold text-white mb-2">{totalApproved}</p>
          <p className="text-lg text-white/80 font-medium">Total Approved</p>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-purple-500 to-purple-600 border-0 shadow-lg">
        <CardContent className="p-6 text-center">
          <div className="flex items-center justify-center mb-3">
            <Target className="h-8 w-8 text-white/80" />
          </div>
          <p className="text-6xl font-bold text-white mb-2">{teamApprovalRate}%</p>
          <p className="text-lg text-white/80 font-medium">Team Approval Rate</p>
        </CardContent>
      </Card>
    </div>
  );
}
