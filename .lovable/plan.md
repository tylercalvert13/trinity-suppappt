

## Plan: Add Eugene Schwartz-Style CTA Copy to Guide Users to Schedule

### The Problem
Currently, after showing users their savings, there's nothing telling them what to do next. The booking widget just appears below, but users may:
- Think they're done after seeing the rate
- Not realize they need to scroll
- Miss the urgency to act now

### Solution
Add a brief, benefit-focused transition section between the success header and the booking widget that:
1. Creates urgency around locking in the rate
2. Makes the next step crystal clear
3. Includes a visual cue (arrow) pointing down

### Eugene Schwartz Copywriting Principles Applied
- **Lead with desire**: Focus on what they want (keeping their savings)
- **Urgency without hype**: Rates can change, act now
- **One clear action**: "Pick a time below"
- **Reduce friction**: "2-minute call, no obligation"

---

### Copy to Add

**For /suppappt (has first name):**
```
Your rate is reserved for the next 15 minutes.

To lock in your ${savings}/month savings, pick a time below
for a quick 2-minute call with your licensed agent.

[Arrow pointing down]
```

**For /suppappt1 (no first name yet):**
```
This rate won't last forever.

To lock in your ${savings}/month savings, pick a time below
for a quick 2-minute call — no obligation.

[Arrow pointing down]
```

---

### Visual Design
- **Container**: Light amber/yellow background (`bg-amber-50`) with amber border to draw attention
- **Icon**: Clock or timer icon for urgency
- **Arrow**: Animated bouncing ChevronDown icon pointing to the booking widget
- **Typography**: Bold savings amount, clear instruction text

---

### Files to Modify

| File | Change |
|------|--------|
| `src/pages/MedicareSupplementAppointment.tsx` | Add CTA section between success header and booking widget (after line ~1230) |
| `src/pages/MedicareSupplementAppointment1.tsx` | Add CTA section between success header and booking widget (after line ~888) |

---

### Code Structure

Both files will get a new section like this:

```jsx
{/* Lock In Rate CTA */}
<div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-5 text-center">
  <div className="flex items-center justify-center gap-2 text-amber-800 mb-2">
    <Clock className="h-5 w-5" />
    <span className="font-semibold">Your rate is reserved for the next 15 minutes</span>
  </div>
  <p className="text-lg text-foreground">
    To lock in your <span className="font-bold text-green-600">${quoteResult.monthlySavings.toFixed(2)}/month savings</span>,
    <br />pick a time below for a quick 2-minute call with your licensed agent.
  </p>
  <div className="mt-4 flex justify-center">
    <ChevronDown className="h-8 w-8 text-amber-600 animate-bounce" />
  </div>
</div>
```

---

### Summary

This small addition will:
1. Create urgency with a time-limited reservation message
2. Reinforce the savings they'll get
3. Give a clear, single action ("pick a time below")
4. Use a visual arrow to guide their eye downward
5. Reduce anxiety with "2-minute call, no obligation"

The copy is direct, benefit-focused, and follows Schwartz's principle of intensifying the desire they already have (saving money) rather than trying to create new desire.

