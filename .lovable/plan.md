

## Plan: Improve Urgency Box Formatting & Readability

### Problem
The amber "Lock In Rate CTA" box on the results page has formatting issues that make it hard to read:
1. Awkward line breaks (`<br />`) create weird text flow on different screen sizes
2. Too much information crammed into one paragraph
3. Green text embedded mid-sentence disrupts reading flow
4. Not optimized for quick mobile scanning

### Solution
Restructure the content into a cleaner, more scannable layout:
1. **Bold headline** with clock icon (urgency)
2. **Large savings amount** on its own line (the key value)
3. **Simple action text** below (what to do)
4. **Bouncing arrow** (visual cue)

This creates clear visual hierarchy that seniors can quickly scan.

---

### Files to Modify

| File | Changes |
|------|---------|
| `src/pages/MedicareSupplementAppointment.tsx` | Restructure urgency box layout (lines 1295-1308) |
| `src/pages/MedicareSupplementAppointment1.tsx` | Same restructure for consistency (lines 903-916) |

---

### Visual Comparison

**Before (cramped, hard to read):**
```text
┌─────────────────────────────────────┐
│  ⏰ Your rate is reserved for...   │
│ To lock in your $142.78/month      │
│ savings, pick a time below for a   │
│ quick 2-minute call with your...   │
│              ↓                      │
└─────────────────────────────────────┘
```

**After (clean, scannable):**
```text
┌─────────────────────────────────────┐
│    ⏰ Rate Reserved - 15 Minutes   │
│                                     │
│         $142.78/month               │
│           in savings                │
│                                     │
│    Pick a time below to lock in    │
│              ↓                      │
└─────────────────────────────────────┘
```

---

### Code Changes

**MedicareSupplementAppointment.tsx (lines 1295-1308):**

```tsx
// BEFORE
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

// AFTER
<div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-5 text-center">
  <div className="flex items-center justify-center gap-2 text-amber-800 mb-3">
    <Clock className="h-5 w-5" />
    <span className="font-semibold">Rate Reserved — 15 Minutes</span>
  </div>
  <div className="mb-3">
    <p className="text-3xl font-bold text-green-600">
      ${quoteResult.monthlySavings.toFixed(2)}/month
    </p>
    <p className="text-sm text-muted-foreground">in savings</p>
  </div>
  <p className="text-base text-foreground">
    Pick a time below to lock it in — quick 2-min call, no obligation.
  </p>
  <div className="mt-3 flex justify-center">
    <ChevronDown className="h-6 w-6 text-amber-600 animate-bounce" />
  </div>
</div>
```

---

### Key Improvements

1. **Shorter headline** - "Rate Reserved — 15 Minutes" is punchier than the full sentence
2. **Savings as hero** - Large, bold green number stands out as the key value
3. **"in savings" subtitle** - Adds context in subtle muted text
4. **Simplified action text** - One clear line telling them what to do
5. **Removed awkward `<br />`** - No more forced line breaks
6. **Better spacing** - `mb-3` creates breathing room between sections
7. **Smaller arrow** - `h-6 w-6` instead of `h-8 w-8` for subtler visual cue

