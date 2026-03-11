

# Simplify & Build Trust on /suppappt for Seniors

## Current Problems

The hero section uses aggressive, clickbait-style tactics that may erode trust with seniors:

1. **Red pulsing "🚨 EXPOSED: Medicare Supplement Rate Trap" badge** — feels like a scam alert, not a trusted insurance service
2. **Fear-based headline** ("Overpaying by $100-200/Month") — creates anxiety rather than confidence
3. **Too much text** in the hero — three separate paragraphs before the CTA
4. **"Check If You Qualify" button** — implies gatekeeping, adds uncertainty

## Proposed Changes

### Hero Section Overhaul (lines 1019-1076)

**Remove:**
- The red pulsing "EXPOSED" badge entirely
- The third paragraph ("See your personalized rate...")

**Replace with a calmer, trust-first approach:**

```text
┌─────────────────────────────────────────────┐
│                                             │
│   [Shield icon] Free Medicare Rate Check    │  ← small calm badge, no animation
│                                             │
│   Compare Medicare Supplement Rates         │  ← simple, clear headline
│   in Under 2 Minutes                        │
│                                             │
│   Your Plan G, F, or N coverage stays       │  ← one short reassurance line
│   exactly the same — only the price changes │
│                                             │
│   [ Get My Free Comparison ]                │  ← green button, no urgency language
│                                             │
│   🔒 Licensed  ·  Free  ·  No Obligation   │  ← trust badges (same as now)
│                                             │
└─────────────────────────────────────────────┘
```

**Key tone shifts:**
- Badge: calm shield icon + "Free Medicare Rate Check" instead of alarm emoji + "EXPOSED"
- Headline: factual ("Compare...in Under 2 Minutes") instead of fear-based ("Overpaying by $100-200")
- CTA: "Get My Free Comparison" instead of "Check If You Qualify"
- Remove the "By continuing, you agree to..." text from under the hero button — it's premature and adds friction before the funnel even starts (the TCPA consent on the contact form covers this)

### Technical Details

**File: `src/pages/MedicareSupplementAppointment.tsx`** (~lines 1019-1076)

1. Replace the red animated badge div with a calm inline badge: `bg-blue-100 text-blue-800`, no `animate-pulse`, Shield icon + "Free Medicare Rate Check"
2. Simplify `<h1>` to "Compare Medicare Supplement Rates in Under 2 Minutes"
3. Collapse the two `<p>` paragraphs into one: "Your Plan G, F, or N coverage stays exactly the same — only the price changes."
4. Change button text from "Check If You Qualify" to "Get My Free Comparison"
5. Remove the Privacy/Terms links below the hero button (lines 1051-1056)
6. Keep the trust badges row as-is (already good)

No logic, webhook, tracking, or backend changes. Pure copy + styling in the hero section.

