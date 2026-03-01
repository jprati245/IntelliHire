import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';

const COLORS = [
  'hsl(213, 55%, 23%)',
  'hsl(210, 76%, 50%)',
  'hsl(142, 76%, 36%)',
  'hsl(38, 92%, 50%)',
  'hsl(199, 89%, 48%)',
  'hsl(0, 84%, 60%)',
];

export default function AdminAnalytics() {
  const [loading, setLoading] = useState(true);
  const [userGrowth, setUserGrowth] = useState<any[]>([]);
  const [resumeTrends, setResumeTrends] = useState<any[]>([]);
  const [skillDist, setSkillDist] = useState<any[]>([]);
  const [quizCategories, setQuizCategories] = useState<any[]>([]);

  useEffect(() => {
    const fetchAll = async () => {
      // User growth by month
      const { data: profiles } = await supabase.from('profiles').select('created_at');
      const monthMap: Record<string, number> = {};
      (profiles ?? []).forEach((p) => {
        const m = new Date(p.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
        monthMap[m] = (monthMap[m] || 0) + 1;
      });
      const sortedMonths = Object.entries(monthMap).map(([month, count]) => ({ month, count }));
      setUserGrowth(sortedMonths);

      // Resume trends
      const { data: resumes } = await supabase.from('resume_analyses').select('created_at');
      const rMap: Record<string, number> = {};
      (resumes ?? []).forEach((r) => {
        const m = new Date(r.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
        rMap[m] = (rMap[m] || 0) + 1;
      });
      setResumeTrends(Object.entries(rMap).map(([month, count]) => ({ month, count })));

      // Skill distribution from resumes
      const { data: allResumes } = await supabase.from('resume_analyses').select('technical_skills');
      const skillCount: Record<string, number> = {};
      (allResumes ?? []).forEach((r) => {
        const skills = Array.isArray(r.technical_skills) ? r.technical_skills : [];
        skills.forEach((s: string) => { skillCount[s] = (skillCount[s] || 0) + 1; });
      });
      const topSkills = Object.entries(skillCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(([name, value]) => ({ name, value }));
      setSkillDist(topSkills);

      // Quiz categories
      const { data: quizzes } = await supabase.from('quiz_attempts').select('category, score');
      const catMap: Record<string, { total: number; count: number }> = {};
      (quizzes ?? []).forEach((q) => {
        if (!catMap[q.category]) catMap[q.category] = { total: 0, count: 0 };
        catMap[q.category].total += q.score;
        catMap[q.category].count += 1;
      });
      setQuizCategories(
        Object.entries(catMap).map(([name, { total, count }]) => ({
          name,
          avg: Math.round(total / count),
        }))
      );

      setLoading(false);
    };
    fetchAll();
  }, []);

  if (loading) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <h1 className="text-2xl font-bold">Analytics</h1>
          <div className="grid gap-4 md:grid-cols-2">
            {[...Array(4)].map((_, i) => (
              <Card key={i}><CardContent className="p-6"><Skeleton className="h-64 w-full" /></CardContent></Card>
            ))}
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Analytics</h1>

        <div className="grid gap-4 md:grid-cols-2">
          {/* User Growth */}
          <Card>
            <CardHeader><CardTitle className="text-base">Monthly User Growth</CardTitle></CardHeader>
            <CardContent>
              {userGrowth.length === 0 ? (
                <p className="text-sm text-muted-foreground">No data yet.</p>
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={userGrowth}>
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Line type="monotone" dataKey="count" stroke="hsl(210, 76%, 50%)" strokeWidth={2} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Resume Trends */}
          <Card>
            <CardHeader><CardTitle className="text-base">Resume Submission Trends</CardTitle></CardHeader>
            <CardContent>
              {resumeTrends.length === 0 ? (
                <p className="text-sm text-muted-foreground">No data yet.</p>
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={resumeTrends}>
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="count" fill="hsl(213, 55%, 23%)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Skill Distribution */}
          <Card>
            <CardHeader><CardTitle className="text-base">Top Skills Distribution</CardTitle></CardHeader>
            <CardContent>
              {skillDist.length === 0 ? (
                <p className="text-sm text-muted-foreground">No data yet.</p>
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie data={skillDist} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={({ name }) => name}>
                      {skillDist.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Quiz Categories */}
          <Card>
            <CardHeader><CardTitle className="text-base">Average Score by Quiz Category</CardTitle></CardHeader>
            <CardContent>
              {quizCategories.length === 0 ? (
                <p className="text-sm text-muted-foreground">No data yet.</p>
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={quizCategories}>
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="avg" fill="hsl(142, 76%, 36%)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
