
## Create a No-Opt-In Version of /suppappt

### Goal
Create a new funnel page (e.g., `/suppappt2`) that is identical to `/suppappt` in every way -- same copy, same conversion optimization elements, same FB CAPI events -- except contact information is collected **after** the user selects a booking time slot, not before seeing their rate.

### Why not just update /suppappt1?
The existing `/suppappt1` delays contact collection but is missing most of the conversion features from `/suppappt`:
- No Facebook CAPI tracking (Lead or Appointment events)
- No Google Ads, Bing, or Vibe conversion events
- No exit intent modal
- No social proof popup
- No sticky booking CTA
- No urgency toast / auto-scroll to widget
- No QuoteLoadingProgress animated component
- No TrustedForm integration
- No contact validation via `validate-contact` edge function
- Simpler loading screen, larger footer spacer

Rebuilding /suppappt1 to match would essentially be rewriting it. It's cleaner to create a new page based on /suppappt.

### What changes

**1. New page: `src/pages/MedicareSupplementAppointment2.tsx`**
- Copy of `/suppappt` with these modifications:
  - **Remove** the "contact" step from the funnel flow (steps go: plan -> payment -> care -> treatment -> medications -> gender -> tobacco -> spouse -> age -> zip -> loading -> qualified)
  - **Remove** contact form fields from the main form (firstName, lastName, email, phone)
  - After zip code, go directly to loading/quote (no contact collection)
  - Results page header says "Great News!" (no first name, since we don't have it yet)
  - Use `AppointmentBookingWidgetWithOptIn` instead of `AppointmentBookingWidget` so contact info is collected inside the widget after time slot selection
  - **Keep all conversion features**: exit intent modal, social proof popup, sticky CTA, auto-scroll, urgency toast, QuoteLoadingProgress
  - **Keep all tracking**: Facebook CAPI Lead event fires on quote display (without PII since we don't have it yet); Appointment event fires on booking completion (with PII from the widget's onComplete callback)
  - TrustedForm certificate captured at the widget level when contact form is submitted
  - Google Ads, Bing UET, and Vibe conversion events all fire as normal on quote display

**2. Update `AppointmentBookingWidgetWithOptIn`**
- Add an `onBookingCompleted` callback that passes the contact data (firstName, lastName, email, phone) back to the parent page so it can fire the FB Appointment CAPI event with full PII
- Ensure the widget's existing webhook logic still fires to GHL

**3. Route registration: `src/App.tsx`**
- Add `/suppappt2` route pointing to the new page

**4. Analytics tracking**
- Use funnel name `suppappt2` for the `useFunnelAnalytics` hook
- Submission saved to `submissions` table with `page: 'suppappt2'`

### Flow comparison

```text
/suppappt (current):
  Quiz -> Contact Info -> Loading -> Rate + Booking Widget

/suppappt2 (new):
  Quiz -> Loading -> Rate + Booking Widget (contact collected inside widget after time selection)
```

### Technical details

- The FB CAPI "Lead" event on quote display will send without PII (no name/email/phone) but will still include zip, visitor ID, fbc/fbp cookies, and conversion value
- The FB CAPI "Appointment" event will include full PII passed back from the widget via callback
- The `AppointmentBookingWidgetWithOptIn` already handles contact creation in GHL, webhook submission, and booking -- just needs the callback added to surface contact data to the parent
- The dedicated GHL webhook URL for this funnel can use the same one as /suppappt1 or a new one (your choice -- can be configured later)
