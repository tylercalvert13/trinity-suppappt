

## Replace "Refund" Language with "Money Back" Alternatives

Update all user-facing "refund" copy across the `/suppappt-refund` funnel to use "money back" phrasing instead.

---

## Copy Changes

### File: `src/pages/MedicareSupplementAppointmentRefund.tsx`

| Location | Current | New |
|----------|---------|-----|
| Line 352 (toast) | "Your refund is reserved — pick a time to claim it" | "Your money back is reserved — pick a time to claim it" |
| Line 405 (title) | "Medicare Supplement Refund \| Health Helpers" | "Medicare Supplement Money Back \| Health Helpers" |
| Line 409 (meta) | "Check your refund amount in under 2 minutes" | "Check how much you can get back in under 2 minutes" |
| Line 1244 (headline) | "Final Step: See Your Refund Amount" | "Final Step: See How Much You Get Back" |
| Line 1348 (button) | "Calculating Your Refund..." | "Calculating Your Money Back..." |
| Line 1402 (CTA box) | "Claim Your Refund — 15 Minutes" | "Claim Your Money Back — 15 Minutes" |

---

### File: `src/components/ExitIntentModalRefund.tsx`

| Location | Current | New |
|----------|---------|-----|
| Line 104 (title) | "Your $X/month refund expires soon" | "Your $X/month back expires soon" |
| Line 109 (body) | "Claim your refund now with a quick 2-minute call" | "Lock in your money back now with a quick 2-minute call" |
| Line 115 (button) | "Book My Refund Call" | "Claim My Money Back" |

---

### File: `src/components/StickyBookingCTARefund.tsx`

| Location | Current | New |
|----------|---------|-----|
| Line 81 (button with time) | "Book My Refund Call" | "Claim My Money Back" |
| Line 90 (button default) | "Book My Refund Call" | "Claim My Money Back" |

---

## Summary

All instances of "refund" in user-facing copy will be replaced with "money back" or similar phrasing. Internal code identifiers (component names, route paths, analytics page IDs) will remain unchanged to preserve infrastructure and A/B tracking differentiation.

| File | Changes |
|------|---------|
| `src/pages/MedicareSupplementAppointmentRefund.tsx` | 6 copy updates |
| `src/components/ExitIntentModalRefund.tsx` | 3 copy updates |
| `src/components/StickyBookingCTARefund.tsx` | 2 copy updates |

