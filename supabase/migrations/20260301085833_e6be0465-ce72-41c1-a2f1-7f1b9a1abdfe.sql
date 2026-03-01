
-- Create jobs table for job postings managed by admins
CREATE TABLE public.jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  required_skills jsonb NOT NULL DEFAULT '[]'::jsonb,
  experience_level text NOT NULL DEFAULT 'entry',
  location text,
  salary_range text,
  status text NOT NULL DEFAULT 'active',
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

-- Everyone authenticated can view active jobs
CREATE POLICY "Authenticated users can view active jobs"
  ON public.jobs FOR SELECT TO authenticated
  USING (status = 'active' OR public.has_role(auth.uid(), 'admin'));

-- Only admins can insert jobs
CREATE POLICY "Admins can insert jobs"
  ON public.jobs FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Only admins can update jobs
CREATE POLICY "Admins can update jobs"
  ON public.jobs FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Only admins can delete jobs
CREATE POLICY "Admins can delete jobs"
  ON public.jobs FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Admin SELECT policies for existing tables
CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can view all resume analyses"
  ON public.resume_analyses FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can view all quiz attempts"
  ON public.quiz_attempts FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can view all mock interviews"
  ON public.mock_interviews FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can view all user roles"
  ON public.user_roles FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Admin DELETE policies
CREATE POLICY "Admins can delete profiles"
  ON public.profiles FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete resume analyses"
  ON public.resume_analyses FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Trigger for updated_at on jobs
CREATE TRIGGER update_jobs_updated_at
  BEFORE UPDATE ON public.jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
