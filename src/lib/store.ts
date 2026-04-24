export interface Student {
  id: string;
  name: string;
  admissionNo: string;
  rollNo: string;
  email: string;
  class: string;
  section: string;
  createdAt: string;
}

export interface Subject {
  id: string;
  name: string;
  code: string;
  maxMarks: number;
  passMarks: number;
}

export interface Result {
  id: string;
  studentId: string;
  subjectId: string;
  marksObtained: number;
  examType: "midterm" | "final" | "assignment";
  date: string;
}

function generateId(): string {
  return crypto.randomUUID();
}

function load<T>(key: string): T[] {
  try {
    return JSON.parse(localStorage.getItem(key) || "[]");
  } catch {
    return [];
  }
}

function save<T>(key: string, data: T[]): void {
  localStorage.setItem(key, JSON.stringify(data));
}

// Students
export function getStudents(): Student[] {
  return load<Student>("rms_students");
}

export function addStudent(s: Omit<Student, "id" | "createdAt">): Student {
  const students = getStudents();
  const student: Student = { ...s, id: generateId(), createdAt: new Date().toISOString() };
  students.push(student);
  save("rms_students", students);
  return student;
}

export function updateStudent(id: string, data: Partial<Student>): void {
  const students = getStudents().map((s) => (s.id === id ? { ...s, ...data } : s));
  save("rms_students", students);
}

export function deleteStudent(id: string): void {
  save("rms_students", getStudents().filter((s) => s.id !== id));
  save("rms_results", getResults().filter((r) => r.studentId !== id));
}

// Subjects
export function getSubjects(): Subject[] {
  return load<Subject>("rms_subjects");
}

export function addSubject(s: Omit<Subject, "id">): Subject {
  const subjects = getSubjects();
  const subject: Subject = { ...s, id: generateId() };
  subjects.push(subject);
  save("rms_subjects", subjects);
  return subject;
}

export function updateSubject(id: string, data: Partial<Subject>): void {
  const subjects = getSubjects().map((s) => (s.id === id ? { ...s, ...data } : s));
  save("rms_subjects", subjects);
}

export function deleteSubject(id: string): void {
  save("rms_subjects", getSubjects().filter((s) => s.id !== id));
  save("rms_results", getResults().filter((r) => r.subjectId !== id));
}

// Results
export function getResults(): Result[] {
  return load<Result>("rms_results");
}

export function addResult(r: Omit<Result, "id">): Result {
  const results = getResults();
  const result: Result = { ...r, id: generateId() };
  results.push(result);
  save("rms_results", results);
  return result;
}

export function updateResult(id: string, data: Partial<Result>): void {
  const results = getResults().map((r) => (r.id === id ? { ...r, ...data } : r));
  save("rms_results", results);
}

export function deleteResult(id: string): void {
  save("rms_results", getResults().filter((r) => r.id !== id));
}

// Settings
export interface AppSettings {
  defaultMaxMarks: number;
  defaultPassMarks: number;
  schoolName: string;
}

const DEFAULT_SETTINGS: AppSettings = {
  defaultMaxMarks: 100,
  defaultPassMarks: 35,
  schoolName: "ResultPro Academy",
};

export function getSettings(): AppSettings {
  try {
    const raw = localStorage.getItem("rms_settings");
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(s: Partial<AppSettings>): AppSettings {
  const merged = { ...getSettings(), ...s };
  localStorage.setItem("rms_settings", JSON.stringify(merged));
  return merged;
}

// Seed demo data
export function seedDemoData(): void {
  if (getStudents().length > 0) return;

  const students = [
    { name: "Aarav Sharma", admissionNo: "ADM001", rollNo: "2024001", email: "aarav@school.edu", class: "10", section: "A" },
    { name: "Priya Patel", admissionNo: "ADM002", rollNo: "2024002", email: "priya@school.edu", class: "10", section: "A" },
    { name: "Rahul Singh", admissionNo: "ADM003", rollNo: "2024003", email: "rahul@school.edu", class: "10", section: "B" },
    { name: "Ananya Gupta", admissionNo: "ADM004", rollNo: "2024004", email: "ananya@school.edu", class: "10", section: "B" },
    { name: "Vikram Kumar", admissionNo: "ADM005", rollNo: "2024005", email: "vikram@school.edu", class: "10", section: "A" },
    { name: "Sneha Reddy", admissionNo: "ADM006", rollNo: "2024006", email: "sneha@school.edu", class: "9", section: "A" },
    { name: "Arjun Nair", admissionNo: "ADM007", rollNo: "2024007", email: "arjun@school.edu", class: "9", section: "B" },
    { name: "Divya Iyer", admissionNo: "ADM008", rollNo: "2024008", email: "divya@school.edu", class: "9", section: "A" },
  ].map((s) => ({ ...s, id: generateId(), createdAt: new Date().toISOString() }));
  save("rms_students", students);

  const subjects = [
    { name: "Mathematics", code: "MATH101", maxMarks: 100, passMarks: 35 },
    { name: "Science", code: "SCI101", maxMarks: 100, passMarks: 35 },
    { name: "English", code: "ENG101", maxMarks: 100, passMarks: 35 },
    { name: "History", code: "HIS101", maxMarks: 100, passMarks: 35 },
    { name: "Computer Science", code: "CS101", maxMarks: 100, passMarks: 35 },
  ].map((s) => ({ ...s, id: generateId() }));
  save("rms_subjects", subjects);

  const examTypes: Result["examType"][] = ["midterm", "final", "assignment"];
  const results: Result[] = [];
  for (const student of students) {
    for (const subject of subjects) {
      for (const examType of examTypes) {
        results.push({
          id: generateId(),
          studentId: student.id,
          subjectId: subject.id,
          marksObtained: Math.floor(Math.random() * 60) + 40,
          examType,
          date: "2024-12-15",
        });
      }
    }
  }
  save("rms_results", results);
}
