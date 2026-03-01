import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { Users, FileText, Briefcase, BookOpen, Activity } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface Stats {
  users: number;
  resumes: number;
  jobs: number;
  quizAttempts: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentProfiles, setRecentProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      const [profilesRes, resumesRes, jobsRes, quizRes] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('resume_analyses').select('*', { count: 'exact', head: true }),
        supabase.from('jobs').select('*', { count: 'exact', head: true }),
        supabase.from('quiz_attempts').select('*', { count: 'exact', head: true }),
      ]);

      setStats({
        users: profilesRes.count ?? 0,
        resumes: resumesRes.count ?? 0,
        jobs: jobsRes.count ?? 0,
        quizAttempts: quizRes.count ?? 0,
      });

      const { data: recent } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);
      setRecentProfiles(recent ?? []);
      setLoading(false);
    };

    fetchStats();
  }, []);

  const statCards = [
    { label: 'Total Users', value: stats?.users, icon: Users, color: 'text-primary' },
    { label: 'Resumes Uploaded', value: stats?.resumes, icon: FileText, color: 'text-info' },
    { label: 'Job Postings', value: stats?.jobs, icon: Briefcase, color: 'text-success' },
    { label: 'Quiz Attempts', value: stats?.quizAttempts, icon: BookOpen, color: 'text-warning' },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>

        {/* Stat Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {statCards.map((s) => (
            <Card key={s.label}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{s.label}</CardTitle>
                <s.icon className={`h-5 w-5 ${s.color}`} />
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-8 w-20" />
                ) : (
                  <p className="text-3xl font-bold">{s.value}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Recent Users */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Activity className="h-5 w-5" /> Recent Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
              </div>
            ) : recentProfiles.length === 0 ? (
              <p className="text-muted-foreground">No users yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="pb-2 font-medium">Name</th>
                      <th className="pb-2 font-medium">Job Title</th>
                      <th className="pb-2 font-medium">Industry</th>
                      <th className="pb-2 font-medium">Joined</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentProfiles.map((p) => (
                      <tr key={p.id} className="border-b last:border-0">
                        <td className="py-2.5 font-medium">{p.display_name || 'Unnamed'}</td>
                        <td className="py-2.5 text-muted-foreground">{p.job_title || '—'}</td>
                        <td className="py-2.5 text-muted-foreground">{p.industry || '—'}</td>
                        <td className="py-2.5 text-muted-foreground">
                          {new Date(p.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
