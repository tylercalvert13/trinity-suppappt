

## Plan: Batch-Fetch All 4 Days of Slots in a Single API Call

### Problem Analysis
The current slot loading is slow (20-30 seconds) because:
1. **Sequential Fetching**: Each day's slots are fetched one at a time
2. **Cold Starts**: Each edge function call can hit cold start delays (up to 5+ seconds each)
3. **Network Overhead**: 4 separate HTTP requests instead of 1

### Solution: Fetch All Days at Once
The GHL Free Slots API **already supports date ranges**! We just need to:
1. Add a `free-slots-batch` action to the edge function that fetches a week's worth of slots
2. Call this once on widget mount instead of fetching day-by-day
3. Cache all 4 days immediately so clicking any day shows slots instantly

### Verified by Testing
Single-day fetch works: `POST {"action": "free-slots", "date": "2026-01-29"}` returns slots for that day.
The API uses `startDate` and `endDate` in epoch milliseconds — we just need to widen the range.

---

## Files to Modify

| File | Changes |
|------|---------|
| `supabase/functions/ghl-calendar/index.ts` | Add `free-slots-batch` action that fetches multiple days at once |
| `src/components/AppointmentBookingWidget.tsx` | Replace single-day preload with batch preload for all 4 days |

---

## Technical Changes

### 1. Edge Function: Add Batch Slots Action

Add a new interface and action handler:

```typescript
interface FreeSlotsRequest {
  action: 'free-slots';
  date: string; // YYYY-MM-DD format (kept for backwards compatibility)
}

interface FreeSlotsRangeRequest {
  action: 'free-slots-batch';
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
}
```

```typescript
// ========== FREE SLOTS BATCH (multiple days) ==========
if (body.action === 'free-slots-batch') {
  const { startDate, endDate } = body as FreeSlotsRangeRequest;
  console.log('Fetching slots for range:', startDate, 'to', endDate);

  const startDateMs = getEasternDayStartMs(startDate);
  const endDateMs = getEasternDayEndMs(endDate);

  const url = `${GHL_BASE_URL}/calendars/${CALENDAR_ID}/free-slots?startDate=${startDateMs}&endDate=${endDateMs}&timezone=America/New_York`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${GHL_API_TOKEN}`,
      'Version': CALENDAR_API_VERSION,
    },
  });

  const data = await response.json();

  // Parse response - GHL returns { "2026-01-29": { slots: [...] }, "2026-01-30": { slots: [...] }, ... }
  const slotsByDate: Record<string, string[]> = {};

  for (const dateKey of Object.keys(data)) {
    if (dateKey === 'traceId') continue;
    if (data[dateKey]?.slots && Array.isArray(data[dateKey].slots)) {
      slotsByDate[dateKey] = data[dateKey].slots.map((slot: string) => {
        return slot.startsWith('T') ? `${dateKey}${slot}` : slot;
      });
    }
  }

  return new Response(
    JSON.stringify({ slotsByDate }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}
```

### 2. Widget: Batch Preload All 4 Days on Mount

Replace the single-day preload with a batch request:

```tsx
// Preload ALL days' slots on mount (single API call)
useEffect(() => {
  if (preloadedSlots.size > 0) return; // Already loaded

  const preloadAllSlots = async () => {
    setIsPreloading(true);
    setPreloadError(null);

    try {
      const firstDay = availableWeekdays[0];
      const lastDay = availableWeekdays[availableWeekdays.length - 1];

      const startDate = formatDateString(firstDay);
      const endDate = formatDateString(lastDay);

      console.log('[Batch Preload] Fetching slots for', startDate, 'to', endDate);
      const startTime = Date.now();

      const { data, error: fetchError } = await supabase.functions.invoke('ghl-calendar', {
        body: { action: 'free-slots-batch', startDate, endDate }
      });

      const duration = Date.now() - startTime;
      console.log(`[Batch Preload] All slots loaded in ${duration}ms`);

      if (fetchError) throw fetchError;

      if (data.slotsByDate) {
        const newCache = new Map<string, SlotData[]>();

        for (const [dateStr, slots] of Object.entries(data.slotsByDate)) {
          const slotsWithDisplay = (slots as string[]).map((slot: string) => ({
            original: slot,
            display: convertToUserTimezone(slot, userTimezone)
          }));
          newCache.set(dateStr, slotsWithDisplay);
        }

        setPreloadedSlots(newCache);
        console.log('[Batch Preload] Cached slots for', newCache.size, 'days');
      }
    } catch (err) {
      console.error('[Batch Preload] Error:', err);
      setPreloadError('Unable to load availability');
    } finally {
      setIsPreloading(false);
    }
  };

  preloadAllSlots();
}, [availableWeekdays, userTimezone]);
```

### 3. Update Warmup to Include Batch Action

The warmup hook can optionally trigger the batch fetch early when the funnel loads (even before user qualifies):

```tsx
// In useCalendarWarmup.ts - optionally fetch slots eagerly
const { data } = await supabase.functions.invoke('ghl-calendar', {
  body: { action: 'warmup' }
});
```

---

## Performance Improvement Estimates

| Metric | Before (4 separate calls) | After (1 batch call) |
|--------|---------------------------|----------------------|
| Edge function invocations | 4 | 1 |
| Cold start risk | 4× (worst case ~20-30s total) | 1× (worst case ~5-7s) |
| Time to show all slots | 20-30 seconds | 2-5 seconds |
| API calls to GHL | 4 | 1 |

---

## User Experience After Changes

1. User lands on `/suppappt` funnel page
2. Warmup ping fires (keeps function warm)
3. User completes quote form → qualifies
4. Booking widget mounts → **single batch request fetches all 4 days**
5. User sees all 4 day buttons → clicks any one → slots appear **instantly** (already cached)
6. Total wait: 2-5 seconds (vs. current 20-30 seconds)

---

## Backwards Compatibility

The original `free-slots` action (single day) remains unchanged for any other code that might use it. The new `free-slots-batch` action is additive.

