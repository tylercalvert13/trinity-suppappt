

## Implement TikTok Events API (Server-Side) for /suppappt Funnel

Create a backend function that sends conversion events directly to TikTok's Events API, mirroring the existing Facebook CAPI (`fb-conversion`) pattern. This provides server-side deduplication with the browser pixel events already implemented.

### Overview

The TikTok Events API sends events server-to-server via `POST https://business-api.tiktok.com/open_api/v1.3/event/track/` with an `Access-Token` header. We will create a new edge function and call it from the funnel page alongside the existing Facebook CAPI calls.

### Step 1: Store the TikTok Access Token

You will be prompted to enter your TikTok Events API Access Token as a secret (named `TIKTOK_ACCESS_TOKEN`). This is generated in TikTok Ads Manager under Assets > Events > Manage > Settings.

### Step 2: Create `supabase/functions/tiktok-conversion/index.ts`

A new edge function modeled on `fb-conversion` that:
- Accepts event data (event name, PII, value, content info, event_id, ttclid, ttp)
- Hashes PII server-side (email, phone, external_id) using SHA-256
- Captures IP address and user agent from request headers
- Sends to `https://business-api.tiktok.com/open_api/v1.3/event/track/` with the structure:

```text
POST /open_api/v1.3/event/track/
Header: Access-Token: <token>
Body:
{
  "event_source": "web",
  "event_source_id": "D6ATAMJC77U6DR98LSLG",
  "data": [{
    "event": "Lead",
    "event_id": "<for dedup with browser pixel>",
    "timestamp": "<ISO 8601>",
    "context": {
      "user_agent": "<from header>",
      "ip": "<from header>",
      "page": { "url": "<event_source_url>" },
      "user": {
        "email": "<sha256 hashed>",
        "phone_number": "<sha256 hashed>",
        "external_id": "<sha256 hashed>",
        "ttclid": "<if available>",
        "ttp": "<if available>"
      }
    },
    "properties": {
      "contents": [{ "content_id": "suppappt", "content_type": "product", "content_name": "..." }],
      "value": <number>,
      "currency": "USD"
    }
  }]
}
```

### Step 3: Register function in `supabase/config.toml`

Add:
```
[functions.tiktok-conversion]
verify_jwt = false
```

### Step 4: Create TikTok cookie helper in the funnel page

Add a `getTikTokCookies()` function (similar to `getFacebookCookies()`) to read `ttclid` from URL params and `_ttp` from cookies, and pass them to the edge function for improved match quality.

### Step 5: Add server-side tracking calls in `MedicareSupplementAppointment.tsx`

Create two new helper functions that call the edge function:

**`trackTikTokLeadEventServer`** -- called at line ~925 alongside `trackTikTokLeadEvent`:
- Sends `Lead` event with hashed PII, event_id for dedup, IP/UA (captured server-side), ttclid/ttp, and conversion value

**`trackTikTokScheduleEventServer`** -- called at line ~1783 alongside `trackTikTokScheduleEvent`:
- Sends `Schedule` event with the same data structure

Both use `event_id` for deduplication with the corresponding browser-side pixel events.

### Event Summary

| Moment | Browser Pixel (already done) | Events API (new) |
|---|---|---|
| Quote received | `ttq.track('Lead')` | `tiktok-conversion` edge function with `event: 'Lead'` |
| Appointment booked | `ttq.track('Schedule')` | `tiktok-conversion` edge function with `event: 'Schedule'` |

ClickButton is not sent server-side since there is no PII at that stage -- the browser pixel handles it.

### Files Changed

- **New**: `supabase/functions/tiktok-conversion/index.ts`
- **Edit**: `supabase/config.toml` (add function config)
- **Edit**: `src/pages/MedicareSupplementAppointment.tsx` (add server-side tracking calls + cookie helper)

