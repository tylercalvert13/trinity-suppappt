

## Plan: Fix Mobile Button Text Overflow

### Problem
The dynamic CTA button text "Book My Call — Tomorrow at 10:00 AM" is too long for mobile screens, causing text to be cut off or truncated.

### Solution
Use a two-line stacked layout on mobile to show all the information clearly:
- Line 1: "Book My Call"  
- Line 2: "Tomorrow at 10:00 AM" (smaller text)

This keeps the full information visible while fitting the mobile button width.

---

### Files to Modify

| File | Changes |
|------|---------|
| `src/components/AppointmentBookingWidget.tsx` | Stack button text on two lines |
| `src/components/StickyBookingCTA.tsx` | Same two-line stacked layout |

---

### Visual Change

**Before (truncated on mobile):**
```
┌─────────────────────────────────┐
│ ✓ Book My Call — Tomorrow a... │
└─────────────────────────────────┘
```

**After (stacked layout):**
```
┌─────────────────────────────────┐
│           ✓ Book My Call        │
│      Tomorrow at 10:00 AM       │
└─────────────────────────────────┘
```

---

### Code Changes

**AppointmentBookingWidget.tsx (lines 902-907):**
```jsx
// BEFORE
<>
  <Check className="w-5 h-5 mr-2 flex-shrink-0" />
  <span className="truncate">
    Book My Call — {getSelectedDayLabel()} at {selectedSlot.display}
  </span>
</>

// AFTER
<div className="flex flex-col items-center">
  <span className="flex items-center gap-2">
    <Check className="w-5 h-5 flex-shrink-0" />
    Book My Call
  </span>
  <span className="text-sm font-normal opacity-90">
    {getSelectedDayLabel()} at {selectedSlot.display}
  </span>
</div>
```

**StickyBookingCTA.tsx (lines 79-85):**
```jsx
// BEFORE
<Button ...>
  <Calendar className="w-5 h-5 mr-2" />
  {buttonText}
</Button>

// AFTER
<Button ...>
  {selectedTime && dayLabel ? (
    <div className="flex flex-col items-center">
      <span className="flex items-center gap-2">
        <Calendar className="w-5 h-5 flex-shrink-0" />
        Book My Call
      </span>
      <span className="text-sm font-normal opacity-90">
        {dayLabel} at {selectedTime}
      </span>
    </div>
  ) : (
    <>
      <Calendar className="w-5 h-5 mr-2" />
      Book My Call
    </>
  )}
</Button>
```

---

### Why This Works

1. **Full visibility** - All text is visible without truncation
2. **Clear hierarchy** - Primary action ("Book My Call") stands out, time is secondary
3. **Mobile-optimized** - Stacked layout fits narrow screens perfectly
4. **Consistent** - Same pattern in both main CTA and sticky CTA
5. **Senior-friendly** - Larger, more readable text presentation

