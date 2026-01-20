import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { OverviewCards } from "@/components/analytics/OverviewCards";
import { FunnelChart } from "@/components/analytics/FunnelChart";
import { TrafficSourcesTable } from "@/components/analytics/TrafficSourcesTable";
import { DisqualificationChart } from "@/components/analytics/DisqualificationChart";
import { TimeSeriesChart } from "@/components/analytics/TimeSeriesChart";
import { LiveActivityFeed } from "@/components/analytics/LiveActivityFeed";
import { DeviceBreakdown } from "@/components/analytics/DeviceBreakdown";
import { PageComparison } from "@/components/analytics/PageComparison";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LogOut, RefreshCw, BarChart3 } from "lucide-react";
import { format, subDays, startOfDay, endOfDay } from "date-fns";

interface Session {
  id: string;
  page: string;
  completed: boolean;
  called: boolean;
  device_type: string;
  started_at: string;
  last_step: string;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
}

interface Event {
  id: string;
  page: string;
  event_type: string;
  step: string | null;
  outcome: string | null;
  created_at: string;
}

const Analytics = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState("7");
  const [sessions, setSessions] = useState<Session[]>([]);
  const [events, setEvents] = useState<Event[]>([]);

  useEffect(() => {
    const token = sessionStorage.getItem('analytics_token');
    if (!token) {
      navigate('/analytics-login');
      return;
    }

    fetchData();
  }, [navigate, dateRange]);

  const fetchData = async () => {
    setIsLoading(true);
    const daysAgo = parseInt(dateRange);
    const startDate = startOfDay(subDays(new Date(), daysAgo)).toISOString();
    const endDate = endOfDay(new Date()).toISOString();

    try {
      const [sessionsRes, eventsRes] = await Promise.all([
        supabase
          .from('funnel_sessions')
          .select('*')
          .gte('started_at', startDate)
          .lte('started_at', endDate)
          .order('started_at', { ascending: false }),
        supabase
          .from('funnel_events')
          .select('*')
          .gte('created_at', startDate)
          .lte('created_at', endDate)
          .order('created_at', { ascending: false }),
      ]);

      if (sessionsRes.data) setSessions(sessionsRes.data);
      if (eventsRes.data) setEvents(eventsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('analytics_token');
    sessionStorage.removeItem('analytics_email');
    navigate('/analytics-login');
  };

  // Calculate metrics
  const totalVisitors = sessions.length;
  const totalCalls = sessions.filter(s => s.called).length;
  const qualifiedSessions = sessions.filter(s => s.completed).length;
  const conversionRate = totalVisitors > 0 ? (totalCalls / totalVisitors) * 100 : 0;
  const qualifiedRate = totalVisitors > 0 ? (qualifiedSessions / totalVisitors) * 100 : 0;

  // Today's metrics
  const today = format(new Date(), 'yyyy-MM-dd');
  const todaySessions = sessions.filter(s => s.started_at.startsWith(today));
  const todayVisitors = todaySessions.length;
  const todayCalls = todaySessions.filter(s => s.called).length;

  // Funnel data for /supp
  const suppSessions = sessions.filter(s => s.page === 'supp');
  const suppFunnelData = [
    { step: 'start', label: 'Page View', count: suppSessions.length, percentage: 100 },
    { step: 'q1', label: 'Question 1', count: suppSessions.filter(s => ['q1', 'q2', 'q3', 'loading', 'qualified', 'disqualified'].includes(s.last_step)).length, percentage: 0 },
    { step: 'q2', label: 'Question 2', count: suppSessions.filter(s => ['q2', 'q3', 'loading', 'qualified', 'disqualified'].includes(s.last_step)).length, percentage: 0 },
    { step: 'q3', label: 'Question 3', count: suppSessions.filter(s => ['q3', 'loading', 'qualified', 'disqualified'].includes(s.last_step)).length, percentage: 0 },
    { step: 'qualified', label: 'Qualified', count: suppSessions.filter(s => s.completed).length, percentage: 0 },
  ].map(item => ({ ...item, percentage: suppSessions.length > 0 ? (item.count / suppSessions.length) * 100 : 0 }));

  // Funnel data for /supp1
  const supp1Sessions = sessions.filter(s => s.page === 'supp1');
  const supp1FunnelData = [
    { step: 'start', label: 'Page View', count: supp1Sessions.length, percentage: 100 },
    { step: 'q1', label: 'Question 1', count: supp1Sessions.filter(s => ['q1', 'q2', 'q3', 'loading', 'qualified', 'disqualified'].includes(s.last_step)).length, percentage: 0 },
    { step: 'q2', label: 'Question 2', count: supp1Sessions.filter(s => ['q2', 'q3', 'loading', 'qualified', 'disqualified'].includes(s.last_step)).length, percentage: 0 },
    { step: 'q3', label: 'Question 3', count: supp1Sessions.filter(s => ['q3', 'loading', 'qualified', 'disqualified'].includes(s.last_step)).length, percentage: 0 },
    { step: 'qualified', label: 'Qualified', count: supp1Sessions.filter(s => s.completed).length, percentage: 0 },
  ].map(item => ({ ...item, percentage: supp1Sessions.length > 0 ? (item.count / supp1Sessions.length) * 100 : 0 }));

  // Traffic sources data
  const trafficSourcesMap = new Map<string, { visitors: number; calls: number }>();
  sessions.forEach(s => {
    const key = `${s.utm_source || '(direct)'}|${s.utm_medium || '(none)'}|${s.utm_campaign || '(none)'}`;
    const current = trafficSourcesMap.get(key) || { visitors: 0, calls: 0 };
    trafficSourcesMap.set(key, {
      visitors: current.visitors + 1,
      calls: current.calls + (s.called ? 1 : 0),
    });
  });
  const trafficSources = Array.from(trafficSourcesMap.entries())
    .map(([key, value]) => {
      const [source, medium, campaign] = key.split('|');
      return {
        source,
        medium,
        campaign,
        visitors: value.visitors,
        calls: value.calls,
        conversionRate: value.visitors > 0 ? (value.calls / value.visitors) * 100 : 0,
      };
    })
    .sort((a, b) => b.visitors - a.visitors)
    .slice(0, 10);

  // Disqualification reasons
  const disqualificationEvents = events.filter(e => e.event_type === 'qualification' && e.outcome && e.outcome !== 'qualified');
  const disqualificationMap = new Map<string, number>();
  disqualificationEvents.forEach(e => {
    const reason = e.outcome || 'Unknown';
    disqualificationMap.set(reason, (disqualificationMap.get(reason) || 0) + 1);
  });
  const totalDisqualified = disqualificationEvents.length;
  const disqualificationData = Array.from(disqualificationMap.entries())
    .map(([reason, count]) => ({
      reason,
      count,
      percentage: totalDisqualified > 0 ? (count / totalDisqualified) * 100 : 0,
    }))
    .sort((a, b) => b.count - a.count);

  // Device breakdown
  const deviceMap = new Map<string, number>();
  sessions.forEach(s => {
    deviceMap.set(s.device_type, (deviceMap.get(s.device_type) || 0) + 1);
  });
  const deviceData = ['mobile', 'tablet', 'desktop'].map(device => ({
    device,
    count: deviceMap.get(device) || 0,
    percentage: totalVisitors > 0 ? ((deviceMap.get(device) || 0) / totalVisitors) * 100 : 0,
  }));

  // Time series data
  const timeSeriesMap = new Map<string, { visitors: number; calls: number; qualified: number }>();
  sessions.forEach(s => {
    const date = format(new Date(s.started_at), 'MM/dd');
    const current = timeSeriesMap.get(date) || { visitors: 0, calls: 0, qualified: 0 };
    timeSeriesMap.set(date, {
      visitors: current.visitors + 1,
      calls: current.calls + (s.called ? 1 : 0),
      qualified: current.qualified + (s.completed ? 1 : 0),
    });
  });
  const timeSeriesData = Array.from(timeSeriesMap.entries())
    .map(([date, value]) => ({ date, ...value }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // Page comparison
  const pageComparisonData = [
    { 
      metric: 'Visitors', 
      supp: suppSessions.length, 
      supp1: supp1Sessions.length 
    },
    { 
      metric: 'Qualified', 
      supp: suppSessions.filter(s => s.completed).length, 
      supp1: supp1Sessions.filter(s => s.completed).length 
    },
    { 
      metric: 'Calls', 
      supp: suppSessions.filter(s => s.called).length, 
      supp1: supp1Sessions.filter(s => s.called).length 
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BarChart3 className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-xl font-bold">Funnel Analytics</h1>
              <p className="text-sm text-muted-foreground">
                Tracking /supp and /supp1 pages
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Date range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Today</SelectItem>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" onClick={fetchData} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        <OverviewCards
          totalVisitors={totalVisitors}
          totalCalls={totalCalls}
          conversionRate={conversionRate}
          qualifiedRate={qualifiedRate}
          todayVisitors={todayVisitors}
          todayCalls={todayCalls}
        />

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="funnels">Funnels</TabsTrigger>
            <TabsTrigger value="sources">Traffic Sources</TabsTrigger>
            <TabsTrigger value="live">Live Activity</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <TimeSeriesChart data={timeSeriesData} />
            <div className="grid gap-4 md:grid-cols-2">
              <PageComparison data={pageComparisonData} />
              <DeviceBreakdown data={deviceData} />
            </div>
          </TabsContent>

          <TabsContent value="funnels" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <FunnelChart data={suppFunnelData} title="/supp Funnel (Article First)" />
              <FunnelChart data={supp1FunnelData} title="/supp1 Funnel (Direct Questions)" />
            </div>
            <DisqualificationChart data={disqualificationData} />
          </TabsContent>

          <TabsContent value="sources" className="space-y-4">
            <TrafficSourcesTable data={trafficSources} />
          </TabsContent>

          <TabsContent value="live" className="space-y-4">
            <LiveActivityFeed />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Analytics;
