

# SEO Improvements

## Current State (some audit findings are already addressed)
- **H1 tag**: Already exists in Hero.tsx — "Are You Overpaying for Medicare Supplement Insurance?"
- **JSON-LD**: Already has InsuranceAgency + FAQPage schemas in index.html
- **Meta description**: Already solid with keyword + value prop

## What actually needs improvement

### 1. Optimize title tag for primary keyword positioning
Current: `Am I Overpaying for Medicare Supplement? | Compare Plan G, F & N Rates | Health Helpers`
Better: `Compare Medicare Supplement Insurance Rates – Plan G, F & N | Health Helpers` (keyword-first)

Update in `index.html` title + OG/Twitter title tags.

### 2. Add blog article links to Footer
The footer currently links Plan G/F/N to `#services`. Replace with actual article pages:
- `/plan-g-vs-f-vs-n` — Plan G vs F vs N
- `/cheapest-plan-g-rates` — Cheapest Plan G Rates
- `/why-medigap-rates-increase` — Why Rates Increase
- `/switch-medigap-plans` — How to Switch Plans

### 3. Add cross-links in blog articles
Each of the 4 blog pages should link to the other 3 related articles in a "Related Articles" section at the bottom, creating an internal linking hub.

### 4. Add Organization schema alongside InsuranceAgency
The existing InsuranceAgency schema is good but adding an explicit `Organization` type via `@type: ["Organization", "InsuranceAgency"]` broadens AI engine recognition.

### Files changed
- `index.html` — title tag, OG/Twitter titles, Organization schema tweak
- `src/components/Footer.tsx` — replace anchor links with blog page links
- `src/pages/PlanGvsFvsN.tsx` — add related articles section
- `src/pages/CheapestPlanGRates.tsx` — add related articles section
- `src/pages/WhyMedigapRatesIncrease.tsx` — add related articles section
- `src/pages/SwitchMedigapPlans.tsx` — add related articles section

