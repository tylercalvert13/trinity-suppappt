

# Senior-Friendly Booking Widget UI Improvements

## Summary
Update `AppointmentBookingWidgetWithOptIn.tsx` to be more senior-accessible, trust-focused, and designed to improve show-up rates.

## Changes

### `src/components/AppointmentBookingWidgetWithOptIn.tsx`

**Copy & Tone (remove pressure, build trust)**
- Heading: "Lock In Your $X Savings" → "Schedule Your Free Call" with subtitle "A licensed agent will review your savings — no obligation"
- Remove "🔥 12 people booked today" fake social proof
- "Want to lock this in RIGHT NOW?" → "Prefer to talk now?" with softer styling
- Clean up fire emoji language from bottom trust badges

**Typography & Touch Targets**
- Day buttons: bump text to `text-2xl`, min-height to 90px
- Time slot buttons: bump text to `text-3xl`, min-height to 80px
- Body text: `text-sm` → `text-base` for instructions/labels
- Step indicator dots: larger (w-3.5 h-3.5) with labels "Day → Time → Confirm"

**Time Slot Organization**
- Group slots into "Morning" and "Afternoon" sections with clear headers (helpers `isMorningSlot`/`isAfternoonSlot` already exist in the file)

**Success Screen (show-up rate)**
- Add "What to have ready" checklist: **Medicare card** and **current Medicare Supplement card** (not medications — nothing about their plan changes except carrier and price)
- Replace `AlertTriangle` icon with friendly phone icon for the "save number" section
- Make "Add to Calendar" more prominent with text: "Add a reminder so you don't miss your call"
- Emphasize: **"We call YOU — no need to dial anything"**

### What stays the same
- Step flow (day → time → contact/confirm → success)
- All API logic, slot fetching, contact creation
- Prefilled contact shortcut
- "Call Us" fallback option (just softer copy)

