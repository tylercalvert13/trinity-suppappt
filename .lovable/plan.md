
## Add Google Ads Lead Form Conversion to /suppappt Funnel

Adding Google Ads conversion tracking that fires when users successfully receive their Medicare Supplement quote.

---

## Implementation

### File: `src/pages/MedicareSupplementAppointment.tsx`

**1. Add TypeScript declaration for gtag** (near line 23-27, alongside existing Bing UET declaration):
```typescript
declare global {
  interface Window {
    uetq?: any[];
    gtag?: (...args: any[]) => void;
  }
}
```

**2. Create tracking function** (after the `trackBingSubmissionEvent` function, around line 238):
```typescript
// Track lead submission via Google Ads conversion
const trackGoogleAdsConversion = () => {
  try {
    if (typeof window === 'undefined' || !window.gtag) {
      console.log('Google Ads gtag not loaded yet, skipping conversion');
      return;
    }
    
    window.gtag('event', 'conversion', {
      'send_to': 'AW-17916268698/760DCPf-lO8bEJqhkt9C',
      'value': 1.0,
      'currency': 'USD'
    });
    
    console.log('Google Ads submit_lead_form conversion tracked (suppappt)');
  } catch (error) {
    console.error('Error tracking Google Ads conversion:', error);
  }
};
```

**3. Call the function when quote is received** (line 628, after Bing tracking):
```typescript
// Track qualification and conversions
trackQualification("qualified");
await trackFacebookSubmissionEvent(formData, data);
trackBingSubmissionEvent(formData);
trackGoogleAdsConversion();  // <-- Add this line

setStep("qualified");
```

---

## Technical Notes

- The conversion uses the send_to ID you provided: `AW-17916268698/760DCPf-lO8bEJqhkt9C`
- No callback/redirect needed since we're staying on the same page
- Follows the same pattern as existing Bing UET tracking
- The `window.gtag` is already set globally by the tag we added to `index.html`

---

## Summary

| Change | Location |
|--------|----------|
| Add `gtag` to Window interface | Lines 23-27 |
| Create `trackGoogleAdsConversion` function | After line 238 |
| Call conversion on quote success | Line 628 |

The conversion will fire with a $1.00 value each time a user successfully receives their quote.
