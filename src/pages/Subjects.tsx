import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { getSubjects, addSubject, updateSubject, deleteSubject, getSettings, saveSettings, type Subject } from "@/lib/store";
import { toast } from "sonner";
import { Settings as SettingsIcon } from "lucide-react";

const buildEmptyForm = () => {
  const s = getSettings();
  return { name: "", code: "", maxMarks: s.defaultMaxMarks, passMarks: s.defaultPassMarks };
};

export default function Subjects() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const reload = () => setSubjects(getSubjects());
  useEffect(reload, []);

  const handleSubmit = () => {
    if (!form.name || !form.code) {
      toast.error("Please fill in required fields");
      return;
    }
    if (editId) {
      updateSubject(editId, form);
      toast.success("Subject updated");
    } else {
      addSubject(form);
      toast.success("Subject added");
    }
    setForm(emptyForm);
    setEditId(null);
    setOpen(false);
    reload();
  };

  const handleEdit = (s: Subject) => {
    setForm({ name: s.name, code: s.code, maxMarks: s.maxMarks, passMarks: s.passMarks });
    setEditId(s.id);
    setOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif">Subjects</h1>
          <p className="text-muted-foreground mt-1">Manage course subjects</p>
        </div>
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) { setForm(emptyForm); setEditId(null); } }}>
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
                  <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                </div>
                <div className="grid gap-2">
                  <Label>Subject Code *</Label>
                  <Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Max Marks</Label>
                  <Input type="number" value={form.maxMarks} onChange={(e) => setForm({ ...form, maxMarks: Number(e.target.value) })} />
                </div>
                <div className="grid gap-2">
                  <Label>Pass Marks</Label>
                  <Input type="number" value={form.passMarks} onChange={(e) => setForm({ ...form, passMarks: Number(e.target.value) })} />
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
                  <TableCell className="font-medium">{s.name}</TableCell>
                  <TableCell><Badge variant="outline">{s.code}</Badge></TableCell>
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
