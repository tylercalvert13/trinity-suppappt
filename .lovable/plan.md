

## Redesign Homepage for Medicare Supplement Focus

Transform the current general Medicare homepage into a professional, reputation-building site centered around Medicare Supplement Plans (Plan G, Plan F, Plan N). The new design will establish Health Helpers as a trusted authority while using the new phone number (201) 298-8393 for all CTAs.

---

## Overview

The homepage will be restructured with Medicare Supplement-focused messaging while maintaining a professional, trustworthy appearance that builds company reputation. Unlike the funnel pages (/suppappt, /suppquote), this will be an informational homepage rather than a conversion funnel.

---

## File Changes Summary

| File | Change Type | Description |
|------|-------------|-------------|
| `src/components/Hero.tsx` | Major Update | Medicare Supplement-focused headline, value props, new phone number |
| `src/components/Services.tsx` | Replace | Focus on Medigap plans (G, F, N) with educational content |
| `src/components/About.tsx` | Update | Refresh stats and messaging for Medigap expertise |
| `src/components/Contact.tsx` | Update | New phone number, Medigap-specific messaging |
| `src/components/Header.tsx` | Update | New phone number (201) 298-8393 |
| `src/components/Footer.tsx` | Update | New phone number, streamlined services list |

---

## Detailed Changes

### 1. Hero.tsx - New Headline and Value Proposition

**Current:** Generic "Expert Medicare Guidance Personalized for You"

**New Messaging:**
- **Headline:** "Are You Overpaying for Medicare Supplement Coverage?"
- **Subheadline:** "Plan G, F, and N policyholders across America are saving $100-200/month by switching carriers—with the exact same coverage. Our licensed agents help you compare rates and keep more money in your pocket."
- **CTA:** Single prominent "Call Now" button with (201) 298-8393
- **Trust Indicators:** Keep existing icons but update labels to:
  - Licensed in All 50 States
  - No-Obligation Rate Comparison
  - Same Coverage, Lower Price
  - Trusted by Thousands

**Phone number updates:**
- Replace all instances of `201-589-1901` with `201-298-8393`
- Update tel: links to `tel:+12012988393`

---

### 2. Services.tsx - Medicare Supplement Plan Education

**Replace 6 generic services with 3 focused Medicare Supplement sections:**

1. **Plan G - Most Popular Choice**
   - "The gold standard in Medigap coverage"
   - Features: Covers Part A & B deductibles, no referrals needed, works with any Medicare-accepting doctor
   - "Best for: Seniors who want comprehensive coverage with predictable costs"

2. **Plan F - Legacy Full Coverage** 
   - "Complete coverage for those who qualified before 2020"
   - Features: Zero out-of-pocket costs, covers Part B deductible (grandfathered), nationwide acceptance
   - "Best for: Existing policyholders who want to keep full coverage"

3. **Plan N - Budget-Friendly Option**
   - "Lower premiums with minimal cost-sharing"
   - Features: Lower monthly premium, small copays for office visits, same doctor freedom
   - "Best for: Healthy seniors looking to save on monthly premiums"

**Add educational callout box:**
- "All Medigap plans are standardized by federal law—Plan G is Plan G regardless of which company you buy from. The only difference is the price you pay."

**CTA:** "Compare Your Rate Today" → calls (201) 298-8393

---

### 3. About.tsx - Build Credibility and Trust

**Update stats to be more specific and credible:**
- "Licensed in All 50 States" (instead of generic years)
- "Thousands Helped" (more believable than 5000+)
- "A+ Rated Carriers" (highlights carrier quality)
- "Free Rate Comparison" (emphasizes no-cost service)

**Update copy to focus on Medicare Supplement expertise:**
- "Specializing in Medicare Supplement Plans"
- Emphasize the "rate trap" education angle
- Highlight that switching is easy with no coverage gaps

**Key points to include:**
- "We work with top-rated carriers like Aflac and Medico"
- "No pressure, no obligation—just honest rate comparisons"
- "Your coverage stays exactly the same, just at a lower price"

---

### 4. Contact.tsx - Streamlined Contact Section

**Update phone number:** (201) 298-8393

**Simplify the form focus:**
- Remove the full contact form (keep it simple for a homepage)
- Keep the contact information card
- Add a prominent call CTA card

**Update messaging:**
- "Get Your Free Medicare Supplement Rate Comparison"
- "See if you're overpaying in just 2 minutes"

**Update office hours display** to match actual availability

---

### 5. Header.tsx - Update Phone Number

**Changes:**
- Replace "(201) 589-1901" with "(201) 298-8393"
- Update tel: link to `tel:+12012988393`
- Update mobile menu phone display

---

### 6. Footer.tsx - Update Phone and Streamline

**Phone update:** (201) 298-8393

**Streamline services list to focus on Medigap:**
- Medicare Supplement Plan G
- Medicare Supplement Plan F
- Medicare Supplement Plan N
- Free Rate Comparison
- Carrier Comparison

**Update company description:**
- "Your trusted partner for Medicare Supplement insurance. We help seniors find the same coverage at a lower price."

**Update copyright year to 2025**

---

## Content Strategy Notes

The homepage should feel educational and trustworthy, not salesy. Key messaging pillars:

1. **The Rate Trap Education** - Insurers raise rates on loyal customers
2. **Standardization Message** - Plan G is Plan G, only the price differs
3. **No-Risk Switching** - Same coverage, same doctors, just lower cost
4. **Trust Signals** - Licensed agents, A+ carriers, nationwide service

---

## Technical Notes

- All phone numbers change from 201-589-1901 to 201-298-8393
- Tel links format: `tel:+12012988393`
- Display format: "(201) 298-8393"
- No functional changes to tracking or analytics
- Maintains existing design system (colors, shadows, gradients)
- Mobile-responsive patterns remain unchanged

