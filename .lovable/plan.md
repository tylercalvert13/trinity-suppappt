

## Create Medicare Advantage Self-Enrollment Funnel at /advantage

### Overview
A new funnel page at `/advantage` that guides users turning 65 through a self-enrollment flow for Medicare Advantage. It matches the visual style and UX patterns of the `/suppappt` funnels (white cards, blue accents, progress bar, large touch targets) but replaces the quote/booking flow with a video tutorial and embedded self-enrollment tool.

### User Flow

```text
Landing Page ("Enroll in the Best Medicare Advantage Plan — By Yourself")
  |
  v
Step 1: "Are you turning 65 within the next 3 months, or have you turned 65 in the last 3 months?"
  -> Yes: Continue
  -> No: Disqualified ("You must be in your Initial Election Period")
  |
  v
Step 2: "Do you have your Medicare card or know your MBI (Medicare Beneficiary Identifier) number?"
  -> Yes: Continue
  -> No: Disqualified ("You'll need your Medicare card or MBI number to enroll")
  |
  v
Step 3: Video Step — "Watch This Quick Guide"
  - Video placeholder (16:9 aspect ratio container with play icon)
  - "Watch the full video to unlock self-enrollment"
  - Track video progress; once complete (or placeholder "I've watched the video" button for now), enable the Continue button
  |
  v
Step 4: Confirmation Checklist
  - "Before you enroll, confirm you're ready:"
  - Checkbox: "I watched the full video"
  - Checkbox: "I have my Medicare card or MBI number ready"
  - Checkbox: "I understand I'm enrolling myself without an agent"
  - All must be checked to proceed
  |
  v
Step 5: Self-Enrollment (Qualified)
  - "You're Ready to Enroll!"
  - Sunfire Matrix enrollment tool embedded in a full-width iframe
  - URL: https://www.sunfirematrix.com/app/consumer/ember/?sfpath=int&sfagid=20273920#/
  - Responsive iframe that fills the available width and has generous height
  - Help text: "Need help? Call us at (201) 426-9898"
```

### Technical Details

**New file: `src/pages/MedicareAdvantage.tsx`**
- Modeled after `/suppappt2` structure (same imports, same card styling, same progress bar pattern)
- Simplified step type: `"landing" | "iep" | "medicare_card" | "video" | "confirm" | "enroll"`
- No quote API, no booking widget, no exit intent modal, no social proof popup (since this is self-service)
- Uses `useFunnelAnalytics('advantage')` for tracking
- Disqualification navigates to `/disqualified` with appropriate reason params
- Video step: renders an `AspectRatio` 16:9 container with a placeholder (gray box with play icon and "Video Coming Soon" text). A "I've Watched the Full Video" button below it advances the flow. When a real video is added later, this can be swapped for a video player with completion tracking.
- Enrollment step: renders the Sunfire Matrix URL in an `<iframe>` with `width="100%"` and a tall fixed height (~800px), with `allow="payment"` and sandbox attributes as needed for functionality
- Same Health Helpers branding, trust badges, and legal footer links

**Updated: `src/App.tsx`**
- Register `/advantage` route with lazy-loaded `MedicareAdvantage` component

**Updated: `src/hooks/useFunnelAnalytics.ts`**
- Add `'advantage'` to the allowed page union type

**No database changes needed** -- the existing `funnel_sessions` and `funnel_events` tables already accept any page string value.

### Disqualification Handling
- IEP question "No" -> Navigate to `/disqualified?reason=iep` with a message like "You need to be in your Initial Election Period (turning 65) to use this tool"
- Medicare card "No" -> Navigate to `/disqualified?reason=medicare_card` with a message like "You'll need your Medicare card or MBI number. Contact us if you need help getting it."
- The existing Disqualified page will need a small update to handle these new reason codes with appropriate messaging

### What's Intentionally Excluded
- No quote fetching or rate comparison (this is Advantage, not Supplement)
- No appointment booking widget
- No exit intent modal, social proof popup, or sticky CTA (self-service flow, not conversion-optimized for agent calls)
- No contact form or PII collection (user enrolls directly through Sunfire)
- No Facebook CAPI events for now (can be added later)

