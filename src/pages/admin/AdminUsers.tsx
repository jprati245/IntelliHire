import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, Trash2, Eye } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';

export default function AdminUsers() {
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [viewProfile, setViewProfile] = useState<any | null>(null);

  const fetchProfiles = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });
    setProfiles(data ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchProfiles(); }, []);

  const handleDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from('profiles').delete().eq('id', deleteId);
    if (error) {
      toast.error('Failed to delete user profile');
    } else {
      toast.success('User profile deleted');
      fetchProfiles();
    }
    setDeleteId(null);
  };

  const filtered = profiles.filter((p) => {
    const q = search.toLowerCase();
    return (
      (p.display_name || '').toLowerCase().includes(q) ||
      (p.job_title || '').toLowerCase().includes(q) ||
      (p.industry || '').toLowerCase().includes(q)
    );
  });

  return (
    <AdminLayout>
      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-bold">User Management</h1>
          <div className="relative w-full max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search users..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="space-y-3 p-6">
                {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="p-4 font-medium">Name</th>
                      <th className="p-4 font-medium">Job Title</th>
                      <th className="p-4 font-medium">Industry</th>
                      <th className="p-4 font-medium">Joined</th>
                      <th className="p-4 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-6 text-center text-muted-foreground">No users found.</td>
                      </tr>
                    ) : (
                      filtered.map((p) => (
                        <tr key={p.id} className="border-b last:border-0 hover:bg-muted/50">
                          <td className="p-4 font-medium">{p.display_name || 'Unnamed'}</td>
                          <td className="p-4 text-muted-foreground">{p.job_title || '—'}</td>
                          <td className="p-4 text-muted-foreground">{p.industry || '—'}</td>
                          <td className="p-4 text-muted-foreground">{new Date(p.created_at).toLocaleDateString()}</td>
                          <td className="p-4 text-right">
                            <div className="flex justify-end gap-1">
                              <Button variant="ghost" size="icon" onClick={() => setViewProfile(p)}>
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setDeleteId(p.id)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User Profile?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* View Profile Dialog */}
      <Dialog open={!!viewProfile} onOpenChange={() => setViewProfile(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>User Profile</DialogTitle>
          </DialogHeader>
          {viewProfile && (
            <div className="space-y-3 text-sm">
              <div><span className="font-medium">Name:</span> {viewProfile.display_name || '—'}</div>
              <div><span className="font-medium">Job Title:</span> {viewProfile.job_title || '—'}</div>
              <div><span className="font-medium">Industry:</span> {viewProfile.industry || '—'}</div>
              <div><span className="font-medium">Career Goals:</span> {viewProfile.career_goals || '—'}</div>
              <div><span className="font-medium">Joined:</span> {new Date(viewProfile.created_at).toLocaleString()}</div>
              <div><span className="font-medium">Last Updated:</span> {new Date(viewProfile.updated_at).toLocaleString()}</div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
