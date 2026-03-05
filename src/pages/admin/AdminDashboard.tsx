import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Users, Briefcase, FileText, Loader2, TrendingUp } from 'lucide-react';

export default function AdminDashboard() {
  const [stats, setStats] = useState({ users: 0, jobs: 0, applications: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      const [profilesRes, jobsRes, resumesRes] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('jobs').select('id', { count: 'exact', head: true }),
        supabase.from('resume_analyses').select('id', { count: 'exact', head: true }),
      ]);

      setStats({
        users: profilesRes.count ?? 0,
        jobs: jobsRes.count ?? 0,
        applications: resumesRes.count ?? 0,
      });
      setLoading(false);
    };

    fetchStats();
  }, []);

  const cards = [
    { title: 'Total Users', value: stats.users, icon: Users, gradient: 'linear-gradient(135deg, #3b82f6, #6366f1)' },
    { title: 'Total Jobs', value: stats.jobs, icon: Briefcase, gradient: 'linear-gradient(135deg, #10b981, #14b8a6)' },
    { title: 'Total Applications', value: stats.applications, icon: FileText, gradient: 'linear-gradient(135deg, #f59e0b, #f97316)' },
  ];

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard Overview</h1>
          <p className="text-sm mt-1" style={{ color: '#6b7280' }}>Monitor your platform at a glance</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin" style={{ color: '#ef4444' }} />
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {cards.map((card) => (
              <div
                key={card.title}
                className="rounded-xl p-5 relative overflow-hidden"
                style={{ background: '#161821', border: '1px solid #2a2d3a' }}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider" style={{ color: '#6b7280' }}>
                      {card.title}
                    </p>
                    <p className="text-3xl font-bold text-white mt-2">{card.value}</p>
                  </div>
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-lg"
                    style={{ background: card.gradient }}
                  >
                    <card.icon className="h-5 w-5 text-white" />
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-1">
                  <TrendingUp className="h-3.5 w-3.5" style={{ color: '#10b981' }} />
                  <span className="text-xs" style={{ color: '#10b981' }}>Live data</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
