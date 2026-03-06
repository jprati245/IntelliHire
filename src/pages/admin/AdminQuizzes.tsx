import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Plus, Pencil, Trash2, HelpCircle } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correct_answer: number;
  category: string;
  topic: string;
  difficulty: string;
  created_at: string;
}

interface QuizForm {
  question: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: string;
  category: string;
  difficulty: string;
}

const emptyForm: QuizForm = {
  question: '',
  optionA: '',
  optionB: '',
  optionC: '',
  optionD: '',
  correctAnswer: '',
  category: '',
  difficulty: '',
};

const CATEGORIES = ['CS Fundamentals', 'Aptitude'];
const DIFFICULTIES = ['Easy', 'Medium', 'Hard'];
const ANSWER_OPTIONS = ['A', 'B', 'C', 'D'];

export default function AdminQuizzes() {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<QuizForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchQuestions = async () => {
    const { data } = await supabase
      .from('quiz_questions')
      .select('*')
      .order('created_at', { ascending: false });
    setQuestions((data as QuizQuestion[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchQuestions(); }, []);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (q: QuizQuestion) => {
    const opts = Array.isArray(q.options) ? q.options : [];
    setEditingId(q.id);
    setForm({
      question: q.question,
      optionA: (opts[0] as string) || '',
      optionB: (opts[1] as string) || '',
      optionC: (opts[2] as string) || '',
      optionD: (opts[3] as string) || '',
      correctAnswer: ANSWER_OPTIONS[q.correct_answer] || 'A',
      category: q.category,
      difficulty: q.difficulty,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.question.trim() || !form.optionA.trim() || !form.optionB.trim() || !form.optionC.trim() || !form.optionD.trim() || !form.correctAnswer || !form.category || !form.difficulty) {
      toast.error('All fields are required');
      return;
    }
    setSaving(true);

    const payload = {
      question: form.question,
      options: JSON.stringify([form.optionA, form.optionB, form.optionC, form.optionD]),
      correct_answer: ANSWER_OPTIONS.indexOf(form.correctAnswer),
      category: form.category,
      topic: form.category,
      difficulty: form.difficulty.toLowerCase(),
    };

    if (editingId) {
      const { error } = await supabase.from('quiz_questions').update(payload).eq('id', editingId);
      if (error) toast.error(error.message); else toast.success('Question updated');
    } else {
      const { error } = await supabase.from('quiz_questions').insert(payload);
      if (error) toast.error(error.message); else toast.success('Question created');
    }

    setSaving(false);
    setDialogOpen(false);
    fetchQuestions();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from('quiz_questions').delete().eq('id', deleteId);
    if (error) toast.error(error.message); else { toast.success('Deleted'); fetchQuestions(); }
    setDeleteId(null);
  };

  const getAnswerLabel = (idx: number) => ANSWER_OPTIONS[idx] || '—';

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Quiz Management</h1>
            <p className="text-sm mt-1" style={{ color: '#6b7280' }}>Create, edit, and manage quiz questions</p>
          </div>
          <Button
            onClick={openCreate}
            size="sm"
            className="border-none text-white"
            style={{ background: 'linear-gradient(135deg, #ef4444, #f97316)' }}
          >
            <Plus className="mr-1 h-4 w-4" /> Add Question
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
                  <TableHead style={{ color: '#9ca3af' }}>Question</TableHead>
                  <TableHead style={{ color: '#9ca3af' }}>Category</TableHead>
                  <TableHead style={{ color: '#9ca3af' }}>Difficulty</TableHead>
                  <TableHead style={{ color: '#9ca3af' }}>Answer</TableHead>
                  <TableHead style={{ color: '#9ca3af' }}>Created</TableHead>
                  <TableHead className="text-right" style={{ color: '#9ca3af' }}>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {questions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12" style={{ color: '#6b7280' }}>
                      <HelpCircle className="h-8 w-8 mx-auto mb-2 opacity-40" />
                      No quiz questions found. Add your first question!
                    </TableCell>
                  </TableRow>
                ) : (
                  questions.map((q) => (
                    <TableRow key={q.id} style={{ borderBottom: '1px solid #1f2233' }}>
                      <TableCell className="font-medium text-white max-w-xs truncate">{q.question}</TableCell>
                      <TableCell>
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{
                          background: q.category === 'Aptitude' ? 'rgba(168,85,247,0.15)' : 'rgba(59,130,246,0.15)',
                          color: q.category === 'Aptitude' ? '#a855f7' : '#3b82f6',
                        }}>
                          {q.category}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{
                          background: q.difficulty === 'easy' ? 'rgba(34,197,94,0.15)' : q.difficulty === 'medium' ? 'rgba(234,179,8,0.15)' : 'rgba(239,68,68,0.15)',
                          color: q.difficulty === 'easy' ? '#22c55e' : q.difficulty === 'medium' ? '#eab308' : '#ef4444',
                        }}>
                          {q.difficulty.charAt(0).toUpperCase() + q.difficulty.slice(1)}
                        </span>
                      </TableCell>
                      <TableCell style={{ color: '#9ca3af' }}>{getAnswerLabel(q.correct_answer)}</TableCell>
                      <TableCell style={{ color: '#9ca3af' }}>{format(new Date(q.created_at), 'MMM d, yyyy')}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(q)} className="hover:bg-white/10" style={{ color: '#9ca3af' }}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setDeleteId(q.id)} className="hover:bg-red-500/10" style={{ color: '#ef4444' }}>
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

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg" style={{ background: '#161821', border: '1px solid #2a2d3a' }}>
          <DialogHeader>
            <DialogTitle className="text-white">{editingId ? 'Edit Question' : 'Add Question'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
            <Textarea placeholder="Question text" value={form.question} onChange={(e) => setForm({ ...form, question: e.target.value })} rows={3} className="border-[#2a2d3a] bg-[#0f1117] text-white placeholder:text-[#6b7280]" />
            <Input placeholder="Option A" value={form.optionA} onChange={(e) => setForm({ ...form, optionA: e.target.value })} className="border-[#2a2d3a] bg-[#0f1117] text-white placeholder:text-[#6b7280]" />
            <Input placeholder="Option B" value={form.optionB} onChange={(e) => setForm({ ...form, optionB: e.target.value })} className="border-[#2a2d3a] bg-[#0f1117] text-white placeholder:text-[#6b7280]" />
            <Input placeholder="Option C" value={form.optionC} onChange={(e) => setForm({ ...form, optionC: e.target.value })} className="border-[#2a2d3a] bg-[#0f1117] text-white placeholder:text-[#6b7280]" />
            <Input placeholder="Option D" value={form.optionD} onChange={(e) => setForm({ ...form, optionD: e.target.value })} className="border-[#2a2d3a] bg-[#0f1117] text-white placeholder:text-[#6b7280]" />
            <Select value={form.correctAnswer} onValueChange={(v) => setForm({ ...form, correctAnswer: v })}>
              <SelectTrigger className="border-[#2a2d3a] bg-[#0f1117] text-white">
                <SelectValue placeholder="Correct Answer" />
              </SelectTrigger>
              <SelectContent style={{ background: '#161821', border: '1px solid #2a2d3a' }}>
                {ANSWER_OPTIONS.map((opt) => (
                  <SelectItem key={opt} value={opt} className="text-white hover:bg-white/10">{`Option ${opt}`}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
              <SelectTrigger className="border-[#2a2d3a] bg-[#0f1117] text-white">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent style={{ background: '#161821', border: '1px solid #2a2d3a' }}>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat} className="text-white hover:bg-white/10">{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={form.difficulty} onValueChange={(v) => setForm({ ...form, difficulty: v })}>
              <SelectTrigger className="border-[#2a2d3a] bg-[#0f1117] text-white">
                <SelectValue placeholder="Difficulty" />
              </SelectTrigger>
              <SelectContent style={{ background: '#161821', border: '1px solid #2a2d3a' }}>
                {DIFFICULTIES.map((d) => (
                  <SelectItem key={d} value={d} className="text-white hover:bg-white/10">{d}</SelectItem>
                ))}
              </SelectContent>
            </Select>
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

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent style={{ background: '#161821', border: '1px solid #2a2d3a' }}>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Delete Question</AlertDialogTitle>
            <AlertDialogDescription style={{ color: '#9ca3af' }}>
              Are you sure you want to delete this question? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-[#2a2d3a] text-white hover:bg-white/10">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="border-none text-white" style={{ background: '#ef4444' }}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
