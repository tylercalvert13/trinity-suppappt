

## Fix Mobile Popups Blocking Day/Time Selection

### Problem
After the rate is revealed, two things pop up at the bottom of the screen on mobile:
1. **Social Proof Popup** ("Sarah from Florida just booked their call") — fixed to `bottom-4 left-4`
2. **Urgency Toast** ("Your rate is reserved...") — Sonner toasts default to the bottom

Both overlap the chat buttons for selecting a day and time, making them hard or impossible to tap on mobile.

### Solution

1. **Move Social Proof Popup to the top on mobile**
   - In `src/components/SocialProofPopup.tsx`, change positioning from `fixed bottom-4 left-4` to `fixed top-4 left-4` (or use responsive classes: `top-4` on mobile, `bottom-4` on desktop)
   - Update the slide animation from `slideInLeft` (bottom) to slide down from the top

2. **Move the urgency toast to the top**
   - In `src/pages/MedicareSupplementChat.tsx`, add `position: 'top-center'` to the `toast()` call so it appears at the top of the screen instead of the bottom

### Technical Details

**`src/components/SocialProofPopup.tsx`:**
- Change `className` from `fixed bottom-4 left-4` to `fixed top-20 left-4` (below the chat header)
- Update animation from `slideInLeft` to `slideInFromTop` (translate from -100% Y to 0)

**`src/pages/MedicareSupplementChat.tsx`:**
- Update the toast call (~line 330) to include `position: 'top-center'`:
  ```typescript
  toast("Your rate is reserved...", { duration: 5000, position: 'top-center' });
  ```

### What stays the same
- The popup still auto-dismisses after 4 seconds
- The toast still appears 10 seconds after qualification
- Exit intent modal behavior is unchanged (it's a full-screen overlay, not a bottom popup)
- No changes to `/suppappt` or any other funnel
