import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, FileText, Sparkles } from "lucide-react";
import type { RecentActivity } from "@/types/salesTracking";

interface RecentWinsCardProps {
  activities: RecentActivity[];
}

function ActivityIcon({ type }: { type: string }) {
  if (type === "approved") {
    return <CheckCircle2 className="h-5 w-5 text-emerald-500" />;
  }
  return <FileText className="h-5 w-5 text-blue-500" />;
}

export function RecentWinsCard({ activities }: RecentWinsCardProps) {
  if (activities.length === 0) {
    return (
      <Card className="shadow-lg h-full">
        <CardHeader className="pb-3">
          <CardTitle className="text-xl font-bold flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-yellow-500" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            No recent activity yet
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-xl font-bold flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-yellow-500" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {activities.map((activity) => (
          <div 
            key={activity.id}
            className="flex items-start gap-3 p-3 rounded-lg bg-muted/50"
          >
            <ActivityIcon type={activity.type} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">
                <span className="font-bold">{activity.agent}</span>{" "}
                {activity.action}
              </p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
