

# Conversion Optimization for /suppappt — Revised Plan

## Changes to implement

### 1. Auto-scroll to booking widget after qualification (5-second delay)
Add a `setTimeout` that scrolls to the booking widget 5 seconds after the qualified screen renders — enough time to read the savings card.

### 2. Remove email field from contact form
Drop from 4 fields to 3 (first name, last name, phone). Update the contact submit handler and webhook payload to omit email.

### 3. Compress the qualified screen
Remove the intermediate "Book My Free Call Now" button and the amber "Rate Reserved" urgency block. Layout becomes:
- Results card (rate + savings)
- Booking widget immediately
- Agent fallback card (smaller)
- 1 testimonial (keep existing copy — it's trust-focused and relevant to the appointment model)

### 4. Progress bar — "Almost done!" at late steps
At step 8+ (zip/contact), replace the step counter text with "Almost done!" and turn the progress bar green.

### Files
- **`src/pages/MedicareSupplementAppointment.tsx`** — all changes above

### What's NOT changing
- Funnel step count stays at 9 (no combining gender/tobacco/spouse)
- Existing testimonial copy stays as-is
- No "savings expires" scarcity messaging
- All conversion tracking unchanged
- Agent assignment + call fallback unchanged
- Exit intent modal, social proof popup, sticky CTA unchanged

