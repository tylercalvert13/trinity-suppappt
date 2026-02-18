

## Skip Webhook When No Savings

Update the `crm-quote-webhook` Edge Function so it only POSTs results back to GHL when the status is `"quoted"` (meaningful savings found). For `"no_quotes"` and `"no_savings"` outcomes, the function will still return a success response but will **not** send anything to your CRM.

### What Changes

**File:** `supabase/functions/crm-quote-webhook/index.ts`

- Remove the `postToWebhook()` calls from the three non-savings paths:
  1. Invalid/zero premium -- currently sends `"no_quotes"`, will now just return silently
  2. No quotes returned from API -- currently sends `"no_quotes"`, will now just return silently
  3. Savings below 5% -- currently sends `"no_savings"`, will now just return silently
- Keep the `postToWebhook()` call only for the `"quoted"` path (savings >= 5%)
- The function will still log these outcomes to the console for debugging

