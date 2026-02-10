

## /suppchat — iMessage-Style Medicare Supplement Chat Funnel

### Concept
A conversational funnel that looks and feels like an iMessage conversation. A friendly "agent" asks questions one at a time as chat bubbles, the user taps response buttons (or types short answers), and the conversation scrolls naturally. Same backend logic, same APIs, same FB/Bing/Google conversion events, same booking widget at the end — just wrapped in a chat UI.

### Visual Design

```text
+------------------------------------------+
|  iMessage-style header bar               |
|  [Avatar] Health Helpers    [Online dot]  |
+------------------------------------------+
|                                           |
|  [Bot bubble] Hey there! I help seniors   |
|  find lower rates on their Medicare       |
|  Supplement plan. Ready to check yours?   |
|                                           |
|              [Get Started] <- user button |
|                                           |
|  [Bot bubble] Which plan do you have?     |
|                                           |
|     [Plan G]  [Plan N]  [Plan F]          |
|                                           |
|                        [Plan G] <- sent   |
|                                           |
|  [Bot bubble] Great! How much do you      |
|  pay each month?                          |
|                                           |
|  [ $_____ ]  [Send]                       |
|                                           |
|  ... (health screening as Yes/No taps)    |
|  ... (gender, tobacco, spouse as taps)    |
|  ... (age, zip as typed inputs)           |
|  ... (contact form with TCPA consent)     |
|  ... (loading animation as typing dots)   |
|  ... (quote result as a special card)     |
|  ... (booking widget embedded in chat)    |
+------------------------------------------+
```

### Chat Flow (maps 1:1 to /suppappt steps)

| Step | Bot Message | User Response Type |
|------|------------|-------------------|
| Start | "Hey! I help seniors find lower rates on their Medicare Supplement. Want to check yours?" | Button: "Let's Do It" |
| Plan | "Which plan do you have today?" | Buttons: Plan G / Plan N / Plan F |
| Payment | "How much do you pay each month?" | Text input with $ prefix + Send |
| Care | "Quick health check - do any of these apply to you? [list]" | Buttons: Yes / No |
| Treatment | "In the last 2 years, have you had any of these? [list]" | Buttons: Yes / No |
| Medications | "Do any of these apply? [list]" | Buttons: Yes / No |
| Gender | "What's your gender?" | Buttons: Male / Female |
| Tobacco | "Have you used tobacco in the last 12 months?" | Buttons: Yes / No |
| Spouse | "Do you have a spouse or domestic partner?" | Buttons: Yes / No |
| Age | "What's your current age?" | Number input + Send |
| Zip | "What's your ZIP code?" | Text input + Send |
| Contact | "Almost done! I just need your contact info to pull your rate." | Form: name, email, phone + TCPA consent + Submit |
| Loading | Typing indicator ("...") for 3-5 seconds | Animated dots |
| Result | Rate card bubble with savings breakdown | -- |
| Booking | "Pick a time below and we'll give you a quick call:" | Embedded AppointmentBookingWidget |

### Key Design Elements

**iMessage Look and Feel:**
- Light gray background (#e5e5ea or similar)
- Bot messages: white bubbles, left-aligned, with tail
- User messages: blue bubbles (#007AFF), right-aligned, with tail
- Rounded bubble corners (18px radius, flat on tail side)
- Subtle animations: messages slide up, typing dots animate
- Timestamps shown sparingly (e.g., "Today 2:34 PM" at top)
- Agent avatar (small circle) next to bot messages

**Mobile-First:**
- Full-screen chat experience
- Input area fixed at bottom (like real iMessage)
- Auto-scroll to latest message on each new bubble
- Large tap targets for buttons (senior-friendly)

**Conversion Preserving:**
- Typing indicator before each bot response (500-800ms delay for realism)
- Disqualification still redirects to /disqualified
- Same exit intent modal when qualified
- Same social proof popup
- Same sticky CTA on mobile
- Same auto-scroll to booking widget after 5 seconds

### Technical Approach

**New Files to Create:**

1. **`src/pages/MedicareSupplementChat.tsx`** - Main chat page component
   - Manages chat state (array of message objects)
   - Each message has: id, sender (bot/user), content (text or component), type (text/buttons/input/card/widget)
   - Reuses ALL existing logic from MedicareSupplementAppointment.tsx:
     - Same FormData interface and state
     - Same validation (zod schema, validate-contact edge function)
     - Same quote fetching (get-medicare-quote)
     - Same webhook (send-lead-webhook-suppappt)
     - Same FB/Bing/Google/Vibe conversion tracking functions
     - Same TrustedForm integration
     - Same saveSubmission logic
   - Uses useFunnelAnalytics('suppchat') for analytics tracking

2. **`src/components/chat/ChatBubble.tsx`** - Individual message bubble
   - Props: sender, children, timestamp, showAvatar
   - Handles left/right alignment, bubble styling, animations

3. **`src/components/chat/ChatButtonGroup.tsx`** - Tappable option buttons
   - Renders horizontally or vertically depending on count
   - Highlights selected option, disables after selection

4. **`src/components/chat/ChatInput.tsx`** - Bottom input bar
   - Fixed to bottom of screen
   - Supports text, number, currency, and phone input modes
   - Send button (blue arrow icon like iMessage)

5. **`src/components/chat/ChatContactForm.tsx`** - Contact collection within chat
   - Inline form fields for first name, last name, email, phone
   - TCPA consent text with TrustedForm tagging
   - Submit button styled to match chat theme

6. **`src/components/chat/TypingIndicator.tsx`** - Animated "..." dots
   - Three bouncing dots in a gray bubble
   - Used before each bot message for realism

7. **`src/components/chat/ChatHeader.tsx`** - Top bar
   - Agent name, avatar, "Online" status dot
   - Minimal, clean design

8. **`src/components/chat/QuoteResultCard.tsx`** - Special rate card bubble
   - Shows rate, savings, carrier info
   - Styled as an embedded card within the chat flow

**Files to Modify:**

1. **`src/App.tsx`** - Add route for `/suppchat`
2. **`src/hooks/useFunnelAnalytics.ts`** - Add 'suppchat' to the page type union

### What Gets Reused (No Duplication)

- `AppointmentBookingWidget` component (embedded in chat after quote)
- `ExitIntentModal` component
- `SocialProofPopup` component
- `StickyBookingCTA` component
- `QuoteLoadingProgress` (adapted as typing indicator)
- `useFunnelAnalytics` hook
- `useCalendarWarmup` / `useQuoteWarmup` hooks
- All edge functions (get-medicare-quote, validate-contact, send-lead-webhook-suppappt, fb-conversion, ghl-calendar)
- All tracking functions (FB CAPI, Bing UET, Google Ads, Vibe.co)
- TrustedForm integration
- Zod validation schema
- zipToState utility

### Conversion Tracking

- Same `page: 'suppchat'` in submissions table
- Same FB CAPI events via fb-conversion edge function
- Same Bing UET enhanced conversions
- Same Google Ads conversion
- Same Vibe.co lead event
- Analytics tracked under useFunnelAnalytics('suppchat')

### Edge Cases

- If user tries to scroll up and modify a previous answer: not allowed (answers are locked after selection, just like a real chat)
- Network errors: bot sends an "Oops, let me try that again" message with a retry button
- Disqualification: bot says "I'm sorry, based on your answers we can't find a lower rate right now" then redirects
- "Cannot beat rate" (knockout): bot delivers the message conversationally before redirecting to /great-rate
