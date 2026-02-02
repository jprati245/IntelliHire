import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Briefcase, 
  TrendingUp, 
  Target, 
  Sparkles, 
  ChevronRight,
  Building2,
  DollarSign,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';

interface JobRecommendation {
  role: string;
  company_types: string[];
  relevance_score: number;
  salary_range: string;
  match_reasons: string[];
  skill_gaps: string[];
  next_steps: string[];
}

interface RecommendationResponse {
  recommendations: JobRecommendation[];
  overall_assessment: string;
  top_strengths: string[];
}

export function JobRecommendations() {
  const { user } = useAuth();
  const [skills, setSkills] = useState('');
  const [preferences, setPreferences] = useState('');
  const [hasGenerated, setHasGenerated] = useState(false);

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

  // Fetch latest resume analysis for skills
  const { data: resumeAnalysis } = useQuery({
    queryKey: ['latest-resume-skills', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('resume_analyses')
        .select('technical_skills')
        .eq('user_id', user?.id)
        .eq('analysis_status', 'completed')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      return data;
    },
    enabled: !!user?.id,
  });

  // Generate recommendations
  const { data: recommendations, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['job-recommendations', user?.id, skills, preferences],
    queryFn: async () => {
      const skillList = skills.split(',').map(s => s.trim()).filter(Boolean);
      const resumeSkills = Array.isArray(resumeAnalysis?.technical_skills) 
        ? resumeAnalysis.technical_skills as string[]
        : [];
      
      const allSkills = [...new Set([...skillList, ...resumeSkills])];

      const { data, error } = await supabase.functions.invoke('recommend-jobs', {
        body: {
          skills: allSkills,
          resumeScore: userScore?.resume_score || 0,
          quizScore: userScore?.quiz_score || 0,
          interviewScore: userScore?.interview_score || 0,
          preferences: preferences || undefined,
        },
      });

      if (error) throw error;
      return data as RecommendationResponse;
    },
    enabled: hasGenerated && !!user?.id,
  });

  const handleGenerate = () => {
    if (!skills.trim()) {
      toast.error('Please enter at least one skill');
      return;
    }
    setHasGenerated(true);
    refetch();
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-success';
    if (score >= 60) return 'text-warning';
    return 'text-muted-foreground';
  };

  return (
    <div className="space-y-6">
      {/* Input Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Get Personalized Job Recommendations
          </CardTitle>
          <CardDescription>
            Enter your skills and preferences to receive AI-powered job matches
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="skills" className="text-sm font-medium">
              Your Skills (comma-separated)
            </label>
            <Input
              id="skills"
              value={skills}
              onChange={(e) => setSkills(e.target.value)}
              placeholder="e.g., React, TypeScript, Node.js, Python, AWS"
              aria-describedby="skills-hint"
            />
            <p id="skills-hint" className="text-xs text-muted-foreground">
              {resumeAnalysis?.technical_skills && Array.isArray(resumeAnalysis.technical_skills) && resumeAnalysis.technical_skills.length > 0 && (
                <span>
                  Skills from your resume will be included automatically.
                </span>
              )}
            </p>
          </div>
          <div className="space-y-2">
            <label htmlFor="preferences" className="text-sm font-medium">
              Preferences (optional)
            </label>
            <Textarea
              id="preferences"
              value={preferences}
              onChange={(e) => setPreferences(e.target.value)}
              placeholder="e.g., Remote work, startup environment, focus on AI/ML..."
              rows={2}
            />
          </div>
          <Button 
            onClick={handleGenerate} 
            disabled={isLoading || isFetching}
            className="w-full"
          >
            {isLoading || isFetching ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analyzing...
              </>
            ) : hasGenerated ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh Recommendations
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Get Recommendations
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Loading State */}
      {(isLoading || isFetching) && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-32" />
              </CardHeader>
              <CardContent className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-8 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Results */}
      {recommendations && !isLoading && !isFetching && (
        <div className="space-y-6">
          {/* Assessment Summary */}
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <TrendingUp className="h-5 w-5 text-primary" />
                Your Career Assessment
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">{recommendations.overall_assessment}</p>
              {recommendations.top_strengths?.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2">Top Strengths:</p>
                  <div className="flex flex-wrap gap-2">
                    {recommendations.top_strengths.map((strength, i) => (
                      <Badge key={i} variant="secondary">
                        <CheckCircle2 className="mr-1 h-3 w-3" />
                        {strength}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Job Recommendations */}
          <div className="grid gap-4">
            {recommendations.recommendations?.map((job, i) => (
              <Card key={i} className="overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <Briefcase className="h-5 w-5 text-primary" />
                        {job.role}
                      </CardTitle>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Building2 className="h-4 w-4" />
                          {job.company_types?.join(', ')}
                        </span>
                        <span className="flex items-center gap-1">
                          <DollarSign className="h-4 w-4" />
                          {job.salary_range}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-2xl font-bold ${getScoreColor(job.relevance_score)}`}>
                        {job.relevance_score}%
                      </div>
                      <p className="text-xs text-muted-foreground">Match</p>
                    </div>
                  </div>
                  <Progress value={job.relevance_score} className="h-2 mt-2" />
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Match Reasons */}
                  {job.match_reasons?.length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-2 flex items-center gap-1">
                        <CheckCircle2 className="h-4 w-4 text-success" />
                        Why You Match
                      </p>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        {job.match_reasons.map((reason, j) => (
                          <li key={j} className="flex items-start gap-2">
                            <ChevronRight className="h-4 w-4 mt-0.5 flex-shrink-0" />
                            {reason}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Skill Gaps */}
                  {job.skill_gaps?.length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-2 flex items-center gap-1">
                        <AlertCircle className="h-4 w-4 text-warning" />
                        Skills to Develop
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {job.skill_gaps.map((skill, j) => (
                          <Badge key={j} variant="outline">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Next Steps */}
                  {job.next_steps?.length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-2 flex items-center gap-1">
                        <Target className="h-4 w-4 text-info" />
                        Next Steps
                      </p>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        {job.next_steps.map((step, j) => (
                          <li key={j} className="flex items-start gap-2">
                            <span className="font-medium text-foreground">{j + 1}.</span>
                            {step}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!hasGenerated && !isLoading && (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <Briefcase className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-medium text-lg mb-2">No Recommendations Yet</h3>
            <p className="text-muted-foreground text-sm max-w-sm mx-auto">
              Enter your skills above to receive personalized job recommendations based on your profile and assessment scores.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
