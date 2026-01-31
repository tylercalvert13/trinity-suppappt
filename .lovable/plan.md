
# Simplify & Enhance Sales Dashboard - Submissions Only

## Overview
Remove the Tracking tab dependency and enhance the dashboard using only the Submissions tab data. Add new insights using the additional columns available (State, Previous Carrier, New Carrier).

---

## Changes Summary

### 1. Remove Tracking Tab Dependency
- Delete the `TRACKING_URL` constant
- Simplify fetch to only call `SUBMISSIONS_URL`
- Generate daily stats purely from submission dates (already has fallback logic)

### 2. Update Data Model
Add new fields from the spreadsheet:
- **State** - For geographic insights
- **Previous Carrier** - Track where clients are switching from
- **New Carrier** - Track which carriers we're placing with

### 3. New Dashboard Enhancements

| New Feature | Description |
|-------------|-------------|
| **Carrier Breakdown** | Pie chart showing New Carrier distribution |
| **State Distribution** | Show which states have the most sales |
| **Avg Commission** | Display average commission per approved sale |
| **Pending Premium** | Show potential premium from pending sales |

---

## Files to Modify

### `src/pages/SalesTracking.tsx`

#### Data Fetching (lines 147-273)
- Remove `TRACKING_URL` fetch
- Add state, previousCarrier, newCarrier to Submission interface
- Generate dailyStats directly from submissions (remove tracking fallback)

#### New Stats Calculations
```text
- avgCommission = totalCommission / approved
- pendingPremium = sum of premium where status = "pending"
- carrierStats = group by New Carrier with counts
- stateStats = group by State with counts
```

#### Enhanced Stats Grid
Replace current 5-card grid with 6 cards:
1. Total Sales (all submissions)
2. Approved (with approval rate)
3. Pending (with pending premium as subtitle)
4. Denied (new card)
5. Total Premium (approved only)
6. Total Commission (approved only, with avg per sale)

#### New Charts
- **Replace "Sales by Day"** with a stacked bar showing Approved vs Pending by day
- **Add "Top Carriers"** chart showing New Carrier distribution

#### Enhanced Recent Submissions Table
Add columns:
- State
- Previous Carrier → New Carrier (as a transition indicator)

---

## Technical Details

### Submission Interface Update
```text
interface Submission {
  date: string;
  agent: string;
  clientName: string;
  state: string;
  previousCarrier: string;
  newCarrier: string;
  premium: number;
  status: string;
  commission: number;
}
```

### New Carrier Stats Interface
```text
interface CarrierStats {
  name: string;
  count: number;
  premium: number;
}
```

### Daily Stats Enhancement
```text
interface DailyStats {
  date: string;
  approved: number;
  pending: number;
  denied: number;
  total: number;
}
```

---

## Calculation Logic (Unchanged Core)

| Metric | Calculation |
|--------|-------------|
| Total Sales | Count of ALL submissions |
| Approved | Count where Status = "Approved" |
| Pending | Count where Status = "Pending" |
| Denied | Count where Status = "Denied" |
| Total Premium | Sum Premium where Status = "Approved" |
| Total Commission | Sum Commission where Status = "Approved" |
| Pending Premium (new) | Sum Premium where Status = "Pending" |
| Avg Commission (new) | Total Commission / Approved count |

---

## Expected Result

A streamlined dashboard that:
- Fetches from only the Submissions tab (single data source)
- Shows 6 KPI cards including Denied count and enhanced subtitles
- Displays stacked bar chart with Approved/Pending/Denied by day
- Shows carrier distribution to see which carriers are most popular
- Lists top agents with complete metrics
- Shows recent submissions with state and carrier transition info
- Maintains existing refresh and loading states
