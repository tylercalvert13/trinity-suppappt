

## Add TikTok Pixel Site-Wide

Add the TikTok pixel (ID: `D6ATAMJC77U6DR98LSLG`) to `index.html` using the same deferred loading strategy as the existing Facebook, Taboola, Bing, Google, and Vibe.co pixels.

### Changes

**`index.html`**
- Add a `<link rel="preconnect">` and `<link rel="dns-prefetch">` for `analytics.tiktok.com` alongside the existing resource hints
- Add the TikTok pixel initialization inside the existing `window.addEventListener('load', ...)` block, after the Vibe.co pixel code
- This keeps all tracking scripts deferred so they don't slow down initial page load

### Technical Detail

The pixel code will be wrapped inside the existing `load` event listener to match the deferred pattern. The `ttq.page()` call fires automatically on load, and since TikTok's SDK handles SPA page tracking via its own methods, no additional router integration is needed for page views.

