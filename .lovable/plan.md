

## Backfill Failed Facebook Conversion Events

### Overview
We have **25 submissions** from the last 6 hours (starting around 2026-02-05 19:00 UTC) where the Facebook Conversion API events failed to send because the `fb-conversion` edge function wasn't deployed.

The `submissions` table contains all the data needed to backfill:
- first_name, last_name, email, phone, zip_code
- monthly_savings (conversion value)
- visitor_id (external_id)
- created_at (original event time)

---

### Changes Required

#### 1. Update `supabase/functions/fb-conversion/index.ts`
Add support for a custom `event_time` parameter so we can send historical events with the correct timestamp.

**Add to interface:**
```typescript
interface ConversionRequest {
  // ... existing fields
  event_time?: number; // Optional Unix timestamp for historical events
}
```

**Update event payload:**
```typescript
const eventData: Record<string, any> = {
  event_name: event_name || "Lead",
  event_time: event_time || Math.floor(Date.now() / 1000), // Use provided time or current
  action_source: "website",
  // ...
};
```

#### 2. Create `supabase/functions/backfill-fb-events/index.ts`
A new edge function that:
1. Queries the `submissions` table for the missed events
2. Loops through each submission
3. Calls the Facebook Conversion API with the correct historical timestamp
4. Logs success/failure for each event

```text
+---------------------------+
|  backfill-fb-events       |
+---------------------------+
          |
          v
Query submissions table for
records between 2026-02-05 19:00 and now
          |
          v
For each submission:
  - Build FB event payload
  - Use created_at as event_time
  - Send to Facebook Conversion API
  - Log result
          |
          v
Return summary of backfilled events
```

---

### Technical Details

**Submissions to backfill query:**
```sql
SELECT id, visitor_id, first_name, last_name, email, phone, 
       zip_code, monthly_savings, page, created_at 
FROM submissions 
WHERE page IN ('suppappt', 'suppappt1', 'suppappt-refund') 
  AND submission_type = 'success' 
  AND created_at >= '2026-02-05 19:00:00+00'
ORDER BY created_at ASC;
```

**Event time conversion:**
```typescript
// Convert ISO timestamp to Unix timestamp (seconds)
const eventTime = Math.floor(new Date(submission.created_at).getTime() / 1000);
```

**Facebook API payload per event:**
```typescript
{
  event_name: "submission",
  event_time: eventTime, // Historical timestamp
  event_source_url: `https://healthhelpers.co/${submission.page}`,
  external_id: submission.visitor_id,
  first_name: submission.first_name,
  last_name: submission.last_name,
  email: submission.email,
  phone: submission.phone,
  zip_code: submission.zip_code,
  value: submission.monthly_savings,
  currency: "USD"
}
```

---

### Files to Modify/Create
1. **Edit**: `supabase/functions/fb-conversion/index.ts` - Add optional `event_time` parameter
2. **Create**: `supabase/functions/backfill-fb-events/index.ts` - New backfill function
3. **Edit**: `supabase/config.toml` - Add config for new function

---

### Execution Plan
1. Deploy the updated `fb-conversion` function with event_time support
2. Deploy the new `backfill-fb-events` function
3. Call `backfill-fb-events` once to send all 25 missed events to Facebook
4. Verify in Facebook Events Manager that the events were received

---

### Expected Result
- All 25 missed submissions will be sent to Facebook Conversion API
- Events will have correct historical timestamps (from `created_at`)
- Facebook will be able to match these conversions to the original ad clicks
- Your FB event count should align with your CRM after the backfill

