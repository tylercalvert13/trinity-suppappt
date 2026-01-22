import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { isInternalTeamMember, filterInternalSubmissions } from "@/lib/analyticsFilters";
import { Activity, Eye, ArrowRight, PhoneCall, UserCheck, UserX, DollarSign, TrendingDown, XCircle, MessageSquare } from "lucide-react";
import { format } from "date-fns";

interface FunnelEvent {
  id: string;
  event_type: string;
  page: string;
  step: string | null;
  answer: string | null;
  outcome: string | null;
  created_at: string;
}

interface Submission {
  id: string;
  submission_type: string;
  page: string | null;
  quoted_carrier: string | null;
  monthly_savings: number | null;
  annual_savings: number | null;
  current_payment: number | null;
  quoted_rate: number | null;
  first_name: string | null;
  plan: string | null;
  disqualification_reason: string | null;
  created_at: string;
}

type ActivityItem = 
  | { type: 'event'; data: FunnelEvent; timestamp: string }
  | { type: 'submission'; data: Submission; timestamp: string };

const getEventIcon = (eventType: string, outcome?: string | null) => {
  switch (eventType) {
    case 'page_view':
      return <Eye className="h-4 w-4" />;
    case 'step_change':
      return <ArrowRight className="h-4 w-4" />;
    case 'call_click':
      return <PhoneCall className="h-4 w-4" />;
    case 'sms_nurture_requested':
      return <MessageSquare className="h-4 w-4" />;
    case 'qualification':
      return outcome === 'qualified' ? <UserCheck className="h-4 w-4" /> : <UserX className="h-4 w-4" />;
    default:
      return <Activity className="h-4 w-4" />;
  }
};

const getSubmissionIcon = (submissionType: string) => {
  switch (submissionType) {
    case 'success':
      return <DollarSign className="h-4 w-4" />;
    case 'knockout':
      return <TrendingDown className="h-4 w-4" />;
    case 'disqualified':
      return <XCircle className="h-4 w-4" />;
    default:
      return <Activity className="h-4 w-4" />;
  }
};

const getEventColor = (eventType: string, outcome?: string | null): string => {
  switch (eventType) {
    case 'page_view':
      return 'bg-blue-100 text-blue-800';
    case 'step_change':
      return 'bg-purple-100 text-purple-800';
    case 'call_click':
      return 'bg-green-100 text-green-800';
    case 'sms_nurture_requested':
      return 'bg-indigo-100 text-indigo-800';
    case 'qualification':
      return outcome === 'qualified' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const getSubmissionColor = (submissionType: string): string => {
  switch (submissionType) {
    case 'success':
      return 'bg-emerald-100 text-emerald-800';
    case 'knockout':
      return 'bg-amber-100 text-amber-800';
    case 'disqualified':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const formatEventDescription = (event: FunnelEvent): string => {
  switch (event.event_type) {
    case 'page_view':
      return `Visitor landed on /${event.page}`;
    case 'step_change':
      return `Moved to ${event.step}${event.answer ? ` (answered: ${event.answer})` : ''}`;
    case 'call_click':
      return 'Clicked to call';
    case 'sms_nurture_requested':
      return 'Requested SMS follow-up';
    case 'qualification':
      return event.outcome === 'qualified' ? 'Qualified for offer' : `Disqualified: ${event.outcome}`;
    default:
      return event.event_type;
  }
};

const formatSubmissionDescription = (submission: Submission): { title: string; subtitle: string } => {
  switch (submission.submission_type) {
    case 'success':
      const savings = submission.monthly_savings ? `$${submission.monthly_savings.toFixed(2)}/mo` : '';
      const carrier = submission.quoted_carrier || 'carrier';
      const plan = submission.plan ? `Plan ${submission.plan}` : '';
      return {
        title: `💰 Quote generated!`,
        subtitle: savings ? `Save ${savings} with ${carrier}${plan ? ` (${plan})` : ''}` : `Matched with ${carrier}${plan ? ` - ${plan}` : ''}`
      };
    case 'knockout':
      const currentRate = submission.current_payment ? `$${submission.current_payment.toFixed(0)}/mo` : 'current rate';
      return {
        title: `📊 Couldn't beat current rate`,
        subtitle: `${currentRate} is already competitive`
      };
    case 'disqualified':
      const reason = submission.disqualification_reason || 'health questions';
      return {
        title: `❌ Disqualified`,
        subtitle: `Reason: ${reason}`
      };
    default:
      return {
        title: 'Submission received',
        subtitle: submission.submission_type
      };
  }
};

export const LiveActivityFeed = () => {
  const [activities, setActivities] = useState<ActivityItem[]>([]);

  useEffect(() => {
    // Fetch recent events
    const fetchRecentActivity = async () => {
      const [eventsResult, submissionsResult] = await Promise.all([
        supabase
          .from('funnel_events')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(30),
        supabase
          .from('submissions')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(20)
      ]);
      
      const events: ActivityItem[] = (eventsResult.data || []).map(e => ({
        type: 'event' as const,
        data: e,
        timestamp: e.created_at
      }));
      
      // Filter out internal team submissions
      const filteredSubmissions = filterInternalSubmissions(submissionsResult.data || []);
      const submissions: ActivityItem[] = filteredSubmissions.map(s => ({
        type: 'submission' as const,
        data: s,
        timestamp: s.created_at
      }));
      
      // Merge and sort by timestamp
      const merged = [...events, ...submissions].sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      ).slice(0, 50);
      
      setActivities(merged);
    };

    fetchRecentActivity();

    // Subscribe to real-time updates for funnel_events
    const eventsChannel = supabase
      .channel('live-events')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'funnel_events',
        },
        (payload) => {
          const newEvent: ActivityItem = {
            type: 'event',
            data: payload.new as FunnelEvent,
            timestamp: (payload.new as FunnelEvent).created_at
          };
          setActivities((prev) => [newEvent, ...prev.slice(0, 49)]);
        }
      )
      .subscribe();

    // Subscribe to real-time updates for submissions
    const submissionsChannel = supabase
      .channel('live-submissions')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'submissions',
        },
        (payload) => {
          const newSubmission = payload.new as Submission;
          // Skip internal team submissions
          if (isInternalTeamMember(newSubmission)) return;
          
          const activityItem: ActivityItem = {
            type: 'submission',
            data: newSubmission,
            timestamp: newSubmission.created_at
          };
          setActivities((prev) => [activityItem, ...prev.slice(0, 49)]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(eventsChannel);
      supabase.removeChannel(submissionsChannel);
    };
  }, []);

  const renderActivityItem = (activity: ActivityItem) => {
    if (activity.type === 'event') {
      const event = activity.data;
      return (
        <div
          key={`event-${event.id}`}
          className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 animate-in fade-in slide-in-from-top-2 duration-300"
        >
          <div className={`p-2 rounded-full ${getEventColor(event.event_type, event.outcome)}`}>
            {getEventIcon(event.event_type, event.outcome)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">
              {formatEventDescription(event)}
            </p>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className="text-xs">
                /{event.page}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {format(new Date(event.created_at), 'HH:mm:ss')}
              </span>
            </div>
          </div>
        </div>
      );
    } else {
      const submission = activity.data;
      const { title, subtitle } = formatSubmissionDescription(submission);
      return (
        <div
          key={`submission-${submission.id}`}
          className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 animate-in fade-in slide-in-from-top-2 duration-300 border-l-4 border-l-primary"
        >
          <div className={`p-2 rounded-full ${getSubmissionColor(submission.submission_type)}`}>
            {getSubmissionIcon(submission.submission_type)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold">
              {title}
            </p>
            <p className="text-sm text-muted-foreground truncate">
              {subtitle}
            </p>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              {submission.plan && (
                <Badge variant="secondary" className="text-xs">
                  Plan {submission.plan}
                </Badge>
              )}
              <Badge variant="outline" className="text-xs">
                /{submission.page || 'quote'}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {format(new Date(submission.created_at), 'HH:mm:ss')}
              </span>
            </div>
          </div>
        </div>
      );
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg">Live Activity</CardTitle>
        <div className="flex items-center gap-2">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
          </span>
          <span className="text-sm text-muted-foreground">Live</span>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          {activities.length === 0 ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              Waiting for activity...
            </div>
          ) : (
            <div className="space-y-3">
              {activities.map(renderActivityItem)}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
