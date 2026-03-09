

# Fix: Agent Round-Robin Always Assigning Maria

## Root Cause
`getNextAgent()` uses `localStorage` to track the round-robin index. Since each visitor has their own browser/localStorage, the index always starts at `0` — which is Maria. The round-robin only works across multiple submissions from the *same* browser, which never happens in practice.

## Solution
Move the round-robin counter to the database so it's shared across all visitors. Use a simple server-side atomic counter.

### Database Change
Create a small table to hold the counter:
```sql
CREATE TABLE agent_round_robin (
  id text PRIMARY KEY DEFAULT 'suppappt',
  current_index integer NOT NULL DEFAULT 0
);
INSERT INTO agent_round_robin (id, current_index) VALUES ('suppappt', 0);
```

Add an RPC function that atomically increments and returns the index:
```sql
CREATE OR REPLACE FUNCTION get_next_agent_index(funnel_id text, agent_count integer)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  idx integer;
BEGIN
  UPDATE agent_round_robin
  SET current_index = (current_index + 1) % agent_count
  WHERE id = funnel_id
  RETURNING (current_index + agent_count - 1) % agent_count INTO idx;
  
  IF idx IS NULL THEN
    INSERT INTO agent_round_robin (id, current_index) VALUES (funnel_id, 1);
    idx := 0;
  END IF;
  
  RETURN idx;
END;
$$;
```

RLS: Public SELECT on the table, no INSERT/UPDATE/DELETE needed since the function is `SECURITY DEFINER`.

### Code Change in `MedicareSupplementAppointment.tsx`
- Replace `getNextAgent()` with an async call: `const { data } = await supabase.rpc('get_next_agent_index', { funnel_id: 'suppappt', agent_count: AGENTS.length })`
- Use `AGENTS[data]` to pick the agent
- Keep localStorage as a fallback if the RPC fails
- The call happens at line ~896 where the agent is already assigned, inside the async `handleContactSubmit`

### No other files affected.

