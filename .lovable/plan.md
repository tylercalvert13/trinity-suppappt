
# Fix Sales Tracking Dashboard Column References

## Problem
The dashboard is referencing incorrect column names from the Submissions CSV and has incorrect logic for "Total Sales" count.

---

## Column Mapping Fix

| Dashboard Expects | Actual CSV Column |
|-------------------|-------------------|
| `Client Name` / `clientName` / `Name` | `Client` |
| Other columns | Already correct (Date, Agent, Premium, Status, Commission) |

---

## Calculation Logic Fixes

### Total Sales
- **Current**: Counts only `approved + pending`
- **Should be**: Count ALL submissions regardless of status

### Premium & Commission (Already Correct)
- Current code already filters for `status === "approved"` before summing Premium and Commission
- No change needed for revenue calculations

### Status Counts (Minor Fix)
- Add counting for Denied status separately (already done, but verify totals)

---

## Files to Modify

### `src/pages/SalesTracking.tsx`

#### 1. Fix Client Column Mapping (line ~172)
```text
Before: row["Client Name"] || row["clientName"] || row["Name"]
After:  row["Client"] || row["Client Name"] || row["clientName"]
```

#### 2. Fix Total Sales Calculation (line ~255)
```text
Before: totalSales: approved + pending
After:  totalSales: submissions.length (count ALL submissions)
```

---

## Technical Details

The Submissions tab has these exact column headers:
- **A**: Date
- **B**: Agent  
- **C**: Client
- **D**: State
- **E**: Previous Carrier
- **F**: New Carrier
- **G**: Premium
- **H**: Status
- **I**: Commission
- **J**: Submission ID

The code will now:
1. Dynamically match column headers from the CSV (case-insensitive fallbacks)
2. Count **all** submissions for Total Sales
3. Only include **Approved** status rows when summing Premium and Commission
4. Group by Agent with correct totals per agent

---

## Expected Result

| Metric | Calculation |
|--------|-------------|
| Total Sales | Count of ALL rows in Submissions tab |
| Approved | Count where Status = "Approved" |
| Pending | Count where Status = "Pending" |
| Denied | Count where Status = "Denied" |
| Annual Premium | Sum of Premium where Status = "Approved" |
| Total Commission | Sum of Commission where Status = "Approved" |
| Agent Table | Grouped by Agent with Sales (all), Premium (approved), Commission (approved), Approved/Total ratio |
