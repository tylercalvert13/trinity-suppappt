

# A/B Test Tracker: "Calm Trust" vs Previous /suppappt Variant

## What You'll Get

A new **"A/B Test"** tab in the analytics dashboard that shows side-by-side performance of the new `calm_trust_v1` variant vs all previous (no-variant) sessions on `/suppappt`. Three key sections:

1. **Summary Cards** — Side-by-side KPIs: Visitors, Engagement Rate (landing → first question), Lead Rate (visitor → qualified/booked), with percentage lift indicators
2. **Conversion Funnel Comparison** — A grouped bar chart showing each funnel step for both variants so you can see exactly where drop-off improves or regresses  
3. **Daily Trend** — Time series of visitors and conversion rate per day, filtered to only show data from the variant launch date forward

## Technical Approach

**File: `src/pages/Analytics.tsx`**
- Add `variant` field to the `Session` interface (already stored in DB via `useFunnelAnalytics`)
- In `createAppointmentFunnelData`, split suppappt sessions into `calm_trust_v1` vs `legacy` (sessions without a variant)
- Compute engagement rate (sessions reaching `plan_type` step / total sessions) and lead rate (qualified + booked / total sessions) for each group
- Pass both datasets to a new component

**New file: `src/components/analytics/ABTestTracker.tsx`**
- Accepts two variant datasets (legacy vs calm_trust_v1) with: visitors, engagementRate, leadRate, funnelSteps, dailyTrend
- Renders:
  - Two side-by-side stat cards with lift % badges (green if positive, red if negative)
  - A grouped horizontal `BarChart` (recharts) comparing funnel step counts
  - A `LineChart` for daily conversion trend since variant launch

**Tab addition in Analytics.tsx:**
- New tab trigger: `A/B Test` with a distinct highlight color
- Tab content renders `<ABTestTracker />` with computed data

No database or backend changes needed — the `variant` column already exists and `calm_trust_v1` is already being written.

