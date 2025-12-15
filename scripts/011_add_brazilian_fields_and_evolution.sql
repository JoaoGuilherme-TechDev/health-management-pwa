-- Adicionar campos brasileiros à tabela profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS rg text,
ADD COLUMN IF NOT EXISTS cpf text UNIQUE,
ADD COLUMN IF NOT EXISTS blood_type text CHECK (blood_type IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')),
ADD COLUMN IF NOT EXISTS birth_city text,
ADD COLUMN IF NOT EXISTS birth_state text,
ADD COLUMN IF NOT EXISTS chronic_diseases text[],
ADD COLUMN IF NOT EXISTS current_medications text[];

-- Criar tabela de evolução física
CREATE TABLE IF NOT EXISTS public.physical_evolution (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  weight numeric(5,2), -- kg
  height numeric(5,2), -- cm
  muscle_mass numeric(5,2), -- kg
  body_fat_percentage numeric(4,2), -- %
  visceral_fat numeric(3,1),
  metabolic_age integer,
  bmr numeric(6,1), -- Taxa metabólica basal
  body_water_percentage numeric(4,2), -- %
  bone_mass numeric(4,2), -- kg
  notes text,
  measured_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now()
);

-- Criar tabela de receitas médicas (prescrições)
CREATE TABLE IF NOT EXISTS public.medical_prescriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  doctor_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text,
  prescription_file_url text,
  valid_until date,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Habilitar RLS nas novas tabelas
ALTER TABLE public.physical_evolution ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_prescriptions ENABLE ROW LEVEL SECURITY;

-- RLS para physical_evolution
CREATE POLICY "physical_evolution_select_own"
  ON public.physical_evolution FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "physical_evolution_insert_admin"
  ON public.physical_evolution FOR INSERT
  WITH CHECK (true);

CREATE POLICY "physical_evolution_update_admin"
  ON public.physical_evolution FOR UPDATE
  USING (true);

CREATE POLICY "physical_evolution_delete_admin"
  ON public.physical_evolution FOR DELETE
  USING (true);

-- RLS para medical_prescriptions
CREATE POLICY "medical_prescriptions_select_own"
  ON public.medical_prescriptions FOR SELECT
  USING (auth.uid() = patient_id);

CREATE POLICY "medical_prescriptions_insert_admin"
  ON public.medical_prescriptions FOR INSERT
  WITH CHECK (true);

CREATE POLICY "medical_prescriptions_update_admin"
  ON public.medical_prescriptions FOR UPDATE
  USING (true);

CREATE POLICY "medical_prescriptions_delete_admin"
  ON public.medical_prescriptions FOR DELETE
  USING (true);
