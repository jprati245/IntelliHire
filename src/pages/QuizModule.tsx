import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { QuizCard } from '@/components/quiz/QuizCard';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Loader2, Brain, Code, Calculator, Trophy, Clock, Target } from 'lucide-react';

interface Question {
  question: string;
  options: string[];
  correct_answer: number;
  explanation?: string;
}

const quizCategories = [
  { value: 'cs_fundamentals', label: 'CS Fundamentals', icon: Code, description: 'Data structures, algorithms, and core CS concepts' },
  { value: 'aptitude', label: 'Aptitude', icon: Calculator, description: 'Logical reasoning and quantitative aptitude' },
];

const quizTopics: Record<string, { value: string; label: string }[]> = {
  cs_fundamentals: [
    { value: 'data_structures', label: 'Data Structures' },
    { value: 'algorithms', label: 'Algorithms' },
    { value: 'mixed', label: 'Mixed' },
  ],
  aptitude: [
    { value: 'logical_reasoning', label: 'Logical Reasoning' },
    { value: 'quantitative', label: 'Quantitative Aptitude' },
    { value: 'mixed', label: 'Mixed' },
  ],
};

const difficulties = [
  { value: 'easy', label: 'Easy' },
  { value: 'medium', label: 'Medium' },
  { value: 'hard', label: 'Hard' },
];

export default function QuizModule() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedTopic, setSelectedTopic] = useState<string>('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('medium');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isQuizActive, setIsQuizActive] = useState(false);

  // Fetch user's quiz history
  const { data: quizHistory, isLoading: historyLoading } = useQuery({
    queryKey: ['quiz-history', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quiz_attempts')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Generate or fetch quiz questions
  const generateQuizMutation = useMutation({
    mutationFn: async () => {
      // First try to get pre-defined questions from database
      let query = supabase.from('quiz_questions').select('*');
      
      if (selectedCategory) {
        query = query.eq('category', selectedCategory);
      }
      if (selectedTopic && selectedTopic !== 'mixed') {
        query = query.eq('topic', selectedTopic);
      }
      if (selectedDifficulty) {
        query = query.eq('difficulty', selectedDifficulty);
      }
      
      const { data: dbQuestions } = await query.limit(10);
      
      if (dbQuestions && dbQuestions.length >= 5) {
        // Shuffle and return database questions
        const shuffled = dbQuestions.sort(() => Math.random() - 0.5).slice(0, 5);
        return shuffled.map(q => ({
          question: q.question,
          options: q.options as string[],
          correct_answer: q.correct_answer,
        }));
      }
      
      // Fallback to AI-generated questions
      const response = await supabase.functions.invoke('generate-quiz', {
        body: {
          category: selectedCategory,
          topic: selectedTopic !== 'mixed' ? selectedTopic : undefined,
          count: 5,
          difficulty: selectedDifficulty,
        },
      });
      
      if (response.error) throw response.error;
      return response.data.questions;
    },
    onSuccess: (data) => {
      setQuestions(data);
      setIsQuizActive(true);
    },
    onError: (error) => {
      console.error('Failed to generate quiz:', error);
      toast.error('Failed to generate quiz. Please try again.');
    },
  });

  // Save quiz result
  const saveResultMutation = useMutation({
    mutationFn: async (result: { correct: number; total: number; answers: number[]; timeTaken: number }) => {
      const score = Math.round((result.correct / result.total) * 100);
      
      const { error } = await supabase.from('quiz_attempts').insert({
        user_id: user?.id,
        category: selectedCategory,
        topic: selectedTopic || 'mixed',
        total_questions: result.total,
        correct_answers: result.correct,
        score,
        time_taken_seconds: result.timeTaken,
        answers: result.answers,
      });
      
      if (error) throw error;
      return score;
    },
    onSuccess: (score) => {
      toast.success(`Quiz completed! Score: ${score}%`);
      queryClient.invalidateQueries({ queryKey: ['quiz-history'] });
      queryClient.invalidateQueries({ queryKey: ['user-scores'] });
    },
    onError: (error) => {
      console.error('Failed to save quiz result:', error);
      toast.error('Failed to save result. Please try again.');
    },
  });

  const handleQuizComplete = (result: { correct: number; total: number; answers: number[]; timeTaken: number }) => {
    saveResultMutation.mutate(result);
  };

  const handleStartQuiz = () => {
    if (!selectedCategory) {
      toast.error('Please select a category');
      return;
    }
    generateQuizMutation.mutate();
  };

  const handleReturnToSelection = () => {
    setIsQuizActive(false);
    setQuestions([]);
  };

  if (isQuizActive && questions.length > 0) {
    return (
      <AppLayout>
        <div className="max-w-3xl mx-auto">
          <QuizCard
            questions={questions}
            timePerQuestion={selectedDifficulty === 'hard' ? 45 : selectedDifficulty === 'easy' ? 90 : 60}
            onComplete={handleQuizComplete}
            onCancel={handleReturnToSelection}
          />
          <div className="mt-4 text-center">
            <Button variant="outline" onClick={handleReturnToSelection}>
              Exit Quiz
            </Button>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Quiz Module</h1>
          <p className="text-muted-foreground">
            Test your knowledge with MCQ-based assessments
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Quiz Configuration */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-primary" />
                  Start a Quiz
                </CardTitle>
                <CardDescription>
                  Select your category and preferences to begin
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Category Selection */}
                <div className="grid gap-4 sm:grid-cols-2">
                  {quizCategories.map((cat) => (
                    <button
                      key={cat.value}
                      onClick={() => {
                        setSelectedCategory(cat.value);
                        setSelectedTopic('');
                      }}
                      className={`p-4 rounded-lg border text-left transition-colors ${
                        selectedCategory === cat.value
                          ? 'border-primary bg-primary/5'
                          : 'hover:bg-muted/50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <cat.icon className={`h-5 w-5 ${selectedCategory === cat.value ? 'text-primary' : 'text-muted-foreground'}`} />
                        <div>
                          <div className="font-medium">{cat.label}</div>
                          <div className="text-xs text-muted-foreground">{cat.description}</div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>

                {selectedCategory && (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Topic</label>
                      <Select value={selectedTopic} onValueChange={setSelectedTopic}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select topic" />
                        </SelectTrigger>
                        <SelectContent>
                          {quizTopics[selectedCategory]?.map((topic) => (
                            <SelectItem key={topic.value} value={topic.value}>
                              {topic.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Difficulty</label>
                      <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {difficulties.map((d) => (
                            <SelectItem key={d.value} value={d.value}>
                              {d.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}

                <Button
                  className="w-full"
                  size="lg"
                  onClick={handleStartQuiz}
                  disabled={!selectedCategory || generateQuizMutation.isPending}
                >
                  {generateQuizMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating Quiz...
                    </>
                  ) : (
                    <>
                      <Brain className="mr-2 h-4 w-4" />
                      Start Quiz
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Quiz History */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-warning" />
                  Recent Attempts
                </CardTitle>
              </CardHeader>
              <CardContent>
                {historyLoading ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : quizHistory && quizHistory.length > 0 ? (
                  <div className="space-y-3">
                    {quizHistory.map((attempt) => (
                      <div key={attempt.id} className="p-3 rounded-lg border bg-card">
                        <div className="flex items-center justify-between mb-1">
                          <Badge variant="outline" className="text-xs">
                            {attempt.category.replace('_', ' ')}
                          </Badge>
                          <span className={`text-sm font-medium ${
                            attempt.score >= 70 ? 'text-success' : 
                            attempt.score >= 50 ? 'text-warning' : 'text-destructive'
                          }`}>
                            {attempt.score}%
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
                          <span className="flex items-center gap-1">
                            <Target className="h-3 w-3" />
                            {attempt.correct_answers}/{attempt.total_questions}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {Math.floor(attempt.time_taken_seconds / 60)}m
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No quizzes taken yet
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
