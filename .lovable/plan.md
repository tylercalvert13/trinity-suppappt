

## Replace Booking Widget with Chat-Native Booking Flow

### What Changes
Instead of embedding the `AppointmentBookingWidget` component (which looks like a separate form/card), the booking flow will happen naturally through the chat conversation. The bot will present days as tappable buttons, then time slots as tappable buttons, and book the appointment with one click -- all as chat messages.

### Chat Booking Flow

```text
Bot: "Great news, [name]!"
[QuoteResultCard with rate/savings]

Bot: "Let's get you on a quick call to lock this in. Pick a day:"
[Today - Jan 29]  [Tomorrow - Jan 30]  [Friday - Jan 31]   <- chat buttons

User taps "Tomorrow"

Bot: "Here are the available times for Tomorrow:"
[9:00 AM]  [9:30 AM]  [10:00 AM]  [10:30 AM]  ...         <- chat buttons (scrollable)

User taps "10:00 AM"

Bot: (typing indicator while booking...)
Bot: "You're all set! We'll call you Tomorrow at 10:00 AM."
[Confirmation card with calendar/contact save buttons]
```

### Technical Details

**Files to modify:**

1. **`src/pages/MedicareSupplementChat.tsx`**
   - Remove the `AppointmentBookingWidget` import and usage
   - Remove `StickyBookingCTA` and related widget refs/state
   - Add booking logic directly into the chat flow:
     - On qualification: preload slots using `ghl-calendar` `free-slots-batch` action (same batch logic from widget)
     - Present available days as `ChatButtonGroup` options (e.g., "Today - Jan 29", "Tomorrow - Jan 30")
     - On day selection: show time slots as a new `ChatButtonGroup` with scrollable grid
     - On time selection: immediately book via `ghl-calendar` `search-contact` + `book-appointment` (one-click, same as widget)
     - On success: show a confirmation card as a chat bubble with the booked time, calendar download, and contact save buttons
   - New chat steps: `'pick-day'`, `'pick-time'`, `'booking'`, `'booked'`

2. **`src/components/chat/QuoteResultCard.tsx`**
   - No changes needed (stays as-is for the rate display)

3. **New: `src/components/chat/BookingConfirmationCard.tsx`**
   - A chat-bubble-styled confirmation card showing:
     - Green checkmark
     - "You're all set!" heading
     - Day + time in user's timezone
     - Agent name if available
     - "Add to Calendar" button (generates .ics file)
     - "Save Our Contact" button (generates .vcf)
     - "Save This Number" amber warning box
   - Styled to match the chat bubble aesthetic (left-aligned, white bubble)

### Booking Logic (moved from widget into chat page)

The following logic from `AppointmentBookingWidget` will be replicated inline in the chat page:

- **Slot preloading**: `free-slots-batch` API call on qualification (same batch fetch of 10 candidate weekdays)
- **Day filtering**: Only show days with actual availability (max 3 days)
- **Timezone conversion**: `convertToUserTimezone()` for displaying times in user's local timezone
- **Contact lookup**: `search-contact` action before booking
- **One-click booking**: `book-appointment` action on time slot tap
- **Slot taken handling**: Bot says "That time just got taken, pick another:" and re-shows time slots
- **Error handling**: Bot says "Oops, something went wrong" with retry option
- **ICS/vCard generation**: Same download functions from the widget

### What Gets Removed

- `AppointmentBookingWidget` import and component from the chat page
- `StickyBookingCTA` component (no longer needed since booking is inline)
- `widgetRef`, `bookingWidgetRef` refs
- `selectedDayLabel`, `selectedTimeDisplay` state
- `handleSlotChange` callback
- Auto-scroll to booking widget logic

### What Stays the Same

- `ExitIntentModal` (still useful for exit intent)
- `SocialProofPopup` (still appears after qualification)
- All conversion tracking (FB, Bing, Google, Vibe)
- All analytics events (booking_day_selected, booking_time_selected, booking_completed, etc.)
- Quote result card appearance
- TrustedForm integration
