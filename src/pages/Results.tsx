import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Search, Check, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { getStudents, getSubjects, getResults, addResult, updateResult, deleteResult, type Student, type Subject, type Result } from "@/lib/store";
import { toast } from "sonner";

function highlightMatch(text: string, query: string, exact: boolean) {
  if (!query) return text;
  const q = query.toLowerCase();
  const t = text.toLowerCase();
  if (exact && t === q) {
    return <mark className="bg-secondary text-secondary-foreground rounded px-1">{text}</mark>;
  }
  if (!exact && t.startsWith(q)) {
    return (
      <>
        <mark className="bg-secondary/40 text-foreground rounded px-0.5">{text.slice(0, query.length)}</mark>
        {text.slice(query.length)}
      </>
    );
  }
  return text;
}

function getGrade(marks: number, max: number): string {
  const pct = (marks / max) * 100;
  if (pct >= 90) return "A+";
  if (pct >= 80) return "A";
  if (pct >= 70) return "B+";
  if (pct >= 60) return "B";
  if (pct >= 50) return "C";
  if (pct >= 35) return "D";
  return "F";
}

function gradeColor(grade: string): string {
  if (grade.startsWith("A")) return "bg-success/10 text-success border-success/20";
  if (grade.startsWith("B")) return "bg-info/10 text-info border-info/20";
  if (grade.startsWith("C")) return "bg-warning/10 text-warning border-warning/20";
  if (grade === "D") return "bg-accent/10 text-accent-foreground border-accent/20";
  return "bg-destructive/10 text-destructive border-destructive/20";
}

export default function Results() {
  const [students, setStudents] = useState<Student[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [results, setResults] = useState<Result[]>([]);
  const [search, setSearch] = useState("");
  const [filterExam, setFilterExam] = useState<string>("all");
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [studentPickerOpen, setStudentPickerOpen] = useState(false);
  const [studentQuery, setStudentQuery] = useState("");

  const [form, setForm] = useState({
    studentId: "",
    subjectId: "",
    marksObtained: "" as string,
    examType: "final" as Result["examType"],
    date: new Date().toISOString().split("T")[0],
  });

  const reload = () => {
    setStudents(getStudents());
    setSubjects(getSubjects());
    setResults(getResults());
  };
  useEffect(reload, []);

  const filtered = results.filter((r) => {
    const student = students.find((s) => s.id === r.studentId);
    const subject = subjects.find((s) => s.id === r.subjectId);
    const matchSearch =
      !search ||
      student?.name.toLowerCase().includes(search.toLowerCase()) ||
      subject?.name.toLowerCase().includes(search.toLowerCase());
    const matchExam = filterExam === "all" || r.examType === filterExam;
    return matchSearch && matchExam;
  });

  // If search exactly matches a student name, only highlight that exact one
  const hasExactNameMatch = !!search && students.some((s) => s.name.toLowerCase() === search.toLowerCase());
  const hasExactSubjectMatch = !!search && subjects.some((s) => s.name.toLowerCase() === search.toLowerCase());

  const handleSubmit = () => {
    if (!form.studentId || !form.subjectId) {
      toast.error("Please select student and subject");
      return;
    }
    const subject = subjects.find((s) => s.id === form.subjectId);
    const max = subject?.maxMarks ?? 100;
    const marks = Number(form.marksObtained);
    if (form.marksObtained === "" || Number.isNaN(marks)) {
      toast.error("Please enter marks");
      return;
    }
    if (marks < 0 || marks > max) {
      toast.error(`Marks must be between 0 and ${max}`);
      return;
    }
    const payload = {
      studentId: form.studentId,
      subjectId: form.subjectId,
      marksObtained: marks,
      examType: form.examType,
      date: form.date,
    };
    if (editId) {
      updateResult(editId, payload);
      toast.success("Result updated");
    } else {
      addResult(payload);
      toast.success("Result added");
    }
    setEditId(null);
    setForm({ studentId: "", subjectId: "", marksObtained: "", examType: "final", date: new Date().toISOString().split("T")[0] });
    setOpen(false);
    reload();
  };

  const handleEdit = (r: Result) => {
    setForm({ studentId: r.studentId, subjectId: r.subjectId, marksObtained: String(r.marksObtained), examType: r.examType, date: r.date });
    setEditId(r.id);
    setOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif">Results</h1>
          <p className="text-muted-foreground mt-1">View and manage exam results</p>
        </div>
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) { setEditId(null); setForm({ studentId: "", subjectId: "", marksObtained: "", examType: "final", date: new Date().toISOString().split("T")[0] }); } else if (!editId) { setForm((f) => ({ ...f, date: new Date().toISOString().split("T")[0] })); } }}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" />Add Result</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="font-serif">{editId ? "Edit" : "Add"} Result</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Student</Label>
                <Popover open={studentPickerOpen} onOpenChange={setStudentPickerOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      role="combobox"
                      aria-expanded={studentPickerOpen}
                      className="justify-between font-normal"
                    >
                      {form.studentId
                        ? (() => {
                            const s = students.find((x) => x.id === form.studentId);
                            return s ? `${s.name} (${s.rollNo})` : "Select student";
                          })()
                        : "Select student"}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                    <Command
                      filter={(value, search) => {
                        // Prefix-match: items only show if name/roll starts with the query
                        if (!search) return 1;
                        return value.toLowerCase().startsWith(search.toLowerCase()) ? 1 : 0;
                      }}
                    >
                      <CommandInput
                        placeholder="Type a letter (e.g. 'a' shows all A names)..."
                        value={studentQuery}
                        onValueChange={setStudentQuery}
                      />
                      <CommandList>
                        <CommandEmpty>No matching student.</CommandEmpty>
                        <CommandGroup>
                          {students.map((s) => {
                            const q = studentQuery.toLowerCase();
                            const isPrefix = q && s.name.toLowerCase().startsWith(q);
                            return (
                              <CommandItem
                                key={s.id}
                                value={`${s.name} ${s.rollNo}`}
                                onSelect={() => {
                                  setForm({ ...form, studentId: s.id });
                                  setStudentPickerOpen(false);
                                  setStudentQuery("");
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    form.studentId === s.id ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                <span className="flex-1">
                                  {isPrefix ? (
                                    <>
                                      <mark className="bg-secondary/40 text-foreground rounded px-0.5">
                                        {s.name.slice(0, q.length)}
                                      </mark>
                                      {s.name.slice(q.length)}
                                    </>
                                  ) : (
                                    s.name
                                  )}
                                  <span className="text-muted-foreground ml-2 text-xs">({s.rollNo})</span>
                                </span>
                              </CommandItem>
                            );
                          })}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
              <div className="grid gap-2">
                <Label>Subject</Label>
                <Select value={form.subjectId} onValueChange={(v) => setForm({ ...form, subjectId: v })}>
                  <SelectTrigger><SelectValue placeholder="Select subject" /></SelectTrigger>
                  <SelectContent>
                    {subjects.map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.name} ({s.code})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Marks Obtained</Label>
                  <Input
                    type="number"
                    inputMode="numeric"
                    min={0}
                    max={form.subjectId ? (subjects.find((s) => s.id === form.subjectId)?.maxMarks ?? 100) : 100}
                    placeholder="0"
                    value={form.marksObtained}
                    onChange={(e) => {
                      const raw = e.target.value;
                      // Allow empty so users can clear and retype
                      if (raw === "") {
                        setForm({ ...form, marksObtained: "" });
                        return;
                      }
                      // Strip leading zeros (e.g. "05" -> "5", but keep "0")
                      const cleaned = raw.replace(/^0+(?=\d)/, "");
                      const num = Number(cleaned);
                      if (Number.isNaN(num)) return;
                      const max = form.subjectId ? (subjects.find((s) => s.id === form.subjectId)?.maxMarks ?? 100) : 100;
                      if (num < 0 || num > max) return;
                      setForm({ ...form, marksObtained: cleaned });
                    }}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Exam Type</Label>
                  <Select value={form.examType} onValueChange={(v) => setForm({ ...form, examType: v as Result["examType"] })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="midterm">Midterm</SelectItem>
                      <SelectItem value="final">Final</SelectItem>
                      <SelectItem value="assignment">Assignment</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Date</Label>
                <Input
                  type="date"
                  value={form.date}
                  readOnly
                  disabled
                  title="Date is locked to today"
                />
                <p className="text-xs text-muted-foreground">Locked to today's date.</p>
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
              <Button onClick={handleSubmit}>{editId ? "Update" : "Add"} Result</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="animate-fade-in">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search by student or subject..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <Select value={filterExam} onValueChange={setFilterExam}>
              <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Exams</SelectItem>
                <SelectItem value="midterm">Midterm</SelectItem>
                <SelectItem value="final">Final</SelectItem>
                <SelectItem value="assignment">Assignment</SelectItem>
              </SelectContent>
            </Select>
            <Badge variant="secondary">{filtered.length} {filtered.length === 1 ? "result" : "results"}</Badge>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Exam</TableHead>
                <TableHead>Marks</TableHead>
                <TableHead>Grade</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.slice(0, 50).map((r) => {
                const student = students.find((s) => s.id === r.studentId);
                const subject = subjects.find((s) => s.id === r.subjectId);
                const grade = subject ? getGrade(r.marksObtained, subject.maxMarks) : "-";
                const passed = subject ? r.marksObtained >= subject.passMarks : false;
                return (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{student ? highlightMatch(student.name, search, hasExactNameMatch) : "Unknown"}</TableCell>
                    <TableCell>{subject ? highlightMatch(subject.name, search, hasExactSubjectMatch) : "Unknown"}</TableCell>
                    <TableCell><Badge variant="outline" className="capitalize">{r.examType}</Badge></TableCell>
                    <TableCell>{r.marksObtained}/{subject?.maxMarks}</TableCell>
                    <TableCell><Badge className={gradeColor(grade)} variant="outline">{grade}</Badge></TableCell>
                    <TableCell>
                      {passed ? (
                        <Badge className="bg-success/10 text-success border-success/20" variant="outline">Pass</Badge>
                      ) : (
                        <Badge className="bg-destructive/10 text-destructive border-destructive/20" variant="outline">Fail</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(r)}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => { deleteResult(r.id); toast.success("Deleted"); reload(); }}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">No results found</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
