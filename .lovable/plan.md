

## Plan: Optimize Booking Widget Speed & UX for Maximum Appointments

### Problem Summary
Cold starts on the `ghl-calendar` edge function are causing 20-30 second delays before users see available time slots. This long wait causes users to abandon before booking, directly hurting appointment rates.

---

### Solution: Multi-Pronged Optimization

We'll implement 4 improvements that work together to eliminate perceived wait time and keep users engaged:

---

### 1. Preload Slots on Widget Mount (Biggest Impact)

**Current behavior**: User clicks a day → starts fetching slots → waits 5-30 seconds  
**New behavior**: Slots for the first available day are fetched immediately when the widget appears

**Technical approach**:
- Add a `useEffect` that runs on widget mount
- Preload slots for the first weekday (typically "Today" or "Tomorrow")
- Store in state so clicking that day shows slots instantly
- Continue fetching in background for other days if needed

```typescript
// On mount, preload first day's slots
useEffect(() => {
  const firstDay = availableWeekdays[0];
  if (firstDay) {
    prefetchSlots(firstDay);
  }
}, []);
```

**Result**: By the time the user reads the heading and decides to click a day, slots are already loaded.

---

### 2. Skeleton Loading State Instead of Spinner

**Current behavior**: Full-screen spinner with "Checking availability..."  
**New behavior**: Show the day buttons immediately with a subtle loading indicator

**Technical approach**:
- Show the 4 day buttons right away (clickable)
- Display a small "Loading availability..." badge on the first day
- When slots arrive, badge updates to "Morning & Afternoon available"

```typescript
// Show days immediately, with loading badge on first day
<button>
  <span>Today</span>
  <span>{isPreloading ? "Loading..." : "Morning & Afternoon"}</span>
</button>
```

**Result**: Users see content immediately, reducing perceived wait time.

---

### 3. Edge Function Warmup Endpoint

**Purpose**: Keep the function warm so cold starts don't happen during business hours

**Technical approach**:
- Add a lightweight `warmup` action to the edge function
- Returns immediately with `{ status: "warm" }`
- Can be pinged via cron job or client-side prefetch

```typescript
// Add to ghl-calendar edge function
if (body.action === 'warmup') {
  return new Response(
    JSON.stringify({ status: 'warm', timestamp: Date.now() }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}
```

**Plus**: Add a warmup call from the main funnel page before user reaches booking widget:
- On `/suppappt` funnel, fire a warmup request when user lands or progresses
- By the time they reach the booking step, function is already warm

---

### 4. Optimistic Day Selection with Parallel Fetch

**Current behavior**: Click day → wait → see morning/afternoon options  
**New behavior**: Click day → immediately see morning/afternoon buttons (loading) → buttons activate when data arrives

**Technical approach**:
- Show Step 2 (Morning/Afternoon) immediately with skeleton state
- Buttons show "Loading..." until slots confirm availability
- If a time range has no slots, it fades/disables instead of disappearing

---

### Implementation Files

| File | Changes |
|------|---------|
| `src/components/AppointmentBookingWidget.tsx` | Add preload on mount, skeleton states, optimistic transitions |
| `supabase/functions/ghl-calendar/index.ts` | Add `warmup` action |
| `src/pages/MedicareSupplementAppointment.tsx` | Add background warmup call when funnel loads |
| `src/pages/MedicareSupplementQuote.tsx` | Add background warmup call when funnel loads |

---

### User Experience Flow (After Changes)

```text
1. User arrives on /suppappt
   └── Background: warmup request sent to edge function

2. User completes form, sees quote, reaches booking widget
   └── Widget mounts → immediately starts preloading first day's slots
   └── User sees 4 day buttons instantly (with loading badge on first)

3. User clicks "Today" (or first day)
   └── If preload complete: slots appear instantly
   └── If still loading: show skeleton Morning/Afternoon buttons

4. User selects Morning/Afternoon → Time
   └── No additional network calls needed
```

---

### Expected Impact

| Metric | Before | After |
|--------|--------|-------|
| Time to see day buttons | 0-30 sec | 0 sec |
| Time to see time slots | 5-30 sec | 0-2 sec |
| Perceived wait | "Is this broken?" | Smooth, instant |
| Appointment completion rate | Lower | Higher |

---

### Summary

This plan eliminates perceived wait time through:
1. **Preloading** - Fetch data before user needs it
2. **Skeleton states** - Show UI immediately, fill in data
3. **Function warmup** - Prevent cold starts during peak hours
4. **Optimistic transitions** - Move forward immediately, confirm async

All changes maintain existing functionality while dramatically improving the booking experience.

