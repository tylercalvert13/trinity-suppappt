

# Fix: Recent Submissions Box Not Updating

## Problem Analysis

After investigating the code, I've identified several issues with the "Recent Submissions" box:

### Issue 1: Date Parsing Problem
In `useSalesData.ts` (lines 193-196), the recent submissions are sorted using:
```typescript
.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
```

If the date format from your Google Sheet (e.g., `2/4/2026` or `02-04-2026`) is not a format that JavaScript's `Date` constructor reliably parses, **all dates may become `NaN`**, causing the sort to be random/arbitrary. This means "recent" submissions may not actually be the most recent ones.

### Issue 2: No Automatic Refresh
The data only fetches once when the page loads. If new submissions are added to the Google Sheet, users must manually click "Refresh" to see them.

---

## Solution

### Step 1: Robust Date Parsing for Recent Submissions

Update the sorting logic to handle common date formats from Google Sheets (MM/DD/YYYY, M/D/YYYY, YYYY-MM-DD, etc.):

**File:** `src/hooks/useSalesData.ts`

Add a helper function to parse dates more robustly:
```typescript
function parseDate(dateStr: string): Date {
  if (!dateStr) return new Date(0);
  
  // Try standard ISO format first
  let date = new Date(dateStr);
  if (!isNaN(date.getTime())) return date;
  
  // Try MM/DD/YYYY or M/D/YYYY format
  const parts = dateStr.split('/');
  if (parts.length === 3) {
    const month = parseInt(parts[0], 10) - 1;
    const day = parseInt(parts[1], 10);
    const year = parseInt(parts[2], 10);
    date = new Date(year, month, day);
    if (!isNaN(date.getTime())) return date;
  }
  
  return new Date(0); // Fallback to epoch if unparseable
}
```

Then update the recent submissions sort:
```typescript
const recentSubmissions = [...submissions]
  .sort((a, b) => parseDate(b.date).getTime() - parseDate(a.date).getTime())
  .slice(0, 5);
```

### Step 2: Increase Recent Submissions Count

Show more submissions for better visibility (e.g., 10 instead of 5):
```typescript
.slice(0, 10);
```

### Step 3: Add Auto-Refresh (Optional Enhancement)

Add a polling mechanism to refresh data every 60 seconds:
```typescript
useEffect(() => {
  fetchData();
  const interval = setInterval(fetchData, 60000); // Refresh every 60s
  return () => clearInterval(interval);
}, [fetchData]);
```

### Step 4: Add Cache-Busting to Google Sheets Request

Google Sheets can cache responses. Add a timestamp parameter to force fresh data:
```typescript
const response = await fetch(`${SUBMISSIONS_URL}&_t=${Date.now()}`);
```

---

## Summary of Changes

| File | Change |
|------|--------|
| `src/hooks/useSalesData.ts` | Add robust date parsing, cache-busting, and optional auto-refresh |

---

## Technical Details

### Why Date Parsing Fails

JavaScript's `Date` constructor is inconsistent across browsers. For example:
- `new Date("2/4/2026")` works in Chrome but may fail in Safari
- `new Date("02-04-2026")` is often interpreted as February 4th or April 2nd depending on locale

By explicitly parsing the date parts, we ensure consistent behavior across all browsers.

### Why Cache-Busting Helps

Google Sheets published CSV URLs can be cached by browsers and CDNs. Adding a unique timestamp query parameter (`&_t=1738698000000`) ensures each request fetches fresh data without being served a stale cached response.

