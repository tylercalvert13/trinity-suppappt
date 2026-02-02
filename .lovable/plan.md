
# Appointments Tracking Tab - Implementation Plan

## Overview
Add a new "Appointments" tab to the `/salestracking` page that displays daily appointment performance metrics including show rates, close rates, and conversion tracking.

## Data Source
- **CSV URL**: `https://docs.google.com/spreadsheets/d/e/2PACX-1vT4lAOPdwFRuw6cy-Cd473TD80rsj-kCfGCKTlvIaWHqDagTDWNjOtyiY8Ih1_Lwyo-b7OSHzFZ8LL4/pub?gid=1434770554&single=true&output=csv`
- **Columns**: Date, Due, Showed, Show %, Closed, Appt -> Close, Show -> Close

## UI Components

### Row 1: Primary KPIs (4 cards, horizontally scrollable on mobile)
1. **Total Due** - Total appointments scheduled
2. **Total Showed** - How many showed up
3. **Total Closed** - Deals closed from appointments
4. **No Shows** - Calculated (Due - Showed)

### Row 2: Rate KPIs (3 cards, horizontally scrollable on mobile)
1. **Show Rate** - Overall (Total Showed / Total Due)
2. **Close Rate (Appt)** - (Total Closed / Total Due)
3. **Close Rate (Show)** - (Total Closed / Total Showed)

### Row 3: Charts (2-column grid on desktop)
1. **Appointments Trend Chart** - Line/bar chart showing Due vs Showed vs Closed over time
2. **Conversion Funnel** - Horizontal bar chart: Due → Showed → Closed with conversion percentages

### Row 4: Daily Performance Table
- Columns: Date, Due, Showed, No Shows, Closed, Show %, Close %
- Mobile-optimized with horizontal scrolling
- Most recent dates first

## Files to Create

### 1. Types (`src/types/salesTracking.ts`)
Add new interfaces:
```text
DailyAppointmentStats {
  date: string
  due: number
  showed: number
  showRate: number
  closed: number
  apptToCloseRate: number
  showToCloseRate: number
}

AppointmentData {
  totalDue: number
  totalShowed: number
  totalClosed: number
  totalNoShows: number
  avgShowRate: number
  avgCloseRate: number
  avgShowToCloseRate: number
  dailyStats: DailyAppointmentStats[]
}
```

### 2. Data Hook (`src/hooks/useAppointmentData.ts`)
- Fetch and parse CSV from the new gid
- Calculate aggregates (totals, averages)
- Follow existing pattern from `useAdsData.ts`

### 3. Tab Component (`src/components/sales/AppointmentsTrackingTab.tsx`)
- Primary and secondary KPI rows
- Charts section
- Daily table
- Follow mobile patterns from `AdsTrackingTab.tsx`

### 4. Chart Components
- `AppointmentsTrendChart.tsx` - Dual-axis showing Due/Showed/Closed over time
- `AppointmentsFunnelChart.tsx` - Horizontal funnel: Due → Showed → Closed

### 5. Table Component (`src/components/sales/DailyAppointmentsTable.tsx`)
- Mobile-optimized with horizontal scrolling
- Color-coded columns (green for good rates, red for no-shows)

### 6. Update Main Page (`src/pages/SalesTracking.tsx`)
- Add third tab "Appointments" to TabsList (3-column grid)
- Import and render `AppointmentsTrackingTab`
- Add `useAppointmentData` hook to data fetching

## Mobile Optimization
- All KPI cards in horizontally scrollable flex containers
- Tables with `min-w-0` wrapper and horizontal scroll
- Responsive text sizes (text-xs on mobile, text-sm on desktop)
- Touch-friendly tap targets (min-h-[44px])

---

## Technical Details

### Hook Pattern (matching existing)
```text
useAppointmentData() returns {
  data: AppointmentData | null
  loading: boolean
  error: string | null
  refetch: () => void
}
```

### CSV Parsing
- Reuse the existing `parseCSVLine` and `parseCSV` helper functions
- Handle percentage fields by stripping `%` symbol
- Filter out rows with no data (due === 0)

### Calculations
- No Shows = Due - Showed
- Overall Show Rate = Total Showed / Total Due × 100
- Overall Close Rate = Total Closed / Total Due × 100
- Show → Close Rate = Total Closed / Total Showed × 100

### Color Scheme
- Due: Blue (#3b82f6)
- Showed: Yellow/Amber (#f59e0b)
- Closed: Green (#22c55e)
- No Shows: Red (#ef4444)
