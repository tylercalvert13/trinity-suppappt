

# Add Ads Tracking Tab to Sales Dashboard

## Overview
Add a new "Ads Tracking" tab to the /salestracking page that pulls data from the Ads CSV and combines it with sales data to calculate comprehensive ad performance metrics including ROAS, cost per lead, cost per appointment, cost per sale, and more.

---

## Data Sources

### Ads CSV Columns
| Column | Example Value |
|--------|---------------|
| Date | 01/22/2026 |
| Spend | $766.97 |
| Leads | 69 |
| Appointments | 17 |
| Cost Per Lead | $11.12 |
| Cost per Appointment | $45.12 |
| Lead -> Appt Ratio | 24.64% |

### Sales Data (Already Available)
- Approved sales count
- Total Premium (approved)
- Total Commission (approved)
- Daily breakdown by status

---

## Calculated Metrics

| Metric | Calculation | Description |
|--------|-------------|-------------|
| **Total Spend** | Sum of all Spend | Total ad dollars spent |
| **Total Leads** | Sum of all Leads | Total leads generated |
| **Total Appointments** | Sum of all Appointments | Total appointments booked |
| **Avg Cost Per Lead** | Total Spend / Total Leads | Average cost to acquire a lead |
| **Avg Cost Per Appointment** | Total Spend / Total Appointments | Average cost to book an appointment |
| **Cost Per Sale** | Total Spend / Approved Sales | Cost to close a sale |
| **Lead to Appt Rate** | (Total Appointments / Total Leads) * 100 | Conversion from lead to appointment |
| **Appt to Sale Rate** | (Approved Sales / Total Appointments) * 100 | Conversion from appointment to sale |
| **Lead to Sale Rate** | (Approved Sales / Total Leads) * 100 | Overall funnel conversion |
| **ROAS** | Total Commission / Total Spend | Return on ad spend (ratio) |
| **Revenue per Lead** | Total Commission / Total Leads | Average revenue per lead |
| **Profit** | Total Commission - Total Spend | Net profit from ads |

---

## New Files to Create

### 1. `src/hooks/useAdsData.ts`
New hook to fetch and parse ads CSV data:
- Fetch from the provided ads Google Sheet CSV URL
- Parse Date, Spend, Leads, Appointments columns
- Aggregate totals and daily breakdown
- Export types for AdsData and DailyAdsStats

### 2. `src/components/sales/AdsTrackingTab.tsx`
Main component for the Ads tab containing:
- KPI cards (8 metrics in 2 rows)
- Spend vs Commission chart (dual-axis line chart)
- Daily performance table
- Funnel conversion rates visualization

### 3. `src/components/sales/AdsFunnelChart.tsx`
Visual funnel showing:
- Leads → Appointments → Sales conversion rates
- Horizontal bar chart with percentages

### 4. `src/components/sales/AdsPerformanceChart.tsx`
Dual-axis chart showing:
- Daily spend (bar)
- Daily leads/appointments (lines)

### 5. `src/components/sales/DailyAdsTable.tsx`
Table with daily breakdown:
- Date | Spend | Leads | Appointments | CPL | CPA | Lead→Appt%

---

## Files to Modify

### `src/types/salesTracking.ts`
Add new interfaces:
```text
interface DailyAdsStats {
  date: string;
  spend: number;
  leads: number;
  appointments: number;
  costPerLead: number;
  costPerAppointment: number;
  leadToApptRate: number;
}

interface AdsData {
  totalSpend: number;
  totalLeads: number;
  totalAppointments: number;
  avgCostPerLead: number;
  avgCostPerAppointment: number;
  dailyStats: DailyAdsStats[];
}

interface CombinedAdsMetrics {
  // From ads data
  totalSpend: number;
  totalLeads: number;
  totalAppointments: number;
  avgCostPerLead: number;
  avgCostPerAppointment: number;
  
  // Calculated with sales data
  costPerSale: number;
  leadToApptRate: number;
  apptToSaleRate: number;
  leadToSaleRate: number;
  roas: number;
  revenuePerLead: number;
  profit: number;
  
  // Daily data
  dailyStats: DailyAdsStats[];
}
```

### `src/pages/SalesTracking.tsx`
Transform into a tabbed layout:
- Add Tabs component wrapper
- "Sales Overview" tab (current content)
- "Ads Tracking" tab (new content)
- Both tabs share the same header and refresh functionality

---

## UI Layout - Ads Tab

### Row 1: Primary KPIs (4 cards)
| Total Spend | Total Leads | Total Appointments | Approved Sales |
|-------------|-------------|--------------------| ---------------|

### Row 2: Performance KPIs (4 cards)
| Cost Per Lead | Cost Per Sale | ROAS | Profit |
|---------------|---------------|------|--------|

### Row 3: Charts
| Spend & Revenue Over Time (Bar + Line) | Funnel Conversion (Horizontal Bars) |

### Row 4: Daily Performance Table
Full-width table with all daily stats

---

## Technical Implementation

### Data Fetching Strategy
1. Fetch ads CSV from provided URL
2. Parse using existing `parseCSV` and `parseNumber` utilities
3. Join with sales data by date for combined metrics
4. Calculate derived metrics (ROAS, cost per sale, etc.)

### Date Matching Logic
- Ads dates: MM/DD/YYYY format
- Sales dates: Already parsed to MM/DD format
- Match on normalized date keys for daily comparisons

### Color Scheme for Charts
- Spend: Red (#ef4444)
- Leads: Blue (#3b82f6)  
- Appointments: Yellow (#f59e0b)
- Sales: Green (#22c55e)
- Commission/Revenue: Purple (#8b5cf6)

---

## Expected Result

A comprehensive Ads Tracking tab that:
- Shows 8 key performance indicators at a glance
- Visualizes spend vs revenue over time
- Displays funnel conversion rates (Lead → Appt → Sale)
- Lists daily performance in a sortable table
- Calculates true ROAS using actual commission data
- Updates on refresh alongside sales data

