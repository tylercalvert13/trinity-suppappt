

# Auto-SMS Landing Page at `/text`

## What it does
When a user clicks a Facebook ad linking to `/text`, the page immediately attempts to open their phone's native SMS app with the number `201-298-8393` and the message `SUPP` pre-filled. No button press needed.

## How
1. **New page `src/pages/TextSUPP.tsx`** — On mount, uses `window.location.href = "sms:2012988393?body=SUPP"` to trigger the native SMS intent. Shows a brief fallback UI (headline + manual "Text us" link) for users whose browser blocks the auto-redirect or who are on desktop.

2. **Add route in `App.tsx`** — Lazy-load the new page at `/text`.

## Technical notes
- iOS uses `sms:2012988393&body=SUPP`, Android uses `sms:2012988393?body=SUPP`. We'll use the `?` format which works on modern iOS (iOS 8+) and Android.
- The fallback UI will have the phone number, "SUPP" instruction, and a clickable `sms:` link styled as a button, plus brief branding so it doesn't look like a blank page if the redirect is slow.
- Will track a `page_view` via `useFunnelAnalytics` so you can see how many people hit the page.

