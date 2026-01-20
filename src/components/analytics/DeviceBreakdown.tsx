import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { Smartphone, Tablet, Monitor } from "lucide-react";

interface DeviceData {
  device: string;
  count: number;
  percentage: number;
}

interface DeviceBreakdownProps {
  data: DeviceData[];
}

const COLORS = {
  mobile: '#3b82f6',
  tablet: '#8b5cf6',
  desktop: '#22c55e',
};

const ICONS = {
  mobile: <Smartphone className="h-4 w-4" />,
  tablet: <Tablet className="h-4 w-4" />,
  desktop: <Monitor className="h-4 w-4" />,
};

export const DeviceBreakdown = ({ data }: DeviceBreakdownProps) => {
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Device Breakdown</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[250px]">
          <p className="text-muted-foreground">No device data yet</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Device Breakdown</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4 mb-4">
          {data.map((item) => (
            <div key={item.device} className="text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                {ICONS[item.device as keyof typeof ICONS]}
                <span className="text-sm font-medium capitalize">{item.device}</span>
              </div>
              <p className="text-2xl font-bold">{item.percentage.toFixed(0)}%</p>
              <p className="text-xs text-muted-foreground">{item.count} visitors</p>
            </div>
          ))}
        </div>
        <ResponsiveContainer width="100%" height={150}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={40}
              outerRadius={60}
              fill="#8884d8"
              dataKey="count"
              nameKey="device"
            >
              {data.map((entry) => (
                <Cell key={entry.device} fill={COLORS[entry.device as keyof typeof COLORS]} />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value: number, name: string) => [value, name]}
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
