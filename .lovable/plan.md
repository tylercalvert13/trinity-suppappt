

## Plan: Expand Screening Questions to Catch More Auto-Decline Conditions

### Overview
Enhance the existing 3 screening questions in both `/suppquote` and `/suppappt` funnels to capture additional high-risk conditions that currently slip through. This will improve lead quality by filtering out uninsurable applicants earlier.

---

### Current Questions vs. Proposed Changes

#### Question 1: Quick Health Check (Care/Living Situation)

**Current:**
- Nursing home or assisted living
- Need daily help with personal care
- Dementia or Alzheimer's
- Use oxygen at home

**Proposed (add 2 items):**
- Nursing home or assisted living
- Need daily help with personal care
- **Hospice or home health care services** _(NEW - catches functional limitations)_
- Dementia or Alzheimer's
- Use oxygen at home
- **Wheelchair-bound or bedridden** _(NEW - catches mobility limitations)_

**Conditions Now Caught:**
- Hospice care
- Home health services
- Wheelchair/bedridden status
- Functional ADL limitations

---

#### Question 2: Recent Medical History (Treatment/Conditions)

**Current:**
- Cancer, heart attack, or stroke
- Kidney dialysis or organ transplant
- ALS, Parkinson's, or MS

**Proposed (expand and add):**
- Cancer, heart attack, or stroke
- **Congestive heart failure (CHF) or COPD** _(NEW - high-volume declines)_
- **Heart procedure: bypass, stent, or pacemaker** _(NEW - cardiac procedures)_
- Kidney dialysis or organ transplant
- ALS, Parkinson's, or MS

**Conditions Now Caught:**
- CHF (congestive heart failure)
- COPD / emphysema
- Cardiomyopathy (often diagnosed as CHF)
- Coronary artery disease with bypass/stent/angioplasty
- Pacemaker or defibrillator
- Atrial fibrillation (often accompanies pacemaker)

---

#### Question 3: Current Medications

**Current:**
- Use insulin
- Take 3+ diabetes medications
- Daily prescription pain medicine (opioids)

**Proposed (add 1 item):**
- Use insulin
- Take 3+ diabetes medications
- Daily prescription pain medicine (opioids)
- **Biologic injections or infusions (e.g., Humira, Enbrel)** _(NEW - catches autoimmune)_

**Conditions Now Caught:**
- Rheumatoid arthritis
- Lupus
- Crohn's disease / Ulcerative colitis
- Psoriatic arthritis
- Any autoimmune requiring biologics/immunosuppressants

---

### Files to Modify

| File | Changes |
|------|---------|
| `src/pages/MedicareSupplementAppointment.tsx` | Update care, treatment, and medications question bullet lists |
| `src/pages/MedicareSupplementQuote.tsx` | Update care, treatment, and medications question bullet lists (identical changes) |

---

### Updated Question Text (Final Copy)

#### Question 1: Quick Health Check
```
Do any of these apply to you?

• Nursing home or assisted living
• Need daily help with personal care
• Hospice or home health care
• Dementia or Alzheimer's
• Use oxygen at home
• Wheelchair-bound or bedridden
```

#### Question 2: Recent Medical History
```
In the last 2 years, have you had:

• Cancer, heart attack, or stroke
• Congestive heart failure (CHF) or COPD
• Heart procedure: bypass, stent, or pacemaker
• Kidney dialysis or organ transplant
• ALS, Parkinson's, or MS
```

#### Question 3: Current Medications
```
Do any of these apply to you?

• Use insulin
• Take 3+ diabetes medications
• Daily prescription pain medicine (opioids)
• Biologic injections or infusions (e.g., Humira, Enbrel)
```

---

### Conditions This Now Screens Out

| Category | Conditions Now Caught |
|----------|----------------------|
| Cardiac | CHF, bypass, stents, pacemaker, cardiomyopathy |
| Pulmonary | COPD, emphysema (bundled with CHF question) |
| Autoimmune | RA, Lupus, Crohn's, UC, psoriatic arthritis (via biologics) |
| Functional | Hospice, home health, wheelchair/bedridden |
| Neurologic | Already covered (ALS, Parkinson's, MS, dementia) |
| Diabetes | Already covered (insulin, 3+ meds) |
| Cancer | Already covered (2-year lookback) |

---

### Design Considerations

**Senior-Friendly Formatting:**
- Keep same large text (text-lg/text-xl)
- Bullet points remain scannable
- Plain language maintained (e.g., "heart procedure" not "CABG")
- Parenthetical examples help clarify (e.g., "Humira, Enbrel")

**UI Impact:**
- Question 1: 6 items (was 4) - still fits on mobile
- Question 2: 5 items (was 3) - still fits on mobile
- Question 3: 4 items (was 3) - minimal change

---

### Summary

This plan adds **5 new screening items** across the 3 existing questions, targeting the highest-volume gaps identified (CHF, COPD, cardiac procedures, biologics, hospice/home health). It maintains the senior-friendly design and requires no new questions or flow changes.

