

## Plan: Fix Immediate Auto-Scroll in Booking Widget

### Problem
After getting a quote, the page scrolls to the appointment booking section almost immediately (within ~1 second) instead of waiting 6 seconds as intended.

**Root Cause:**
There are two competing scroll mechanisms:

1. **Parent page** (`MedicareSupplementAppointment.tsx` line 241-253): Scrolls to booking widget after **6 seconds**
2. **Widget internal** (`AppointmentBookingWidget.tsx` line 522-529): Scrolls to confirmation panel **immediately** when a slot is selected

Since `autoSelectFirst={true}` is enabled, the widget auto-selects the first time slot within 300ms of loading. This triggers the widget's internal scroll effect that immediately scrolls down to the confirmation panel — bypassing the intended 6-second delay.

### Solution
Modify the widget's internal scroll effect to **skip scrolling when the slot was auto-selected**. Only scroll when the user manually picks a different slot.

---

### Files to Modify

| File | Changes |
|------|---------|
| `src/components/AppointmentBookingWidget.tsx` | Add state to track auto-selection, skip scroll if auto-selected |

---

### Code Changes

**AppointmentBookingWidget.tsx:**

1. **Add tracking state** to know if the current slot was auto-selected:

```tsx
// Around line 155, add new state
const [wasAutoSelected, setWasAutoSelected] = useState(false);
```

2. **Set flag when auto-selecting** (around line 354):

```tsx
// BEFORE
setTimeout(() => {
  setSelectedSlot(cached[0]);
  onTrackEvent?.({ ... });
}, 300);

// AFTER
setTimeout(() => {
  setSelectedSlot(cached[0]);
  setWasAutoSelected(true);  // Mark as auto-selected
  onTrackEvent?.({ ... });
}, 300);
```

3. **Skip scroll for auto-selected slots** (around line 522):

```tsx
// BEFORE
useEffect(() => {
  if (selectedSlot && confirmationRef.current) {
    confirmationRef.current.scrollIntoView({ 
      behavior: 'smooth', 
      block: 'nearest' 
    });
  }
}, [selectedSlot]);

// AFTER
useEffect(() => {
  // Only scroll if user manually selected (not auto-selected on mount)
  if (selectedSlot && confirmationRef.current && !wasAutoSelected) {
    confirmationRef.current.scrollIntoView({ 
      behavior: 'smooth', 
      block: 'nearest' 
    });
  }
  // Reset flag after first manual selection
  if (wasAutoSelected && selectedSlot) {
    setWasAutoSelected(false);
  }
}, [selectedSlot, wasAutoSelected]);
```

---

### Expected Behavior After Fix

1. User completes the funnel and sees the "Great News" results screen
2. Widget auto-selects the first available time slot in the background (no scroll)
3. User can read their rate and the urgency box comfortably
4. After 6 seconds, page smoothly scrolls to the booking widget (parent's intended behavior)
5. If user manually selects a different time slot, the confirmation panel scrolls into view

