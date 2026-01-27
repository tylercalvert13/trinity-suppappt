

## Plan: Add Appointment Funnel Analytics Tabs + Clean Test Data

### Overview
This plan adds two new analytics tabs for the `/suppappt` and `/suppappt1` funnels to track drop-off rates and booking conversions. It also updates the internal team member filter to exclude Justin Falck's test data.

---

### Part 1: Add Justin Falck to Internal Team Filter

**File:** `src/lib/analyticsFilters.ts`

Add Justin Falck to the existing `INTERNAL_TEAM_MEMBERS` array so his test submissions are automatically filtered out from all analytics views.

```typescript
export const INTERNAL_TEAM_MEMBERS = [
  { firstName: 'tyler', lastName: 'calvert' },
  { firstName: 'josh', lastName: 'foret' },
  { firstName: 'justin', lastName: 'falck' },  // NEW
];
```

This will automatically filter out their data from:
- Submissions table (quotes)
- Live Activity Feed

---

### Part 2: Add Two New Tabs to Analytics Dashboard

**File:** `src/pages/Analytics.tsx`

Add two new tabs: "Appt Funnel" and "Appt1 Funnel" that show:
- Overview KPI cards (visitors, qualified, booked appointments, disqualified)
- 12-step funnel drop-off chart (same format as suppquote)
- Booking widget conversion metrics (booking_widget_view → booking_completed)

**New Tab Structure:**

```text
[Overview] [Funnels] [Quote Funnel] [Appt Funnel] [Appt1 Funnel] [Traffic Sources] [Live Activity]
                                     ^^^^^^^       ^^^^^^^^^^^^
                                       NEW             NEW
```

---

### Part 3: Technical Implementation Details

#### Data Fetching Changes
Modify `fetchData()` to also fetch submissions for `suppappt` and `suppappt1` pages:

```typescript
// Current: only fetches suppquote
.eq('page', 'suppquote')

// New: fetch all funnel pages
.in('page', ['suppquote', 'suppappt', 'suppappt1'])
```

#### Funnel Steps for Appointment Funnels
Based on the database, both `/suppappt` and `/suppappt1` track these steps:
- start → plan → payment → care → treatment → medications → gender → tobacco → spouse → age → zip → contact → loading → qualified/disqualified

Plus booking-specific events:
- booking_widget_view
- booking_day_selected
- booking_time_selected
- booking_confirm_clicked
- booking_completed

#### New Metrics to Display

| Metric | Description |
|--------|-------------|
| Total Visitors | Sessions with page = suppappt/suppappt1 |
| Qualified | Sessions with completed = true |
| Appointments Booked | Count of booking_completed events |
| Booking Conversion | booking_completed / qualified (%) |
| Disqualified | Sessions with last_step = disqualified |
| Avg Savings | Average monthly_savings from successful quotes |

#### Booking Funnel Mini-Chart
Show the booking widget conversion funnel:
```text
Widget View → Day Selected → Time Selected → Confirm Clicked → Booked
```

This uses the tracked events:
- booking_widget_view
- booking_day_selected  
- booking_time_selected
- booking_confirm_clicked
- booking_completed

---

### Files to Modify

| File | Changes |
|------|---------|
| `src/lib/analyticsFilters.ts` | Add Justin Falck to INTERNAL_TEAM_MEMBERS |
| `src/pages/Analytics.tsx` | Add suppappt and suppappt1 tabs with KPI cards, funnel dropoff charts, and booking conversion metrics |

---

### New Component: AppointmentFunnelOverview (inline)

Similar to `QuoteFunnelOverview` but tailored for appointment funnels:
- Total Visitors
- Qualified (got a quote)
- Appointments Booked
- Booking Rate (% of qualified who booked)
- Disqualified
- Avg Monthly Savings

---

### Summary

After implementation:
1. Justin Falck's test data will be automatically filtered from analytics
2. Tyler Calvert and Josh Foret data continues to be filtered (already in place)
3. New "Appt Funnel" tab shows `/suppappt` drop-off at each step
4. New "Appt1 Funnel" tab shows `/suppappt1` drop-off at each step
5. Both tabs include booking widget conversion metrics (widget view → completed)

This will help identify where users are dropping off in the appointment funnels and measure booking widget effectiveness.

