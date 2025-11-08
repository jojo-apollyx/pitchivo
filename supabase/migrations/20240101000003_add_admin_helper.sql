-- ============================================================================
-- HELPER FUNCTION: Make user a Pitchivo admin
-- ============================================================================
-- Function to promote a user to Pitchivo admin
-- This can only be called by service role or existing Pitchivo admins
CREATE OR REPLACE FUNCTION make_pitchivo_admin(
  p_user_email TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  user_id UUID;
BEGIN
  -- Find user by email
  SELECT id INTO user_id
  FROM auth.users
  WHERE email = p_user_email;
  
  IF user_id IS NULL THEN
    RAISE EXCEPTION 'User with email % not found', p_user_email;
  END IF;
  
  -- Update user profile to make them admin
  UPDATE user_profiles
  SET is_pitchivo_admin = true
  WHERE id = user_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users (they can check if they're admin)
-- But only service role can actually execute this
GRANT EXECUTE ON FUNCTION make_pitchivo_admin(TEXT) TO authenticated;

