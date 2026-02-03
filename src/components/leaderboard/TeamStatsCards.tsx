import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, CheckCircle2, Target, FileText } from "lucide-react";

interface TeamStatsCardsProps {
  totalAppsToday: number;
  totalApproved: number;
  teamApprovalRate: number;
  periodLabel?: string;
  totalApps?: number;
}

export function TeamStatsCards({ 
  totalAppsToday, 
  totalApproved, 
  teamApprovalRate,
  periodLabel = "Today",
  totalApps,
}: TeamStatsCardsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
      <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 border-0 shadow-lg">
        <CardContent className="p-4 md:p-6 text-center">
          <div className="flex items-center justify-center mb-2 md:mb-3">
            <TrendingUp className="h-6 w-6 md:h-8 md:w-8 text-white/80" />
          </div>
          <p className="text-4xl md:text-5xl font-bold text-white mb-1 md:mb-2">{totalAppsToday}</p>
          <p className="text-sm md:text-base text-white/80 font-medium">Apps {periodLabel}</p>
        </CardContent>
      </Card>

      {totalApps !== undefined && (
        <Card className="bg-gradient-to-br from-slate-500 to-slate-600 border-0 shadow-lg">
          <CardContent className="p-4 md:p-6 text-center">
            <div className="flex items-center justify-center mb-2 md:mb-3">
              <FileText className="h-6 w-6 md:h-8 md:w-8 text-white/80" />
            </div>
            <p className="text-4xl md:text-5xl font-bold text-white mb-1 md:mb-2">{totalApps}</p>
            <p className="text-sm md:text-base text-white/80 font-medium">Total Apps</p>
          </CardContent>
        </Card>
      )}

      <Card className="bg-gradient-to-br from-blue-500 to-blue-600 border-0 shadow-lg">
        <CardContent className="p-4 md:p-6 text-center">
          <div className="flex items-center justify-center mb-2 md:mb-3">
            <CheckCircle2 className="h-6 w-6 md:h-8 md:w-8 text-white/80" />
          </div>
          <p className="text-4xl md:text-5xl font-bold text-white mb-1 md:mb-2">{totalApproved}</p>
          <p className="text-sm md:text-base text-white/80 font-medium">Approved</p>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-purple-500 to-purple-600 border-0 shadow-lg">
        <CardContent className="p-4 md:p-6 text-center">
          <div className="flex items-center justify-center mb-2 md:mb-3">
            <Target className="h-6 w-6 md:h-8 md:w-8 text-white/80" />
          </div>
          <p className="text-4xl md:text-5xl font-bold text-white mb-1 md:mb-2">{teamApprovalRate}%</p>
          <p className="text-sm md:text-base text-white/80 font-medium">Approval Rate</p>
        </CardContent>
      </Card>
    </div>
  );
}
