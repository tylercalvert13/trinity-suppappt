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
import { useIsMobile } from "@/hooks/use-mobile";

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
  const isMobile = useIsMobile();
  const leadToApptRate = totalLeads > 0 ? (totalAppointments / totalLeads) * 100 : 0;
  const apptToSaleRate = totalAppointments > 0 ? (approvedSales / totalAppointments) * 100 : 0;
  const leadToSaleRate = totalLeads > 0 ? (approvedSales / totalLeads) * 100 : 0;

  const funnelData = [
    { name: isMobile ? "Leads" : "Leads", value: totalLeads, rate: 100, fill: "#3b82f6" },
    { name: isMobile ? "Appts" : "Appointments", value: totalAppointments, rate: leadToApptRate, fill: "#f59e0b" },
    { name: "Sales", value: approvedSales, rate: leadToSaleRate, fill: "#22c55e" },
  ];

  return (
    <Card className="bg-white/95 backdrop-blur">
      <CardHeader className="pb-2 sm:pb-4">
        <CardTitle className="text-base sm:text-lg flex items-center gap-2">
          🔻 Funnel Conversion
        </CardTitle>
      </CardHeader>
      <CardContent className="px-2 sm:px-6">
        {loading ? (
          <Skeleton className="h-[160px] sm:h-[200px] w-full" />
        ) : (
          <div className="space-y-3 sm:space-y-4">
            <ResponsiveContainer width="100%" height={isMobile ? 140 : 180}>
              <BarChart 
                data={funnelData} 
                layout="vertical" 
                margin={{ left: isMobile ? 0 : 10, right: isMobile ? 40 : 60 }}
              >
                <XAxis type="number" hide />
                <YAxis 
                  type="category" 
                  dataKey="name" 
                  width={isMobile ? 50 : 90}
                  tick={{ fontSize: isMobile ? 10 : 12 }}
                />
                <Tooltip
                  formatter={(value: number, name: string) => [value.toLocaleString(), name]}
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    fontSize: isMobile ? 12 : 14,
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
                    style={{ fill: "hsl(var(--foreground))", fontSize: isMobile ? 10 : 12 }}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-3 gap-1.5 sm:gap-2 text-center">
              <div className="bg-blue-50 rounded-lg p-1.5 sm:p-2">
                <div className="text-blue-600 font-semibold text-xs sm:text-sm">{leadToApptRate.toFixed(1)}%</div>
                <div className="text-muted-foreground text-[10px] sm:text-xs">Lead → Appt</div>
              </div>
              <div className="bg-yellow-50 rounded-lg p-1.5 sm:p-2">
                <div className="text-yellow-600 font-semibold text-xs sm:text-sm">{apptToSaleRate.toFixed(1)}%</div>
                <div className="text-muted-foreground text-[10px] sm:text-xs">Appt → Sale</div>
              </div>
              <div className="bg-green-50 rounded-lg p-1.5 sm:p-2">
                <div className="text-green-600 font-semibold text-xs sm:text-sm">{leadToSaleRate.toFixed(1)}%</div>
                <div className="text-muted-foreground text-[10px] sm:text-xs">Lead → Sale</div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
