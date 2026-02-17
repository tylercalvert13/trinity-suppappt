

## Fix Facebook Pixel Advanced Matching and Verify CAPI

### Problem Summary
The browser pixel fires PageView with zero user identifiers. Facebook needs BOTH the pixel (browser-side) AND CAPI (server-side) to send user data for maximum match quality. Currently only CAPI sends PII, and even that may not be firing reliably.

### Changes

**1. Add Advanced Matching to Pixel (Browser-Side)**

In the funnel pages (`MedicareSupplementAppointment.tsx`, `MedicareSupplementAppointmentRefund.tsx`, `MedicareSupplementAppointment2.tsx`), after the user submits their contact info, call `fbq('init')` again with Advanced Matching parameters. This re-initializes the pixel with user data so all subsequent events are matched.

```
fbq('init', '731657259428655', {
  em: 'user@email.com',    // unhashed - fbq hashes automatically
  fn: 'john',
  ln: 'doe', 
  ph: '12015551234',
  zp: '07030',
  country: 'us'
});
```

This will be called right after the contact form step completes (when we have first_name, last_name, email, phone, zip_code).

**2. Add Browser-Side Pixel Events (for deduplication with CAPI)**

Currently NO `fbq('track', ...)` calls exist in React code. We need to fire matching browser pixel events alongside the CAPI calls, using the SAME `event_id` for deduplication:

- `fbq('track', 'Lead', { value, currency: 'USD' }, { eventID: eventId })` -- when quote is shown
- `fbq('track', 'Schedule', { value, currency: 'USD' }, { eventID: eventId })` -- when appointment is booked

This gives Facebook two signals (browser + server) for each conversion, maximizing match rate while deduplicating via event_id.

**3. Verify CAPI Is Actually Firing**

Add a quick console.log before and after the `supabase.functions.invoke('fb-conversion')` calls to confirm the function is being reached. Also check the edge function deployment status.

### Files to Change

- `src/pages/MedicareSupplementAppointment.tsx` -- Add Advanced Matching init + browser pixel events
- `src/pages/MedicareSupplementAppointmentRefund.tsx` -- Same changes
- `src/pages/MedicareSupplementAppointment2.tsx` -- Same changes  
- `src/pages/MedicareSupplementLP.tsx` -- Add browser pixel event for the InboundCall tracking

### Technical Details

**Advanced Matching placement**: Called once after the contact step, inside the existing `trackFacebookSubmissionEvent` function, before the CAPI call. The `fbq('init', ...)` with user data is idempotent -- calling it again just updates the matched user info.

**Browser pixel event format with dedup**:
```typescript
// Same eventId used for both browser + CAPI
const eventId = generateEventId();

// Browser pixel (unhashed - Facebook SDK hashes automatically)
if (typeof window.fbq === 'function') {
  window.fbq('init', '731657259428655', {
    em: formData.email,
    fn: formData.firstName,
    ln: formData.lastName,
    ph: formData.phone.replace(/\D/g, ''),
    zp: formData.zipCode?.substring(0, 5),
    country: 'us',
  });
  window.fbq('track', 'Lead', { value, currency: 'USD' }, { eventID: eventId });
}

// CAPI (hashed server-side)
await supabase.functions.invoke('fb-conversion', {
  body: { event_name: 'Lead', event_id: eventId, ... }
});
```

**Why this fixes the "unknown" segment**: Facebook currently sees events from CAPI with hashed PII but has no browser-side match to pair them with. By adding Advanced Matching to the pixel init, Facebook can cross-reference the browser cookie identity with the hashed PII, dramatically improving match quality from "unknown" to identified users.

### What This Will NOT Fix
- Campaign budget allocation (that's a Meta Ads Manager decision)
- Special Ad Category targeting restrictions (that's a policy constraint)
- iOS 14.5+ App Tracking Transparency (CAPI already mitigates this, and these are web users not app users)

### Expected Impact
- User match rate should go from ~0% to 60-80%+
- Custom Audience building will start working
- Lookalike audiences become viable
- Conversion optimization improves (Meta can see who converts)

