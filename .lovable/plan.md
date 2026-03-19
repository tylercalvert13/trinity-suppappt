

# Add Calendar Booking Widget to /suppappt Funnel

## Summary
Not hard at all. The suppappt funnel already collects contact info before showing results, so we just need to add the booking widget below the existing agent assignment card on the qualified screen. We'll use `AppointmentBookingWidgetWithOptIn` (like suppappt2) since it handles contact creation internally — we just prefill the contact data.

## Changes

### `src/pages/MedicareSupplementAppointment.tsx`

1. **Add imports**: `AppointmentBookingWidgetWithOptIn`, `useCalendarWarmup`, `StickyBookingCTA`, `ExitIntentModal`, plus `Clock` and `ChevronDown` icons.

2. **Add state/refs**: `bookingWidgetRef` for scroll targeting, `selectedTimeDisplay` and `selectedDayLabel` for the sticky CTA.

3. **Add `useCalendarWarmup()`** call (replace the "no calendar warmup needed" comment).

4. **Add `handleBookingCompleted` callback** to fire Facebook appointment tracking (similar to suppappt2).

5. **Add `scrollToBookingWidget` helper** function.

6. **Update the qualified screen** (lines ~1597-1742): After the existing agent assignment card, add:
   - A "Book My Free Call Now" button that scrolls to the widget
   - A "Rate Reserved — 15 Minutes" urgency CTA
   - The `AppointmentBookingWidgetWithOptIn` component, prefilled with the user's name, email, phone, zip, quote data
   - Keep existing agent card + testimonials + trust badges

7. **Add overlays**: `ExitIntentModal`, `StickyBookingCTA` when qualified (same pattern as suppappt2).

### What stays the same
- The speed-to-lead agent assignment still happens and displays
- All existing conversion tracking (Facebook, TikTok, Google, Bing, Vibe) stays
- The "Call directly" CTA remains as a fallback
- The booking widget is an **addition**, not a replacement — users can either call the assigned agent or book a time slot

