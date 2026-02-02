

# Fix Declined Status Detection in Sales Dashboard

## Problem
The sales tracking dashboard isn't counting declined applications because the code checks for `"denied"` and `"rejected"` status values, but your Google Sheet uses `"declined"`.

## Solution
Add `"declined"` to the status checks in two files to properly count and display these records.

---

## Changes Required

### File 1: `src/hooks/useSalesData.ts`

**Location 1 - Line 109** (Total counts calculation):
```
Current:  } else if (status === "denied" || status === "rejected") {
Updated:  } else if (status === "denied" || status === "rejected" || status === "declined") {
```

**Location 2 - Line 160** (Daily stats calculation):
```
Current:  } else if (status === "denied" || status === "rejected") {
Updated:  } else if (status === "denied" || status === "rejected" || status === "declined") {
```

---

### File 2: `src/components/sales/RecentSubmissionsTable.tsx`

**Location - Line 27** (Badge display function):
```
Current:  } else if (s === "denied" || s === "rejected") {
Updated:  } else if (s === "denied" || s === "rejected" || s === "declined") {
```

This ensures declined submissions show the red "Denied" badge in the Recent Submissions table.

---

## Impact
- The "Denied" KPI card will now correctly count all declined applications
- The Daily Sales Chart will properly show declined submissions in the daily breakdown
- The Recent Submissions table will display the correct red badge for declined entries

---

## Technical Note
The fix uses a simple OR condition to handle multiple possible status values from the spreadsheet. This makes the code resilient to variations like "denied", "rejected", or "declined" all being treated the same way in the dashboard.

