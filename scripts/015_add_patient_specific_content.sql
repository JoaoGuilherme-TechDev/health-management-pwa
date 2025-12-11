-- Add tables for patient-specific diet recipes and supplement recommendations

-- Patient diet recipes table (for personalized meal plans)
CREATE TABLE IF NOT EXISTS patient_diet_recipes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  doctor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  ingredients TEXT[] DEFAULT '{}',
  preparation TEXT[] DEFAULT '{}',
  image_url TEXT,
  meal_type TEXT, -- breakfast, lunch, dinner, snack
  calories INTEGER,
  protein NUMERIC,
  carbs NUMERIC,
  fats NUMERIC,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Patient supplement recommendations table
CREATE TABLE IF NOT EXISTS patient_supplements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  doctor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  supplement_name TEXT NOT NULL,
  dosage TEXT NOT NULL,
  frequency TEXT NOT NULL, -- daily, twice daily, etc
  timing TEXT, -- morning, night, with meals, etc
  reason TEXT,
  start_date DATE NOT NULL,
  end_date DATE,
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_patient_diet_recipes_patient ON patient_diet_recipes(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_diet_recipes_doctor ON patient_diet_recipes(doctor_id);
CREATE INDEX IF NOT EXISTS idx_patient_supplements_patient ON patient_supplements(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_supplements_doctor ON patient_supplements(doctor_id);

-- RLS Policies for patient_diet_recipes
ALTER TABLE patient_diet_recipes ENABLE ROW LEVEL SECURITY;

CREATE POLICY patient_diet_recipes_select ON patient_diet_recipes
  FOR SELECT USING (
    auth.uid() = patient_id OR 
    auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
  );

CREATE POLICY patient_diet_recipes_insert_admin ON patient_diet_recipes
  FOR INSERT WITH CHECK (
    auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
  );

CREATE POLICY patient_diet_recipes_update_admin ON patient_diet_recipes
  FOR UPDATE USING (
    auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
  );

CREATE POLICY patient_diet_recipes_delete_admin ON patient_diet_recipes
  FOR DELETE USING (
    auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
  );

-- RLS Policies for patient_supplements
ALTER TABLE patient_supplements ENABLE ROW LEVEL SECURITY;

CREATE POLICY patient_supplements_select ON patient_supplements
  FOR SELECT USING (
    auth.uid() = patient_id OR 
    auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
  );

CREATE POLICY patient_supplements_insert_admin ON patient_supplements
  FOR INSERT WITH CHECK (
    auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
  );

CREATE POLICY patient_supplements_update_admin ON patient_supplements
  FOR UPDATE USING (
    auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
  );

CREATE POLICY patient_supplements_delete_admin ON patient_supplements
  FOR DELETE USING (
    auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
  );
