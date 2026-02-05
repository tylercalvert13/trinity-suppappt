
## Scroll-to-Top Fix for Supplement Appointment Funnel

### Problem
Currently, the `/suppappt`, `/suppappt1`, and `/suppappt-refund` funnels scroll to the question container on question steps, but do NOT scroll to the top of the page when transitioning to the "loading" or "qualified" (results) steps. This can leave users mid-page or at the bottom, especially on mobile devices.

### Solution
We will implement a two-part fix:

1. **Add a global ScrollToTop component** - Ensures every route change scrolls to the top (handles direct navigation, refreshes, and cross-page navigation)

2. **Add scroll-to-top behavior for "loading" and "qualified" steps** - Within each funnel page, explicitly scroll to the top when entering these critical steps

---

### Changes

#### 1. Create `src/components/ScrollToTop.tsx`
A simple component that scrolls to the top of the page whenever the route pathname changes.

```text
+---------------+
|  ScrollToTop  |
+---------------+
        |
        v
Listens for pathname changes via useLocation
        |
        v
Calls window.scrollTo(0, 0) instantly
```

#### 2. Update `src/App.tsx`
Import and add the `ScrollToTop` component inside the `BrowserRouter` so it can access the router context.

#### 3. Update `src/pages/MedicareSupplementAppointment.tsx`
Modify the existing scroll `useEffect` to also handle "loading" and "qualified" steps by scrolling to the top of the page:
- When entering "loading": scroll to top immediately so users see the loading animation
- When entering "qualified": scroll to top so users see their results from the beginning (the 5-second auto-scroll to booking widget will still happen after)

#### 4. Update `src/pages/MedicareSupplementAppointment1.tsx`
Apply the same scroll-to-top logic for "loading" and "qualified" steps.

#### 5. Update `src/pages/MedicareSupplementAppointmentRefund.tsx`
Apply the same scroll-to-top logic for "loading" and "qualified" steps.

---

### Technical Details

**ScrollToTop Component:**
```typescript
import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [pathname]);

  return null;
};
```

**Updated scroll useEffect in funnel pages:**
```typescript
// Auto-scroll behavior based on step changes
useEffect(() => {
  if (QUESTION_STEPS.includes(step)) {
    // Scroll to question container for question steps
    setTimeout(() => {
      questionContainerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  } else if (step === "loading" || step === "qualified") {
    // Scroll to top for loading and results pages
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }
}, [step]);
```

The `behavior: 'instant'` ensures the scroll happens immediately without animation for the loading/qualified steps, so users see the content right away.

---

### Files to Modify
1. **Create**: `src/components/ScrollToTop.tsx` - New component
2. **Edit**: `src/App.tsx` - Add ScrollToTop inside BrowserRouter
3. **Edit**: `src/pages/MedicareSupplementAppointment.tsx` - Add scroll-to-top for loading/qualified
4. **Edit**: `src/pages/MedicareSupplementAppointment1.tsx` - Add scroll-to-top for loading/qualified
5. **Edit**: `src/pages/MedicareSupplementAppointmentRefund.tsx` - Add scroll-to-top for loading/qualified

---

### Expected Behavior After Fix
- Every page in the funnel starts at the top
- Question steps smoothly scroll to the question container
- Loading step immediately scrolls to top to show the loading animation
- Results (qualified) step starts at the top showing the rate, then auto-scrolls to booking widget after 5 seconds
- Works consistently across all devices (desktop, tablet, mobile)
