

# Add More Space Between Form and Footer on /suppappt

## Problem
The footer disclaimers are too close to the form on the `/suppappt` page. Users may be reading the disclaimer text while filling out the funnel, which could be hurting conversion on both A/B variants.

## Solution
Increase the spacer between the form section and the footer from `h-16` (64px) to `h-64` (256px) on mobile and even more on desktop. This pushes the footer well below the fold so users stay focused on the form.

## Technical Change

**File: `src/pages/MedicareSupplementAppointment.tsx`**
- Line 1917: Change `<div className="h-16"></div>` to `<div className="h-64 md:h-96"></div>` (256px mobile, 384px desktop)

One line change, no logic affected.
