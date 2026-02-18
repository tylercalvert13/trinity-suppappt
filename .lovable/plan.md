

## Reduce Loading Screen Abandonment and Build Trust Throughout the Funnel

Based on the data: 29% of users abandon at the loading screen, and most leave within the first few seconds (commitment hesitation, not slow load times). Here's a two-part plan.

---

### Part 1: Loading Screen Improvements

The current loading screen is functional but purely technical ("Connecting to carriers..."). It doesn't reinforce *why* the user should wait. Changes:

**A. Add a testimonial/social proof rotation below the progress steps**
- Show 2-3 rotating mini-testimonials during the wait (e.g., "Patricia from FL saved $127/mo" with a star rating)
- These rotate every 3 seconds, giving the user something to read and reinforcing that real people save money

**B. Add a "Did You Know?" fact rotation**
- Between the progress steps and the testimonials, show rotating educational facts:
  - "Did you know? Your Plan G benefits are identical no matter which company you choose."
  - "The average senior saves $1,200/year by switching carriers."
- This keeps users engaged and reinforces the value proposition

**C. Personalize the header with their name**
- Change "Finding your best rate..." to "Finding your best rate, [FirstName]..."
- Small touch that increases commitment (they've already invested their info)

**D. Add a "Don't leave!" back-button intercept**
- Use `beforeunload` event on the loading step to warn users they'll lose their quote progress

---

### Part 2: Trust Signals Throughout the Funnel

Currently, trust elements only appear on the hero (3 badges) and after qualification (4 checkmarks). The middle of the funnel (steps 1-11) has zero trust reinforcement. Changes:

**A. Add a persistent trust bar below the progress indicator on every question step**
- A subtle, compact bar showing: a lock icon + "Your info is secure" | shield icon + "Licensed agents" | star icon + "A+ Rated carriers"
- This sits just below the step counter on every question card, taking minimal space

**B. Add a mini-testimonial below the contact form**
- Before the submit button, show a single testimonial: "I was nervous to share my info, but they called me right on time and saved me $89/month. - Robert, TX"
- Directly addresses the friction point of giving personal info

**C. Social proof popup earlier in the funnel**
- Currently only shows after qualification. Move it to trigger at step 5+ (after health questions are done) so users see "Sarah from Florida just booked" while they're still filling out details
- This creates urgency during the data-entry phase, not just after

**D. Add "Trusted by 10,000+ seniors" counter below the payment input**
- On the "How much do you pay?" step, add a subtle note: "Join 10,000+ seniors who've compared rates for free"

---

### Technical Details

**Files modified:**

1. **`src/components/QuoteLoadingProgress.tsx`**
   - Add `firstName` prop
   - Add testimonial rotation array with `useState` + `useEffect` timer
   - Add "Did you know?" facts rotation
   - Add `beforeunload` event listener during loading
   - Render testimonials below the step list in a styled card

2. **`src/pages/MedicareSupplementAppointment.tsx`**
   - Pass `firstName={formData.firstName}` to `QuoteLoadingProgress`
   - Create a `TrustBar` inline component (lock + shield + star, ~3 lines of icons/text)
   - Add `TrustBar` inside each question step card, below the progress bar
   - Add testimonial text above the contact form submit button
   - Move `SocialProofPopup` to render when step is past "medications" (not just "qualified")
   - Add "Join 10,000+ seniors" note to payment step

3. **`src/components/SocialProofPopup.tsx`**
   - No structural changes needed; the parent just mounts it earlier

**No database, edge function, or API changes required.**

