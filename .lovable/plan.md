# Plan Complete ✅

## Goal
Restore quote retrieval in the **/suppappt** funnel while keeping TrustedForm installed.

---

## Changes Made

### 1. Fixed Edge Function Import (Phase 2) ✅
- **File**: `supabase/functions/get-medicare-quote/index.ts`
- Changed: `import { createClient } from "https://esm.sh/@supabase/supabase-js@2";`
- To: `import { createClient } from "npm:@supabase/supabase-js@2";`
- Updated CORS headers to include all modern client headers

### 2. Fixed TrustedForm Hidden Input (Phase 3) ✅
- **File**: `src/pages/MedicareSupplementAppointment.tsx` (line 1276-1280)
- Removed `value=""` to make the input uncontrolled
- Now TrustedForm script can populate the certificate URL

### 3. Added Quote Retry Logic (Phase 4) ✅
- **File**: `src/pages/MedicareSupplementAppointment.tsx` (lines 632-692)
- Added one automatic retry on transient failures (500, 502, 503, 504, timeout)
- Added analytics events for quote_retry and quote_error
- Improved error message: "We're having trouble retrieving rates right now..."

---

## Verification
- Edge function deployed successfully
- Warmup request returns status 200 with ~850ms response
- Function is now reachable (was returning 404 before)

---

## Next Steps
1. Publish the changes
2. Test the complete flow on `/suppappt`
3. Verify TrustedForm certificate populates
4. Check CRM/webhook logs for `trustedFormCertUrl`
