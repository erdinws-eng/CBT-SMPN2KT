import { useState, useEffect, useCallback, useRef } from 'react';
import { User, Exam, Subject, ExamAttempt, SchoolSettings, UserRole } from './types';
import {
  getInitialUsers,
  getInitialSubjects,
  getInitialExams,
  getInitialAttempts,
  getInitialSettings,
  getStoredSettings,
  saveUsers,
  saveSubjects,
  saveExams,
  saveAttempts,
  saveSettings,
  sanitizeExams,
  getDeletedExamIds,
  addDeletedExamIds,
  getDeletedAttemptIds,
  addDeletedAttemptIds,
} from './lib/storage';
import { getSupabase, getSupabaseConfig } from './lib/supabase';
import { getTursoConfig, getActiveDbProvider } from './lib/turso';
import { supabaseService } from './services/supabaseService';
import { unifiedDbService, isCloudDbConfigured } from './services/unifiedDbService';
import Navbar from './components/Navbar';
import LoginView from './components/LoginView';
import AdminPanel from './components/AdminPanel';
import GuruPanel from './components/GuruPanel';
import SiswaPanel from './components/SiswaPanel';
import SupabaseConfigModal from './components/SupabaseConfigModal';
import TursoConfigModal from './components/TursoConfigModal';

export default function App() {
  const [users, setUsers] = useState<User[]>(getInitialUsers);
  const [subjects, setSubjects] = useState<Subject[]>(getInitialSubjects);
  const [exams, setExams] = useState<Exam[]>(getInitialExams);
  const [attempts, setAttempts] = useState<ExamAttempt[]>(getInitialAttempts);
  const [settings, setSettings] = useState<SchoolSettings>(getInitialSettings);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState<boolean>(false);
  const [isTursoModalOpen, setIsTursoModalOpen] = useState<boolean>(false);
  const [isDataLoaded, setIsDataLoaded] = useState<boolean>(false);

  const prevUsersRef = useRef<User[]>(users);
  const prevSubjectsRef = useRef<Subject[]>(subjects);
  const prevExamsRef = useRef<Exam[]>(exams);
  const prevAttemptsRef = useRef<ExamAttempt[]>(attempts);
  const deletedAttemptIdsRef = useRef<Set<string>>(getDeletedAttemptIds());
  const deletedExamIdsRef = useRef<Set<string>>(getDeletedExamIds());

  const isFetchingRef = useRef(false);

  // Helper untuk menggabungkan attempts server dengan lokal secara konsisten & aman
  const mergeAttemptsHelper = useCallback(
    (prevAttempts: ExamAttempt[], sbAttempts: ExamAttempt[]) => {
      const deletedExamIds = getDeletedExamIds();
      const deletedAttemptIds = getDeletedAttemptIds();
      deletedExamIds.forEach((id) => deletedExamIdsRef.current.add(id));
      deletedAttemptIds.forEach((id) => deletedAttemptIdsRef.current.add(id));

      // Buat map dari server database, buang yang sudah dihapus/direset atau ujiannya dihapus
      const serverMap = new Map<string, ExamAttempt>();
      sbAttempts.forEach((a) => {
        if (deletedAttemptIdsRef.current.has(a.id) || deletedExamIdsRef.current.has(a.examId)) {
          unifiedDbService.deleteExamAttempt(a.id);
          return;
        }
        serverMap.set(a.id, a);
      });

      // Peta attempt submitted lokal untuk menjamin ujian selesai tidak pernah tertimpa
      const localSubmittedMap = new Map<string, ExamAttempt>();
      prevAttempts.forEach((a) => {
        if (a.status === 'submitted') {
          localSubmittedMap.set(`${a.studentId}_${a.examId}`, a);
        }
      });

      const merged: ExamAttempt[] = [];

      prevAttempts.forEach((local) => {
        if (deletedAttemptIdsRef.current.has(local.id) || deletedExamIdsRef.current.has(local.examId)) return;

        const server = serverMap.get(local.id);
        if (!server) {
          merged.push(local);
          // JIKA lokal berstatus 'submitted' atau 'violation_disqualified' tetapi belum ada di server
          // (misal karena siswa me-refresh browser atau koneksi tertunda saat pengiriman):
          // Kirimkan otomatis ke Cloud Database di latar belakang agar data tidak hilang!
          if (local.status === 'submitted' || local.status === 'violation_disqualified') {
            unifiedDbService.saveExamAttempt(local);
          }
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
              // LOKAL HARUS MENANG! Sekaligus simpan ke database agar status server segera diperbarui.
              merged.push(local);
              unifiedDbService.saveExamAttempt(local);
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
        if (deletedAttemptIdsRef.current.has(server.id) || deletedExamIdsRef.current.has(server.examId)) return;
        const studentExamKey = `${server.studentId}_${server.examId}`;
        // Jika untuk siswa dan ujian ini lokal sudah submitted, jangan tambahkan in_progress server
        if (server.status === 'in_progress' && localSubmittedMap.has(studentExamKey)) {
          unifiedDbService.deleteExamAttempt(server.id);
          return;
        }
        merged.push(server);
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
          // Hapus juga attempt in_progress basi ini dari database agar bersih permanen
          unifiedDbService.deleteExamAttempt(a.id);
          return false;
        }
        return true;
      });

      saveAttempts(finalMerged);
      return finalMerged;
    },
    []
  );

  // 1. Memuat SEMUA data (Settings, Users, Subjects, Exams, Attempts) dari database aktif (Turso / Supabase)
  const loadAllData = useCallback(async () => {
    if (!isCloudDbConfigured()) return;

    try {
      isFetchingRef.current = true;
      const [dbSettings, dbUsers, dbSubjects, dbExams, dbAttempts] = await Promise.all([
        unifiedDbService.getSchoolSettings(),
        unifiedDbService.getUsers(),
        unifiedDbService.getSubjects(),
        unifiedDbService.getExams(),
        unifiedDbService.getExamAttempts(),
      ]);

      if (dbSettings) {
        const local = getStoredSettings();
        const mergedSettings: SchoolSettings = {
          ...local,
          ...dbSettings,
          appName: dbSettings.appName || local.appName || 'SMART CBT PRO',
          schoolName: dbSettings.schoolName || local.schoolName,
          dinasName: dbSettings.dinasName || local.dinasName || '',
          kabupatenName: dbSettings.kabupatenName || local.kabupatenName || '',
          signatureLocation: dbSettings.signatureLocation || local.signatureLocation || '',
        };
        setSettings(mergedSettings);
        saveSettings(mergedSettings);
      }
      if (dbUsers && dbUsers.length > 0) setUsers(dbUsers);
      if (dbSubjects && dbSubjects.length > 0) setSubjects(dbSubjects);
      if (dbExams) {
        const deletedIds = getDeletedExamIds();
        dbExams.forEach((e) => {
          if (deletedIds.has(e.id) || deletedExamIdsRef.current.has(e.id)) {
            unifiedDbService.deleteExam(e.id);
          }
        });
        const validExams = dbExams.filter(
          (e) => !deletedIds.has(e.id) && !deletedExamIdsRef.current.has(e.id)
        );
        setExams(sanitizeExams(validExams));
      }
      if (dbAttempts) {
        setAttempts((prev) => mergeAttemptsHelper(prev, dbAttempts));
      }
      setIsDataLoaded(true);
      setTimeout(() => {
        isFetchingRef.current = false;
      }, 300);
    } catch (err) {
      console.warn('Gagal memuat seluruh data dari cloud database:', err);
      isFetchingRef.current = false;
    }
  }, [mergeAttemptsHelper]);

  // 2. Memuat HANYA data Exam Attempts (Sangat ringan & cepat, < 50ms) - untuk polling berkala & realtime
  const loadAttempts = useCallback(async () => {
    if (!isCloudDbConfigured()) return;

    try {
      const dbAttempts = await unifiedDbService.getExamAttempts();
      if (dbAttempts) {
        setAttempts((prev) => mergeAttemptsHelper(prev, dbAttempts));
      }
    } catch (err) {
      console.warn('Gagal memuat attempts dari database:', err);
    }
  }, [mergeAttemptsHelper]);

  // Kompatibilitas untuk onRefreshData
  const loadDataFromSupabase = loadAttempts;
  const loadAllDataFromSupabase = loadAllData;

  // Memuat seluruh data saat awal aplikasi dimulai jika database cloud terkonfigurasi
  useEffect(() => {
    if (isCloudDbConfigured()) {
      loadAllData();
    }
  }, [loadAllData]);

  // Polling pintar & hemat bandwidth:
  // - Guru / Admin: Polling attempts setiap 3.5 detik (hanya 1 query ringan ke exam_attempts)
  // - Siswa: Hanya polling saat tab aktif di dashboard (setiap 12 detik)
  // - Supabase Realtime WebSocket subscription jika Supabase yang aktif
  useEffect(() => {
    if (!isCloudDbConfigured() || !currentUser) return;

    let pollIntervalMs = 0;
    if (currentUser.role === 'guru' || currentUser.role === 'admin') {
      pollIntervalMs = 3500; // Guru memantau ujian
    } else if (currentUser.role === 'siswa') {
      pollIntervalMs = 12000; // Siswa di dashboard polling santai
    }

    let interval: any = null;
    if (pollIntervalMs > 0) {
      interval = setInterval(() => {
        loadAttempts();
      }, pollIntervalMs);
    }

    // Ambil data seketika saat tab dibuka / difokuskan kembali
    const handleFocusOrVisible = () => {
      if (!document.hidden) {
        loadAttempts();
      }
    };
    window.addEventListener('focus', handleFocusOrVisible);
    document.addEventListener('visibilitychange', handleFocusOrVisible);

    // Supabase Realtime WebSocket subscription jika Supabase aktif
    const isStaff = currentUser.role === 'guru' || currentUser.role === 'admin';
    const supabase = getSupabase();
    let channel: any = null;
    if (supabase && isStaff && getActiveDbProvider() === 'supabase') {
      try {
        channel = supabase
          .channel('realtime_exam_attempts_sync')
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'exam_attempts' },
            () => {
              loadAttempts();
            }
          )
          .subscribe();
      } catch (err) {
        console.warn('Gagal mengaktifkan realtime Supabase:', err);
      }
    }

    // Pemulihan otomatis jika ada attempt yang tertunda saat koneksi terputus/offline/refresh
    const flushPendingAttempts = () => {
      try {
        const keys = Object.keys(localStorage);
        for (const key of keys) {
          if (key && key.startsWith('cbt_pending_attempt_')) {
            const raw = localStorage.getItem(key);
            if (raw) {
              const pendingAtt = JSON.parse(raw);
              unifiedDbService.saveExamAttempt(pendingAtt).then((ok) => {
                if (ok) localStorage.removeItem(key);
              });
            }
          }
        }
      } catch (e) {}
    };

    window.addEventListener('online', flushPendingAttempts);
    flushPendingAttempts();

    return () => {
      if (interval) clearInterval(interval);
      window.removeEventListener('focus', handleFocusOrVisible);
      document.removeEventListener('visibilitychange', handleFocusOrVisible);
      window.removeEventListener('online', flushPendingAttempts);
      if (supabase && channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [currentUser, loadAttempts]);

  // Sync state changes with localStorage & database (HANYA untuk Guru & Admin!)
  // Siswa TIDAK BOLEH menulis ulang data users, subjects, atau exams ke database agar tidak overload
  useEffect(() => {
    saveUsers(users);
    if (currentUser?.role !== 'siswa' && isCloudDbConfigured() && isDataLoaded && !isFetchingRef.current) {
      users.forEach((item) => unifiedDbService.saveUser(item));
      const currentIds = new Set(users.map((item) => item.id));
      prevUsersRef.current.forEach((old) => {
        if (!currentIds.has(old.id)) unifiedDbService.deleteUser(old.id);
      });
    }
    prevUsersRef.current = users;
  }, [users, isDataLoaded, currentUser]);

  useEffect(() => {
    saveSubjects(subjects);
    if (currentUser?.role !== 'siswa' && isCloudDbConfigured() && isDataLoaded && !isFetchingRef.current) {
      subjects.forEach((item) => unifiedDbService.saveSubject(item));
      const currentIds = new Set(subjects.map((item) => item.id));
      prevSubjectsRef.current.forEach((old) => {
        if (!currentIds.has(old.id)) unifiedDbService.deleteSubject(old.id);
      });
    }
    prevSubjectsRef.current = subjects;
  }, [subjects, isDataLoaded, currentUser]);

  useEffect(() => {
    saveExams(exams);
    if (currentUser?.role !== 'siswa' && isCloudDbConfigured() && isDataLoaded && !isFetchingRef.current) {
      exams.forEach((item) => unifiedDbService.saveExam(item));
      const currentIds = new Set(exams.map((item) => item.id));
      const removedIds: string[] = [];
      prevExamsRef.current.forEach((old) => {
        if (!currentIds.has(old.id)) {
          removedIds.push(old.id);
          deletedExamIdsRef.current.add(old.id);
          unifiedDbService.deleteExam(old.id);
        }
      });
      if (removedIds.length > 0) {
        addDeletedExamIds(removedIds);
      }
    }
    prevExamsRef.current = exams;
  }, [exams, isDataLoaded, currentUser]);

  useEffect(() => {
    saveAttempts(attempts);
    prevAttemptsRef.current = attempts;
  }, [attempts]);

  // Handler update attempts yang langsung menyimpan ke localStorage dan database
  const handleUpdateAttempts = useCallback((newAttempts: ExamAttempt[]) => {
    // 1. Deteksi attempt yang dihapus dan sinkronkan penghapusan ke database secara batch & storage lokal
    const newIds = new Set(newAttempts.map((item) => item.id));
    const toDeleteIds: string[] = [];

    prevAttemptsRef.current.forEach((prevItem) => {
      if (!newIds.has(prevItem.id)) {
        toDeleteIds.push(prevItem.id);
        deletedAttemptIdsRef.current.add(prevItem.id);
        try {
          localStorage.removeItem(`cbt_finished_${prevItem.studentId}_${prevItem.examId}`);
          localStorage.removeItem(`cbt_exam_progress_${prevItem.studentId}_${prevItem.examId}`);
          localStorage.removeItem(`cbt_pending_attempt_${prevItem.id}`);
        } catch (e) {}
      }
    });

    if (toDeleteIds.length > 0) {
      addDeletedAttemptIds(toDeleteIds);
      if (isCloudDbConfigured()) {
        unifiedDbService.deleteExamAttempts(toDeleteIds);
      }
    }

    setAttempts(newAttempts);
    saveAttempts(newAttempts);

    // 2. Simpan perubahan attempt baru atau yang diperbarui ke database
    if (isCloudDbConfigured()) {
      newAttempts.forEach((item) => {
        const prev = prevAttemptsRef.current.find((p) => p.id === item.id);
        if (
          !prev ||
          prev.status !== item.status ||
          prev.totalScore !== item.totalScore ||
          prev.scorePercentage !== item.scorePercentage ||
          prev.submittedAt !== item.submittedAt
        ) {
          unifiedDbService.saveExamAttempt(item);
        }
      });
    }
  }, []);

  useEffect(() => {
    saveSettings(settings);
    if (isCloudDbConfigured() && isDataLoaded) {
      unifiedDbService.saveSchoolSettings(settings);
    }
  }, [settings, isDataLoaded]);

  const handleUpdateSettings = useCallback(async (newSettings: SchoolSettings) => {
    setSettings(newSettings);
    saveSettings(newSettings);
    if (isCloudDbConfigured()) {
      try {
        await unifiedDbService.saveSchoolSettings(newSettings);
      } catch (err) {
        console.warn('Gagal menyimpan profil sekolah ke database:', err);
      }
    }
  }, []);

  // Fungsi sinkronisasi manual saat tombol "Simpan & Sinkronkan" diklik di modal
  const handleManualSync = async () => {
    if (!isCloudDbConfigured()) return;

    // 1. Unggah data yang saat ini aktif di aplikasi ke tabel database
    await unifiedDbService.saveSchoolSettings(settings);
    for (const u of users) {
      await unifiedDbService.saveUser(u);
    }
    for (const s of subjects) {
      await unifiedDbService.saveSubject(s);
    }
    for (const e of exams) {
      await unifiedDbService.saveExam(e);
    }
    for (const a of attempts) {
      await unifiedDbService.saveExamAttempt(a);
    }

    // 2. Muat ulang data terbaru
    await loadDataFromSupabase();
  };

  const handleUpdateExams = useCallback((newExams: Exam[]) => {
    const sanitized = sanitizeExams(newExams);
    const newExamIds = new Set(sanitized.map((e) => e.id));
    const deletedExamIds: string[] = [];

    prevExamsRef.current.forEach((old) => {
      if (!newExamIds.has(old.id)) {
        deletedExamIds.push(old.id);
        deletedExamIdsRef.current.add(old.id);
      }
    });

    if (deletedExamIds.length > 0) {
      addDeletedExamIds(deletedExamIds);
      if (isCloudDbConfigured()) {
        deletedExamIds.forEach((id) => unifiedDbService.deleteExam(id));
      }
      deletedExamIds.forEach((id) => {
        try {
          const keys = Object.keys(localStorage);
          keys.forEach((key) => {
            if (key.includes(`_${id}`)) {
              localStorage.removeItem(key);
            }
          });
        } catch (e) {}
      });
      // Hapus otomatis seluruh attempts siswa yang terafiliasi dengan paket ujian yang dihapus
      setAttempts((prev) => {
        const kept = prev.filter((a) => !deletedExamIds.includes(a.examId));
        saveAttempts(kept);
        return kept;
      });
    }

    setExams(sanitized);
    saveExams(sanitized);
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
          onOpenTursoModal={() => setIsTursoModalOpen(true)}
        />
        <SupabaseConfigModal
          isOpen={isSupabaseModalOpen}
          onClose={() => setIsSupabaseModalOpen(false)}
          onSyncNow={handleManualSync}
        />
        <TursoConfigModal
          isOpen={isTursoModalOpen}
          onClose={() => setIsTursoModalOpen(false)}
          currentData={{
            settings,
            users,
            subjects,
            exams,
            attempts,
          }}
          onMigrationSuccess={async () => {
            await loadAllData();
          }}
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
            onOpenTursoModal={() => setIsTursoModalOpen(true)}
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
              onUpdateSettings={handleUpdateSettings}
              onOpenSupabaseModal={() => setIsSupabaseModalOpen(true)}
              onOpenTursoModal={() => setIsTursoModalOpen(true)}
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
              onRefreshData={loadDataFromSupabase}
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
              <span>
                Database {getActiveDbProvider() === 'turso' ? 'Turso LibSQL SQLite' : 'Supabase PostgreSQL'}
              </span>
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

      {/* Turso Database Migration & Config Modal */}
      <TursoConfigModal
        isOpen={isTursoModalOpen}
        onClose={() => setIsTursoModalOpen(false)}
        currentData={{
          settings,
          users,
          subjects,
          exams,
          attempts,
        }}
        onMigrationSuccess={async () => {
          await loadAllData();
        }}
      />
    </div>
  );
}
