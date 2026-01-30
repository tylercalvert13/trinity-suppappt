import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { RefreshCw, TrendingUp, DollarSign, Users, CheckCircle, Clock, FileText } from "lucide-react";

const TRACKING_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vRsCOzfJF0q1V49FLlNRi6FYVac_rlo-xsGZOhTi6hVI_lcHb-2-TC9LOL5RiMRT0A5cA8jei4V3hv2/pub?gid=100064359&single=true&output=csv";
const SUBMISSIONS_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vRsCOzfJF0q1V49FLlNRi6FYVac_rlo-xsGZOhTi6hVI_lcHb-2-TC9LOL5RiMRT0A5cA8jei4V3hv2/pub?gid=1684442142&single=true&output=csv";

const CHART_COLORS = [
  "#3b82f6",
  "#22c55e",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
  "#06b6d4",
  "#84cc16",
];

interface Submission {
  date: string;
  clientName: string;
  agent: string;
  premium: number;
  commission: number;
  status: string;
}

interface AgentStats {
  name: string;
  sales: number;
  premium: number;
  commission: number;
  approved: number;
}

interface DailyStats {
  date: string;
  sales: number;
}

interface DashboardData {
  totalSales: number;
  approved: number;
  pending: number;
  denied: number;
  totalPremium: number;
  totalCommission: number;
  totalLeads: number;
  dailyStats: DailyStats[];
  agentStats: AgentStats[];
  recentSubmissions: Submission[];
}

// Parse CSV handling quoted values with commas
function parseCSV(text: string): Record<string, string>[] {
  const lines = text.split("\n").filter((line) => line.trim());
  if (lines.length < 2) return [];

  const headers = parseCSVLine(lines[0]);
  const data: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    const row: Record<string, string> = {};
    headers.forEach((header, index) => {
      row[header.trim()] = values[index]?.trim() || "";
    });
    data.push(row);
  }

  return data;
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

function parseNumber(value: string): number {
  if (!value) return 0;
  const cleaned = value.replace(/[$,]/g, "");
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  return `${String(date.getMonth() + 1).padStart(2, "0")}/${String(date.getDate()).padStart(2, "0")}`;
}

export default function SalesTracking() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [trackingRes, submissionsRes] = await Promise.all([
        fetch(TRACKING_URL),
        fetch(SUBMISSIONS_URL),
      ]);

      if (!trackingRes.ok || !submissionsRes.ok) {
        throw new Error("Failed to fetch data from Google Sheets");
      }

      const [trackingText, submissionsText] = await Promise.all([
        trackingRes.text(),
        submissionsRes.text(),
      ]);

      const trackingData = parseCSV(trackingText);
      const submissionsData = parseCSV(submissionsText);

      // Process submissions
      const submissions: Submission[] = submissionsData.map((row) => ({
        date: row["Date"] || row["date"] || "",
        clientName: row["Client Name"] || row["clientName"] || row["Name"] || "",
        agent: row["Agent"] || row["agent"] || "",
        premium: parseNumber(row["Premium"] || row["premium"] || "0"),
        commission: parseNumber(row["Commission"] || row["commission"] || "0"),
        status: row["Status"] || row["status"] || "Pending",
      }));

      // Calculate totals
      let approved = 0;
      let pending = 0;
      let denied = 0;
      let totalPremium = 0;
      let totalCommission = 0;

      submissions.forEach((sub) => {
        const status = sub.status.toLowerCase();
        if (status === "approved") {
          approved++;
          totalPremium += sub.premium;
          totalCommission += sub.commission;
        } else if (status === "pending") {
          pending++;
        } else if (status === "denied" || status === "rejected") {
          denied++;
        }
      });

      // Agent stats
      const agentMap = new Map<string, AgentStats>();
      submissions.forEach((sub) => {
        if (!sub.agent) return;
        const existing = agentMap.get(sub.agent) || {
          name: sub.agent,
          sales: 0,
          premium: 0,
          commission: 0,
          approved: 0,
        };
        existing.sales++;
        if (sub.status.toLowerCase() === "approved") {
          existing.approved++;
          existing.premium += sub.premium;
          existing.commission += sub.commission;
        }
        agentMap.set(sub.agent, existing);
      });

      const agentStats = Array.from(agentMap.values()).sort(
        (a, b) => b.sales - a.sales
      );

      // Daily stats from tracking sheet or aggregate from submissions
      let dailyStats: DailyStats[] = [];
      if (trackingData.length > 0) {
        dailyStats = trackingData
          .slice(-7)
          .map((row) => ({
            date: formatDate(row["Date"] || row["date"] || ""),
            sales: parseNumber(row["Sales"] || row["sales"] || row["Count"] || "0"),
          }))
          .filter((d) => d.date);
      }

      // If no tracking data, aggregate from submissions
      if (dailyStats.length === 0) {
        const dateMap = new Map<string, number>();
        submissions.forEach((sub) => {
          const date = formatDate(sub.date);
          if (date) {
            dateMap.set(date, (dateMap.get(date) || 0) + 1);
          }
        });
        dailyStats = Array.from(dateMap.entries())
          .map(([date, sales]) => ({ date, sales }))
          .slice(-7);
      }

      // Recent submissions (last 5)
      const recentSubmissions = [...submissions]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 5);

      setData({
        totalSales: approved + pending,
        approved,
        pending,
        denied,
        totalPremium,
        totalCommission,
        totalLeads: submissions.length,
        dailyStats,
        agentStats,
        recentSubmissions,
      });
      setLastUpdated(new Date());
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const getStatusBadge = (status: string) => {
    const s = status.toLowerCase();
    if (s === "approved") {
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Approved</Badge>;
    } else if (s === "pending") {
      return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Pending</Badge>;
    } else if (s === "denied" || s === "rejected") {
      return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Denied</Badge>;
    }
    return <Badge variant="outline">{status}</Badge>;
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <p className="text-destructive mb-4">{error}</p>
            <Button onClick={fetchData}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl md:text-4xl font-bold text-white flex items-center justify-center gap-2">
            🏥 Health Helpers Dashboard
          </h1>
          <p className="text-blue-200 text-lg">Medicare Supplement Sales Tracker</p>
          <div className="flex items-center justify-center gap-4 text-sm text-blue-300">
            <span>
              Last updated: {lastUpdated ? lastUpdated.toLocaleString() : "—"}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchData}
              disabled={loading}
              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              <RefreshCw className={`h-4 w-4 mr-1 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <StatCard
            title="Total Sales"
            value={loading ? null : data?.totalSales ?? 0}
            icon={<TrendingUp className="h-5 w-5" />}
            subtitle="▲ Live data"
            loading={loading}
          />
          <StatCard
            title="Approved"
            value={loading ? null : data?.approved ?? 0}
            icon={<CheckCircle className="h-5 w-5 text-green-500" />}
            subtitle={
              data && data.totalSales > 0
                ? `${Math.round((data.approved / data.totalSales) * 100)}% rate`
                : "—"
            }
            loading={loading}
          />
          <StatCard
            title="Pending"
            value={loading ? null : data?.pending ?? 0}
            icon={<Clock className="h-5 w-5 text-yellow-500" />}
            subtitle="Awaiting decision"
            loading={loading}
          />
          <StatCard
            title="Total Premium"
            value={loading ? null : formatCurrency(data?.totalPremium ?? 0)}
            icon={<DollarSign className="h-5 w-5 text-green-500" />}
            subtitle="▲ Live data"
            loading={loading}
          />
          <StatCard
            title="Total Commission"
            value={loading ? null : formatCurrency(data?.totalCommission ?? 0)}
            icon={<DollarSign className="h-5 w-5 text-blue-500" />}
            subtitle="▲ Live data"
            loading={loading}
          />
        </div>

        {/* Charts Row */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Sales by Day Chart */}
          <Card className="bg-white/95 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                📈 Sales by Day
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-[250px] w-full" />
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={data?.dailyStats || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis allowDecimals={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                    <Bar dataKey="sales" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Sales by Agent Chart */}
          <Card className="bg-white/95 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                👥 Sales by Agent
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-[250px] w-full" />
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={data?.agentStats || []}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="sales"
                      nameKey="name"
                      label={({ name, sales }) => `${name.split(" ")[0]}: ${sales}`}
                      labelLine={false}
                    >
                      {data?.agentStats?.map((_, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={CHART_COLORS[index % CHART_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Tables Row */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Top Agents Table */}
          <Card className="bg-white/95 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                🏆 Top Agents
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Agent</TableHead>
                      <TableHead className="text-right">Sales</TableHead>
                      <TableHead className="text-right">Premium</TableHead>
                      <TableHead className="text-right">Commission</TableHead>
                      <TableHead className="text-right">Approved</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data?.agentStats?.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground">
                          No agent data yet
                        </TableCell>
                      </TableRow>
                    ) : (
                      data?.agentStats?.map((agent, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{agent.name}</TableCell>
                          <TableCell className="text-right">{agent.sales}</TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(agent.premium)}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(agent.commission)}
                          </TableCell>
                          <TableCell className="text-right">
                            {agent.approved}/{agent.sales}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Recent Submissions Table */}
          <Card className="bg-white/95 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Recent Submissions
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Agent</TableHead>
                      <TableHead className="text-right">Premium</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data?.recentSubmissions?.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground">
                          No submissions yet
                        </TableCell>
                      </TableRow>
                    ) : (
                      data?.recentSubmissions?.map((sub, index) => (
                        <TableRow key={index}>
                          <TableCell>{formatDate(sub.date)}</TableCell>
                          <TableCell className="font-medium">{sub.clientName}</TableCell>
                          <TableCell>{sub.agent}</TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(sub.premium)}
                          </TableCell>
                          <TableCell>{getStatusBadge(sub.status)}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: string | number | null;
  icon: React.ReactNode;
  subtitle?: string;
  loading?: boolean;
}

function StatCard({ title, value, icon, subtitle, loading }: StatCardProps) {
  return (
    <Card className="bg-white/95 backdrop-blur">
      <CardContent className="pt-4 pb-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            {title}
          </span>
          {icon}
        </div>
        {loading ? (
          <Skeleton className="h-8 w-20" />
        ) : (
          <p className="text-2xl font-bold">{value}</p>
        )}
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
        )}
      </CardContent>
    </Card>
  );
}
