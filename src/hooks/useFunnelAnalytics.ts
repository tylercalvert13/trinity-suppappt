import { useCallback, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface UTMParams {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
}

interface TrackEventParams {
  eventType: string;
  step?: string;
  answer?: string;
  outcome?: string;
  metadata?: Record<string, string | number | boolean>;
}

const getVisitorId = (): string => {
  const storageKey = 'funnel_visitor_id';
  let visitorId = localStorage.getItem(storageKey);
  if (!visitorId) {
    visitorId = crypto.randomUUID();
    localStorage.setItem(storageKey, visitorId);
  }
  return visitorId;
};

const getSessionId = (page: string): string => {
  const storageKey = `funnel_session_${page}`;
  let sessionId = sessionStorage.getItem(storageKey);
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    sessionStorage.setItem(storageKey, sessionId);
  }
  return sessionId;
};

const getUTMParams = (): UTMParams => {
  const params = new URLSearchParams(window.location.search);
  return {
    utm_source: params.get('utm_source') || undefined,
    utm_medium: params.get('utm_medium') || undefined,
    utm_campaign: params.get('utm_campaign') || undefined,
    utm_content: params.get('utm_content') || undefined,
    utm_term: params.get('utm_term') || undefined,
  };
};

const getDeviceType = (): string => {
  const width = window.innerWidth;
  if (width < 768) return 'mobile';
  if (width < 1024) return 'tablet';
  return 'desktop';
};

export const useFunnelAnalytics = (page: 'supp' | 'supp1') => {
  const visitorId = useRef(getVisitorId());
  const sessionId = useRef(getSessionId(page));
  const sessionCreated = useRef(false);
  const lastStep = useRef<string>('start');

  // Create session on mount
  useEffect(() => {
    const createSession = async () => {
      if (sessionCreated.current) return;
      sessionCreated.current = true;

      const utmParams = getUTMParams();
      
      try {
        await supabase.from('funnel_sessions').insert([{
          visitor_id: visitorId.current,
          session_id: sessionId.current,
          page,
          utm_source: utmParams.utm_source || null,
          utm_medium: utmParams.utm_medium || null,
          utm_campaign: utmParams.utm_campaign || null,
          utm_content: utmParams.utm_content || null,
          utm_term: utmParams.utm_term || null,
          referrer: document.referrer || null,
          user_agent: navigator.userAgent,
          device_type: getDeviceType(),
          last_step: 'start',
        }]);

        // Track page view event
        await supabase.from('funnel_events').insert([{
          visitor_id: visitorId.current,
          session_id: sessionId.current,
          page,
          event_type: 'page_view',
          step: 'start',
          answer: null,
          outcome: null,
          metadata: null,
        }]);
      } catch (error) {
        console.error('Error creating analytics session:', error);
      }
    };

    createSession();
  }, [page]);

  // Track an event
  const trackEvent = useCallback(async ({ eventType, step, answer, outcome, metadata }: TrackEventParams) => {
    try {
      await supabase.from('funnel_events').insert([{
        visitor_id: visitorId.current,
        session_id: sessionId.current,
        page,
        event_type: eventType,
        step: step || null,
        answer: answer || null,
        outcome: outcome || null,
        metadata: metadata ? JSON.parse(JSON.stringify(metadata)) : null,
      }]);
    } catch (error) {
      console.error('Error tracking event:', error);
    }
  }, [page]);

  // Track step change
  const trackStepChange = useCallback(async (newStep: string, answer?: string) => {
    lastStep.current = newStep;

    try {
      // Update session with new step
      await supabase
        .from('funnel_sessions')
        .update({ last_step: newStep })
        .eq('session_id', sessionId.current);

      // Track step change event
      await trackEvent({
        eventType: 'step_change',
        step: newStep,
        answer,
      });
    } catch (error) {
      console.error('Error tracking step change:', error);
    }
  }, [trackEvent]);

  // Track qualification outcome
  const trackQualification = useCallback(async (outcome: 'qualified' | 'disqualified', reason?: string) => {
    try {
      const isCompleted = outcome === 'qualified';
      
      // Update session
      await supabase
        .from('funnel_sessions')
        .update({ 
          completed: isCompleted,
          last_step: outcome,
        })
        .eq('session_id', sessionId.current);

      // Track qualification event
      await trackEvent({
        eventType: 'qualification',
        step: outcome,
        outcome: reason || outcome,
      });
    } catch (error) {
      console.error('Error tracking qualification:', error);
    }
  }, [trackEvent]);

  // Track call click
  const trackCallClick = useCallback(async () => {
    try {
      // Update session
      await supabase
        .from('funnel_sessions')
        .update({ called: true })
        .eq('session_id', sessionId.current);

      // Track call event
      await trackEvent({
        eventType: 'call_click',
        step: 'qualified',
      });
    } catch (error) {
      console.error('Error tracking call click:', error);
    }
  }, [trackEvent]);

  return {
    visitorId: visitorId.current,
    sessionId: sessionId.current,
    trackEvent,
    trackStepChange,
    trackQualification,
    trackCallClick,
  };
};
