/**
 * Lightweight funnel step tracker — fire-and-forget, never blocks UI.
 * Uses navigator.sendBeacon with Supabase REST API fallback.
 * Writes to the existing `funnel_events` table.
 */

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

const STORAGE_KEY = 'ft_session_id';

function getSessionId(): string {
  let id = sessionStorage.getItem(STORAGE_KEY);
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem(STORAGE_KEY, id);
  }
  return id;
}

function getVisitorId(): string {
  let id = localStorage.getItem('funnel_visitor_id');
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem('funnel_visitor_id', id);
  }
  return id;
}

function getUTMParams(): Record<string, string> {
  const params = new URLSearchParams(window.location.search);
  const utm: Record<string, string> = {};
  for (const key of ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term']) {
    const val = params.get(key);
    if (val) utm[key] = val;
  }
  return utm;
}

export function trackFunnelStep(
  funnel: string,
  step: string,
  stepIndex: number,
  extra: Record<string, unknown> = {}
): void {
  try {
    const payload = {
      session_id: getSessionId(),
      visitor_id: getVisitorId(),
      page: funnel,
      event_type: 'funnel_step',
      step,
      answer: null,
      outcome: null,
      metadata: {
        step_index: stepIndex,
        device: window.innerWidth < 768 ? 'mobile' : window.innerWidth < 1024 ? 'tablet' : 'desktop',
        ...getUTMParams(),
        ...extra,
      },
    };

    const url = `${SUPABASE_URL}/rest/v1/funnel_events`;
    const headers = {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal',
    };

    // Prefer sendBeacon (survives page unloads), fallback to fire-and-forget fetch
    if (navigator.sendBeacon) {
      const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
      // sendBeacon can't set custom headers, so use fetch instead but in fire-and-forget mode
      fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
        keepalive: true,
      }).catch(() => {});
    } else {
      fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      }).catch(() => {});
    }
  } catch {
    // Never throw — tracking must never break the app
  }
}
