

# Add Google Tag Manager (GTM-NMJSPM99) Site-Wide

## What
Install Google Tag Manager across all pages using the container ID `GTM-NMJSPM99` from your screenshot.

## How
**Edit `index.html`** — two additions:

1. **In `<head>`** (as high as possible): Add the GTM script snippet right after `<meta charset="UTF-8" />`.
2. **After opening `<body>`**: Add the GTM `<noscript>` iframe fallback right before the `<div id="root">`.

Both snippets come directly from your screenshot. Since GTM loads on every page via `index.html`, it will automatically cover all routes in the SPA. The existing Google Ads gtag.js script in the deferred block can stay — GTM and gtag.js can coexist, though you may eventually want to migrate the gtag config into GTM itself.

