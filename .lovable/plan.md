

## Plan: Remove Auto-Selection + Performance Optimizations for Facebook Mobile Traffic

### Overview
This plan addresses two main concerns:
1. **Fix the booking widget bug**: Remove the auto-selection of the first day that immediately jumps to time selection and prevents going back
2. **Optimize for Facebook in-app browser**: Implement code splitting and defer third-party scripts to improve load times

---

## Part 1: Fix Booking Widget Auto-Selection Bug

### Problem
When users complete the funnel:
1. The widget auto-selects the first day (via `autoSelectFirst={true}`)
2. Widget immediately jumps to Step 2 (time selection) — user never sees Step 1 (day selection)
3. Clicking "Pick a different day" attempts to go back but the auto-select triggers again

### Root Cause
In `AppointmentBookingWidget.tsx`, lines 329-351: When `autoSelectFirst={true}` is passed (from the parent page), the widget detects preloaded slots and immediately sets `bookingStep(2)` + `selectedDate`. The back button resets to step 1, but the `useEffect` fires again and re-triggers the auto-select.

### Solution
1. **Set `autoSelectFirst={false}`** in `MedicareSupplementAppointment.tsx` — users will always start on day selection
2. **Remove the auto-select `useEffect`** from the widget entirely to prevent any future issues

---

### Files to Modify (Part 1)

| File | Changes |
|------|---------|
| `src/pages/MedicareSupplementAppointment.tsx` | Change `autoSelectFirst={true}` to `autoSelectFirst={false}` |
| `src/components/AppointmentBookingWidget.tsx` | Remove the auto-select `useEffect` (lines 328-351) |

---

### Code Changes (Part 1)

#### MedicareSupplementAppointment.tsx (line ~1327)

```tsx
// BEFORE
autoSelectFirst={true}

// AFTER  
autoSelectFirst={false}
```

#### AppointmentBookingWidget.tsx

Delete the entire `useEffect` block (lines 328-351):

```tsx
// DELETE THIS ENTIRE BLOCK
useEffect(() => {
  if (!autoSelectFirst || isStandalone) return;
  
  const firstDay = availableWeekdays[0];
  if (!firstDay) return;
  
  const dateStr = formatDateString(firstDay);
  const cached = preloadedSlots.get(dateStr);
  
  if (cached && cached.length > 0 && !selectedDate) {
    const { primary } = formatDateLabel(firstDay, 0);
    setSelectedDate(firstDay);
    setAvailableSlots(cached);
    setBookingStep(2);
    
    onTrackEvent?.({ ... });
  }
}, [preloadedSlots, availableWeekdays, autoSelectFirst, isStandalone, selectedDate, onTrackEvent]);
```

---

## Part 2: Facebook In-App Browser Performance Optimizations

### Current Issues Identified

| Issue | Impact | Solution |
|-------|--------|----------|
| No route-based code splitting | All 19 pages load at once (~large bundle) | Implement React.lazy() |
| Tracking pixels load synchronously | Delays first paint by 200-500ms | Defer with setTimeout |
| Missing resource hints | Browser doesn't pre-connect to APIs | Add preconnect links |

### Performance Optimizations

#### 1. Route-Based Code Splitting (App.tsx)

Use `React.lazy()` with `Suspense` to load pages on-demand instead of all at once:

```tsx
import { lazy, Suspense } from 'react';

// Replace static imports with lazy imports
const Index = lazy(() => import('./pages/Index'));
const MedicareSupplementAppointment = lazy(() => import('./pages/MedicareSupplementAppointment'));
// ... etc for all pages

// Wrap Routes in Suspense
<Suspense fallback={<div className="min-h-screen flex items-center justify-center">
  <Loader2 className="w-8 h-8 animate-spin text-green-600" />
</div>}>
  <Routes>
    ...
  </Routes>
</Suspense>
```

**Benefit**: Users coming from Facebook ads to `/suppappt` only download that page's code, not the entire app.

#### 2. Add Resource Hints (index.html)

Add preconnect hints for external domains:

```html
<head>
  <!-- Add these at the top of <head> -->
  <link rel="preconnect" href="https://rxoykogmyitwmdqxytvd.supabase.co" crossorigin />
  <link rel="dns-prefetch" href="https://rxoykogmyitwmdqxytvd.supabase.co" />
  <link rel="preconnect" href="https://connect.facebook.net" crossorigin />
  <link rel="dns-prefetch" href="https://connect.facebook.net" />
  ...
</head>
```

**Benefit**: Browser starts connecting to Supabase and Facebook before the JavaScript even loads.

#### 3. Defer Third-Party Tracking Scripts (index.html)

Move Taboola and Meta pixels to load after initial paint:

```html
<!-- Move tracking pixels to end of body, wrap in DOMContentLoaded -->
<script>
  // Defer third-party tracking to not block initial render
  window.addEventListener('load', function() {
    // Taboola Pixel
    window._tfa = window._tfa || [];
    window._tfa.push({notify: 'event', name: 'page_view', id: 1977536});
    var t = document.createElement('script');
    t.async = 1;
    t.src = '//cdn.taboola.com/libtrc/unip/1977536/tfa.js';
    t.id = 'tb_tfa_script';
    document.body.appendChild(t);
    
    // Meta Pixel
    !function(f,b,e,v,n,t,s){...}
  });
</script>
```

**Benefit**: Page renders immediately, tracking loads in background after paint.

---

### Files to Modify (Part 2)

| File | Changes |
|------|---------|
| `src/App.tsx` | Add React.lazy() imports and Suspense wrapper |
| `index.html` | Add preconnect hints, defer tracking pixels |

---

## Expected Results

### Booking Widget Fix
- Users see all 4 day options on qualification (Step 1)
- "Pick a different day" correctly returns to day selection
- No auto-jumping to time selection

### Performance Improvements (Estimated)
| Metric | Before | After |
|--------|--------|-------|
| Initial JS bundle | ~400KB | ~150KB (suppappt only) |
| Time to First Paint | ~1.5s | ~0.8s |
| Time to Interactive | ~2.5s | ~1.5s |

---

## User Flow After Changes

1. User clicks Facebook ad → lands on `/suppappt`
2. Only that page's code loads (lazy loading)
3. User completes funnel → sees quote
4. After 6 seconds, page scrolls to booking widget
5. User sees all 4 days and picks one
6. Times load → user picks a time → inline "Book" button appears
7. User taps "Book" → appointment confirmed

