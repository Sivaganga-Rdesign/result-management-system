import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Settings as SettingsIcon, ListChecks, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  getSubjects, addSubject, updateSubject, deleteSubject,
  getSettings, saveSettings, slugifyExamType,
  type Subject, type ExamType,
} from "@/lib/store";
import { toast } from "sonner";

const buildEmptyForm = () => {
  const s = getSettings();
  return { name: "", code: "", maxMarks: s.defaultMaxMarks, passMarks: s.defaultPassMarks };
};

export default function Subjects() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [form, setForm] = useState(buildEmptyForm);
  const [editId, setEditId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  // Settings dialog
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settings, setSettings] = useState(getSettings);

  const reload = () => setSubjects(getSubjects());
  useEffect(reload, []);

  const validateMarks = (max: number, pass: number) => {
    if (!Number.isFinite(max) || max <= 0 || !Number.isInteger(max)) {
      toast.error("Max marks must be a positive integer");
      return false;
    }
    if (!Number.isFinite(pass) || pass < 0 || !Number.isInteger(pass)) {
      toast.error("Pass marks must be a non-negative integer");
      return false;
    }
    if (pass > max) {
      toast.error("Pass marks cannot exceed max marks");
      return false;
    }
    return true;
  };

  const handleSubmit = () => {
    if (!form.name.trim() || !form.code.trim()) {
      toast.error("Please fill in required fields");
      return;
    }
    if (!validateMarks(form.maxMarks, form.passMarks)) return;

    if (editId) {
      updateSubject(editId, form);
      toast.success("Subject updated");
    } else {
      addSubject(form);
      toast.success("Subject added");
    }
    setForm(buildEmptyForm());
    setEditId(null);
    setOpen(false);
    reload();
  };

  const handleEdit = (s: Subject) => {
    setForm({ name: s.name, code: s.code, maxMarks: s.maxMarks, passMarks: s.passMarks });
    setEditId(s.id);
    setOpen(true);
  };

  const handleSaveSettings = () => {
    if (!validateMarks(settings.defaultMaxMarks, settings.defaultPassMarks)) return;
    saveSettings(settings);
    toast.success("Settings saved");
    setSettingsOpen(false);
    setForm(buildEmptyForm());
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-3xl font-serif">Subjects</h1>
          <p className="text-muted-foreground mt-1">Manage course subjects</p>
        </div>
        <div className="flex items-center gap-2">
          <Dialog open={settingsOpen} onOpenChange={(o) => { setSettingsOpen(o); if (o) setSettings(getSettings()); }}>
            <DialogTrigger asChild>
              <Button variant="outline"><SettingsIcon className="mr-2 h-4 w-4" />Defaults</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="font-serif">Global Subject Defaults</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <p className="text-sm text-muted-foreground">
                  These values pre-fill new subjects. You can still override them per subject.
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Default Max Marks</Label>
                    <Input
                      type="number"
                      min={1}
                      step={1}
                      value={settings.defaultMaxMarks}
                      onChange={(e) => setSettings({ ...settings, defaultMaxMarks: Math.max(1, Math.floor(Number(e.target.value) || 0)) })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Default Pass Marks</Label>
                    <Input
                      type="number"
                      min={0}
                      step={1}
                      value={settings.defaultPassMarks}
                      onChange={(e) => setSettings({ ...settings, defaultPassMarks: Math.max(0, Math.floor(Number(e.target.value) || 0)) })}
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label>School / Institution Name</Label>
                  <Input
                    value={settings.schoolName}
                    onChange={(e) => setSettings({ ...settings, schoolName: e.target.value })}
                    placeholder="e.g. ResultPro Academy"
                    maxLength={80}
                  />
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                <Button onClick={handleSaveSettings}>Save Settings</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) { setForm(buildEmptyForm()); setEditId(null); } }}>
            <DialogTrigger asChild>
              <Button><Plus className="mr-2 h-4 w-4" />Add Subject</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="font-serif">{editId ? "Edit" : "Add"} Subject</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Subject Name *</Label>
                    <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} maxLength={60} />
                  </div>
                  <div className="grid gap-2">
                    <Label>Subject Code *</Label>
                    <Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} maxLength={16} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Max Marks</Label>
                    <Input
                      type="number"
                      min={1}
                      step={1}
                      value={form.maxMarks}
                      onChange={(e) => setForm({ ...form, maxMarks: Math.max(1, Math.floor(Number(e.target.value) || 0)) })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Pass Marks</Label>
                    <Input
                      type="number"
                      min={0}
                      max={form.maxMarks}
                      step={1}
                      value={form.passMarks}
                      onChange={(e) => setForm({ ...form, passMarks: Math.max(0, Math.floor(Number(e.target.value) || 0)) })}
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                <Button onClick={handleSubmit}>{editId ? "Update" : "Add"}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card className="animate-fade-in">
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Subject Name</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Max Marks</TableHead>
                <TableHead>Pass Marks</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subjects.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium text-foreground">{s.name}</TableCell>
                  <TableCell><Badge variant="outline" className="font-mono">{s.code}</Badge></TableCell>
                  <TableCell>{s.maxMarks}</TableCell>
                  <TableCell>{s.passMarks}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(s)}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => { deleteSubject(s.id); toast.success("Subject deleted"); reload(); }}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </TableCell>
                </TableRow>
              ))}
              {subjects.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">No subjects found</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
