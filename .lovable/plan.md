
## Fix: Analytics Dashboard "Today" Filter and Timezone Handling

### Problem
Two bugs inflate the "Today" appointment count:
1. Selecting "Today" (`dateRange = "1"`) computes `subDays(new Date(), 1)` which fetches from the start of **yesterday**, not today -- pulling in ~2 days of data
2. The "today" string used for KPI sub-labels (`+X today`) is based on browser local time but compared against UTC timestamps in the database

### Changes

**File: `src/pages/Analytics.tsx`**

1. **Fix the "Today" date range calculation**
   - Change the logic so `dateRange = "1"` means "today only" (0 days ago), not "1 day ago"
   - Rename the value from `"1"` to `"0"` internally, OR adjust the math: `const daysAgo = dateRange === "1" ? 0 : parseInt(dateRange)`
   - This ensures selecting "Today" fetches from `startOfDay(new Date())` to `endOfDay(new Date())`

2. **Fix the "today" timezone comparison**
   - Currently: `const today = format(new Date(), 'yyyy-MM-dd')` then `e.created_at.startsWith(today)` -- this compares ET local date against UTC timestamps
   - Fix: Convert each event's `created_at` to Eastern time before comparing, OR compute today's start/end boundaries in UTC offset by -5 hours and filter with those boundaries instead of string matching
   - Simplest approach: define `todayStartUTC` and `todayEndUTC` based on Eastern midnight, then filter events with `created_at >= todayStartUTC && created_at < todayEndUTC`

3. **Use unique session counts for booking KPIs**
   - Change `bookingCompleted` from `.length` (total events) to counting unique `session_id`s to prevent any double-counting from page refreshes
   - Same for `todayBookedEvents`

### Impact
- Only the Analytics dashboard display logic changes
- No changes to event tracking, funnels, booking widget, webhooks, or quote API
- All other pages and functionality remain untouched

### Technical Detail

Current problematic code (line 124-126):
```text
const daysAgo = parseInt(dateRange);
const startDate = startOfDay(subDays(new Date(), daysAgo)).toISOString();
```

Fixed:
```text
const daysAgo = dateRange === "1" ? 0 : parseInt(dateRange);
const startDate = startOfDay(subDays(new Date(), daysAgo)).toISOString();
```

Current timezone issue (lines 192, 676-678):
```text
const today = format(new Date(), 'yyyy-MM-dd');
const todayBookedEvents = pageEvents.filter(e =>
  e.event_type === 'booking_completed' && e.created_at.startsWith(today)
).length;
```

Fixed approach -- use ET-aware boundaries:
```text
const todayET = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/New_York' }));
const todayStart = new Date(todayET.getFullYear(), todayET.getMonth(), todayET.getDate()).toISOString();
const todayEnd = new Date(todayET.getFullYear(), todayET.getMonth(), todayET.getDate() + 1).toISOString();

// Then filter with date range comparison instead of string matching
const todayBookedEvents = new Set(
  pageEvents.filter(e =>
    e.event_type === 'booking_completed' &&
    e.created_at >= todayStart && e.created_at < todayEnd
  ).map(e => e.session_id)
).size;
```

All "today" metric calculations across the file (overview, quote funnel, appointment funnel tabs) will use this same fix for consistency.
