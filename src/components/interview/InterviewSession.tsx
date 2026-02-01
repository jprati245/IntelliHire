import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Loader2, ArrowRight, Send, CheckCircle2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Question {
  question: string;
  category: string;
  difficulty: string;
  expectedTopics: string[];
}

interface Evaluation {
  score: number;
  strengths: string[];
  improvements: string[];
  feedback: string;
}

interface InterviewSessionProps {
  questions: Question[];
  jobRole: string;
  interviewType: 'hr' | 'technical';
  onComplete: (answers: string[]) => Promise<{
    evaluations: Evaluation[];
    overallScore: number;
    overallFeedback: string;
    recommendation: string;
  }>;
  onCancel?: () => void;
}

export function InterviewSession({ 
  questions, 
  jobRole, 
  interviewType, 
  onComplete, 
  onCancel 
}: InterviewSessionProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [answers, setAnswers] = useState<string[]>([]);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [results, setResults] = useState<{
    evaluations: Evaluation[];
    overallScore: number;
    overallFeedback: string;
    recommendation: string;
  } | null>(null);

  const currentQuestion = questions[currentIndex];
  const progress = ((currentIndex + 1) / questions.length) * 100;
  const isLastQuestion = currentIndex + 1 >= questions.length;

  const handleNext = async () => {
    const newAnswers = [...answers, currentAnswer];
    setAnswers(newAnswers);
    
    if (isLastQuestion) {
      setIsEvaluating(true);
      try {
        const result = await onComplete(newAnswers);
        setResults(result);
      } catch (error) {
        console.error('Evaluation failed:', error);
      } finally {
        setIsEvaluating(false);
      }
    } else {
      setCurrentIndex(prev => prev + 1);
      setCurrentAnswer('');
    }
  };

  if (isEvaluating) {
    return (
      <Card className="w-full max-w-3xl mx-auto">
        <CardContent className="py-16 text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
          <h3 className="mt-4 text-lg font-medium">Evaluating Your Interview</h3>
          <p className="text-muted-foreground mt-2">
            Our AI is analyzing your responses...
          </p>
        </CardContent>
      </Card>
    );
  }

  if (results) {
    const getRecommendationColor = (rec: string) => {
      switch (rec) {
        case 'Strong Hire': return 'text-success';
        case 'Hire': return 'text-primary';
        case 'Maybe': return 'text-warning';
        case 'No Hire': return 'text-destructive';
        default: return 'text-muted-foreground';
      }
    };

    return (
      <div className="space-y-6 max-w-3xl mx-auto">
        {/* Overall Results */}
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Interview Complete</CardTitle>
            <CardDescription>{jobRole} - {interviewType.toUpperCase()} Interview</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center">
              <div className="text-5xl font-bold text-primary">{results.overallScore}%</div>
              <p className={cn("text-lg font-medium mt-2", getRecommendationColor(results.recommendation))}>
                {results.recommendation}
              </p>
            </div>
            <div className="p-4 rounded-lg bg-muted">
              <p className="text-sm">{results.overallFeedback}</p>
            </div>
          </CardContent>
        </Card>

        {/* Individual Question Feedback */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Detailed Feedback</h3>
          {questions.map((q, i) => (
            <Card key={i}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <Badge variant="outline">{q.category}</Badge>
                  <span className={cn(
                    "text-sm font-medium",
                    results.evaluations[i]?.score >= 70 ? "text-success" : 
                    results.evaluations[i]?.score >= 50 ? "text-warning" : "text-destructive"
                  )}>
                    {results.evaluations[i]?.score || 0}%
                  </span>
                </div>
                <CardTitle className="text-base mt-2">{q.question}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="p-3 rounded bg-muted text-sm">
                  <p className="font-medium text-muted-foreground">Your Answer:</p>
                  <p className="mt-1">{answers[i] || 'No answer provided'}</p>
                </div>
                {results.evaluations[i] && (
                  <>
                    {results.evaluations[i].strengths.length > 0 && (
                      <div className="flex gap-2">
                        <CheckCircle2 className="h-4 w-4 text-success flex-shrink-0 mt-0.5" />
                        <div className="text-sm">
                          <span className="font-medium">Strengths:</span>{' '}
                          {results.evaluations[i].strengths.join(', ')}
                        </div>
                      </div>
                    )}
                    {results.evaluations[i].improvements.length > 0 && (
                      <div className="flex gap-2">
                        <AlertCircle className="h-4 w-4 text-warning flex-shrink-0 mt-0.5" />
                        <div className="text-sm">
                          <span className="font-medium">Improvements:</span>{' '}
                          {results.evaluations[i].improvements.join(', ')}
                        </div>
                      </div>
                    )}
                    <p className="text-sm text-muted-foreground">{results.evaluations[i].feedback}</p>
                  </>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between mb-2">
          <Badge variant="outline">
            Question {currentIndex + 1} of {questions.length}
          </Badge>
          <Badge variant={currentQuestion.difficulty === 'hard' ? 'destructive' : 
                         currentQuestion.difficulty === 'medium' ? 'default' : 'secondary'}>
            {currentQuestion.difficulty}
          </Badge>
        </div>
        <Progress value={progress} className="h-2" />
        <div className="flex items-center gap-2 mt-4">
          <Badge variant="outline" className="text-xs">{currentQuestion.category}</Badge>
        </div>
        <CardTitle className="text-lg mt-2">{currentQuestion.question}</CardTitle>
        <CardDescription className="text-xs mt-2">
          Key topics to cover: {currentQuestion.expectedTopics.join(', ')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Textarea
          placeholder="Type your answer here..."
          value={currentAnswer}
          onChange={(e) => setCurrentAnswer(e.target.value)}
          className="min-h-[200px] resize-none"
        />
        <p className="text-xs text-muted-foreground mt-2">
          {currentAnswer.length} characters
        </p>
      </CardContent>
      <CardFooter className="flex justify-between">
        {onCancel && (
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <div className="flex-1" />
        <Button onClick={handleNext} disabled={!currentAnswer.trim()}>
          {isLastQuestion ? (
            <>
              Submit Interview
              <Send className="ml-2 h-4 w-4" />
            </>
          ) : (
            <>
              Next Question
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
