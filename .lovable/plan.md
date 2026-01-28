

## Plan: Replace Time Auto-Selection with Inline "Book" Button on Each Slot

### Overview
Remove the auto-selection of time slots and replace the separate confirmation panel with an inline "Book" button that appears directly on the selected time slot. When a user taps a time, the slot expands/slides and reveals a green "Book" button — all in one tap target.

---

### Current Behavior (What We're Removing)
1. Time slots auto-select the first available option (within 300ms)
2. A separate confirmation panel appears below all times with "Book My Call" button
3. User has to scroll down to see and tap the Book button

### New Behavior
1. **No auto-selection** — user must tap a time to select it
2. When a time is tapped:
   - The slot expands horizontally with a smooth animation
   - A green "Book" button slides in from the right
   - The time display shifts left to make room
3. Tapping "Book" confirms the appointment
4. Tapping a different time moves the Book button to that row
5. **Mobile-optimized**: Large touch targets, clear visual feedback

---

### Visual Design

```text
BEFORE (separate panel):
┌─────────────────────────────┐
│        10:00 AM             │  ← Selected (green border)
└─────────────────────────────┘
┌─────────────────────────────┐
│        11:00 AM             │
└─────────────────────────────┘
┌─ Confirmation Panel ────────┐
│  You selected: 10:00 AM     │
│  ┌─────────────────────┐    │
│  │   Book My Call      │    │  ← Separate button below
│  └─────────────────────┘    │
└─────────────────────────────┘

AFTER (inline book button):
┌─────────────────────────────────────┐
│  ⏰ 10:00 AM    │  ✓ Book  │  ← Button slides in!
└─────────────────────────────────────┘
┌─────────────────────────────────────┐
│           11:00 AM                  │
└─────────────────────────────────────┘
```

---

### Files to Modify

| File | Changes |
|------|---------|
| `src/components/AppointmentBookingWidget.tsx` | Remove auto-select logic, redesign time slot buttons with inline Book action |
| `tailwind.config.ts` | Add slide-in animation for the Book button |

---

### Technical Changes

#### 1. Remove Auto-Selection Logic
Delete the auto-selection code that fires 300ms after slots load:

```tsx
// DELETE this block (lines 356-364)
setTimeout(() => {
  setSelectedSlot(cached[0]);
  setWasAutoSelected(true);
  onTrackEvent?.({ ... });
}, 300);
```

Also remove the `wasAutoSelected` state since it's no longer needed.

#### 2. Add Slide-In Animation (tailwind.config.ts)
```tsx
keyframes: {
  'slide-in-left': {
    '0%': { transform: 'translateX(20px)', opacity: '0' },
    '100%': { transform: 'translateX(0)', opacity: '1' }
  }
},
animation: {
  'slide-in-left': 'slide-in-left 0.2s ease-out'
}
```

#### 3. Redesign Time Slot Buttons (lines 848-870)
Transform each time slot into a row with conditional inline Book button:

```tsx
{availableSlots.map((slot) => {
  const isSelected = selectedSlot?.original === slot.original;
  return (
    <div
      key={slot.original}
      className={`w-full min-h-[70px] border-2 rounded-xl transition-all overflow-hidden
                  ${isSelected 
                    ? 'bg-green-50 border-green-600' 
                    : 'bg-white border-gray-200 hover:border-green-400'}
                  ${isLoading ? 'opacity-50' : ''}`}
    >
      <div className="flex items-center h-full">
        {/* Time display - clickable to select */}
        <button
          onClick={() => handleSlotSelect(slot)}
          disabled={isLoading}
          className="flex-1 h-full flex items-center justify-center gap-2 p-4"
        >
          {isSelected && <span className="text-lg">⏰</span>}
          <span className={`text-2xl font-semibold ${isSelected ? 'text-green-700' : 'text-gray-900'}`}>
            {slot.display}
          </span>
        </button>
        
        {/* Inline Book button - only shows when selected */}
        {isSelected && (
          <button
            onClick={handleConfirmBooking}
            disabled={isLoading}
            className="h-full px-6 bg-green-600 hover:bg-green-700 text-white 
                       font-bold flex items-center gap-2 animate-slide-in-left
                       min-w-[100px] justify-center"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <Check className="w-5 h-5" />
                Book
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
})}
```

#### 4. Remove the Confirmation Panel (lines 878-928)
Delete the entire `{selectedSlot && (...)}` confirmation panel block since the Book button is now inline.

#### 5. Remove Unused Code
- Delete `confirmationRef` since we no longer have a separate confirmation panel
- Delete the scroll effect that used it
- Delete `wasAutoSelected` state

---

### Mobile Considerations

| Aspect | Solution |
|--------|----------|
| Touch targets | 70px min-height maintained, Book button is 100px wide |
| Visibility | No scrolling needed — Book button appears in same row |
| Feedback | Green highlight + slide animation provides clear feedback |
| Booking state | "Booking..." spinner shows in the Book button itself |

---

### Expected User Flow

1. User sees list of available times (no pre-selection)
2. User taps a time → row expands, green "Book" button slides in
3. User can:
   - Tap "Book" to confirm → booking processes, shows success
   - Tap a different time → Book button moves to new row
4. While booking: "Book" shows spinner, slot is disabled

