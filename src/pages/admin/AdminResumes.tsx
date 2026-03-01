import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';

export default function AdminResumes() {
  const [resumes, setResumes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchResumes = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('resume_analyses')
      .select('*')
      .order('created_at', { ascending: false });
    setResumes(data ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchResumes(); }, []);

  const handleDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from('resume_analyses').delete().eq('id', deleteId);
    if (error) toast.error('Failed to delete');
    else { toast.success('Resume record deleted'); fetchResumes(); }
    setDeleteId(null);
  };

  const filtered = resumes
    .filter((r) => {
      const q = search.toLowerCase();
      return r.file_name.toLowerCase().includes(q) || (r.analysis_status || '').toLowerCase().includes(q);
    })
    .sort((a, b) => {
      if (sortBy === 'score') return (b.resume_score ?? 0) - (a.resume_score ?? 0);
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  return (
    <AdminLayout>
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Resume Management</h1>

        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date">Sort by Date</SelectItem>
              <SelectItem value="score">Sort by Score</SelectItem>
            </SelectContent>
          </Select>
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
                      <th className="p-4 font-medium">File</th>
                      <th className="p-4 font-medium">Score</th>
                      <th className="p-4 font-medium">Skills</th>
                      <th className="p-4 font-medium">Status</th>
                      <th className="p-4 font-medium">Date</th>
                      <th className="p-4 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.length === 0 ? (
                      <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">No resumes found.</td></tr>
                    ) : (
                      filtered.map((r) => {
                        const skills = Array.isArray(r.technical_skills) ? r.technical_skills : [];
                        return (
                          <tr key={r.id} className="border-b last:border-0 hover:bg-muted/50">
                            <td className="p-4 font-medium max-w-[200px] truncate">{r.file_name}</td>
                            <td className="p-4">
                              <Badge variant={r.resume_score >= 70 ? 'default' : 'secondary'}>
                                {r.resume_score ?? 0}
                              </Badge>
                            </td>
                            <td className="p-4">
                              <div className="flex flex-wrap gap-1">
                                {skills.slice(0, 3).map((s: string, i: number) => (
                                  <Badge key={i} variant="outline" className="text-xs">{s}</Badge>
                                ))}
                                {skills.length > 3 && <Badge variant="outline" className="text-xs">+{skills.length - 3}</Badge>}
                              </div>
                            </td>
                            <td className="p-4">
                              <Badge variant={r.analysis_status === 'completed' ? 'default' : 'secondary'}>
                                {r.analysis_status}
                              </Badge>
                            </td>
                            <td className="p-4 text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</td>
                            <td className="p-4 text-right">
                              <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setDeleteId(r.id)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Resume Record?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
