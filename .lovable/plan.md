

# Simplify Health Screening to One Short Question

## Approach

Replace the 3 separate screens (15+ bullet points total) with a single screen containing **5 short, plain-language lines** that cover the major underwriting auto-declines. The wording groups related conditions together naturally so seniors scan it quickly.

### Proposed single question

**"Quick Health Check"**
*"In the last 2 years, have any of these applied to you?"*

1. Cancer, heart attack, stroke, or heart surgery
2. Oxygen use, dialysis, or organ transplant
3. Hospice, nursing home, or need daily care help
4. Insulin or 3+ diabetes medications
5. Biologic injections (e.g., Humira, Enbrel)

Two buttons: **"No, none of these"** (green, primary — advances to gender) and **"Yes"** (disqualifies with reason `"health"`).

This covers all the high-volume disqualifiers (CHF/COPD rolls into heart conditions, wheelchair/bedridden into daily care help, ALS/Parkinson's/MS and dementia into care, opioids dropped as low-volume). Five short lines instead of fifteen.

## Technical Changes

**File: `src/pages/MedicareSupplementAppointment.tsx`**

1. **Remove `"treatment"` and `"medications"` from `FunnelStep` type** and `QUESTION_STEPS` array.

2. **Update `handleCareAnswer`**: "no" goes directly to `gender` (currently goes to `treatment`). "yes" disqualifies with `"health"`.

3. **Remove `handleTreatmentAnswer` and `handleMedicationsAnswer`** functions entirely.

4. **Replace the 3 UI sections** (care ~lines 1196-1264, treatment ~lines 1267-1330, medications ~lines 1333-1391) with one combined card using the 5 bullets above.

5. **Update step count** from 11 to 9 in `getStepNumber()`, `getProgress()`, and all "Step X of 11" labels.

6. **No database changes** — `care_or_condition`, `recent_treatment`, `medication_use` columns are nullable and will just be unused for new submissions.

