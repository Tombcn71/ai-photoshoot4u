-- Drop business-related tables
DROP TABLE IF EXISTS business_accounts CASCADE;

-- Remove business_id from profiles table
ALTER TABLE profiles DROP COLUMN IF EXISTS business_id;
ALTER TABLE profiles DROP COLUMN IF EXISTS role;

-- Remove business_id from headshot_jobs table
ALTER TABLE headshot_jobs DROP COLUMN IF EXISTS business_id;

-- Remove business_id from payments table
ALTER TABLE payments DROP COLUMN IF EXISTS business_id;

-- Remove business_id from credit_usage table
ALTER TABLE credit_usage DROP COLUMN IF EXISTS business_id;

-- Create team_members table if it doesn't exist
CREATE TABLE IF NOT EXISTS team_members (
 id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
 team_lead_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
 member_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
 created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
 UNIQUE(team_lead_id, member_id)
);

-- Add indexes for faster queries
CREATE INDEX IF NOT EXISTS team_members_team_lead_id_idx ON team_members(team_lead_id);
CREATE INDEX IF NOT EXISTS team_members_member_id_idx ON team_members(member_id);

-- Create invitations table if it doesn't exist
CREATE TABLE IF NOT EXISTS invitations (
 id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
 team_lead_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
 email TEXT NOT NULL,
 token TEXT NOT NULL UNIQUE,
 created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
 expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
 accepted_at TIMESTAMP WITH TIME ZONE
);

-- Add indexes for faster queries
CREATE INDEX IF NOT EXISTS invitations_team_lead_id_idx ON invitations(team_lead_id);
CREATE INDEX IF NOT EXISTS invitations_email_idx ON invitations(email);
CREATE INDEX IF NOT EXISTS invitations_token_idx ON invitations(token);

-- Create RLS policies for team_members
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own team members"
 ON team_members FOR SELECT
 USING (team_lead_id = auth.uid() OR member_id = auth.uid());

CREATE POLICY "Users can insert their own team members"
 ON team_members FOR INSERT
 WITH CHECK (team_lead_id = auth.uid());

CREATE POLICY "Users can delete their own team members"
 ON team_members FOR DELETE
 USING (team_lead_id = auth.uid());

-- Create RLS policies for invitations
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own invitations"
 ON invitations FOR SELECT
 USING (team_lead_id = auth.uid());

CREATE POLICY "Users can create their own invitations"
 ON invitations FOR INSERT
 WITH CHECK (team_lead_id = auth.uid());

CREATE POLICY "Users can update their own invitations"
 ON invitations FOR UPDATE
 USING (team_lead_id = auth.uid());

CREATE POLICY "Users can delete their own invitations"
 ON invitations FOR DELETE
 USING (team_lead_id = auth.uid());

-- Add team_lead_id to headshot_jobs table
ALTER TABLE headshot_jobs ADD COLUMN IF NOT EXISTS team_lead_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS headshot_jobs_team_lead_id_idx ON headshot_jobs(team_lead_id);

-- Add team_lead_id to credit_usage table
ALTER TABLE credit_usage ADD COLUMN IF NOT EXISTS team_lead_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS credit_usage_team_lead_id_idx ON credit_usage(team_lead_id);

