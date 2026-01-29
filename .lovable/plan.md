

## Plan: Add Bing UET Lead Form Conversion Tracking for `/suppappt`

Adding both the Enhanced Conversion PII data AND the conversion event to the `/suppappt` funnel, triggered at the same point as the Facebook submission event.

---

## Two-Part Implementation

Per Microsoft's setup:
1. **Push PII data** - `window.uetq.push('set', { pid: { em, ph } })` for enhanced matching
2. **Fire conversion event** - `window.uetq.push('event', 'submit_lead_form', {})` to register the conversion

---

## Implementation

### File: `src/pages/MedicareSupplementAppointment.tsx`

**1. Add TypeScript declaration for `window.uetq` (near top of file):**
```typescript
declare global {
  interface Window {
    uetq?: any[];
  }
}
```

**2. Add helper function to normalize email per Microsoft spec:**
```typescript
const normalizeEmailForBing = (email: string): string => {
  let normalized = email.trim().toLowerCase();
  normalized = normalized.replace(/\+[^@]*@/, '@');
  const [localPart, domain] = normalized.split('@');
  if (!domain) return normalized;
  const cleanLocal = localPart.replace(/\./g, '');
  return `${cleanLocal}@${domain}`;
};
```

**3. Add Bing UET tracking function with BOTH set and event calls:**
```typescript
const trackBingSubmissionEvent = (formData: FormData) => {
  try {
    if (typeof window === 'undefined' || !window.uetq) {
      console.log('Bing UET not loaded yet, skipping conversion');
      return;
    }
    
    // Normalize email per Microsoft spec
    const normalizedEmail = normalizeEmailForBing(formData.email);
    
    // Format phone to E.164 (add +1 for US)
    const phoneDigits = formData.phone.replace(/\D/g, '');
    const e164Phone = `+1${phoneDigits}`;
    
    // Step 1: Push enhanced conversion PII data
    window.uetq.push('set', { 
      'pid': { 
        'em': normalizedEmail,
        'ph': e164Phone,
      } 
    });
    
    // Step 2: Fire the conversion event
    window.uetq.push('event', 'submit_lead_form', {});
    
    console.log('Bing UET submit_lead_form conversion tracked');
  } catch (error) {
    console.error('Error tracking Bing conversion:', error);
  }
};
```

**4. Call Bing tracking alongside Facebook tracking (around line 577):**
```typescript
trackQualification("qualified");
await trackFacebookSubmissionEvent(formData, data);
trackBingSubmissionEvent(formData);  // <-- Add this line
setStep("qualified");
```

---

## Event Flow

```text
User submits contact form
         ↓
Quote API returns successfully
         ↓
┌────────────────────────────────────┐
│ 1. Push PII data (enhanced match)  │
│    em: normalized email            │
│    ph: E.164 phone                 │
├────────────────────────────────────┤
│ 2. Fire submit_lead_form event     │
└────────────────────────────────────┘
         ↓
Microsoft Ads registers conversion
with enhanced matching data
```

---

## Summary

| Component | Purpose |
|-----------|---------|
| `set` with `pid` | Sends hashed email + phone for better audience matching |
| `event` with `submit_lead_form` | Fires the actual conversion Microsoft Ads tracks |
| Trigger Point | Same as Facebook (after successful quote retrieval) |

