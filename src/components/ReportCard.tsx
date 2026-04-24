import { useRef } from "react";
import { Download, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getSettings, type Student, type Subject, type Result } from "@/lib/store";
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

function remarkFor(pct: number, allPassed: boolean): { label: string; color: string } {
  if (!allPassed) return { label: "Needs Improvement — has unsuccessful subjects", color: "#dc2626" };
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

  const totalMarks = results.reduce((s, r) => s + r.marksObtained, 0);
  const totalMax = results.reduce((s, r) => {
    const sub = subjects.find((x) => x.id === r.subjectId);
    return s + (sub?.maxMarks || 0);
  }, 0);
  const overallPctNum = totalMax > 0 ? (totalMarks / totalMax) * 100 : 0;
  const overallPct = overallPctNum.toFixed(1);
  const overallGrade = getGrade(totalMarks, totalMax || 1);

  const passedCount = results.filter((r) => {
    const sub = subjects.find((s) => s.id === r.subjectId);
    return sub && r.marksObtained >= sub.passMarks;
  }).length;
  const failedCount = results.length - passedCount;
  const allPassed = failedCount === 0 && results.length > 0;
  const remark = remarkFor(overallPctNum, allPassed);

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
              const grade = sub ? getGrade(r.marksObtained, sub.maxMarks) : "-";
              const passed = sub ? r.marksObtained >= sub.passMarks : false;
              return (
                <tr key={r.id} style={{ backgroundColor: i % 2 === 0 ? "#f8f9fa" : "#ffffff" }}>
                  <td style={{ padding: "8px 12px", borderBottom: "1px solid #e5e7eb", fontWeight: 500 }}>{sub?.name || "Unknown"}</td>
                  <td style={{ padding: "8px 12px", borderBottom: "1px solid #e5e7eb", textAlign: "center", textTransform: "capitalize" }}>{r.examType}</td>
                  <td style={{ padding: "8px 12px", borderBottom: "1px solid #e5e7eb", textAlign: "center", fontWeight: 600 }}>{r.marksObtained}</td>
                  <td style={{ padding: "8px 12px", borderBottom: "1px solid #e5e7eb", textAlign: "center" }}>{sub?.maxMarks}</td>
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
              color: allPassed ? "#16a34a" : "#dc2626",
            }}>
              {allPassed ? "PASS" : "FAIL"}
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
