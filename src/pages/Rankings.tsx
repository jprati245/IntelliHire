import { AppLayout } from '@/components/layout/AppLayout';
import { Leaderboard } from '@/components/leaderboard/Leaderboard';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { Loader2, Trophy, Target, TrendingUp, Award } from 'lucide-react';

export default function Rankings() {
  const { user } = useAuth();

  // Fetch all user scores for leaderboard
  const { data: scores, isLoading } = useQuery({
    queryKey: ['user-scores'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_scores')
        .select('*')
        .order('total_score', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  // Get current user's score
  const currentUserScore = scores?.find(s => s.user_id === user?.id);
  const userRank = scores?.findIndex(s => s.user_id === user?.id) ?? -1;

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Rankings</h1>
          <p className="text-muted-foreground">
            See how you compare with other candidates
          </p>
        </div>

        {/* User's Current Standing */}
        {currentUserScore && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-warning" />
                  Your Rank
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  #{userRank + 1}
                </div>
                <p className="text-xs text-muted-foreground">
                  out of {scores?.length || 0} candidates
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Target className="h-4 w-4 text-primary" />
                  Total Score
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-primary">
                  {currentUserScore.total_score}
                </div>
                <p className="text-xs text-muted-foreground">
                  Combined performance score
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-success" />
                  Assessments
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {currentUserScore.quizzes_taken + currentUserScore.interviews_taken}
                </div>
                <p className="text-xs text-muted-foreground">
                  {currentUserScore.quizzes_taken} quizzes • {currentUserScore.interviews_taken} interviews
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Award className="h-4 w-4 text-secondary" />
                  Score Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4 text-sm">
                  <div>
                    <div className="font-semibold">{currentUserScore.resume_score}</div>
                    <div className="text-xs text-muted-foreground">Resume</div>
                  </div>
                  <div>
                    <div className="font-semibold">{currentUserScore.quiz_score}</div>
                    <div className="text-xs text-muted-foreground">Quiz</div>
                  </div>
                  <div>
                    <div className="font-semibold">{currentUserScore.interview_score}</div>
                    <div className="text-xs text-muted-foreground">Interview</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {!currentUserScore && !isLoading && (
          <Card>
            <CardContent className="py-8 text-center">
              <Trophy className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
              <h3 className="text-lg font-medium">No Scores Yet</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Complete quizzes and interviews to appear on the leaderboard
              </p>
            </CardContent>
          </Card>
        )}

        {/* Leaderboard */}
        {isLoading ? (
          <Card>
            <CardContent className="py-16 flex justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </CardContent>
          </Card>
        ) : (
          <Leaderboard scores={scores || []} currentUserId={user?.id} />
        )}
      </div>
    </AppLayout>
  );
}
