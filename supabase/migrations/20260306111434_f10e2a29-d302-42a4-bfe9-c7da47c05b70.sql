
-- Allow admins to insert quiz questions
CREATE POLICY "Admins can insert quiz questions"
ON public.quiz_questions
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to update quiz questions
CREATE POLICY "Admins can update quiz questions"
ON public.quiz_questions
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to delete quiz questions
CREATE POLICY "Admins can delete quiz questions"
ON public.quiz_questions
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));
