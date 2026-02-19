

# Update /report Loading Screen, Report Results & CTAs

## 1. Loading Screen: Match the Agora Editorial Style

The current `QuoteLoadingProgress` component uses a white card with blue/green accent colors -- it doesn't match the warm stone/cream editorial style of the rest of the quiz.

**Solution:** Instead of modifying the shared `QuoteLoadingProgress` component (which other funnels use), build a custom inline loading section directly in `MedicareSupplementReport.tsx` that matches the funnel's design language.

**Design:**
- White card with `border-stone-200`, same as `StepCard`
- Serif typography, stone color palette
- Steps reworded for "report" context:
  - "Connecting to carriers..."
  - "Scanning available rates..."
  - "Comparing [Plan] options..."
  - "Calculating potential savings..."
  - "Preparing your savings report..."
- Stone-toned progress bar, green checkmarks, stone spinner
- "Did You Know?" box uses `bg-stone-50 border-stone-200` instead of blue
- Testimonial box uses `bg-amber-50 border-amber-200` instead of green
- Header: "Preparing your savings report, [firstName]..."
- Keep the beforeunload warning and slow-loading message

## 2. Remove Carrier Name from Results

Remove the "Carrier Info" section (lines 970-977) that displays the carrier name and AM Best rating. The report will show the rate comparison numbers without revealing which carrier offers the lower rate.

## 3. Restructure CTAs: Call = Primary, Book = Secondary (Below Report)

Current layout has a big "Call Now" button, then "or schedule a call" with the booking widget right underneath. The auto-scroll to the booking widget happens after 5 seconds, which doesn't give time to read the report.

**Changes:**
- Keep the "Call Now" CTA as the primary action right after the report, styled prominently (amber button, same as now)
- Move the booking widget further down with a softer intro: "Prefer to schedule a call?" with secondary styling
- Increase the auto-scroll delay from 5 seconds to 12 seconds so users have time to read the full report before the page scrolls to the booking widget
- The booking widget heading will use a quieter tone -- no competing urgency with the call CTA

## Technical Changes

All changes are in `src/pages/MedicareSupplementReport.tsx`:

1. **Replace `QuoteLoadingProgress` import/usage** (lines 13, 897-903) with a custom inline loading UI that uses the stone/serif design system
2. **Remove carrier info block** (lines 970-977)
3. **Increase auto-scroll delay** from 5000ms to 12000ms (line 241)
4. **Soften booking widget intro text** (line 1014) -- change from "or schedule a call" to "Prefer to schedule a time?"

