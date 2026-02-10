
-- Optimizing indexes for performance

-- Appointments
CREATE INDEX IF NOT EXISTS idx_appointments_patient_id ON appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_doctor_id ON appointments(doctor_id);
CREATE INDEX IF NOT EXISTS idx_appointments_scheduled_at ON appointments(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);

-- Medications
CREATE INDEX IF NOT EXISTS idx_medications_user_id ON medications(user_id);
CREATE INDEX IF NOT EXISTS idx_medications_prescribing_doctor ON medications(prescribing_doctor);

-- Medical Prescriptions
CREATE INDEX IF NOT EXISTS idx_medical_prescriptions_patient_id ON medical_prescriptions(patient_id);
CREATE INDEX IF NOT EXISTS idx_medical_prescriptions_doctor_id ON medical_prescriptions(doctor_id);

-- Physical Evolution
CREATE INDEX IF NOT EXISTS idx_physical_evolution_user_id ON physical_evolution(user_id);
CREATE INDEX IF NOT EXISTS idx_physical_evolution_measured_at ON physical_evolution(measured_at);

-- Notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);
-- CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);

-- Profiles (Role is often queried)
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- Supplements
CREATE INDEX IF NOT EXISTS idx_supplement_catalog_name ON supplement_catalog(name);

-- Recipes
CREATE INDEX IF NOT EXISTS idx_recipes_title ON recipes(title);
