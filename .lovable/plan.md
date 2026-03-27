

# Quick Layout & Copy Fixes for /suppappt

## Summary
Restructure the page flow to: Hero (with savings cards + CTA integrated) → Form → Stats section. Update subhead copy for clarity. Fix carrier heading visibility. Ensure clean mobile stacking.

## Changes in `src/pages/MedicareSupplementAppointment.tsx`

### 1. Move savings cards ABOVE the CTA button, inside the hero section (~lines 1035-1075)
- Remove the separate "Real Results Cards" `<section>` (lines 1055-1075)
- Insert the 3 savings cards grid inside the hero section, right before the CTA button
- Tighten spacing: `mb-6` after cards, then CTA button, then trust bar
- Flow becomes: badge → headline → subhead → savings cards → CTA → trust bar

### 2. Update subhead copy (line 1031-1033)
Replace with: "Plan G, F, and N rates go up every year. But some carriers charge way less than others for the exact same coverage. We'll find you the lowest one — free, 2 minutes."

### 3. Fix "Top Carriers Switched From" heading (line 1740)
- Increase text size from `text-sm` to `text-base font-semibold` and darken to `text-slate-700`

### 4. Mobile stacking verification
- Savings cards already use `grid-cols-1 md:grid-cols-3` — correct
- Stat boxes use `grid-cols-2 md:grid-cols-4` — already stacks to 2x2 on mobile, clean for the audience
- No changes needed, just confirming

### What stays the same
- 9-step form, all questions, validation, webhook
- Stats section stays below the form (but cards move up into hero)
- Agent round-robin, all tracking, footer, testimonials on results page

