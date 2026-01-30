

## Create "Money Back" Angle Funnel Variant

Duplicate the `/suppappt` funnel with reframed copy that positions savings as "getting money back" rather than "saving money." The psychological reframe shifts from loss prevention to gain acquisition.

---

## Copy Angle Transformation

| Current Angle | New "Money Back" Angle |
|---------------|------------------------|
| "Overpaying by $100-200/Month" | "Qualify for $100-200/month back" |
| "See your personalized rate" | "See how much you qualify to get back" |
| "You Qualify for Plan G at $X/month" | "You Qualify for $X/month back on your Plan G" |
| "$X/month in savings" | "$X/month going back to you" |
| "Your savings expires soon" | "Your refund expires soon" |
| "Lock in your savings" | "Claim your refund" |

---

## New Files to Create

### 1. New Page: `src/pages/MedicareSupplementAppointmentRefund.tsx`

Full copy of `MedicareSupplementAppointment.tsx` with these changes:

**Hero Section:**
```text
Badge: "EXPOSED: Medicare Supplement Overcharges"

Headline: 
"Seniors {in State} on Plan G, F, or N Qualify for $100-200/Month Back"

Subheadline: 
"Your benefits are federally standardized — if you're paying more than the lowest rate, you can get that money back."

CTA Subtext:
"See how much you qualify to get back in under 2 minutes."

Button:
"Check What You Qualify For"
```

**Payment Step:**
```text
"How much does your insurance company charge you each month?"
(unchanged - we need their current payment to calculate)
```

**Contact Step:**
```text
Header: "Final Step: See Your Refund Amount"
Button: "See What I Qualify For"
```

**Qualified/Results Screen:**
```text
Header: "Great News, {firstName}!"
Subtext: "You Qualify For"
Main Value: "${monthlySavings}/month back" (NOT the rate - the SAVINGS amount)
Secondary: "on your {plan}"

Urgency Box:
"Claim Your Refund — 15 Minutes"
"Your refund is reserved. Pick a time below to lock it in."

Button: "Book My Refund Call"
```

**Tracking/Analytics:**
- Page identifier: `suppappt-refund`
- Uses same FB pixel, Bing UET, Google Ads, Vibe.co tracking
- Uses same GHL webhook (no new webhook needed - same contact flow)

---

### 2. New Edge Function: `supabase/functions/send-lead-webhook-suppappt-refund/index.ts`

Clone of `send-lead-webhook-suppappt/index.ts` with:
- Page source set to `suppappt-refund`
- Uses same `GHL_WEBHOOK_URL_SUPPAPPT` environment variable (routes to same GHL automation)

---

### 3. Update: `src/App.tsx`

Add new route:
```tsx
const MedicareSupplementAppointmentRefund = lazy(() => import("./pages/MedicareSupplementAppointmentRefund"));

<Route path="/suppappt-refund" element={<MedicareSupplementAppointmentRefund />} />
```

---

### 4. New Component: `src/components/ExitIntentModalRefund.tsx`

Clone with "refund" language:
```text
Title: "Wait! Your ${monthlySavings}/month refund expires soon."
Body: "Rates change daily. Claim your refund now with a quick 2-minute call."
Button: "Book My Refund Call"
```

---

### 5. New Component: `src/components/StickyBookingCTARefund.tsx`

Clone with "refund" language:
```text
Button: "Book My Refund Call"
With time: "Book My Refund Call — {Day} at {Time}"
```

---

## Results Display Logic Change

**Current suppappt behavior:**
- Primary display: `${quoteResult.rate}/month` (the new lower rate)
- Secondary display: `${quoteResult.monthlySavings}/month in savings`

**New suppappt-refund behavior:**
- Primary display: `${quoteResult.monthlySavings}/month back` (the refund amount)
- Secondary display: `New rate: ${quoteResult.rate}/month on your {plan}`

This flips the hierarchy - the savings IS the headline, not the rate.

---

## What Stays The Same

| Feature | Status |
|---------|--------|
| Health screening questions | Unchanged (same 3-step disqualification logic) |
| Quote API call | Same Edge Function (`get-medicare-quote`) |
| Facebook CAPI tracking | Same events, same values |
| Bing/Google/Vibe tracking | Same conversion events |
| GHL webhook | Same webhook URL - just different page identifier |
| AppointmentBookingWidget | Same component - we'll pass `isRefundAngle` prop for copy tweaks |
| Disqualification flow | Routes to same `/disqualified` page |
| Great Rate page | Routes to same `/great-rate` page |

---

## Files Summary

| File | Action |
|------|--------|
| `src/pages/MedicareSupplementAppointmentRefund.tsx` | Create (copy + refund copy changes) |
| `src/components/ExitIntentModalRefund.tsx` | Create (refund copy) |
| `src/components/StickyBookingCTARefund.tsx` | Create (refund copy) |
| `supabase/functions/send-lead-webhook-suppappt-refund/index.ts` | Create (page identifier change) |
| `supabase/config.toml` | Add function config |
| `src/App.tsx` | Add route |

---

## Technical Details

### Tracking Differentiation

The new funnel will use `page: 'suppappt-refund'` in:
- Database submissions table
- GHL webhook payload
- Facebook CAPI events
- Funnel analytics

This allows you to compare conversion rates between the "savings" angle and "refund" angle in the analytics dashboard.

### Webhook Configuration

No new GHL webhook needed. Both funnels route to the same `GHL_WEBHOOK_URL_SUPPAPPT` since the contact data structure is identical. The `page` field in the payload differentiates the source.

