import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { DollarSign, TrendingDown, PiggyBank, Award } from "lucide-react";

interface CarrierData {
  carrier: string;
  count: number;
  avgSavings: number;
}

interface SavingsMetricsProps {
  avgCurrentPayment: number;
  avgQuotedRate: number;
  avgMonthlySavings: number;
  avgAnnualSavings: number;
  topCarriers: CarrierData[];
}

const COLORS = ['#22c55e', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444'];

export const SavingsMetrics = ({
  avgCurrentPayment,
  avgQuotedRate,
  avgMonthlySavings,
  avgAnnualSavings,
  topCarriers,
}: SavingsMetricsProps) => {
  const savingsPercentage = avgCurrentPayment > 0 
    ? ((avgCurrentPayment - avgQuotedRate) / avgCurrentPayment) * 100 
    : 0;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Current Payment</p>
                <p className="text-2xl font-bold">${avgCurrentPayment.toFixed(0)}</p>
                <p className="text-xs text-muted-foreground">What they're paying</p>
              </div>
              <DollarSign className="h-8 w-8 text-gray-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Quoted Rate</p>
                <p className="text-2xl font-bold text-green-600">${avgQuotedRate.toFixed(0)}</p>
                <p className="text-xs text-muted-foreground">Our best rate</p>
              </div>
              <TrendingDown className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Monthly Savings</p>
                <p className="text-2xl font-bold text-green-600">${avgMonthlySavings.toFixed(0)}</p>
                <p className="text-xs text-muted-foreground">{savingsPercentage.toFixed(0)}% savings</p>
              </div>
              <PiggyBank className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Annual Savings</p>
                <p className="text-2xl font-bold text-green-600">${avgAnnualSavings.toFixed(0)}</p>
                <p className="text-xs text-muted-foreground">Per year</p>
              </div>
              <Award className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Top Quoted Carriers</CardTitle>
        </CardHeader>
        <CardContent>
          {topCarriers.length === 0 ? (
            <div className="flex items-center justify-center h-[200px]">
              <p className="text-muted-foreground">No carrier data yet</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={topCarriers} layout="vertical" margin={{ left: 100, right: 40 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" />
                <YAxis dataKey="carrier" type="category" width={90} tick={{ fontSize: 12 }} />
                <Tooltip 
                  formatter={(value: number, name: string) => {
                    if (name === 'count') return [value, 'Quotes'];
                    return [`$${value.toFixed(0)}`, 'Avg Savings'];
                  }}
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                  {topCarriers.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
