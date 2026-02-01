import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { InterviewSession } from '@/components/interview/InterviewSession';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Loader2, Users, Code2, Briefcase, Clock, Target, TrendingUp } from 'lucide-react';

interface InterviewQuestion {
  question: string;
  category: string;
  difficulty: string;
  expectedTopics: string[];
}

const jobRoles = [
  { value: 'Frontend Developer', icon: Code2 },
  { value: 'Backend Developer', icon: Code2 },
  { value: 'Full-Stack Developer', icon: Code2 },
  { value: 'DevOps Engineer', icon: Code2 },
  { value: 'Data Scientist', icon: TrendingUp },
  { value: 'Data Analyst', icon: TrendingUp },
  { value: 'ML Engineer', icon: TrendingUp },
  { value: 'Mobile Developer', icon: Code2 },
];

const interviewTypes = [
  { value: 'hr', label: 'HR Interview', description: 'Behavioral and soft skills assessment', icon: Users },
  { value: 'technical', label: 'Technical Interview', description: 'Role-specific technical questions', icon: Code2 },
];

export default function MockInterview() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [selectedType, setSelectedType] = useState<'hr' | 'technical'>('hr');
  const [questions, setQuestions] = useState<InterviewQuestion[]>([]);
  const [isInterviewActive, setIsInterviewActive] = useState(false);
  const [currentInterviewId, setCurrentInterviewId] = useState<string | null>(null);

  // Fetch user's interview history
  const { data: interviewHistory, isLoading: historyLoading } = useQuery({
    queryKey: ['interview-history', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mock_interviews')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Generate interview questions
  const generateInterviewMutation = useMutation({
    mutationFn: async () => {
      const response = await supabase.functions.invoke('generate-interview', {
        body: {
          jobRole: selectedRole,
          interviewType: selectedType,
          count: 5,
        },
      });
      
      if (response.error) throw response.error;
      return response.data.questions;
    },
    onSuccess: async (generatedQuestions) => {
      // Create interview record in database
      const { data, error } = await supabase.from('mock_interviews').insert({
        user_id: user?.id,
        job_role: selectedRole,
        interview_type: selectedType,
        questions: generatedQuestions,
        status: 'in_progress',
      }).select().single();
      
      if (error) throw error;
      
      setCurrentInterviewId(data.id);
      setQuestions(generatedQuestions);
      setIsInterviewActive(true);
    },
    onError: (error) => {
      console.error('Failed to generate interview:', error);
      toast.error('Failed to generate interview questions. Please try again.');
    },
  });

  // Evaluate and save interview results
  const completeInterviewMutation = useMutation({
    mutationFn: async (answers: string[]) => {
      // Evaluate answers via AI
      const evalResponse = await supabase.functions.invoke('evaluate-interview', {
        body: {
          questions,
          answers,
          jobRole: selectedRole,
          interviewType: selectedType,
        },
      });
      
      if (evalResponse.error) throw evalResponse.error;
      
      const result = evalResponse.data;
      
      // Update interview record
      const { error } = await supabase.from('mock_interviews')
        .update({
          answers,
          evaluations: result.evaluations,
          overall_score: result.overallScore,
          status: 'completed',
          completed_at: new Date().toISOString(),
        })
        .eq('id', currentInterviewId);
      
      if (error) throw error;
      
      return result;
    },
    onSuccess: (result) => {
      toast.success(`Interview completed! Score: ${result.overallScore}%`);
      queryClient.invalidateQueries({ queryKey: ['interview-history'] });
      queryClient.invalidateQueries({ queryKey: ['user-scores'] });
    },
    onError: (error) => {
      console.error('Failed to evaluate interview:', error);
      toast.error('Failed to evaluate interview. Please try again.');
    },
  });

  const handleInterviewComplete = async (answers: string[]) => {
    return completeInterviewMutation.mutateAsync(answers);
  };

  const handleStartInterview = () => {
    if (!selectedRole) {
      toast.error('Please select a job role');
      return;
    }
    generateInterviewMutation.mutate();
  };

  const handleReturnToSelection = () => {
    setIsInterviewActive(false);
    setQuestions([]);
    setCurrentInterviewId(null);
  };

  if (isInterviewActive && questions.length > 0) {
    return (
      <AppLayout>
        <div className="max-w-4xl mx-auto">
          <InterviewSession
            questions={questions}
            jobRole={selectedRole}
            interviewType={selectedType}
            onComplete={handleInterviewComplete}
            onCancel={handleReturnToSelection}
          />
          <div className="mt-4 text-center">
            <Button variant="outline" onClick={handleReturnToSelection}>
              Exit Interview
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
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">AI Mock Interview</h1>
          <p className="text-muted-foreground">
            Practice interviews with AI-powered evaluation
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Interview Configuration */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5 text-primary" />
                  Start Mock Interview
                </CardTitle>
                <CardDescription>
                  Select your target role and interview type
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Job Role Selection */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Target Job Role</label>
                  <Select value={selectedRole} onValueChange={setSelectedRole}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a job role" />
                    </SelectTrigger>
                    <SelectContent>
                      {jobRoles.map((role) => (
                        <SelectItem key={role.value} value={role.value}>
                          <div className="flex items-center gap-2">
                            <role.icon className="h-4 w-4" />
                            {role.value}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Interview Type Selection */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Interview Type</label>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {interviewTypes.map((type) => (
                      <button
                        key={type.value}
                        onClick={() => setSelectedType(type.value as 'hr' | 'technical')}
                        className={`p-4 rounded-lg border text-left transition-colors ${
                          selectedType === type.value
                            ? 'border-primary bg-primary/5'
                            : 'hover:bg-muted/50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <type.icon className={`h-5 w-5 ${selectedType === type.value ? 'text-primary' : 'text-muted-foreground'}`} />
                          <div>
                            <div className="font-medium">{type.label}</div>
                            <div className="text-xs text-muted-foreground">{type.description}</div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <Button
                  className="w-full"
                  size="lg"
                  onClick={handleStartInterview}
                  disabled={!selectedRole || generateInterviewMutation.isPending}
                >
                  {generateInterviewMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating Questions...
                    </>
                  ) : (
                    <>
                      <Briefcase className="mr-2 h-4 w-4" />
                      Start Interview
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Interview History */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  Recent Interviews
                </CardTitle>
              </CardHeader>
              <CardContent>
                {historyLoading ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : interviewHistory && interviewHistory.length > 0 ? (
                  <div className="space-y-3">
                    {interviewHistory.map((interview) => (
                      <div key={interview.id} className="p-3 rounded-lg border bg-card">
                        <div className="flex items-center justify-between mb-1">
                          <div className="font-medium text-sm truncate">{interview.job_role}</div>
                          {interview.status === 'completed' ? (
                            <span className={`text-sm font-medium ${
                              interview.overall_score >= 70 ? 'text-success' : 
                              interview.overall_score >= 50 ? 'text-warning' : 'text-destructive'
                            }`}>
                              {interview.overall_score}%
                            </span>
                          ) : (
                            <Badge variant="secondary" className="text-xs">In Progress</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline" className="text-xs">
                            {interview.interview_type.toUpperCase()}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {new Date(interview.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No interviews taken yet
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
