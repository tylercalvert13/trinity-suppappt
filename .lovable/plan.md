
# Mobile Optimization for Sales Tracking Dashboard

## Overview
Optimize the `/salestracking` page and all its child components for mobile devices, ensuring a smooth experience on smaller screens with proper touch targets, readable text, and efficient use of limited screen space.

---

## Current Issues Identified

| Component | Issue |
|-----------|-------|
| **Header** | Title and refresh button layout could stack better on mobile |
| **StatCard** | Values could be larger, padding could be tighter on mobile |
| **Tables** | No horizontal scroll indicator, text too small, columns cramped |
| **Charts** | X-axis labels overlap, legend takes too much space |
| **Pie Chart Labels** | Labels overlap on small screens |
| **Tabs** | Tab text could be more touch-friendly |

---

## Files to Modify

### 1. `src/pages/SalesTracking.tsx`

**Header improvements:**
- Stack last updated and refresh button vertically on mobile
- Reduce header padding on mobile
- Make subtitle text responsive

**Stats grid:**
- Already uses `grid-cols-2` on mobile - this is good
- Add smaller gap on mobile (gap-3 vs gap-4)

### 2. `src/components/sales/StatCard.tsx`

**Mobile optimizations:**
- Reduce padding on mobile (pt-3 pb-2 vs pt-4 pb-3)
- Make value text responsive (text-xl on mobile, text-2xl on desktop)
- Truncate long titles if needed
- Ensure icon doesn't shrink

### 3. `src/components/sales/DailySalesChart.tsx`

**Mobile optimizations:**
- Reduce chart height on mobile (200px vs 250px)
- Angle X-axis labels on mobile to prevent overlap
- Compact legend layout
- Smaller tick font sizes

### 4. `src/components/sales/CarrierChart.tsx`

**Mobile optimizations:**
- Remove inline labels on mobile (they overlap)
- Show legend below chart instead
- Reduce inner/outer radius on mobile
- Reduce chart height on mobile

### 5. `src/components/sales/AgentTable.tsx`

**Mobile optimizations:**
- Add horizontal scroll with visible scrollbar indicator
- Make table cells more compact
- Use smaller font sizes
- Consider hiding less critical columns on mobile (Premium column)
- Add min-width to table

### 6. `src/components/sales/RecentSubmissionsTable.tsx`

**Mobile optimizations:**
- Add horizontal scroll wrapper
- Condense carrier transition display on mobile
- Hide State column on smallest screens
- Smaller text sizes
- Sticky first column (Date)

### 7. `src/components/sales/AdsTrackingTab.tsx`

**Mobile optimizations:**
- Already uses `grid-cols-2` - good
- Reduce spacing between rows on mobile

### 8. `src/components/sales/AdsPerformanceChart.tsx`

**Mobile optimizations:**
- Reduce chart height on mobile
- Hide right Y-axis on mobile (too cramped)
- Angle X-axis labels
- Compact legend

### 9. `src/components/sales/AdsFunnelChart.tsx`

**Mobile optimizations:**
- Already has a good grid layout for conversion rates
- Reduce bar chart height on mobile
- Smaller margin values

### 10. `src/components/sales/DailyAdsTable.tsx`

**Mobile optimizations:**
- Add horizontal scroll wrapper
- Compact table headers
- Smaller font sizes
- Consider abbreviating column headers further

---

## Implementation Details

### Responsive Breakpoint Strategy
Using Tailwind's responsive prefixes:
- Default (no prefix): Mobile-first styles
- `sm:` (640px+): Small tablets
- `md:` (768px+): Tablets/small desktops
- `lg:` (1024px+): Desktops

### Chart Mobile Patterns
```text
Charts will use:
- height: 180-200px on mobile, 250px on desktop
- XAxis: angle={-45} with dy={10} for readability
- Legend: iconSize={12} and smaller font on mobile
- Hide secondary Y-axis on mobile when dual-axis
```

### Table Mobile Patterns
```text
Tables will use:
- overflow-x-auto wrapper with -webkit-overflow-scrolling: touch
- Minimum column widths to prevent text wrapping
- Smaller text: text-xs on mobile, text-sm on desktop
- Condensed padding in cells
```

### Touch Target Standards
- Minimum 44px touch targets for interactive elements
- Adequate spacing between clickable items
- Larger tap areas for refresh button

---

## Expected Result

A fully mobile-optimized dashboard that:
- Displays all 6/8 KPI cards in a 2-column grid on mobile
- Charts are readable without horizontal scrolling
- Tables scroll horizontally with clear indicators
- Text is appropriately sized for mobile reading
- Touch targets meet accessibility standards
- Maintains all functionality on smaller screens
