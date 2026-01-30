
# Fix Dynamic Plan Type in Loading Screen

## Problem
The loading screen always displays "Comparing Plan G rates..." regardless of which plan (G, F, or N) the user selected in the form.

## Solution
Update the `QuoteLoadingProgress` component to accept a `planType` prop and display the user's actual selection.

---

## Changes

### 1. Update QuoteLoadingProgress Component
**File:** `src/components/QuoteLoadingProgress.tsx`

- Add a `planType` prop to the component interface (default to "Plan G" for backwards compatibility)
- Move the `STEPS` array inside the component so it can use the prop value
- Update step 3 label from hardcoded "Comparing Plan G rates..." to dynamic "Comparing {planType} rates..."

### 2. Pass Plan Type from Funnel Pages
**Files:** 
- `src/pages/MedicareSupplementAppointment.tsx`
- `src/pages/MedicareSupplementAppointmentRefund.tsx`

- Update the `<QuoteLoadingProgress />` usage to pass the selected plan:
  ```
  <QuoteLoadingProgress planType={formData.plan} />
  ```

---

## Technical Details

The form already captures the plan selection in `formData.plan` which stores values like "Plan G", "Plan N", or "Plan F". This value just needs to be passed through to the loading component.

---

## Files to Modify

| File | Change |
|------|--------|
| `src/components/QuoteLoadingProgress.tsx` | Add `planType` prop, make step label dynamic |
| `src/pages/MedicareSupplementAppointment.tsx` | Pass `planType={formData.plan}` to component |
| `src/pages/MedicareSupplementAppointmentRefund.tsx` | Pass `planType={formData.plan}` to component |
