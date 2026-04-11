import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getStudents, getSubjects, getResults, type Student, type Subject, type Result } from "@/lib/store";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from "recharts";

export default function Analytics() {
  const [students, setStudents] = useState<Student[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [results, setResults] = useState<Result[]>([]);

  useEffect(() => {
    setStudents(getStudents());
    setSubjects(getSubjects());
    setResults(getResults());
  }, []);

  // Student rankings (by final exam average)
  const studentRankings = students.map((student) => {
    const studentFinals = results.filter((r) => r.studentId === student.id && r.examType === "final");
    const totalMarks = studentFinals.reduce((a, r) => a + r.marksObtained, 0);
    const avg = studentFinals.length > 0 ? Math.round(totalMarks / studentFinals.length) : 0;
    const percentage = studentFinals.length > 0
      ? Math.round((totalMarks / (studentFinals.length * (subjects[0]?.maxMarks || 100))) * 100)
      : 0;
    return { ...student, avg, totalMarks, percentage, subjectCount: studentFinals.length };
  }).sort((a, b) => b.avg - a.avg);

  // Exam type comparison per subject
  const examComparison = subjects.map((sub) => {
    const midterm = results.filter((r) => r.subjectId === sub.id && r.examType === "midterm");
    const final_ = results.filter((r) => r.subjectId === sub.id && r.examType === "final");
    const assignment = results.filter((r) => r.subjectId === sub.id && r.examType === "assignment");
    const avg = (arr: Result[]) => arr.length > 0 ? Math.round(arr.reduce((a, r) => a + r.marksObtained, 0) / arr.length) : 0;
    return { name: sub.name, Midterm: avg(midterm), Final: avg(final_), Assignment: avg(assignment) };
  });

  // Class-wise stats
  const classes = [...new Set(students.map((s) => s.class))].sort();
  const classStats = classes.map((cls) => {
    const classStudents = students.filter((s) => s.class === cls);
    const classResults = results.filter((r) => classStudents.some((s) => s.id === r.studentId));
    const avg = classResults.length > 0 ? Math.round(classResults.reduce((a, r) => a + r.marksObtained, 0) / classResults.length) : 0;
    const passed = classResults.filter((r) => {
      const sub = subjects.find((s) => s.id === r.subjectId);
      return sub && r.marksObtained >= sub.passMarks;
    }).length;
    const passRate = classResults.length > 0 ? Math.round((passed / classResults.length) * 100) : 0;
    return { class: `Class ${cls}`, students: classStudents.length, average: avg, passRate };
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-serif">Analytics</h1>
        <p className="text-muted-foreground mt-1">In-depth performance analysis</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="animate-fade-in">
          <CardHeader>
            <CardTitle className="font-serif text-xl">Exam Type Comparison</CardTitle>
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

        <Card className="animate-fade-in">
          <CardHeader>
            <CardTitle className="font-serif text-xl">Class Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={classStats}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 15%, 88%)" />
                <XAxis dataKey="class" />
                <YAxis domain={[0, 100]} />
                <Tooltip contentStyle={{ background: "hsl(0,0%,100%)", border: "1px solid hsl(220,15%,88%)", borderRadius: "8px" }} />
                <Legend />
                <Bar dataKey="average" name="Avg Marks" fill="hsl(200, 80%, 50%)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="passRate" name="Pass Rate %" fill="hsl(152, 60%, 40%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card className="animate-fade-in">
        <CardHeader>
          <CardTitle className="font-serif text-xl">Student Rankings (Final Exam)</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Rank</TableHead>
                <TableHead>Student</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Avg Marks</TableHead>
                <TableHead>Percentage</TableHead>
                <TableHead>Performance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {studentRankings.map((s, i) => (
                <TableRow key={s.id}>
                  <TableCell>
                    <Badge variant={i < 3 ? "default" : "outline"} className={i === 0 ? "bg-accent text-accent-foreground" : ""}>
                      #{i + 1}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium">{s.name}</TableCell>
                  <TableCell>{s.class}-{s.section}</TableCell>
                  <TableCell>{s.avg}</TableCell>
                  <TableCell>{s.percentage}%</TableCell>
                  <TableCell>
                    <div className="w-full bg-muted rounded-full h-2 max-w-[120px]">
                      <div className="bg-primary h-2 rounded-full transition-all" style={{ width: `${Math.min(s.percentage, 100)}%` }} />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
