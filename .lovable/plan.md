
## Plan: Fix CSG API Token Management

Fixing critical bugs causing excessive session creation and hitting the CSG 5-session limit.

---

## Root Cause Analysis

| Bug | Issue | Impact |
|-----|-------|--------|
| UUID Mismatch | Code uses `id: 'singleton'` but column is UUID type | Upsert always fails |
| Token Never Saved | Upsert error logged but not visible, token lost | Every request creates new session |
| Race Condition | Multiple requests hit CSG simultaneously | Session pile-up |

**Evidence from logs:**
- `Error upserting token: invalid input syntax for type uuid: "singleton"`
- Token obtained successfully but never saved
- 8+ requests in 2 minutes all saying "No valid token found"

---

## Solution

### 1. Database Schema Change
Alter the `id` column to be TEXT type or use a fixed UUID for singleton pattern:

```sql
-- Option A: Use a fixed UUID as the singleton ID
-- (Simpler - just update the code to use a valid UUID)
```

### 2. Edge Function Updates

**Fix the upsert to use a valid UUID singleton:**
```typescript
// Use a fixed UUID instead of 'singleton' string
const SINGLETON_TOKEN_ID = '00000000-0000-0000-0000-000000000001';

const { error: upsertError } = await supabase
  .from('csg_api_tokens')
  .upsert({
    id: SINGLETON_TOKEN_ID,
    token: authData.token,
    expires_at: authData.expires_date,
    updated_at: new Date().toISOString()
  }, { onConflict: 'id' });
```

**Add early expiration buffer to prevent race conditions:**
```typescript
// Add 5 minute buffer to prevent race condition
// where token expires between check and API call
const bufferMs = 5 * 60 * 1000; // 5 minutes
const expiresAt = new Date(existingToken.expires_at);
const isExpired = expiresAt.getTime() - bufferMs < Date.now();

if (existingToken && !isExpired) {
  return existingToken.token;
}
```

**Update the select query to filter by singleton ID:**
```typescript
const { data: existingToken } = await supabase
  .from('csg_api_tokens')
  .select('token, expires_at')
  .eq('id', SINGLETON_TOKEN_ID)
  .maybeSingle();
```

**Update delete query in retry logic:**
```typescript
// Delete the singleton token specifically
await supabase
  .from('csg_api_tokens')
  .delete()
  .eq('id', SINGLETON_TOKEN_ID);
```

---

## Complete Updated `getSessionToken` Function

```typescript
const SINGLETON_TOKEN_ID = '00000000-0000-0000-0000-000000000001';

async function getSessionToken(): Promise<string> {
  console.log("Checking for existing token in database...");
  
  const { data: existingToken, error: fetchError } = await supabase
    .from('csg_api_tokens')
    .select('token, expires_at')
    .eq('id', SINGLETON_TOKEN_ID)
    .maybeSingle();

  if (fetchError) {
    console.error("Error fetching token:", fetchError);
  }

  // Add 5-minute buffer to prevent race conditions
  if (existingToken) {
    const expiresAt = new Date(existingToken.expires_at);
    const bufferMs = 5 * 60 * 1000;
    if (expiresAt.getTime() - bufferMs > Date.now()) {
      console.log("Using cached token, expires:", existingToken.expires_at);
      return existingToken.token;
    }
    console.log("Token expired or expiring soon, refreshing...");
  }

  console.log("Requesting new token from CSG API...");
  
  const authResponse = await fetch('https://api.csgactuarial.com/v1/auth.json', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ api_key: CSG_API_KEY })
  });

  if (!authResponse.ok) {
    const errorText = await authResponse.text();
    console.error("CSG Auth failed:", authResponse.status, errorText);
    throw new Error(`CSG authentication failed: ${authResponse.status}`);
  }

  const authData = await authResponse.json();
  console.log("Received new token, expires:", authData.expires_date);

  const { error: upsertError } = await supabase
    .from('csg_api_tokens')
    .upsert({
      id: SINGLETON_TOKEN_ID,
      token: authData.token,
      expires_at: authData.expires_date,
      updated_at: new Date().toISOString()
    }, { onConflict: 'id' });

  if (upsertError) {
    // CRITICAL: Log the full error - this was silently failing before!
    console.error("CRITICAL: Token upsert failed:", JSON.stringify(upsertError));
  } else {
    console.log("Token cached successfully");
  }

  return authData.token;
}
```

---

## Immediate Action Required

Before deploying the fix, you need to clear existing CSG sessions:
1. Visit https://tools.csgactuarial.com/auth/manage-account/sessions
2. Delete all 5 existing sessions
3. Then the fixed code will create exactly 1 session and reuse it

---

## Summary of Changes

| File | Change |
|------|--------|
| `supabase/functions/get-medicare-quote/index.ts` | Fix UUID format, add expiration buffer, improve error logging |

The fix ensures:
- Only ONE session token is ever stored (singleton pattern with valid UUID)
- Token is properly cached and reused for 8 hours
- 5-minute buffer prevents race conditions at expiration edge
- Critical errors are properly logged for debugging
