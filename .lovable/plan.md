

## Add Vibe.co TV Ads Pixel and Lead Conversion

Adding Vibe.co tracking for TV ad attribution. This follows the same pattern as existing tracking pixels (Facebook, Google, Bing, Taboola).

---

## Implementation

### Part 1: Base Pixel (Site-wide)

**File: `index.html`**

Add the Vibe.co pixel to the deferred loading section alongside other tracking pixels:

```javascript
// Vibe.co TV Pixel - deferred
!function(v,i,b,e,c,o){if(!v[c]){var s=v[c]=function(){s.process?s.process.apply(s,arguments):s.queue.push(arguments)};s.queue=[],s.b=1*new Date;var t=i.createElement(b);t.async=!0,t.src=e;var n=i.getElementsByTagName(b)[0];n.parentNode.insertBefore(t,n)}}(window,document,"script","https://s.vibe.co/vbpx.js","vbpx");
vbpx('init','FW7mXo');
vbpx('event', 'page_view');
```

Also add resource hints for faster connection:
```html
<link rel="preconnect" href="https://s.vibe.co" crossorigin />
<link rel="dns-prefetch" href="https://s.vibe.co" />
```

---

### Part 2: Lead Conversion Event

**File: `src/pages/MedicareSupplementAppointment.tsx`**

**1. Add TypeScript declaration** (line 23-28):
```typescript
declare global {
  interface Window {
    uetq?: any[];
    gtag?: (...args: any[]) => void;
    vbpx?: (...args: any[]) => void;  // Add Vibe.co
  }
}
```

**2. Create tracking function** (after Google Ads function, around line 259):
```typescript
// Track lead submission via Vibe.co TV Ads
const trackVibeCoLeadEvent = () => {
  try {
    if (typeof window === 'undefined' || !window.vbpx) {
      console.log('Vibe.co pixel not loaded yet, skipping lead event');
      return;
    }
    
    window.vbpx('event', 'lead');
    
    console.log('Vibe.co lead event tracked (suppappt)');
  } catch (error) {
    console.error('Error tracking Vibe.co lead event:', error);
  }
};
```

**3. Call on quote success** (line 650, after Google Ads):
```typescript
// Track qualification and conversions
trackQualification("qualified");
await trackFacebookSubmissionEvent(formData, data);
trackBingSubmissionEvent(formData);
trackGoogleAdsConversion();
trackVibeCoLeadEvent();  // Add this line

setStep("qualified");
```

---

## How Attribution Works

Just like the other pixels, Vibe.co will automatically attribute the lead only when the user came from a Vibe TV ad:

| User Source | Vibe.co Behavior |
|-------------|------------------|
| Vibe TV ad → /suppappt | Lead attributed to Vibe |
| Facebook ad → /suppappt | Lead event fires but NOT attributed |
| Google ad → /suppappt | Lead event fires but NOT attributed |

The Vibe pixel tracks its own click/view data, so it knows when to claim attribution.

---

## Summary

| Change | File |
|--------|------|
| Add resource hints for s.vibe.co | index.html (lines 5-16) |
| Add Vibe.co pixel initialization | index.html (lines 47-107) |
| Add `vbpx` to Window interface | MedicareSupplementAppointment.tsx |
| Create `trackVibeCoLeadEvent` function | MedicareSupplementAppointment.tsx |
| Call on quote success | MedicareSupplementAppointment.tsx (line 650) |

