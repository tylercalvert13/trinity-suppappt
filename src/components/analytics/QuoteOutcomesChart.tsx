import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

interface OutcomeData {
  name: string;
  value: number;
  percentage: number;
}

interface QuoteOutcomesChartProps {
  data: OutcomeData[];
}

const COLORS: Record<string, string> = {
  'Beat Rate': '#22c55e',
  'Couldn\'t Beat': '#f97316',
  'DQ - Health Condition': '#ef4444',
  'DQ - Recent Treatment': '#dc2626',
  'DQ - Medications': '#b91c1c',
  'Abandoned': '#6b7280',
};

export const QuoteOutcomesChart = ({ data }: QuoteOutcomesChartProps) => {
  if (data.length === 0 || data.every(d => d.value === 0)) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quote Outcomes</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[300px]">
          <p className="text-muted-foreground">No outcome data yet</p>
        </CardContent>
      </Card>
    );
  }

  const filteredData = data.filter(d => d.value > 0);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-card border rounded-lg p-3 shadow-lg">
          <p className="font-semibold">{data.name}</p>
          <p className="text-sm">Count: <span className="font-medium">{data.value.toLocaleString()}</span></p>
          <p className="text-sm">Percentage: <span className="font-medium">{data.percentage.toFixed(1)}%</span></p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Quote Outcomes</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={filteredData}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={100}
              fill="#8884d8"
              dataKey="value"
              nameKey="name"
              label={({ name, percentage }) => `${percentage.toFixed(0)}%`}
            >
              {filteredData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[entry.name] || '#8884d8'} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
