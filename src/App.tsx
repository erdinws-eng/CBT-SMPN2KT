import { useState, useEffect, useCallback, useRef } from 'react';
import { User, Exam, Subject, ExamAttempt, SchoolSettings, UserRole } from './types';
import {
  getInitialUsers,
  getInitialSubjects,
  getInitialExams,
  getInitialAttempts,
  getInitialSettings,
  saveUsers,
  saveSubjects,
  saveExams,
  saveAttempts,
  saveSettings,
  sanitizeExams,
} from './lib/storage';
import { getSupabase, getSupabaseConfig } from './lib/supabase';
import { supabaseService } from './services/supabaseService';
import Navbar from './components/Navbar';
import LoginView from './components/LoginView';
import AdminPanel from './components/AdminPanel';
import GuruPanel from './components/GuruPanel';
import SiswaPanel from './components/SiswaPanel';
import SupabaseConfigModal from './components/SupabaseConfigModal';

export default function App() {
  const [users, setUsers] = useState<User[]>(getInitialUsers);
  const [subjects, setSubjects] = useState<Subject[]>(getInitialSubjects);
  const [exams, setExams] = useState<Exam[]>(getInitialExams);
  const [attempts, setAttempts] = useState<ExamAttempt[]>(getInitialAttempts);
  const [settings, setSettings] = useState<SchoolSettings>(getInitialSettings);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState<boolean>(false);
  const [isDataLoaded, setIsDataLoaded] = useState<boolean>(false);

  const prevUsersRef = useRef<User[]>(users);
  const prevSubjectsRef = useRef<Subject[]>(subjects);
  const prevExamsRef = useRef<Exam[]>(exams);
  const prevAttemptsRef = useRef<ExamAttempt[]>(attempts);

  // Fungsi memuat data dari Supabase
  const loadDataFromSupabase = useCallback(async () => {
    const supabase = getSupabase();
    if (!supabase) return;

    try {
      const [sbSettings, sbUsers, sbSubjects, sbExams, sbAttempts] = await Promise.all([
        supabaseService.getSchoolSettings(),
        supabaseService.getUsers(),
        supabaseService.getSubjects(),
        supabaseService.getExams(),
        supabaseService.getExamAttempts(),
      ]);

      if (sbSettings) setSettings(sbSettings);
      if (sbUsers && sbUsers.length > 0) setUsers(sbUsers);
      if (sbSubjects && sbSubjects.length > 0) setSubjects(sbSubjects);
      if (sbExams && sbExams.length > 0) setExams(sanitizeExams(sbExams));
      if (sbAttempts) setAttempts(sbAttempts);
      setIsDataLoaded(true);
    } catch (err) {
      console.warn('Gagal memuat data dari Supabase:', err);
    }
  }, []);

  // Memuat data Supabase saat awal aplikasi dimulai jika terkonfigurasi
  useEffect(() => {
    if (getSupabaseConfig().isConfigured) {
      loadDataFromSupabase();
    }
  }, [loadDataFromSupabase]);

  // Sync state changes with localStorage & Supabase (including Deletions)
  useEffect(() => {
    saveUsers(users);
    if (getSupabaseConfig().isConfigured && isDataLoaded) {
      users.forEach((item) => supabaseService.saveUser(item));
      const currentIds = new Set(users.map(item => item.id));
      prevUsersRef.current.forEach(old => {
        if (!currentIds.has(old.id)) supabaseService.deleteUser(old.id);
      });
    }
    prevUsersRef.current = users;
  }, [users, isDataLoaded]);

  useEffect(() => {
    saveSubjects(subjects);
    if (getSupabaseConfig().isConfigured && isDataLoaded) {
      subjects.forEach((item) => supabaseService.saveSubject(item));
      const currentIds = new Set(subjects.map(item => item.id));
      prevSubjectsRef.current.forEach(old => {
        if (!currentIds.has(old.id)) supabaseService.deleteSubject(old.id);
      });
    }
    prevSubjectsRef.current = subjects;
  }, [subjects, isDataLoaded]);

  useEffect(() => {
    saveExams(exams);
    if (getSupabaseConfig().isConfigured && isDataLoaded) {
      exams.forEach((item) => supabaseService.saveExam(item));
      const currentIds = new Set(exams.map(item => item.id));
      prevExamsRef.current.forEach(old => {
        if (!currentIds.has(old.id)) supabaseService.deleteExam(old.id);
      });
    }
    prevExamsRef.current = exams;
  }, [exams, isDataLoaded]);

  useEffect(() => {
    saveAttempts(attempts);
    if (getSupabaseConfig().isConfigured && isDataLoaded) {
      attempts.forEach((item) => supabaseService.saveExamAttempt(item));
      const currentIds = new Set(attempts.map(item => item.id));
      prevAttemptsRef.current.forEach(old => {
        if (!currentIds.has(old.id)) supabaseService.deleteExamAttempt(old.id);
      });
    }
    prevAttemptsRef.current = attempts;
  }, [attempts, isDataLoaded]);

  useEffect(() => {
    saveSettings(settings);
    if (getSupabaseConfig().isConfigured && isDataLoaded) {
      supabaseService.saveSchoolSettings(settings);
    }
  }, [settings, isDataLoaded]);

  // Fungsi sinkronisasi manual saat tombol "Simpan & Sinkronkan" diklik di modal
  const handleManualSync = async () => {
    const supabase = getSupabase();
    if (!supabase) return;

    // 1. Unggah data yang saat ini aktif di aplikasi ke tabel Supabase
    await supabaseService.saveSchoolSettings(settings);
    for (const u of users) {
      await supabaseService.saveUser(u);
    }
    for (const s of subjects) {
      await supabaseService.saveSubject(s);
    }
    for (const e of exams) {
      await supabaseService.saveExam(e);
    }
    for (const a of attempts) {
      await supabaseService.saveExamAttempt(a);
    }

    // 2. Muat ulang data terbaru
    await loadDataFromSupabase();
  };

  const handleUpdateExams = useCallback((newExams: Exam[]) => {
    setExams(sanitizeExams(newExams));
  }, []);

  // Role switch handler from Navbar
  const handleRoleSwitch = (newRole: UserRole) => {
    const targetUser = users.find((u) => u.role === newRole);
    if (targetUser) {
      setCurrentUser(targetUser);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
  };

  // If no user is logged in, show the comprehensive CBT Login portal
  if (!currentUser) {
    return (
      <>
        <LoginView
          users={users}
          settings={settings}
          onLoginSuccess={(user) => {
            setCurrentUser(user);
          }}
          onOpenSupabaseModal={() => setIsSupabaseModalOpen(true)}
        />
        <SupabaseConfigModal
          isOpen={isSupabaseModalOpen}
          onClose={() => setIsSupabaseModalOpen(false)}
          onSyncNow={handleManualSync}
        />
      </>
    );
  }

  const students = users.filter((u) => u.role === 'siswa');

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between text-slate-800">
      <div>
        {/* Universal CBT Navbar (Hanya untuk Siswa, Admin & Guru memiliki Topbar & Sidebar mandiri) */}
        {currentUser.role === 'siswa' && (
          <Navbar
            currentUser={currentUser}
            onLogout={handleLogout}
            onRoleSwitch={handleRoleSwitch}
            onOpenSupabaseModal={() => setIsSupabaseModalOpen(true)}
            settings={settings}
          />
        )}

        {/* Role-Based Panel Rendering */}
        <main className={currentUser.role === 'siswa' ? 'pb-16' : ''}>
          {currentUser.role === 'admin' && (
            <AdminPanel
              users={users}
              subjects={subjects}
              settings={settings}
              currentUser={currentUser}
              onUpdateUsers={setUsers}
              onUpdateCurrentUser={setCurrentUser}
              onUpdateSubjects={setSubjects}
              onUpdateSettings={setSettings}
              onOpenSupabaseModal={() => setIsSupabaseModalOpen(true)}
              onLogout={handleLogout}
            />
          )}

          {currentUser.role === 'guru' && (
            <GuruPanel
              currentUser={currentUser}
              exams={exams}
              subjects={subjects}
              students={students}
              attempts={attempts}
              settings={settings}
              onUpdateExams={handleUpdateExams}
              onUpdateAttempts={setAttempts}
              onOpenSupabaseModal={() => setIsSupabaseModalOpen(true)}
              onLogout={handleLogout}
            />
          )}

          {currentUser.role === 'siswa' && (
            <SiswaPanel
              currentUser={currentUser}
              exams={exams}
              attempts={attempts}
              settings={settings}
              onUpdateAttempts={setAttempts}
            />
          )}
        </main>
      </div>

      {/* Global Footer (Hanya ditampilkan untuk Siswa, Admin & Guru memiliki layout sidebar mandiri) */}
      {currentUser.role === 'siswa' && (
        <footer className="bg-white border-t border-slate-200 py-4 px-6 text-center text-xs text-slate-500">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
            <span>
              © {new Date().getFullYear()} {settings.schoolName} (NPSN: {settings.schoolNpsn}) • Sistem CBT & Asesmen SMP
            </span>
            <div className="flex items-center gap-4 text-[11px] text-slate-400">
              <span>Database Supabase PostgreSQL</span>
              <span>•</span>
              <span>Anti-Curang Lockdown Browser</span>
              <span>•</span>
              <span>Generator Soal AI</span>
            </div>
          </div>
        </footer>
      )}

      {/* Supabase Config Modal */}
      <SupabaseConfigModal
        isOpen={isSupabaseModalOpen}
        onClose={() => setIsSupabaseModalOpen(false)}
        onSyncNow={handleManualSync}
      />
    </div>
  );
}
