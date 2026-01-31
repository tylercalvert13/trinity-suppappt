import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import type { CarrierStats } from "@/types/salesTracking";
import { useIsMobile } from "@/hooks/use-mobile";

const CHART_COLORS = [
  "#3b82f6",
  "#22c55e",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
  "#06b6d4",
  "#84cc16",
];

interface CarrierChartProps {
  data: CarrierStats[];
  loading?: boolean;
}

export function CarrierChart({ data, loading }: CarrierChartProps) {
  const isMobile = useIsMobile();
  
  return (
    <Card className="bg-white/95 backdrop-blur">
      <CardHeader className="pb-2 sm:pb-4">
        <CardTitle className="text-base sm:text-lg flex items-center gap-2">
          🏢 Top Carriers
        </CardTitle>
      </CardHeader>
      <CardContent className="px-2 sm:px-6">
        {loading ? (
          <Skeleton className="h-[200px] sm:h-[250px] w-full" />
        ) : data.length === 0 ? (
          <div className="h-[200px] sm:h-[250px] flex items-center justify-center text-muted-foreground text-sm">
            No carrier data yet
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={isMobile ? 200 : 250}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={isMobile ? 35 : 50}
                outerRadius={isMobile ? 60 : 80}
                paddingAngle={2}
                dataKey="count"
                nameKey="name"
                label={isMobile ? false : ({ name, count }) => `${name}: ${count}`}
                labelLine={!isMobile}
              >
                {data.map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={CHART_COLORS[index % CHART_COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  fontSize: isMobile ? 12 : 14,
                }}
                formatter={(value: number, name: string) => [value, name]}
              />
              <Legend 
                iconSize={isMobile ? 10 : 14}
                wrapperStyle={{ fontSize: isMobile ? 10 : 12 }}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
