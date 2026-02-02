import { useState, useEffect } from 'react';
import { FileText, Plus } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { ResumeUpload } from '@/components/resume/ResumeUpload';
import { ResumeAnalysisCard } from '@/components/resume/ResumeAnalysisCard';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

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

export default function ResumeAnalysisPage() {
  const [analyses, setAnalyses] = useState<ResumeAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchAnalyses = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('resume_analyses')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Parse technical_skills from JSONB
      const parsedData = (data || []).map((item: any) => ({
        ...item,
        technical_skills: Array.isArray(item.technical_skills) 
          ? item.technical_skills 
          : [],
      }));

      setAnalyses(parsedData);
    } catch (error) {
      console.error('Error fetching analyses:', error);
      toast({
        title: 'Error',
        description: 'Failed to load resume analyses.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalyses();
  }, [user]);

  // Poll for updates on pending/processing analyses
  useEffect(() => {
    const pendingAnalyses = analyses.filter(
      (a) => a.analysis_status === 'pending' || a.analysis_status === 'processing'
    );

    if (pendingAnalyses.length === 0) return;

    const interval = setInterval(() => {
      fetchAnalyses();
    }, 3000);

    return () => clearInterval(interval);
  }, [analyses]);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const analysis = analyses.find((a) => a.id === id);
      
      // Delete from storage using file path (not URL)
      if (analysis?.file_url) {
        // file_url now stores the path directly (e.g., "user-id/timestamp-filename.pdf")
        await supabase.storage.from('resumes').remove([analysis.file_url]);
      }

      // Delete from database
      const { error } = await supabase
        .from('resume_analyses')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setAnalyses((prev) => prev.filter((a) => a.id !== id));
      toast({
        title: 'Deleted',
        description: 'Resume analysis deleted successfully.',
      });
    } catch (error) {
      console.error('Delete error:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete resume analysis.',
        variant: 'destructive',
      });
    } finally {
      setDeletingId(null);
    }
  };

  const handleUploadComplete = () => {
    setShowUpload(false);
    fetchAnalyses();
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
              Resume Analysis
            </h1>
            <p className="mt-1 text-muted-foreground">
              Upload your resume to get AI-powered insights and recommendations
            </p>
          </div>
          {!showUpload && analyses.length > 0 && (
            <Button onClick={() => setShowUpload(true)}>
              <Plus className="mr-2 h-4 w-4" />
              New Analysis
            </Button>
          )}
        </div>

        {/* Upload Section */}
        {(showUpload || analyses.length === 0) && (
          <div className="space-y-4">
            <ResumeUpload onUploadComplete={handleUploadComplete} />
            {showUpload && analyses.length > 0 && (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setShowUpload(false)}
              >
                Cancel
              </Button>
            )}
          </div>
        )}

        {/* Analyses Grid */}
        {loading ? (
          <div className="grid gap-6 md:grid-cols-2">
            {[1, 2].map((i) => (
              <div key={i} className="space-y-4 rounded-lg border p-6">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-lg" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
                <Skeleton className="h-20 w-full" />
                <div className="flex flex-wrap gap-2">
                  {[1, 2, 3, 4].map((j) => (
                    <Skeleton key={j} className="h-6 w-16 rounded-full" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : analyses.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2">
            {analyses.map((analysis) => (
              <ResumeAnalysisCard
                key={analysis.id}
                analysis={analysis}
                onDelete={handleDelete}
                isDeleting={deletingId === analysis.id}
              />
            ))}
          </div>
        ) : (
          !showUpload && (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                <FileText className="h-7 w-7 text-muted-foreground" />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-foreground">
                No Resume Analyses Yet
              </h3>
              <p className="mb-6 max-w-sm text-muted-foreground">
                Upload your resume to get started with AI-powered analysis and recommendations.
              </p>
              <Button onClick={() => setShowUpload(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Upload Resume
              </Button>
            </div>
          )
        )}
      </div>
    </AppLayout>
  );
}
