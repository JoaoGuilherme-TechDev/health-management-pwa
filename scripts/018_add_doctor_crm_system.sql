-- Add doctor legal information fields to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS doctor_crm TEXT,
ADD COLUMN IF NOT EXISTS doctor_full_name TEXT,
ADD COLUMN IF NOT EXISTS doctor_specialization TEXT,
ADD COLUMN IF NOT EXISTS doctor_registration_state TEXT,
ADD COLUMN IF NOT EXISTS professional_address TEXT,
ADD COLUMN IF NOT EXISTS professional_phone TEXT;

-- Add doctor_crm to all content tables
ALTER TABLE medications ADD COLUMN IF NOT EXISTS doctor_crm TEXT;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS doctor_crm TEXT;
ALTER TABLE medical_prescriptions ADD COLUMN IF NOT EXISTS doctor_crm TEXT;
ALTER TABLE patient_diet_recipes ADD COLUMN IF NOT EXISTS doctor_crm TEXT;
ALTER TABLE patient_supplements ADD COLUMN IF NOT EXISTS doctor_crm TEXT;
ALTER TABLE physical_evolution ADD COLUMN IF NOT EXISTS doctor_crm TEXT;
ALTER TABLE health_metrics ADD COLUMN IF NOT EXISTS doctor_crm TEXT;
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS doctor_crm TEXT;
ALTER TABLE supplements ADD COLUMN IF NOT EXISTS doctor_crm TEXT;

-- Add doctor_name to all content tables for easy display
ALTER TABLE medications ADD COLUMN IF NOT EXISTS doctor_name TEXT;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS doctor_name TEXT;
ALTER TABLE medical_prescriptions ADD COLUMN IF NOT EXISTS doctor_name TEXT;
ALTER TABLE patient_diet_recipes ADD COLUMN IF NOT EXISTS doctor_name TEXT;
ALTER TABLE patient_supplements ADD COLUMN IF NOT EXISTS doctor_name TEXT;
ALTER TABLE physical_evolution ADD COLUMN IF NOT EXISTS doctor_name TEXT;
ALTER TABLE health_metrics ADD COLUMN IF NOT EXISTS doctor_name TEXT;
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS doctor_name TEXT;
ALTER TABLE supplements ADD COLUMN IF NOT EXISTS doctor_name TEXT;

-- Create function to get doctor info
CREATE OR REPLACE FUNCTION get_doctor_info()
RETURNS TABLE (
  doctor_crm TEXT,
  doctor_name TEXT,
  doctor_specialization TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.doctor_crm,
    CONCAT(p.first_name, ' ', p.last_name) as doctor_name,
    p.doctor_specialization
  FROM profiles p
  WHERE p.id = auth.uid() AND p.role = 'admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
