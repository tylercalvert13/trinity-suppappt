import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * Sends a lightweight warmup request to the get-medicare-quote edge function
 * to pre-cache the CSG API session token and prevent cold start delays.
 * 
 * This should be called early in the funnel (e.g., on landing page mount)
 * so the quote API is ready by the time users submit their info.
 */
export function useQuoteWarmup() {
  const hasWarmedUp = useRef(false);

  useEffect(() => {
    // Only warmup once per page session
    if (hasWarmedUp.current) return;
    hasWarmedUp.current = true;

    const warmupQuoteApi = async () => {
      try {
        console.log('[Warmup] Pre-warming quote API...');
        const startTime = Date.now();
        
        const { data, error } = await supabase.functions.invoke('get-medicare-quote', {
          body: { action: 'warmup' }
        });
        
        if (error) {
          console.log('[Warmup] Quote warmup failed (non-critical):', error);
          return;
        }
        
        const duration = Date.now() - startTime;
        console.log(`[Warmup] Quote API ready in ${duration}ms`, data);
      } catch (err) {
        // Silently fail - warmup is best-effort
        console.log('[Warmup] Warmup request failed (non-critical):', err);
      }
    };

    // Small delay to not block initial render
    const timer = setTimeout(warmupQuoteApi, 500);
    return () => clearTimeout(timer);
  }, []);
}
