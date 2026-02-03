import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, FileText, Sparkles } from "lucide-react";
import type { RecentActivity } from "@/types/salesTracking";

interface RecentWinsCardProps {
  activities: RecentActivity[];
}

function ActivityIcon({ type }: { type: string }) {
  if (type === "approved") {
    return <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />;
  }
  return <FileText className="h-4 w-4 text-blue-500 flex-shrink-0" />;
}

export function RecentWinsCard({ activities }: RecentWinsCardProps) {
  return (
    <Card className="bg-slate-800 border-slate-700 shadow-lg h-full flex flex-col">
      <CardHeader className="pb-3 bg-gradient-to-b from-yellow-500/10 to-transparent">
        <CardTitle className="text-lg font-bold flex items-center gap-2 text-white">
          <Sparkles className="h-5 w-5 text-yellow-500" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 pt-2 px-3 pb-3">
        {activities.length === 0 ? (
          <p className="text-slate-500 text-center py-8 text-sm">
            No recent activity yet
          </p>
        ) : (
          <div className="space-y-2">
            {activities.map((activity) => (
              <div 
                key={activity.id}
                className="flex items-start gap-2 p-2 rounded-lg bg-slate-700/30"
              >
                <ActivityIcon type={activity.type} />
                <p className="text-sm text-slate-300">
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
