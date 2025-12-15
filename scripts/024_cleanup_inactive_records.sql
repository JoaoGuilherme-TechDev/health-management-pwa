-- Remove all inactive medications, supplements, and other records
-- Since we switched from soft delete (is_active) to hard delete, 
-- we need to clean up old inactive records

-- Delete inactive medications
DELETE FROM medications WHERE is_active = false;

-- Delete inactive supplements  
DELETE FROM patient_supplements WHERE is_active = false;

-- Note: After this cleanup, consider dropping the is_active columns
-- in a future migration if they're no longer needed
