

# Update Subheadline & Add Second Line + CTA

## Changes in `src/pages/MedicareSupplementAppointment.tsx` (hero section, ~lines 1032-1042)

| Element | Current | Proposed |
|---------|---------|----------|
| Subheadline | "Most Plan G, F, and N policyholders are overpaying..." | **"Plan G, F, and N rates increase every year — If you're not checking for the best rates in your area every year, you're likely paying more for the exact same coverage."** |
| New second line | (none) | **"We'll check this for you now — and every year after — so you always have the best price for your Medicare Supplement."** |
| CTA button | "See My Savings" | **"See How Much I Can Save"** |

The second line will be a separate `<p>` tag styled slightly smaller/lighter than the subheadline (e.g. `text-base` vs `text-lg`, slightly more muted color) to create visual hierarchy. This keeps it readable without competing with the main subheadline. It acts as a value proposition / trust builder before the CTA.

