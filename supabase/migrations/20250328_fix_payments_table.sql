-- Check if payments table exists, if not create it
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'payments') THEN
    CREATE TABLE payments (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
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
    CREATE INDEX IF NOT EXISTS payments_created_at_idx ON payments(created_at);
  END IF;
END $$;

-- Add RLS policies for payments table
DO $$ 
BEGIN
  -- Enable RLS on payments table
  ALTER TABLE IF EXISTS payments ENABLE ROW LEVEL SECURITY;

  -- Drop existing policies if they exist
  DROP POLICY IF EXISTS "Users can view their own payments" ON payments;
  
  -- Create policy for users to view their own payments
  CREATE POLICY "Users can view their own payments"
    ON payments FOR SELECT
    USING (user_id = auth.uid());
END $$;

