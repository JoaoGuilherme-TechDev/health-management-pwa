
CREATE TABLE IF NOT EXISTS supplement_catalog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  benefit TEXT NOT NULL,
  dosage TEXT NOT NULL,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS (optional, keeping it off or simple for now if auth.role is missing)
-- ALTER TABLE supplement_catalog ENABLE ROW LEVEL SECURITY;

-- If we want RLS but auth.role() is missing, we can skip policies for now 
-- or create a dummy auth schema if we were doing a full emulation.
-- For this task, just creating the table is sufficient to fix the "relation does not exist" error.
