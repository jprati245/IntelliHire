import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Clock, CheckCircle2, XCircle, ArrowRight, Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Question {
  question: string;
  options: string[];
  correct_answer: number;
  explanation?: string;
}

interface QuizCardProps {
  questions: Question[];
  timePerQuestion?: number;
  onComplete: (results: { correct: number; total: number; answers: number[]; timeTaken: number }) => void;
  onCancel?: () => void;
}

export function QuizCard({ questions, timePerQuestion = 60, onComplete, onCancel }: QuizCardProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [answers, setAnswers] = useState<number[]>([]);
  const [showResult, setShowResult] = useState(false);
  const [timeLeft, setTimeLeft] = useState(timePerQuestion);
  const [totalTime, setTotalTime] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  const currentQuestion = questions[currentIndex];
  const progress = ((currentIndex + 1) / questions.length) * 100;

  const handleNext = useCallback(() => {
    const answer = selectedAnswer ?? -1;
    const newAnswers = [...answers, answer];
    setAnswers(newAnswers);
    setShowResult(false);
    setSelectedAnswer(null);
    setTimeLeft(timePerQuestion);

    if (currentIndex + 1 >= questions.length) {
      setIsComplete(true);
      const correct = newAnswers.filter((a, i) => a === questions[i].correct_answer).length;
      onComplete({
        correct,
        total: questions.length,
        answers: newAnswers,
        timeTaken: totalTime + (timePerQuestion - timeLeft)
      });
    } else {
      setCurrentIndex(prev => prev + 1);
    }
  }, [selectedAnswer, answers, currentIndex, questions, onComplete, timePerQuestion, totalTime, timeLeft]);

  useEffect(() => {
    if (isComplete) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          handleNext();
          return timePerQuestion;
        }
        return prev - 1;
      });
      setTotalTime(prev => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [currentIndex, isComplete, handleNext, timePerQuestion]);

  const handleSubmitAnswer = () => {
    if (selectedAnswer === null) return;
    setShowResult(true);
  };

  if (isComplete) {
    const correct = answers.filter((a, i) => a === questions[i].correct_answer).length;
    const score = Math.round((correct / questions.length) * 100);

    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Trophy className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">Quiz Complete!</CardTitle>
          <CardDescription>Here's how you performed</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center">
            <div className="text-5xl font-bold text-primary">{score}%</div>
            <p className="text-muted-foreground mt-2">
              {correct} out of {questions.length} correct
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4 text-center">
            <div className="p-4 rounded-lg bg-muted">
              <div className="text-2xl font-semibold text-success">{correct}</div>
              <div className="text-sm text-muted-foreground">Correct</div>
            </div>
            <div className="p-4 rounded-lg bg-muted">
              <div className="text-2xl font-semibold text-destructive">{questions.length - correct}</div>
              <div className="text-sm text-muted-foreground">Incorrect</div>
            </div>
          </div>
          <div className="text-center text-sm text-muted-foreground">
            Time taken: {Math.floor(totalTime / 60)}m {totalTime % 60}s
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between mb-2">
          <Badge variant="outline">
            Question {currentIndex + 1} of {questions.length}
          </Badge>
          <div className={cn(
            "flex items-center gap-1 text-sm font-medium",
            timeLeft <= 10 ? "text-destructive" : "text-muted-foreground"
          )}>
            <Clock className="h-4 w-4" />
            {timeLeft}s
          </div>
        </div>
        <Progress value={progress} className="h-2" />
        <CardTitle className="text-lg mt-4">{currentQuestion.question}</CardTitle>
      </CardHeader>
      <CardContent>
        <RadioGroup
          value={selectedAnswer?.toString()}
          onValueChange={(v) => !showResult && setSelectedAnswer(parseInt(v))}
          className="space-y-3"
        >
          {currentQuestion.options.map((option, index) => (
            <div
              key={index}
              className={cn(
                "flex items-center space-x-3 rounded-lg border p-4 transition-colors",
                showResult && index === currentQuestion.correct_answer && "border-success bg-success/10",
                showResult && selectedAnswer === index && index !== currentQuestion.correct_answer && "border-destructive bg-destructive/10",
                !showResult && selectedAnswer === index && "border-primary bg-primary/5",
                !showResult && "hover:bg-muted/50 cursor-pointer"
              )}
            >
              <RadioGroupItem value={index.toString()} id={`option-${index}`} disabled={showResult} />
              <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer">
                {option}
              </Label>
              {showResult && index === currentQuestion.correct_answer && (
                <CheckCircle2 className="h-5 w-5 text-success" />
              )}
              {showResult && selectedAnswer === index && index !== currentQuestion.correct_answer && (
                <XCircle className="h-5 w-5 text-destructive" />
              )}
            </div>
          ))}
        </RadioGroup>

        {showResult && currentQuestion.explanation && (
          <div className="mt-4 p-4 rounded-lg bg-muted">
            <p className="text-sm font-medium">Explanation:</p>
            <p className="text-sm text-muted-foreground mt-1">{currentQuestion.explanation}</p>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        {onCancel && (
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <div className="flex-1" />
        {!showResult ? (
          <Button onClick={handleSubmitAnswer} disabled={selectedAnswer === null}>
            Submit Answer
          </Button>
        ) : (
          <Button onClick={handleNext}>
            {currentIndex + 1 >= questions.length ? 'View Results' : 'Next Question'}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
