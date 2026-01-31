import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import type { DailyAdsStats } from "@/types/salesTracking";
import { useIsMobile } from "@/hooks/use-mobile";

interface AdsPerformanceChartProps {
  data: DailyAdsStats[];
  loading?: boolean;
}

export function AdsPerformanceChart({ data, loading }: AdsPerformanceChartProps) {
  const isMobile = useIsMobile();
  // Take last 7 days for display
  const chartData = data.slice(-7);

  return (
    <Card className="bg-white/95 backdrop-blur">
      <CardHeader className="pb-2 sm:pb-4">
        <CardTitle className="text-base sm:text-lg flex items-center gap-2">
          📈 Spend & Performance
        </CardTitle>
      </CardHeader>
      <CardContent className="px-2 sm:px-6">
        {loading ? (
          <Skeleton className="h-[200px] sm:h-[250px] w-full" />
        ) : (
          <ResponsiveContainer width="100%" height={isMobile ? 200 : 250}>
            <ComposedChart data={chartData} margin={{ left: isMobile ? -15 : 0, right: isMobile ? 0 : 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: isMobile ? 10 : 12 }}
                angle={isMobile ? -45 : 0}
                textAnchor={isMobile ? "end" : "middle"}
                height={isMobile ? 50 : 30}
              />
              <YAxis 
                yAxisId="left" 
                orientation="left" 
                tickFormatter={(v) => `$${v}`}
                tick={{ fontSize: isMobile ? 10 : 12 }}
                width={isMobile ? 40 : 50}
              />
              {!isMobile && (
                <YAxis 
                  yAxisId="right" 
                  orientation="right"
                  tick={{ fontSize: 12 }}
                  width={40}
                />
              )}
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  fontSize: isMobile ? 12 : 14,
                }}
                formatter={(value: number, name: string) => {
                  if (name === "Spend") return [`$${value.toFixed(2)}`, name];
                  return [value, name];
                }}
              />
              <Legend 
                iconSize={isMobile ? 10 : 14}
                wrapperStyle={{ fontSize: isMobile ? 10 : 12 }}
              />
              <Bar
                yAxisId="left"
                dataKey="spend"
                name="Spend"
                fill="#ef4444"
                radius={[4, 4, 0, 0]}
                opacity={0.8}
              />
              <Line
                yAxisId={isMobile ? "left" : "right"}
                type="monotone"
                dataKey="leads"
                name="Leads"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ fill: "#3b82f6", r: isMobile ? 2 : 4 }}
              />
              <Line
                yAxisId={isMobile ? "left" : "right"}
                type="monotone"
                dataKey="appointments"
                name="Appts"
                stroke="#f59e0b"
                strokeWidth={2}
                dot={{ fill: "#f59e0b", r: isMobile ? 2 : 4 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
