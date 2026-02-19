
# New Lead Form Funnel at /form

## Overview
A streamlined, Facebook-lead-form-style multi-step funnel that collects lead info, quotes behind the scenes using the existing `crm-quote-webhook` edge function, and shows either a "good rate" redirect or a "we'll be in touch" confirmation. No rate is revealed on screen.

## Funnel Steps (8 total)
1. **Plan** -- "Which Medicare Supplement plan do you currently have?" (Plan G / Plan N / Plan F)
2. **Gender** -- "What is your gender?" (Male / Female)
3. **Spouse** -- "Do you have a spouse or roommate that's on Medicare?" (Yes / No)
4. **Health** -- Single combined health question (same as /report funnel -- oxygen/wheelchair, daily care, dementia/Parkinson's, cancer/heart attack/stroke in past 2 years). Yes = disqualified, redirect to `/disqualified?reason=health`
5. **Age** -- "What is your current age?" (65+ required)
6. **Payment** -- "How much do you pay each month?" (dollar input)
7. **ZIP Code** -- "What is your ZIP code?"
8. **Contact** -- Full name (first + last), phone number, TCPA consent, and Submit button

## On Submit
- Validate phone via `validate-contact` edge function
- Call the existing `crm-quote-webhook` edge function with the collected data (plan, age, gender, spouse, zip, currentPremium)
- The `crm-quote-webhook` already handles quoting + posting to GHL when savings are found
- If response is `"no_savings"` or `"no_quotes"` -- redirect to `/great-rate`
- If response is `"quoted"` (savings found) -- show a simple thank-you/confirmation screen: "We found savings! A licensed agent will call/text you shortly."
- Save submission to `submissions` table (page: "form")
- Track funnel analytics via `useFunnelAnalytics('form')` (need to add 'form' to the union type)

## What Gets Built

### 1. New page: `src/pages/MedicareLeadForm.tsx`
- Mirrors the `/report` page structure (StepCard, BinaryChoice, progress bar)
- Same stone/serif editorial styling
- TrustedForm script loaded
- TCPA consent on the contact step (full name + phone + consent text)
- Mobile spacer + Medicare disclaimer footer (matching /report)
- No rate shown anywhere -- just "We found potential savings" confirmation
- Facebook pixel submission tracking (reuse existing `trackFacebookSubmissionEvent` pattern)

### 2. Update `src/App.tsx`
- Add route: `/form` pointing to the new lazy-loaded page

### 3. Update `src/hooks/useFunnelAnalytics.ts`
- Add `'form'` to the page union type

### 4. Edge function: `supabase/functions/send-lead-webhook-form/index.ts`
- New dedicated webhook function for this funnel (uses `GHL_WEBHOOK_URL` -- the same base webhook)
- Sends contact info + quote data + TrustedForm cert to GHL
- Source labeled as "Health Helpers Lead Form Funnel", page: "form"

Alternatively, we can reuse the existing `crm-quote-webhook` directly and create a simpler webhook for just the lead data. Since `crm-quote-webhook` already quotes AND posts to GHL, the frontend flow would be:
1. Collect all data
2. Call `crm-quote-webhook` with `{ name, email, phone, age, currentPremium, currentType, zip, gender, spouse }`
3. Based on response status, show confirmation or redirect to `/great-rate`
4. No separate lead webhook needed since `crm-quote-webhook` handles the GHL post

This is the cleaner approach -- one edge function call does both quoting and CRM posting.

## Confirmation Screen (shown after successful quote)
- Green checkmark icon
- "Thank You, [First Name]!"
- "We found potential savings on your Medicare Supplement. A licensed agent will reach out by phone and text shortly to walk you through your options -- at no cost to you."
- Trust badges (Licensed Agents, 100% Free, No Obligation)
- Medicare disclaimer footer

## Technical Details

### File changes:
- **New**: `src/pages/MedicareLeadForm.tsx` -- ~600 lines, modeled after MedicareSupplementReport.tsx but simplified (no results display, no booking widget)
- **Edit**: `src/App.tsx` -- add lazy import + route for `/form`
- **Edit**: `src/hooks/useFunnelAnalytics.ts` -- add `'form'` to page type union

### No new secrets needed
The `crm-quote-webhook` already has `GHL_WEBHOOK_URL_CRM_QUOTE` and `CSG_API_KEY` configured.

### No database changes needed
Existing `submissions`, `funnel_sessions`, and `funnel_events` tables support this with the `page` field set to `"form"`.
