

## Update "Total Premium" to "Total AP" on Sales Tracking

A small labeling and calculation change on the `/salestracking` page.

### What changes

**`src/pages/SalesTracking.tsx`:**
- Rename the "Total Premium" stat card title to "Total AP"
- Change the subtitle from "Approved only" to "Annualized premium"
- Multiply the displayed value by 12: `formatCurrency((salesData?.totalPremium ?? 0) * 12)`

One file, three small edits on the same stat card block.

