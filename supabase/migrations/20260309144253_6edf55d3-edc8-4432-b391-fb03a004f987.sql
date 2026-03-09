
CREATE TABLE agent_round_robin (
  id text PRIMARY KEY DEFAULT 'suppappt',
  current_index integer NOT NULL DEFAULT 0
);

ALTER TABLE agent_round_robin ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public select" ON agent_round_robin FOR SELECT TO public USING (true);

INSERT INTO agent_round_robin (id, current_index) VALUES ('suppappt', 0);

CREATE OR REPLACE FUNCTION get_next_agent_index(funnel_id text, agent_count integer)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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
