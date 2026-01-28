

## Plan: Fix Exit-Intent Modal Mobile Positioning

### Problem
The exit-intent modal is being cut off at the top on mobile screens (as shown in the screenshot). The modal uses `top-[50%] translate-y-[-50%]` centering which can push content outside the viewport when the modal height is significant on smaller screens.

### Solution
Add mobile-specific positioning constraints to ensure the modal stays within the viewport:
1. Add `max-h-[90vh]` to limit modal height to 90% of viewport
2. Add `overflow-y-auto` for scrolling if content exceeds available space
3. Ensure proper margin from top/bottom edges on mobile

---

### File to Modify

| File | Changes |
|------|---------|
| `src/components/ExitIntentModal.tsx` | Add mobile-safe positioning classes |

---

### Code Changes

**ExitIntentModal.tsx (line 98):**

```tsx
// BEFORE
<DialogContent className="sm:max-w-md mx-4 rounded-2xl">

// AFTER
<DialogContent className="sm:max-w-md mx-4 rounded-2xl max-h-[85vh] overflow-y-auto top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] fixed">
```

However, since the Dialog component already handles positioning, we need a different approach. The real fix is to ensure the modal content itself is constrained and uses proper mobile viewport handling:

```tsx
// AFTER
<DialogContent className="sm:max-w-md w-[calc(100%-2rem)] mx-auto rounded-2xl max-h-[85vh] overflow-y-auto">
```

---

### Why This Works

1. **`max-h-[85vh]`** - Limits the modal to 85% of viewport height, leaving room for safe area insets
2. **`overflow-y-auto`** - Allows scrolling if content still exceeds the constrained height
3. **`w-[calc(100%-2rem)]`** - Consistent horizontal margins on mobile instead of just `mx-4`

---

### Visual Result

**Before (clipped at top):**
```text
 [Modal clipped]
┌────────────────┐
│    Content...  │
└────────────────┘
```

**After (fully visible):**
```text
┌────────────────┐
│   ⏰ Clock     │
│ Wait! Your... │
│  [Book Call]  │
└────────────────┘
```

