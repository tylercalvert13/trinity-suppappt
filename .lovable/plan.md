

## Plan: Differentiate Savings Display from Rate Display

### Problem
The savings amount in the amber urgency box uses the same styling (`text-3xl font-bold text-green-600`) as the rate displayed above it, making them look identical and causing confusion for users.

**Current styling comparison:**
- Rate: `text-3xl md:text-4xl font-bold text-green-600` → "$142.78/month"
- Savings: `text-3xl font-bold text-green-600` → "$142.78/month"

Users can't quickly distinguish which number is their rate vs. their savings.

### Solution
Make the savings visually distinct by:
1. **Smaller size** - Use `text-2xl` instead of `text-3xl` (rate stays larger)
2. **Different color** - Use `text-amber-700` to match the amber theme of the urgency box
3. **Keep bold** - Maintains emphasis while being clearly different

---

### Files to Modify

| File | Changes |
|------|---------|
| `src/pages/MedicareSupplementAppointment.tsx` | Update savings text styling (line 1302) |
| `src/pages/MedicareSupplementAppointment1.tsx` | Same update for consistency |

---

### Visual Comparison

**Before (confusing - both look the same):**
```text
┌─ White Card ─────────────────────────┐
│  You Qualify for Plan G at          │
│  $98.50/month  ← GREEN, 3xl, bold   │
└──────────────────────────────────────┘

┌─ Amber Box ──────────────────────────┐
│  ⏰ Rate Reserved — 15 Minutes      │
│  $142.78/month  ← GREEN, 3xl, bold  │  ← Looks the same!
│  in savings                          │
└──────────────────────────────────────┘
```

**After (clear differentiation):**
```text
┌─ White Card ─────────────────────────┐
│  You Qualify for Plan G at          │
│  $98.50/month  ← GREEN, 3xl, bold   │
└──────────────────────────────────────┘

┌─ Amber Box ──────────────────────────┐
│  ⏰ Rate Reserved — 15 Minutes      │
│  $142.78/month  ← AMBER, 2xl, bold  │  ← Clearly different!
│  in savings                          │
└──────────────────────────────────────┘
```

---

### Code Changes

**MedicareSupplementAppointment.tsx (line 1302):**

```tsx
// BEFORE
<p className="text-3xl font-bold text-green-600">
  ${quoteResult.monthlySavings.toFixed(2)}/month
</p>

// AFTER
<p className="text-2xl font-bold text-amber-700">
  ${quoteResult.monthlySavings.toFixed(2)}/month
</p>
```

**MedicareSupplementAppointment1.tsx (same change):**

```tsx
// BEFORE
<p className="text-3xl font-bold text-green-600">
  ${quoteResult.monthlySavings.toFixed(2)}/month
</p>

// AFTER
<p className="text-2xl font-bold text-amber-700">
  ${quoteResult.monthlySavings.toFixed(2)}/month
</p>
```

---

### Why This Works

1. **Size hierarchy** - Rate (`text-3xl/4xl`) is larger than savings (`text-2xl`), establishing clear visual priority
2. **Color context** - Amber savings color (`text-amber-700`) matches the amber box theme and looks distinct from the green rate
3. **Semantic meaning** - Green = your rate (positive outcome), Amber = urgency/action needed
4. **No confusion** - Users can instantly tell which number is which

