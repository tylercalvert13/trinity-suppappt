

## Add TikTok Pixel Events to /suppappt Funnel

Implement `ClickButton`, `Lead`, and `Schedule` TikTok pixel events with SHA-256 hashed PII via `ttq.identify()` where contact info is available.

### Event Mapping

| Funnel Moment | TikTok Event | `ttq.identify()`? | Trigger Location |
|---|---|---|---|
| User clicks any funnel answer button | `ClickButton` | No (no PII yet) | Each step handler (plan, care, treatment, medications, gender, tobacco, spouse, age, zip) |
| Contact form submitted + quote received | `Lead` | Yes (hashed email, phone, visitor ID) | After existing conversion calls (~line 847) |
| Appointment booked | `Schedule` | Yes (hashed PII) | Inside `booking_completed` handler (~line 1703) |

### Changes

**`src/pages/MedicareSupplementAppointment.tsx`**

1. Add `ttq` to the Window interface (line ~29):
   ```typescript
   ttq?: { identify: (data: any) => void; track: (event: string, params?: any) => void; };
   ```

2. Add a SHA-256 hashing utility (near other tracking helpers):
   ```typescript
   const hashSHA256 = async (value: string): Promise<string> => {
     const encoder = new TextEncoder();
     const data = encoder.encode(value.trim().toLowerCase());
     const hashBuffer = await crypto.subtle.digest('SHA-256', data);
     return Array.from(new Uint8Array(hashBuffer))
       .map(b => b.toString(16).padStart(2, '0')).join('');
   };
   ```

3. Add `trackTikTokClickButton` helper (no PII needed):
   ```typescript
   const trackTikTokClickButton = (stepName: string) => {
     if (!window.ttq) return;
     window.ttq.track('ClickButton', {
       contents: [{ content_id: 'suppappt', content_type: 'product',
         content_name: `Medicare Supplement - ${stepName}` }],
       value: 0, currency: 'USD',
     });
   };
   ```

4. Add `trackTikTokLeadEvent` helper (with hashed PII):
   ```typescript
   const trackTikTokLeadEvent = async (formData, quoteResult) => {
     if (!window.ttq) return;
     window.ttq.identify({
       email: await hashSHA256(formData.email),
       phone_number: await hashSHA256(formData.phone.replace(/\D/g, '')),
       external_id: await hashSHA256(getVisitorIdForTracking()),
     });
     window.ttq.track('Lead', {
       contents: [{ content_id: 'suppappt', content_type: 'product',
         content_name: `Medicare Supplement ${formData.plan}` }],
       value: quoteResult?.monthlySavings || quoteResult?.rate || 0,
       currency: 'USD',
     });
   };
   ```

5. Add `trackTikTokScheduleEvent` helper (with hashed PII):
   ```typescript
   const trackTikTokScheduleEvent = async (formData, quoteResult) => {
     if (!window.ttq) return;
     window.ttq.identify({
       email: await hashSHA256(formData.email),
       phone_number: await hashSHA256(formData.phone.replace(/\D/g, '')),
       external_id: await hashSHA256(getVisitorIdForTracking()),
     });
     window.ttq.track('Schedule', {
       contents: [{ content_id: 'suppappt', content_type: 'product',
         content_name: `Medicare Supplement ${formData.plan}` }],
       value: quoteResult?.monthlySavings || quoteResult?.rate || 0,
       currency: 'USD',
     });
   };
   ```

6. Fire `ClickButton` in each step handler:
   - `handlePlanSelect` -- `trackTikTokClickButton('plan')`
   - `handlePaymentSubmit` -- `trackTikTokClickButton('payment')`
   - `handleCareAnswer` -- `trackTikTokClickButton('care')`
   - `handleTreatmentAnswer` -- `trackTikTokClickButton('treatment')`
   - `handleMedicationsAnswer` -- `trackTikTokClickButton('medications')`
   - `handleGenderSelect` -- `trackTikTokClickButton('gender')`
   - `handleTobaccoAnswer` -- `trackTikTokClickButton('tobacco')`
   - `handleSpouseAnswer` -- `trackTikTokClickButton('spouse')`
   - `handleAgeSubmit` -- `trackTikTokClickButton('age')`
   - `handleZipSubmit` -- `trackTikTokClickButton('zip')`

7. Fire `Lead` at ~line 847 (after `trackVibeCoLeadEvent()`):
   ```typescript
   trackTikTokLeadEvent(formData, data);
   ```

8. Fire `Schedule` at ~line 1704 (inside `booking_completed`, after `trackFacebookAppointmentEvent`):
   ```typescript
   trackTikTokScheduleEvent(formData, quoteResult);
   ```

### Notes
- `ViewContent` is already handled by `ttq.page()` in index.html
- `ttq.identify()` is only called before `Lead` and `Schedule` since we don't have PII during earlier steps
- All PII is SHA-256 hashed client-side using the Web Crypto API per TikTok's requirements
- No backend changes needed
