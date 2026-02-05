
# Fix: TrustedForm Certificate URL Coming Through as Null

## Problem Identified
The TrustedForm certificate URL is `null` because the hidden input element is only rendered when the user reaches the "contact" step, but the TrustedForm script is loaded on component mount and immediately looks for the hidden field to inject the certificate URL.

When the script loads:
1. User is on step 1 (plan selection)
2. The hidden input `#xxTrustedFormCertUrl` doesn't exist in the DOM yet
3. TrustedForm script can't find it, so it never injects the certificate URL
4. By the time the contact form renders, it's too late

---

## Solution

### Move the Hidden Input Outside of Conditional Rendering

The TrustedForm hidden input must be present in the DOM from the moment the component mounts, **not** only when the contact form step is displayed.

**Current (broken):**
```tsx
{step === "contact" && (
  <form>
    <input type="hidden" id="xxTrustedFormCertUrl" />  {/* Only exists on contact step */}
    ...
  </form>
)}
```

**Fixed:**
```tsx
{/* TrustedForm hidden field - must be present from page load */}
<input type="hidden" name="xxTrustedFormCertUrl" id="xxTrustedFormCertUrl" />

{step === "contact" && (
  <form>
    {/* Form fields without the hidden input */}
    ...
  </form>
)}
```

### File Changes

| File | Change |
|------|--------|
| `src/pages/MedicareSupplementAppointment.tsx` | Move hidden input from inside the contact form to the component's root level (outside any conditional step rendering) |

---

## Technical Details

### Why This Fixes It
- TrustedForm script looks for `#xxTrustedFormCertUrl` immediately after loading
- By having it in the DOM from component mount, the script can find and populate it
- When we later read the value on form submission, it will contain the certificate URL

### Where to Place the Hidden Input
Place it at the top level of the component's JSX return, before any step-conditional content. For example, right after the opening container `div`:

```tsx
return (
  <div className="...">
    {/* TrustedForm hidden field - always present */}
    <input type="hidden" name="xxTrustedFormCertUrl" id="xxTrustedFormCertUrl" />
    <noscript>
      <img src="https://api.trustedform.com/ns.gif" ... />
    </noscript>
    
    {/* Rest of component with step-based rendering */}
    ...
  </div>
);
```

### Verification Steps
After the fix:
1. Load `/suppappt` in the browser
2. Open DevTools → Elements
3. Search for `xxTrustedFormCertUrl`
4. Verify it has a value like `https://cert.trustedform.com/...`
5. Complete the funnel and check CRM logs for the certificate URL

---

## Implementation Summary
This is a single-line move in the component. The hidden input and noscript tag need to be relocated from inside `{step === "contact" && ...}` to the root level of the component's return statement.
