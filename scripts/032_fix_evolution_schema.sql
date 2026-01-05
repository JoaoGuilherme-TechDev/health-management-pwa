-- Fix numeric field overflow in physical_evolution table
-- Increase precision for all numeric fields to prevent overflow errors

ALTER TABLE public.physical_evolution 
  ALTER COLUMN weight TYPE numeric(10,2),
  ALTER COLUMN height TYPE numeric(10,2),
  ALTER COLUMN muscle_mass TYPE numeric(10,2),
  ALTER COLUMN body_fat_percentage TYPE numeric(10,2),
  ALTER COLUMN visceral_fat TYPE numeric(10,2),
  ALTER COLUMN bmr TYPE numeric(10,2),
  ALTER COLUMN body_water_percentage TYPE numeric(10,2),
  ALTER COLUMN bone_mass TYPE numeric(10,2);
