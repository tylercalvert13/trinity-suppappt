

# /report Funnel — Free Supplement Rate Report

## Overview

A new funnel page at `/report` inspired by Agora Financial's senior-friendly editorial style. Collects minimal info, fetches a real CSG quote, presents results as a formal "rate report" -- then drives to a phone call via the appointment booking widget. The entire flow only collects first name and phone number.

## Design Philosophy (Agora-Inspired)

- **Color palette**: Warm, muted tones -- off-white/cream backgrounds, dark charcoal text, minimal blue. No gradients. Think "newspaper editorial."
- **Typography**: Large serif-style headings (font-serif), generous line spacing, high contrast
- **Layout**: Single narrow column (max-w-xl), lots of whitespace, no trust badge clutter
- **Tone**: Authoritative, calm, personal -- like a letter from a trusted advisor

## Funnel Steps

```text
Landing --> Plan --> Payment --> Health Screen --> Gender --> Tobacco --> Spouse --> Age --> Zip --> First Name --> Phone --> Loading --> Report Results + Booking
```

### Step Details

1. **Landing** -- Editorial hero. "Is Your Medicare Supplement Company Overcharging You?" Single CTA.
2. **Plan** -- Which plan? (G / F / N)
3. **Payment** -- Monthly payment amount
4. **Health Screen** (single question) -- "Do any of these apply to you?" (oxygen/wheelchair, daily care, dementia/Parkinson's, cancer/heart attack/stroke in past 2 years). Yes = disqualify, No = continue.
5. **Gender** -- Male / Female
6. **Tobacco** -- Used in last 12 months?
7. **Spouse** -- Have a spouse on the plan?
8. **Age** -- Current age
9. **Zip** -- ZIP code
10. **First Name** -- "What's your first name?" (standalone warm page)
11. **Phone Number** -- "Where should we send your report?" with phone input + TCPA consent + TrustedForm
12. **Loading** -- QuoteLoadingProgress component
13. **Report Results** -- Formal report document + booking widget below

### Results Page: "Rate Report" Design

Styled like an actual document:
- **Report header**: "Medicare Supplement Rate Report" with prepared date and "Prepared for: [First Name]"
- **Summary box**: Current rate vs. lowest available rate, monthly/annual savings -- styled like a financial statement
- **Carrier info**: A-rated carrier name, AM Best rating
- **Key finding callout**: Highlighted box: "Based on our analysis, you may be overpaying by $X/month for the exact same coverage."
- **CTA**: "Speak With a Licensed Agent" driving to booking widget

### Booking Widget: First Name + Phone Only

The existing `AppointmentBookingWidgetWithOptIn` will be modified to accept an optional `prefilled contact` prop. When provided:
- **Skip step 3 entirely** (the contact form step)
- After time selection (step 2), go directly to booking using the pre-filled first name + phone
- Last name sent as empty string, email sent as empty string -- GHL accepts this fine
- The widget goes: Pick Day --> Pick Time --> (auto-book) --> Success

This keeps the widget reusable -- existing funnels that pass all 4 fields still work exactly as before.

## New Files

### 1. `src/pages/MedicareSupplementReport.tsx`
Main page component with:
- Simplified step flow (single health question, no treatment/medications)
- Contact split into first name page + phone page
- Agora-style warm/editorial UI
- Report-style results page
- Analytics via `useFunnelAnalytics('report')`
- Quote via `get-medicare-quote` edge function
- Submissions saved to `submissions` table
- TrustedForm + TCPA consent on phone step
- Facebook/conversion events: Submission on lead form, Appointment on booking

### 2. `supabase/functions/send-lead-webhook-report/index.ts`
Dedicated webhook function:
- Uses new secret `GHL_WEBHOOK_URL_REPORT`
- Payload includes `page: 'report'`
- Only requires firstName + phone (lastName/email null)

## Changes to Existing Files

### `src/App.tsx`
- Add lazy import and route for `/report`

### `src/hooks/useFunnelAnalytics.ts`
- Add `'report'` to the page union type

### `src/components/AppointmentBookingWidgetWithOptIn.tsx`
- Add optional `prefilledContact` prop: `{ firstName: string; phone: string }`
- When provided, after time selection (step 2), skip step 3 and immediately book using the pre-filled data (firstName + phone, empty lastName/email)
- No changes to existing behavior when prop is not provided

### `supabase/functions/ghl-calendar/index.ts`
- Make `lastName` and `email` optional in the `create-contact` action (pass empty strings if not provided -- GHL API allows this)

## Secret Needed

- **GHL_WEBHOOK_URL_REPORT** -- You'll need to provide the dedicated GHL webhook URL for this funnel

## Conversion Events

- **Submission/Lead**: Fires when the quote loads successfully (same pattern as /suppappt)
- **Appointment**: Fires when booking completes via the widget callback

## Technical Notes

- The `submissions` table insert will have null for lastName/email -- those columns are already nullable
- GHL's create-contact API only requires phone + locationId; firstName, lastName, and email are optional
- TrustedForm hidden fields and TCPA consent text appear on the phone number step
- Disqualification navigates to `/disqualified?reason=health`

