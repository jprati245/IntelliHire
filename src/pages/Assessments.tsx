import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, Star, ArrowRight, Brain, Target, Users, Lightbulb } from 'lucide-react';

const assessmentCategories = [
  {
    id: 'skills',
    title: 'Technical Skills',
    description: 'Evaluate your proficiency in technical areas and tools',
    icon: Brain,
    color: 'bg-secondary/10 text-secondary',
    assessments: [
      {
        title: 'Programming Fundamentals',
        duration: '45 min',
        difficulty: 'Intermediate',
        questions: 30,
      },
      {
        title: 'Data Analysis',
        duration: '35 min',
        difficulty: 'Advanced',
        questions: 25,
      },
      {
        title: 'Project Management',
        duration: '25 min',
        difficulty: 'Beginner',
        questions: 20,
      },
    ],
  },
  {
    id: 'aptitude',
    title: 'Aptitude & Reasoning',
    description: 'Test your analytical thinking and problem-solving abilities',
    icon: Target,
    color: 'bg-info/10 text-info',
    assessments: [
      {
        title: 'Logical Reasoning',
        duration: '30 min',
        difficulty: 'Intermediate',
        questions: 25,
      },
      {
        title: 'Numerical Aptitude',
        duration: '40 min',
        difficulty: 'Advanced',
        questions: 30,
      },
      {
        title: 'Verbal Reasoning',
        duration: '25 min',
        difficulty: 'Beginner',
        questions: 20,
      },
    ],
  },
  {
    id: 'soft-skills',
    title: 'Soft Skills',
    description: 'Assess your interpersonal and communication abilities',
    icon: Users,
    color: 'bg-success/10 text-success',
    assessments: [
      {
        title: 'Communication Skills',
        duration: '20 min',
        difficulty: 'Beginner',
        questions: 15,
      },
      {
        title: 'Leadership Assessment',
        duration: '30 min',
        difficulty: 'Intermediate',
        questions: 25,
      },
      {
        title: 'Teamwork & Collaboration',
        duration: '25 min',
        difficulty: 'Beginner',
        questions: 20,
      },
    ],
  },
  {
    id: 'comprehensive',
    title: 'Comprehensive',
    description: 'Complete career assessment combining multiple skill areas',
    icon: Lightbulb,
    color: 'bg-warning/10 text-warning',
    assessments: [
      {
        title: 'Full Career Assessment',
        duration: '90 min',
        difficulty: 'Advanced',
        questions: 75,
      },
      {
        title: 'Career Compatibility',
        duration: '45 min',
        difficulty: 'Intermediate',
        questions: 40,
      },
    ],
  },
];

const getDifficultyColor = (difficulty: string) => {
  switch (difficulty) {
    case 'Beginner':
      return 'bg-success/10 text-success border-success/20';
    case 'Intermediate':
      return 'bg-warning/10 text-warning border-warning/20';
    case 'Advanced':
      return 'bg-destructive/10 text-destructive border-destructive/20';
    default:
      return 'bg-muted text-muted-foreground';
  }
};

export default function Assessments() {
  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
            Assessments
          </h1>
          <p className="text-muted-foreground">
            Choose from our comprehensive assessment library to discover your strengths.
          </p>
        </div>

        {/* Featured Assessment */}
        <Card className="bg-gradient-to-r from-primary to-secondary text-primary-foreground">
          <CardContent className="flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between">
            <div className="space-y-2">
              <Badge className="bg-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/30">
                <Star className="mr-1 h-3 w-3" />
                Featured
              </Badge>
              <h2 className="text-xl font-bold">Full Career Assessment</h2>
              <p className="max-w-md text-primary-foreground/80">
                Our most comprehensive assessment combining skills, aptitude, and
                personality analysis for complete career insights.
              </p>
              <div className="flex items-center gap-4 text-sm text-primary-foreground/70">
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  90 minutes
                </span>
                <span>75 questions</span>
              </div>
            </div>
            <Button
              size="lg"
              className="bg-primary-foreground text-primary hover:bg-primary-foreground/90"
            >
              Start Assessment
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>

        {/* Assessment Categories */}
        <div className="space-y-8">
          {assessmentCategories.map(category => (
            <div key={category.id} className="space-y-4">
              <div className="flex items-center gap-3">
                <div className={`rounded-lg p-2 ${category.color}`}>
                  <category.icon className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold">{category.title}</h2>
                  <p className="text-sm text-muted-foreground">
                    {category.description}
                  </p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {category.assessments.map((assessment, index) => (
                  <Card
                    key={index}
                    className="transition-shadow hover:shadow-md"
                  >
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">
                        {assessment.title}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-3">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {assessment.duration}
                        </span>
                        <span>{assessment.questions} questions</span>
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="flex items-center justify-between pt-0">
                      <Badge
                        variant="outline"
                        className={getDifficultyColor(assessment.difficulty)}
                      >
                        {assessment.difficulty}
                      </Badge>
                      <Button size="sm">Start</Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
