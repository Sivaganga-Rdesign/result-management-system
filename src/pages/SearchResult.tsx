import { useState } from "react";
import { Search, GraduationCap, User, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { getStudents, getSubjects, getResults, type Student, type Subject, type Result } from "@/lib/store";

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

export default function SearchResult() {
  const [rollNo, setRollNo] = useState("");
  const [student, setStudent] = useState<Student | null>(null);
  const [studentResults, setStudentResults] = useState<Result[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [searched, setSearched] = useState(false);

  const handleSearch = () => {
    if (!rollNo.trim()) return;
    const allStudents = getStudents();
    const found = allStudents.find(
      (s) => s.rollNo.toLowerCase() === rollNo.trim().toLowerCase()
    );
    setSearched(true);
    if (found) {
      setStudent(found);
      setSubjects(getSubjects());
      setStudentResults(getResults().filter((r) => r.studentId === found.id));
    } else {
      setStudent(null);
      setStudentResults([]);
    }
  };

  const totalMarks = studentResults.reduce((sum, r) => sum + r.marksObtained, 0);
  const totalMax = studentResults.reduce((sum, r) => {
    const sub = subjects.find((s) => s.id === r.subjectId);
    return sum + (sub?.maxMarks || 0);
  }, 0);
  const overallPct = totalMax > 0 ? ((totalMarks / totalMax) * 100).toFixed(1) : "0";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-serif">Search Result</h1>
        <p className="text-muted-foreground mt-1">Enter your roll number to view your results</p>
      </div>

      <Card className="animate-fade-in">
        <CardHeader>
          <CardTitle className="font-serif flex items-center gap-2">
            <Search className="h-5 w-5 text-primary" />
            Find Your Result
          </CardTitle>
          <CardDescription>Enter your roll number to search for your exam results</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 max-w-md">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Enter Roll Number (e.g. 2024001)"
                className="pl-9"
                value={rollNo}
                onChange={(e) => setRollNo(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
            </div>
            <Button onClick={handleSearch}>
              <Search className="mr-2 h-4 w-4" />
              Search
            </Button>
          </div>
        </CardContent>
      </Card>

      {searched && !student && (
        <Card className="animate-fade-in border-destructive/30">
          <CardContent className="pt-6 text-center py-12">
            <User className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-lg font-medium">No student found</p>
            <p className="text-muted-foreground text-sm mt-1">
              No student with roll number "<span className="font-mono font-semibold">{rollNo}</span>" was found. Please check and try again.
            </p>
          </CardContent>
        </Card>
      )}

      {student && (
        <>
          <Card className="animate-fade-in">
            <CardHeader>
              <CardTitle className="font-serif flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-primary" />
                Student Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Name</p>
                  <p className="font-semibold mt-1">{student.name}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Admission No</p>
                  <p className="font-semibold mt-1">{student.admissionNo}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Roll No</p>
                  <p className="font-semibold mt-1">{student.rollNo}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Class & Section</p>
                  <p className="font-semibold mt-1">{student.class} - {student.section}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="animate-fade-in">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="font-serif flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-primary" />
                  Exam Results
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">Overall: {overallPct}%</Badge>
                  <Badge variant="secondary">{studentResults.length} results</Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {studentResults.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No results found for this student.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Subject</TableHead>
                      <TableHead>Exam Type</TableHead>
                      <TableHead>Marks</TableHead>
                      <TableHead>Grade</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {studentResults.map((r) => {
                      const subject = subjects.find((s) => s.id === r.subjectId);
                      const grade = subject ? getGrade(r.marksObtained, subject.maxMarks) : "-";
                      const passed = subject ? r.marksObtained >= subject.passMarks : false;
                      return (
                        <TableRow key={r.id}>
                          <TableCell className="font-medium">{subject?.name || "Unknown"}</TableCell>
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
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
