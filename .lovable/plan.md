

# Switch /suppappt Back to Speed-to-Lead Model

## Summary
Remove the booking widget from the /suppappt results screen and make the assigned agent + phone number the primary CTA. Keep the simplified copy tone, keep email off, and leave the `AppointmentBookingWidgetWithOptIn` component itself untouched.

## Changes in `src/pages/MedicareSupplementAppointment.tsx`

### Results screen (lines ~1650-1731)
1. **Remove the `AppointmentBookingWidgetWithOptIn`** block (lines 1653-1679) entirely — the agent card becomes the primary CTA
2. **Promote the agent call card** (currently lines 1682-1731) to be immediately after the savings card — make it the hero action:
   - Larger phone number and "Call Now" button
   - Keep "Save to Contacts" vCard download
   - Keep the friendly copy: "Your Medicare Specialist **{name}** is reviewing your savings and will call you shortly"
3. **Remove booking-widget-related refs and state** that are no longer needed (`bookingWidgetRef`, `selectedTimeDisplay`, `selectedDayLabel`, `scrollToBookingWidget`)
4. **Remove the `AppointmentBookingWidgetWithOptIn` import**

### Bottom overlays (lines ~1786-1801)
5. **Update `ExitIntentModal`** `onBookClick` — change from `scrollToBookingWidget` to scroll to the agent card or trigger a `tel:` link
6. **Update `StickyBookingCTA`** — replace with a simple sticky "Call {Agent} Now" bar on mobile instead of the booking-widget-targeted CTA, or remove it and rely on the prominent agent card

### What stays the same
- All funnel steps (plan → payment → health → contact → loading)
- Agent round-robin assignment logic (`getNextAgent`)
- Webhook to GHL with agent assignment data
- Email removed from contact form
- All conversion tracking (FB, Google, Bing, TikTok, Vibe)
- The `AppointmentBookingWidgetWithOptIn` component file itself (unchanged)

