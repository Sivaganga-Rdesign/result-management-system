import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, GraduationCap, User, BookOpen, FileText, Award, TrendingUp, ArrowLeft, Sparkles, ArrowUpRight, ArrowDownRight, Minus, AlertTriangle } from "lucide-react";
import { ReportCard } from "@/components/ReportCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { getStudents, getSubjects, getResults, seedDemoData, type Student, type Subject, type Result } from "@/lib/store";
import { evaluateResults, statusBadgeClass, ATKT_TOOLTIP } from "@/lib/resultCalc";
import { Tooltip as UITooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceArea, ReferenceDot } from "recharts";

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
  const [searchParams, setSearchParams] = useSearchParams();
  const queryRoll = searchParams.get("roll") || "";
  const [rollNo, setRollNo] = useState(queryRoll);
  const [student, setStudent] = useState<Student | null>(null);
  const [studentResults, setStudentResults] = useState<Result[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [searched, setSearched] = useState(false);
  const [showReportCard, setShowReportCard] = useState(false);

  const performSearch = useCallback((roll: string) => {
    if (!roll.trim()) return;
    seedDemoData();
    const allStudents = getStudents();
    const found = allStudents.find(
      (s) => s.rollNo.toLowerCase() === roll.trim().toLowerCase()
    );
    setSearched(true);
    setShowReportCard(false);
    if (found) {
      setStudent(found);
      setSubjects(getSubjects());
      setStudentResults(getResults().filter((r) => r.studentId === found.id));
    } else {
      setStudent(null);
      setStudentResults([]);
    }
  }, []);

  // React to URL search param changes (enables browser back button)
  useEffect(() => {
    if (queryRoll) {
      setRollNo(queryRoll);
      performSearch(queryRoll);
    } else {
      setSearched(false);
      setStudent(null);
      setStudentResults([]);
    }
  }, [queryRoll, performSearch]);

  const handleSearch = () => {
    if (!rollNo.trim()) return;
    setSearchParams({ roll: rollNo.trim() });
  };

  const handleNewSearch = () => {
    setRollNo("");
    setSearchParams({});
  };

  const evaluation = evaluateResults(studentResults, subjects);
  const overallPct = evaluation.percentage.toFixed(1);
  const passedCount = evaluation.evaluations.filter((e) => e.passed).length;
  const evalById = new Map(evaluation.evaluations.map((e) => [e.result.id, e]));

  return (
    <div className="space-y-8">
      {/* Hero Search Section */}
      {!student && (
        <div className="relative overflow-hidden rounded-2xl bg-primary py-16 px-8 text-center">
          {/* Decorative circles */}
          <div className="absolute top-[-20%] right-[-10%] w-[40%] h-[80%] rounded-full bg-secondary/10" />
          <div className="absolute bottom-[-30%] left-[-5%] w-[30%] h-[60%] rounded-full bg-secondary/10" />
          
          <div className="relative z-10 max-w-xl mx-auto space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary-foreground/10 text-primary-foreground/80 text-sm font-medium">
              <GraduationCap className="h-4 w-4" />
              ResultPro Student Portal
            </div>
            <h1 className="text-4xl md:text-5xl font-serif text-primary-foreground leading-tight">
              Check Your <span className="text-secondary">Results</span>
            </h1>
            <p className="text-primary-foreground/70 text-lg max-w-md mx-auto">
              Enter your roll number below to instantly access your exam results, grades, and downloadable report card.
            </p>

            <div className="flex items-center gap-3 max-w-md mx-auto bg-primary-foreground/10 backdrop-blur-sm rounded-xl p-2 border border-primary-foreground/10">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary-foreground/50" />
                <input
                  placeholder="Enter Roll Number (e.g. 2024001)"
                  className="w-full pl-10 pr-4 py-3 bg-transparent text-primary-foreground placeholder:text-primary-foreground/40 outline-none text-base"
                  value={rollNo}
                  onChange={(e) => setRollNo(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                />
              </div>
              <Button onClick={handleSearch} variant="secondary" size="lg" className="shrink-0 font-semibold">
                <Search className="mr-2 h-4 w-4" />
                Search
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Compact search bar when results are shown */}
      {student && (
        <Card className="animate-fade-in">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 max-w-lg">
              <Button variant="ghost" size="icon" onClick={handleNewSearch} className="shrink-0">
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Enter Roll Number"
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
      )}

      {/* Not Found */}
      {searched && !student && (
        <Card className="animate-fade-in border-destructive/30">
          <CardContent className="pt-6 text-center py-16">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 mb-4">
              <User className="h-8 w-8 text-destructive" />
            </div>
            <p className="text-xl font-serif font-medium">Student Not Found</p>
            <p className="text-muted-foreground text-sm mt-2 max-w-sm mx-auto">
              No student with roll number "<span className="font-mono font-semibold text-foreground">{rollNo}</span>" exists in our records. Please verify and try again.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Student Results */}
      {student && (
        <>
          {/* Student Info + Summary Stats */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 animate-fade-in">
            <Card className="lg:col-span-2">
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

            <div className="grid grid-cols-2 lg:grid-cols-1 gap-4">
              <Card className="bg-primary text-primary-foreground">
                <CardContent className="pt-6 flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-foreground/15">
                    <TrendingUp className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-3xl font-serif font-bold">{overallPct}%</p>
                    <p className="text-primary-foreground/70 text-xs">Overall Percentage</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-secondary text-secondary-foreground">
                <CardContent className="pt-6 flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-secondary-foreground/15">
                    <Award className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-3xl font-serif font-bold">{passedCount}/{studentResults.length}</p>
                    <p className="text-secondary-foreground/70 text-xs">Exams Passed</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Results Table */}
          <Card className="animate-fade-in">
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-2">
                <CardTitle className="font-serif flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-primary" />
                  Detailed Results
                </CardTitle>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline">{studentResults.length} results</Badge>
                  {evaluation.failedCount > 0 && (
                    <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/30">
                      {evaluation.failedCount} failed subject{evaluation.failedCount > 1 ? "s" : ""}
                    </Badge>
                  )}
                  {evaluation.graceUsed > 0 && (
                    <Badge variant="outline" className="bg-info/10 text-info border-info/30">
                      Grace applied to {evaluation.graceUsed} subject{evaluation.graceUsed > 1 ? "s" : ""} (+{evaluation.totalGraceMarks})
                    </Badge>
                  )}
                  <TooltipProvider delayDuration={150}>
                    <UITooltip>
                      <TooltipTrigger asChild>
                        <Badge variant="outline" className={`${statusBadgeClass(evaluation.status)} font-bold`}>
                          {evaluation.status}
                        </Badge>
                      </TooltipTrigger>
                      {evaluation.status === "ATKT" && (
                        <TooltipContent>{ATKT_TOOLTIP}</TooltipContent>
                      )}
                    </UITooltip>
                  </TooltipProvider>
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
                      const ev = evalById.get(r.id);
                      const effective = ev?.effectiveMarks ?? r.marksObtained;
                      const effMax = ev?.effectiveMax ?? subject?.maxMarks ?? 0;
                      const grade = effMax > 0 ? getGrade(effective, effMax) : "-";
                      const passed = ev?.passed ?? false;
                      const isFailedRow = !passed;
                      return (
                        <TableRow key={r.id} className={isFailedRow ? "bg-destructive/5" : undefined}>
                          <TableCell className="font-medium">{subject?.name || "Unknown"}</TableCell>
                          <TableCell><Badge variant="outline" className="capitalize">{r.examType}</Badge></TableCell>
                          <TableCell className="font-semibold">
                            {ev && ev.graceApplied > 0 ? (
                              <span className="inline-flex items-center gap-1.5">
                                <span className="text-muted-foreground line-through">{ev.originalMarks}</span>
                                <span>→</span>
                                <span>{ev.effectiveMarks}</span>
                                <span className="text-muted-foreground font-normal">/{effMax}</span>
                              </span>
                            ) : (
                              <>
                                {r.marksObtained}<span className="text-muted-foreground font-normal">/{effMax}</span>
                              </>
                            )}
                            {ev && ev.graceApplied > 0 && (
                              <Badge variant="outline" className="ml-2 bg-info/10 text-info border-info/30 text-[10px]">
                                Grace +{ev.graceApplied}
                              </Badge>
                            )}
                          </TableCell>
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
              {studentResults.length > 0 && !showReportCard && (
                <div className="mt-6 flex justify-center">
                  <Button onClick={() => setShowReportCard(true)} className="gap-2" size="lg">
                    <FileText className="h-4 w-4" />
                    View & Download Report Card
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Smart Analytics + Performance Chart */}
          {studentResults.length > 0 && (() => {
            // Compute per-subject percentage based on FINAL exam (fallback: best of any)
            const perSubject = subjects
              .map((sub) => {
                const subRes = studentResults.filter((r) => r.subjectId === sub.id);
                if (subRes.length === 0) return null;
                const finalRes = subRes.find((r) => r.examType === "final") ?? subRes[0];
                const pct = Math.round((finalRes.marksObtained / sub.maxMarks) * 100);
                const get = (type: Result["examType"]) => {
                  const found = subRes.find((r) => r.examType === type);
                  return found ? Math.round((found.marksObtained / sub.maxMarks) * 100) : null;
                };
                return {
                  subject: sub,
                  pct,
                  marks: finalRes.marksObtained,
                  max: sub.maxMarks,
                  Midterm: get("midterm"),
                  Final: get("final"),
                  Assignment: get("assignment"),
                };
              })
              .filter((x): x is NonNullable<typeof x> => x !== null);

            if (perSubject.length === 0) return null;

            const sortedDesc = [...perSubject].sort((a, b) => b.pct - a.pct);
            const highest = sortedDesc[0];
            const lowest = sortedDesc[sortedDesc.length - 1];
            const avg = Math.round(perSubject.reduce((a, b) => a + b.pct, 0) / perSubject.length);
            const weak = perSubject.filter((p) => p.pct < 50);

            // Trend: compare Midterm avg vs Final avg
            const midAvg = (() => {
              const arr = perSubject.map((p) => p.Midterm).filter((x): x is number => x !== null);
              return arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null;
            })();
            const finalAvg = (() => {
              const arr = perSubject.map((p) => p.Final).filter((x): x is number => x !== null);
              return arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null;
            })();
            let trend: { label: string; color: string; Icon: typeof Minus } = { label: "Consistent", color: "text-info", Icon: Minus };
            if (midAvg !== null && finalAvg !== null) {
              const diff = finalAvg - midAvg;
              if (diff > 3) trend = { label: "Improving", color: "text-success", Icon: ArrowUpRight };
              else if (diff < -3) trend = { label: "Declining", color: "text-destructive", Icon: ArrowDownRight };
            }

            const chartData = perSubject.map((p) => ({
              name: p.subject.name,
              Midterm: p.Midterm,
              Final: p.Final,
              Assignment: p.Assignment,
            }));

            // Build a "Trend" series across subjects (Final %) for high/low markers
            const trendSeries = perSubject.map((p) => ({ name: p.subject.name, value: p.Final ?? p.pct }));
            const tHigh = trendSeries.reduce((m, x) => (x.value > m.value ? x : m), trendSeries[0]);
            const tLow = trendSeries.reduce((m, x) => (x.value < m.value ? x : m), trendSeries[0]);

            return (
              <>
                {/* Smart Analytics */}
                <Card className="animate-fade-in border-secondary/30">
                  <CardHeader>
                    <CardTitle className="font-serif flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-secondary" />
                      Smart Analytics
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="rounded-lg border border-success/30 bg-success/5 p-3">
                        <p className="text-xs text-muted-foreground uppercase tracking-wider">Highest</p>
                        <p className="font-semibold mt-1">{highest.subject.name}</p>
                        <p className="text-2xl font-serif font-bold text-success">{highest.pct}%</p>
                      </div>
                      <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3">
                        <p className="text-xs text-muted-foreground uppercase tracking-wider">Lowest</p>
                        <p className="font-semibold mt-1">{lowest.subject.name}</p>
                        <p className="text-2xl font-serif font-bold text-destructive">{lowest.pct}%</p>
                      </div>
                      <div className="rounded-lg border border-primary/30 bg-primary/5 p-3">
                        <p className="text-xs text-muted-foreground uppercase tracking-wider">Average</p>
                        <p className="font-semibold mt-1">Across {perSubject.length} subjects</p>
                        <p className="text-2xl font-serif font-bold text-primary">{avg}%</p>
                      </div>
                      <div className="rounded-lg border border-border bg-muted/30 p-3">
                        <p className="text-xs text-muted-foreground uppercase tracking-wider">Trend</p>
                        <p className="font-semibold mt-1">Mid → Final</p>
                        <p className={`text-2xl font-serif font-bold flex items-center gap-1 ${trend.color}`}>
                          <trend.Icon className="h-5 w-5" />
                          {trend.label}
                        </p>
                      </div>
                    </div>
                    {weak.length > 0 && (
                      <div className="mt-4 flex items-start gap-2 rounded-lg border border-warning/30 bg-warning/5 p-3 text-sm">
                        <AlertTriangle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
                        <p>
                          <span className="font-semibold">Weak subject{weak.length > 1 ? "s" : ""}:</span>{" "}
                          {weak.map((w) => `${w.subject.name} (${w.pct}%)`).join(", ")} — needs attention.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Line chart with grade zones + high/low markers */}
                <Card className="animate-fade-in">
                  <CardHeader>
                    <CardTitle className="font-serif flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-primary" />
                      Performance Across Subjects
                    </CardTitle>
                    <p className="text-xs text-muted-foreground mt-1">
                      Background bands show grade zones (A / B / C / Below).
                    </p>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={340}>
                      <LineChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        {/* Grade zones */}
                        <ReferenceArea y1={75} y2={100} fill="hsl(var(--success))" fillOpacity={0.06} />
                        <ReferenceArea y1={60} y2={75} fill="hsl(var(--info))" fillOpacity={0.06} />
                        <ReferenceArea y1={35} y2={60} fill="hsl(var(--warning))" fillOpacity={0.06} />
                        <ReferenceArea y1={0} y2={35} fill="hsl(var(--destructive))" fillOpacity={0.06} />
                        <XAxis dataKey="name" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                        <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} label={{ value: "%", angle: -90, position: "insideLeft", style: { fill: "hsl(var(--muted-foreground))" } }} />
                        <Tooltip
                          contentStyle={{
                            background: "hsl(var(--background))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px",
                          }}
                          formatter={(value: number | null, name) => value === null ? ["—", name] : [`${value}%`, name]}
                        />
                        <Legend />
                        <Line type="monotone" dataKey="Midterm" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4 }} connectNulls />
                        <Line type="monotone" dataKey="Final" stroke="hsl(var(--secondary))" strokeWidth={2.5} dot={{ r: 5 }} connectNulls />
                        <Line type="monotone" dataKey="Assignment" stroke="hsl(var(--info))" strokeWidth={2} dot={{ r: 4 }} connectNulls />
                        {/* Highlight high/low on Final */}
                        {tHigh && <ReferenceDot x={tHigh.name} y={tHigh.value} r={7} fill="hsl(var(--success))" stroke="hsl(var(--background))" strokeWidth={2} ifOverflow="extendDomain" label={{ value: "High", position: "top", fill: "hsl(var(--success))", fontSize: 11 }} />}
                        {tLow && tLow.name !== tHigh?.name && <ReferenceDot x={tLow.name} y={tLow.value} r={7} fill="hsl(var(--destructive))" stroke="hsl(var(--background))" strokeWidth={2} ifOverflow="extendDomain" label={{ value: "Low", position: "bottom", fill: "hsl(var(--destructive))", fontSize: 11 }} />}
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </>
            );
          })()}

          {showReportCard && (
            <Card className="animate-fade-in">
              <CardHeader>
                <CardTitle className="font-serif flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  Report Card
                </CardTitle>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <ReportCard student={student} results={studentResults} subjects={subjects} />
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
