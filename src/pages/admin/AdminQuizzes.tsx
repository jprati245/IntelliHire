import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Search } from 'lucide-react';

export default function AdminQuizzes() {
  const [attempts, setAttempts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [avgScore, setAvgScore] = useState(0);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from('quiz_attempts')
        .select('*')
        .order('created_at', { ascending: false });
      const list = data ?? [];
      setAttempts(list);
      if (list.length > 0) {
        setAvgScore(Math.round(list.reduce((sum, a) => sum + a.score, 0) / list.length));
      }
      setLoading(false);
    };
    fetch();
  }, []);

  const filtered = attempts.filter((a) => {
    const q = search.toLowerCase();
    return a.topic.toLowerCase().includes(q) || a.category.toLowerCase().includes(q) || a.user_id.toLowerCase().includes(q);
  });

  return (
    <AdminLayout>
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Quiz Management</h1>

        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total Attempts</CardTitle></CardHeader>
            <CardContent><p className="text-3xl font-bold">{loading ? '—' : attempts.length}</p></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Average Score</CardTitle></CardHeader>
            <CardContent><p className="text-3xl font-bold">{loading ? '—' : `${avgScore}%`}</p></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Unique Topics</CardTitle></CardHeader>
            <CardContent><p className="text-3xl font-bold">{loading ? '—' : new Set(attempts.map(a => a.topic)).size}</p></CardContent>
          </Card>
        </div>

        <div className="relative max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Filter by topic, category, or user..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>

        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="space-y-3 p-6">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="p-4 font-medium">Topic</th>
                      <th className="p-4 font-medium">Category</th>
                      <th className="p-4 font-medium">Score</th>
                      <th className="p-4 font-medium">Questions</th>
                      <th className="p-4 font-medium">Time</th>
                      <th className="p-4 font-medium">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.length === 0 ? (
                      <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">No quiz attempts found.</td></tr>
                    ) : filtered.map((a) => (
                      <tr key={a.id} className="border-b last:border-0 hover:bg-muted/50">
                        <td className="p-4 font-medium">{a.topic}</td>
                        <td className="p-4"><Badge variant="outline">{a.category}</Badge></td>
                        <td className="p-4">
                          <Badge variant={a.score >= 70 ? 'default' : 'secondary'}>{a.score}%</Badge>
                        </td>
                        <td className="p-4 text-muted-foreground">{a.correct_answers}/{a.total_questions}</td>
                        <td className="p-4 text-muted-foreground">{Math.round(a.time_taken_seconds / 60)}m</td>
                        <td className="p-4 text-muted-foreground">{new Date(a.created_at).toLocaleDateString()}</td>
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
