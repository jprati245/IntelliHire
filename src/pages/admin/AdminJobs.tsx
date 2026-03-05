import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Loader2, Plus, Pencil, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface Job {
  id: string;
  title: string;
  company: string;
  location: string | null;
  description: string;
  created_at: string;
}

const emptyForm = { title: '', company: '', location: '', description: '' };

export default function AdminJobs() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const fetchJobs = async () => {
    const { data } = await supabase
      .from('jobs')
      .select('id, title, company, location, description, created_at')
      .order('created_at', { ascending: false });
    setJobs((data as Job[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchJobs(); }, []);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (job: Job) => {
    setEditingId(job.id);
    setForm({ title: job.title, company: job.company || '', location: job.location || '', description: job.description });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.title.trim()) { toast.error('Title is required'); return; }
    setSaving(true);

    if (editingId) {
      const { error } = await supabase.from('jobs').update({
        title: form.title,
        company: form.company,
        location: form.location || null,
        description: form.description,
      }).eq('id', editingId);
      if (error) toast.error(error.message); else toast.success('Job updated');
    } else {
      const { error } = await supabase.from('jobs').insert({
        title: form.title,
        company: form.company,
        location: form.location || null,
        description: form.description,
        created_by: user!.id,
      });
      if (error) toast.error(error.message); else toast.success('Job created');
    }

    setSaving(false);
    setDialogOpen(false);
    fetchJobs();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this job?')) return;
    const { error } = await supabase.from('jobs').delete().eq('id', id);
    if (error) toast.error(error.message); else { toast.success('Deleted'); fetchJobs(); }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">Jobs Management</h1>
          <Button onClick={openCreate} size="sm">
            <Plus className="mr-1 h-4 w-4" /> Add Job
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Posted</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {jobs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">No jobs found</TableCell>
                  </TableRow>
                ) : (
                  jobs.map((job) => (
                    <TableRow key={job.id}>
                      <TableCell className="font-medium">{job.title}</TableCell>
                      <TableCell>{job.company || '—'}</TableCell>
                      <TableCell>{job.location || '—'}</TableCell>
                      <TableCell>{format(new Date(job.created_at), 'MMM d, yyyy')}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(job)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(job.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Job' : 'Add Job'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input placeholder="Job Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            <Input placeholder="Company" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} />
            <Input placeholder="Location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
            <Textarea placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={4} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingId ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
