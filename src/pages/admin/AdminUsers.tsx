import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2 } from 'lucide-react';
import { format } from 'date-fns';

interface UserRow {
  id: string;
  display_name: string | null;
  user_id: string;
  created_at: string;
}

export default function AdminUsers() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('id, display_name, user_id, created_at')
        .order('created_at', { ascending: false });

      setUsers(data ?? []);
      setLoading(false);
    };
    fetchUsers();
  }, []);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Users Management</h1>
          <p className="text-sm mt-1" style={{ color: '#6b7280' }}>View all registered users</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin" style={{ color: '#ef4444' }} />
          </div>
        ) : (
          <div className="rounded-xl overflow-hidden" style={{ background: '#161821', border: '1px solid #2a2d3a' }}>
            <Table>
              <TableHeader>
                <TableRow style={{ borderBottom: '1px solid #2a2d3a' }}>
                  <TableHead style={{ color: '#9ca3af' }}>Name</TableHead>
                  <TableHead style={{ color: '#9ca3af' }}>User ID</TableHead>
                  <TableHead style={{ color: '#9ca3af' }}>Signup Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center" style={{ color: '#6b7280' }}>
                      No users found
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((u) => (
                    <TableRow key={u.id} style={{ borderBottom: '1px solid #1f2233' }}>
                      <TableCell className="font-medium text-white">{u.display_name || 'N/A'}</TableCell>
                      <TableCell className="text-xs font-mono" style={{ color: '#6b7280' }}>{u.user_id.slice(0, 12)}…</TableCell>
                      <TableCell style={{ color: '#9ca3af' }}>{format(new Date(u.created_at), 'MMM d, yyyy')}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
