
## Plan: Fix Slow Quote API by Filtering Server-Side

I found the root cause of the 15+ second delays! The CSG API is doing 10-50x more work than necessary because we're fetching quotes from ALL carriers and filtering afterward.

---

## Root Cause

Looking at the API documentation you provided:

| What We Do Now | What We Should Do |
|----------------|-------------------|
| Fetch ALL 50+ carriers | Use `naic` parameter to filter at source |
| Return full quote objects | Use `field` parameter to return only needed fields |
| Filter 50+ quotes to 4 client-side | Get only 4 quotes from the start |

**Line 283 in the docs**: `naic (optional, string) ... (repeatable)` - This means we can pass multiple NAIC codes to filter directly in the API!

---

## Current vs Optimized Query

**Current (slow):**
```
/v1/med_supp/quotes.json?zip5=66062&age=65&gender=M&tobacco=0&plan=G&apply_discounts=0
```
Result: API searches entire carrier database, returns 50+ quotes, we filter to 4

**Optimized (fast):**
```
/v1/med_supp/quotes.json?zip5=66062&age=65&gender=M&tobacco=0&plan=G&apply_discounts=0
  &naic=60380&naic=65641&naic=79987&naic=31119
  &field=company_base.name&field=company_base.naic&field=company_base.ambest_rating
  &field=rate.month&field=view_type
```
Result: API only searches 4 specific carriers, returns only the data we need

---

## Technical Changes

### File: `supabase/functions/get-medicare-quote/index.ts`

**1. Add NAIC codes to query parameters:**
```typescript
// Build query parameters
const queryParams = new URLSearchParams();
queryParams.append('zip5', data.zipCode);
queryParams.append('age', data.age.toString());
queryParams.append('gender', data.gender === 'male' ? 'M' : 'F');
queryParams.append('tobacco', data.tobacco === 'yes' ? '1' : '0');
queryParams.append('plan', mapPlanToApi(data.plan));
queryParams.append('apply_discounts', data.spouse === 'yes' ? '1' : '0');

// NEW: Filter by preferred carriers at the API level (repeatable parameter)
for (const naic of PREFERRED_NAIC_CODES) {
  queryParams.append('naic', naic);
}

// NEW: Request only the fields we need
const neededFields = [
  'company_base.name',
  'company_base.naic', 
  'company_base.ambest_rating',
  'rate.month',
  'view_type'
];
for (const field of neededFields) {
  queryParams.append('field', field);
}
```

**2. Simplify the filter function:**

Since the API now only returns our preferred carriers, we only need to filter by household discount status:
```typescript
function filterQuotes(quotes: any[], hasSpouse: boolean): any[] {
  console.log(`Filtering ${quotes.length} quotes, hasSpouse: ${hasSpouse}`);
  
  return quotes.filter(quote => {
    // Household discount filtering based on view_type
    const viewType = quote.view_type || [];
    
    if (!hasSpouse && viewType.includes("with_hhd")) {
      return false;
    }
    
    if (hasSpouse && viewType.includes("sans_hhd")) {
      return false;
    }

    return true;
  });
}
```

---

## Expected Performance Impact

| Metric | Before | After |
|--------|--------|-------|
| Carriers queried | 50+ | 4 |
| Quotes returned | 50+ | 4-8 |
| Response payload | ~100KB | ~5KB |
| API response time | 5-15s | 0.5-2s |
| Total quote flow | 8-20s | 2-4s |

---

## Additional Safety: Add Timeout + Slow Loading UI

Even with optimizations, external APIs can still be slow occasionally. We should also add:

1. **30-second timeout** with `Promise.race()` - prevents infinite hangs
2. **"Taking longer than usual" message** after 15 seconds - keeps users informed
3. **Retry capability** if timeout occurs - doesn't lose the user

---

## Implementation Order

1. **Update query parameters** - Add `naic` and `field` filters to the CSG API call
2. **Simplify filter function** - Remove redundant carrier filtering  
3. **Add timeout wrapper** - Prevent infinite hangs
4. **Update loading UI** - Add slow loading feedback

This fix addresses the root cause (inefficient API query) rather than just treating symptoms (timeout handling).
