-- Quiz questions table (for pre-defined questions)
CREATE TABLE public.quiz_questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category TEXT NOT NULL,
  topic TEXT NOT NULL,
  question TEXT NOT NULL,
  options JSONB NOT NULL DEFAULT '[]'::jsonb,
  correct_answer INTEGER NOT NULL,
  difficulty TEXT NOT NULL DEFAULT 'medium',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Quiz attempts table (stores user quiz results)
CREATE TABLE public.quiz_attempts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  category TEXT NOT NULL,
  topic TEXT NOT NULL,
  total_questions INTEGER NOT NULL,
  correct_answers INTEGER NOT NULL,
  score INTEGER NOT NULL DEFAULT 0,
  time_taken_seconds INTEGER NOT NULL DEFAULT 0,
  answers JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Mock interviews table
CREATE TABLE public.mock_interviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  job_role TEXT NOT NULL,
  interview_type TEXT NOT NULL DEFAULT 'hr',
  questions JSONB NOT NULL DEFAULT '[]'::jsonb,
  answers JSONB NOT NULL DEFAULT '[]'::jsonb,
  evaluations JSONB NOT NULL DEFAULT '[]'::jsonb,
  overall_score INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'in_progress',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- User scores table (aggregated scores for ranking)
CREATE TABLE public.user_scores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  resume_score INTEGER NOT NULL DEFAULT 0,
  quiz_score INTEGER NOT NULL DEFAULT 0,
  interview_score INTEGER NOT NULL DEFAULT 0,
  total_score INTEGER NOT NULL DEFAULT 0,
  quizzes_taken INTEGER NOT NULL DEFAULT 0,
  interviews_taken INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Skill gap analysis table
CREATE TABLE public.skill_gap_analyses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  target_role TEXT NOT NULL,
  user_skills JSONB NOT NULL DEFAULT '[]'::jsonb,
  required_skills JSONB NOT NULL DEFAULT '[]'::jsonb,
  missing_skills JSONB NOT NULL DEFAULT '[]'::jsonb,
  matching_skills JSONB NOT NULL DEFAULT '[]'::jsonb,
  recommendations JSONB NOT NULL DEFAULT '[]'::jsonb,
  match_percentage INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mock_interviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skill_gap_analyses ENABLE ROW LEVEL SECURITY;

-- Quiz questions are readable by everyone (public quiz bank)
CREATE POLICY "Anyone can read quiz questions"
ON public.quiz_questions
FOR SELECT
USING (true);

-- Quiz attempts policies
CREATE POLICY "Users can view their own quiz attempts"
ON public.quiz_attempts
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own quiz attempts"
ON public.quiz_attempts
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Mock interviews policies
CREATE POLICY "Users can view their own interviews"
ON public.mock_interviews
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own interviews"
ON public.mock_interviews
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own interviews"
ON public.mock_interviews
FOR UPDATE
USING (auth.uid() = user_id);

-- User scores policies
CREATE POLICY "Users can view all scores for leaderboard"
ON public.user_scores
FOR SELECT
USING (true);

CREATE POLICY "Users can insert their own scores"
ON public.user_scores
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own scores"
ON public.user_scores
FOR UPDATE
USING (auth.uid() = user_id);

-- Skill gap analyses policies
CREATE POLICY "Users can view their own skill gaps"
ON public.skill_gap_analyses
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own skill gaps"
ON public.skill_gap_analyses
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Function to update user scores when quiz is completed
CREATE OR REPLACE FUNCTION public.update_user_quiz_score()
RETURNS TRIGGER AS $$
BEGIN
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger for quiz score updates
CREATE TRIGGER on_quiz_attempt_insert
AFTER INSERT ON public.quiz_attempts
FOR EACH ROW
EXECUTE FUNCTION public.update_user_quiz_score();

-- Function to update user scores when interview is completed
CREATE OR REPLACE FUNCTION public.update_user_interview_score()
RETURNS TRIGGER AS $$
BEGIN
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger for interview score updates
CREATE TRIGGER on_interview_complete
AFTER UPDATE ON public.mock_interviews
FOR EACH ROW
EXECUTE FUNCTION public.update_user_interview_score();

-- Seed some initial quiz questions
INSERT INTO public.quiz_questions (category, topic, question, options, correct_answer, difficulty) VALUES
-- Data Structures
('cs_fundamentals', 'data_structures', 'What is the time complexity of searching in a balanced binary search tree?', '["O(1)", "O(log n)", "O(n)", "O(n log n)"]', 1, 'medium'),
('cs_fundamentals', 'data_structures', 'Which data structure uses LIFO (Last In First Out) principle?', '["Queue", "Stack", "Array", "Linked List"]', 1, 'easy'),
('cs_fundamentals', 'data_structures', 'What is the space complexity of a hash table?', '["O(1)", "O(log n)", "O(n)", "O(n²)"]', 2, 'medium'),
('cs_fundamentals', 'data_structures', 'Which traversal visits the root node first?', '["Inorder", "Preorder", "Postorder", "Level order"]', 1, 'easy'),
('cs_fundamentals', 'data_structures', 'What is the worst-case time complexity of quicksort?', '["O(n)", "O(n log n)", "O(n²)", "O(log n)"]', 2, 'hard'),
-- Algorithms
('cs_fundamentals', 'algorithms', 'Which sorting algorithm has the best average-case time complexity?', '["Bubble Sort", "Selection Sort", "Merge Sort", "Insertion Sort"]', 2, 'medium'),
('cs_fundamentals', 'algorithms', 'What technique does dynamic programming use?', '["Recursion only", "Iteration only", "Memoization", "Brute force"]', 2, 'medium'),
('cs_fundamentals', 'algorithms', 'BFS uses which data structure?', '["Stack", "Queue", "Heap", "Tree"]', 1, 'easy'),
('cs_fundamentals', 'algorithms', 'What is the time complexity of binary search?', '["O(1)", "O(n)", "O(log n)", "O(n²)"]', 2, 'easy'),
('cs_fundamentals', 'algorithms', 'Which algorithm is used to find the shortest path in a weighted graph?', '["DFS", "BFS", "Dijkstra", "Prim"]', 2, 'hard'),
-- Aptitude - Logical Reasoning
('aptitude', 'logical_reasoning', 'If A is B''s brother, B is C''s sister, and C is D''s father, how is A related to D?', '["Uncle", "Grandfather", "Father", "Brother"]', 0, 'medium'),
('aptitude', 'logical_reasoning', 'Complete the series: 2, 6, 12, 20, 30, ?', '["40", "42", "44", "36"]', 1, 'medium'),
('aptitude', 'logical_reasoning', 'If COMPUTER is coded as RFUVQNPC, how is PRINTER coded?', '["QSJOUFQ", "SFUOJSQ", "QSJOUSF", "OSJUQFS"]', 0, 'hard'),
-- Aptitude - Quantitative
('aptitude', 'quantitative', 'A train 150m long passes a pole in 15 seconds. What is its speed?', '["36 km/hr", "10 m/s", "Both A and B", "None"]', 2, 'easy'),
('aptitude', 'quantitative', 'If the ratio of ages of A and B is 3:5 and their sum is 40, find A''s age.', '["15", "20", "25", "12"]', 0, 'easy'),
('aptitude', 'quantitative', 'A work can be done by 12 men in 10 days. How many men are needed to finish it in 6 days?', '["18", "20", "15", "24"]', 1, 'medium');