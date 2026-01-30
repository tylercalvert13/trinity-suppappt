

## Optimize Homepage SEO Metadata

The current `index.html` has outdated SEO metadata focused on "Medicare Self-Enrollment" which no longer matches the redesigned homepage. This plan updates all metadata to align with the new Medicare Supplement focus while preserving all existing tracking pixels and funnel page behavior.

---

## Current Problems

| Issue | Current Value | Problem |
|-------|---------------|---------|
| Title | "Medicare Self-Enrollment Online..." | Doesn't match new Medigap focus |
| Description | "Skip the phone calls..." | Focuses on self-enrollment, not rate savings |
| Keywords | "Medicare self enrollment..." | Wrong keyword targets |
| OG Image | Logo only (small PNG) | Not optimized for social sharing |
| OG URL | `healthhelpers.com` | Wrong domain (should be `.co`) |
| Canonical | Missing | No canonical tag for homepage |
| Sitemap | Missing | No sitemap.xml for SEO |

---

## Changes

### File: `index.html`

**1. Update Title (line 21)**
```
Current:  "Medicare Self-Enrollment Online | Health Helpers - Enroll Yourself Without Calls"
New:      "Medicare Supplement Insurance | Compare Plan G, F & N Rates | Health Helpers"
```

**2. Update Meta Description (line 22)**
```
Current:  "Skip the phone calls and meetings..."
New:      "Are you overpaying for Medicare Supplement coverage? Compare Plan G, F, and N rates from A+ rated carriers. Licensed agents help you find the same coverage at a lower price. Free rate comparison."
```

**3. Update Keywords (line 23)**
```
New: "Medicare Supplement insurance, Medigap Plan G, Medigap Plan F, Medigap Plan N, Medicare Supplement rates, compare Medigap plans, Medicare Supplement savings, Medigap insurance comparison"
```

**4. Update Open Graph Tags (lines 27-31)**
```html
<meta property="og:type" content="website" />
<meta property="og:url" content="https://healthhelpers.co/" />
<meta property="og:title" content="Are You Overpaying for Medicare Supplement Coverage? | Health Helpers" />
<meta property="og:description" content="Plan G, F, and N policyholders save $100-200/month by switching carriers. Same coverage, lower price. Free rate comparison from licensed agents." />
<meta property="og:image" content="https://healthhelpers.co/lovable-uploads/ca6f16cd-26c7-4533-8061-a6c96ccb0eeb.png" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta property="og:site_name" content="Health Helpers" />
<meta property="og:locale" content="en_US" />
```

**5. Update Twitter Tags (lines 34-38)**
```html
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:site" content="@healthhelpers" />
<meta name="twitter:title" content="Are You Overpaying for Medicare Supplement Coverage?" />
<meta name="twitter:description" content="Plan G, F, and N policyholders save $100-200/month by switching carriers. Same coverage, lower price." />
<meta name="twitter:image" content="https://healthhelpers.co/lovable-uploads/ca6f16cd-26c7-4533-8061-a6c96ccb0eeb.png" />
```

**6. Add Canonical Link (after line 24)**
```html
<link rel="canonical" href="https://healthhelpers.co/" />
```

**7. Add Additional SEO Tags (after author)**
```html
<meta name="robots" content="index, follow, max-image-preview:large" />
<meta name="googlebot" content="index, follow" />
<meta name="theme-color" content="#1e40af" />
```

---

### File: `public/robots.txt`

**Add sitemap reference:**
```
User-agent: Googlebot
Allow: /

User-agent: Bingbot
Allow: /

User-agent: Twitterbot
Allow: /

User-agent: facebookexternalhit
Allow: /

User-agent: *
Allow: /

Sitemap: https://healthhelpers.co/sitemap.xml
```

---

### New File: `public/sitemap.xml`

Create a sitemap with only the pages that should be indexed (NOT the funnel pages):

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://healthhelpers.co/</loc>
    <lastmod>2025-01-30</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://healthhelpers.co/privacy-policy</loc>
    <lastmod>2025-01-30</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.3</priority>
  </url>
  <url>
    <loc>https://healthhelpers.co/terms-of-service</loc>
    <lastmod>2025-01-30</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.3</priority>
  </url>
  <url>
    <loc>https://healthhelpers.co/medicare-enrollment-guide</loc>
    <lastmod>2025-01-30</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>
  <url>
    <loc>https://healthhelpers.co/how-to-enroll-in-medicare-online</loc>
    <lastmod>2025-01-30</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>
  <url>
    <loc>https://healthhelpers.co/medicare-enrollment-periods</loc>
    <lastmod>2025-01-30</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>
  <url>
    <loc>https://healthhelpers.co/enroll-medicare-yourself</loc>
    <lastmod>2025-01-30</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>
</urlset>
```

**Note:** Funnel pages (`/supp`, `/supp1`, `/suppappt`, `/suppappt1`, `/suppquote`, `/disqualified`, `/great-rate`, `/analytics`, `/booking`, `/contactcard`) are intentionally excluded since they have `noindex` set.

---

## OG Image Recommendation

The current OG image is just the logo (`ca6f16cd-26c7-4533-8061-a6c96ccb0eeb.png`). For optimal social sharing, an OG image should be:
- **1200x630 pixels** (Facebook/LinkedIn recommended)
- **Compelling headline text** visible in the image
- **Brand colors and logo** included

**Current approach:** Use the existing logo with absolute URL. A dedicated OG image can be created later and uploaded to `public/lovable-uploads/`.

---

## What This Does NOT Touch

| File/Feature | Status |
|--------------|--------|
| All funnel pages (`/supp*`, etc.) | Unchanged - they manage their own SEO |
| Tracking pixels in index.html | Unchanged - all preserved |
| Facebook domain verification | Unchanged |
| Preconnect hints | Unchanged |

---

## Summary

| File | Change |
|------|--------|
| `index.html` | Update title, description, keywords, OG tags, Twitter tags, add canonical + robots |
| `public/robots.txt` | Add sitemap reference |
| `public/sitemap.xml` | New file with indexable pages only |

