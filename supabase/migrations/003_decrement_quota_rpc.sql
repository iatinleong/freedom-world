-- Atomic quota decrement RPC
-- Prevents race condition where client overwrites webhook-added turns
-- Usage: SELECT decrement_quota('user-uuid');
-- Returns: new turns_remaining value, or -1 if already 0

CREATE OR REPLACE FUNCTION decrement_quota(p_user_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_new_turns integer;
BEGIN
  UPDATE user_quotas
  SET
    turns_remaining = GREATEST(0, turns_remaining - 1),
    updated_at = now()
  WHERE user_id = p_user_id
    AND turns_remaining > 0
  RETURNING turns_remaining INTO v_new_turns;

  -- If no row was updated (turns already 0 or user not found), return -1
  IF NOT FOUND THEN
    RETURN -1;
  END IF;

  RETURN v_new_turns;
END;
$$;

-- Only the service role and authenticated users can call this function
REVOKE ALL ON FUNCTION decrement_quota(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION decrement_quota(uuid) TO authenticated;
