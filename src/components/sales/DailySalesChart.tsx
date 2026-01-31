import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import type { DailyStats } from "@/types/salesTracking";
import { useIsMobile } from "@/hooks/use-mobile";

interface DailySalesChartProps {
  data: DailyStats[];
  loading?: boolean;
}

export function DailySalesChart({ data, loading }: DailySalesChartProps) {
  const isMobile = useIsMobile();
  
  return (
    <Card className="bg-white/95 backdrop-blur">
      <CardHeader className="pb-2 sm:pb-4">
        <CardTitle className="text-base sm:text-lg flex items-center gap-2">
          📈 Sales by Day
        </CardTitle>
      </CardHeader>
      <CardContent className="px-2 sm:px-6">
        {loading ? (
          <Skeleton className="h-[200px] sm:h-[250px] w-full" />
        ) : (
          <ResponsiveContainer width="100%" height={isMobile ? 200 : 250}>
            <BarChart data={data} margin={{ left: isMobile ? -20 : 0, right: isMobile ? 0 : 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: isMobile ? 10 : 12 }}
                angle={isMobile ? -45 : 0}
                textAnchor={isMobile ? "end" : "middle"}
                height={isMobile ? 50 : 30}
              />
              <YAxis allowDecimals={false} tick={{ fontSize: isMobile ? 10 : 12 }} width={isMobile ? 30 : 40} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  fontSize: isMobile ? 12 : 14,
                }}
              />
              <Legend 
                iconSize={isMobile ? 10 : 14}
                wrapperStyle={{ fontSize: isMobile ? 10 : 12 }}
              />
              <Bar dataKey="approved" name="Approved" fill="#22c55e" stackId="a" radius={[0, 0, 0, 0]} />
              <Bar dataKey="pending" name="Pending" fill="#f59e0b" stackId="a" radius={[0, 0, 0, 0]} />
              <Bar dataKey="denied" name="Denied" fill="#ef4444" stackId="a" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
