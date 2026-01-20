import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

interface TimeSeriesData {
  date: string;
  visitors: number;
  calls: number;
  qualified: number;
}

interface TimeSeriesChartProps {
  data: TimeSeriesData[];
}

export const TimeSeriesChart = ({ data }: TimeSeriesChartProps) => {
  return (
    <Card className="col-span-full">
      <CardHeader>
        <CardTitle className="text-lg">Traffic Over Time</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip 
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
              }}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="visitors" 
              stroke="hsl(var(--primary))" 
              strokeWidth={2}
              name="Visitors"
            />
            <Line 
              type="monotone" 
              dataKey="qualified" 
              stroke="hsl(var(--chart-2))" 
              strokeWidth={2}
              name="Qualified"
            />
            <Line 
              type="monotone" 
              dataKey="calls" 
              stroke="hsl(var(--chart-3))" 
              strokeWidth={2}
              name="Calls"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
