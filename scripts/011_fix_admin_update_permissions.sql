-- Permitir que admins atualizem qualquer perfil
-- Drop the old policy that only allows updating own profile
DROP POLICY IF EXISTS profiles_update_own ON public.profiles;

-- Create new policy that allows users to update their own profile OR admins to update any profile
CREATE POLICY profiles_update_own_or_admin ON public.profiles
FOR UPDATE
USING (
  auth.uid() = id 
  OR 
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role = 'admin'
  )
);

-- Also fix insert policy to allow admins to insert for others
DROP POLICY IF EXISTS profiles_insert_own ON public.profiles;

CREATE POLICY profiles_insert_own_or_admin ON public.profiles
FOR INSERT
WITH CHECK (
  auth.uid() = id 
  OR 
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role = 'admin'
  )
);
