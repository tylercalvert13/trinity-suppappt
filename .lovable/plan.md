

# Replace Booking Calendar with Speed-to-Lead Agent Assignment on /suppappt

## Overview
Remove the appointment booking calendar from the qualified/results page and replace it with an instant agent assignment system. On qualification, a round-robin agent is assigned, their info is displayed prominently, and the lead webhook fires automatically with the assigned agent data.

## Agent Data Structure
Hardcode 6 agents with `name`, `phone`, `telLink`, `ghlUserId`, and `states: string[]` (empty = all states, for future filtering). Round-robin via `localStorage` counter that cycles 0-5.

## Changes

### 1. `src/pages/MedicareSupplementAppointment.tsx` — Main funnel page

**Remove:**
- `AppointmentBookingWidget` import and usage (lines 15, 1835-1857)
- `useCalendarWarmup` import and call (lines 12, 513)
- `bookingWidgetRef`, `selectedDayLabel`, `selectedTimeDisplay`, `autoScrollDone` state
- Auto-scroll-to-booking-widget effect (lines 538-555)
- `scrollToBookingWidget` callback and `handleSlotChange` callback
- "Book My Free Call Now" button (lines 1798-1806)
- "Rate Reserved — 15 Minutes" amber CTA (lines 1809-1832)
- `StickyBookingCTA` import and usage (lines 20, 1952-1958)
- `ExitIntentModal` import and usage (lines 18, 1939-1944) — no booking to scroll to anymore
- Urgency toast effect (lines 557-573)
- `PHONE_NUMBER` / `PHONE_TEL` constants (replace with agent's phone)

**Add:**
- Agent data array (6 agents with name, phone, ghlUserId, states)
- `getNextAgent()` function using localStorage round-robin counter
- `assignedAgent` state, set once on transition to `qualified`
- On `step === "qualified"`: fire webhook to `send-lead-webhook-suppappt` with additional fields: `assigned_agent_user_id`, `assigned_agent_name`, `assigned_agent_phone`, `lead_state` (from `getStateFromZip`)
- Webhook fires in a fire-and-forget pattern (no failure breaks UX)

**Replace qualified results UI (lines 1778-1905) with:**
1. Keep the success header ("Great News, {firstName}!")
2. Keep rate display ($X.XX/month)
3. **New: Agent assignment card** — large, prominent:
   - "Your Medicare Specialist **{AgentFirstName}** is reviewing your savings and will call you shortly from"
   - Agent phone number displayed very large and bold (text-3xl+), clickable `tel:` link
   - "Save this number so you recognize our call!"
4. **New: "Call {AgentFirstName} directly:" section** with large clickable phone number (replaces old "Want to lock this in RIGHT NOW?" section)
5. Keep trust badges grid
6. Keep testimonials
7. Keep disclaimer

### 2. `supabase/functions/send-lead-webhook-suppappt/index.ts` — Webhook

Add 4 new fields to the payload passed through to GHL:
- `assigned_agent_user_id`
- `assigned_agent_name` 
- `assigned_agent_phone`
- `lead_state`

These are passed from the frontend and forwarded as-is.

### 3. Remove `StickyBookingCTA` usage
No longer needed since there's no booking widget to scroll to. The sticky CTA is removed from this page only.

### 4. Remove `ExitIntentModal` usage
No booking widget to drive to. Could be repurposed later but removing for now.

## Round-Robin Implementation
```
const AGENTS = [ ... ];
function getNextAgent() {
  const key = 'suppappt_agent_index';
  const idx = parseInt(localStorage.getItem(key) || '0', 10) % AGENTS.length;
  localStorage.setItem(key, String((idx + 1) % AGENTS.length));
  return AGENTS[idx];
}
```

## Webhook Timing
The existing webhook call happens at line 972 (after quote success). The agent assignment fields will be added to that same call. No separate webhook needed. The agent is determined right before the webhook fires (during the `handleContactSubmit` flow), stored in state, and also sent in the payload.

## Files Modified
- `src/pages/MedicareSupplementAppointment.tsx` — bulk of changes
- `supabase/functions/send-lead-webhook-suppappt/index.ts` — pass through new fields

