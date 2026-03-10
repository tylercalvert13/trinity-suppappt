

# Fix Contact Form Dropoff + Clarify Loader Data

## The Real Numbers (Last 14 Days)

- **Contact form:** 2,976 → 1,357 submitted = **54% dropoff** (the big problem)
- **Loader:** 1,357 entered → 1,360 outcomes (959 success, 385 knockout, 16 errors) = **~0% actual abandonment**
- **Knockouts:** 385/1,357 = **28.4%** can't-beat-rate — this is what looks like "loader dropoff" in the funnel chart

## Plan: Reduce Contact Form Dropoff

### Change 1 — Collapse the TCPA wall of text

The current layout shows the full TCPA consent paragraph (8 lines of dense legal text) between the phone field and the submit button. This is the most likely cause of the 54% dropoff — users see a wall of legal text and bounce.

**New layout (still TCPA compliant):**
- Show a **short one-liner** above the submit button: *"By clicking below, you consent to be contacted about Medicare options."*
- Add a **"View full terms"** text link that expands to reveal the full TCPA consent (which stays in the DOM for TrustedForm tagging, just hidden via CSS `max-height` animation)
- The full consent text, TrustedForm `data-tf-element-role` attributes, and Privacy Policy / Terms of Service links all remain in the expanded section
- This keeps it legally compliant — the consent language is present and accessible, the user just isn't hit with it visually

### Change 2 — Move testimonial above the form, not between consent and button

The current mini-testimonial sits between the TCPA text and the submit button, adding even more visual distance. Move it above the form fields as social proof to encourage form completion.

### Change 3 — Reorder: Fields → Button → Consent

Put the submit button **immediately after the phone field**, then the collapsed consent below it. This follows the pattern used by most high-converting lead forms — the action comes first, the fine print follows.

**New visual order:**
1. Trust badges (already there)
2. Testimonial (moved up)
3. Form fields (first name, last name, email, phone)
4. **Submit button** ("See My New Rate")
5. Short consent one-liner + expandable full TCPA text

### Technical Details

**File: `src/pages/MedicareSupplementAppointment.tsx`**

1. Rearrange the contact step JSX (~lines 1474-1598):
   - Move testimonial div above the `<form>` element
   - Inside the form: fields → submit button → consent section
   - Wrap full TCPA text in a collapsible `div` with `useState` toggle (`showFullConsent`)
   - Use `overflow-hidden` + `max-height` transition for smooth expand/collapse
   - Keep all `data-tf-element-role` attributes intact on the consent text, submit button text, and advertiser name

2. Add state: `const [showFullConsent, setShowFullConsent] = useState(false);`

3. Short consent line (always visible): `"By clicking, you consent to be contacted about Medicare options. "` + clickable `"Full disclosure ›"` that toggles the expanded TCPA text.

**No database or backend changes needed.**

