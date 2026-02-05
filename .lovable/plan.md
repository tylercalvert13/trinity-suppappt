
## Goal
Restore quote retrieval in the **/suppappt** funnel while keeping TrustedForm installed, and make the integration more robust so this doesn’t regress again.

---

## What changed (and what likely didn’t)
From the diff you shared, the only changes were:
1) Loading the TrustedForm script on `/suppappt`
2) Adding a hidden input + noscript pixel
3) Reading that hidden input during **lead submission**
4) Passing `trustedFormCertUrl` to the lead webhook function

None of that should directly affect the **quote request** because quotes are requested *before* the lead webhook is called. So the most likely scenario is:
- The quote “backend function” is failing/undeployed in the published environment, or
- The quote call is failing due to a runtime/CORS/bundling issue that was already present and surfaced again.

That said, there is one real bug in the TrustedForm snippet we should fix anyway (details below).

---

## Phase 1 — Confirm the exact failure mode (fast, diagnostic)
1) Reproduce on the published site:
   - Go to `/suppappt`, complete the funnel, submit contact step.
   - Capture:
     - Browser console error(s)
     - Network request to the quote function (status code + response body)

2) Add improved client-side logging (temporary or keep behind a debug flag):
   - When `supabase.functions.invoke('get-medicare-quote')` returns `quoteError`, log:
     - `quoteError.message`
     - `quoteError.context?.status` (if present)
     - Any `details` / response body if available

3) Check backend logs for the quote function:
   - If there are **no logs**, it often means the function isn’t being reached (404 / not deployed / routing issue).
   - If there **are logs**, find whether it’s:
     - 401/403
     - 500 internal error
     - Timeout / upstream CSG API error

**Decision point**
- If the quote call returns **404** → deployment/bundling issue.
- If it returns **CORS/preflight error** → CORS header allowlist issue.
- If it returns **500** → runtime error inside the function (CSG auth/token table/etc).

---

## Phase 2 — Fix the most common root cause: quote function deployment/bundling reliability
The quote function currently imports Supabase client via:
- `https://esm.sh/@supabase/supabase-js@2`

This is a known source of intermittent bundling/deploy timeouts. The stabilization steps:

1) Update the quote function import to use Deno’s `npm:` specifier:
   - Change:
     - `import { createClient } from "https://esm.sh/@supabase/supabase-js@2";`
   - To:
     - `import { createClient } from "npm:@supabase/supabase-js@2";`

2) (Optional but recommended) Update CORS headers to the fuller allowlist used by modern clients:
   - Expand `Access-Control-Allow-Headers` to include the common client runtime headers so preflight can’t fail unexpectedly.

3) Redeploy the quote function and verify it responds in production.

---

## Phase 3 — Fix the TrustedForm hidden field so it can actually populate (important)
Right now the hidden input is rendered as:
```tsx
<input type="hidden" id="xxTrustedFormCertUrl" name="xxTrustedFormCertUrl" value="" />
```

In React, providing `value=""` makes it a controlled field whose value is forced by React. That can prevent third-party scripts (TrustedForm) from reliably setting the value.

Change it to an uncontrolled field:
- Remove `value=""` entirely, or replace with `defaultValue=""`.

This won’t fix quote retrieval, but it is required for TrustedForm to work correctly.

---

## Phase 4 — Make /suppappt more resilient to temporary quote failures
Once quotes are working again, harden the user experience:

1) Add one safe retry for quote retrieval on transient failures:
   - Retry once if status is 500/502/503/504 or if the error message indicates a transient network error.

2) Improve user-facing messaging:
   - If quote fails, show:
     - “We’re having trouble retrieving rates right now. Please try again in a moment or call.”
   - Keep the funnel state consistent (avoid losing form inputs).

3) Add lightweight monitoring breadcrumbs:
   - Log an analytics event for quote failure with:
     - status code (if present)
     - funnel step
     - zip/age/plan (non-sensitive)

---

## Phase 5 — End-to-end verification checklist (must-do)
1) On the published site:
   - Complete `/suppappt` with a valid input set.
   - Confirm the quote returns and “qualified” state is reached.

2) Confirm TrustedForm is populated:
   - Inspect DOM for `#xxTrustedFormCertUrl`
   - Ensure it contains a `cert.trustedform.com/...` style URL (or TrustedForm’s cert URL format)

3) Confirm lead payload contains `trustedFormCertUrl`:
   - Verify in your CRM/webhook logs that the field arrives.

4) Repeat on mobile viewport (Safari iOS if possible).

---

## Minimal file touch list (expected)
- `supabase/functions/get-medicare-quote/index.ts`
  - Switch `esm.sh` import → `npm:`
  - (Optionally) improve CORS allowlist
  - Keep existing logic intact
- `src/pages/MedicareSupplementAppointment.tsx`
  - Change TrustedForm hidden input to uncontrolled (`defaultValue` or no value prop)
  - (Optional) add better error logging around quoteError

---

## Rollback strategy (if needed)
If something goes sideways, we can temporarily:
- Remove the TrustedForm script injection (but keep the hidden field), restore quote flow, then re-add TrustedForm using the corrected uncontrolled hidden field approach.

---

## Why this plan is the fastest path
- It addresses the highest-probability production blocker (quote function deploy/bundle instability).
- It fixes a real TrustedForm correctness issue (React-controlled hidden input).
- It adds observability so if the issue recurs, we’ll know exactly whether it’s 404 vs CORS vs 500 vs timeout.
