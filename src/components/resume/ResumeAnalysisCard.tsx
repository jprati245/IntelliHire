import { FileText, Trash2, Loader2, GraduationCap, Briefcase, Code2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface ResumeAnalysis {
  id: string;
  file_name: string;
  file_url: string;
  technical_skills: string[];
  education_summary: string | null;
  experience_summary: string | null;
  resume_score: number;
  analysis_status: string;
  created_at: string;
}

interface ResumeAnalysisCardProps {
  analysis: ResumeAnalysis;
  onDelete: (id: string) => void;
  isDeleting: boolean;
}

export function ResumeAnalysisCard({ analysis, onDelete, isDeleting }: ResumeAnalysisCardProps) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-success';
    if (score >= 60) return 'text-warning';
    return 'text-destructive';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Needs Improvement';
  };

  const isProcessing = analysis.analysis_status === 'pending' || analysis.analysis_status === 'processing';
  const isFailed = analysis.analysis_status === 'failed';

  return (
    <Card className="overflow-hidden">
      <CardHeader className="border-b bg-muted/30 pb-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0">
              <CardTitle className="truncate text-base">{analysis.file_name}</CardTitle>
              <p className="text-sm text-muted-foreground">
                Uploaded {new Date(analysis.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon" className="shrink-0" disabled={isDeleting}>
                {isDeleting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                )}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Resume Analysis</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete this resume analysis? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => onDelete(analysis.id)}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardHeader>

      <CardContent className="p-6">
        {isProcessing ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Loader2 className="mb-4 h-8 w-8 animate-spin text-primary" />
            <p className="font-medium text-foreground">Analyzing your resume...</p>
            <p className="text-sm text-muted-foreground">This may take a moment</p>
          </div>
        ) : isFailed ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
              <FileText className="h-6 w-6 text-destructive" />
            </div>
            <p className="font-medium text-foreground">Analysis Failed</p>
            <p className="text-sm text-muted-foreground">
              We couldn't analyze this resume. Please try uploading again.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Score */}
            <div className="rounded-lg bg-muted/50 p-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">Resume Score</span>
                <span className={`text-2xl font-bold ${getScoreColor(analysis.resume_score)}`}>
                  {analysis.resume_score}/100
                </span>
              </div>
              <Progress value={analysis.resume_score} className="h-2" />
              <p className={`mt-2 text-sm font-medium ${getScoreColor(analysis.resume_score)}`}>
                {getScoreLabel(analysis.resume_score)}
              </p>
            </div>

            {/* Technical Skills */}
            {analysis.technical_skills && analysis.technical_skills.length > 0 && (
              <div>
                <div className="mb-3 flex items-center gap-2">
                  <Code2 className="h-4 w-4 text-primary" />
                  <h4 className="font-semibold text-foreground">Technical Skills</h4>
                </div>
                <div className="flex flex-wrap gap-2">
                  {analysis.technical_skills.slice(0, 12).map((skill, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {skill}
                    </Badge>
                  ))}
                  {analysis.technical_skills.length > 12 && (
                    <Badge variant="outline" className="text-xs">
                      +{analysis.technical_skills.length - 12} more
                    </Badge>
                  )}
                </div>
              </div>
            )}

            {/* Education */}
            {analysis.education_summary && (
              <div>
                <div className="mb-2 flex items-center gap-2">
                  <GraduationCap className="h-4 w-4 text-primary" />
                  <h4 className="font-semibold text-foreground">Education</h4>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {analysis.education_summary}
                </p>
              </div>
            )}

            {/* Experience */}
            {analysis.experience_summary && (
              <div>
                <div className="mb-2 flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-primary" />
                  <h4 className="font-semibold text-foreground">Experience</h4>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {analysis.experience_summary}
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
