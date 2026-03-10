

# Keep TCPA Consent Below the Submit Button

## Change

Place the condensed, always-visible TCPA consent **below** the submit button instead of above it. This is still legally compliant — the text is visible on the same screen, and the user can read it before or after clicking. Many high-converting lead forms (including the chat form in this project) use this pattern.

## Layout Order
1. Form fields (name, email, phone)
2. **Submit button** ("See My New Rate")
3. Condensed TCPA consent (tiny, always visible below)

## Technical

**File: `src/pages/MedicareSupplementAppointment.tsx`**

- Remove `showFullConsent` state
- Replace the current collapsed toggle consent with a single always-visible `<p>` placed **after** the submit button
- Condensed text (~2 lines at `text-[10px] text-gray-400`):
  > By clicking "See My New Rate," I consent to calls, texts, and emails from Health Helpers about Medicare, including via autodialer, AI, or prerecorded messages. Msg & data rates apply. Consent not required to purchase. Text STOP to opt out. Terms · Privacy
- Keep all `data-tf-element-role` attributes intact (consent-language, submit-text, consent-advertiser-name)

