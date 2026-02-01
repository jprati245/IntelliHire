import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, Medal, Award, TrendingUp, User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UserScore {
  id: string;
  user_id: string;
  resume_score: number;
  quiz_score: number;
  interview_score: number;
  total_score: number;
  quizzes_taken: number;
  interviews_taken: number;
}

interface LeaderboardProps {
  scores: UserScore[];
  currentUserId?: string;
}

export function Leaderboard({ scores, currentUserId }: LeaderboardProps) {
  const sortedScores = [...scores].sort((a, b) => b.total_score - a.total_score);
  const currentUserRank = sortedScores.findIndex(s => s.user_id === currentUserId) + 1;

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return <Trophy className="h-5 w-5 text-yellow-500" />;
      case 2: return <Medal className="h-5 w-5 text-gray-400" />;
      case 3: return <Award className="h-5 w-5 text-amber-600" />;
      default: return <span className="w-5 text-center font-medium text-muted-foreground">{rank}</span>;
    }
  };

  const getRankBg = (rank: number, isCurrentUser: boolean) => {
    if (isCurrentUser) return 'bg-primary/10 border-primary';
    switch (rank) {
      case 1: return 'bg-yellow-500/10 border-yellow-500/30';
      case 2: return 'bg-gray-400/10 border-gray-400/30';
      case 3: return 'bg-amber-600/10 border-amber-600/30';
      default: return 'bg-card';
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Leaderboard
            </CardTitle>
            <CardDescription>Anonymous rankings based on overall performance</CardDescription>
          </div>
          {currentUserId && currentUserRank > 0 && (
            <Badge variant="outline" className="text-sm">
              Your Rank: #{currentUserRank}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {sortedScores.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Trophy className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No rankings yet. Complete assessments to appear on the leaderboard!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {sortedScores.slice(0, 10).map((score, index) => {
              const rank = index + 1;
              const isCurrentUser = score.user_id === currentUserId;
              
              return (
                <div
                  key={score.id}
                  className={cn(
                    "flex items-center gap-4 p-4 rounded-lg border transition-colors",
                    getRankBg(rank, isCurrentUser)
                  )}
                >
                  <div className="w-8 flex justify-center">
                    {getRankIcon(rank)}
                  </div>
                  
                  <div className="flex items-center gap-3 flex-1">
                    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                      <User className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <div className="font-medium">
                        {isCurrentUser ? 'You' : `User #${score.user_id.slice(0, 4).toUpperCase()}`}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {score.quizzes_taken} quizzes • {score.interviews_taken} interviews
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 text-center text-sm">
                    <div>
                      <div className="text-muted-foreground text-xs">Resume</div>
                      <div className="font-medium">{score.resume_score}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground text-xs">Quiz</div>
                      <div className="font-medium">{score.quiz_score}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground text-xs">Interview</div>
                      <div className="font-medium">{score.interview_score}</div>
                    </div>
                  </div>

                  <div className="text-right min-w-[60px]">
                    <div className="text-2xl font-bold text-primary">{score.total_score}</div>
                    <div className="text-xs text-muted-foreground">Total</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
