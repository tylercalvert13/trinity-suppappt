import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList } from "recharts";

interface FunnelStep {
  step: string;
  label: string;
  count: number;
  percentage: number;
  dropoff: number;
}

interface QuoteFunnelDropoffProps {
  data: FunnelStep[];
}

const COLORS = {
  high: '#22c55e',    // Green for high retention
  medium: '#eab308',  // Yellow for medium
  low: '#ef4444',     // Red for high dropoff
};

const getBarColor = (dropoff: number) => {
  if (dropoff < 10) return COLORS.high;
  if (dropoff < 30) return COLORS.medium;
  return COLORS.low;
};

export const QuoteFunnelDropoff = ({ data }: QuoteFunnelDropoffProps) => {
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Funnel Drop-off Analysis</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[400px]">
          <p className="text-muted-foreground">No funnel data yet</p>
        </CardContent>
      </Card>
    );
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-card border rounded-lg p-3 shadow-lg">
          <p className="font-semibold">{data.label}</p>
          <p className="text-sm">Reached: <span className="font-medium">{data.count.toLocaleString()}</span></p>
          <p className="text-sm">% of start: <span className="font-medium">{data.percentage.toFixed(1)}%</span></p>
          {data.dropoff > 0 && (
            <p className="text-sm text-red-500">Drop-off: <span className="font-medium">{data.dropoff.toFixed(1)}%</span></p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">12-Step Funnel Drop-off Analysis</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 20, right: 80, left: 100, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
            <XAxis type="number" domain={[0, 'dataMax']} />
            <YAxis 
              dataKey="label" 
              type="category" 
              width={90}
              tick={{ fontSize: 12 }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="count" radius={[0, 4, 4, 0]}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getBarColor(entry.dropoff)} />
              ))}
              <LabelList 
                dataKey="count" 
                position="right" 
                formatter={(value: number) => value.toLocaleString()}
                className="text-xs"
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div className="flex justify-center gap-6 mt-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: COLORS.high }} />
            <span>&lt;10% drop-off</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: COLORS.medium }} />
            <span>10-30% drop-off</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: COLORS.low }} />
            <span>&gt;30% drop-off</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
