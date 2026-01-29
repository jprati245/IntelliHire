import { useAuth } from '@/contexts/AuthContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  ClipboardList,
  Target,
  TrendingUp,
  Clock,
  ArrowRight,
  CheckCircle2,
  Star,
} from 'lucide-react';

const stats = [
  {
    title: 'Assessments Completed',
    value: '0',
    description: 'Get started with your first assessment',
    icon: ClipboardList,
    color: 'text-secondary',
  },
  {
    title: 'Skills Identified',
    value: '0',
    description: 'Complete assessments to identify skills',
    icon: Target,
    color: 'text-success',
  },
  {
    title: 'Career Matches',
    value: '0',
    description: 'Discover your ideal career paths',
    icon: TrendingUp,
    color: 'text-info',
  },
  {
    title: 'Time Invested',
    value: '0h',
    description: 'Time spent on assessments',
    icon: Clock,
    color: 'text-warning',
  },
];

const recommendedAssessments = [
  {
    title: 'Technical Skills Assessment',
    description: 'Evaluate your proficiency in technical areas',
    duration: '30 min',
    difficulty: 'Intermediate',
  },
  {
    title: 'Problem Solving Aptitude',
    description: 'Test your analytical and logical thinking',
    duration: '25 min',
    difficulty: 'Advanced',
  },
  {
    title: 'Communication Skills',
    description: 'Assess your verbal and written communication',
    duration: '20 min',
    difficulty: 'Beginner',
  },
];

export default function Dashboard() {
  const { profile } = useAuth();

  const firstName = profile?.display_name?.split(' ')[0] || 'there';

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
          <Button className="w-full md:w-auto">
            <ClipboardList className="mr-2 h-4 w-4" />
            Start New Assessment
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
                <a href="/profile">
                  Complete Profile
                  <ArrowRight className="ml-2 h-4 w-4" />
                </a>
              </Button>
            </CardContent>
          </Card>

          {/* Recommended Assessments */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5 text-secondary" />
                Recommended Assessments
              </CardTitle>
              <CardDescription>
                Based on your profile and career goals
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {recommendedAssessments.map((assessment, index) => (
                <div
                  key={index}
                  className="flex items-start justify-between gap-4 rounded-lg border p-3 transition-colors hover:bg-muted/50"
                >
                  <div className="space-y-1">
                    <h4 className="font-medium">{assessment.title}</h4>
                    <p className="text-sm text-muted-foreground">
                      {assessment.description}
                    </p>
                    <div className="flex gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {assessment.duration}
                      </span>
                      <span>{assessment.difficulty}</span>
                    </div>
                  </div>
                  <Button size="sm" variant="outline">
                    Start
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity - Placeholder */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Your latest assessment activity and results
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <ClipboardList className="h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-medium">No activity yet</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Start your first assessment to see your activity here.
              </p>
              <Button className="mt-4">
                Browse Assessments
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
