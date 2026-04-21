import { useRef } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { type Student, type Subject, type Result } from "@/lib/store";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

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

interface ReportCardProps {
  student: Student;
  results: Result[];
  subjects: Subject[];
}

export function ReportCard({ student, results, subjects }: ReportCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  const totalMarks = results.reduce((s, r) => s + r.marksObtained, 0);
  const totalMax = results.reduce((s, r) => {
    const sub = subjects.find((x) => x.id === r.subjectId);
    return s + (sub?.maxMarks || 0);
  }, 0);
  const overallPct = totalMax > 0 ? ((totalMarks / totalMax) * 100).toFixed(1) : "0";
  const overallGrade = getGrade(totalMarks, totalMax || 1);

  // Group results by exam type
  const examTypes = [...new Set(results.map((r) => r.examType))];

  const handleDownload = async () => {
    if (!cardRef.current) return;
    const canvas = await html2canvas(cardRef.current, { scale: 2, backgroundColor: "#ffffff" });
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
    pdf.save(`ReportCard_${student.rollNo}_${student.name.replace(/\s+/g, "_")}.pdf`);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={handleDownload} className="gap-2">
          <Download className="h-4 w-4" />
          Download Report Card (PDF)
        </Button>
      </div>

      <div
        ref={cardRef}
        style={{
          width: "794px",
          padding: "40px",
          fontFamily: "'DM Sans', sans-serif",
          background: "#ffffff",
          color: "#1a1a2e",
        }}
      >
        {/* Header */}
        <div style={{ textAlign: "center", borderBottom: "3px solid #1e3a5f", paddingBottom: "20px", marginBottom: "24px" }}>
          <h1 style={{ fontSize: "28px", fontFamily: "'DM Serif Display', serif", color: "#1e3a5f", margin: 0 }}>
            ResultPro Academy
          </h1>
          <p style={{ fontSize: "13px", color: "#666", margin: "4px 0 0" }}>Academic Report Card</p>
        </div>

        {/* Student Info */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "24px", fontSize: "14px" }}>
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
              <th style={{ padding: "10px 12px", textAlign: "center", fontWeight: 600 }}>Max Marks</th>
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
          display: "flex",
          justifyContent: "space-between",
          padding: "16px 20px",
          backgroundColor: "#f0f4f8",
          borderRadius: "8px",
          border: "1px solid #d1d5db",
          fontSize: "14px",
          marginBottom: "24px",
        }}>
          <div><span style={{ color: "#666" }}>Total Marks:</span> <strong>{totalMarks} / {totalMax}</strong></div>
          <div><span style={{ color: "#666" }}>Percentage:</span> <strong>{overallPct}%</strong></div>
          <div><span style={{ color: "#666" }}>Overall Grade:</span> <strong style={{ color: "#1e3a5f", fontSize: "16px" }}>{overallGrade}</strong></div>
        </div>

        {/* Footer */}
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: "48px", fontSize: "12px", color: "#999" }}>
          <div>
            <div style={{ borderTop: "1px solid #ccc", width: "160px", marginBottom: "4px" }} />
            Class Teacher
          </div>
          <div style={{ textAlign: "center" }}>
            <p>Generated on {new Date().toLocaleDateString()}</p>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ borderTop: "1px solid #ccc", width: "160px", marginLeft: "auto", marginBottom: "4px" }} />
            Principal
          </div>
        </div>
      </div>
    </div>
  );
}
