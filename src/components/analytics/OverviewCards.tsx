import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, PhoneCall, TrendingUp, UserCheck } from "lucide-react";

interface OverviewCardsProps {
  totalVisitors: number;
  totalCalls: number;
  conversionRate: number;
  qualifiedRate: number;
  todayVisitors: number;
  todayCalls: number;
}

export const OverviewCards = ({
  totalVisitors,
  totalCalls,
  conversionRate,
  qualifiedRate,
  todayVisitors,
  todayCalls,
}: OverviewCardsProps) => {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Visitors</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalVisitors.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">
            +{todayVisitors} today
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Calls</CardTitle>
          <PhoneCall className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalCalls.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">
            +{todayCalls} today
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{conversionRate.toFixed(1)}%</div>
          <p className="text-xs text-muted-foreground">
            Visitors to calls
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Qualified Rate</CardTitle>
          <UserCheck className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{qualifiedRate.toFixed(1)}%</div>
          <p className="text-xs text-muted-foreground">
            Completed funnel
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
