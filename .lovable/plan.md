

## Plan: UX Optimizations for /suppappt Quote Results & Booking Page

### Overview
This plan implements 7 conversion-focused UX enhancements for the appointment booking page on the `/suppappt` funnel. All changes are designed for a senior audience with smooth, professional animations.

---

### Feature 1: Auto-Scroll to Calendar (6 second delay)

**What it does**: After the quote results load, waits 6 seconds then smoothly scrolls down to the booking calendar widget.

**Implementation**:
- Add a `bookingWidgetRef` to the `AppointmentBookingWidget` component
- Add a `useEffect` in `MedicareSupplementAppointment.tsx` that triggers on `step === "qualified"`
- Use `setTimeout` with 6000ms delay + `scrollIntoView({ behavior: 'smooth' })`

**Code location**: `src/pages/MedicareSupplementAppointment.tsx` (lines ~1227-1272)

---

### Feature 2: Pre-Select Default Time

**What it does**: Auto-selects "Tomorrow" as the default day and the first available time slot. Updates CTA button text to show the selection.

**Implementation**:
- Modify `AppointmentBookingWidget.tsx` to auto-trigger day selection on mount (first available day with slots)
- After slots load, auto-select the first available slot
- Update the "Book My Call" button text to include the time: "Book My Call - Tomorrow at 10:00 AM"
- Add `autoSelectFirst` prop to control this behavior (enabled only for funnel mode)

**Code location**: `src/components/AppointmentBookingWidget.tsx` (lines ~294-411)

---

### Feature 3: Pulsing CTA Button (5 second delay)

**What it does**: Adds a subtle green glow animation to the "Book My Call" button that starts after 5 seconds.

**Implementation**:
- Add new keyframe animation `cta-glow` to `tailwind.config.ts`:
```
'cta-glow': {
  '0%, 100%': { boxShadow: '0 0 8px 2px rgba(22, 163, 74, 0.4)' },
  '50%': { boxShadow: '0 0 20px 6px rgba(22, 163, 74, 0.6)' }
}
```
- Add `animate-cta-glow` animation class
- In the booking widget, add state `ctaAnimationActive` that turns true after 5s
- Apply animation class conditionally to the "Book My Call" button

**Code location**: `tailwind.config.ts` + `src/components/AppointmentBookingWidget.tsx` (lines ~812-828)

---

### Feature 4: Sticky Floating CTA (Mobile Only)

**What it does**: Shows a fixed-bottom "Book My Call" button when user scrolls past the main CTA. Tapping it scrolls back up and highlights the calendar.

**Implementation**:
- Add `IntersectionObserver` to track visibility of the main CTA button
- When main CTA is out of view (scrolled past), show floating button
- On click: `scrollIntoView` to calendar + brief highlight animation
- Only render on mobile (use `useIsMobile` hook)
- Style: fixed bottom, z-50, full-width green button with shadow

**Code location**: `src/pages/MedicareSupplementAppointment.tsx` (new component/section after line ~1272)

---

### Feature 5: Urgency Toast Notification (10 second delay)

**What it does**: Shows a toast message after 10 seconds: "Your rate is reserved - pick a time to lock it in"

**Implementation**:
- Use existing Sonner toast system (`import { toast } from 'sonner'`)
- Add `useEffect` in `MedicareSupplementAppointment.tsx` that triggers on `step === "qualified"`
- `setTimeout` at 10000ms, show toast with clock emoji
- Auto-dismiss after 5 seconds (Sonner default or custom duration)

```typescript
toast("Your rate is reserved - pick a time to lock it in", {
  duration: 5000,
  icon: "clock",
});
```

**Code location**: `src/pages/MedicareSupplementAppointment.tsx`

---

### Feature 6: Exit-Intent Popup

**What it does**: Shows a modal when user attempts to leave the page. Only shows once per session.

**Detection methods**:
- Desktop: Mouse leaves viewport top (touchend near top)
- Mobile: Back button press (popstate event)
- Mobile: Rapid upward scroll (scroll velocity detection)

**Implementation**:
- Create new component `ExitIntentModal.tsx`
- Use existing Radix Dialog component
- Track shown state in sessionStorage to show only once
- Modal content:
  - "Wait! Your $XXX/month savings expires soon."
  - Single green "Book My Call" button
  - Clicking button closes modal and scrolls to calendar

**Code location**: New file `src/components/ExitIntentModal.tsx` + integration in `MedicareSupplementAppointment.tsx`

---

### Feature 7: Social Proof Popup (8 second delay, optional)

**What it does**: Shows a small popup in bottom-left corner with fake social proof: "Sarah from Florida just booked her call"

**Implementation**:
- Create reusable `SocialProofPopup.tsx` component
- Array of realistic name/state combinations:
```typescript
const SOCIAL_PROOF_DATA = [
  { name: 'Sarah', state: 'Florida' },
  { name: 'Robert', state: 'Texas' },
  { name: 'Mary', state: 'Ohio' },
  { name: 'James', state: 'Arizona' },
  { name: 'Linda', state: 'Pennsylvania' },
];
```
- Show after 8 seconds, auto-dismiss after 4 seconds
- Fixed position bottom-left, subtle slide-in animation
- Bell emoji + text
- Only show once per page load

**Code location**: New file `src/components/SocialProofPopup.tsx` + integration in `MedicareSupplementAppointment.tsx`

---

### Files to Create

| File | Purpose |
|------|---------|
| `src/components/ExitIntentModal.tsx` | Exit-intent popup with savings message |
| `src/components/SocialProofPopup.tsx` | Social proof notification |
| `src/components/StickyBookingCTA.tsx` | Floating mobile CTA button |

---

### Files to Modify

| File | Changes |
|------|---------|
| `tailwind.config.ts` | Add `cta-glow` keyframe and animation |
| `src/pages/MedicareSupplementAppointment.tsx` | Add auto-scroll, toast, exit-intent, social proof, sticky CTA integrations |
| `src/components/AppointmentBookingWidget.tsx` | Add auto-selection logic for day/time, pulsing CTA button |

---

### Technical Implementation Details

#### Auto-Scroll Logic
```typescript
// In MedicareSupplementAppointment.tsx
const bookingWidgetRef = useRef<HTMLDivElement>(null);

useEffect(() => {
  if (step === "qualified" && quoteResult) {
    const timer = setTimeout(() => {
      bookingWidgetRef.current?.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start' 
      });
    }, 6000);
    return () => clearTimeout(timer);
  }
}, [step, quoteResult]);
```

#### Auto-Select First Available Slot
```typescript
// In AppointmentBookingWidget.tsx - after preload completes
useEffect(() => {
  if (!autoSelectFirst || isStandalone) return;
  
  const firstDay = availableWeekdays[0];
  if (!firstDay) return;
  
  const dateStr = formatDateString(firstDay);
  const cached = preloadedSlots.get(dateStr);
  
  if (cached && cached.length > 0 && !selectedDate) {
    // Auto-trigger day selection
    setSelectedDate(firstDay);
    setAvailableSlots(cached);
    setBookingStep(2);
    
    // Auto-select first slot after short delay
    setTimeout(() => {
      setSelectedSlot(cached[0]);
    }, 300);
  }
}, [preloadedSlots, availableWeekdays, autoSelectFirst, isStandalone, selectedDate]);
```

#### CTA Button with Dynamic Text
```typescript
// Current button text
"Book My Call"

// New dynamic text when slot is selected
`Book My Call - ${getDayLabel()} at ${selectedSlot.display}`

// Example output
"Book My Call - Tomorrow at 10:00 AM"
```

#### Exit Intent Detection (Mobile)
```typescript
useEffect(() => {
  if (exitShown) return;
  
  let lastScrollY = window.scrollY;
  let scrollVelocity = 0;
  
  const handleScroll = () => {
    const currentY = window.scrollY;
    scrollVelocity = lastScrollY - currentY;
    lastScrollY = currentY;
    
    // Rapid upward scroll near top = exit intent
    if (scrollVelocity > 50 && currentY < 200) {
      setShowExitModal(true);
      sessionStorage.setItem('exit_intent_shown', 'true');
    }
  };
  
  const handlePopState = () => {
    setShowExitModal(true);
    sessionStorage.setItem('exit_intent_shown', 'true');
  };
  
  window.addEventListener('scroll', handleScroll, { passive: true });
  window.addEventListener('popstate', handlePopState);
  
  return () => {
    window.removeEventListener('scroll', handleScroll);
    window.removeEventListener('popstate', handlePopState);
  };
}, [exitShown]);
```

---

### Animation Specifications

| Animation | Timing | Speed | Description |
|-----------|--------|-------|-------------|
| Auto-scroll | 6s delay | 800ms scroll | Smooth scroll to calendar |
| CTA pulse | 5s delay, 2s cycle | Infinite | Gentle green glow |
| Sticky CTA slide | On scroll | 300ms | Slide up from bottom |
| Toast | 10s delay | 5s visible | Fade in/out |
| Exit modal | On trigger | 200ms | Fade + scale in |
| Social proof | 8s delay | 4s visible | Slide in from left |

---

### Mobile Optimizations

1. **Sticky CTA**: Only shows on mobile (< 768px width)
2. **Touch-friendly**: All buttons maintain min-height of 60-70px
3. **Exit intent**: Uses scroll velocity + back button instead of mouse tracking
4. **Social proof popup**: Positioned at bottom-left, doesn't obscure main content
5. **Toast position**: Uses Sonner's default mobile-friendly positioning

---

### Senior Accessibility Considerations

1. All animations are subtle and smooth (no jarring movements)
2. Animation speeds are slow enough to be perceivable but not distracting
3. Large tap targets maintained throughout
4. High contrast colors for text and buttons
5. Clear, simple messaging without jargon

---

### Summary

| Feature | Delay | Duration | Shows Once |
|---------|-------|----------|------------|
| Auto-scroll to calendar | 6s | Instant | Yes |
| Pre-select time | 0s (after load) | N/A | N/A |
| Pulsing CTA | 5s | Infinite | N/A |
| Sticky floating CTA | On scroll | While scrolled | N/A |
| Urgency toast | 10s | 5s | Yes |
| Exit-intent popup | On trigger | Until dismissed | Yes (session) |
| Social proof popup | 8s | 4s | Yes (page load) |

