

# Rewrite /suppappt Copy for Ad Congruency: Savings-First Messaging

## Problem
The current "calm trust" copy focuses on **comparing rates** ("Compare Medicare Supplement Rates," "Get My Free Comparison"), but the ads promise **savings** and **getting money back**. This mismatch between ad promise and landing page copy hurts congruency and likely contributes to lower engagement.

## Copy Changes

All changes are in **`src/pages/MedicareSupplementAppointment.tsx`**, hero section only (~lines 1020–1060). Colors and layout stay the same.

| Element | Current | Proposed |
|---------|---------|----------|
| Trust badge pill | "Free Medicare Rate Check" | "Free Medicare Savings Check" |
| H1 headline | "Compare Medicare Supplement Rates in Under 2 Minutes" | "See How Much You Can Save on Your Medicare Supplement in Under 2 Minutes" |
| Subhead | "Your Plan G, F, or N coverage stays exactly the same — only the price changes." | "Most Plan G, F, and N policyholders are overpaying after rate increases. Your coverage stays exactly the same — you just pay less." |
| CTA button | "Get My Free Comparison" | "See My Savings" |

Everything else (trust badges, teal colors, form steps, variant tracking as `calm_trust_v1`) stays identical. This is a copy-only change — 4 strings swapped.

