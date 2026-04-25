import { useEffect, useMemo, useState } from "react";
import { Trophy, Medal, Award, Sparkles, RotateCcw, Crown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  getStudents, getSubjects, getResults, getSettings, getEffectiveMarks,
  type Student, type Subject, type Result, type ExamType as ExamTypeDef,
} from "@/lib/store";
import { evaluateResults, statusBadgeClass, ATKT_TOOLTIP, type FinalStatus } from "@/lib/resultCalc";
import { Tooltip as UITooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

function getGrade(pct: number): string {
  if (pct >= 90) return "A+";
  if (pct >= 80) return "A";
  if (pct >= 70) return "B+";
  if (pct >= 60) return "B";
  if (pct >= 50) return "C";
  if (pct >= 35) return "D";
  return "F";
}

function rankBadgeClass(rank: number): string {
  if (rank === 1) return "bg-[hsl(45,90%,55%)] text-[hsl(45,90%,15%)] border-[hsl(45,90%,45%)]";
  if (rank === 2) return "bg-[hsl(0,0%,75%)] text-[hsl(0,0%,15%)] border-[hsl(0,0%,60%)]";
  if (rank === 3) return "bg-[hsl(28,55%,45%)] text-primary-foreground border-[hsl(28,55%,35%)]";
  return "";
}

function RankIcon({ rank }: { rank: number }) {
  if (rank === 1) return <Crown className="h-4 w-4" />;
  if (rank === 2) return <Medal className="h-4 w-4" />;
  if (rank === 3) return <Award className="h-4 w-4" />;
  return null;
}

type ExamType = Result["examType"];

export default function Rankings() {
  const [students, setStudents] = useState<Student[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [results, setResults] = useState<Result[]>([]);
  const [examTypes, setExamTypes] = useState<ExamTypeDef[]>([]);
  const [examType, setExamType] = useState<ExamType>("final");
  const [classFilter, setClassFilter] = useState<string>("all");

  // What-If overrides: key = `${studentId}:${subjectId}:${examType}` -> marks
  const [overrides, setOverrides] = useState<Record<string, number>>({});

  useEffect(() => {
    setStudents(getStudents());
    setSubjects(getSubjects());
    setResults(getResults());
    const types = getSettings().examTypes;
    setExamTypes(types);
    // Default to first available exam type (or keep "final" if it exists).
    if (types.length > 0 && !types.some((t) => t.id === examType)) {
      setExamType(types[0].id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const classes = useMemo(
    () => Array.from(new Set(students.map((s) => s.class))).sort(),
    [students]
  );

  const visibleStudents = classFilter === "all"
    ? students
    : students.filter((s) => s.class === classFilter);

  // Effective marks lookup with overrides
  const getMarks = (studentId: string, subjectId: string, type: ExamType): number | null => {
    const key = `${studentId}:${subjectId}:${type}`;
    if (key in overrides) return overrides[key];
    const r = results.find(
      (r) => r.studentId === studentId && r.subjectId === subjectId && r.examType === type
    );
    return r ? r.marksObtained : null;
  };

  // Per-student aggregate for the chosen exam (with grace + ATKT applied).
  const studentStats = visibleStudents.map((student) => {
    // Build synthetic Result objects for this exam, applying overrides.
    const examResults: Result[] = [];
    for (const sub of subjects) {
      const m = getMarks(student.id, sub.id, examType);
      if (m === null) continue;
      examResults.push({
        id: `${student.id}:${sub.id}:${examType}`,
        studentId: student.id,
        subjectId: sub.id,
        marksObtained: m,
        examType,
        date: "",
      });
    }
    const hasAny = examResults.length > 0;
    const evalResult = evaluateResults(examResults, subjects, examTypes);
    return {
      student,
      total: evalResult.totalMarks,
      max: evalResult.totalMax,
      pct: evalResult.percentage,
      grade: getGrade(evalResult.percentage),
      status: hasAny ? evalResult.status : ("FAIL" as FinalStatus),
      failedCount: evalResult.failedCount,
      graceUsed: evalResult.graceUsed,
      hasAny,
    };
  });

  // Rank with ties (dense rank by percentage)
  const ranked = [...studentStats]
    .filter((s) => s.hasAny)
    .sort((a, b) => b.pct - a.pct);

  let lastPct = -1;
  let lastRank = 0;
  const rankedWithRank = ranked.map((entry, i) => {
    if (entry.pct !== lastPct) {
      lastRank = i + 1;
      lastPct = entry.pct;
    }
    return { ...entry, rank: lastRank };
  });

  // Subject toppers — use effective max/pass for the chosen exam type.
  const subjectToppers = subjects.map((sub) => {
    const eff = getEffectiveMarks(sub, examType, examTypes);
    const entries = visibleStudents
      .map((student) => {
        const m = getMarks(student.id, sub.id, examType);
        return m === null ? null : { student, marks: m, max: eff.maxMarks };
      })
      .filter((x): x is { student: Student; marks: number; max: number } => x !== null)
      .sort((a, b) => b.marks - a.marks);
    return { subject: sub, top: entries[0], effectiveMax: eff.maxMarks };
  });

  const hasOverrides = Object.keys(overrides).length > 0;
  const resetOverrides = () => setOverrides({});
  const setOverride = (studentId: string, subjectId: string, type: ExamType, value: string, max: number) => {
    const key = `${studentId}:${subjectId}:${type}`;
    if (value === "") {
      // Clear override -> revert to original
      setOverrides((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
      return;
    }
    const num = Math.floor(Number(value));
    if (Number.isNaN(num) || num < 0 || num > max) return;
    setOverrides((prev) => ({ ...prev, [key]: num }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-serif">Rankings & What-If</h1>
          <p className="text-muted-foreground mt-1">
            Live ranks, subject toppers, and instant simulations — overrides are not saved.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={classFilter} onValueChange={setClassFilter}>
            <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Classes</SelectItem>
              {classes.map((c) => (
                <SelectItem key={c} value={c}>Class {c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={examType} onValueChange={(v) => setExamType(v as ExamType)}>
            <SelectTrigger className="w-[160px]"><SelectValue placeholder="Exam type" /></SelectTrigger>
            <SelectContent>
              {examTypes.map((t) => {
                const suffix = t.maxMarks ? ` · ${t.maxMarks}` : "";
                return (
                  <SelectItem key={t.id} value={t.id}>
                    {t.label}{suffix}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>
      </div>

      {hasOverrides && (
        <Card className="border-secondary/40 bg-secondary/5 animate-fade-in">
          <CardContent className="pt-6 flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-secondary" />
              <p className="text-sm">
                <span className="font-semibold">What-If active:</span>{" "}
                {Object.keys(overrides).length} simulated change(s) applied. Nothing is saved.
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={resetOverrides}>
              <RotateCcw className="mr-2 h-4 w-4" /> Reset to actual marks
            </Button>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="ranks" className="w-full">
        <TabsList>
          <TabsTrigger value="ranks">Overall Rankings</TabsTrigger>
          <TabsTrigger value="toppers">Subject Toppers</TabsTrigger>
          <TabsTrigger value="whatif">What-If Editor</TabsTrigger>
        </TabsList>

        {/* === Overall Rankings === */}
        <TabsContent value="ranks" className="mt-4">
          <Card className="animate-fade-in">
            <CardHeader>
              <CardTitle className="font-serif">
                Student Rankings ({examTypes.find((t) => t.id === examType)?.label ?? examType})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {rankedWithRank.length === 0 ? (
                <p className="text-center text-muted-foreground py-10">
                  No results recorded for this exam yet.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-20">Rank</TableHead>
                      <TableHead>Student</TableHead>
                      <TableHead>Class</TableHead>
                      <TableHead>Roll No</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>%</TableHead>
                      <TableHead>Grade</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rankedWithRank.map((e) => (
                      <TableRow key={e.student.id}>
                        <TableCell>
                          <Badge
                            variant={e.rank <= 3 ? "default" : "outline"}
                            className={`gap-1 ${rankBadgeClass(e.rank)}`}
                          >
                            <RankIcon rank={e.rank} />#{e.rank}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium text-foreground">{e.student.name}</TableCell>
                        <TableCell>{e.student.class} - {e.student.section}</TableCell>
                        <TableCell className="font-mono text-sm">{e.student.rollNo}</TableCell>
                        <TableCell className="font-semibold">
                          {e.total}<span className="text-muted-foreground font-normal">/{e.max}</span>
                        </TableCell>
                        <TableCell className="font-semibold">{e.pct.toFixed(1)}%</TableCell>
                        <TableCell>
                          <Badge variant="outline">{e.grade}</Badge>
                        </TableCell>
                        <TableCell>
                          <TooltipProvider delayDuration={150}>
                            <UITooltip>
                              <TooltipTrigger asChild>
                                <Badge variant="outline" className={`${statusBadgeClass(e.status)} font-bold gap-1`}>
                                  {e.status}
                                  {e.failedCount > 0 && (
                                    <span className="font-normal opacity-80">· {e.failedCount} failed</span>
                                  )}
                                </Badge>
                              </TooltipTrigger>
                              {e.status === "ATKT" && (
                                <TooltipContent>{ATKT_TOOLTIP}</TooltipContent>
                              )}
                              {e.graceUsed > 0 && e.status !== "ATKT" && (
                                <TooltipContent>Grace applied to {e.graceUsed} subject{e.graceUsed > 1 ? "s" : ""}.</TooltipContent>
                              )}
                            </UITooltip>
                          </TooltipProvider>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* === Subject Toppers === */}
        <TabsContent value="toppers" className="mt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-fade-in">
            {subjectToppers.map(({ subject, top }) => (
              <Card key={subject.id} className="overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <CardTitle className="font-serif text-lg">{subject.name}</CardTitle>
                      <p className="text-xs text-muted-foreground mt-1 font-mono">{subject.code}</p>
                    </div>
                    <Trophy className="h-5 w-5 text-secondary shrink-0" />
                  </div>
                </CardHeader>
                <CardContent>
                  {top ? (
                    <div className="space-y-1">
                      <p className="text-xl font-serif font-semibold">{top.student.name}</p>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="secondary">Roll {top.student.rollNo}</Badge>
                        <Badge variant="outline">Class {top.student.class}</Badge>
                      </div>
                      <p className="text-3xl font-bold text-primary mt-3">
                        {top.marks}
                        <span className="text-base text-muted-foreground font-normal">/{top.max}</span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {((top.marks / top.max) * 100).toFixed(1)}% in {examType}
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground py-2">No marks recorded yet.</p>
                  )}
                </CardContent>
              </Card>
            ))}
            {subjectToppers.length === 0 && (
              <p className="text-muted-foreground col-span-full text-center py-10">
                Add subjects first.
              </p>
            )}
          </div>
        </TabsContent>

        {/* === What-If Editor === */}
        <TabsContent value="whatif" className="mt-4">
          <Card className="animate-fade-in">
            <CardHeader>
              <CardTitle className="font-serif">What-If Mark Editor</CardTitle>
              <p className="text-sm text-muted-foreground">
                Temporarily change marks to see live updates to %, grade, and rank above. Leave a cell empty to revert it.
              </p>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              {visibleStudents.length === 0 || subjects.length === 0 ? (
                <p className="text-center text-muted-foreground py-10">
                  Add students and subjects to use this tool.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      {subjects.map((s) => {
                        const eff = getEffectiveMarks(s, examType, examTypes);
                        return (
                          <TableHead key={s.id} className="min-w-[120px]">
                            <div className="font-medium text-foreground">{s.name}</div>
                            <div className="text-[10px] text-muted-foreground">/{eff.maxMarks}</div>
                          </TableHead>
                        );
                      })}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {visibleStudents.map((student) => (
                      <TableRow key={student.id}>
                        <TableCell className="font-medium">
                          {student.name}
                          <div className="text-xs text-muted-foreground font-mono">{student.rollNo}</div>
                        </TableCell>
                        {subjects.map((sub) => {
                          const key = `${student.id}:${sub.id}:${examType}`;
                          const isOverride = key in overrides;
                          const eff = getEffectiveMarks(sub, examType, examTypes);
                          const value = isOverride
                            ? overrides[key]
                            : results.find((r) => r.studentId === student.id && r.subjectId === sub.id && r.examType === examType)?.marksObtained;
                          return (
                            <TableCell key={sub.id}>
                              <Label className="sr-only" htmlFor={key}>{student.name} {sub.name}</Label>
                              <Input
                                id={key}
                                type="number"
                                min={0}
                                max={eff.maxMarks}
                                step={1}
                                placeholder="—"
                                value={value ?? ""}
                                onChange={(e) => setOverride(student.id, sub.id, examType, e.target.value, eff.maxMarks)}
                                className={`h-9 ${isOverride ? "border-secondary ring-1 ring-secondary/40" : ""}`}
                              />
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
