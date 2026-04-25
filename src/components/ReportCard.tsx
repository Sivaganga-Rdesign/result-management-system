import { useRef } from "react";
import { Download, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getSettings, getExamTypeLabel, type Student, type Subject, type Result } from "@/lib/store";
import { evaluateResults } from "@/lib/resultCalc";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

function getGrade(marks: number, max: number): string {
  if (max <= 0) return "-";
  const pct = (marks / max) * 100;
  if (pct >= 90) return "A+";
  if (pct >= 80) return "A";
  if (pct >= 70) return "B+";
  if (pct >= 60) return "B";
  if (pct >= 50) return "C";
  if (pct >= 35) return "D";
  return "F";
}

function remarkFor(pct: number, status: "PASS" | "ATKT" | "FAIL"): { label: string; color: string } {
  if (status === "FAIL") return { label: "Needs Improvement — multiple unsuccessful subjects.", color: "#dc2626" };
  if (status === "ATKT") return { label: "ATKT — must reappear for failed subjects.", color: "#a16207" };
  if (pct >= 90) return { label: "Outstanding performance — keep it up!", color: "#15803d" };
  if (pct >= 75) return { label: "Excellent — consistent and strong work.", color: "#15803d" };
  if (pct >= 60) return { label: "Good — room to push further.", color: "#1e3a5f" };
  if (pct >= 45) return { label: "Satisfactory — needs more practice.", color: "#a16207" };
  return { label: "Needs Improvement — focus on fundamentals.", color: "#dc2626" };
}

interface ReportCardProps {
  student: Student;
  results: Result[];
  subjects: Subject[];
}

export function ReportCard({ student, results, subjects }: ReportCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const settings = getSettings();

  const evaluation = evaluateResults(results, subjects);
  const evalById = new Map(evaluation.evaluations.map((e) => [e.result.id, e]));
  const totalMarks = evaluation.totalMarks;
  const totalMax = evaluation.totalMax;
  const overallPctNum = evaluation.percentage;
  const overallPct = overallPctNum.toFixed(1);
  const overallGrade = getGrade(totalMarks, totalMax || 1);

  const passedCount = evaluation.evaluations.filter((e) => e.passed).length;
  const failedCount = evaluation.failedCount;
  const finalStatus = evaluation.status;
  const remark = remarkFor(overallPctNum, finalStatus);

  const statusColors: Record<typeof finalStatus, { bg: string; fg: string; border: string }> = {
    PASS: { bg: "#dcfce7", fg: "#15803d", border: "#86efac" },
    ATKT: { bg: "#fef3c7", fg: "#a16207", border: "#fcd34d" },
    FAIL: { bg: "#fee2e2", fg: "#dc2626", border: "#fca5a5" },
  };
  const statusStyle = statusColors[finalStatus];

  const handleDownloadPdf = async () => {
    if (!cardRef.current) return;
    const canvas = await html2canvas(cardRef.current, { scale: 2, backgroundColor: "#ffffff" });
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
    pdf.save(`ReportCard_${student.rollNo}_${student.name.replace(/\s+/g, "_")}.pdf`);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end gap-2 print:hidden">
        <Button onClick={handlePrint} variant="outline" className="gap-2">
          <Printer className="h-4 w-4" />
          Print / Save as PDF
        </Button>
        <Button onClick={handleDownloadPdf} className="gap-2">
          <Download className="h-4 w-4" />
          Download PDF
        </Button>
      </div>

      <div
        ref={cardRef}
        id="report-card-printable"
        style={{
          width: "794px",
          maxWidth: "100%",
          padding: "40px",
          fontFamily: "'DM Sans', sans-serif",
          background: "#ffffff",
          color: "#1a1a2e",
          margin: "0 auto",
          border: "1px solid #e5e7eb",
        }}
      >
        {/* Header */}
        <div style={{ textAlign: "center", borderBottom: "3px double #1e3a5f", paddingBottom: "20px", marginBottom: "24px" }}>
          <h1 style={{ fontSize: "28px", fontFamily: "'DM Serif Display', serif", color: "#1e3a5f", margin: 0, letterSpacing: "0.5px" }}>
            {settings.schoolName}
          </h1>
          <p style={{ fontSize: "13px", color: "#666", margin: "4px 0 0", letterSpacing: "2px", textTransform: "uppercase" }}>
            Academic Report Card
          </p>
        </div>

        {/* Student Info */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px 24px", marginBottom: "24px", fontSize: "14px" }}>
          <div><span style={{ color: "#666" }}>Name:</span> <strong>{student.name}</strong></div>
          <div><span style={{ color: "#666" }}>Admission No:</span> <strong>{student.admissionNo}</strong></div>
          <div><span style={{ color: "#666" }}>Roll No:</span> <strong>{student.rollNo}</strong></div>
          <div><span style={{ color: "#666" }}>Class & Section:</span> <strong>{student.class} - {student.section}</strong></div>
        </div>

        {/* Results Table */}
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", marginBottom: "24px" }}>
          <thead>
            <tr style={{ backgroundColor: "#1e3a5f", color: "#f5f0e1" }}>
              <th style={{ padding: "10px 12px", textAlign: "left", fontWeight: 600 }}>Subject</th>
              <th style={{ padding: "10px 12px", textAlign: "center", fontWeight: 600 }}>Exam Type</th>
              <th style={{ padding: "10px 12px", textAlign: "center", fontWeight: 600 }}>Marks</th>
              <th style={{ padding: "10px 12px", textAlign: "center", fontWeight: 600 }}>Max</th>
              <th style={{ padding: "10px 12px", textAlign: "center", fontWeight: 600 }}>Grade</th>
              <th style={{ padding: "10px 12px", textAlign: "center", fontWeight: 600 }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {results.map((r, i) => {
              const sub = subjects.find((s) => s.id === r.subjectId);
              const ev = evalById.get(r.id);
              const effective = ev?.effectiveMarks ?? r.marksObtained;
              const effMax = ev?.effectiveMax ?? sub?.maxMarks ?? 0;
              const grade = effMax > 0 ? getGrade(effective, effMax) : "-";
              const passed = ev?.passed ?? false;
              const graceApplied = ev?.graceApplied ?? 0;
              return (
                <tr key={r.id} style={{ backgroundColor: i % 2 === 0 ? "#f8f9fa" : "#ffffff" }}>
                  <td style={{ padding: "8px 12px", borderBottom: "1px solid #e5e7eb", fontWeight: 500 }}>
                    {sub?.name || "Unknown"}
                    {graceApplied > 0 && (
                      <span style={{
                        marginLeft: "6px",
                        padding: "1px 6px",
                        fontSize: "10px",
                        borderRadius: "10px",
                        backgroundColor: "#fef3c7",
                        color: "#a16207",
                        border: "1px solid #fcd34d",
                        fontWeight: 600,
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                      }}>Grace +{graceApplied}</span>
                    )}
                  </td>
                  <td style={{ padding: "8px 12px", borderBottom: "1px solid #e5e7eb", textAlign: "center" }}>{getExamTypeLabel(r.examType)}</td>
                  <td style={{ padding: "8px 12px", borderBottom: "1px solid #e5e7eb", textAlign: "center", fontWeight: 600 }}>
                    {graceApplied > 0 ? (
                      <span>
                        <span style={{ color: "#999", textDecoration: "line-through", marginRight: "4px" }}>{r.marksObtained}</span>
                        {effective}
                      </span>
                    ) : (
                      r.marksObtained
                    )}
                  </td>
                  <td style={{ padding: "8px 12px", borderBottom: "1px solid #e5e7eb", textAlign: "center" }}>{effMax}</td>
                  <td style={{ padding: "8px 12px", borderBottom: "1px solid #e5e7eb", textAlign: "center", fontWeight: 600, color: grade === "F" ? "#dc2626" : "#1e3a5f" }}>{grade}</td>
                  <td style={{
                    padding: "8px 12px",
                    borderBottom: "1px solid #e5e7eb",
                    textAlign: "center",
                    fontWeight: 600,
                    color: passed ? "#16a34a" : "#dc2626",
                  }}>
                    {passed ? "PASS" : "FAIL"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Final Result Banner */}
        <div style={{
          padding: "14px 18px",
          borderRadius: "8px",
          backgroundColor: statusStyle.bg,
          border: `1px solid ${statusStyle.border}`,
          marginBottom: "16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "8px",
        }}>
          <div>
            <p style={{ margin: 0, fontSize: "11px", color: "#555", textTransform: "uppercase", letterSpacing: "1px" }}>Final Result</p>
            <p style={{ margin: "2px 0 0", fontWeight: 800, fontSize: "22px", color: statusStyle.fg, letterSpacing: "1px" }}>
              {finalStatus}
            </p>
          </div>
          <div style={{ fontSize: "12px", color: "#555", textAlign: "right" }}>
            <div>{passedCount} of {results.length} subject-exams passed</div>
            {failedCount > 0 && (
              <div style={{ color: "#dc2626", fontWeight: 600 }}>
                {failedCount} failed subject{failedCount > 1 ? "s" : ""}
              </div>
            )}
            {evaluation.graceUsed > 0 && (
              <div style={{ color: "#a16207" }}>
                Grace applied to {evaluation.graceUsed} subject{evaluation.graceUsed > 1 ? "s" : ""} (+{evaluation.totalGraceMarks} marks)
              </div>
            )}
            {finalStatus === "ATKT" && (
              <div style={{ color: "#a16207", fontStyle: "italic", marginTop: "2px" }}>
                Student must reappear for failed subjects.
              </div>
            )}
          </div>
        </div>

        {/* Failed Subjects List */}
        {evaluation.failedEvaluations.length > 0 && (
          <div style={{
            padding: "10px 14px",
            borderRadius: "6px",
            backgroundColor: "#fef2f2",
            border: "1px solid #fecaca",
            marginBottom: "16px",
            fontSize: "12px",
          }}>
            <p style={{ margin: 0, fontWeight: 700, color: "#991b1b", textTransform: "uppercase", letterSpacing: "0.5px", fontSize: "11px" }}>
              Failed Subjects
            </p>
            <p style={{ margin: "4px 0 0", color: "#7f1d1d" }}>
              {evaluation.failedEvaluations
                .map((e) => `${e.subject.name} (${e.effectiveMarks}/${e.subject.maxMarks}, ${getExamTypeLabel(e.result.examType)})`)
                .join(" • ")}
            </p>
          </div>
        )}

        {/* Summary */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "12px",
          padding: "16px 20px",
          backgroundColor: "#f0f4f8",
          borderRadius: "8px",
          border: "1px solid #d1d5db",
          fontSize: "13px",
          marginBottom: "16px",
        }}>
          <div>
            <p style={{ color: "#666", margin: 0, fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Total</p>
            <p style={{ margin: "2px 0 0", fontWeight: 700, fontSize: "16px" }}>{totalMarks} / {totalMax}</p>
          </div>
          <div>
            <p style={{ color: "#666", margin: 0, fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Percentage</p>
            <p style={{ margin: "2px 0 0", fontWeight: 700, fontSize: "16px" }}>{overallPct}%</p>
          </div>
          <div>
            <p style={{ color: "#666", margin: 0, fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Grade</p>
            <p style={{ margin: "2px 0 0", fontWeight: 700, fontSize: "16px", color: "#1e3a5f" }}>{overallGrade}</p>
          </div>
          <div>
            <p style={{ color: "#666", margin: 0, fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Result</p>
            <p style={{
              margin: "2px 0 0",
              fontWeight: 700,
              fontSize: "16px",
              color: statusStyle.fg,
            }}>
              {finalStatus}
            </p>
          </div>
        </div>

        {/* Remarks */}
        <div style={{
          padding: "12px 16px",
          borderLeft: `4px solid ${remark.color}`,
          backgroundColor: "#fafafa",
          marginBottom: "32px",
          fontSize: "13px",
        }}>
          <p style={{ margin: 0, color: "#666", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Remarks</p>
          <p style={{ margin: "4px 0 0", color: remark.color, fontWeight: 600 }}>{remark.label}</p>
          <p style={{ margin: "2px 0 0", color: "#666", fontSize: "12px" }}>
            {passedCount} of {results.length} subject-exams passed.
          </p>
        </div>

        {/* Footer */}
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: "48px", fontSize: "12px", color: "#666" }}>
          <div>
            <div style={{ borderTop: "1px solid #999", width: "160px", marginBottom: "4px" }} />
            Class Teacher
          </div>
          <div style={{ textAlign: "center" }}>
            <p style={{ margin: 0 }}>Generated on {new Date().toLocaleDateString()}</p>
            <p style={{ margin: "2px 0 0", fontSize: "10px", color: "#999" }}>
              This is a system-generated document.
            </p>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ borderTop: "1px solid #999", width: "160px", marginLeft: "auto", marginBottom: "4px" }} />
            Principal
          </div>
        </div>
      </div>
    </div>
  );
}
