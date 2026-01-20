import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

interface PageComparisonData {
  metric: string;
  supp: number;
  supp1: number;
}

interface PageComparisonProps {
  data: PageComparisonData[];
}

export const PageComparison = ({ data }: PageComparisonProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">/supp vs /supp1 Comparison</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="metric" />
            <YAxis />
            <Tooltip 
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
              }}
            />
            <Legend />
            <Bar dataKey="supp" name="/supp" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            <Bar dataKey="supp1" name="/supp1" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
