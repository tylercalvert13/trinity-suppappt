import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

interface TimeSeriesData {
  date: string;
  visitors: number;
  quotes: number;
  beatRate: number;
  avgSavings: number;
}

interface QuoteFunnelTimeSeriesProps {
  data: TimeSeriesData[];
}

export const QuoteFunnelTimeSeries = ({ data }: QuoteFunnelTimeSeriesProps) => {
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quote Funnel Trends</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[300px]">
          <p className="text-muted-foreground">No time series data yet</p>
        </CardContent>
      </Card>
    );
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border rounded-lg p-3 shadow-lg">
          <p className="font-semibold mb-2">{label}</p>
          {payload.map((item: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: item.color }}>
              {item.name}: {item.name === 'Avg Savings' ? `$${item.value.toFixed(0)}` : 
                           item.name === 'Beat Rate %' ? `${item.value.toFixed(1)}%` : 
                           item.value.toLocaleString()}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Quote Funnel Trends Over Time</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" tick={{ fontSize: 12 }} />
            <YAxis yAxisId="left" />
            <YAxis yAxisId="right" orientation="right" />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Line 
              yAxisId="left"
              type="monotone" 
              dataKey="visitors" 
              stroke="#3b82f6" 
              strokeWidth={2}
              name="Visitors"
              dot={{ r: 3 }}
            />
            <Line 
              yAxisId="left"
              type="monotone" 
              dataKey="quotes" 
              stroke="#22c55e" 
              strokeWidth={2}
              name="Quotes"
              dot={{ r: 3 }}
            />
            <Line 
              yAxisId="right"
              type="monotone" 
              dataKey="beatRate" 
              stroke="#f59e0b" 
              strokeWidth={2}
              name="Beat Rate %"
              dot={{ r: 3 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
