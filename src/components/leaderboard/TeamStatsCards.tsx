import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, CheckCircle2, Target, FileText } from "lucide-react";

interface TeamStatsCardsProps {
  totalAppsToday: number;
  totalApproved: number;
  teamApprovalRate: number;
  totalApps: number;
  isFullscreen?: boolean;
}

export function TeamStatsCards({ 
  totalAppsToday, 
  totalApproved, 
  teamApprovalRate,
  totalApps,
  isFullscreen = false,
}: TeamStatsCardsProps) {
  const iconSize = isFullscreen ? "h-10 w-10" : "h-6 w-6 md:h-8 md:w-8";
  const numberSize = isFullscreen ? "text-6xl xl:text-7xl" : "text-4xl md:text-5xl";
  const labelSize = isFullscreen ? "text-lg" : "text-sm md:text-base";
  const padding = isFullscreen ? "p-6 xl:p-8" : "p-4 md:p-6";
  
  return (
    <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
      <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 border-0 shadow-lg">
        <CardContent className={`${padding} text-center`}>
          <div className="flex items-center justify-center mb-2">
            <TrendingUp className={`${iconSize} text-white/80`} />
          </div>
          <p className={`${numberSize} font-bold text-white mb-1`}>{totalAppsToday}</p>
          <p className={`${labelSize} text-white/80 font-medium`}>Apps Today</p>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-slate-600 to-slate-700 border-0 shadow-lg">
        <CardContent className={`${padding} text-center`}>
          <div className="flex items-center justify-center mb-2">
            <FileText className={`${iconSize} text-white/80`} />
          </div>
          <p className={`${numberSize} font-bold text-white mb-1`}>{totalApps}</p>
          <p className={`${labelSize} text-white/80 font-medium`}>Total Apps</p>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-blue-500 to-blue-600 border-0 shadow-lg">
        <CardContent className={`${padding} text-center`}>
          <div className="flex items-center justify-center mb-2">
            <CheckCircle2 className={`${iconSize} text-white/80`} />
          </div>
          <p className={`${numberSize} font-bold text-white mb-1`}>{totalApproved}</p>
          <p className={`${labelSize} text-white/80 font-medium`}>Approved</p>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-purple-500 to-purple-600 border-0 shadow-lg">
        <CardContent className={`${padding} text-center`}>
          <div className="flex items-center justify-center mb-2">
            <Target className={`${iconSize} text-white/80`} />
          </div>
          <p className={`${numberSize} font-bold text-white mb-1`}>{teamApprovalRate}%</p>
          <p className={`${labelSize} text-white/80 font-medium`}>Approval Rate</p>
        </CardContent>
      </Card>
    </div>
  );
}
