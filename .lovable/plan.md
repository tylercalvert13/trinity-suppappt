
## Add Google Ads Tag (gtag.js) to All Pages

Adding the Google Ads conversion tracking tag site-wide, following the same deferred loading pattern used for other tracking pixels to optimize page performance.

---

## Implementation

### File: `index.html`

**1. Add resource hints for faster connection** (in `<head>` section):
```html
<link rel="preconnect" href="https://www.googletagmanager.com" crossorigin />
<link rel="dns-prefetch" href="https://www.googletagmanager.com" />
```

**2. Add Google tag to the deferred tracking section** (inside the existing `window.addEventListener('load', ...)` block):
```javascript
// Google Ads (gtag.js) - deferred
(function() {
  var s = document.createElement('script');
  s.async = true;
  s.src = 'https://www.googletagmanager.com/gtag/js?id=AW-17916268698';
  document.head.appendChild(s);
  
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  window.gtag = gtag;
  gtag('js', new Date());
  gtag('config', 'AW-17916268698');
})();
```

---

## Why Deferred Loading?

The existing tracking pixels (Facebook, Taboola, Bing) are all loaded after the page's `load` event to prioritize initial render performance - especially important for mobile and Facebook in-app browsers. The Google tag will follow the same pattern for consistency.

---

## Summary

| Change | Location |
|--------|----------|
| Add preconnect/dns-prefetch for googletagmanager.com | `<head>` lines 12-13 |
| Add deferred gtag.js loader | Inside existing `window.addEventListener('load', ...)` block |

The tag will fire on every page load and track conversions with ID `AW-17916268698`.
