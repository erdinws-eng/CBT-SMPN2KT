import { getTursoConfig, getActiveDbProvider, DatabaseProvider, getTursoAuthError } from '../lib/turso';
import { tursoService } from './tursoService';
import { SchoolSettings, User, Subject, Exam, ExamAttempt } from '../types';
import { saveStoredSettings } from '../lib/storage';

export function isTursoReady(): boolean {
  return getTursoConfig().isConfigured && !getTursoAuthError();
}

export function isCloudDbConfigured(): boolean {
  return isTursoReady();
}

export function getCurrentDbInfo(): {
  provider: DatabaseProvider;
  isConfigured: boolean;
  name: string;
} {
  const isReady = isTursoReady();
  const authErr = getTursoAuthError();
  return {
    provider: isReady ? 'turso' : 'local',
    isConfigured: isReady,
    name: authErr
      ? 'Turso (Auth Token Belum Valid / 401)'
      : isReady
      ? 'Turso Database (LibSQL SQLite)'
      : 'Penyimpanan Lokal (Offline)',
  };
}

export const unifiedDbService = {
  async getSchoolSettings(): Promise<SchoolSettings | null> {
    if (isTursoReady()) {
      return tursoService.getSchoolSettings();
    }
    return null;
  },

  async saveSchoolSettings(settings: SchoolSettings): Promise<boolean> {
    // 1. Selalu simpan ke localStorage secara sinkron agar tidak hilang saat refresh
    saveStoredSettings(settings);

    // 2. Simpan ke database Turso jika terkonfigurasi
    if (isTursoReady()) {
      return tursoService.saveSchoolSettings(settings);
    }
    return true;
  },

  async getUsers(): Promise<User[] | null> {
    if (isTursoReady()) {
      return tursoService.getUsers();
    }
    return null;
  },

  async saveUser(user: User): Promise<boolean> {
    if (isTursoReady()) {
      return tursoService.saveUser(user);
    }
    return false;
  },

  async deleteUser(userId: string): Promise<boolean> {
    if (isTursoReady()) {
      return tursoService.deleteUser(userId);
    }
    return false;
  },

  async getSubjects(): Promise<Subject[] | null> {
    if (isTursoReady()) {
      return tursoService.getSubjects();
    }
    return null;
  },

  async saveSubject(subject: Subject): Promise<boolean> {
    if (isTursoReady()) {
      return tursoService.saveSubject(subject);
    }
    return false;
  },

  async deleteSubject(subjectId: string): Promise<boolean> {
    if (isTursoReady()) {
      return tursoService.deleteSubject(subjectId);
    }
    return false;
  },

  async getExams(): Promise<Exam[] | null> {
    if (isTursoReady()) {
      return tursoService.getExams();
    }
    return null;
  },

  async saveExam(exam: Exam): Promise<boolean> {
    if (isTursoReady()) {
      return tursoService.saveExam(exam);
    }
    return false;
  },

  async deleteExam(examId: string): Promise<boolean> {
    if (isTursoReady()) {
      return tursoService.deleteExam(examId);
    }
    return false;
  },

  async getExamAttempts(): Promise<ExamAttempt[] | null> {
    if (isTursoReady()) {
      return tursoService.getExamAttempts();
    }
    return null;
  },

  async saveExamAttempt(attempt: ExamAttempt): Promise<boolean> {
    if (isTursoReady()) {
      return tursoService.saveExamAttempt(attempt);
    }
    return false;
  },

  async deleteExamAttempt(attemptId: string): Promise<boolean> {
    if (isTursoReady()) {
      return tursoService.deleteExamAttempt(attemptId);
    }
    return false;
  },

  async deleteExamAttempts(attemptIds: string[]): Promise<boolean> {
    if (isTursoReady()) {
      return tursoService.deleteExamAttempts(attemptIds);
    }
    return false;
  },
};
