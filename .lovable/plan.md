

# State-Based Agent Assignment for /suppappt

## Problem
Currently, `getNextAgent()` picks the next agent in a simple round-robin without checking if that agent is licensed in the lead's state. This could assign leads to unlicensed agents.

## Solution
Filter the `AGENTS` array by the lead's state before picking one via round-robin. Agents only receive leads from states they're licensed in.

### Changes

**1. `src/pages/MedicareSupplementAppointment.tsx`**

- **Populate `states` arrays** with each agent's licensed state abbreviations from the spreadsheet:
  - Maria: AR, AZ, DE, GA, IA, KY, LA, MO, NC, NE, NJ, OH, OK, SC, TN, TX
  - Tiyanna: AL, AR, AZ, DE, FL, GA, IA, KY, MI, MO, MS, NC, NE, NJ, OH, OK, PA, SC, TN, TX
  - Claude: AL, AR, AZ, DE, FL, GA, IA, IL, KY, LA, ME, MI, MO, MS, NC, NE, NJ, NM, NV, OH, OK, PA, SC, TN, TX, WI, WV
  - Jerome: AR, AZ, FL, GA, MO, NC, NE, NJ, OH, OK, SC, TN, TX
  - Rosa: AL, AR, AZ, DE, IA, IL, KY, LA, MO, MS, NC, NE, NJ, NM, OH, OK, PA, SC, TN, TX, WI
  - Jay: NJ, OH, TX
  - Joey: AL, AZ, GA, LA, NC, NJ, OH, PA, SC, TN, TX, VA

- **Add a state name-to-abbreviation map** (reverse of what exists in `zipToState.ts`) so we can convert `getStateFromZip()` output (e.g., "Texas") to abbreviation ("TX") for matching.

- **Update `getNextAgent` to accept a state abbreviation**, filter agents to only those licensed in that state, then round-robin among the filtered set. The RPC call will use `funnel_id: 'suppappt-{stateAbbrev}'` (e.g., `suppappt-TX`) so each state gets its own even distribution counter.

- **Fallback**: If no agents are licensed in the lead's state (or state can't be determined), fall back to random assignment from the full list.

**2. Database change**: The `agent_round_robin` table and `get_next_agent_index` RPC already handle dynamic `funnel_id` values and will auto-insert new rows per state — no schema changes needed.

### Logic flow
```text
Lead submits zip → getStateFromZip("75001") → "Texas"
→ map to "TX"
→ filter AGENTS where states includes "TX" → [Maria, Tiyanna, Claude, Jerome, Rosa, Jay, Joey] (all 7)
→ RPC get_next_agent_index('suppappt-TX', 7) → returns index
→ assign filtered[index]
```

For a state like VA, only Joey is licensed, so every VA lead goes to Joey.

### No other files affected.

