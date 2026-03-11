import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { filterInternalSubmissions } from "@/lib/analyticsFilters";
import { OverviewCards } from "@/components/analytics/OverviewCards";
import { FunnelChart } from "@/components/analytics/FunnelChart";
import { TrafficSourcesTable } from "@/components/analytics/TrafficSourcesTable";
import { DisqualificationChart } from "@/components/analytics/DisqualificationChart";
import { TimeSeriesChart } from "@/components/analytics/TimeSeriesChart";
import { LiveActivityFeed } from "@/components/analytics/LiveActivityFeed";
import { DeviceBreakdown } from "@/components/analytics/DeviceBreakdown";
import { PageComparison } from "@/components/analytics/PageComparison";
import { QuoteFunnelOverview } from "@/components/analytics/QuoteFunnelOverview";
import { QuoteFunnelDropoff } from "@/components/analytics/QuoteFunnelDropoff";
import { QuoteOutcomesChart } from "@/components/analytics/QuoteOutcomesChart";
import { SavingsMetrics } from "@/components/analytics/SavingsMetrics";
import { CTABreakdown } from "@/components/analytics/CTABreakdown";
import { TrafficSourcePerformance } from "@/components/analytics/TrafficSourcePerformance";
import { DemographicInsights } from "@/components/analytics/DemographicInsights";
import { QuoteFunnelTimeSeries } from "@/components/analytics/QuoteFunnelTimeSeries";
import { AppointmentFunnelTab } from "@/components/analytics/AppointmentFunnelTab";
import { ABTestTracker } from "@/components/analytics/ABTestTracker";
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
  visitor_id: string;
  session_id: string;
  variant: string | null;
}

interface Event {
  id: string;
  page: string;
  event_type: string;
  step: string | null;
  outcome: string | null;
  answer: string | null;
  created_at: string;
  session_id: string;
  visitor_id: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  metadata: any;
}

interface Submission {
  id: string;
  page: string | null;
  submission_type: string;
  disqualification_reason: string | null;
  quoted_carrier: string | null;
  am_best_rating: string | null;
  created_at: string;
  age: number | null;
  visitor_id: string | null;
  session_id: string | null;
  annual_savings: number | null;
  monthly_savings: number | null;
  current_payment: number | null;
  quoted_rate: number | null;
  plan: string | null;
  care_or_condition: string | null;
  recent_treatment: string | null;
  medication_use: string | null;
  gender: string | null;
  tobacco: string | null;
  spouse: string | null;
  zip_code: string | null;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
}

const Analytics = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState("7");
  const [sessions, setSessions] = useState<Session[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);

  useEffect(() => {
    const token = sessionStorage.getItem('analytics_token');
    if (!token) {
      navigate('/analytics-login');
      return;
    }

    fetchData();
  }, [navigate, dateRange]);

  // Paginated fetch helper to bypass 1,000-row default limit
  const fetchAllRows = async <T,>(
    buildQuery: (offset: number, limit: number) => ReturnType<ReturnType<typeof supabase.from>['select']>
  ): Promise<T[]> => {
    const batchSize = 1000;
    let allData: T[] = [];
    let offset = 0;
    while (true) {
      const { data, error } = await buildQuery(offset, offset + batchSize - 1);
      if (error) throw error;
      if (!data || data.length === 0) break;
      allData = [...allData, ...(data as T[])];
      if (data.length < batchSize) break;
      offset += batchSize;
    }
    return allData;
  };

  const fetchData = async () => {
    setIsLoading(true);
    const daysAgo = dateRange === "1" ? 0 : parseInt(dateRange);
    const startDate = startOfDay(subDays(new Date(), daysAgo)).toISOString();
    const endDate = endOfDay(new Date()).toISOString();

    try {
      const [allSessions, allEvents, allSubmissions] = await Promise.all([
        fetchAllRows<Session>((from, to) =>
          supabase
            .from('funnel_sessions')
            .select('*')
            .gte('started_at', startDate)
            .lte('started_at', endDate)
            .order('started_at', { ascending: false })
            .range(from, to)
        ),
        fetchAllRows<Event>((from, to) =>
          supabase
            .from('funnel_events')
            .select('*')
            .gte('created_at', startDate)
            .lte('created_at', endDate)
            .order('created_at', { ascending: false })
            .range(from, to)
        ),
        fetchAllRows<Submission>((from, to) =>
          supabase
            .from('submissions')
            .select('*')
            .in('page', ['suppquote', 'suppappt', 'suppappt1', 'suppappt2'])
            .gte('created_at', startDate)
            .lte('created_at', endDate)
            .order('created_at', { ascending: false })
            .range(from, to)
        ),
      ]);

      // Filter out "an" source (Facebook Audience Network) - low quality traffic
      const filteredSessions = allSessions.filter(s => s.utm_source !== 'an');
      
      // Get session IDs to filter related events
      const validSessionIds = new Set(filteredSessions.map(s => s.session_id));
      
      const filteredEvents = allEvents.filter(e => validSessionIds.has(e.session_id));

      setSessions(filteredSessions);
      setEvents(filteredEvents);
      setSubmissions(filterInternalSubmissions(allSubmissions));
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

  // ============= GENERAL METRICS =============
  const totalVisitors = sessions.length;
  const totalCalls = sessions.filter(s => s.called).length;
  const qualifiedSessions = sessions.filter(s => s.completed).length;
  const conversionRate = totalVisitors > 0 ? (totalCalls / totalVisitors) * 100 : 0;
  const qualifiedRate = totalVisitors > 0 ? (qualifiedSessions / totalVisitors) * 100 : 0;

  // Today's metrics — use Eastern Time boundaries for accurate "today" filtering
  const todayET = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/New_York' }));
  const todayStartISO = new Date(Date.UTC(todayET.getFullYear(), todayET.getMonth(), todayET.getDate()) + 5 * 60 * 60 * 1000).toISOString();
  const todayEndISO = new Date(Date.UTC(todayET.getFullYear(), todayET.getMonth(), todayET.getDate() + 1) + 5 * 60 * 60 * 1000).toISOString();
  const todaySessions = sessions.filter(s => s.started_at >= todayStartISO && s.started_at < todayEndISO);
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

  // ============= SUPPQUOTE SPECIFIC METRICS =============
  const suppquoteSessions = sessions.filter(s => s.page === 'suppquote');
  const suppquoteEvents = events.filter(e => e.page === 'suppquote');
  const suppquoteSubmissions = submissions.filter(s => s.page === 'suppquote');
  
  // Submission metrics (suppquote only)
  const successSubmissions = suppquoteSubmissions.filter(s => s.submission_type === 'success');
  const knockoutSubmissions = suppquoteSubmissions.filter(s => s.submission_type === 'knockout');
  const disqualifiedSubmissions = suppquoteSubmissions.filter(s => s.submission_type === 'disqualified');
  
  // Beat rate = success submissions with positive monthly savings
  const beatRateSubmissions = successSubmissions.filter(s => s.monthly_savings && s.monthly_savings > 0);
  
  // CTA events
  const callClickEvents = suppquoteEvents.filter(e => e.event_type === 'call_click');
  const smsNurtureEvents = suppquoteEvents.filter(e => e.event_type === 'sms_nurture_requested');
  const callbackMorningEvents = suppquoteEvents.filter(e => 
    e.event_type === 'callback_scheduled' && e.metadata?.time_preference === 'morning'
  );
  const callbackAfternoonEvents = suppquoteEvents.filter(e => 
    e.event_type === 'callback_scheduled' && e.metadata?.time_preference === 'afternoon'
  );
  
  // Average savings (only from beat rate submissions)
  const avgMonthlySavings = beatRateSubmissions.length > 0
    ? beatRateSubmissions.reduce((sum, s) => sum + (s.monthly_savings || 0), 0) / beatRateSubmissions.length
    : 0;
  const avgAnnualSavings = beatRateSubmissions.length > 0
    ? beatRateSubmissions.reduce((sum, s) => sum + (s.annual_savings || 0), 0) / beatRateSubmissions.length
    : 0;
  const avgCurrentPayment = successSubmissions.length > 0
    ? successSubmissions.reduce((sum, s) => sum + (s.current_payment || 0), 0) / successSubmissions.length
    : 0;
  const avgQuotedRate = successSubmissions.length > 0
    ? successSubmissions.reduce((sum, s) => sum + (s.quoted_rate || 0), 0) / successSubmissions.length
    : 0;

  // Today's suppquote metrics
  const todaySuppquoteSessions = suppquoteSessions.filter(s => s.started_at >= todayStartISO && s.started_at < todayEndISO);
  const todaySuppquoteSubmissions = suppquoteSubmissions.filter(s => s.created_at >= todayStartISO && s.created_at < todayEndISO);
  const todayQuotes = todaySuppquoteSubmissions.filter(s => s.submission_type === 'success').length;

  // 12-step funnel drop-off for suppquote (still uses 3 separate health screens)
  const funnelSteps = [
    { step: 'start', label: 'Landing' },
    { step: 'plan', label: 'Plan Selection' },
    { step: 'payment', label: 'Current Payment' },
    { step: 'care', label: 'Health Condition' },
    { step: 'treatment', label: 'Recent Treatment' },
    { step: 'medications', label: 'Medications' },
    { step: 'gender', label: 'Gender' },
    { step: 'tobacco', label: 'Tobacco Use' },
    { step: 'spouse', label: 'Spouse Coverage' },
    { step: 'age', label: 'Age' },
    { step: 'zip', label: 'Zip Code' },
    { step: 'contact', label: 'Contact Info' },
    { step: 'loading', label: 'Loading Quote' },
    { step: 'qualified', label: 'Quote Displayed' },
  ];

  // 9-step funnel for suppappt (combined health check)
  const suppapptFunnelSteps = [
    { step: 'start', label: 'Landing' },
    { step: 'plan', label: 'Plan Selection' },
    { step: 'payment', label: 'Current Payment' },
    { step: 'care', label: 'Health Check' },
    { step: 'gender', label: 'Gender' },
    { step: 'tobacco', label: 'Tobacco Use' },
    { step: 'spouse', label: 'Spouse Coverage' },
    { step: 'age', label: 'Age' },
    { step: 'zip', label: 'Zip Code' },
    { step: 'contact', label: 'Contact Info' },
    { step: 'loading', label: 'Loading Quote' },
    { step: 'qualified', label: 'Qualified' },
  ];

  // Helper: count unique sessions that reached a given step using events
  const countSessionsAtStep = (pageEvents: Event[], pageSessions: Session[], step: string): number => {
    if (step === 'start') {
      // "start" = page_view events
      return new Set(pageEvents.filter(e => e.event_type === 'page_view').map(e => e.session_id)).size;
    }
    if (step === 'qualified') {
      // "qualified" = qualification events with step=qualified
      return new Set(pageEvents.filter(e => e.event_type === 'qualification' && e.step === 'qualified').map(e => e.session_id)).size;
    }
    // All other steps = step_change events
    return new Set(pageEvents.filter(e => e.event_type === 'step_change' && e.step === step).map(e => e.session_id)).size;
  };

  const suppquoteDropoffData = funnelSteps.map((funnelStep, index) => {
    const count = countSessionsAtStep(suppquoteEvents, suppquoteSessions, funnelStep.step);
    const previousCount = index > 0 
      ? countSessionsAtStep(suppquoteEvents, suppquoteSessions, funnelSteps[index - 1].step)
      : suppquoteSessions.length;
    
    const dropoff = previousCount > 0 ? ((previousCount - count) / previousCount) * 100 : 0;
    
    return {
      step: funnelStep.step,
      label: funnelStep.label,
      count,
      percentage: suppquoteSessions.length > 0 ? (count / suppquoteSessions.length) * 100 : 0,
      dropoff: index === 0 ? 0 : dropoff,
    };
  });

  // Quote outcomes data
  const totalOutcomes = successSubmissions.length + knockoutSubmissions.length + disqualifiedSubmissions.length;
  const abandonedCount = Math.max(0, suppquoteSessions.length - totalOutcomes);
  
  const quoteOutcomesData = [
    { 
      name: 'Beat Rate', 
      value: beatRateSubmissions.length,
      percentage: totalOutcomes > 0 ? (beatRateSubmissions.length / (totalOutcomes + abandonedCount)) * 100 : 0
    },
    { 
      name: "Couldn't Beat", 
      value: knockoutSubmissions.length,
      percentage: totalOutcomes > 0 ? (knockoutSubmissions.length / (totalOutcomes + abandonedCount)) * 100 : 0
    },
    { 
      name: 'DQ - Health Condition', 
      value: disqualifiedSubmissions.filter(s => s.disqualification_reason?.includes('care') || s.disqualification_reason?.includes('condition') || s.disqualification_reason === 'health').length,
      percentage: 0
    },
    { 
      name: 'DQ - Recent Treatment', 
      value: disqualifiedSubmissions.filter(s => s.disqualification_reason?.includes('treatment')).length,
      percentage: 0
    },
    { 
      name: 'DQ - Medications', 
      value: disqualifiedSubmissions.filter(s => s.disqualification_reason?.includes('medication')).length,
      percentage: 0
    },
    { 
      name: 'Abandoned', 
      value: abandonedCount,
      percentage: (totalOutcomes + abandonedCount) > 0 ? (abandonedCount / (totalOutcomes + abandonedCount)) * 100 : 0
    },
  ].map(d => ({
    ...d,
    percentage: (totalOutcomes + abandonedCount) > 0 ? (d.value / (totalOutcomes + abandonedCount)) * 100 : 0
  }));

  // Top carriers
  const carrierMap = new Map<string, { count: number; totalSavings: number }>();
  successSubmissions.forEach(s => {
    if (s.quoted_carrier) {
      const current = carrierMap.get(s.quoted_carrier) || { count: 0, totalSavings: 0 };
      carrierMap.set(s.quoted_carrier, {
        count: current.count + 1,
        totalSavings: current.totalSavings + (s.monthly_savings || 0),
      });
    }
  });
  const topCarriers = Array.from(carrierMap.entries())
    .map(([carrier, data]) => ({
      carrier,
      count: data.count,
      avgSavings: data.count > 0 ? data.totalSavings / data.count : 0,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Business hours analysis
  const isBusinessHours = (dateStr: string) => {
    const date = new Date(dateStr);
    const etOffset = -5; // ET offset
    const utcHours = date.getUTCHours();
    const etHours = (utcHours + etOffset + 24) % 24;
    const day = date.getUTCDay();
    return day >= 1 && day <= 5 && etHours >= 9 && etHours < 17;
  };
  
  const businessHoursVisitors = suppquoteSessions.filter(s => isBusinessHours(s.started_at)).length;
  const afterHoursVisitors = suppquoteSessions.length - businessHoursVisitors;

  // Traffic source performance for suppquote
  const suppquoteTrafficMap = new Map<string, { 
    visitors: number; 
    quotes: number; 
    beatRate: number; 
    totalSavings: number;
  }>();
  
  suppquoteSessions.forEach(s => {
    const key = `${s.utm_source || '(direct)'}|${s.utm_medium || '(none)'}|${s.utm_campaign || '(none)'}`;
    const current = suppquoteTrafficMap.get(key) || { visitors: 0, quotes: 0, beatRate: 0, totalSavings: 0 };
    
    // Find matching submission
    const matchingSubmission = submissions.find(sub => 
      sub.session_id === s.session_id || sub.visitor_id === s.visitor_id
    );
    
    const isQuote = matchingSubmission?.submission_type === 'success';
    const isBeatRate = isQuote && (matchingSubmission?.monthly_savings || 0) > 0;
    const savings = isBeatRate ? (matchingSubmission?.monthly_savings || 0) : 0;
    
    suppquoteTrafficMap.set(key, {
      visitors: current.visitors + 1,
      quotes: current.quotes + (isQuote ? 1 : 0),
      beatRate: current.beatRate + (isBeatRate ? 1 : 0),
      totalSavings: current.totalSavings + savings,
    });
  });
  
  const trafficSourcePerformance = Array.from(suppquoteTrafficMap.entries())
    .map(([key, value]) => {
      const [source, medium, campaign] = key.split('|');
      return {
        source,
        medium,
        campaign,
        visitors: value.visitors,
        quotes: value.quotes,
        beatRate: value.quotes > 0 ? (value.beatRate / value.quotes) * 100 : 0,
        avgSavings: value.beatRate > 0 ? value.totalSavings / value.beatRate : 0,
        conversionRate: value.visitors > 0 ? (value.quotes / value.visitors) * 100 : 0,
      };
    })
    .sort((a, b) => b.visitors - a.visitors)
    .slice(0, 15);

  // Demographics data
  const ageRanges = ['65-69', '70-74', '75-79', '80-84', '85+'];
  const ageDistribution = ageRanges.map(range => {
    let count = 0;
    submissions.forEach(s => {
      if (!s.age) return;
      if (range === '65-69' && s.age >= 65 && s.age <= 69) count++;
      else if (range === '70-74' && s.age >= 70 && s.age <= 74) count++;
      else if (range === '75-79' && s.age >= 75 && s.age <= 79) count++;
      else if (range === '80-84' && s.age >= 80 && s.age <= 84) count++;
      else if (range === '85+' && s.age >= 85) count++;
    });
    return { range, count };
  });

  const genderCounts = { Male: 0, Female: 0, Unknown: 0 };
  submissions.forEach(s => {
    if (s.gender === 'male') genderCounts.Male++;
    else if (s.gender === 'female') genderCounts.Female++;
    else genderCounts.Unknown++;
  });
  const totalGender = Object.values(genderCounts).reduce((a, b) => a + b, 0);
  const genderBreakdown = Object.entries(genderCounts).map(([gender, count]) => ({
    gender,
    count,
    percentage: totalGender > 0 ? (count / totalGender) * 100 : 0,
  }));

  const tobaccoCounts = { 'Non-Tobacco': 0, 'Tobacco': 0, 'Unknown': 0 };
  submissions.forEach(s => {
    if (s.tobacco === 'no') tobaccoCounts['Non-Tobacco']++;
    else if (s.tobacco === 'yes') tobaccoCounts['Tobacco']++;
    else tobaccoCounts['Unknown']++;
  });
  const totalTobacco = Object.values(tobaccoCounts).reduce((a, b) => a + b, 0);
  const tobaccoBreakdown = Object.entries(tobaccoCounts).map(([status, count]) => ({
    status,
    count,
    percentage: totalTobacco > 0 ? (count / totalTobacco) * 100 : 0,
  }));

  const spouseCounts = { 'Individual': 0, 'With Spouse': 0, 'Unknown': 0 };
  submissions.forEach(s => {
    if (s.spouse === 'no') spouseCounts['Individual']++;
    else if (s.spouse === 'yes') spouseCounts['With Spouse']++;
    else spouseCounts['Unknown']++;
  });
  const totalSpouse = Object.values(spouseCounts).reduce((a, b) => a + b, 0);
  const spouseBreakdown = Object.entries(spouseCounts).map(([status, count]) => ({
    status,
    count,
    percentage: totalSpouse > 0 ? (count / totalSpouse) * 100 : 0,
  }));

  const planCounts = { 'Plan G': 0, 'Plan N': 0, 'Unknown': 0 };
  submissions.forEach(s => {
    if (s.plan === 'G') planCounts['Plan G']++;
    else if (s.plan === 'N') planCounts['Plan N']++;
    else planCounts['Unknown']++;
  });
  const totalPlan = Object.values(planCounts).reduce((a, b) => a + b, 0);
  const planBreakdown = Object.entries(planCounts).map(([plan, count]) => ({
    plan,
    count,
    percentage: totalPlan > 0 ? (count / totalPlan) * 100 : 0,
  }));

  const zipPrefixMap = new Map<string, number>();
  submissions.forEach(s => {
    if (s.zip_code && s.zip_code.length >= 3) {
      const prefix = s.zip_code.substring(0, 3);
      zipPrefixMap.set(prefix, (zipPrefixMap.get(prefix) || 0) + 1);
    }
  });
  const topZipPrefixes = Array.from(zipPrefixMap.entries())
    .map(([prefix, count]) => ({ prefix, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const demographicData = {
    ageDistribution,
    genderBreakdown,
    tobaccoBreakdown,
    spouseBreakdown,
    planBreakdown,
    topZipPrefixes,
  };

  // Quote funnel time series
  const quoteFunnelTimeSeriesMap = new Map<string, { 
    visitors: number; 
    quotes: number; 
    beatRateCount: number;
    totalSavings: number;
  }>();
  
  suppquoteSessions.forEach(s => {
    const date = format(new Date(s.started_at), 'MM/dd');
    const current = quoteFunnelTimeSeriesMap.get(date) || { 
      visitors: 0, 
      quotes: 0, 
      beatRateCount: 0,
      totalSavings: 0 
    };
    quoteFunnelTimeSeriesMap.set(date, {
      ...current,
      visitors: current.visitors + 1,
    });
  });
  
  suppquoteSubmissions.forEach(s => {
    const date = format(new Date(s.created_at), 'MM/dd');
    const current = quoteFunnelTimeSeriesMap.get(date) || { 
      visitors: 0, 
      quotes: 0, 
      beatRateCount: 0,
      totalSavings: 0 
    };
    if (s.submission_type === 'success') {
      const isBeatRate = (s.monthly_savings || 0) > 0;
      quoteFunnelTimeSeriesMap.set(date, {
        ...current,
        quotes: current.quotes + 1,
        beatRateCount: current.beatRateCount + (isBeatRate ? 1 : 0),
        totalSavings: current.totalSavings + (isBeatRate ? (s.monthly_savings || 0) : 0),
      });
    }
  });
  
  const quoteFunnelTimeSeriesData = Array.from(quoteFunnelTimeSeriesMap.entries())
    .map(([date, value]) => ({
      date,
      visitors: value.visitors,
      quotes: value.quotes,
      beatRate: value.quotes > 0 ? (value.beatRateCount / value.quotes) * 100 : 0,
      avgSavings: value.beatRateCount > 0 ? value.totalSavings / value.beatRateCount : 0,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // ============= APPOINTMENT FUNNEL METRICS =============
  const createAppointmentFunnelData = (page: 'suppappt' | 'suppappt1') => {
    const pageSessions = sessions.filter(s => s.page === page);
    const pageEvents = events.filter(e => e.page === page);
    const pageSubmissions = submissions.filter(s => s.page === page);
    
    const qualifiedCount = pageSessions.filter(s => s.completed).length;
    const disqualifiedCount = pageEvents.filter(e => e.event_type === 'qualification' && e.step !== 'qualified').length;
    
    // Booking events — use unique session counts to prevent double-counting
    const bookingWidgetViews = new Set(pageEvents.filter(e => e.event_type === 'booking_widget_view').map(e => e.session_id)).size;
    const bookingDaySelected = new Set(pageEvents.filter(e => e.event_type === 'booking_day_selected').map(e => e.session_id)).size;
    const bookingTimeSelected = new Set(pageEvents.filter(e => e.event_type === 'booking_time_selected').map(e => e.session_id)).size;
    const bookingConfirmClicked = new Set(pageEvents.filter(e => e.event_type === 'booking_confirm_clicked').map(e => e.session_id)).size;
    const bookingCompleted = new Set(pageEvents.filter(e => e.event_type === 'booking_completed').map(e => e.session_id)).size;
    
    // Average savings from successful quotes
    const successSubs = pageSubmissions.filter(s => s.submission_type === 'success' && (s.monthly_savings || 0) > 0);
    const avgMonthlySavings = successSubs.length > 0
      ? successSubs.reduce((sum, s) => sum + (s.monthly_savings || 0), 0) / successSubs.length
      : 0;
    
    // Today's metrics — ET-aware boundaries + unique sessions
    const todayPageSessions = pageSessions.filter(s => s.started_at >= todayStartISO && s.started_at < todayEndISO);
    const todayBookedEvents = new Set(
      pageEvents.filter(e => 
        e.event_type === 'booking_completed' && e.created_at >= todayStartISO && e.created_at < todayEndISO
      ).map(e => e.session_id)
    ).size;
    
    // Event-based funnel dropoff — suppappt uses consolidated health steps
    const stepsForPage = page === 'suppappt' ? suppapptFunnelSteps : funnelSteps;
    const dropoffData = stepsForPage.map((funnelStep, index) => {
      const count = countSessionsAtStep(pageEvents, pageSessions, funnelStep.step);
      const previousCount = index > 0 
        ? countSessionsAtStep(pageEvents, pageSessions, stepsForPage[index - 1].step)
        : pageSessions.length;
      
      const dropoff = previousCount > 0 ? ((previousCount - count) / previousCount) * 100 : 0;
      
      return {
        step: funnelStep.step,
        label: funnelStep.label,
        count,
        percentage: pageSessions.length > 0 ? (count / pageSessions.length) * 100 : 0,
        dropoff: index === 0 ? 0 : dropoff,
      };
    });
    
    // Booking widget funnel
    const bookingFunnelData = [
      { step: 'widget_view', label: 'Widget View', count: bookingWidgetViews, percentage: 100 },
      { step: 'day_selected', label: 'Day Selected', count: bookingDaySelected, percentage: bookingWidgetViews > 0 ? (bookingDaySelected / bookingWidgetViews) * 100 : 0 },
      { step: 'time_selected', label: 'Time Selected', count: bookingTimeSelected, percentage: bookingWidgetViews > 0 ? (bookingTimeSelected / bookingWidgetViews) * 100 : 0 },
      { step: 'confirm_clicked', label: 'Confirm Clicked', count: bookingConfirmClicked, percentage: bookingWidgetViews > 0 ? (bookingConfirmClicked / bookingWidgetViews) * 100 : 0 },
      { step: 'completed', label: 'Booked', count: bookingCompleted, percentage: bookingWidgetViews > 0 ? (bookingCompleted / bookingWidgetViews) * 100 : 0 },
    ];
    
    return {
      totalVisitors: pageSessions.length,
      qualifiedCount,
      appointmentsBooked: bookingCompleted,
      disqualifiedCount,
      avgMonthlySavings,
      todayVisitors: todayPageSessions.length,
      todayBooked: todayBookedEvents,
      funnelDropoffData: dropoffData,
      bookingFunnelData,
    };
  };
  
  const suppapptData = createAppointmentFunnelData('suppappt');
  const suppappt1Data = createAppointmentFunnelData('suppappt1');

  // ============= A/B TEST: calm_trust_v1 vs legacy =============
  const suppapptAllSessions = sessions.filter(s => s.page === 'suppappt');
  const suppapptAllEvents = events.filter(e => e.page === 'suppappt');

  const buildVariantData = (variantSessions: typeof suppapptAllSessions, variantEvents: typeof suppapptAllEvents, name: string) => {
    const visitors = variantSessions.length;
    const sessionIds = new Set(variantSessions.map(s => s.session_id));
    const filteredEvents = variantEvents.filter(e => sessionIds.has(e.session_id));

    // Engagement = reached plan_type step
    const engagedCount = new Set(filteredEvents.filter(e => e.event_type === 'step_change' && e.step === 'plan').map(e => e.session_id)).size;
    const engagementRate = visitors > 0 ? (engagedCount / visitors) * 100 : 0;

    // Lead = qualified or booking_completed
    const qualifiedIds = new Set(filteredEvents.filter(e => e.event_type === 'qualification' && e.step === 'qualified').map(e => e.session_id));
    const bookedIds = new Set(filteredEvents.filter(e => e.event_type === 'booking_completed').map(e => e.session_id));
    const leadIds = new Set([...qualifiedIds, ...bookedIds]);
    const leadRate = visitors > 0 ? (leadIds.size / visitors) * 100 : 0;

    // Funnel steps
    const funnelSteps = suppapptFunnelSteps.map(fs => {
      const count = countSessionsAtStep(filteredEvents, variantSessions, fs.step);
      return {
        step: fs.step,
        label: fs.label,
        count,
        percentage: visitors > 0 ? (count / visitors) * 100 : 0,
      };
    });

    // Daily trend
    const dailyMap = new Map<string, { visitors: number; leads: number }>();
    variantSessions.forEach(s => {
      const date = format(new Date(s.started_at), 'MM/dd');
      const cur = dailyMap.get(date) || { visitors: 0, leads: 0 };
      dailyMap.set(date, { ...cur, visitors: cur.visitors + 1 });
    });
    // Count leads per day
    filteredEvents.forEach(e => {
      if ((e.event_type === 'qualification' && e.step === 'qualified') || e.event_type === 'booking_completed') {
        const date = format(new Date(e.created_at), 'MM/dd');
        const cur = dailyMap.get(date) || { visitors: 0, leads: 0 };
        dailyMap.set(date, { ...cur, leads: cur.leads + 1 });
      }
    });
    const dailyTrend = Array.from(dailyMap.entries())
      .map(([date, v]) => ({
        date,
        visitors: v.visitors,
        engagementRate: 0, // not computed per-day for simplicity
        leadRate: v.visitors > 0 ? (v.leads / v.visitors) * 100 : 0,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return { name, visitors, engagementRate, leadRate, funnelSteps, dailyTrend };
  };

  const legacySessions = suppapptAllSessions.filter(s => !s.variant);
  const legacyEvents = suppapptAllEvents;
  const calmTrustSessions = suppapptAllSessions.filter(s => s.variant === 'calm_trust_v1');
  const calmTrustEvents = suppapptAllEvents;

  const abLegacy = buildVariantData(legacySessions, legacyEvents, 'Legacy');
  const abVariant = buildVariantData(calmTrustSessions, calmTrustEvents, 'Calm Trust');

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BarChart3 className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-xl font-bold">Funnel Analytics</h1>
              <p className="text-sm text-muted-foreground">
                Tracking all Medicare landing pages
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
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="flex-wrap">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="funnels">Funnels</TabsTrigger>
            <TabsTrigger value="suppquote" className="bg-green-100 dark:bg-green-900/30">Quote Funnel</TabsTrigger>
            <TabsTrigger value="suppappt" className="bg-blue-100 dark:bg-blue-900/30">Appt Funnel</TabsTrigger>
            <TabsTrigger value="suppappt1" className="bg-purple-100 dark:bg-purple-900/30">Appt1 Funnel</TabsTrigger>
            <TabsTrigger value="sources">Traffic Sources</TabsTrigger>
            <TabsTrigger value="live">Live Activity</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <OverviewCards
              totalVisitors={totalVisitors}
              totalCalls={totalCalls}
              conversionRate={conversionRate}
              qualifiedRate={qualifiedRate}
              todayVisitors={todayVisitors}
              todayCalls={todayCalls}
            />
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

          <TabsContent value="suppquote" className="space-y-6">
            <QuoteFunnelOverview
              totalVisitors={suppquoteSessions.length}
              quotesGenerated={successSubmissions.length}
              beatRateCount={beatRateSubmissions.length}
              knockoutCount={knockoutSubmissions.length}
              disqualifiedCount={disqualifiedSubmissions.length}
              callClicks={callClickEvents.length}
              smsRequests={smsNurtureEvents.length}
              avgMonthlySavings={avgMonthlySavings}
              todayVisitors={todaySuppquoteSessions.length}
              todayQuotes={todayQuotes}
            />

            <div className="grid gap-4 lg:grid-cols-2">
              <QuoteFunnelDropoff data={suppquoteDropoffData} />
              <QuoteOutcomesChart data={quoteOutcomesData} />
            </div>

            <SavingsMetrics
              avgCurrentPayment={avgCurrentPayment}
              avgQuotedRate={avgQuotedRate}
              avgMonthlySavings={avgMonthlySavings}
              avgAnnualSavings={avgAnnualSavings}
              topCarriers={topCarriers}
            />

            <CTABreakdown
              callClicks={callClickEvents.length}
              smsRequests={smsNurtureEvents.length}
              morningCallbacks={callbackMorningEvents.length}
              afternoonCallbacks={callbackAfternoonEvents.length}
              businessHoursVisitors={businessHoursVisitors}
              afterHoursVisitors={afterHoursVisitors}
            />

            <DemographicInsights data={demographicData} />

            <TrafficSourcePerformance data={trafficSourcePerformance} />

            <QuoteFunnelTimeSeries data={quoteFunnelTimeSeriesData} />
          </TabsContent>

          <TabsContent value="suppappt" className="space-y-6">
            <AppointmentFunnelTab
              pageName="suppappt"
              totalVisitors={suppapptData.totalVisitors}
              qualifiedCount={suppapptData.qualifiedCount}
              appointmentsBooked={suppapptData.appointmentsBooked}
              disqualifiedCount={suppapptData.disqualifiedCount}
              avgMonthlySavings={suppapptData.avgMonthlySavings}
              todayVisitors={suppapptData.todayVisitors}
              todayBooked={suppapptData.todayBooked}
              funnelDropoffData={suppapptData.funnelDropoffData}
              bookingFunnelData={suppapptData.bookingFunnelData}
            />
          </TabsContent>

          <TabsContent value="suppappt1" className="space-y-6">
            <AppointmentFunnelTab
              pageName="suppappt1"
              totalVisitors={suppappt1Data.totalVisitors}
              qualifiedCount={suppappt1Data.qualifiedCount}
              appointmentsBooked={suppappt1Data.appointmentsBooked}
              disqualifiedCount={suppappt1Data.disqualifiedCount}
              avgMonthlySavings={suppappt1Data.avgMonthlySavings}
              todayVisitors={suppappt1Data.todayVisitors}
              todayBooked={suppappt1Data.todayBooked}
              funnelDropoffData={suppappt1Data.funnelDropoffData}
              bookingFunnelData={suppappt1Data.bookingFunnelData}
            />
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
