import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, XCircle, BookOpen, Clock, AlertTriangle, Target } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Recommendation {
  skill: string;
  priority: 'high' | 'medium' | 'low';
  resources: string[];
  timeEstimate: string;
}

interface SkillGapData {
  targetRole: string;
  requiredSkills: string[];
  userSkills: string[];
  matchingSkills: string[];
  missingSkills: string[];
  matchPercentage: number;
  recommendations: Recommendation[];
}

interface SkillGapAnalysisProps {
  data: SkillGapData;
}

export function SkillGapAnalysis({ data }: SkillGapAnalysisProps) {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'outline';
    }
  };

  const getMatchColor = (percentage: number) => {
    if (percentage >= 80) return 'text-success';
    if (percentage >= 60) return 'text-primary';
    if (percentage >= 40) return 'text-warning';
    return 'text-destructive';
  };

  return (
    <div className="space-y-6">
      {/* Overview Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                Skill Gap Analysis
              </CardTitle>
              <CardDescription>Target Role: {data.targetRole}</CardDescription>
            </div>
            <div className="text-right">
              <div className={cn("text-3xl font-bold", getMatchColor(data.matchPercentage))}>
                {data.matchPercentage}%
              </div>
              <div className="text-xs text-muted-foreground">Match Score</div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Progress value={data.matchPercentage} className="h-3" />
          <div className="flex justify-between mt-2 text-sm text-muted-foreground">
            <span>{data.matchingSkills.length} matching skills</span>
            <span>{data.missingSkills.length} skills to develop</span>
          </div>
        </CardContent>
      </Card>

      {/* Skills Comparison */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Matching Skills */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-success" />
              Matching Skills ({data.matchingSkills.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.matchingSkills.length === 0 ? (
              <p className="text-sm text-muted-foreground">No matching skills found</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {data.matchingSkills.map((skill, i) => (
                  <Badge key={i} variant="outline" className="bg-success/10 border-success/30">
                    {skill}
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Missing Skills */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <XCircle className="h-4 w-4 text-destructive" />
              Missing Skills ({data.missingSkills.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.missingSkills.length === 0 ? (
              <p className="text-sm text-muted-foreground">You have all required skills!</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {data.missingSkills.map((skill, i) => (
                  <Badge key={i} variant="outline" className="bg-destructive/10 border-destructive/30">
                    {skill}
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Learning Recommendations */}
      {data.recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              Learning Recommendations
            </CardTitle>
            <CardDescription>Prioritized learning path to close your skill gaps</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.recommendations.map((rec, i) => (
              <div key={i} className="p-4 rounded-lg border bg-card">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium">{rec.skill}</h4>
                    <Badge variant={getPriorityColor(rec.priority)} className="text-xs">
                      {rec.priority} priority
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {rec.timeEstimate}
                  </div>
                </div>
                {rec.resources.length > 0 && (
                  <div className="mt-3">
                    <p className="text-xs text-muted-foreground mb-2">Suggested Resources:</p>
                    <ul className="space-y-1">
                      {rec.resources.slice(0, 3).map((resource, j) => (
                        <li key={j} className="text-sm flex items-start gap-2">
                          <span className="text-primary">•</span>
                          {resource}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Warning if low match */}
      {data.matchPercentage < 40 && (
        <Card className="border-warning">
          <CardContent className="flex items-start gap-3 pt-6">
            <AlertTriangle className="h-5 w-5 text-warning flex-shrink-0" />
            <div>
              <h4 className="font-medium">Significant Skill Gap Detected</h4>
              <p className="text-sm text-muted-foreground mt-1">
                Your current skillset has significant gaps for the {data.targetRole} role. 
                Consider focusing on the high-priority skills first, or exploring related roles 
                that better match your current expertise.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
