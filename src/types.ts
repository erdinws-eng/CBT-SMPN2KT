export type UserRole = 'admin' | 'guru' | 'siswa';

export type QuestionType =
  | 'pilihan_ganda'
  | 'pilihan_ganda_kompleks'
  | 'isian'
  | 'essay'
  | 'menjodohkan'
  | 'benar_salah'
  | 'isi_kosong'
  | 'susun_kata';

export interface User {
  id: string;
  username: string;
  password?: string;
  name: string;
  role: UserRole;
  nip_nisn: string;
  classGrade?: string; // e.g. "8A", "9B" for students
  gender?: 'L' | 'P';
  subjectName?: string; // for teachers
  subjectNames?: string[]; // for teachers with multiple subjects
  avatarUrl?: string;
}

export interface Subject {
  id: string;
  code: string;
  name: string;
  gradeLevel: string; // e.g. "SMP Kelas 7", "SMP Kelas 8", "SMP Kelas 9"
  teacherName?: string;
}

export interface MatchingPair {
  premise: string;
  match: string;
}

export interface TrueFalseStatement {
  statement: string;
  answer: 'Benar' | 'Salah';
}

export interface Question {
  id: string;
  type: QuestionType;
  prompt: string;
  mediaType?: 'image' | 'video' | 'none';
  mediaUrl?: string;
  points: number; // default 10
  options?: string[]; // for pilihan_ganda & pilihan_ganda_kompleks (e.g. ["A. ...", "B. ..."])
  correctAnswer?: string; // for pilihan_ganda, isian, single benar_salah
  correctAnswers?: string[]; // for pilihan_ganda_kompleks
  matchingPairs?: MatchingPair[]; // for menjodohkan
  trueFalseStatements?: TrueFalseStatement[]; // for multi benar_salah
  fillInTheBlanks?: string[]; // array of correct answers for blanks, the prompt will contain [blank] markers
  jumbledWords?: string[]; // words to be arranged
  correctOrder?: string[]; // correct order of the jumbled words
  essayRubric?: string; // for essay grading guidance
  explanation?: string;
}

export interface Exam {
  id: string;
  title: string;
  subjectId: string;
  subjectName: string;
  teacherId: string;
  teacherName: string;
  targetClasses: string[]; // e.g. ["7A", "7B", "8A", "8B", "9A"]
  startTime: string; // ISO string or datetime-local
  endTime: string; // ISO string
  durationMinutes: number; // e.g. 60
  minSubmitMinutes: number; // minimum time before student can submit, e.g. 15
  kkm: number; // Nilai KKM e.g. 75
  allowRetake: boolean; // remedial / pengulangan
  maxRetakes: number; // e.g. 2
  releaseScore: boolean; // rilis / sembunyikan nilai ke siswa
  randomizeQuestions: boolean; // acak urutan soal
  randomizeOptions: boolean; // acak pilihan jawaban
  lockdownBrowser: boolean; // anti-curang lockdown mode
  maxViolations: number; // default 3 strikes before auto-submission
  token: string; // e.g. "SMP8IPA"
  questions: Question[];
  status: 'draft' | 'active' | 'finished';
  createdAt: string;
}

export interface ViolationLog {
  timestamp: string;
  reason: string;
}

export interface ExamAttempt {
  id: string;
  examId: string;
  examTitle: string;
  subjectName: string;
  studentId: string;
  studentName: string;
  studentNisn: string;
  studentClass: string;
  startedAt: string;
  submittedAt?: string;
  // student answers:
  // - pilihan_ganda: string (e.g. "A. Mitokondria")
  // - pilihan_ganda_kompleks: string[]
  // - isian: string
  // - essay: string
  // - menjodohkan: Record<string, string> (premise -> selected match)
  // - benar_salah: Record<number, 'Benar' | 'Salah'> or string
  answers: Record<string, any>;
  doubtfulAnswers?: Record<string, boolean>; // ragu-ragu flags
  scores: Record<string, number>; // per question score
  totalScore: number;
  maxPossibleScore: number;
  totalEarnedPoints?: number;
  totalMaxPoints?: number;
  scorePercentage: number; // 0 - 100
  passedKkm: boolean;
  status: 'in_progress' | 'submitted' | 'violation_disqualified';
  violationCount: number;
  violationLogs: ViolationLog[];
  teacherFeedback?: string;
  isGraded: boolean; // true if essay/manual questions checked
}

export interface SchoolSettings {
  appName?: string;
  schoolName: string;
  schoolNpsn: string;
  schoolAddress: string;
  schoolCity: string;
  academicYear: string;
  semester: 'Ganjil' | 'Genap';
  principalName: string;
  principalNip: string;
  logoUrl?: string;
}

export interface SystemAuditLog {
  id: string;
  timestamp: string;
  userName: string;
  role: string;
  action: string;
  details: string;
}
