

## Plan: Create /suppappt1 Funnel with Late-Stage Opt-In

### Overview
Create a new funnel variant at `/suppappt1` that delays contact collection until the booking step, uses a different GHL webhook, and skips Facebook conversion tracking.

---

### Key Differences from /suppappt

| Aspect | /suppappt (Current) | /suppappt1 (New) |
|--------|---------------------|------------------|
| Contact collection | Step 11 of form (before quote) | Inside booking widget (after picking time) |
| GHL webhook trigger | On form submission (before booking) | Only when appointment is booked |
| Webhook URL | `GHL_WEBHOOK_URL_SUPPAPPT` | New: `...b681bac7-9b63-4697-81ab-84edebad5f8f` |
| Facebook CAPI | `submission` event tracked | None |
| Calendar | Same (DK08ISU9KTqjWEhxBNbo) | Same |
| Analytics page | `suppappt` | `suppappt1` |

---

### Architecture

```text
/suppappt1 Flow:

[Landing] → [Plan] → [Payment] → [Health Questions x3] 
         → [Gender] → [Tobacco] → [Spouse] → [Age] → [Zip]
         → [Loading/Quote]
         → [Booking Widget with Contact Opt-In]
              └── Step 1: Pick Day
              └── Step 2: Pick Time
              └── Step 3: Enter Contact Info (fn, ln, email, phone)
              └── Step 4: Success
                    └── On confirm: Create contact → Book appt → Send webhook
```

---

### Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `src/pages/MedicareSupplementAppointment1.tsx` | Create | Clone of suppappt without contact step in form, no FB tracking |
| `src/components/AppointmentBookingWidgetWithOptIn.tsx` | Create | Extended booking widget with built-in contact form step |
| `supabase/functions/send-lead-webhook-suppappt1/index.ts` | Create | New edge function using the different webhook URL |
| `supabase/config.toml` | Modify | Add config for new edge function |
| `src/App.tsx` | Modify | Add route for `/suppappt1` |

---

### Technical Details

**1. MedicareSupplementAppointment1.tsx**
- Clone of the current page
- Remove the "contact" step entirely (go from "zip" → "loading" → "qualified")
- Remove `trackFacebookSubmissionEvent()` call
- Remove the GHL webhook call on form submission
- Pass quote data to the new booking widget (no contact info yet)

**2. AppointmentBookingWidgetWithOptIn.tsx**
- Based on current booking widget
- New step flow: Day → Time → Contact Form → Success
- Accept new props: `onContactSubmit` callback, quote data for webhook
- Contact form includes: firstName, lastName, email, phone with validation
- On "Book My Call" click:
  1. Validate contact form
  2. Create contact in GHL via `ghl-calendar` (create-contact action)
  3. Book appointment using the returned contactId
  4. Call new webhook with all data (quote + contact + booking)

**3. send-lead-webhook-suppappt1 Edge Function**
- Uses new webhook URL: `https://services.leadconnectorhq.com/hooks/ryRZOfU1dkYsUVlNyUmH/webhook-trigger/b681bac7-9b63-4697-81ab-84edebad5f8f`
- Same payload structure as suppappt but with `page: 'suppappt1'`
- Secret: `GHL_WEBHOOK_URL_SUPPAPPT1`

---

### Updated Booking Widget Flow

```text
Step 1: Pick a Day
├── [Today] [Tomorrow] [Wednesday] [Thursday]
└── Badge shows availability status

Step 2: Pick a Time (all slots for selected day)
├── [9:00 AM] [9:30 AM] [10:00 AM] ...
└── Selecting a slot highlights it

Step 3: Your Information (NEW)
├── First Name, Last Name
├── Email, Phone
├── "Book My Call" button
└── Shows selected day/time above for confirmation

Step 4: Success
├── Confirmation message
├── Add to Calendar / Save Contact buttons
└── Same as current success screen
```

---

### Props for New Booking Widget

```typescript
interface AppointmentBookingWidgetWithOptInProps {
  // Quote data (no contact info)
  quotedPremium?: number;
  monthlySavings?: number;
  planType?: string;
  currentPayment?: number;
  age?: number;
  zipCode?: string;
  gender?: string;
  tobacco?: string;
  spouse?: string;
  
  // Timezone & location
  userTimezone: string;
  userState?: string;
  
  // Analytics
  visitorId?: string;
  sessionId?: string;
  onTrackEvent?: (params: TrackEventParams) => void;
}
```

---

### Webhook Payload (sent only on successful booking)

```json
{
  "firstName": "John",
  "lastName": "Smith",
  "name": "John Smith",
  "email": "john@example.com",
  "phone": "+15551234567",
  "age": 67,
  "zipCode": "07094",
  "gender": "male",
  "tobacco": "no",
  "spouse": "no",
  "plan": "Plan G",
  "currentPayment": 299.00,
  "quotedRate": 179.64,
  "quotedCarrier": "Medico Ins Co",
  "amBestRating": "A",
  "monthlySavings": 119.36,
  "annualSavings": 1432.32,
  "savingsPercent": 40,
  "timezone": "America/New_York",
  "timestamp": "2026-01-27T...",
  "source": "Health Helpers Quote Funnel",
  "page": "suppappt1",
  "appointmentTime": "2026-01-28T10:00:00-05:00",
  "appointmentId": "abc123",
  "visitorId": "...",
  "sessionId": "..."
}
```

---

### Secret Required

Before implementation, we'll need to add the webhook URL as a secret:
- **Secret Name**: `GHL_WEBHOOK_URL_SUPPAPPT1`
- **Value**: `https://services.leadconnectorhq.com/hooks/ryRZOfU1dkYsUVlNyUmH/webhook-trigger/b681bac7-9b63-4697-81ab-84edebad5f8f`

---

### Summary

This plan creates a new funnel variant that:
1. Collects contact info at the end of the booking widget (not in the main form)
2. Only sends data to GHL when an appointment is actually booked
3. Uses a dedicated webhook URL for this funnel
4. Skips Facebook conversion tracking entirely
5. Uses the same calendar and analytics infrastructure

