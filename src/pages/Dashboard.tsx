import { useEffect, useState } from "react";
import { Users, BookOpen, ClipboardList, Award } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/StatCard";
import { getStudents, getSubjects, getResults, seedDemoData, type Student, type Subject, type Result } from "@/lib/store";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const COLORS = [
  "hsl(220, 60%, 25%)",
  "hsl(45, 70%, 55%)",
  "hsl(152, 60%, 40%)",
  "hsl(200, 80%, 50%)",
  "hsl(0, 72%, 51%)",
];

export default function Dashboard() {
  const [students, setStudents] = useState<Student[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [results, setResults] = useState<Result[]>([]);

  useEffect(() => {
    seedDemoData();
    setStudents(getStudents());
    setSubjects(getSubjects());
    setResults(getResults());
  }, []);

  const avgMarks = results.length > 0 ? Math.round(results.reduce((a, r) => a + r.marksObtained, 0) / results.length) : 0;
  const passCount = results.filter((r) => {
    const subject = subjects.find((s) => s.id === r.subjectId);
    return subject && r.marksObtained >= subject.passMarks;
  }).length;
  const passRate = results.length > 0 ? Math.round((passCount / results.length) * 100) : 0;

  // Subject-wise average
  const subjectAvg = subjects.map((sub) => {
    const subResults = results.filter((r) => r.subjectId === sub.id);
    const avg = subResults.length > 0 ? Math.round(subResults.reduce((a, r) => a + r.marksObtained, 0) / subResults.length) : 0;
    return { name: sub.name, average: avg };
  });

  // Grade distribution
  const gradeRanges = [
    { name: "A (90+)", min: 90, max: 100 },
    { name: "B (75-89)", min: 75, max: 89 },
    { name: "C (60-74)", min: 60, max: 74 },
    { name: "D (35-59)", min: 35, max: 59 },
    { name: "F (<35)", min: 0, max: 34 },
  ];

  // For grade distribution, use final exam results
  const finalResults = results.filter((r) => r.examType === "final");
  const gradeDist = gradeRanges.map((g) => ({
    name: g.name,
    value: finalResults.filter((r) => r.marksObtained >= g.min && r.marksObtained <= g.max).length,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-serif">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Overview of academic performance</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Students" value={students.length} icon={Users} description="Enrolled students" />
        <StatCard title="Subjects" value={subjects.length} icon={BookOpen} description="Active subjects" />
        <StatCard title="Avg. Marks" value={avgMarks} icon={ClipboardList} description="Across all exams" />
        <StatCard title="Pass Rate" value={`${passRate}%`} icon={Award} description="Overall pass rate" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="animate-fade-in">
          <CardHeader>
            <CardTitle className="font-serif text-xl">Subject-wise Average</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={subjectAvg}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 15%, 88%)" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis domain={[0, 100]} />
                <Tooltip
                  contentStyle={{
                    background: "hsl(0, 0%, 100%)",
                    border: "1px solid hsl(220, 15%, 88%)",
                    borderRadius: "8px",
                  }}
                />
                <Bar dataKey="average" fill="hsl(220, 60%, 25%)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="animate-fade-in">
          <CardHeader>
            <CardTitle className="font-serif text-xl">Grade Distribution (Final Exam)</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={gradeDist} cx="50%" cy="50%" innerRadius={60} outerRadius={110} paddingAngle={4} dataKey="value" label={({ name, value }) => (value > 0 ? `${name}: ${value}` : "")}>
                  {gradeDist.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
