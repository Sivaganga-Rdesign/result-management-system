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

  // Exam types manager
  const [examTypesOpen, setExamTypesOpen] = useState(false);
  const [examTypes, setExamTypes] = useState<ExamType[]>(() => getSettings().examTypes);
  const [newExamLabel, setNewExamLabel] = useState("");

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

  // ----- Exam types manager -----
  const addExamType = () => {
    const label = newExamLabel.trim();
    if (!label) {
      toast.error("Enter an exam type name");
      return;
    }
    if (label.length > 40) {
      toast.error("Name is too long (max 40 chars)");
      return;
    }
    const id = slugifyExamType(label);
    if (!id) {
      toast.error("Use letters or numbers in the name");
      return;
    }
    if (examTypes.some((t) => t.id === id)) {
      toast.error("This exam type already exists");
      return;
    }
    setExamTypes([...examTypes, { id, label }]);
    setNewExamLabel("");
  };

  const removeExamType = (id: string) => {
    if (examTypes.length <= 1) {
      toast.error("At least one exam type is required");
      return;
    }
    setExamTypes(examTypes.filter((t) => t.id !== id));
  };

  const renameExamType = (id: string, label: string) => {
    setExamTypes(examTypes.map((t) => (t.id === id ? { ...t, label } : t)));
  };

  const updateExamMarks = (
    id: string,
    field: "maxMarks" | "passMarks",
    raw: string
  ) => {
    setExamTypes(
      examTypes.map((t) => {
        if (t.id !== id) return t;
        if (raw === "") {
          const next = { ...t };
          delete (next as Partial<ExamType>)[field];
          return next;
        }
        const num = Math.max(0, Math.floor(Number(raw) || 0));
        return { ...t, [field]: num };
      })
    );
  };

  const handleSaveExamTypes = () => {
    const cleaned: ExamType[] = [];
    for (const t of examTypes) {
      const label = t.label.trim();
      if (!label) continue;
      const next: ExamType = { id: t.id, label };
      if (t.maxMarks !== undefined) {
        if (!Number.isInteger(t.maxMarks) || t.maxMarks <= 0) {
          toast.error(`"${label}": Max marks must be a positive whole number`);
          return;
        }
        next.maxMarks = t.maxMarks;
      }
      if (t.passMarks !== undefined) {
        if (!Number.isInteger(t.passMarks) || t.passMarks < 0) {
          toast.error(`"${label}": Pass marks must be 0 or more`);
          return;
        }
        if (next.maxMarks !== undefined && t.passMarks > next.maxMarks) {
          toast.error(`"${label}": Pass marks cannot exceed max marks`);
          return;
        }
        next.passMarks = t.passMarks;
      }
      cleaned.push(next);
    }
    if (cleaned.length === 0) {
      toast.error("Add at least one exam type");
      return;
    }
    saveSettings({ examTypes: cleaned });
    toast.success("Exam types saved");
    setExamTypesOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-3xl font-serif">Subjects</h1>
          <p className="text-muted-foreground mt-1">Manage course subjects</p>
        </div>
        <div className="flex items-center gap-2">
          <Dialog
            open={examTypesOpen}
            onOpenChange={(o) => {
              setExamTypesOpen(o);
              if (o) { setExamTypes(getSettings().examTypes); setNewExamLabel(""); }
            }}
          >
            <DialogTrigger asChild>
              <Button variant="outline"><ListChecks className="mr-2 h-4 w-4" />Exam Types</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="font-serif">Manage Exam Types</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <p className="text-sm text-muted-foreground">
                  These appear in the "Exam Type" dropdown when adding results
                  (e.g. Midterm, Semester Final, Practical, Unit Test, CA1, CA2, Project).
                </p>

                <div className="grid gap-2">
                  <Label>Add new exam type</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="e.g. Viva, Lab Test, Pre-Board"
                      value={newExamLabel}
                      maxLength={40}
                      onChange={(e) => setNewExamLabel(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addExamType(); } }}
                    />
                    <Button type="button" onClick={addExamType}>
                      <Plus className="mr-1 h-4 w-4" />Add
                    </Button>
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label>Current exam types ({examTypes.length})</Label>
                  <div className="rounded-md border divide-y max-h-[22rem] overflow-auto">
                    <div className="grid grid-cols-[1fr_5rem_5rem_auto] gap-2 px-2 py-1.5 text-[11px] uppercase tracking-wider text-muted-foreground bg-muted/40 sticky top-0">
                      <span>Name</span>
                      <span>Max</span>
                      <span>Pass</span>
                      <span className="sr-only">Remove</span>
                    </div>
                    {examTypes.map((t) => (
                      <div key={t.id} className="grid grid-cols-[1fr_5rem_5rem_auto] gap-2 p-2 items-center">
                        <div className="flex items-center gap-2 min-w-0">
                          <Input
                            value={t.label}
                            maxLength={40}
                            onChange={(e) => renameExamType(t.id, e.target.value)}
                            className="h-9"
                          />
                          <Badge variant="outline" className="font-mono text-[10px] shrink-0">{t.id}</Badge>
                        </div>
                        <Input
                          type="number"
                          min={1}
                          step={1}
                          placeholder="—"
                          value={t.maxMarks ?? ""}
                          onChange={(e) => updateExamMarks(t.id, "maxMarks", e.target.value)}
                          className="h-9"
                          title="Max marks for this exam type (overrides subject default)"
                        />
                        <Input
                          type="number"
                          min={0}
                          step={1}
                          placeholder="—"
                          value={t.passMarks ?? ""}
                          onChange={(e) => updateExamMarks(t.id, "passMarks", e.target.value)}
                          className="h-9"
                          title="Pass marks for this exam type (overrides subject default)"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="shrink-0"
                          onClick={() => removeExamType(t.id)}
                          aria-label={`Remove ${t.label}`}
                        >
                          <X className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
                    {examTypes.length === 0 && (
                      <p className="text-sm text-muted-foreground p-3 text-center">No exam types yet.</p>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    <span className="font-medium">Max / Pass</span> override the subject's defaults
                    for this exam (e.g. <em>Unit Test = 50 / 20</em>). Leave blank to use the subject's
                    own values. Removing an exam type does not delete results that already use it.
                  </p>
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                <Button onClick={handleSaveExamTypes}>Save Exam Types</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

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
