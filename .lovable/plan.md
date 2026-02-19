

# Redesign /form to Look Like a Facebook Instant Form

## What's Changing

The current `/form` page uses the editorial stone/serif styling from the /report funnel (dark hero banner, serif fonts, "Question X of Y" labels). It needs to be restyled to match the look and feel of a Facebook/Meta Instant Form -- clean, compact, and modern.

## Facebook Instant Form Design Characteristics

- **No dark hero section** -- the form starts immediately on a light gray background
- **Single white card** that contains everything -- progress bar, question, and action buttons
- **Blue accent color** (#1877F2 Facebook blue) for buttons and progress bar
- **Sans-serif font throughout** (system font stack, no serif)
- **Thin progress bar at the very top** of the card -- no "Question X of Y" text, no percentage
- **Compact spacing** -- less padding, tighter layout
- **Radio options** styled as simple tappable rows with subtle borders
- **"Next" button** in blue at the bottom of each card
- **Clean, minimal footer** with small disclaimer text

## Visual Changes (all in `src/pages/MedicareLeadForm.tsx`)

### 1. Remove the dark hero section
Replace the `bg-stone-900` hero banner with a simple, compact header inside or above the card. Add a small logo/brand line and a one-line headline -- no big splash.

### 2. Restyle the StepCard component
- Remove "Question X of Y" and percentage labels
- Keep only a thin blue progress bar at the top of the card (2px, Facebook blue)
- Use `rounded-xl` with a subtle shadow
- Switch all fonts from `font-serif` to system sans-serif (just remove `font-serif` classes)

### 3. Update color scheme
- Buttons: `bg-[#1877F2] hover:bg-[#166FE5]` (Facebook blue) instead of stone/amber
- Progress bar indicator: Facebook blue
- Radio option hover: light blue tint instead of stone
- Keep white card background on `bg-gray-100` page background

### 4. Restyle radio options (plan, gender, spouse, health)
- Simpler rows: lighter borders, blue highlight on hover/selected
- Remove the oversized `h-6 w-6` radio buttons -- use standard size
- Tighter padding (p-4 instead of p-5)

### 5. Restyle input steps (age, payment, ZIP)
- Inputs keep clean styling but with blue focus ring instead of stone
- "Continue" buttons become Facebook blue

### 6. Restyle contact step
- Same compact card style
- Submit button in Facebook blue
- TCPA consent text stays the same (required)

### 7. Confirmation screen
- Keep the green checkmark success state
- Update button/text colors to match the new blue theme

### 8. Loading screen
- Update progress bar color to blue
- Remove serif fonts

### 9. Landing state
- Replace the big dark hero with a compact intro card on gray background
- Small headline: "Free Medicare Supplement Rate Check"
- One-liner: "Find out if you're overpaying -- takes 60 seconds"
- Blue "Get Started" button
- Trust badges below in muted gray text

## Technical Details

### Files modified:
- **`src/pages/MedicareLeadForm.tsx`** -- Complete visual restyling (all within the same file, no logic changes). The funnel steps, data flow, submission logic, analytics, TrustedForm, and TCPA consent all stay identical. Only CSS classes and layout structure change.

### No other files need to change
The logic, routing, analytics hooks, and edge function calls remain untouched.

