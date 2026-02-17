

## Fix Appointment Funnel Analytics: Overcounting and Missing Data

### Problem 1: Funnel Overcounting (Major - ~20% inflation at key steps)

The funnel drop-off chart uses `last_step` from sessions to determine how far each user got. But ALL disqualified users have `last_step = "disqualified"` (at index 6 in the step order, after "medications"), regardless of WHERE they were actually disqualified. This inflates counts for steps they never reached.

Real data from the last 7 days shows the magnitude:
- 118 users were disqualified at "care" (step 3) but counted as reaching treatment, medications
- 237 users were disqualified at "treatment" (step 4) but counted as reaching medications
- The funnel shows 1,786 reaching "Medications" when only 1,485 actually did (20% overcount)
- Steps after medications (gender through contact) are also inflated by ~58 users

### Problem 2: Submissions Not Fetched for All Pages

The submissions query (line 152) only fetches pages `suppquote`, `suppappt`, `suppappt1` -- missing `suppappt2`. This means if a suppappt2 tab is ever added, its submission-based metrics (avg savings, carriers) would show zero.

### The Fix

**Switch from `last_step`-based counting to event-based counting for the funnel chart.** The `step_change` events in `funnel_events` accurately record every step a user actually visited. Using event counts gives us the ground truth:

| Step | Current (last_step) | Correct (events) |
|------|---------------------|-------------------|
| Plan | 2,695 | 2,690 |
| Payment | 2,324 | 2,325 |
| Care | 1,819 | 1,821 |
| Treatment | 1,793 | 1,699 |
| Medications | 1,786 | 1,485 |
| Gender | 1,343 | 1,285 |
| Loading | 638 | 634 |

### Technical Details

**File: `src/pages/Analytics.tsx`**

1. Refactor `createAppointmentFunnelData` to count funnel steps using `step_change` events instead of `last_step` session positions:
   - For each funnel step, count unique sessions that have a `step_change` event with that step name
   - "start" step uses `page_view` events instead
   - "qualified" step uses `qualification` events with `step=qualified`
   - Remove "disqualified" from the funnel step sequence entirely (it's a terminal outcome, not a step users pass through)
   - Instead, the disqualified KPI card already shows the correct count

2. Same refactoring applied to `suppquoteDropoffData` (the shared quote funnel) for consistency.

3. Update the submissions fetch query to include `suppappt2` in the page filter.

4. Update the funnel step list used by appointment funnels to remove the "disqualified" entry (keep it only as a KPI card metric).

### Impact
- Funnel drop-off percentages will accurately reflect where users actually abandon
- Treatment/medications step counts drop by ~5-20% to their true values
- Disqualified count remains visible as a KPI card (unchanged)
- No changes to booking widget funnel (already uses events correctly)

