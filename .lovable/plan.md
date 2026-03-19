

# Remove Appointments, Simplify Ads Tab for Dial-Only Model

## Summary
Since you're no longer booking appointments and just dialing leads, we'll remove the Appointments tab entirely and strip appointment-related metrics from the Ads tab. The funnel becomes **Leads → Sales** instead of **Leads → Appointments → Sales**.

## Changes

### 1. Remove Appointments tab from SalesTracking page
- **`src/pages/SalesTracking.tsx`**: Remove `useAppointmentData` import/hook, remove the Appointments `TabsTrigger` and `TabsContent`, change tabs from 3-column to 2-column grid. Remove `appointmentLoading`/`appointmentError`/`refetchAppointments` from loading/error/refresh logic.

### 2. Strip appointment metrics from Ads tab
- **`src/components/sales/AdsTrackingTab.tsx`**: Remove the "Appointments" KPI card from row 1, remove "Cost Per Appt" from row 2. Update the funnel chart to pass only Leads → Sales (remove `totalAppointments`). The row 1 grid goes from 4 → 3 columns, row 2 from 5 → 4 columns.

### 3. Simplify the Ads funnel chart
- **`src/components/sales/AdsFunnelChart.tsx`**: Remove `totalAppointments` prop. The funnel becomes 2 bars (Leads, Sales) with one conversion rate pill: Lead → Sale. Remove Lead→Appt and Appt→Sale rate calculations.

### 4. Clean up daily ads table
- **`src/components/sales/DailyAdsTable.tsx`**: Remove the "Appts", "CPA", and "Conv." (lead-to-appt rate) columns. Keep Date, Spend, Leads, CPL.

### 5. Update types
- **`src/types/salesTracking.ts`**: Remove `appointments`, `costPerAppointment`, `leadToApptRate` from `DailyAdsStats`. Remove `totalAppointments`, `avgCostPerAppointment` from `AdsData`. Remove the entire `CombinedAdsMetrics` interface (unused). Remove `AppointmentData`, `DailyAppointmentStats` types.

### 6. Update ads data hook
- **`src/hooks/useAdsData.ts`**: Stop parsing appointments/costPerAppointment/leadToApptRate columns. Remove those fields from the returned data.

### Files no longer needed (can leave or delete)
- `src/components/sales/AppointmentsTrackingTab.tsx`
- `src/components/sales/AppointmentsTrendChart.tsx`
- `src/components/sales/AppointmentsFunnelChart.tsx`
- `src/components/sales/DailyAppointmentsTable.tsx`
- `src/hooks/useAppointmentData.ts`

