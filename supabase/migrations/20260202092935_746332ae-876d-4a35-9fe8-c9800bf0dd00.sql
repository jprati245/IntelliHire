-- Fix 1: Update quiz_questions RLS policy to require authentication
DROP POLICY IF EXISTS "Anyone can read quiz questions" ON public.quiz_questions;

CREATE POLICY "Authenticated users can read quiz questions" 
ON public.quiz_questions 
FOR SELECT 
TO authenticated
USING (true);

-- Fix 2: Enhance has_role function with caller validation
-- This ensures users can only check their own role unless they're an admin
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
      AND (
        auth.uid() = _user_id 
        OR EXISTS(SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
      )
  )
$$;