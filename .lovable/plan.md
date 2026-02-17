

## A/B Split Test: CTA Button + Expectation-Setting Copy on /suppappt

### What We're Testing

**Variant A (Control):** Current page -- no changes.

**Variant B (Challenger):** Two targeted changes:

1. **Hero CTA button:** "Check If You Qualify" --> "See How Much You'll Save"
2. **New sub-headline** added below the existing sub-headline to set expectations about the process: something like *"Answer a few quick questions about your current coverage, and we'll show you a personalized rate comparison."* This primes visitors to expect they'll need to share some details, reducing surprise/friction at the contact form.

The contact form submit button ("See My New Rate") stays the same for both variants -- we're only changing what they see *before* they start the quiz.

### How It Works

- When a visitor lands on `/suppappt`, they're randomly assigned A or B (50/50 split), stored in `sessionStorage` so they see the same version all session
- The variant is tracked in analytics (stored in `funnel_sessions` metadata and event metadata) so you can query conversion rates per variant
- Everything else (quiz steps, contact form, booking widget, all tracking pixels) stays identical

### What Gets Built

**New file: `src/lib/abTest.ts`**
- Utility to assign and persist a variant per test name
- Returns "A" or "B" consistently for the session

**Modified: `src/pages/MedicareSupplementAppointment.tsx`**
- Import variant utility
- Render hero CTA button text based on variant ("Check If You Qualify" vs "See How Much You'll Save")
- Add expectation-setting sub-headline for Variant B below the existing "See your personalized rate..." line
- Pass variant to analytics

**Modified: `src/hooks/useFunnelAnalytics.ts`**
- Accept optional `variant` parameter
- Include variant in `funnel_sessions` insert and `page_view` event metadata

**Database migration:**
- Add `variant` text column (nullable) to `funnel_sessions` for clean querying

### Proposed Variant B Copy

- **Badge:** Same (no change)
- **Headline:** Same -- "Seniors on Plan G, F, or N Are Overpaying by $100-200/Month"
- **Sub-headline 1:** Same -- "Your benefits are federally standardized -- the only difference is the price."
- **Sub-headline 2 (NEW):** "Answer a few quick questions about your current plan and we'll pull your personalized rate -- it takes less than 2 minutes."
- **CTA Button:** "See How Much You'll Save"

### How You'll Measure

Once live, you can ask me to pull results like:

```text
Variant A: 3,000 visitors --> 1,000 started quiz (33%) --> 170 qualified (5.7%)
Variant B: 3,000 visitors --> 1,350 started quiz (45%) --> 230 qualified (7.7%)
```

The key metric is **visitor-to-quiz-start rate** (engagement), with secondary metrics being visitor-to-qualified and visitor-to-booked.

