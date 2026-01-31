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

interface AdsFunnelChartProps {
  totalLeads: number;
  totalAppointments: number;
  approvedSales: number;
  loading?: boolean;
}

export function AdsFunnelChart({
  totalLeads,
  totalAppointments,
  approvedSales,
  loading,
}: AdsFunnelChartProps) {
  const leadToApptRate = totalLeads > 0 ? (totalAppointments / totalLeads) * 100 : 0;
  const apptToSaleRate = totalAppointments > 0 ? (approvedSales / totalAppointments) * 100 : 0;
  const leadToSaleRate = totalLeads > 0 ? (approvedSales / totalLeads) * 100 : 0;

  const funnelData = [
    { name: "Leads", value: totalLeads, rate: 100, fill: "#3b82f6" },
    { name: "Appointments", value: totalAppointments, rate: leadToApptRate, fill: "#f59e0b" },
    { name: "Sales", value: approvedSales, rate: leadToSaleRate, fill: "#22c55e" },
  ];

  return (
    <Card className="bg-white/95 backdrop-blur">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          🔻 Funnel Conversion
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-[200px] w-full" />
        ) : (
          <div className="space-y-4">
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={funnelData} layout="vertical" margin={{ left: 10, right: 60 }}>
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="name" width={90} />
                <Tooltip
                  formatter={(value: number, name: string) => [value.toLocaleString(), name]}
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {funnelData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                  <LabelList
                    dataKey="value"
                    position="right"
                    formatter={(value: number) => value.toLocaleString()}
                    style={{ fill: "hsl(var(--foreground))", fontSize: 12 }}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-3 gap-2 text-center text-sm">
              <div className="bg-blue-50 rounded-lg p-2">
                <div className="text-blue-600 font-semibold">{leadToApptRate.toFixed(1)}%</div>
                <div className="text-muted-foreground text-xs">Lead → Appt</div>
              </div>
              <div className="bg-yellow-50 rounded-lg p-2">
                <div className="text-yellow-600 font-semibold">{apptToSaleRate.toFixed(1)}%</div>
                <div className="text-muted-foreground text-xs">Appt → Sale</div>
              </div>
              <div className="bg-green-50 rounded-lg p-2">
                <div className="text-green-600 font-semibold">{leadToSaleRate.toFixed(1)}%</div>
                <div className="text-muted-foreground text-xs">Lead → Sale</div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
