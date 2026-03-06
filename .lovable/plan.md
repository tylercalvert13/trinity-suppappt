

# End A/B Test: Make Variant A Permanent on /suppappt

## What changes

**File: `src/pages/MedicareSupplementAppointment.tsx`**

1. **Remove the A/B test import and state** (lines 11, 470): Remove `getVariant` import and the `variant` state — no longer needed.

2. **Remove Variant B copy block** (lines 1075-1079): Delete the conditional paragraph that only showed for Variant B ("Answer a few quick questions...").

3. **Remove Variant A spacer conditional** (line 1081): Replace `{variant === 'A' && <div className="mb-8" />}` with just `<div className="mb-8" />` since it's always Variant A now.

4. **Hardcode the CTA text** (line 1090): Change `{variant === 'B' ? 'See How Much You\'ll Save' : 'Check If You Qualify'}` to just `Check If You Qualify`.

5. **Update funnel analytics variant** (wherever `variant` is passed to `useFunnelAnalytics`): Pass a static string like `'A'` or remove variant tracking.

No new files. No database changes. Variant A's "Check If You Qualify" framing becomes the permanent experience for all visitors.

