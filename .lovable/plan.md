
## Plan: Fix Greyed Out Appointment Booking Widget

### Problem Identified
Based on the screenshot and code analysis, when a user clicks a day (e.g., Friday), the widget:
1. Sets `isLoading = true` 
2. Calls `fetchSlots()` to get available times
3. While loading, ALL day buttons get `disabled={isLoading}` and `opacity-50 cursor-not-allowed`
4. If the API call hangs or is slow, the entire widget appears frozen/greyed out

The user sees the selected day (green border on Friday) but can't interact with anything because `isLoading` is still true.

### Root Cause
The `isLoading` state is used for multiple purposes:
1. Disabling day buttons during slot fetching
2. Disabling time slots during booking confirmation
3. Showing loading spinners

This causes the day buttons to stay disabled during the fetch, even though the user is just waiting to see time slots.

### Solution
Separate the loading states to allow the UI to remain interactive:

1. **Keep day buttons clickable** while fetching slots (remove `disabled={isLoading}` from day buttons)
2. **Only disable during booking confirmation** when user actually clicks "Book"
3. **Add visual loading indicator** on the clicked day instead of disabling all buttons

---

### Files to Modify

| File | Changes |
|------|---------|
| `src/components/AppointmentBookingWidget.tsx` | Fix loading state to not disable all day buttons |

---

### Technical Changes

#### 1. Add a separate loading state for booking vs fetching

```tsx
// Current: one isLoading for everything
const [isLoading, setIsLoading] = useState(false);

// Better: separate concerns
const [isFetchingSlots, setIsFetchingSlots] = useState(false);
const [isBooking, setIsBooking] = useState(false);
```

#### 2. Update day button disabled logic (line 729)

```tsx
// BEFORE - disables all buttons during any loading
disabled={isLoading}

// AFTER - only disable during booking process
disabled={isBooking}
```

#### 3. Update the slot fetching function to use `isFetchingSlots`

```tsx
// In fetchSlots function
setIsFetchingSlots(true);
// ... fetch logic ...
setIsFetchingSlots(false);
```

#### 4. Update the confirmation booking to use `isBooking`

```tsx
// In handleConfirmBooking function
setIsBooking(true);
// ... booking logic ...
setIsBooking(false);
```

#### 5. Update time slot buttons to disable during booking

```tsx
// Time slots should only be disabled during booking
disabled={isBooking}
```

#### 6. Update the "Checking availability..." spinner condition

```tsx
// BEFORE
{isLoading && !selectedSlot && bookingStep !== 1 && (...)}

// AFTER
{isFetchingSlots && bookingStep === 2 && availableSlots.length === 0 && (...)}
```

---

### Visual Behavior After Fix

| State | Day Buttons | Time Slots | Book Button |
|-------|-------------|------------|-------------|
| Initial | Clickable | N/A | N/A |
| Fetching slots | Clickable (clicked shows spinner) | Loading indicator | N/A |
| Slots loaded | Clickable | Clickable | Hidden until selected |
| Time selected | Clickable | Clickable | Visible |
| Booking in progress | Disabled | Disabled | Shows spinner |

---

### Expected User Experience

1. User clicks "Friday" → can still click other days if they change their mind
2. Friday shows a brief loading indicator while fetching times
3. Times load and display
4. User taps a time → "Book" button slides in
5. User taps "Book" → **now** everything disables while booking processes
6. Success screen appears
