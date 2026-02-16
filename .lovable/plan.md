

## Improve Sunfire Iframe Load Speed

### Problem
The Sunfire Matrix enrollment tool (`sunfirematrix.com`) iframe only starts loading when the user reaches the final "enroll" step, causing a noticeable delay while the external app bootstraps.

### Solution: Multi-Layer Preloading

**1. DNS Prefetch + Preconnect in `index.html`**
Add `<link rel="dns-prefetch">` and `<link rel="preconnect">` tags for `www.sunfirematrix.com` so the browser resolves DNS and establishes the TLS connection early -- even before the user lands on `/advantage`.

**2. Hidden Iframe Preload During Video/Confirm Steps**
Once the user passes the Medicare card question (step 2), they still have 2 steps left (video + checklist). During those steps, render the Sunfire iframe off-screen (`position: absolute; left: -9999px; width: 1px; height: 1px`) so the browser silently loads the full app in the background. When the user reaches the enroll step, swap it to visible -- it will already be loaded and interactive.

**3. Loading Skeleton on Enroll Step**
Add a skeleton/spinner overlay on the iframe container that fades out once the iframe fires its `onLoad` event, so even if there's residual load time, the user sees a polished loading state instead of a blank white box.

### Technical Changes

**`index.html`** -- Add 2 link tags in `<head>`:
- `<link rel="dns-prefetch" href="https://www.sunfirematrix.com" />`
- `<link rel="preconnect" href="https://www.sunfirematrix.com" crossorigin />`

**`src/pages/MedicareAdvantage.tsx`**:
- Add a `preloadIframe` boolean state that turns `true` when the user reaches the "video" step
- Render a hidden iframe (off-screen, 1x1px) when `preloadIframe` is true and step is not yet "enroll"
- On the enroll step, show the same iframe (now cached by the browser) at full size
- Add an `iframeLoaded` state toggled by the iframe's `onLoad` event
- Show a spinner/skeleton overlay until `iframeLoaded` is true

### Expected Impact
- DNS + TLS handshake saved: ~200-500ms
- Full app preload during video/confirm steps: the Sunfire app has 30-60+ seconds to load while the user watches the video and checks boxes, so it should be fully ready by the time they click "Proceed to Self-Enrollment"

