import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getStudents, getSubjects, getResults, type Student, type Subject, type Result } from "@/lib/store";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Trophy } from "lucide-react";

export default function Analytics() {
  const [students, setStudents] = useState<Student[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [results, setResults] = useState<Result[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>("all");

  useEffect(() => {
    setStudents(getStudents());
    setSubjects(getSubjects());
    setResults(getResults());
  }, []);

  const classes = [...new Set(students.map((s) => s.class))].sort();

  // Set default class
  useEffect(() => {
    if (classes.length > 0 && selectedClass === "all") {
      setSelectedClass(classes[0]);
    }
  }, [classes]);

  const filteredStudents = students.filter((s) => s.class === selectedClass);
  const filteredResults = results.filter((r) => filteredStudents.some((s) => s.id === r.studentId));

  // Student rankings (by final exam average) for selected class
  const studentRankings = filteredStudents.map((student) => {
    const studentFinals = filteredResults.filter((r) => r.studentId === student.id && r.examType === "final");
    const totalMarks = studentFinals.reduce((a, r) => a + r.marksObtained, 0);
    const avg = studentFinals.length > 0 ? Math.round(totalMarks / studentFinals.length) : 0;
    const percentage = studentFinals.length > 0
      ? Math.round((totalMarks / (studentFinals.length * (subjects[0]?.maxMarks || 100))) * 100)
      : 0;
    return { ...student, avg, totalMarks, percentage, subjectCount: studentFinals.length };
  }).sort((a, b) => b.avg - a.avg);

  const topper = studentRankings[0];

  // Exam type comparison per subject for selected class
  const examComparison = subjects.map((sub) => {
    const midterm = filteredResults.filter((r) => r.subjectId === sub.id && r.examType === "midterm");
    const final_ = filteredResults.filter((r) => r.subjectId === sub.id && r.examType === "final");
    const assignment = filteredResults.filter((r) => r.subjectId === sub.id && r.examType === "assignment");
    const avg = (arr: Result[]) => arr.length > 0 ? Math.round(arr.reduce((a, r) => a + r.marksObtained, 0) / arr.length) : 0;
    return { name: sub.name, Midterm: avg(midterm), Final: avg(final_), Assignment: avg(assignment) };
  });

  // Pass rate for selected class
  const passCount = filteredResults.filter((r) => {
    const sub = subjects.find((s) => s.id === r.subjectId);
    return sub && r.marksObtained >= sub.passMarks;
  }).length;
  const passRate = filteredResults.length > 0 ? Math.round((passCount / filteredResults.length) * 100) : 0;
  const avgMarks = filteredResults.length > 0 ? Math.round(filteredResults.reduce((a, r) => a + r.marksObtained, 0) / filteredResults.length) : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif">Analytics</h1>
          <p className="text-muted-foreground mt-1">Class-wise performance analysis</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Select Class:</span>
          <Select value={selectedClass} onValueChange={setSelectedClass}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Select class" />
            </SelectTrigger>
            <SelectContent>
              {classes.map((cls) => (
                <SelectItem key={cls} value={cls}>Class {cls}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Topper Card */}
      {topper && topper.avg > 0 && (
        <Card className="animate-fade-in border-accent bg-accent/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-accent">
                <Trophy className="h-7 w-7 text-accent-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Class {selectedClass} Topper (Final Exam)</p>
                <p className="text-2xl font-serif font-semibold">{topper.name}</p>
                <div className="flex gap-3 mt-1">
                  <Badge variant="secondary">Roll: {topper.rollNo}</Badge>
                  <Badge variant="secondary">Avg: {topper.avg} marks</Badge>
                  <Badge variant="secondary">{topper.percentage}%</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-3xl font-serif font-bold">{filteredStudents.length}</p>
            <p className="text-sm text-muted-foreground">Students in Class {selectedClass}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-3xl font-serif font-bold">{avgMarks}</p>
            <p className="text-sm text-muted-foreground">Average Marks</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-3xl font-serif font-bold">{passRate}%</p>
            <p className="text-sm text-muted-foreground">Pass Rate</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Card className="animate-fade-in">
        <CardHeader>
          <CardTitle className="font-serif text-xl">Exam Type Comparison — Class {selectedClass}</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={examComparison}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 15%, 88%)" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis domain={[0, 100]} />
              <Tooltip contentStyle={{ background: "hsl(0,0%,100%)", border: "1px solid hsl(220,15%,88%)", borderRadius: "8px" }} />
              <Legend />
              <Bar dataKey="Midterm" fill="hsl(220, 60%, 25%)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Final" fill="hsl(45, 70%, 55%)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Assignment" fill="hsl(152, 60%, 40%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Rankings Table */}
      <Card className="animate-fade-in">
        <CardHeader>
          <CardTitle className="font-serif text-xl">Student Rankings — Class {selectedClass} (Final Exam)</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Rank</TableHead>
                <TableHead>Student</TableHead>
                <TableHead>Section</TableHead>
                <TableHead>Roll No</TableHead>
                <TableHead>Avg Marks</TableHead>
                <TableHead>Percentage</TableHead>
                <TableHead>Performance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {studentRankings.map((s, i) => {
                const rankClass =
                  i === 0
                    ? "bg-[hsl(45,90%,55%)] text-[hsl(45,90%,15%)] border-[hsl(45,90%,45%)]"
                    : i === 1
                    ? "bg-[hsl(0,0%,75%)] text-[hsl(0,0%,15%)] border-[hsl(0,0%,60%)]"
                    : i === 2
                    ? "bg-[hsl(28,55%,45%)] text-primary-foreground border-[hsl(28,55%,35%)]"
                    : "";
                return (
                <TableRow key={s.id}>
                  <TableCell>
                    <Badge variant={i < 3 ? "default" : "outline"} className={rankClass}>
                      #{i + 1}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium">{s.name}</TableCell>
                  <TableCell>{s.section}</TableCell>
                  <TableCell className="font-mono text-sm">{s.rollNo}</TableCell>
                  <TableCell>{s.avg}</TableCell>
                  <TableCell>{s.percentage}%</TableCell>
                  <TableCell>
                    <div className="w-full bg-muted rounded-full h-2 max-w-[120px]">
                      <div className="bg-primary h-2 rounded-full transition-all" style={{ width: `${Math.min(s.percentage, 100)}%` }} />
                    </div>
                  </TableCell>
                </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
