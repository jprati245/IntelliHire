import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Trash2, X, Save } from 'lucide-react';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

interface JobForm {
  title: string;
  description: string;
  required_skills: string;
  experience_level: string;
  location: string;
  salary_range: string;
  status: string;
}

const emptyForm: JobForm = {
  title: '', description: '', required_skills: '', experience_level: 'entry',
  location: '', salary_range: '', status: 'active',
};

export default function AdminJobs() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<JobForm>(emptyForm);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchJobs = async () => {
    setLoading(true);
    const { data } = await supabase.from('jobs').select('*').order('created_at', { ascending: false });
    setJobs(data ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchJobs(); }, []);

  const openCreate = () => { setForm(emptyForm); setEditId(null); setDialogOpen(true); };

  const openEdit = (job: any) => {
    setForm({
      title: job.title,
      description: job.description,
      required_skills: Array.isArray(job.required_skills) ? (job.required_skills as string[]).join(', ') : '',
      experience_level: job.experience_level,
      location: job.location || '',
      salary_range: job.salary_range || '',
      status: job.status,
    });
    setEditId(job.id);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.title.trim()) { toast.error('Title is required'); return; }
    setSaving(true);
    const skills = form.required_skills.split(',').map((s) => s.trim()).filter(Boolean);
    const payload = {
      title: form.title,
      description: form.description,
      required_skills: skills,
      experience_level: form.experience_level,
      location: form.location || null,
      salary_range: form.salary_range || null,
      status: form.status,
    };

    if (editId) {
      const { error } = await supabase.from('jobs').update(payload).eq('id', editId);
      if (error) toast.error('Failed to update'); else toast.success('Job updated');
    } else {
      const { error } = await supabase.from('jobs').insert({ ...payload, created_by: user!.id });
      if (error) toast.error('Failed to create'); else toast.success('Job created');
    }
    setSaving(false);
    setDialogOpen(false);
    fetchJobs();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from('jobs').delete().eq('id', deleteId);
    if (error) toast.error('Failed to delete'); else { toast.success('Job deleted'); fetchJobs(); }
    setDeleteId(null);
  };

  return (
    <AdminLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Job Management</h1>
          <Button onClick={openCreate}><Plus className="mr-1 h-4 w-4" /> Add Job</Button>
        </div>

        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="space-y-3 p-6">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="p-4 font-medium">Title</th>
                      <th className="p-4 font-medium">Level</th>
                      <th className="p-4 font-medium">Skills</th>
                      <th className="p-4 font-medium">Status</th>
                      <th className="p-4 font-medium">Created</th>
                      <th className="p-4 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {jobs.length === 0 ? (
                      <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">No jobs yet.</td></tr>
                    ) : jobs.map((j) => {
                      const skills = Array.isArray(j.required_skills) ? j.required_skills : [];
                      return (
                        <tr key={j.id} className="border-b last:border-0 hover:bg-muted/50">
                          <td className="p-4 font-medium">{j.title}</td>
                          <td className="p-4 capitalize text-muted-foreground">{j.experience_level}</td>
                          <td className="p-4">
                            <div className="flex flex-wrap gap-1">
                              {(skills as string[]).slice(0, 3).map((s, i) => <Badge key={i} variant="outline" className="text-xs">{s}</Badge>)}
                              {skills.length > 3 && <Badge variant="outline" className="text-xs">+{skills.length - 3}</Badge>}
                            </div>
                          </td>
                          <td className="p-4">
                            <Badge variant={j.status === 'active' ? 'default' : 'secondary'}>{j.status}</Badge>
                          </td>
                          <td className="p-4 text-muted-foreground">{new Date(j.created_at).toLocaleDateString()}</td>
                          <td className="p-4 text-right">
                            <div className="flex justify-end gap-1">
                              <Button variant="ghost" size="icon" onClick={() => openEdit(j)}><Pencil className="h-4 w-4" /></Button>
                              <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setDeleteId(j.id)}><Trash2 className="h-4 w-4" /></Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editId ? 'Edit Job' : 'Create Job'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div><Label>Title *</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
            <div><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} /></div>
            <div><Label>Required Skills (comma-separated)</Label><Input value={form.required_skills} onChange={(e) => setForm({ ...form, required_skills: e.target.value })} placeholder="React, Node.js, SQL" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Experience Level</Label>
                <Select value={form.experience_level} onValueChange={(v) => setForm({ ...form, experience_level: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="entry">Entry</SelectItem>
                    <SelectItem value="mid">Mid</SelectItem>
                    <SelectItem value="senior">Senior</SelectItem>
                    <SelectItem value="lead">Lead</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Location</Label><Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} /></div>
              <div><Label>Salary Range</Label><Input value={form.salary_range} onChange={(e) => setForm({ ...form, salary_range: e.target.value })} /></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Job?</AlertDialogTitle>
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
