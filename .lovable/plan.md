
## Send Facebook CAPI "Appointment" Event on Booking

### What changes

When a user successfully books an appointment in the /suppappt funnel, a new Facebook Conversion API event called "Appointment" will be sent with all available lead and booking data.

### How it works

The `MedicareSupplementAppointment.tsx` page already has:
- Facebook cookie helpers (`getFacebookCookies`)
- Visitor ID helper (`getVisitorIdForTracking`)
- Event ID generator (`generateEventId`)
- The `fb-conversion` edge function call pattern

The `AppointmentBookingWidget` fires an `onTrackEvent` callback with `eventType: 'booking_completed'` when a booking succeeds. The parent page already listens to this callback for analytics tracking.

### Technical Details

**`src/pages/MedicareSupplementAppointment.tsx`:**

1. Add a new helper function `trackFacebookAppointmentEvent` (similar to the existing `trackFacebookSubmissionEvent`) that sends:
   - `event_name: 'Appointment'`
   - `event_source_url`: current page URL
   - `external_id`: persistent visitor ID
   - `fbc` / `fbp`: Facebook cookies
   - `event_id`: unique ID for deduplication
   - `first_name`, `last_name`, `email`, `phone`, `zip_code`: all PII from the form
   - `value`: the quoted monthly savings or rate (conversion value)
   - `currency: 'USD'`

2. In the `onTrackEvent` handler for the booking widget, detect when `eventType === 'booking_completed'` and call `trackFacebookAppointmentEvent` with the stored form data and quote result.

No changes needed to the `fb-conversion` edge function or the `AppointmentBookingWidget` component -- the existing infrastructure handles everything.
