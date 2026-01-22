import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { Users, Heart, Cigarette, UserPlus } from "lucide-react";

interface DemographicData {
  ageDistribution: { range: string; count: number }[];
  genderBreakdown: { gender: string; count: number; percentage: number }[];
  tobaccoBreakdown: { status: string; count: number; percentage: number }[];
  spouseBreakdown: { status: string; count: number; percentage: number }[];
  planBreakdown: { plan: string; count: number; percentage: number }[];
  topZipPrefixes: { prefix: string; count: number }[];
}

interface DemographicInsightsProps {
  data: DemographicData;
}

const GENDER_COLORS = { 'Male': '#3b82f6', 'Female': '#ec4899', 'Unknown': '#6b7280' };
const TOBACCO_COLORS = { 'Non-Tobacco': '#22c55e', 'Tobacco': '#ef4444', 'Unknown': '#6b7280' };
const PLAN_COLORS = { 'Plan G': '#8b5cf6', 'Plan N': '#f59e0b', 'Unknown': '#6b7280' };

export const DemographicInsights = ({ data }: DemographicInsightsProps) => {
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const d = payload[0].payload;
      return (
        <div className="bg-card border rounded-lg p-2 shadow-lg text-sm">
          <p className="font-medium">{d.gender || d.status || d.plan || d.range || d.prefix}</p>
          <p>Count: {d.count}</p>
          {d.percentage !== undefined && <p>{d.percentage.toFixed(1)}%</p>}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Age Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="h-5 w-5" />
            Age Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data.ageDistribution.length === 0 ? (
            <div className="flex items-center justify-center h-[200px]">
              <p className="text-muted-foreground">No age data yet</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={data.ageDistribution} margin={{ left: 0, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="range" tick={{ fontSize: 11 }} />
                <YAxis />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Gender & Plan Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Heart className="h-5 w-5" />
            Gender & Plan Type
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            {/* Gender */}
            <div>
              <p className="text-xs text-muted-foreground text-center mb-2">Gender</p>
              {data.genderBreakdown.filter(g => g.count > 0).length === 0 ? (
                <p className="text-center text-muted-foreground text-sm">No data</p>
              ) : (
                <ResponsiveContainer width="100%" height={120}>
                  <PieChart>
                    <Pie
                      data={data.genderBreakdown.filter(g => g.count > 0)}
                      cx="50%"
                      cy="50%"
                      innerRadius={25}
                      outerRadius={45}
                      dataKey="count"
                      nameKey="gender"
                    >
                      {data.genderBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={GENDER_COLORS[entry.gender as keyof typeof GENDER_COLORS] || '#6b7280'} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              )}
              <div className="flex justify-center gap-3 text-xs">
                {data.genderBreakdown.filter(g => g.count > 0).map((g, i) => (
                  <div key={i} className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: GENDER_COLORS[g.gender as keyof typeof GENDER_COLORS] || '#6b7280' }} />
                    <span>{g.gender}</span>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Plan Type */}
            <div>
              <p className="text-xs text-muted-foreground text-center mb-2">Plan Type</p>
              {data.planBreakdown.filter(p => p.count > 0).length === 0 ? (
                <p className="text-center text-muted-foreground text-sm">No data</p>
              ) : (
                <ResponsiveContainer width="100%" height={120}>
                  <PieChart>
                    <Pie
                      data={data.planBreakdown.filter(p => p.count > 0)}
                      cx="50%"
                      cy="50%"
                      innerRadius={25}
                      outerRadius={45}
                      dataKey="count"
                      nameKey="plan"
                    >
                      {data.planBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={PLAN_COLORS[entry.plan as keyof typeof PLAN_COLORS] || '#6b7280'} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              )}
              <div className="flex justify-center gap-3 text-xs">
                {data.planBreakdown.filter(p => p.count > 0).map((p, i) => (
                  <div key={i} className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: PLAN_COLORS[p.plan as keyof typeof PLAN_COLORS] || '#6b7280' }} />
                    <span>{p.plan}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tobacco & Spouse */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Cigarette className="h-5 w-5" />
            Tobacco & Spouse Coverage
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            {/* Tobacco */}
            <div>
              <p className="text-xs text-muted-foreground text-center mb-2">Tobacco Status</p>
              {data.tobaccoBreakdown.filter(t => t.count > 0).length === 0 ? (
                <p className="text-center text-muted-foreground text-sm">No data</p>
              ) : (
                <div className="space-y-2">
                  {data.tobaccoBreakdown.filter(t => t.count > 0).map((t, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: TOBACCO_COLORS[t.status as keyof typeof TOBACCO_COLORS] || '#6b7280' }} />
                        <span className="text-sm">{t.status}</span>
                      </div>
                      <span className="text-sm font-medium">{t.count} ({t.percentage.toFixed(0)}%)</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Spouse */}
            <div>
              <p className="text-xs text-muted-foreground text-center mb-2">Spouse Coverage</p>
              {data.spouseBreakdown.filter(s => s.count > 0).length === 0 ? (
                <p className="text-center text-muted-foreground text-sm">No data</p>
              ) : (
                <div className="space-y-2">
                  {data.spouseBreakdown.filter(s => s.count > 0).map((s, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <UserPlus className="h-3 w-3 text-muted-foreground" />
                        <span className="text-sm">{s.status}</span>
                      </div>
                      <span className="text-sm font-medium">{s.count} ({s.percentage.toFixed(0)}%)</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Top Zip Prefixes */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Top Geographic Areas (Zip Prefix)</CardTitle>
        </CardHeader>
        <CardContent>
          {data.topZipPrefixes.length === 0 ? (
            <div className="flex items-center justify-center h-[150px]">
              <p className="text-muted-foreground">No geographic data yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-5 gap-2">
              {data.topZipPrefixes.slice(0, 10).map((z, i) => (
                <div key={i} className="text-center p-2 bg-muted rounded-lg">
                  <p className="text-lg font-bold">{z.prefix}xx</p>
                  <p className="text-xs text-muted-foreground">{z.count} leads</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
