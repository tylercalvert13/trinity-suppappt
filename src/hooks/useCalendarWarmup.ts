import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * Sends a lightweight warmup request to the ghl-calendar edge function
 * to prevent cold starts when users reach the booking widget.
 * 
 * This should be called early in the funnel (e.g., on landing page mount)
 * so the function is warm by the time users need to book.
 */
export function useCalendarWarmup() {
  const hasWarmedUp = useRef(false);

  useEffect(() => {
    // Only warmup once per page session
    if (hasWarmedUp.current) return;
    hasWarmedUp.current = true;

    const warmupCalendar = async () => {
      try {
        console.log('[Warmup] Sending warmup request to ghl-calendar...');
        const startTime = Date.now();
        
        await supabase.functions.invoke('ghl-calendar', {
          body: { action: 'warmup' }
        });
        
        const duration = Date.now() - startTime;
        console.log(`[Warmup] Calendar function warmed up in ${duration}ms`);
      } catch (err) {
        // Silently fail - warmup is best-effort
        console.log('[Warmup] Warmup request failed (non-critical):', err);
      }
    };

    // Small delay to not block initial render
    const timer = setTimeout(warmupCalendar, 500);
    return () => clearTimeout(timer);
  }, []);
}
