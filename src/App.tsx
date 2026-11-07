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
import { syncTursoConfigWithServer } from './lib/turso';
import { unifiedDbService, isCloudDbConfigured } from './services/unifiedDbService';
import Navbar from './components/Navbar';
import LoginView from './components/LoginView';
import AdminPanel from './components/AdminPanel';
import GuruPanel from './components/GuruPanel';
import SiswaPanel from './components/SiswaPanel';
import TursoConfigModal from './components/TursoConfigModal';

// Cross-tab realtime synchronization channel
const syncChannel = typeof window !== 'undefined' && 'BroadcastChannel' in window
  ? new BroadcastChannel('cbt_turso_sync_channel')
  : null;

export default function App() {
  const [users, setUsers] = useState<User[]>(getInitialUsers);
  const [subjects, setSubjects] = useState<Subject[]>(getInitialSubjects);
  const [exams, setExams] = useState<Exam[]>(getInitialExams);
  const [attempts, setAttempts] = useState<ExamAttempt[]>(getInitialAttempts);
  const [settings, setSettings] = useState<SchoolSettings>(getInitialSettings);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isTursoModalOpen, setIsTursoModalOpen] = useState<boolean>(false);
  const [isDataLoaded, setIsDataLoaded] = useState<boolean>(false);

  const prevUsersRef = useRef<User[]>(users);
  const prevSubjectsRef = useRef<Subject[]>(subjects);
  const prevExamsRef = useRef<Exam[]>(exams);
  const prevAttemptsRef = useRef<ExamAttempt[]>(attempts);
  const deletedAttemptIdsRef = useRef<Set<string>>(getDeletedAttemptIds());
  const deletedExamIdsRef = useRef<Set<string>>(getDeletedExamIds());

  const isFetchingRef = useRef(false);

  // Helper untuk menggabungkan attempts server Turso dengan lokal secara konsisten & aman
  const mergeAttemptsHelper = useCallback(
    (prevAttempts: ExamAttempt[], tursoAttempts: ExamAttempt[]) => {
      const deletedExamIds = getDeletedExamIds();
      const deletedAttemptIds = getDeletedAttemptIds();
      deletedExamIds.forEach((id) => deletedExamIdsRef.current.add(id));
      deletedAttemptIds.forEach((id) => deletedAttemptIdsRef.current.add(id));

      // Buat map dari database Turso, buang yang sudah dihapus/direset atau ujiannya dihapus
      const serverMap = new Map<string, ExamAttempt>();
      tursoAttempts.forEach((a) => {
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
          // JIKA lokal berstatus 'submitted' atau 'violation_disqualified' tetapi belum ada di database Turso:
          // Kirimkan otomatis ke Turso di latar belakang agar data tidak hilang!
          if (local.status === 'submitted' || local.status === 'violation_disqualified') {
            unifiedDbService.saveExamAttempt(local);
          }
        } else {
          // 1. Siswa telah selesai mengerjakan ujian (status: 'submitted'):
          if (local.status === 'submitted') {
            if (server.status === 'submitted') {
              const localScore = local.totalScore ?? local.scorePercentage ?? 0;
              const serverScore = server.totalScore ?? server.scorePercentage ?? 0;
              if (localScore >= serverScore) {
                merged.push(local);
              } else {
                merged.push(server);
              }
            } else {
              // Lokal sudah selesai diserahkan, sedangkan server masih 'in_progress' atau lama.
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
        if (server.status === 'in_progress' && localSubmittedMap.has(studentExamKey)) {
          unifiedDbService.deleteExamAttempt(server.id);
          return;
        }
        merged.push(server);
      });

      const submittedKeys = new Set(
        merged
          .filter((a) => a.status === 'submitted')
          .map((a) => `${a.studentId}_${a.examId}`)
      );

      const finalMerged = merged.filter((a) => {
        if (a.status === 'in_progress' && submittedKeys.has(`${a.studentId}_${a.examId}`)) {
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

  // 1. Memuat SEMUA data (Settings, Users, Subjects, Exams, Attempts) dari Database Turso
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
      if (dbUsers && dbUsers.length > 0) {
        setUsers(dbUsers);
        saveUsers(dbUsers);
      }
      if (dbSubjects && dbSubjects.length > 0) {
        setSubjects(dbSubjects);
        saveSubjects(dbSubjects);
      }
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
        const sanitized = sanitizeExams(validExams);
        setExams(sanitized);
        saveExams(sanitized);
      }
      if (dbAttempts) {
        setAttempts((prev) => mergeAttemptsHelper(prev, dbAttempts));
      }
      setIsDataLoaded(true);
      setTimeout(() => {
        isFetchingRef.current = false;
      }, 300);
    } catch (err) {
      console.warn('Gagal memuat seluruh data dari Turso database:', err);
      isFetchingRef.current = false;
    }
  }, [mergeAttemptsHelper]);

  // 2. Memuat HANYA data Exam Attempts (Sangat ringan & cepat, < 50ms) - untuk polling monitor
  const loadAttempts = useCallback(async () => {
    if (!isCloudDbConfigured()) return;

    try {
      const dbAttempts = await unifiedDbService.getExamAttempts();
      if (dbAttempts) {
        setAttempts((prev) => mergeAttemptsHelper(prev, dbAttempts));
      }
    } catch (err) {
      console.warn('Gagal memuat attempts dari Turso:', err);
    }
  }, [mergeAttemptsHelper]);

  // Inisialisasi awal aplikasi:
  // Ambil shared config Turso dari server terlebih dahulu agar semua browser otomatis tersambung!
  useEffect(() => {
    (async () => {
      await syncTursoConfigWithServer();
      if (isCloudDbConfigured()) {
        await loadAllData();
      }
    })();
  }, [loadAllData]);

  // Polling pintar antar-browser agar seluruh data selalu sinkron:
  // - Guru / Admin: Polling attempts setiap 3 detik, dan periksa ujian/mapel/users setiap 6 detik
  // - Siswa: Polling berkala setiap 8 detik agar ujian baru langsung muncul
  // - Window focus & visibilitychange: Seketika tab difokuskan, muat data terbaru dari Turso
  useEffect(() => {
    if (!isCloudDbConfigured() || !currentUser) return;

    let attemptsInterval: any = null;
    let fullInterval: any = null;

    if (currentUser.role === 'guru' || currentUser.role === 'admin') {
      attemptsInterval = setInterval(() => {
        loadAttempts();
      }, 3000);

      fullInterval = setInterval(() => {
        loadAllData();
      }, 7000);
    } else if (currentUser.role === 'siswa') {
      fullInterval = setInterval(() => {
        loadAllData();
      }, 8500);
    }

    const handleFocusOrVisible = () => {
      if (!document.hidden) {
        loadAllData();
      }
    };

    window.addEventListener('focus', handleFocusOrVisible);
    document.addEventListener('visibilitychange', handleFocusOrVisible);

    // Dengar pesan dari tab lain di browser yang sama
    const handleBroadcast = (event: MessageEvent) => {
      if (event.data?.type === 'CBT_DATA_MUTATED') {
        loadAllData();
      }
    };
    if (syncChannel) {
      syncChannel.addEventListener('message', handleBroadcast);
    }

    // Pemulihan otomatis jika ada attempt yang tertunda saat koneksi terputus/offline
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
      if (attemptsInterval) clearInterval(attemptsInterval);
      if (fullInterval) clearInterval(fullInterval);
      window.removeEventListener('focus', handleFocusOrVisible);
      document.removeEventListener('visibilitychange', handleFocusOrVisible);
      window.removeEventListener('online', flushPendingAttempts);
      if (syncChannel) {
        syncChannel.removeEventListener('message', handleBroadcast);
      }
    };
  }, [currentUser, loadAttempts, loadAllData]);

  // Helper broadcast perubahan data ke tab lain
  const notifyMutation = useCallback(() => {
    if (syncChannel) {
      syncChannel.postMessage({ type: 'CBT_DATA_MUTATED', timestamp: Date.now() });
    }
  }, []);

  // Sync perubahan data users ke Turso secara langsung (Hanya Guru & Admin)
  useEffect(() => {
    saveUsers(users);
    if (currentUser?.role !== 'siswa' && isCloudDbConfigured() && isDataLoaded && !isFetchingRef.current) {
      users.forEach((item) => unifiedDbService.saveUser(item));
      const currentIds = new Set(users.map((item) => item.id));
      prevUsersRef.current.forEach((old) => {
        if (!currentIds.has(old.id)) unifiedDbService.deleteUser(old.id);
      });
      notifyMutation();
    }
    prevUsersRef.current = users;
  }, [users, isDataLoaded, currentUser, notifyMutation]);

  // Sync perubahan data subjects ke Turso secara langsung (Hanya Guru & Admin)
  useEffect(() => {
    saveSubjects(subjects);
    if (currentUser?.role !== 'siswa' && isCloudDbConfigured() && isDataLoaded && !isFetchingRef.current) {
      subjects.forEach((item) => unifiedDbService.saveSubject(item));
      const currentIds = new Set(subjects.map((item) => item.id));
      prevSubjectsRef.current.forEach((old) => {
        if (!currentIds.has(old.id)) unifiedDbService.deleteSubject(old.id);
      });
      notifyMutation();
    }
    prevSubjectsRef.current = subjects;
  }, [subjects, isDataLoaded, currentUser, notifyMutation]);

  // Sync perubahan data exams ke Turso secara langsung (Hanya Guru & Admin)
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
      notifyMutation();
    }
    prevExamsRef.current = exams;
  }, [exams, isDataLoaded, currentUser, notifyMutation]);

  useEffect(() => {
    saveAttempts(attempts);
    prevAttemptsRef.current = attempts;
  }, [attempts]);

  // Handler update attempts yang langsung menyimpan ke localStorage dan database Turso
  const handleUpdateAttempts = useCallback((newAttempts: ExamAttempt[]) => {
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

    // Simpan perubahan attempt baru atau yang diperbarui ke database Turso
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

    notifyMutation();
  }, [notifyMutation]);

  // Handler simpan profil sekolah langsung ke database Turso
  const handleUpdateSettings = useCallback(async (newSettings: SchoolSettings) => {
    setSettings(newSettings);
    saveSettings(newSettings);
    if (isCloudDbConfigured()) {
      try {
        await unifiedDbService.saveSchoolSettings(newSettings);
      } catch (err) {
        console.warn('Gagal menyimpan profil sekolah ke Turso:', err);
      }
    }
    notifyMutation();
  }, [notifyMutation]);

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
      setAttempts((prev) => {
        const kept = prev.filter((a) => !deletedExamIds.includes(a.examId));
        saveAttempts(kept);
        return kept;
      });
    }

    setExams(sanitized);
    saveExams(sanitized);
    notifyMutation();
  }, [notifyMutation]);

  const handleRoleSwitch = (newRole: UserRole) => {
    const targetUser = users.find((u) => u.role === newRole);
    if (targetUser) {
      setCurrentUser(targetUser);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
  };

  const isTursoConfigured = isCloudDbConfigured();

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
          onOpenTursoModal={() => setIsTursoModalOpen(true)}
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
              onOpenTursoModal={() => setIsTursoModalOpen(true)}
              onLogout={handleLogout}
              onRefreshData={loadAttempts}
            />
          )}

          {currentUser.role === 'siswa' && (
            <SiswaPanel
              currentUser={currentUser}
              exams={exams}
              attempts={attempts}
              settings={settings}
              onUpdateAttempts={handleUpdateAttempts}
              onRefreshData={loadAllData}
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
              <span className="font-semibold text-emerald-700">
                Database {isTursoConfigured ? 'Turso LibSQL SQLite (Aktif Terhubung)' : 'Penyimpanan Lokal'}
              </span>
              <span>•</span>
              <span>Anti-Curang Lockdown Browser</span>
              <span>•</span>
              <span>Generator Soal AI</span>
            </div>
          </div>
        </footer>
      )}

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
