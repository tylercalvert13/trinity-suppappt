

## Plan: Simplify Success Header & Highlight Rate on Results Page

### Summary
Remove the redundant "LESS than what you're paying now" line and make the rate more prominent, especially on mobile. The amber CTA box stays unchanged.

---

### Changes

**Success Header Box - Before:**
```text
┌─────────────────────────────────────────────┐
│         ✓ Great News, John!                 │
│   You Qualify for Plan G at $89.50/month    │  ← Rate shown here
│   That's $151.63 LESS than what you're      │  ← REMOVE this line
│   paying now!                               │
└─────────────────────────────────────────────┘
```

**Success Header Box - After:**
```text
┌─────────────────────────────────────────────┐
│         ✓ Great News, John!                 │
│       You Qualify for Plan G at             │
│            $89.50/month                     │  ← Larger, bolder rate
└─────────────────────────────────────────────┘
```

---

### Technical Details

**Files to Modify:**
| File | Changes |
|------|---------|
| `src/pages/MedicareSupplementAppointment.tsx` | Update success header (lines 1234-1242) |
| `src/pages/MedicareSupplementAppointment1.tsx` | Same changes to success header |

**Code Changes:**

```jsx
// BEFORE (lines 1234-1242)
<h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
  Great News, {formData.firstName}!
</h1>
<p className="text-xl md:text-2xl font-semibold text-green-600 mb-2">
  You Qualify for {formData.plan} at ${quoteResult.rate.toFixed(2)}/month
</p>
<p className="text-lg text-foreground font-medium">
  That's <span className="text-green-600 font-bold">${quoteResult.monthlySavings.toFixed(2)} LESS</span> than what you're paying now!
</p>

// AFTER
<h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
  Great News, {formData.firstName}!
</h1>
<p className="text-lg md:text-xl text-foreground mb-1">
  You Qualify for {formData.plan} at
</p>
<p className="text-3xl md:text-4xl font-bold text-green-600">
  ${quoteResult.rate.toFixed(2)}/month
</p>
```

---

### Why This Works

1. **Removes redundancy** - The savings amount is still mentioned in the amber CTA box below
2. **Rate is hero element** - The rate now stands alone on its own line with larger text (3xl on mobile, 4xl on desktop)
3. **Mobile-first** - The rate is now impossible to miss even on small screens
4. **Cleaner visual hierarchy** - Greeting → Plan qualification → Bold rate → CTA box

---

### What Stays the Same

The amber CTA box remains completely unchanged:
- "Your rate is reserved for the next 15 minutes"
- "To lock in your $X/month savings, pick a time below..."
- Bouncing down arrow

