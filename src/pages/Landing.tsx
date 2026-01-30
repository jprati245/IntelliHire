import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  TrendingUp,
  FileText,
  Brain,
  MessageSquare,
  Target,
  Briefcase,
  ArrowRight,
  ChevronDown,
} from 'lucide-react';

const features = [
  {
    icon: FileText,
    title: 'Resume Analysis',
    description:
      'Get AI-powered insights on your resume with actionable suggestions to stand out to employers.',
  },
  {
    icon: Brain,
    title: 'Skill & Aptitude Quiz',
    description:
      'Discover your strengths and identify areas for growth through comprehensive assessments.',
  },
  {
    icon: MessageSquare,
    title: 'AI Mock Interviews',
    description:
      'Practice with realistic interview simulations and receive instant feedback to improve.',
  },
  {
    icon: Target,
    title: 'Skill Gap Analysis',
    description:
      'Understand what skills you need to develop to reach your career goals effectively.',
  },
  {
    icon: Briefcase,
    title: 'Job Recommendations',
    description:
      'Receive personalized job suggestions based on your unique skills, experience, and aspirations.',
  },
];

export default function Landing() {
  const scrollToFeatures = () => {
    document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <TrendingUp className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-semibold text-foreground">CareerPath</span>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" asChild>
              <Link to="/login">Sign In</Link>
            </Button>
            <Button asChild>
              <Link to="/register">Get Started</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary via-primary to-secondary/80 py-20 lg:py-32">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
        <div className="container relative mx-auto px-4 text-center">
          <h1 className="mx-auto max-w-4xl text-4xl font-bold leading-tight text-primary-foreground sm:text-5xl lg:text-6xl">
            Discover Your Perfect
            <br />
            <span className="text-secondary-foreground/90">Career Path</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-primary-foreground/80 sm:text-xl">
            Unlock your potential with AI-powered career assessments. Get personalized insights,
            skill analysis, and job recommendations tailored just for you.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button size="lg" variant="secondary" className="w-full sm:w-auto" asChild>
              <Link to="/register">
                Get Started Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="w-full border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground sm:w-auto"
              onClick={scrollToFeatures}
            >
              View Features
              <ChevronDown className="ml-2 h-5 w-5" />
            </Button>
          </div>
          <div className="mt-16 flex flex-wrap items-center justify-center gap-8 text-primary-foreground/70 lg:gap-16">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary-foreground">50K+</div>
              <div className="text-sm">Assessments Completed</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary-foreground">98%</div>
              <div className="text-sm">User Satisfaction</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary-foreground">200+</div>
              <div className="text-sm">Career Paths</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 lg:py-28">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-bold text-foreground sm:text-4xl">
              Everything You Need to Advance Your Career
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Our comprehensive suite of AI-powered tools helps you understand your strengths,
              identify opportunities, and land your dream job.
            </p>
          </div>
          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <Card
                key={feature.title}
                className="group border-border/50 transition-all duration-300 hover:border-primary/30 hover:shadow-lg"
              >
                <CardContent className="p-6">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 transition-colors group-hover:bg-primary/20">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="mb-2 text-lg font-semibold text-foreground">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-muted/50 py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-foreground sm:text-4xl">
            Ready to Transform Your Career?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
            Join thousands of professionals who have discovered their ideal career path with
            CareerPath.
          </p>
          <Button size="lg" className="mt-8" asChild>
            <Link to="/register">
              Start Your Free Assessment
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-background py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <TrendingUp className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="font-semibold text-foreground">CareerPath</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} CareerPath. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
