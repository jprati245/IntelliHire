import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { SkillGapAnalysis as SkillGapComponent } from '@/components/skills/SkillGapAnalysis';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Loader2, Target, Plus, X, Sparkles, History } from 'lucide-react';

const jobRoles = [
  'Frontend Developer',
  'Backend Developer',
  'Full-Stack Developer',
  'DevOps Engineer',
  'Data Scientist',
  'Data Analyst',
  'ML Engineer',
  'Mobile Developer',
];

interface SkillGapData {
  targetRole: string;
  requiredSkills: string[];
  userSkills: string[];
  matchingSkills: string[];
  missingSkills: string[];
  matchPercentage: number;
  recommendations: {
    skill: string;
    priority: 'high' | 'medium' | 'low';
    resources: string[];
    timeEstimate: string;
  }[];
}

export default function SkillGap() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [userSkills, setUserSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState('');
  const [analysisResult, setAnalysisResult] = useState<SkillGapData | null>(null);

  // Fetch user's previous skill gap analyses
  const { data: analysisHistory, isLoading: historyLoading } = useQuery({
    queryKey: ['skill-gap-history', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('skill_gap_analyses')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Fetch skills from resume analyses
  const { data: resumeData } = useQuery({
    queryKey: ['resume-skills', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('resume_analyses')
        .select('technical_skills')
        .eq('user_id', user?.id)
        .eq('analysis_status', 'completed')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Pre-populate skills from resume
  useEffect(() => {
    if (resumeData?.technical_skills && Array.isArray(resumeData.technical_skills)) {
      setUserSkills(resumeData.technical_skills as string[]);
    }
  }, [resumeData]);

  // Analyze skill gap
  const analyzeMutation = useMutation({
    mutationFn: async () => {
      const response = await supabase.functions.invoke('analyze-skill-gap', {
        body: {
          targetRole: selectedRole,
          userSkills,
        },
      });
      
      if (response.error) throw response.error;
      return response.data as SkillGapData;
    },
    onSuccess: async (data) => {
      setAnalysisResult(data);
      
      // Save to database
      await supabase.from('skill_gap_analyses').insert({
        user_id: user?.id,
        target_role: selectedRole,
        user_skills: userSkills,
        required_skills: data.requiredSkills,
        missing_skills: data.missingSkills,
        matching_skills: data.matchingSkills,
        recommendations: data.recommendations,
        match_percentage: data.matchPercentage,
      });
      
      queryClient.invalidateQueries({ queryKey: ['skill-gap-history'] });
      toast.success('Skill gap analysis complete!');
    },
    onError: (error) => {
      console.error('Failed to analyze skill gap:', error);
      toast.error('Failed to analyze skills. Please try again.');
    },
  });

  const handleAddSkill = () => {
    if (skillInput.trim() && !userSkills.includes(skillInput.trim())) {
      setUserSkills([...userSkills, skillInput.trim()]);
      setSkillInput('');
    }
  };

  const handleRemoveSkill = (skill: string) => {
    setUserSkills(userSkills.filter(s => s !== skill));
  };

  const handleAnalyze = () => {
    if (!selectedRole) {
      toast.error('Please select a target role');
      return;
    }
    if (userSkills.length === 0) {
      toast.error('Please add at least one skill');
      return;
    }
    analyzeMutation.mutate();
  };

  const loadPreviousAnalysis = (analysis: typeof analysisHistory extends (infer T)[] ? T : never) => {
    setSelectedRole(analysis.target_role);
    setUserSkills(analysis.user_skills as string[]);
    setAnalysisResult({
      targetRole: analysis.target_role,
      requiredSkills: analysis.required_skills as string[],
      userSkills: analysis.user_skills as string[],
      matchingSkills: analysis.matching_skills as string[],
      missingSkills: analysis.missing_skills as string[],
      matchPercentage: analysis.match_percentage,
      recommendations: analysis.recommendations as SkillGapData['recommendations'],
    });
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Skill Gap Analysis</h1>
          <p className="text-muted-foreground">
            Compare your skills with job requirements and get personalized learning recommendations
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Configuration Panel */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-primary" />
                  Analyze Your Skills
                </CardTitle>
                <CardDescription>
                  Select a target role and list your current skills
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Role Selection */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Target Role</label>
                  <Select value={selectedRole} onValueChange={setSelectedRole}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your target role" />
                    </SelectTrigger>
                    <SelectContent>
                      {jobRoles.map((role) => (
                        <SelectItem key={role} value={role}>
                          {role}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Skills Input */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Your Skills</label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add a skill (e.g., React, Python)"
                      value={skillInput}
                      onChange={(e) => setSkillInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddSkill()}
                    />
                    <Button onClick={handleAddSkill} size="icon" variant="outline">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  {userSkills.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {userSkills.map((skill) => (
                        <Badge key={skill} variant="secondary" className="flex items-center gap-1">
                          {skill}
                          <button onClick={() => handleRemoveSkill(skill)} className="ml-1 hover:text-destructive">
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                  
                  {resumeData?.technical_skills && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Skills pre-populated from your resume analysis
                    </p>
                  )}
                </div>

                <Button
                  className="w-full"
                  size="lg"
                  onClick={handleAnalyze}
                  disabled={!selectedRole || userSkills.length === 0 || analyzeMutation.isPending}
                >
                  {analyzeMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Analyze Skill Gap
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Analysis Results */}
            {analysisResult && (
              <SkillGapComponent data={analysisResult} />
            )}
          </div>

          {/* History Panel */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <History className="h-4 w-4 text-muted-foreground" />
                  Previous Analyses
                </CardTitle>
              </CardHeader>
              <CardContent>
                {historyLoading ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : analysisHistory && analysisHistory.length > 0 ? (
                  <div className="space-y-3">
                    {analysisHistory.map((analysis) => (
                      <button
                        key={analysis.id}
                        onClick={() => loadPreviousAnalysis(analysis)}
                        className="w-full p-3 rounded-lg border bg-card text-left hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <div className="font-medium text-sm truncate">{analysis.target_role}</div>
                          <span className={`text-sm font-medium ${
                            analysis.match_percentage >= 70 ? 'text-success' : 
                            analysis.match_percentage >= 50 ? 'text-warning' : 'text-destructive'
                          }`}>
                            {analysis.match_percentage}%
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(analysis.created_at).toLocaleDateString()}
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No previous analyses
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
