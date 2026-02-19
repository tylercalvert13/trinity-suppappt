
# Update /report Results Page: CTA Hierarchy, Rounding, and Scroll Timing

## Changes (all in `src/pages/MedicareSupplementReport.tsx`)

### 1. Remove the "Call Now" button entirely
Delete the entire CTA section between the report card and the booking widget (lines 1114-1135): the "Ready to Lock In Your Savings?" heading, the amber call button, and the "Available Mon-Fri" text. The booking widget already has a "Call Now" fallback built in, so this is redundant.

### 2. Make booking the primary CTA
Replace the removed call section with a direct lead-in to the booking widget. Update the text above the widget (lines 1139-1141) to be more prominent:
- Heading: "Ready to Lock In Your Savings?" (serif, 2xl, bold -- moved from the deleted section)
- Subtext: "Pick a time and a licensed agent will confirm your rate and walk you through everything -- at no cost."

### 3. Round Key Finding savings to whole dollars
In the "Key Finding" section (lines 1061-1065), change:
- `quoteResult.monthlySavings.toFixed(2)` to `Math.round(quoteResult.monthlySavings)`
- `quoteResult.annualSavings.toFixed(2)` to `Math.round(quoteResult.annualSavings)`

The Rate Comparison table (lines 1077-1090) keeps `.toFixed(2)` -- cents stay in the detailed breakdown.

### 4. Increase auto-scroll delay from 12s to 25s
Change the timeout on line 367 from `12000` to `25000` so users have enough time to read the full report before the page scrolls to the booking widget.
