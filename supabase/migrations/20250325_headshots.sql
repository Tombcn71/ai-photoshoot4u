-- Create headshot_jobs table
CREATE TABLE IF NOT EXISTS headshot_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  business_id UUID REFERENCES businesses(id) ON DELETE SET NULL,
  astria_generation_id TEXT NOT NULL,
  background TEXT NOT NULL,
  outfit TEXT NOT NULL,
  input_image_url TEXT NOT NULL,
  output_image_urls TEXT[] DEFAULT NULL,
  status TEXT NOT NULL CHECK (status IN ('processing', 'completed', 'failed')),
  error_message TEXT DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
);

-- Create favorite_headshots table
CREATE TABLE IF NOT EXISTS favorite_headshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  headshot_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, headshot_url)
);

-- Enable RLS on the tables
ALTER TABLE headshot_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorite_headshots ENABLE ROW LEVEL SECURITY;

-- RLS policies for headshot_jobs
CREATE POLICY "Headshot jobs are viewable by their creator or business admin" 
ON headshot_jobs FOR SELECT 
USING (
  user_id = auth.uid() OR 
  business_id IN (
    SELECT id FROM businesses WHERE admin_id = auth.uid()
  )
);

CREATE POLICY "Headshot jobs can be created by authenticated users" 
ON headshot_jobs FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Headshot jobs can be updated by their creator" 
ON headshot_jobs FOR UPDATE 
USING (auth.uid() = user_id);

-- RLS policies for favorite_headshots
CREATE POLICY "Favorite headshots are viewable by their creator" 
ON favorite_headshots FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Favorite headshots can be created by authenticated users" 
ON favorite_headshots FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Favorite headshots can be deleted by their creator" 
ON favorite_headshots FOR DELETE 
USING (user_id = auth.uid());

