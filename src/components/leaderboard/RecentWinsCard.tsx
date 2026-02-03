import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, FileText, Sparkles } from "lucide-react";
import type { RecentActivity } from "@/types/salesTracking";

interface RecentWinsCardProps {
  activities: RecentActivity[];
  isFullscreen?: boolean;
}

function ActivityIcon({ type, isFullscreen }: { type: string; isFullscreen: boolean }) {
  const size = isFullscreen ? "h-5 w-5" : "h-4 w-4";
  
  if (type === "approved") {
    return <CheckCircle2 className={`${size} text-emerald-500 flex-shrink-0`} />;
  }
  return <FileText className={`${size} text-blue-500 flex-shrink-0`} />;
}

export function RecentWinsCard({ activities, isFullscreen = false }: RecentWinsCardProps) {
  const titleSize = isFullscreen ? "text-xl" : "text-lg";
  const iconSize = isFullscreen ? "h-6 w-6" : "h-5 w-5";
  const textSize = isFullscreen ? "text-base" : "text-sm";
  const padding = isFullscreen ? "p-3" : "p-2";
  
  return (
    <Card className="bg-slate-800 border-slate-700 shadow-lg h-full flex flex-col">
      <CardHeader className="pb-3 bg-gradient-to-b from-yellow-500/10 to-transparent">
        <CardTitle className={`${titleSize} font-bold flex items-center gap-2 text-white`}>
          <Sparkles className={`${iconSize} text-yellow-500`} />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 pt-2 px-3 pb-3 overflow-y-auto">
        {activities.length === 0 ? (
          <p className="text-slate-500 text-center py-8 text-sm">
            No recent activity yet
          </p>
        ) : (
          <div className="space-y-2">
            {activities.map((activity) => (
              <div 
                key={activity.id}
                className={`flex items-start gap-3 ${padding} rounded-lg bg-slate-700/30`}
              >
                <ActivityIcon type={activity.type} isFullscreen={isFullscreen} />
                <p className={`${textSize} text-slate-300`}>
                  <span className="font-semibold text-white">{activity.agent}</span>{" "}
                  {activity.action}
                </p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
