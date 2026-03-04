import { useAuth } from '@/contexts/AuthContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Brain,
  Target,
  TrendingUp,
  Clock,
  ArrowRight,
  CheckCircle2,
  Star,
  Briefcase,
  Trophy,
  FileText,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export default function Dashboard() {
  const { user, profile } = useAuth();
  const firstName = profile?.display_name?.split(' ')[0] || 'there';

  // Fetch user scores
  const { data: userScore } = useQuery({
    queryKey: ['user-score', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('user_scores')
        .select('*')
        .eq('user_id', user?.id)
        .single();
      return data;
    },
    enabled: !!user?.id,
  });

  // Fetch recent resume analysis
  const { data: resumeAnalysis } = useQuery({
    queryKey: ['latest-resume', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('resume_analyses')
        .select('*')
        .eq('user_id', user?.id)
        .eq('analysis_status', 'completed')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      return data;
    },
    enabled: !!user?.id,
  });

  const stats = [
    {
      title: 'Quiz Score',
      value: userScore?.quiz_score || 0,
      description: userScore?.quizzes_taken ? `${userScore.quizzes_taken} quizzes taken` : 'Take a quiz to get started',
      icon: Brain,
      color: 'text-secondary',
    },
    {
      title: 'Interview Score',
      value: userScore?.interview_score || 0,
      description: userScore?.interviews_taken ? `${userScore.interviews_taken} interviews` : 'Start a mock interview',
      icon: Briefcase,
      color: 'text-success',
    },
    {
      title: 'Resume Score',
      value: resumeAnalysis?.resume_score || 0,
      description: resumeAnalysis ? 'ATS compatibility score' : 'Upload your resume',
      icon: FileText,
      color: 'text-info',
    },
    {
      title: 'Total Score',
      value: userScore?.total_score || 0,
      description: 'Combined performance',
      icon: Trophy,
      color: 'text-warning',
    },
  ];

  const quickActions = [
    {
      title: 'Take a Quiz',
      description: 'Test your CS fundamentals and aptitude',
      href: '/quiz',
      icon: Brain,
    },
    {
      title: 'Skill Gap Analysis',
      description: 'Compare your skills with job requirements',
      href: '/skill-gap',
      icon: Target,
    },
  ];

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
              Welcome back, {firstName}!
            </h1>
            <p className="text-muted-foreground">
              Track your progress and discover your career potential.
            </p>
          </div>
          <Button className="w-full md:w-auto" asChild>
            <Link to="/quiz">
              <Brain className="mr-2 h-4 w-4" />
              Start New Assessment
            </Link>
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map(stat => (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {quickActions.map((action) => (
            <Card key={action.title} className="hover:bg-muted/50 transition-colors">
              <Link to={action.href}>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <action.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{action.title}</CardTitle>
                      <CardDescription className="text-xs">{action.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Link>
            </Card>
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Profile Completion */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5 text-warning" />
                Complete Your Profile
              </CardTitle>
              <CardDescription>
                A complete profile helps us provide better career recommendations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Profile completion</span>
                  <span className="font-medium">25%</span>
                </div>
                <Progress value={25} className="h-2" />
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-success" />
                  <span>Account created</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="h-4 w-4 rounded-full border-2" />
                  <span>Add job title and industry</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="h-4 w-4 rounded-full border-2" />
                  <span>Set your career goals</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="h-4 w-4 rounded-full border-2" />
                  <span>Upload profile photo</span>
                </div>
              </div>
              <Button variant="outline" className="w-full" asChild>
                <Link to="/profile">
                  Complete Profile
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Getting Started */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Getting Started
              </CardTitle>
              <CardDescription>
                Recommended steps to maximize your career potential
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <Link
                  to="/resume-analysis"
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <div className="font-medium text-sm">Upload Resume</div>
                      <div className="text-xs text-muted-foreground">Get your ATS score</div>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </Link>
                <Link
                  to="/quiz"
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Brain className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <div className="font-medium text-sm">Take a Quiz</div>
                      <div className="text-xs text-muted-foreground">Test your knowledge</div>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </Link>
              </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
