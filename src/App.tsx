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
  const deletedAttemptIdsRef = useRef<Set<string>>(new Set());

  const isFetchingRef = useRef(false);

  // Fungsi memuat data dari Supabase
  const loadDataFromSupabase = useCallback(async () => {
    const supabase = getSupabase();
    if (!supabase) return;

    try {
      isFetchingRef.current = true;
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
      if (sbExams) setExams(sanitizeExams(sbExams));
      if (sbAttempts) {
        setAttempts((prevAttempts) => {
          // Buat map dari server Supabase, buang yang sudah dihapus/direset
          const serverMap = new Map<string, ExamAttempt>();
          sbAttempts.forEach((a) => {
            if (deletedAttemptIdsRef.current.has(a.id)) {
              supabaseService.deleteExamAttempt(a.id);
              return;
            }
            serverMap.set(a.id, a);
          });

          const merged: ExamAttempt[] = [];

          prevAttempts.forEach((local) => {
            if (deletedAttemptIdsRef.current.has(local.id)) return;

            const server = serverMap.get(local.id);
            if (!server) {
              merged.push(local);
            } else {
              // 1. Siswa telah selesai mengerjakan ujian (status: 'submitted'):
              // JANGAN PERNAH menimpa attempt yang sudah submitted dengan status in_progress!
              if (local.status === 'submitted') {
                if (server.status === 'submitted') {
                  // Keduanya submitted, pertahankan yang datanya paling lengkap / skor lebih tinggi
                  const localScore = local.totalScore ?? local.scorePercentage ?? 0;
                  const serverScore = server.totalScore ?? server.scorePercentage ?? 0;
                  if (localScore >= serverScore) {
                    merged.push(local);
                  } else {
                    merged.push(server);
                  }
                } else {
                  // Lokal sudah selesai diserahkan, sedangkan server masih 'in_progress' atau lama.
                  // LOKAL HARUS MENANG! Sekaligus simpan ke Supabase agar status server segera diperbarui.
                  merged.push(local);
                  supabaseService.saveExamAttempt(local);
                }
              }
              // 2. Siswa terkena pelanggaran dan Guru baru saja klik "Lanjutkan" di panel pengawas:
              else if (local.status === 'violation_disqualified' && server.status === 'in_progress') {
                merged.push(server);
              }
              // 3. Guru mengumpulkan paksa ujian siswa dari panel live monitoring:
              else if (local.status === 'in_progress' && server.status === 'submitted') {
                merged.push(server);
              }
              // 4. Standar: gunakan data server terbaru
              else {
                merged.push(server);
              }
              serverMap.delete(local.id);
            }
          });

          serverMap.forEach((server) => {
            if (!deletedAttemptIdsRef.current.has(server.id)) {
              merged.push(server);
            }
          });

          // PEMBERSIHAN DUPLIKAT & STALE IN_PROGRESS PER (studentId, examId):
          // Jika untuk seorang siswa pada ujian tertentu sudah ada attempt 'submitted',
          // maka attempt 'in_progress' basi untuk ujian tersebut HARUS DIBUANG agar ujian tidak tampak belum selesai.
          const submittedKeys = new Set(
            merged
              .filter((a) => a.status === 'submitted')
              .map((a) => `${a.studentId}_${a.examId}`)
          );

          const finalMerged = merged.filter((a) => {
            if (a.status === 'in_progress' && submittedKeys.has(`${a.studentId}_${a.examId}`)) {
              // Hapus juga attempt in_progress basi ini dari Supabase agar bersih permanen
              supabaseService.deleteExamAttempt(a.id);
              return false;
            }
            return true;
          });

          return finalMerged;
        });
      }
      setIsDataLoaded(true);
      
      // Allow react to apply state before lifting the flag
      setTimeout(() => {
        isFetchingRef.current = false;
      }, 500);
    } catch (err) {
      console.warn('Gagal memuat data dari Supabase:', err);
      isFetchingRef.current = false;
    }
  }, []);

  // Memuat data Supabase saat awal aplikasi dimulai jika terkonfigurasi
  useEffect(() => {
    if (getSupabaseConfig().isConfigured) {
      loadDataFromSupabase();
    }
  }, [loadDataFromSupabase]);

  // Polling data berkala (Live Monitor) + Realtime WebSocket untuk menarik progress siswa seketika
  useEffect(() => {
    if (!getSupabaseConfig().isConfigured) return;

    // Polling setiap 3 detik untuk sinkronisasi cepat antara Guru dan HP Siswa
    const interval = setInterval(() => {
      loadDataFromSupabase();
    }, 3000);

    // Ambil data seketika saat aplikasi atau tab dibuka / difokuskan kembali di browser HP siswa
    const handleFocusOrVisible = () => {
      if (!document.hidden) {
        loadDataFromSupabase();
      }
    };
    window.addEventListener('focus', handleFocusOrVisible);
    document.addEventListener('visibilitychange', handleFocusOrVisible);

    // Supabase Realtime WebSocket subscription untuk update instan (< 0.5 detik) saat guru klik Lanjutkan
    const supabase = getSupabase();
    let channel: any = null;
    if (supabase) {
      try {
        channel = supabase
          .channel('realtime_exam_attempts_sync')
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'exam_attempts' },
            () => {
              loadDataFromSupabase();
            }
          )
          .subscribe();
      } catch (err) {
        console.warn('Gagal mengaktifkan realtime Supabase:', err);
      }
    }

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocusOrVisible);
      document.removeEventListener('visibilitychange', handleFocusOrVisible);
      if (supabase && channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [loadDataFromSupabase]);

  // Sync state changes with localStorage & Supabase (including Deletions)
  useEffect(() => {
    saveUsers(users);
    if (getSupabaseConfig().isConfigured && isDataLoaded && !isFetchingRef.current) {
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
    if (getSupabaseConfig().isConfigured && isDataLoaded && !isFetchingRef.current) {
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
    if (getSupabaseConfig().isConfigured && isDataLoaded && !isFetchingRef.current) {
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
    prevAttemptsRef.current = attempts;
  }, [attempts]);

  // Handler update attempts yang langsung menyimpan ke localStorage dan Supabase
  const handleUpdateAttempts = useCallback((newAttempts: ExamAttempt[]) => {
    setAttempts(newAttempts);
    saveAttempts(newAttempts);

    if (getSupabaseConfig().isConfigured) {
      newAttempts.forEach((item) => {
        const prev = prevAttemptsRef.current.find((p) => p.id === item.id);
        if (
          !prev ||
          prev.status !== item.status ||
          prev.totalScore !== item.totalScore ||
          prev.scorePercentage !== item.scorePercentage ||
          prev.submittedAt !== item.submittedAt
        ) {
          supabaseService.saveExamAttempt(item);
        }
      });
    }
  }, []);

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
              onUpdateAttempts={handleUpdateAttempts}
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
              onUpdateAttempts={handleUpdateAttempts}
              onRefreshData={loadDataFromSupabase}
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
