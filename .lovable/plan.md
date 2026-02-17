

## Fix /suppappt Analytics: Query Limits and Missing Data

### Problem 1: 1,000-Row Query Cap (Critical)
The data fetch in `Analytics.tsx` does not override the default query limit of 1,000 rows. In the last 7 days alone, /suppappt has:
- **8,160 sessions** (only ~1,000 fetched = 12%)
- **30,558 events** (only ~1,000 fetched = 3%)
- **1,240 submissions** (only ~1,000 fetched = 80%)

All KPIs, funnel charts, and booking widget conversion numbers are severely undercounted.

### Problem 2: Disqualified Sessions Invisible in Funnel
When a user gets disqualified, `last_step` is set to `"disqualified"`. But the funnel step order array doesn't include `"disqualified"`, so `stepOrder.indexOf("disqualified")` returns `-1`. These sessions (454 in the last 7 days) are excluded from every funnel step count, making drop-off numbers inaccurate.

---

### Fix for Problem 1: Paginated Fetching

Since we can't fetch 30K+ rows in one call, we'll use a pagination helper that loops through results in batches of 1,000 until all rows are fetched. This will be applied to all three queries (sessions, events, submissions).

**File: `src/pages/Analytics.tsx`**

Add a `fetchAllRows` helper function that paginates using `.range(offset, offset + 999)` until fewer than 1,000 rows are returned. Replace the three `supabase.from(...)` calls with this helper.

### Fix for Problem 2: Include "disqualified" in Step Order

**File: `src/pages/Analytics.tsx`**

Add `"disqualified"` to the `funnelSteps` array (after `"contact"` and before `"loading"`), so sessions with `last_step === "disqualified"` are correctly counted as having reached at least the step before disqualification. The label can be "Disqualified" and it represents users who answered health screening questions but didn't pass.

Actually, a more accurate approach: since disqualified users could have been DQ'd at different steps (care, treatment, or medications), we should treat "disqualified" as equivalent to reaching at least the step where disqualification happens. The simplest correct fix is to insert "disqualified" into the step order right after the last health screening step ("medications"), so DQ'd users are counted as reaching at least that far. This slightly overcounts for users DQ'd at "care" (step 4) but ensures they're not invisible.

### Technical Details

**`src/pages/Analytics.tsx` changes:**

1. Add paginated fetch helper:
```typescript
const fetchAllRows = async (query) => {
  let allData = [];
  let offset = 0;
  const batchSize = 1000;
  while (true) {
    const { data, error } = await query.range(offset, offset + batchSize - 1);
    if (error) throw error;
    if (!data || data.length === 0) break;
    allData = [...allData, ...data];
    if (data.length < batchSize) break;
    offset += batchSize;
  }
  return allData;
};
```

2. Refactor `fetchData` to use paginated queries for sessions, events, and submissions.

3. Update `funnelSteps` array to include `{ step: 'disqualified', label: 'Disqualified' }` after "medications" so that DQ'd sessions appear in the funnel chart.

### Impact
- All KPI cards will show accurate totals instead of capped-at-1000 counts
- Funnel drop-off chart will correctly represent all visitors including disqualified ones
- Booking widget conversion funnel will show correct numbers
- Average savings calculations will be based on complete data

