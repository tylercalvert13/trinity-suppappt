

## Plan: Optimize Funnel for Maximum Conversions

Based on the analytics showing **22% drop-off during the loading screen** and the technical bottlenecks identified, this plan implements multiple high-impact optimizations.

---

## Priority 1: Reduce Loading Screen Drop-off (Biggest Impact)

### Problem
- 22% of users abandon during "Finding Your Best Rates" screen
- Median load time: 7.6s, P90: 15s
- Users see a static spinner with no feedback

### Solutions

#### A. Optimize CSG Token Handling
**Current:** 5-minute expiration buffer + delete/insert = unnecessary refreshes

**Optimized:**
- Remove the 5-minute buffer (use full 8-hour token life)
- Use `upsert` instead of delete + insert (1 DB call vs 2)
- Trust the 403 retry mechanism for edge cases

```typescript
// Before: 5-minute buffer wastes token life
expiresAt.setMinutes(expiresAt.getMinutes() - 5);

// After: Use full 8-hour window
const expiresAt = new Date(authData.expires_date);

// Before: delete + insert (2 calls)
await supabase.from('csg_api_tokens').delete()...
await supabase.from('csg_api_tokens').insert()...

// After: single upsert
await supabase.from('csg_api_tokens').upsert({...}, { onConflict: 'id' });
```

#### B. Add Quote API Warmup
Pre-warm the `get-medicare-quote` edge function when user starts the funnel (before they reach the loading screen).

```typescript
// In useQuoteWarmup.ts (new hook)
useEffect(() => {
  const warmup = async () => {
    await supabase.functions.invoke('get-medicare-quote', {
      body: { action: 'warmup' }
    });
  };
  setTimeout(warmup, 1000);
}, []);

// In get-medicare-quote edge function
if (body.action === 'warmup') {
  // Just authenticate and cache the token
  await getSessionToken();
  return new Response(JSON.stringify({ warmed: true }), {...});
}
```

#### C. Add Engaging Progress Indicator
Replace static spinner with animated progress steps that show activity:

```
Step 1: "Connecting to carriers..." (0-2s)
Step 2: "Scanning 15+ insurance companies..." (2-4s)  
Step 3: "Comparing Plan G rates..." (4-6s)
Step 4: "Calculating your savings..." (6-8s)
Step 5: "Finalizing your quote..." (8s+)
```

Visual design:
- Progress bar that advances through steps
- Checkmarks appear as steps complete
- Carrier logos fade in during "Scanning carriers"
- Keeps users engaged instead of staring at spinner

---

## Priority 2: Streamline Booking Widget Performance

### Already Implemented
- Batch slot fetching (4 days in 1 call) - reduces 20-30s to 2-5s
- Calendar warmup hook

### Additional Optimization
- Move batch preload to fire immediately when results page mounts (before scroll)
- This way slots are ready before user even sees the booking widget

---

## Files to Modify

| File | Changes |
|------|---------|
| `supabase/functions/get-medicare-quote/index.ts` | Add warmup action, optimize token handling |
| `src/hooks/useQuoteWarmup.ts` | **NEW** - Warmup hook for quote API |
| `src/pages/MedicareSupplementAppointment.tsx` | Add warmup hook, add progress indicator component |
| `src/components/QuoteLoadingProgress.tsx` | **NEW** - Engaging progress indicator |

---

## Technical Implementation

### 1. Optimized Token Handling (get-medicare-quote)

```typescript
// Handle warmup requests
if (body.action === 'warmup') {
  console.log('Warmup request - pre-caching session token');
  await getSessionToken();
  return new Response(
    JSON.stringify({ warmed: true }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

// Optimized getSessionToken function
async function getSessionToken(): Promise<string> {
  const { data: existingToken } = await supabase
    .from('csg_api_tokens')
    .select('token, expires_at')
    .maybeSingle();

  // Use full 8-hour window (no 5-min buffer)
  if (existingToken && new Date(existingToken.expires_at) > new Date()) {
    return existingToken.token;
  }

  // Request new token
  const authResponse = await fetch('https://api.csgactuarial.com/v1/auth.json', {...});
  const authData = await authResponse.json();

  // Single upsert instead of delete + insert
  await supabase
    .from('csg_api_tokens')
    .upsert({
      id: 'singleton',
      token: authData.token,
      expires_at: authData.expires_date,
      updated_at: new Date().toISOString()
    }, { onConflict: 'id' });

  return authData.token;
}
```

### 2. Quote Warmup Hook

```typescript
// src/hooks/useQuoteWarmup.ts
import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function useQuoteWarmup() {
  const hasWarmedUp = useRef(false);

  useEffect(() => {
    if (hasWarmedUp.current) return;
    hasWarmedUp.current = true;

    const warmup = async () => {
      try {
        console.log('[Warmup] Pre-warming quote API...');
        const start = Date.now();
        
        await supabase.functions.invoke('get-medicare-quote', {
          body: { action: 'warmup' }
        });
        
        console.log(`[Warmup] Quote API ready in ${Date.now() - start}ms`);
      } catch (err) {
        console.log('[Warmup] Quote warmup failed (non-critical)');
      }
    };

    // Fire after initial render
    setTimeout(warmup, 500);
  }, []);
}
```

### 3. Progress Indicator Component

```typescript
// src/components/QuoteLoadingProgress.tsx
const STEPS = [
  { label: 'Connecting to carriers...', duration: 2000 },
  { label: 'Scanning 15+ insurance companies...', duration: 2000 },
  { label: 'Comparing Plan G rates...', duration: 2000 },
  { label: 'Calculating your savings...', duration: 2000 },
  { label: 'Finalizing your quote...', duration: 3000 },
];

export function QuoteLoadingProgress() {
  const [currentStep, setCurrentStep] = useState(0);
  
  useEffect(() => {
    const timers = STEPS.map((step, i) => {
      const delay = STEPS.slice(0, i).reduce((sum, s) => sum + s.duration, 0);
      return setTimeout(() => setCurrentStep(i), delay);
    });
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className="space-y-4">
      <Progress value={(currentStep + 1) / STEPS.length * 100} />
      {STEPS.map((step, i) => (
        <div key={i} className={cn(
          "flex items-center gap-2 transition-opacity",
          i <= currentStep ? "opacity-100" : "opacity-40"
        )}>
          {i < currentStep ? (
            <CheckCircle className="text-green-500" />
          ) : i === currentStep ? (
            <Loader2 className="animate-spin text-blue-500" />
          ) : (
            <Circle className="text-gray-300" />
          )}
          <span>{step.label}</span>
        </div>
      ))}
    </div>
  );
}
```

---

## Expected Impact

| Metric | Before | After (Estimated) |
|--------|--------|-------------------|
| Loading screen drop-off | 22% | 10-12% |
| Median quote load time | 7.6s | 4-5s |
| P90 quote load time | 15s | 8-10s |
| Booking widget load time | 20-30s | 2-5s (already done) |

---

## Implementation Order

1. **Edge function optimizations** (token handling + warmup action)
2. **Quote warmup hook** (fires on page mount)
3. **Progress indicator component** (user engagement)
4. **Integration** (add hooks and component to funnel page)

