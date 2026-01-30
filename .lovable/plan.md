
# Create Sales Tracking Dashboard Page

## Overview
Convert the uploaded HTML dashboard to a React page at `/salestracking` that displays live sales data from two Google Sheets CSV URLs. The dashboard will show sales KPIs, agent performance, and recent submissions.

---

## Data Sources

| Data | URL |
|------|-----|
| Tracking (daily stats) | `https://docs.google.com/spreadsheets/d/e/2PACX-1vRsCOzfJF0q1V49FLlNRi6FYVac_rlo-xsGZOhTi6hVI_lcHb-2-TC9LOL5RiMRT0A5cA8jei4V3hv2/pub?gid=100064359&single=true&output=csv` |
| Submissions | `https://docs.google.com/spreadsheets/d/e/2PACX-1vRsCOzfJF0q1V49FLlNRi6FYVac_rlo-xsGZOhTi6hVI_lcHb-2-TC9LOL5RiMRT0A5cA8jei4V3hv2/pub?gid=1684442142&single=true&output=csv` |

---

## Dashboard Features

### Header Section
- Title: "Health Helpers Dashboard"
- Subtitle: "Medicare Supplement Sales Tracker"
- Last updated timestamp with refresh button

### Stats Grid (6 cards)
- **Total Sales** - count of all sales (approved + pending)
- **Approved** - count with approval rate percentage
- **Pending** - count awaiting decision
- **Total Premium** - sum of approved premiums
- **Total Commission** - sum of commissions
- **Total Leads** - from submissions count

### Charts (2 side-by-side)
- **Sales by Day** - Bar chart using Recharts (existing library)
- **Sales by Agent** - Pie/Donut chart using Recharts

### Tables (2 side-by-side)
- **Top Agents** - Agent name, sales count, premium, commission, approved ratio
- **Recent Submissions** - Date, client, agent, premium, status badge

---

## Files to Create/Modify

### 1. Create `src/pages/SalesTracking.tsx`
New React component containing:
- CSV fetching and parsing logic (converted from the HTML's JavaScript)
- State management for dashboard data
- Stats cards using existing Card components
- Bar and Pie charts using Recharts (already installed)
- Data tables using existing Table components
- Gradient background styling matching the original
- Refresh button functionality
- Loading and error states

### 2. Update `src/App.tsx`
Add the new route:
```text
const SalesTracking = lazy(() => import("./pages/SalesTracking"));
...
<Route path="/salestracking" element={<SalesTracking />} />
```

---

## Technical Implementation

### CSV Parsing
Convert the HTML's `parseCSV` function to handle:
- Quoted values with commas inside
- Header row extraction
- Type coercion for numbers

### Data Processing Functions
- `processSubmissions()` - Calculate totals, approved/pending counts, recent entries
- `processDailyData()` - Extract last 7 days for bar chart
- `processAgentData()` - Aggregate by agent for pie chart and table

### UI Components Used
- `Card`, `CardHeader`, `CardContent` from existing UI library
- `Table`, `TableHeader`, `TableRow`, `TableCell` from existing UI library
- `Badge` for status display
- `Button` for refresh action
- Recharts: `BarChart`, `PieChart`, `ResponsiveContainer`, `Tooltip`, `Legend`, `Cell`

### Status Badge Colors
| Status | Color |
|--------|-------|
| Approved | Green (`bg-green-100 text-green-800`) |
| Pending | Yellow (`bg-yellow-100 text-yellow-800`) |
| Denied | Red (`bg-red-100 text-red-800`) |

---

## Expected Result
A fully functional sales tracking dashboard at `/salestracking` that:
- Fetches live data from the Google Sheets CSV URLs
- Displays 6 KPI stat cards
- Shows interactive bar chart (sales by day) and donut chart (sales by agent)
- Lists top agents with performance metrics
- Shows 5 most recent submissions with status badges
- Supports manual refresh
- Has responsive layout for mobile/desktop
