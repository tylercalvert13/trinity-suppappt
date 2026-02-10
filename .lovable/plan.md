

## Chat-Native Rate Reveal + Realistic Loading + No Carrier

### 1. Realistic Loading Messages (replace static typing indicator)

Instead of just showing the typing dots while the quote loads, the bot will send progressive chat messages that feel like a real person is working on it:

```text
Bot: "Give me one sec, I'm pulling up your rates..."
  (typing indicator, 2s pause)
Bot: "Checking carriers in [state]..."
  (typing indicator, 2s pause)  
Bot: "Comparing [Plan G] rates for you..."
  (typing indicator, 2s pause)
Bot: "Almost got it..."
  (typing indicator until quote returns)
```

Each message appears as a real `ChatBubble` with a typing indicator before it, making it feel like an agent is actively working. The state name comes from `getStateFromZip()` which already exists in the codebase.

### 2. Rate Delivered as Chat Messages (remove QuoteResultCard)

Replace the `QuoteResultCard` widget with a series of natural text messages:

```text
Bot: "Great news, John! I found you a lower rate."
Bot: "Your new Plan G rate: $98.50/mo"
Bot: "That's $54.39 less per month — you'd save $652.68 a year!"
Bot: "Let's get you on a quick call to lock this in. Pick a day:"
[Today - Feb 10]  [Tomorrow - Feb 11]  [Wed - Feb 12]
```

No card, no widget — just chat bubbles like a real person texting you the info.

### 3. Remove Carrier Info

The carrier name and A.M. Best rating will NOT be shown to the user in the chat messages. The data is still fetched and stored in the database (for internal tracking), but the user only sees the rate and savings.

### 4. Fix Booking Day Selection (stale state bug)

`preloadSlots` will return the available days directly, and they'll be passed into `presentDaySelection(days)` instead of reading from stale React state.

### Technical Changes

**`src/pages/MedicareSupplementChat.tsx`:**

- **Loading flow (lines 766-813)**: Replace the single `setIsTyping(true)` with a sequence of `botSay()` calls that simulate an agent working. Use `getStateFromZip()` to personalize with the user's state. The quote fetch runs in parallel — messages are timed to fill the gap naturally, and once the quote returns, the loading messages stop and the result is delivered.

- **Rate display (lines 886-891)**: Replace the single "Great news" message + `QuoteResultCard` rendering with multiple `botSay()` calls:
  - "Great news, [name]! I found you a lower rate."
  - "Your new [Plan] rate: $XX.XX/mo"
  - "That's $XX.XX less per month -- you'd save $XXX.XX a year!"
  - Then the booking prompt follows.

- **Remove QuoteResultCard rendering (lines 970-982)**: Delete the `QuoteResultCard` block from the JSX entirely.

- **Remove `QuoteResultCard` import (line 18)**.

- **Fix `preloadSlots` (lines 394-434)**: Return `{ days, slots }` from the function.

- **Fix `presentDaySelection` (lines 437-446)**: Accept an optional `days` parameter to use instead of reading `availableDays` state.

- **Fix the call site (lines 888-891)**: Pass returned days directly:
  ```typescript
  const { days } = await preloadSlots();
  presentDaySelection(days);
  ```

**No other files need changes.** `QuoteResultCard.tsx` stays in the repo (unused on this page but harmless).

