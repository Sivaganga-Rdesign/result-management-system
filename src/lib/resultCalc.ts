// Grace Marks + ATKT logic — frontend-only, modular calculator.
// Used across SearchResult, ReportCard, and Rankings.

import type { Result, Subject } from "@/lib/store";

export const GRACE_MAX_GAP = 5;       // marks below pass that are eligible for grace
export const GRACE_MAX_SUBJECTS = 2;  // max subjects that can receive grace
export const ATKT_MAX_FAILS = 2;      // up to this many fails after grace = ATKT

export type FinalStatus = "PASS" | "ATKT" | "FAIL";

export interface SubjectEval {
  result: Result;
  subject: Subject;
  originalMarks: number;
  effectiveMarks: number;     // after grace
  graceApplied: number;       // 0 if none
  passed: boolean;            // after grace
  eligibleForGrace: boolean;  // would have been eligible (gap ≤5, originally failing)
}

export interface ResultEvaluation {
  evaluations: SubjectEval[];
  failedEvaluations: SubjectEval[];
  graceUsed: number;          // count of subjects where grace was applied
  totalGraceMarks: number;
  totalMarks: number;         // sum of effective marks
  totalMax: number;
  percentage: number;         // recalculated after grace
  status: FinalStatus;
  failedCount: number;
}

/**
 * Apply grace marks then determine PASS / ATKT / FAIL.
 *
 * Rules:
 *  - A subject is grace-eligible when originalMarks < passMarks AND
 *    (passMarks - originalMarks) <= GRACE_MAX_GAP.
 *  - Grace is applied to at most GRACE_MAX_SUBJECTS subjects.
 *    Tie-break: prefer subjects needing the LEAST grace (cheapest first),
 *    then by subject name for determinism.
 *  - After grace: 0 fails → PASS, 1–2 fails → ATKT, >2 fails → FAIL.
 */
export function evaluateResults(
  results: Result[],
  subjects: Subject[]
): ResultEvaluation {
  // Pair results with their subject; ignore orphan results.
  const paired = results
    .map((r) => {
      const subject = subjects.find((s) => s.id === r.subjectId);
      return subject ? { r, subject } : null;
    })
    .filter((x): x is { r: Result; subject: Subject } => x !== null);

  // Build base evaluations (no grace yet).
  const base: SubjectEval[] = paired.map(({ r, subject }) => {
    const originallyPassed = r.marksObtained >= subject.passMarks;
    const gap = subject.passMarks - r.marksObtained;
    const eligibleForGrace = !originallyPassed && gap > 0 && gap <= GRACE_MAX_GAP;
    return {
      result: r,
      subject,
      originalMarks: r.marksObtained,
      effectiveMarks: r.marksObtained,
      graceApplied: 0,
      passed: originallyPassed,
      eligibleForGrace,
    };
  });

  // Pick which eligible subjects actually receive grace (cheapest first, capped).
  const candidates = base
    .filter((e) => e.eligibleForGrace)
    .sort((a, b) => {
      const gapA = a.subject.passMarks - a.originalMarks;
      const gapB = b.subject.passMarks - b.originalMarks;
      if (gapA !== gapB) return gapA - gapB;
      return a.subject.name.localeCompare(b.subject.name);
    })
    .slice(0, GRACE_MAX_SUBJECTS);

  const graceIds = new Set(candidates.map((c) => c.result.id));

  const evaluations = base.map((e) => {
    if (!graceIds.has(e.result.id)) return e;
    const grace = e.subject.passMarks - e.originalMarks;
    return {
      ...e,
      effectiveMarks: e.subject.passMarks,
      graceApplied: grace,
      passed: true,
    };
  });

  const failedEvaluations = evaluations.filter((e) => !e.passed);
  const failedCount = failedEvaluations.length;
  const graceUsed = evaluations.filter((e) => e.graceApplied > 0).length;
  const totalGraceMarks = evaluations.reduce((s, e) => s + e.graceApplied, 0);

  const totalMarks = evaluations.reduce((s, e) => s + e.effectiveMarks, 0);
  const totalMax = evaluations.reduce((s, e) => s + e.subject.maxMarks, 0);
  const percentage = totalMax > 0 ? (totalMarks / totalMax) * 100 : 0;

  let status: FinalStatus;
  if (evaluations.length === 0) status = "FAIL";
  else if (failedCount === 0) status = "PASS";
  else if (failedCount <= ATKT_MAX_FAILS) status = "ATKT";
  else status = "FAIL";

  return {
    evaluations,
    failedEvaluations,
    graceUsed,
    totalGraceMarks,
    totalMarks,
    totalMax,
    percentage,
    status,
    failedCount,
  };
}

export function statusBadgeClass(status: FinalStatus): string {
  if (status === "PASS") return "bg-success/10 text-success border-success/30";
  if (status === "ATKT") return "bg-warning/10 text-warning border-warning/30";
  return "bg-destructive/10 text-destructive border-destructive/30";
}

export const ATKT_TOOLTIP = "ATKT: Student must reappear for failed subjects.";
