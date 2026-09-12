const fs = require('fs');
let code = fs.readFileSync('src/lib/storage.ts', 'utf-8');

// Replace everything from "// Helper Local Storage Operations" downwards
const targetSplit = "// Helper Local Storage Operations";
const parts = code.split(targetSplit);

if (parts.length === 2) {
    const newCode = parts[0] + targetSplit + `
export function getStoredUsers(): User[] { return []; }
export function saveStoredUsers(users: User[]) { }

export function getStoredSubjects(): Subject[] { return []; }
export function saveStoredSubjects(subjects: Subject[]) { }

export function getStoredExams(): Exam[] { return []; }
export function saveStoredExams(exams: Exam[]) { }

export function getStoredAttempts(): ExamAttempt[] { return []; }
export function saveStoredAttempts(attempts: ExamAttempt[]) { }

export function getStoredSettings(): SchoolSettings { 
  return { schoolName: 'Nama Sekolah', schoolLogo: '', academicYear: '2023/2024', semester: 'Genap', headmasterName: '', headmasterNip: '' };
}
export function saveStoredSettings(settings: SchoolSettings) { }

export function getStoredAuditLogs(): SystemAuditLog[] { return []; }
export function addAuditLog(userName: string, role: string, action: string, details: string) { return []; }

export function getCurrentUser(): User | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
export function setCurrentUser(user: User | null) {
  if (!user) {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
  } else {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
  }
}
export function resetToDemoData() {
  // Demo data di Supabase bisa dilakukan via SQL seeder
  alert("Fungsi reset ke demo data dinonaktifkan karena aplikasi menggunakan Supabase secara penuh. Silakan import data melalui SQL Supabase.");
}

// Aliases for clean App.tsx access
export const getInitialUsers = getStoredUsers;
export const getInitialSubjects = getStoredSubjects;
export const getInitialExams = getStoredExams;
export const getInitialAttempts = getStoredAttempts;
export const getInitialSettings = getStoredSettings;
export const getAuditLogs = getStoredAuditLogs;

export const saveUsers = saveStoredUsers;
export const saveSubjects = saveStoredSubjects;
export const saveExams = saveStoredExams;
export const saveAttempts = saveStoredAttempts;
export const saveSettings = saveStoredSettings;
export const saveAuditLogs = (logs: SystemAuditLog[]) => {};
`;
    fs.writeFileSync('src/lib/storage.ts', newCode);
    console.log('Successfully patched storage.ts');
} else {
    console.log('Failed to find split point');
}
