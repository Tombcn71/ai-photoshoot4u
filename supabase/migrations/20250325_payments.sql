-- Create payments table
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_id UUID REFERENCES business_accounts(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  amount DECIMAL(10, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'usd',
  status TEXT NOT NULL DEFAULT 'pending',
  payment_intent_id TEXT,
  stripe_session_id TEXT,
  credits_purchased INTEGER NOT NULL,
  package_id TEXT NOT NULL,
  metadata JSONB
);

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS payments_user_id_idx ON payments(user_id);
CREATE INDEX IF NOT EXISTS payments_business_id_idx ON payments(business_id);
CREATE INDEX IF NOT EXISTS payments_created_at_idx ON payments(created_at);

-- Create credit_usage table to track credit additions and usage
CREATE TABLE IF NOT EXISTS credit_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_id UUID REFERENCES business_accounts(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  amount INTEGER NOT NULL,
  description TEXT,
  type TEXT NOT NULL DEFAULT 'usage', -- 'usage' or 'purchase'
  headshot_job_id UUID REFERENCES headshot_jobs(id) ON DELETE SET NULL,
  payment_id UUID REFERENCES payments(id) ON DELETE SET NULL
);

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS credit_usage_user_id_idx ON credit_usage(user_id);
CREATE INDEX IF NOT EXISTS credit_usage_business_id_idx ON credit_usage(business_id);
CREATE INDEX IF NOT EXISTS credit_usage_created_at_idx ON credit_usage(created_at);

