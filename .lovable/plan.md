

## Scroll to Specific Elements on Loading and Results Pages

### Problem
The current implementation scrolls to the very top of the screen (`window.scrollTo({ top: 0 })`) when entering the "loading" and "qualified" steps. You want:
1. **Loading page**: Scroll so the loading icon/progress component is at the top of the viewport
2. **Results page**: Scroll so the "Great News" header is at the top of the viewport

### Solution
Instead of scrolling to the very top of the page, we'll use refs to scroll to the specific elements:
- Add a ref to the loading component wrapper
- Add a ref to the results header container
- Use `scrollIntoView({ behavior: 'instant', block: 'start' })` to position these elements at the top of the viewport

---

### Changes

#### 1. Update `src/pages/MedicareSupplementAppointment.tsx`

**Add two new refs:**
```typescript
const loadingRef = useRef<HTMLDivElement>(null);
const resultsHeaderRef = useRef<HTMLDivElement>(null);
```

**Update the scroll useEffect:**
```typescript
useEffect(() => {
  if (QUESTION_STEPS.includes(step)) {
    // Scroll to question container for question steps
    setTimeout(() => {
      questionContainerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  } else if (step === "loading") {
    // Scroll to loading component
    setTimeout(() => {
      loadingRef.current?.scrollIntoView({ behavior: 'instant', block: 'start' });
    }, 50);
  } else if (step === "qualified") {
    // Scroll to results header ("Great news")
    setTimeout(() => {
      resultsHeaderRef.current?.scrollIntoView({ behavior: 'instant', block: 'start' });
    }, 50);
  }
}, [step]);
```

**Wrap the loading component with a ref:**
```tsx
{step === "loading" && (
  <div ref={loadingRef}>
    <QuoteLoadingProgress planType={formData.plan} />
  </div>
)}
```

**Add ref to the results success header:**
```tsx
{step === "qualified" && quoteResult && (
  <div className="space-y-6">
    {/* Success Header */}
    <div ref={resultsHeaderRef} className="bg-white rounded-2xl shadow-xl p-6 md:p-8 border text-center">
      ...
    </div>
    ...
  </div>
)}
```

#### 2. Update `src/pages/MedicareSupplementAppointment1.tsx`

Apply the same pattern:
- Add `loadingRef` and `resultsHeaderRef`
- Update the scroll useEffect to use refs
- Wrap the loading div with `loadingRef`
- Add `resultsHeaderRef` to the success header div

#### 3. Update `src/pages/MedicareSupplementAppointmentRefund.tsx`

Apply the same pattern:
- Add `loadingRef` and `resultsHeaderRef`
- Update the scroll useEffect to use refs
- Wrap the QuoteLoadingProgress with `loadingRef`
- Add `resultsHeaderRef` to the success header div

---

### Technical Details

**Why use `scrollIntoView` with refs instead of `window.scrollTo`?**
- `scrollIntoView({ block: 'start' })` positions the element at the top of the viewport
- This works regardless of where the element is on the page
- It accounts for any fixed headers or other layout considerations
- The `behavior: 'instant'` ensures immediate scrolling without animation

**Why the 50ms delay?**
- A small delay ensures the element is rendered and measurable before scrolling
- This prevents race conditions where the scroll happens before React has committed the DOM update

---

### Files to Modify
1. `src/pages/MedicareSupplementAppointment.tsx` - Add refs and update scroll logic
2. `src/pages/MedicareSupplementAppointment1.tsx` - Add refs and update scroll logic
3. `src/pages/MedicareSupplementAppointmentRefund.tsx` - Add refs and update scroll logic

---

### Expected Behavior After Fix
- **Loading step**: The loading progress indicator appears at the top of the viewport
- **Results step**: The "Great News" header appears at the top of the viewport
- The 5-second auto-scroll to booking widget still works as before
- Works consistently across all devices

