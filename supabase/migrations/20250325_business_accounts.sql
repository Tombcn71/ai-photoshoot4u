-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enum types
CREATE TYPE user_role AS ENUM ('user', 'admin', 'business_admin', 'business_member');
CREATE TYPE account_type AS ENUM ('individual', 'business');
CREATE TYPE invitation_status AS ENUM ('pending', 'accepted', 'expired', 'revoked');

-- Update profiles table (assuming you already have this from auth.users)
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS role user_role DEFAULT 'user',
ADD COLUMN IF NOT EXISTS account_type account_type DEFAULT 'individual',
ADD COLUMN IF NOT EXISTS credits INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS business_id UUID REFERENCES businesses(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS invited_by UUID REFERENCES profiles(id) ON DELETE SET NULL;

-- Create businesses table
CREATE TABLE IF NOT EXISTS businesses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  admin_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  total_credits INTEGER DEFAULT 0,
  used_credits INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(admin_id)
);

-- Create invitations table
CREATE TABLE IF NOT EXISTS invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL,
  token TEXT UNIQUE NOT NULL,
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  status invitation_status DEFAULT 'pending',
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create credit_allocations table
CREATE TABLE IF NOT EXISTS credit_allocations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create credit_usage table
CREATE TABLE IF NOT EXISTS credit_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  business_id UUID REFERENCES businesses(id) ON DELETE SET NULL,
  amount INTEGER NOT NULL,
  description TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Row Level Security (RLS) policies

-- Enable RLS on all tables
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_usage ENABLE ROW LEVEL SECURITY;

-- Businesses policies
CREATE POLICY "Businesses are viewable by their members" 
ON businesses FOR SELECT 
USING (admin_id = auth.uid() OR id IN (
  SELECT business_id FROM profiles WHERE id = auth.uid()
));

CREATE POLICY "Businesses can be created by authenticated users" 
ON businesses FOR INSERT 
WITH CHECK (auth.uid() = admin_id);

CREATE POLICY "Businesses can be updated by their admin" 
ON businesses FOR UPDATE 
USING (admin_id = auth.uid());

-- Invitations policies
CREATE POLICY "Invitations are viewable by business admin" 
ON invitations FOR SELECT 
USING (business_id IN (
  SELECT id FROM businesses WHERE admin_id = auth.uid()
));

CREATE POLICY "Invitations can be created by business admin" 
ON invitations FOR INSERT 
WITH CHECK (business_id IN (
  SELECT id FROM businesses WHERE admin_id = auth.uid()
));

CREATE POLICY "Invitations can be updated by business admin" 
ON invitations FOR UPDATE 
USING (business_id IN (
  SELECT id FROM businesses WHERE admin_id = auth.uid()
));

CREATE POLICY "Invitations can be deleted by business admin" 
ON invitations FOR DELETE 
USING (business_id IN (
  SELECT id FROM businesses WHERE admin_id = auth.uid()
));

-- Credit allocations policies
CREATE POLICY "Credit allocations are viewable by business admin and recipient" 
ON credit_allocations FOR SELECT 
USING (business_id IN (
  SELECT id FROM businesses WHERE admin_id = auth.uid()
) OR user_id = auth.uid());

CREATE POLICY "Credit allocations can be created by business admin" 
ON credit_allocations FOR INSERT 
WITH CHECK (business_id IN (
  SELECT id FROM businesses WHERE admin_id = auth.uid()
));

-- Credit usage policies
CREATE POLICY "Credit usage is viewable by business admin and the user" 
ON credit_usage FOR SELECT 
USING (business_id IN (
  SELECT id FROM businesses WHERE admin_id = auth.uid()
) OR user_id = auth.uid());

CREATE POLICY "Credit usage can be created by the user" 
ON credit_usage FOR INSERT 
WITH CHECK (user_id = auth.uid());

-- Functions and triggers

-- Function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_businesses_updated_at
BEFORE UPDATE ON businesses
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_invitations_updated_at
BEFORE UPDATE ON invitations
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Function to generate invitation token
CREATE OR REPLACE FUNCTION generate_invitation_token()
RETURNS TEXT AS $$
DECLARE
  token TEXT;
BEGIN
  token := encode(gen_random_bytes(24), 'hex');
  RETURN token;
END;
$$ LANGUAGE plpgsql;

