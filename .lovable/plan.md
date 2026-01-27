

## Plan: Simplify Booking Flow + Add Booking Widget Analytics

### Overview
Two changes to improve conversions and visibility:
1. **Remove the Morning/Afternoon step** - When a user selects a day, show ALL available times immediately (skip the extra click)
2. **Add booking widget analytics** - Track every micro-step in the booking widget so you can see exactly where users drop off

---

### Change 1: Remove Morning/Afternoon Step

**Current Flow (4 steps):**
```text
Day → Morning/Afternoon → Pick Time → Book
```

**New Flow (3 steps):**
```text
Day → Pick Time → Book
```

**Benefits:**
- One less click = less friction
- Users see all available times at once (clearer picture of availability)
- Faster path to booking

**Technical Changes:**

| File | Changes |
|------|---------|
| `src/components/AppointmentBookingWidget.tsx` | Skip step 2 entirely, go from day selection (step 1) directly to time selection (previously step 3) |

**Key modifications:**
- When a day is selected, go directly to showing ALL time slots (not filtered by morning/afternoon)
- Remove the `selectedTimeRange` state dependency for displaying slots
- Update the back button text to say "Pick a different day" instead of "Pick a different time range"
- Update the step indicator to show 3 steps instead of 4 (Day → Time → Confirm)
- Remove the Morning/Afternoon filter buttons (step 2) entirely
- Keep the morning/afternoon utility functions for badge display on step 1 (e.g., "Morning & Afternoon available")

---

### Change 2: Add Booking Widget Analytics

**New Events to Track:**

| Event | When | Metadata |
|-------|------|----------|
| `booking_widget_view` | Widget mounts | None |
| `booking_day_selected` | User clicks a day | `{ day: "2025-01-28", dayLabel: "Today" }` |
| `booking_time_selected` | User clicks a time slot | `{ time: "10:30 AM", slotOriginal: "..." }` |
| `booking_confirm_clicked` | User clicks "Book My Call" | `{ slotTime: "...", contactLookupRequired: true/false }` |
| `booking_completed` | Appointment successfully booked | `{ appointmentId: "...", agentName: "..." }` |
| `booking_error` | Any error occurs | `{ error: "slot_taken", step: "confirm" }` |
| `booking_call_now_clicked` | User clicks "Call Us" alternative | `{ step: 1 }` |

**Technical Changes:**

| File | Changes |
|------|---------|
| `src/components/AppointmentBookingWidget.tsx` | Add analytics tracking calls at each user action point |

**Implementation approach:**
- Accept an optional `onTrackEvent` callback prop from the parent page
- The parent page (`MedicareSupplementAppointment.tsx`) already has access to `useFunnelAnalytics` and can pass its `trackEvent` function
- For standalone booking (`/booking`), we can either add its own analytics session or skip tracking (since it's a different funnel)

---

### Files to Modify

| File | Changes |
|------|---------|
| `src/components/AppointmentBookingWidget.tsx` | 1) Remove step 2 (morning/afternoon), 2) Add tracking callback calls throughout |
| `src/pages/MedicareSupplementAppointment.tsx` | Pass `trackEvent` function to the booking widget |
| `src/pages/StandaloneBooking.tsx` | Optionally add tracking (or leave as-is for now) |

---

### Updated User Flow (After Changes)

```text
/suppappt funnel:

1. User qualifies → sees booking widget
   └── Event: booking_widget_view

2. User sees 4 day buttons → clicks "Today"
   └── Event: booking_day_selected { day: "2025-01-28" }

3. User sees ALL times (9:00 AM, 9:30 AM, 10:00 AM, etc.) → clicks 10:30 AM
   └── Event: booking_time_selected { time: "10:30 AM" }

4. Inline confirmation appears → user clicks "Book My Call"
   └── Event: booking_confirm_clicked

5. Appointment booked → success screen
   └── Event: booking_completed { appointmentId: "xyz" }
```

---

### Analytics Dashboard Impact

With these new events, you'll be able to see:
- How many users saw the booking widget vs. selected a day
- How many selected a time vs. clicked "Book My Call"
- How many completed vs. got errors
- Exact dropoff point for today's low conversion

**Example query you could run:**
```sql
SELECT event_type, COUNT(*) 
FROM funnel_events 
WHERE page = 'suppappt' 
  AND created_at > now() - interval '24 hours'
  AND event_type LIKE 'booking_%'
GROUP BY event_type
ORDER BY COUNT(*) DESC;
```

---

### Summary

This plan:
1. **Simplifies the booking flow** by removing the Morning/Afternoon step (3 clicks instead of 4)
2. **Adds granular tracking** so you can see exactly where users drop off in the booking widget
3. **Maintains all existing functionality** - times still display correctly, preloading still works, success screen unchanged

