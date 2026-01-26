

## Plan: Standalone Booking Page at /booking

### Overview
Create a standalone booking page at `/booking` that collects contact information (first name, last name, email, phone) and then uses the same appointment booking widget to schedule calls on the GHL calendar. This is perfect for sharing a direct booking link without requiring users to go through the full quote funnel.

### Key Challenge
The current booking widget requires the contact to already exist in GHL (created via webhook during the funnel flow). For a standalone page, we need to create the contact first.

**Solution:** Add a `create-contact` action to the `ghl-calendar` edge function that creates a contact in GHL, then proceeds with booking.

---

### Files to Create/Modify

| File | Action |
|------|--------|
| `src/pages/StandaloneBooking.tsx` | **Create** - New standalone booking page |
| `src/App.tsx` | **Modify** - Add `/booking` route |
| `supabase/functions/ghl-calendar/index.ts` | **Modify** - Add `create-contact` action |
| `src/components/AppointmentBookingWidget.tsx` | **Modify** - Make `quotedPremium`, `monthlySavings`, `planType` optional |

---

### Implementation Details

#### 1. Modify `ghl-calendar` Edge Function

Add a new `create-contact` action that creates a contact in GHL if it doesn't exist:

```typescript
interface CreateContactRequest {
  action: 'create-contact';
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

// In the handler, add:
if (body.action === 'create-contact') {
  const { firstName, lastName, email, phone } = body;
  const normalizedPhone = normalizePhone(phone);
  
  // First check if contact exists
  // ... search by phone ...
  
  // If not found, create new contact via GHL API
  const createResponse = await fetch(`${GHL_BASE_URL}/contacts/`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${GHL_API_TOKEN}`,
      'Content-Type': 'application/json',
      'Version': CONTACTS_API_VERSION,
    },
    body: JSON.stringify({
      locationId: LOCATION_ID,
      firstName,
      lastName,
      email,
      phone: normalizedPhone,
      source: 'Standalone Booking Page',
    }),
  });
  
  return { contactId: data.contact.id };
}
```

#### 2. Update `AppointmentBookingWidget` Props

Make quote-related props optional (with defaults) since the standalone page won't have quote data:

```typescript
interface AppointmentWidgetProps {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  quotedPremium?: number;      // Optional - default to 0
  monthlySavings?: number;     // Optional - default to 0
  planType?: string;           // Optional - default to 'N/A'
  userTimezone: string;
  userState?: string;          // Optional
  onComplete?: () => void;
  isStandalone?: boolean;      // New flag for standalone mode
}
```

When `isStandalone` is true:
- Hide the savings-focused messaging ("Lock In Your $X Savings")
- Show a simpler "Schedule Your Consultation" heading instead
- Skip the contact lookup (it was just created)
- Pass a contactId prop directly if available

#### 3. Create `StandaloneBooking.tsx` Page

```text
+----------------------------------+
|      Health Helpers Logo         |
+----------------------------------+
|                                  |
|   Schedule a Medicare            |
|   Consultation                   |
|                                  |
|   Speak with a licensed agent    |
|   about your Medicare options.   |
|                                  |
+----------------------------------+
|   [ CONTACT FORM ]               |
|                                  |
|   First Name: [____________]     |
|   Last Name:  [____________]     |
|   Email:      [____________]     |
|   Phone:      [____________]     |
|                                  |
|   [ Continue to Schedule → ]     |
+----------------------------------+
```

After form submission:
1. Validate the contact info (same zod schema as existing funnel)
2. Call `ghl-calendar` with `action: 'create-contact'`
3. Show the `AppointmentBookingWidget` with `isStandalone={true}`

#### 4. Flow Diagram

```text
User visits /booking
        │
        ▼
┌─────────────────────┐
│  Contact Info Form  │
│  (name, email,      │
│   phone)            │
└─────────────────────┘
        │
        ▼ Submit
┌─────────────────────┐
│  Create Contact     │
│  (ghl-calendar API) │
└─────────────────────┘
        │
        ▼
┌─────────────────────┐
│  Booking Widget     │
│  (same as /suppappt)│
│  - Pick day         │
│  - Pick time range  │
│  - Pick time +      │
│    inline confirm   │
│  - Success          │
└─────────────────────┘
```

#### 5. Page Styling

The page will use the same styling patterns as the existing funnels:
- Blue gradient header
- White card for form/widget
- Green primary buttons
- Mobile-responsive with senior-friendly sizing (70px+ buttons, 18px+ text)

---

### Technical Notes

**Contact Lookup vs Create:**
- The widget currently searches for a contact by phone before booking
- For standalone mode, we'll create the contact first, then pass the `contactId` directly to skip the lookup
- This avoids the "contact not found" error that would otherwise occur

**Optional Props Handling:**
- When no quote data is provided, the widget will hide savings messaging
- Appointment description will say "Medicare Consultation" instead of "$X savings"

**Validation:**
- Uses the same zod schema and Abstract API validation as the existing funnel
- Phone validation ensures valid US numbers
- Email validation catches disposable addresses

---

### Summary

| Step | Description |
|------|-------------|
| 1 | User visits `/booking` |
| 2 | Fills out contact form (first name, last name, email, phone) |
| 3 | Form validates and creates contact in GHL |
| 4 | Booking widget appears with same UX as `/suppappt` |
| 5 | User picks day → time range → time → books |
| 6 | Success screen shows confirmation |

