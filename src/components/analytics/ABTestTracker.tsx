import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Legend, LineChart, Line, Cell
} from "recharts";
import { Users, MousePointerClick, UserCheck, TrendingUp, TrendingDown } from "lucide-react";

interface VariantData {
  name: string;
  visitors: number;
  engagementRate: number;
  leadRate: number;
  funnelSteps: { step: string; label: string; count: number; percentage: number }[];
  dailyTrend: { date: string; visitors: number; engagementRate: number; leadRate: number }[];
}

interface ABTestTrackerProps {
  legacy: VariantData;
  variant: VariantData;
}

const LEGACY_COLOR = "hsl(var(--muted-foreground))";
const VARIANT_COLOR = "hsl(var(--primary))";

function LiftBadge({ lift }: { lift: number }) {
  if (!isFinite(lift) || isNaN(lift)) return null;
  const isPositive = lift > 0;
  const Icon = isPositive ? TrendingUp : TrendingDown;
  return (
    <Badge
      variant="outline"
      className={`ml-2 text-xs ${isPositive ? 'border-green-500 text-green-600' : 'border-red-500 text-red-600'}`}
    >
      <Icon className="w-3 h-3 mr-1" />
      {isPositive ? '+' : ''}{lift.toFixed(1)}%
    </Badge>
  );
}

function StatCard({ title, icon, legacyValue, variantValue, isPercentage }: {
  title: string;
  icon: React.ReactNode;
  legacyValue: number;
  variantValue: number;
  isPercentage?: boolean;
}) {
  const lift = legacyValue > 0 ? ((variantValue - legacyValue) / legacyValue) * 100 : 0;
  const fmt = (v: number) => isPercentage ? `${v.toFixed(1)}%` : v.toLocaleString();

  return (
    <Card>
      <CardContent className="pt-4 pb-3 px-4">
        <div className="flex items-center gap-2 mb-3">
          {icon}
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{title}</span>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-[10px] text-muted-foreground mb-0.5">Legacy</p>
            <p className="text-lg font-bold">{fmt(legacyValue)}</p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground mb-0.5 flex items-center">
              Calm Trust
              <LiftBadge lift={lift} />
            </p>
            <p className="text-lg font-bold text-primary">{fmt(variantValue)}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export const ABTestTracker = ({ legacy, variant }: ABTestTrackerProps) => {
  // Merge funnel steps for grouped bar chart
  const funnelComparison = variant.funnelSteps.map(vs => {
    const ls = legacy.funnelSteps.find(l => l.step === vs.step);
    return {
      label: vs.label,
      legacy: ls?.percentage ?? 0,
      calmTrust: vs.percentage,
    };
  });

  // Merge daily trends
  const allDates = new Set([
    ...legacy.dailyTrend.map(d => d.date),
    ...variant.dailyTrend.map(d => d.date),
  ]);
  const dailyComparison = Array.from(allDates)
    .sort()
    .map(date => {
      const l = legacy.dailyTrend.find(d => d.date === date);
      const v = variant.dailyTrend.find(d => d.date === date);
      return {
        date,
        legacyVisitors: l?.visitors ?? 0,
        variantVisitors: v?.visitors ?? 0,
        legacyLeadRate: l?.leadRate ?? 0,
        variantLeadRate: v?.leadRate ?? 0,
      };
    });

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          title="Visitors"
          icon={<Users className="h-4 w-4 text-muted-foreground" />}
          legacyValue={legacy.visitors}
          variantValue={variant.visitors}
        />
        <StatCard
          title="Engagement Rate"
          icon={<MousePointerClick className="h-4 w-4 text-muted-foreground" />}
          legacyValue={legacy.engagementRate}
          variantValue={variant.engagementRate}
          isPercentage
        />
        <StatCard
          title="Lead Rate"
          icon={<UserCheck className="h-4 w-4 text-muted-foreground" />}
          legacyValue={legacy.leadRate}
          variantValue={variant.leadRate}
          isPercentage
        />
      </div>

      {/* Funnel Comparison */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Funnel Step Comparison (% of visitors)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={funnelComparison} layout="vertical" margin={{ left: 80, right: 30 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" domain={[0, 100]} tickFormatter={v => `${v}%`} />
              <YAxis dataKey="label" type="category" width={80} />
              <Tooltip formatter={(value: number) => `${value.toFixed(1)}%`} 
                contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
              />
              <Legend />
              <Bar dataKey="legacy" name="Legacy" fill={LEGACY_COLOR} radius={[0, 4, 4, 0]} barSize={12} />
              <Bar dataKey="calmTrust" name="Calm Trust" fill={VARIANT_COLOR} radius={[0, 4, 4, 0]} barSize={12} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Daily Trend */}
      {dailyComparison.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Daily Visitors & Lead Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dailyComparison} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" tickFormatter={v => `${v}%`} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                  formatter={(value: number, name: string) =>
                    name.includes('Rate') ? `${value.toFixed(1)}%` : value
                  }
                />
                <Legend />
                <Line yAxisId="left" type="monotone" dataKey="legacyVisitors" name="Legacy Visitors" stroke={LEGACY_COLOR} strokeWidth={1.5} strokeDasharray="5 5" dot={false} />
                <Line yAxisId="left" type="monotone" dataKey="variantVisitors" name="Calm Trust Visitors" stroke={VARIANT_COLOR} strokeWidth={2} dot={false} />
                <Line yAxisId="right" type="monotone" dataKey="legacyLeadRate" name="Legacy Lead %" stroke={LEGACY_COLOR} strokeWidth={1.5} dot={false} />
                <Line yAxisId="right" type="monotone" dataKey="variantLeadRate" name="Calm Trust Lead %" stroke={VARIANT_COLOR} strokeWidth={2} dot />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
