

## Add Date Range Filter to Sales Tracking Dashboard

### What you'll get
A date range picker in the dashboard header that filters ALL data across all three tabs (Sales, Ads, Appointments). You can pick a single date or a date range. By default it shows "All Time" (no filter).

### UI Design
- A date picker button placed next to the existing "Refresh" button in the header
- Clicking it opens a calendar popover where you can select a start and end date (or a single date)
- Quick presets: "Today", "Last 7 Days", "Last 30 Days", "This Month", "All Time"
- Selected range displays on the button (e.g., "Feb 1 - Feb 12" or "All Time")

### How it works
The date filtering happens client-side after the CSV data is fetched. Each hook already parses all rows from the Google Sheet — we just filter the rows by date before calculating totals. This means:
- No extra API calls
- Instant filtering when you change dates
- All KPIs, charts, and tables update to reflect only the selected date range

### Technical Details

**New component: `src/components/sales/DateRangeFilter.tsx`**
- Uses the existing `Calendar` component (already in the project) inside a `Popover`
- Supports range selection mode from react-day-picker
- Includes quick preset buttons (Today, 7 Days, 30 Days, This Month, All Time)
- Emits `{ from: Date | null, to: Date | null }` on change

**Modified: `src/hooks/useSalesData.ts`**
- Accept an optional `dateRange: { from: Date | null, to: Date | null }` parameter
- After parsing CSV rows into `Submission[]`, filter by date range before computing totals, agent stats, carrier stats, daily stats, and recent submissions

**Modified: `src/hooks/useAdsData.ts`**
- Accept the same `dateRange` parameter
- Filter `dailyStats` rows by date range before computing totals

**Modified: `src/hooks/useAppointmentData.ts`**
- Accept the same `dateRange` parameter
- Filter `dailyStats` rows by date range before computing totals

**Modified: `src/pages/SalesTracking.tsx`**
- Add `dateRange` state: `useState<{ from: Date | null; to: Date | null }>({ from: null, to: null })`
- Pass `dateRange` to all three hooks
- Render `DateRangeFilter` in the header next to the Refresh button
- All tabs automatically reflect the filtered data since they consume the hook data

**No changes to child components** — `StatCard`, `DailySalesChart`, `CarrierChart`, `AgentTable`, `AdsTrackingTab`, `AppointmentsTrackingTab`, etc. all receive already-filtered data from the hooks, so they work without modification.

