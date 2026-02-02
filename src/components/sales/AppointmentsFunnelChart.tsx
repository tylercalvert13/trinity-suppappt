import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LabelList,
} from "recharts";

interface AppointmentsFunnelChartProps {
  totalDue: number;
  totalShowed: number;
  totalClosed: number;
  loading: boolean;
}

const COLORS = {
  due: "#3b82f6",
  showed: "#f59e0b",
  closed: "#22c55e",
};

export function AppointmentsFunnelChart({
  totalDue,
  totalShowed,
  totalClosed,
  loading,
}: AppointmentsFunnelChartProps) {
  const showRate = totalDue > 0 ? ((totalShowed / totalDue) * 100).toFixed(1) : "0";
  const closeRate = totalShowed > 0 ? ((totalClosed / totalShowed) * 100).toFixed(1) : "0";

  const funnelData = [
    { name: "Due", value: totalDue, color: COLORS.due, rate: "" },
    { name: "Showed", value: totalShowed, color: COLORS.showed, rate: `${showRate}%` },
    { name: "Closed", value: totalClosed, color: COLORS.closed, rate: `${closeRate}%` },
  ];

  return (
    <Card className="bg-white/95 backdrop-blur">
      <CardHeader className="pb-2 sm:pb-4">
        <CardTitle className="text-sm sm:text-base">Conversion Funnel</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {loading ? (
          <Skeleton className="h-[200px] sm:h-[250px] w-full" />
        ) : (
          <div className="h-[200px] sm:h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={funnelData}
                layout="vertical"
                margin={{ top: 5, right: 60, left: 5, bottom: 5 }}
              >
                <XAxis type="number" tick={{ fontSize: 10 }} />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fontSize: 11 }}
                  width={55}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(255, 255, 255, 0.95)",
                    borderRadius: "8px",
                    border: "1px solid #e2e8f0",
                    fontSize: "12px",
                  }}
                  formatter={(value: number) => [value, "Count"]}
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {funnelData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                  <LabelList
                    dataKey="value"
                    position="right"
                    style={{ fontSize: "11px", fontWeight: 600 }}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div className="flex justify-center gap-4 sm:gap-8 mt-2 text-xs sm:text-sm">
              <div className="text-center">
                <span className="text-muted-foreground">Show Rate: </span>
                <span className="font-semibold text-amber-600">{showRate}%</span>
              </div>
              <div className="text-center">
                <span className="text-muted-foreground">Close Rate: </span>
                <span className="font-semibold text-green-600">{closeRate}%</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
