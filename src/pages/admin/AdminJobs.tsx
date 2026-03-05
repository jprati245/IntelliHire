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
          <div>
            <h1 className="text-2xl font-bold text-white">Jobs Management</h1>
            <p className="text-sm mt-1" style={{ color: '#6b7280' }}>Create, edit, and manage job listings</p>
          </div>
          <Button
            onClick={openCreate}
            size="sm"
            className="border-none text-white"
            style={{ background: 'linear-gradient(135deg, #ef4444, #f97316)' }}
          >
            <Plus className="mr-1 h-4 w-4" /> Add Job
          </Button>
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
                  <TableHead style={{ color: '#9ca3af' }}>Title</TableHead>
                  <TableHead style={{ color: '#9ca3af' }}>Company</TableHead>
                  <TableHead style={{ color: '#9ca3af' }}>Location</TableHead>
                  <TableHead style={{ color: '#9ca3af' }}>Posted</TableHead>
                  <TableHead className="text-right" style={{ color: '#9ca3af' }}>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {jobs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center" style={{ color: '#6b7280' }}>No jobs found</TableCell>
                  </TableRow>
                ) : (
                  jobs.map((job) => (
                    <TableRow key={job.id} style={{ borderBottom: '1px solid #1f2233' }}>
                      <TableCell className="font-medium text-white">{job.title}</TableCell>
                      <TableCell style={{ color: '#9ca3af' }}>{job.company || '—'}</TableCell>
                      <TableCell style={{ color: '#9ca3af' }}>{job.location || '—'}</TableCell>
                      <TableCell style={{ color: '#9ca3af' }}>{format(new Date(job.created_at), 'MMM d, yyyy')}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEdit(job)}
                          className="hover:bg-white/10"
                          style={{ color: '#9ca3af' }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(job.id)}
                          className="hover:bg-red-500/10"
                          style={{ color: '#ef4444' }}
                        >
                          <Trash2 className="h-4 w-4" />
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
        <DialogContent style={{ background: '#161821', border: '1px solid #2a2d3a' }}>
          <DialogHeader>
            <DialogTitle className="text-white">{editingId ? 'Edit Job' : 'Add Job'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input placeholder="Job Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="border-[#2a2d3a] bg-[#0f1117] text-white placeholder:text-[#6b7280]" />
            <Input placeholder="Company" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} className="border-[#2a2d3a] bg-[#0f1117] text-white placeholder:text-[#6b7280]" />
            <Input placeholder="Location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className="border-[#2a2d3a] bg-[#0f1117] text-white placeholder:text-[#6b7280]" />
            <Textarea placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={4} className="border-[#2a2d3a] bg-[#0f1117] text-white placeholder:text-[#6b7280]" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} className="border-[#2a2d3a] text-white hover:bg-white/10">Cancel</Button>
            <Button onClick={handleSave} disabled={saving} className="border-none text-white" style={{ background: 'linear-gradient(135deg, #ef4444, #f97316)' }}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingId ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
