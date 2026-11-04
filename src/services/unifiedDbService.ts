import { getTursoConfig, getActiveDbProvider, DatabaseProvider, getTursoAuthError } from '../lib/turso';
import { getSupabaseConfig } from '../lib/supabase';
import { tursoService } from './tursoService';
import { supabaseService } from './supabaseService';
import { SchoolSettings, User, Subject, Exam, ExamAttempt } from '../types';
import { saveStoredSettings } from '../lib/storage';

function isTursoReady(): boolean {
  return getTursoConfig().isConfigured && !getTursoAuthError();
}

export function isCloudDbConfigured(): boolean {
  const provider = getActiveDbProvider();
  if (provider === 'turso') {
    return isTursoReady();
  }
  if (provider === 'supabase') {
    return getSupabaseConfig().isConfigured;
  }
  return false;
}

export function getCurrentDbInfo(): {
  provider: DatabaseProvider;
  isConfigured: boolean;
  name: string;
} {
  const provider = getActiveDbProvider();
  if (provider === 'turso') {
    const isReady = isTursoReady();
    const authErr = getTursoAuthError();
    return {
      provider: 'turso',
      isConfigured: isReady,
      name: authErr ? 'Turso (Auth Token Belum Valid / 401)' : 'Turso (LibSQL SQLite)',
    };
  }
  if (provider === 'supabase') {
    const conf = getSupabaseConfig();
    return {
      provider: 'supabase',
      isConfigured: conf.isConfigured,
      name: 'Supabase (PostgreSQL)',
    };
  }
  return {
    provider: 'local',
    isConfigured: false,
    name: 'Penyimpanan Lokal (Offline)',
  };
}

export const unifiedDbService = {
  async getSchoolSettings(): Promise<SchoolSettings | null> {
    const provider = getActiveDbProvider();
    if (provider === 'turso' && isTursoReady()) {
      return tursoService.getSchoolSettings();
    }
    if (provider === 'supabase' && getSupabaseConfig().isConfigured) {
      return supabaseService.getSchoolSettings();
    }
    // Fallback: try turso first if ready, else supabase
    if (isTursoReady()) return tursoService.getSchoolSettings();
    if (getSupabaseConfig().isConfigured) return supabaseService.getSchoolSettings();
    return null;
  },

  async saveSchoolSettings(settings: SchoolSettings): Promise<boolean> {
    // 1. Selalu simpan ke localStorage secara sinkron agar tidak pernah hilang saat refresh
    saveStoredSettings(settings);

    const provider = getActiveDbProvider();
    let success = false;
    if (provider === 'turso' && isTursoReady()) {
      success = await tursoService.saveSchoolSettings(settings);
    } else if (provider === 'supabase' && getSupabaseConfig().isConfigured) {
      success = await supabaseService.saveSchoolSettings(settings);
    } else {
      if (isTursoReady()) {
        success = await tursoService.saveSchoolSettings(settings);
      } else if (getSupabaseConfig().isConfigured) {
        success = await supabaseService.saveSchoolSettings(settings);
      }
    }
    return success;
  },

  async getUsers(): Promise<User[] | null> {
    const provider = getActiveDbProvider();
    if (provider === 'turso' && isTursoReady()) {
      return tursoService.getUsers();
    }
    if (provider === 'supabase' && getSupabaseConfig().isConfigured) {
      return supabaseService.getUsers();
    }
    if (isTursoReady()) return tursoService.getUsers();
    if (getSupabaseConfig().isConfigured) return supabaseService.getUsers();
    return null;
  },

  async saveUser(user: User): Promise<boolean> {
    const provider = getActiveDbProvider();
    if (provider === 'turso' && isTursoReady()) {
      return tursoService.saveUser(user);
    }
    if (provider === 'supabase' && getSupabaseConfig().isConfigured) {
      return supabaseService.saveUser(user);
    }
    if (isTursoReady()) return tursoService.saveUser(user);
    if (getSupabaseConfig().isConfigured) return supabaseService.saveUser(user);
    return false;
  },

  async deleteUser(userId: string): Promise<boolean> {
    const provider = getActiveDbProvider();
    if (provider === 'turso' && isTursoReady()) {
      return tursoService.deleteUser(userId);
    }
    if (provider === 'supabase' && getSupabaseConfig().isConfigured) {
      return supabaseService.deleteUser(userId);
    }
    if (isTursoReady()) return tursoService.deleteUser(userId);
    if (getSupabaseConfig().isConfigured) return supabaseService.deleteUser(userId);
    return false;
  },

  async getSubjects(): Promise<Subject[] | null> {
    const provider = getActiveDbProvider();
    if (provider === 'turso' && isTursoReady()) {
      return tursoService.getSubjects();
    }
    if (provider === 'supabase' && getSupabaseConfig().isConfigured) {
      return supabaseService.getSubjects();
    }
    if (isTursoReady()) return tursoService.getSubjects();
    if (getSupabaseConfig().isConfigured) return supabaseService.getSubjects();
    return null;
  },

  async saveSubject(subject: Subject): Promise<boolean> {
    const provider = getActiveDbProvider();
    if (provider === 'turso' && isTursoReady()) {
      return tursoService.saveSubject(subject);
    }
    if (provider === 'supabase' && getSupabaseConfig().isConfigured) {
      return supabaseService.saveSubject(subject);
    }
    if (isTursoReady()) return tursoService.saveSubject(subject);
    if (getSupabaseConfig().isConfigured) return supabaseService.saveSubject(subject);
    return false;
  },

  async deleteSubject(subjectId: string): Promise<boolean> {
    const provider = getActiveDbProvider();
    if (provider === 'turso' && isTursoReady()) {
      return tursoService.deleteSubject(subjectId);
    }
    if (provider === 'supabase' && getSupabaseConfig().isConfigured) {
      return supabaseService.deleteSubject(subjectId);
    }
    if (isTursoReady()) return tursoService.deleteSubject(subjectId);
    if (getSupabaseConfig().isConfigured) return supabaseService.deleteSubject(subjectId);
    return false;
  },

  async getExams(): Promise<Exam[] | null> {
    const provider = getActiveDbProvider();
    if (provider === 'turso' && isTursoReady()) {
      return tursoService.getExams();
    }
    if (provider === 'supabase' && getSupabaseConfig().isConfigured) {
      return supabaseService.getExams();
    }
    if (isTursoReady()) return tursoService.getExams();
    if (getSupabaseConfig().isConfigured) return supabaseService.getExams();
    return null;
  },

  async saveExam(exam: Exam): Promise<boolean> {
    const provider = getActiveDbProvider();
    if (provider === 'turso' && isTursoReady()) {
      return tursoService.saveExam(exam);
    }
    if (provider === 'supabase' && getSupabaseConfig().isConfigured) {
      return supabaseService.saveExam(exam);
    }
    if (isTursoReady()) return tursoService.saveExam(exam);
    if (getSupabaseConfig().isConfigured) return supabaseService.saveExam(exam);
    return false;
  },

  async deleteExam(examId: string): Promise<boolean> {
    const provider = getActiveDbProvider();
    if (provider === 'turso' && isTursoReady()) {
      return tursoService.deleteExam(examId);
    }
    if (provider === 'supabase' && getSupabaseConfig().isConfigured) {
      return supabaseService.deleteExam(examId);
    }
    if (isTursoReady()) return tursoService.deleteExam(examId);
    if (getSupabaseConfig().isConfigured) return supabaseService.deleteExam(examId);
    return false;
  },

  async getExamAttempts(): Promise<ExamAttempt[] | null> {
    const provider = getActiveDbProvider();
    if (provider === 'turso' && isTursoReady()) {
      return tursoService.getExamAttempts();
    }
    if (provider === 'supabase' && getSupabaseConfig().isConfigured) {
      return supabaseService.getExamAttempts();
    }
    if (isTursoReady()) return tursoService.getExamAttempts();
    if (getSupabaseConfig().isConfigured) return supabaseService.getExamAttempts();
    return null;
  },

  async saveExamAttempt(attempt: ExamAttempt): Promise<boolean> {
    const provider = getActiveDbProvider();
    if (provider === 'turso' && isTursoReady()) {
      return tursoService.saveExamAttempt(attempt);
    }
    if (provider === 'supabase' && getSupabaseConfig().isConfigured) {
      return supabaseService.saveExamAttempt(attempt);
    }
    if (isTursoReady()) return tursoService.saveExamAttempt(attempt);
    if (getSupabaseConfig().isConfigured) return supabaseService.saveExamAttempt(attempt);
    return false;
  },

  async deleteExamAttempt(attemptId: string): Promise<boolean> {
    const provider = getActiveDbProvider();
    if (provider === 'turso' && isTursoReady()) {
      return tursoService.deleteExamAttempt(attemptId);
    }
    if (provider === 'supabase' && getSupabaseConfig().isConfigured) {
      return supabaseService.deleteExamAttempt(attemptId);
    }
    if (isTursoReady()) return tursoService.deleteExamAttempt(attemptId);
    if (getSupabaseConfig().isConfigured) return supabaseService.deleteExamAttempt(attemptId);
    return false;
  },

  async deleteExamAttempts(attemptIds: string[]): Promise<boolean> {
    const provider = getActiveDbProvider();
    if (provider === 'turso' && isTursoReady()) {
      return tursoService.deleteExamAttempts(attemptIds);
    }
    if (provider === 'supabase' && getSupabaseConfig().isConfigured) {
      return supabaseService.deleteExamAttempts(attemptIds);
    }
    if (isTursoReady()) return tursoService.deleteExamAttempts(attemptIds);
    if (getSupabaseConfig().isConfigured) return supabaseService.deleteExamAttempts(attemptIds);
    return false;
  },
};
