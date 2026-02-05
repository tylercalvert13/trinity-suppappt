
# Implement TrustedForm on /suppappt Funnel

## Overview
TrustedForm provides independent proof of consent for lead submissions. The script generates a unique certificate URL that captures the user's session and form submission, which is then passed to your CRM (GHL) as proof of consent.

## How TrustedForm Works

1. **Script Loading**: The TrustedForm script runs on the page and tracks user interaction
2. **Certificate Generation**: As the user interacts with the form, TrustedForm generates a unique certificate URL
3. **Hidden Field Injection**: The script automatically injects the certificate URL into a hidden input field named `xxTrustedFormCertUrl`
4. **Lead Submission**: When the form is submitted, you capture that URL and pass it along with the lead data

---

## Implementation Steps

### Step 1: Load TrustedForm Script on Component Mount

Add a `useEffect` hook in `MedicareSupplementAppointment.tsx` that dynamically injects the TrustedForm script when the page loads.

**File:** `src/pages/MedicareSupplementAppointment.tsx`

```typescript
// Add useEffect to load TrustedForm script
useEffect(() => {
  // Only load once
  if (document.getElementById('trustedform-script')) return;
  
  const tf = document.createElement('script');
  tf.type = 'text/javascript';
  tf.async = true;
  tf.id = 'trustedform-script';
  tf.src = 'https://api.trustedform.com/trustedform.js?field=xxTrustedFormCertUrl&use_tagged_consent=true&l=' +
    new Date().getTime() + Math.random();
  
  const s = document.getElementsByTagName('script')[0];
  s.parentNode?.insertBefore(tf, s);
  
  // Cleanup on unmount
  return () => {
    const script = document.getElementById('trustedform-script');
    if (script) script.remove();
  };
}, []);
```

### Step 2: Add Hidden Input Field to Contact Form

Add a hidden input inside the contact form that TrustedForm will populate with the certificate URL.

**File:** `src/pages/MedicareSupplementAppointment.tsx` (inside the contact form)

```tsx
<form onSubmit={handleContactSubmit} className="space-y-4">
  {/* TrustedForm hidden field - certificate URL will be injected here */}
  <input 
    type="hidden" 
    name="xxTrustedFormCertUrl" 
    id="xxTrustedFormCertUrl" 
    value="" 
  />
  
  {/* ... rest of form fields ... */}
</form>
```

### Step 3: Capture Certificate URL on Form Submission

Update `handleContactSubmit` to read the TrustedForm certificate URL from the hidden field before sending to the webhook.

**File:** `src/pages/MedicareSupplementAppointment.tsx`

```typescript
const handleContactSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  
  // Capture TrustedForm certificate URL
  const trustedFormCertUrl = 
    (document.getElementById('xxTrustedFormCertUrl') as HTMLInputElement)?.value || null;
  
  // ... rest of validation and submission logic ...
  
  // Include in webhook payload
  await supabase.functions.invoke('send-lead-webhook-suppappt', {
    body: {
      ...formData,
      trustedFormCertUrl, // Add certificate URL
      // ... other fields
    }
  });
};
```

### Step 4: Update Edge Function to Pass Certificate URL to GHL

Add `trustedFormCertUrl` to the webhook payload sent to GoHighLevel.

**File:** `supabase/functions/send-lead-webhook-suppappt/index.ts`

```typescript
const payload = {
  // ... existing fields ...
  
  // TrustedForm certificate for consent verification
  trustedFormCertUrl: data.trustedFormCertUrl || null,
  
  // ... rest of payload
};
```

### Step 5: Add Noscript Fallback (Optional but Recommended)

For users with JavaScript disabled, add a noscript image tag. This can be added alongside the hidden field in the form.

```tsx
{/* Noscript fallback for TrustedForm */}
<noscript>
  <img src="https://api.trustedform.com/ns.gif" height="1" width="1" style={{ display: 'none' }} />
</noscript>
```

---

## Summary of Changes

| File | Change |
|------|--------|
| `src/pages/MedicareSupplementAppointment.tsx` | Add TrustedForm script loader, hidden input field, and capture cert URL on submit |
| `supabase/functions/send-lead-webhook-suppappt/index.ts` | Pass `trustedFormCertUrl` to GHL webhook payload |

---

## Technical Details

### Why Dynamic Script Loading?
Since this is a React SPA, we load the script dynamically via `useEffect` rather than adding it to `index.html`. This:
- Only loads the script on the /suppappt page (not site-wide)
- Properly cleans up when navigating away
- Follows React patterns for third-party script integration

### TrustedForm Script Parameters
- `field=xxTrustedFormCertUrl` - The hidden field name where the cert URL will be injected
- `use_tagged_consent=true` - Enables tagged consent tracking for TCPA compliance
- Timestamp + random suffix prevents caching issues

### Verification
After implementation, you can verify TrustedForm is working by:
1. Opening browser DevTools → Elements
2. Searching for `xxTrustedFormCertUrl` in the DOM
3. The hidden field should contain a URL like `https://cert.trustedform.com/...`
