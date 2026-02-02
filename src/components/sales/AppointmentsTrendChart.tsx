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
import type { DailyAppointmentStats } from "@/types/salesTracking";

interface AppointmentsTrendChartProps {
  data: DailyAppointmentStats[];
  loading: boolean;
}

export function AppointmentsTrendChart({ data, loading }: AppointmentsTrendChartProps) {
  // Reverse to show chronological order (oldest first)
  const chartData = [...data].reverse().slice(-14);

  return (
    <Card className="bg-white/95 backdrop-blur">
      <CardHeader className="pb-2 sm:pb-4">
        <CardTitle className="text-sm sm:text-base">Appointments Trend</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {loading ? (
          <Skeleton className="h-[200px] sm:h-[250px] w-full" />
        ) : (
          <div className="h-[200px] sm:h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10 }}
                  interval="preserveStartEnd"
                />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(255, 255, 255, 0.95)",
                    borderRadius: "8px",
                    border: "1px solid #e2e8f0",
                    fontSize: "12px",
                  }}
                />
                <Legend wrapperStyle={{ fontSize: "11px" }} />
                <Bar dataKey="due" name="Due" fill="#3b82f6" radius={[2, 2, 0, 0]} />
                <Bar dataKey="showed" name="Showed" fill="#f59e0b" radius={[2, 2, 0, 0]} />
                <Bar dataKey="closed" name="Closed" fill="#22c55e" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
