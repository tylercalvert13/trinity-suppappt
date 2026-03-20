

# GEO Audit Fixes — Safe Changes (No Funnel Impact)

## What we CAN fix in code (won't touch the funnel)

The audit flagged many issues. Some require external work (YouTube, Reddit, BBB listings, SSR migration). Here's what we can fix right now without touching any lead funnel logic:

### 1. Create `public/llms.txt`
New file that tells AI crawlers what the site is about and lists key pages. Zero impact on users — only AI bots read this.

### 2. Update `public/robots.txt` with AI crawler directives
Add explicit `User-agent` entries for GPTBot, ClaudeBot, PerplexityBot, ChatGPT-User, Google-Extended, and Bingbot crawlers.

### 3. Populate `sameAs` array in Organization schema (`index.html`)
Fill in the empty `"sameAs": []` with any existing social profiles (LinkedIn, Facebook, etc.). I'll add placeholder URLs you can swap with real ones. Also add `ContactPoint` and physical address fields to the schema.

### 4. Add `speakable` property to FAQPage schema (`index.html`)
Helps voice assistants and AI models identify which FAQ answers to read aloud.

### 5. Add Article schema to blog pages
Add JSON-LD `Article` schema with `datePublished`, `dateModified`, and author info to the 4 blog pages (Plan G vs F vs N, Cheapest Plan G Rates, Why Rates Increase, Switch Medigap Plans).

### 6. Add visible "Last Updated" dates to blog pages
Show "Last Updated: March 2026" on each article page for freshness signals.

### 7. Add `BreadcrumbList` schema to blog pages
Structured breadcrumb data (Home > Medicare Supplement Plans > [Article Title]).

### 8. Link Privacy Policy and Terms of Service in Organization schema
Add `"url"` references so AI models can find compliance pages. (These pages already exist.)

### 9. Update `public/sitemap.xml`
Add the privacy policy and terms of service URLs, update `lastmod` dates to current.

## What we CANNOT fix in Lovable (needs external work)
- **SSR/prerendering** — Vite SPA architecture, would need Next.js migration or a prerendering service (biggest impact item, but major architectural change)
- **CSP / X-Frame-Options headers** — These are server/CDN-level configs, not controllable from app code
- **Social profiles** — You need to actually create LinkedIn, Facebook, Google Business profiles
- **Wikipedia, BBB, Trustpilot, Reddit** — External platform work
- **YouTube channel** — Content creation
- **IndexNow** — Needs server-side API key hosting

## Files changed
- `public/llms.txt` (new)
- `public/robots.txt` (updated)
- `public/sitemap.xml` (updated)
- `index.html` (schema updates)
- `src/pages/PlanGvsFvsN.tsx` (Article schema + date)
- `src/pages/CheapestPlanGRates.tsx` (Article schema + date)
- `src/pages/WhyMedigapRatesIncrease.tsx` (Article schema + date)
- `src/pages/SwitchMedigapPlans.tsx` (Article schema + date)

No funnel pages touched. No webhook, tracking, or lead logic changed.

