-- Add defensive checks to SECURITY DEFINER trigger functions
-- These ensure user_id matches authenticated user even if RLS is bypassed

-- Update update_user_quiz_score with defensive check
CREATE OR REPLACE FUNCTION public.update_user_quiz_score()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Defensive check: ensure user_id matches authenticated user
  IF NEW.user_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'user_id must match authenticated user';
  END IF;

  INSERT INTO public.user_scores (user_id, quiz_score, quizzes_taken, updated_at)
  VALUES (NEW.user_id, NEW.score, 1, now())
  ON CONFLICT (user_id) DO UPDATE SET
    quiz_score = (
      SELECT COALESCE(AVG(score), 0)::INTEGER
      FROM public.quiz_attempts
      WHERE user_id = NEW.user_id
    ),
    quizzes_taken = user_scores.quizzes_taken + 1,
    total_score = (
      SELECT COALESCE(AVG(score), 0)::INTEGER
      FROM public.quiz_attempts
      WHERE user_id = NEW.user_id
    ) + user_scores.interview_score + user_scores.resume_score,
    updated_at = now();
  RETURN NEW;
END;
$$;

-- Update update_user_interview_score with defensive check
CREATE OR REPLACE FUNCTION public.update_user_interview_score()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Defensive check: ensure user_id matches authenticated user
  IF NEW.user_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'user_id must match authenticated user';
  END IF;

  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    INSERT INTO public.user_scores (user_id, interview_score, interviews_taken, updated_at)
    VALUES (NEW.user_id, NEW.overall_score, 1, now())
    ON CONFLICT (user_id) DO UPDATE SET
      interview_score = (
        SELECT COALESCE(AVG(overall_score), 0)::INTEGER
        FROM public.mock_interviews
        WHERE user_id = NEW.user_id AND status = 'completed'
      ),
      interviews_taken = user_scores.interviews_taken + 1,
      total_score = user_scores.quiz_score + (
        SELECT COALESCE(AVG(overall_score), 0)::INTEGER
        FROM public.mock_interviews
        WHERE user_id = NEW.user_id AND status = 'completed'
      ) + user_scores.resume_score,
      updated_at = now();
  END IF;
  RETURN NEW;
END;
$$;