-- Create a function to accept an invitation in a transaction
CREATE OR REPLACE FUNCTION accept_invitation(
 p_token TEXT,
 p_member_id UUID,
 p_accepted_at TIMESTAMPTZ
) RETURNS VOID AS $$
DECLARE
 v_team_lead_id UUID;
BEGIN
 -- Get the team lead ID from the invitation
 SELECT team_lead_id INTO v_team_lead_id
 FROM invitations
 WHERE token = p_token
 AND accepted_at IS NULL
 AND expires_at > NOW();
 
 IF v_team_lead_id IS NULL THEN
   RAISE EXCEPTION 'Invalid or expired invitation';
 END IF;
 
 -- Mark the invitation as accepted
 UPDATE invitations
 SET accepted_at = p_accepted_at
 WHERE token = p_token;
 
 -- Create the team member relationship
 INSERT INTO team_members (team_lead_id, member_id)
 VALUES (v_team_lead_id, p_member_id)
 ON CONFLICT (team_lead_id, member_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

