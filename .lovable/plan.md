
## What’s actually going wrong (based on today’s analytics + backend logs)

### 1) Users are being shown “valid” days that actually have **zero** available time slots
- In the last 24 hours:
  - **/suppappt**: `booking_day_selected=20` but `booking_error(no_slots)=4`
  - **/suppappt-refund**: `booking_day_selected=5` but `booking_error(no_slots)=7`  
    (Those errors happen when users click a day and the API returns no slots.)
- Root cause: the calendar API response for the batch endpoint **omits dates with 0 slots** instead of returning them as `{ date: { slots: [] } }`.
  - We confirmed this by calling the backend function:
    - The response included `2026-01-30`, `2026-02-03`, `2026-02-04`, etc.
    - It **skipped** `2026-02-02` entirely (a weekday), because it had no slots.
  - Your UI currently hides a day only if it has an explicit cached entry with `[]`. If a date is *missing entirely*, the UI treats it as “unknown” and still shows it, which leads to “no slots” errors and abandonment.

### 2) The backend function has occasional 500s from malformed requests
- We have recent `ghl-calendar` 500 logs:
  - `TypeError: Cannot read properties of undefined (reading 'split')` in `getEasternDayStartMs`
- These appear to come from `Go-http-client/2.0` (not your browser), likely a bot/monitor hitting the function with an incomplete payload.
- Even if it’s not causing most funnel drops, it’s still a real bug: the function should return a clean 400 with a helpful error rather than throwing.

### 3) Refund variant is underperforming specifically at the “time → confirm” stage
- Last 24 hours:
  - **/suppappt**: `booking_time_selected=19`, `booking_confirm_clicked=9`, `booking_completed=9`
  - **/suppappt-refund**: `booking_time_selected=2`, `booking_confirm_clicked=0`, `booking_completed=0`
- The biggest confirmed technical friction in refund is still “no slots” exposure (see #1). After we fix day availability display, we’ll re-check whether “confirm_clicked” starts appearing again. If it remains at 0, we’ll instrument/inspect the UI click path next.

---

## Fix plan (code changes)

### A) Fix the “missing zero-slot dates” bug at the source (backend function)
**File:** `supabase/functions/ghl-calendar/index.ts`

1) **In `free-slots-batch` action**
   - After parsing the API response into `slotsByDate`, we will:
     - Generate every date string from `startDate` → `endDate` (inclusive)
     - For any date not present in the API response, explicitly set:
       - `slotsByDate[date] = []`
   - This ensures the frontend can reliably distinguish:
     - “known empty day” ([]) vs “not loaded yet” (missing)

2) Add strict input validation per action to prevent 500s:
   - If `action === 'free-slots'` and `date` is missing/invalid → return 400 JSON `{ error: 'invalid_request', message: 'date is required (YYYY-MM-DD)' }`
   - If `action === 'free-slots-batch'` and `startDate/endDate` missing/invalid → return 400 similarly
   - This eliminates the `split` crash and cleans up logs.

**Why this matters:** It directly prevents the UI from showing “phantom” days that will always error.

---

### B) Make the booking widget only show days that truly have availability (and keep 4 good options)
**File:** `src/components/AppointmentBookingWidget.tsx`

1) Expand the preload date range so we can always show 4 “good” days
- Right now you preload a range based on **next 4 weekdays**, but if one of them has 0 slots you end up with fewer real options.
- Update strategy:
  - Generate a larger set of candidate weekdays (example: next **10 weekdays**)
  - Batch preload once for that whole range
  - After preload completes, compute:
    - `daysWithSlots = candidateDays.filter(day => preloadedSlots[day].length > 0)`
  - Render **the first 4** days from `daysWithSlots`
  - If fewer than 4 exist, render what we have and show a clear “No online times available soon” fallback with the call option.

2) Prevent “fast click while preloading” edge-case
- While preloading is running and we don’t yet know slot counts, we will:
  - Either disable day buttons briefly, or
  - Keep them visible but show “Loading times…” and disable interaction until preload completes
- This removes the chance of a user clicking a day before it can be filtered.

3) Improve the availability badge so it never implies availability when unknown
- Today, days without cached data show “Morning & Afternoon”, which is misleading.
- Change default badge states:
  - Unknown / still loading: “Checking times…”
  - Known slots: “X times available” (or morning/afternoon if you prefer)
  - Known zero slots: the day won’t render

4) Add explicit analytics when there are no days with slots in the range
- Track a `booking_error` (or a new event type) like:
  - `error: 'no_slots_in_range'`
  - `startDate/endDate` metadata
- This makes it immediately visible in analytics if the calendar is genuinely empty vs a UI bug.

---

### C) Apply the same day-availability fixes to the Opt-In widget to prevent future recurrence
**File:** `src/components/AppointmentBookingWidgetWithOptIn.tsx`

This component currently preloads only the first day and may still allow selecting days that end up with `no_slots`.
- We’ll either:
  1) Convert it to the same batch-preload approach as `AppointmentBookingWidget`, or
  2) At minimum, once a user clicks a day that returns 0 slots, automatically remove that day from the selectable list and promote the next available day.

(Preferred: make both widgets share the same robust slot-loading approach so you don’t get “works on /suppappt but not /suppappt1” problems later.)

---

## Verification checklist (what I’ll test after implementing)

1) **Backend sanity**
- Call `free-slots-batch` for a range that includes known “empty” weekdays:
  - Confirm response includes those dates with `[]` (not missing keys)
- Call with missing params:
  - Confirm it returns a 400 JSON (not 500)

2) **/suppappt and /suppappt-refund end-to-end**
- Go through the flow to the booking widget
- Confirm:
  - No weekday with 0 slots is shown
  - Selecting any shown day always produces at least one time slot
  - No `booking_error(no_slots)` occurs unless the user’s slot is taken (409) or something truly changes live
  - Booking still completes successfully

3) **Analytics validation**
- Confirm that:
  - `booking_error(no_slots)` sharply drops
  - Refund funnel starts registering `booking_confirm_clicked` and hopefully `booking_completed`

---

## Files that will be changed
- `supabase/functions/ghl-calendar/index.ts` (fill missing days + validate inputs; reduce 500s)
- `src/components/AppointmentBookingWidget.tsx` (show only real available days; ensure 4 good options; avoid misleading badge)
- `src/components/AppointmentBookingWidgetWithOptIn.tsx` (bring it up to the same robustness)

---

## Expected outcome
- Users will no longer hit “No times available on this day” after selecting a day (because those days won’t be selectable).
- You should see an immediate improvement in lead → booking conversion, especially on **/suppappt-refund**, where today’s drop-off is heavily consistent with users encountering day/slot dead ends.
