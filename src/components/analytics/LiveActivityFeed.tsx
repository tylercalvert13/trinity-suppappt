import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Activity, Eye, ArrowRight, PhoneCall, UserCheck, UserX } from "lucide-react";
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

const getEventIcon = (eventType: string, outcome?: string | null) => {
  switch (eventType) {
    case 'page_view':
      return <Eye className="h-4 w-4" />;
    case 'step_change':
      return <ArrowRight className="h-4 w-4" />;
    case 'call_click':
      return <PhoneCall className="h-4 w-4" />;
    case 'qualification':
      return outcome === 'qualified' ? <UserCheck className="h-4 w-4" /> : <UserX className="h-4 w-4" />;
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
    case 'qualification':
      return outcome === 'qualified' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
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
    case 'qualification':
      return event.outcome === 'qualified' ? 'Qualified for offer' : `Disqualified: ${event.outcome}`;
    default:
      return event.event_type;
  }
};

export const LiveActivityFeed = () => {
  const [events, setEvents] = useState<FunnelEvent[]>([]);

  useEffect(() => {
    // Fetch recent events
    const fetchRecentEvents = async () => {
      const { data, error } = await supabase
        .from('funnel_events')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (!error && data) {
        setEvents(data);
      }
    };

    fetchRecentEvents();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('live-events')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'funnel_events',
        },
        (payload) => {
          setEvents((prev) => [payload.new as FunnelEvent, ...prev.slice(0, 49)]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

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
          {events.length === 0 ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              Waiting for activity...
            </div>
          ) : (
            <div className="space-y-3">
              {events.map((event) => (
                <div
                  key={event.id}
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
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
