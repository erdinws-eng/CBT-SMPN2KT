import { useState, useEffect, useRef, type FormEvent } from 'react';
import confetti from 'canvas-confetti';
import Xarrow, { Xwrapper } from 'react-xarrows';
import {
  Clock,
  ShieldAlert,
  Maximize,
  Minimize,
  CheckCircle,
  AlertTriangle,
  FileCheck,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Award,
  HelpCircle,
  Sparkles,
  Lock,
  ArrowRight,
  Flag,
  RotateCcw,
  Check,
  X,
  Volume2,
  Play,
  Menu,
  LayoutDashboard,
  History,
  Loader2,
  ShieldCheck,
  Info,
  LayoutGrid,
  LogOut,
  Key,
} from 'lucide-react';
import {
  Exam,
  ExamAttempt,
  Question,
  User,
  SchoolSettings,
  QuestionType,
} from '../types';
import { saveAttempts } from '../lib/storage';
import { tursoService } from '../services/tursoService';
import { isCloudDbConfigured } from '../services/unifiedDbService';
import { getExamTokenState, verifyExamToken } from '../lib/examToken';

interface SiswaPanelProps {
  currentUser: User;
  exams: Exam[];
  attempts: ExamAttempt[];
  settings: SchoolSettings;
  onUpdateAttempts: (attempts: ExamAttempt[]) => void;
  onRefreshData?: () => Promise<void>;
  onLogout?: () => void;
  onAutoLogout?: (reason: string) => void;
  onExamActiveChange?: (isActive: boolean) => void;
}

export default function SiswaPanel({
  currentUser,
  exams,
  attempts,
  settings,
  onUpdateAttempts,
  onRefreshData,
  onLogout,
  onAutoLogout,
  onExamActiveChange,
}: SiswaPanelProps) {
  // Layout state
  const [activeTab, setActiveTab] = useState<'dashboard' | 'riwayat'>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // State for active exam room
  const [activeExam, setActiveExam] = useState<Exam | null>(null);
  const [currentAttempt, setCurrentAttempt] = useState<ExamAttempt | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);

  // Exam in-progress state
  const [userAnswers, setUserAnswers] = useState<Record<string, any>>({});
  const [doubtQuestions, setDoubtQuestions] = useState<Record<string, boolean>>({});
  const [remainingSeconds, setRemainingSeconds] = useState<number>(0);
  const remainingSecondsRef = useRef<number>(0);
  const userAnswersRef = useRef<Record<string, any>>({});
  const doubtQuestionsRef = useRef<Record<string, boolean>>({});
  const [isSubmitConfirmOpen, setIsSubmitConfirmOpen] = useState<boolean>(false);
  const [isSubmittingExam, setIsSubmittingExam] = useState<boolean>(false);
  const isSubmittingRef = useRef<boolean>(false);
  const [isSavingExam, setIsSavingExam] = useState<boolean>(false);
  const [submitPhase, setSubmitPhase] = useState<'idle' | 'sending' | 'sent' | 'result'>('idle');
  const [examResultData, setExamResultData] = useState<{
    exam: Exam;
    attempt: ExamAttempt;
    syncedToServer: boolean;
  } | null>(null);
  const [isQuestionInfoOpen, setIsQuestionInfoOpen] = useState<boolean>(false);
  const [isQuestionListOpen, setIsQuestionListOpen] = useState<boolean>(true);
  const [isCheckingPermission, setIsCheckingPermission] = useState<boolean>(false);

  // Anti-cheat & token gate state
  const [violationCount, setViolationCount] = useState<number>(0);
  const [violationWarningModal, setViolationWarningModal] = useState<string | null>(null);
  const [isFullScreen, setIsFullScreen] = useState<boolean>(false);
  const [selectedDomainItem, setSelectedDomainItem] = useState<string | null>(null);
  const [pendingTokenExam, setPendingTokenExam] = useState<Exam | null>(null);
  const [tokenInput, setTokenInput] = useState<string>('');
  const [tokenError, setTokenError] = useState<string>('');
  const [isPrivacyBlackout, setIsPrivacyBlackout] = useState<boolean>(false);

  // Wake lock ref
  const wakeLockRef = useRef<any>(null);

  // Beritahu App.tsx saat siswa sedang berada di ruang ujian agar polling berat dijeda
  useEffect(() => {
    onExamActiveChange?.(Boolean(activeExam));
    return () => {
      onExamActiveChange?.(false);
    };
  }, [activeExam, onExamActiveChange]);

  // Keamanan Sesi: Jika siswa menyembunyikan browser / pindah tab saat di Beranda / Riwayat / Hasil,
  // otomatis logout sehingga wajib login ulang dengan username & password.
  useEffect(() => {
    const flushNonLockdownProgress = () => {
      if (!activeExam || activeExam.lockdownBrowser || currentAttempt?.status !== 'in_progress' || submitPhase !== 'idle') {
        return;
      }
      saveActiveProgressToLocal({
        answers: userAnswersRef.current,
        doubtQuestions: doubtQuestionsRef.current,
        remainingSeconds: remainingSecondsRef.current,
      });
      try {
        const checkpointAttempt: ExamAttempt = {
          ...currentAttempt,
          answers: userAnswersRef.current || {},
          doubtfulAnswers: doubtQuestionsRef.current || {},
          remainingSeconds: remainingSecondsRef.current,
        };
        tursoService.saveExamAttempt(checkpointAttempt, { keepalive: true });
      } catch (e) {}
    };

    const handleStudentHideLogout = () => {
      if (!document.hidden) return;
      // Jika sedang dalam ujian lockdown aktif, biarkan handler anti-cheat mengunci & menyimpan dulu
      if (activeExam && activeExam.lockdownBrowser && currentAttempt?.status === 'in_progress' && submitPhase === 'idle') {
        return;
      }
      // Jangan memotong di tengah proses sending 1 detik (data sudah aman di cbt_pending_attempt_)
      if (submitPhase === 'sending') return;

      flushNonLockdownProgress();

      onAutoLogout?.(
        'Sesi Anda otomatis berakhir karena browser disembunyikan atau Anda berpindah tab. Silakan login ulang dengan username dan password.'
      );
    };

    document.addEventListener('visibilitychange', handleStudentHideLogout);
    window.addEventListener('pagehide', flushNonLockdownProgress);
    window.addEventListener('beforeunload', flushNonLockdownProgress);
    return () => {
      document.removeEventListener('visibilitychange', handleStudentHideLogout);
      window.removeEventListener('pagehide', flushNonLockdownProgress);
      window.removeEventListener('beforeunload', flushNonLockdownProgress);
    };
  }, [activeExam, currentAttempt, submitPhase, onAutoLogout]);

  // Filter exams for student's class
  const studentClass = currentUser.classGrade || '8A';
  const myExams = exams.filter(
    (e) => (e.targetClasses.includes(studentClass) || e.targetClasses.includes('all')) && e.isActive !== false
  );

  // Kunci storage untuk progres pengerjaan ujian aktif siswa di perangkat ini
  const getProgressStorageKey = (studentId: string, examId: string) =>
    `cbt_exam_progress_${studentId}_${examId}`;

  // Kunci permanen lokal saat siswa terkunci pelanggaran agar refresh browser tidak bisa membuka soal kembali
  const getViolationLockKey = (studentId: string, examId: string) =>
    `cbt_violation_lock_${studentId}_${examId}`;

  // Helper menyimpan progres ujian aktif ke localStorage secara realtime
  const saveActiveProgressToLocal = (partial: {
    answers?: Record<string, any>;
    doubtQuestions?: Record<string, boolean>;
    currentQuestionIndex?: number;
    remainingSeconds?: number;
    violationCount?: number;
  }) => {
    if (!activeExam) return;
    try {
      const key = getProgressStorageKey(currentUser.id, activeExam.id);
      const raw = localStorage.getItem(key);
      const data = raw ? JSON.parse(raw) : {};
      if (partial.answers !== undefined) data.answers = partial.answers;
      if (partial.doubtQuestions !== undefined) data.doubtQuestions = partial.doubtQuestions;
      if (partial.currentQuestionIndex !== undefined) data.currentQuestionIndex = partial.currentQuestionIndex;
      if (partial.remainingSeconds !== undefined) {
        data.remainingSeconds = partial.remainingSeconds;
      } else if (typeof data.remainingSeconds !== 'number') {
        data.remainingSeconds = remainingSecondsRef.current;
      }
      if (partial.violationCount !== undefined) data.violationCount = partial.violationCount;
      data.lastSavedAt = new Date().toISOString();
      localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
      console.warn('Gagal menyimpan progres lokal:', e);
    }
  };

  // Navigasi nomor soal sekaligus memperbarui posisi index di localStorage
  const handleNavigateQuestion = (newIndex: number) => {
    setCurrentQuestionIndex(newIndex);
    saveActiveProgressToLocal({ currentQuestionIndex: newIndex });
  };

  // Sinkronisasi otomatis data ujian dari database Turso ke localStorage browser HP siswa saat guru mengklik Lanjutkan
  useEffect(() => {
    if (activeExam) return; // Jangan timpa jika siswa sedang di dalam ruang ujian aktif

    // Cek seluruh ujian yang sudah diserahkan (submitted) agar draf lokal selalu bersih
    const submittedExamIds = new Set(
      attempts
        .filter((a) => a.studentId === currentUser.id && a.status === 'submitted')
        .map((a) => a.examId)
    );
    // Tambahkan juga dari simpanan ujian selesai permanen
    exams.forEach((ex) => {
      try {
        if (localStorage.getItem(`cbt_finished_${currentUser.id}_${ex.id}`)) {
          submittedExamIds.add(ex.id);
        }
      } catch (e) {}
    });

    // Bersihkan draf lokal jika ujian sudah diserahkan
    submittedExamIds.forEach((examId) => {
      const key = getProgressStorageKey(currentUser.id, examId);
      try {
        localStorage.removeItem(key);
      } catch (e) {}
    });

    attempts.forEach((att) => {
      if (att.studentId === currentUser.id && att.status === 'in_progress') {
        // Jika ujian sudah pernah diserahkan (submitted), JANGAN PERNAH membuat draf pengerjaan lagi
        if (submittedExamIds.has(att.examId)) return;

        // Jika masih ada antrean pelanggaran lokal yang belum terkirim untuk attempt ini, JANGAN anggap sudah diizinkan guru
        let hasUnsentViolation = false;
        try {
          hasUnsentViolation = Boolean(localStorage.getItem(`cbt_pending_attempt_${att.id}`));
        } catch (e) {}
        if (hasUnsentViolation) return;

        // Guru benar-benar sudah menekan "Lanjutkan": hapus kunci pelanggaran lokal
        try {
          localStorage.removeItem(getViolationLockKey(currentUser.id, att.examId));
        } catch (e) {}

        const key = getProgressStorageKey(currentUser.id, att.examId);
        const raw = localStorage.getItem(key);
        let localData: any = {};
        if (raw) {
          try {
            localData = JSON.parse(raw);
          } catch (e) {}
        }

        const sameAttemptLocal = !localData.attemptId || localData.attemptId === att.id;

        // Tarik jawaban dari database yang tersimpan sebelum pelanggaran
        const mergedAnswers = {
          ...(sameAttemptLocal ? localData.answers || {} : {}),
          ...(att.answers || {}),
        };

        const localRem =
          sameAttemptLocal && typeof localData.remainingSeconds === 'number' && Number.isFinite(localData.remainingSeconds)
            ? localData.remainingSeconds
            : undefined;
        const dbRem =
          typeof att.remainingSeconds === 'number' && Number.isFinite(att.remainingSeconds)
            ? att.remainingSeconds
            : undefined;
        const syncedRemainingSeconds =
          localRem !== undefined && dbRem !== undefined
            ? Math.min(localRem, dbRem)
            : (localRem !== undefined ? localRem : dbRem);

        const updatedLocal = {
          ...(sameAttemptLocal ? localData : {}),
          attemptId: att.id,
          examId: att.examId,
          studentId: currentUser.id,
          answers: mergedAnswers,
          doubtQuestions: (sameAttemptLocal && localData.doubtQuestions) || att.doubtfulAnswers || {},
          currentQuestionIndex: (sameAttemptLocal && localData.currentQuestionIndex) || 0,
          ...(syncedRemainingSeconds !== undefined ? { remainingSeconds: syncedRemainingSeconds } : {}),
          startedAt: att.startedAt || localData.startedAt || new Date().toISOString(),
          violationCount: 0,
          lastPulledFromDatabaseAt: new Date().toISOString(),
        };

        localStorage.setItem(key, JSON.stringify(updatedLocal));
      }
    });

    // Otomatis tutup jendela modal peringatan pelanggaran jika guru sudah mengklik "Lanjutkan"
    const hasResumedAttempt = attempts.some((att) => {
      if (att.studentId !== currentUser.id || att.status !== 'in_progress' || submittedExamIds.has(att.examId)) {
        return false;
      }
      try {
        if (localStorage.getItem(`cbt_pending_attempt_${att.id}`)) return false;
      } catch (e) {}
      return true;
    });
    if (hasResumedAttempt && violationWarningModal) {
      setViolationWarningModal(null);
    }
  }, [attempts, currentUser.id, activeExam, violationWarningModal, exams]);

  // Auto-polling periksa izin guru setiap 1.5 detik saat modal pelanggaran aktif agar langsung unlock saat guru klik Lanjutkan
  useEffect(() => {
    if (!violationWarningModal) return;
    const interval = setInterval(() => {
      if (onRefreshData) {
        onRefreshData();
      }
    }, 1500);
    return () => clearInterval(interval);
  }, [violationWarningModal, onRefreshData]);

  // Fungsi periksa izin guru secara manual (misal siswa klik tombol Cek Izin)
  const handleCheckTeacherPermission = async (targetExam?: Exam) => {
    setIsCheckingPermission(true);
    try {
      if (onRefreshData) {
        await onRefreshData();
      }
      await new Promise((resolve) => setTimeout(resolve, 500));

      const isResumed = attempts.some((att) => {
        if (att.studentId !== currentUser.id || att.status !== 'in_progress') return false;
        if (targetExam && att.examId !== targetExam.id) return false;
        return true;
      });

      if (isResumed) {
        setViolationWarningModal(null);
        if (targetExam) {
          handleStartExam(targetExam);
        }
      } else {
        alert(
          'Pengawas/Guru belum menekan tombol "Lanjutkan". Silakan lapor ke Pengawas di ruangan ujian agar tombol "Lanjutkan" pada tabel pemantauan diklik.'
        );
      }
    } catch (e) {
      console.warn('Gagal cek izin:', e);
    } finally {
      setIsCheckingPermission(false);
    }
  };

  // 1. Cek kelayakan & Token Ujian sebelum masuk ruang CBT
  const handleStartExam = (exam: Exam) => {
    // Check existing attempts for this exam
    const studentExamAttempts = attempts.filter(
      (a) => a.examId === exam.id && a.studentId === currentUser.id
    );

    // Utamakan attempt in_progress (hasil guru klik Lanjutkan, asal tidak ada antrean pelanggaran tertunda)
    const inProgressAttempt = studentExamAttempts.find((a) => {
      if (a.status !== 'in_progress') return false;
      try {
        if (localStorage.getItem(`cbt_pending_attempt_${a.id}`)) return false;
      } catch (e) {}
      return true;
    });
    const isResumedByTeacher = Boolean(inProgressAttempt);

    const sortedAttempts = [...studentExamAttempts].sort(
      (a, b) => new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime()
    );
    const latestAttempt = sortedAttempts.length > 0 ? sortedAttempts[sortedAttempts.length - 1] : null;

    if (latestAttempt && latestAttempt.status === 'submitted' && !isResumedByTeacher) {
      if (!exam.allowRetake) {
        alert('Anda sudah menyelesaikan ujian ini dan tidak ada kesempatan remedial.');
        return;
      }
      if (sortedAttempts.length >= (exam.maxRetakes || 1) + 1) { // 1 initial + maxRetakes
        alert(`Anda telah mencapai batas maksimal pengerjaan (Total: ${sortedAttempts.length} kali).`);
        return;
      }
    }

    // Cek apakah siswa berstatus terkunci karena pelanggaran (baik di DB maupun kunci lokal anti-refresh)
    let hasLocalViolationLock = false;
    try {
      hasLocalViolationLock = Boolean(localStorage.getItem(getViolationLockKey(currentUser.id, exam.id)));
    } catch (e) {}
    const isDisqualified =
      !isResumedByTeacher &&
      (hasLocalViolationLock || studentExamAttempts.some((a) => a.status === 'violation_disqualified'));

    if (isDisqualified) {
      setViolationWarningModal(
        'Ujian Anda saat ini TERKUNCI karena pelanggaran sebelumnya.\n\nSilakan lapor ke Pengawas/Guru di ruangan ujian agar tombol "Lanjutkan" pada tabel pemantauan diklik.'
      );
      handleCheckTeacherPermission(exam);
      return;
    }

    // Jika paket ujian memerlukan token (tetap atau rotasi 5/10/15 menit), tampilkan modal verifikasi token
    const tokenState = getExamTokenState(exam);
    if (tokenState.requiresToken) {
      setPendingTokenExam(exam);
      setTokenInput('');
      setTokenError('');
      return;
    }

    enterExamRoom(exam);
  };

  const handleVerifyTokenAndEnter = (e: FormEvent) => {
    e.preventDefault();
    if (!pendingTokenExam) return;

    if (!verifyExamToken(pendingTokenExam, tokenInput)) {
      setTokenError(
        'Token tidak sesuai atau sudah berganti. Silakan lihat/minta token terbaru yang aktif dari Pengawas Ujian.'
      );
      return;
    }

    const target = pendingTokenExam;
    setPendingTokenExam(null);
    setTokenInput('');
    setTokenError('');
    enterExamRoom(target);
  };

  const enterExamRoom = (exam: Exam) => {
    setIsPrivacyBlackout(false);

    // Periksa apakah ada draf pengerjaan yang tersimpan di localStorage
    const localKey = getProgressStorageKey(currentUser.id, exam.id);
    const localRaw = localStorage.getItem(localKey);
    let localProgress: any = null;
    if (localRaw) {
      try {
        localProgress = JSON.parse(localRaw);
      } catch (e) {
        localProgress = null;
      }
    }

    // Clone questions to safely mutate options
    let questionsOrder = exam.questions.map((q) => {
      const clonedQ = { ...q };
      if (
        exam.randomizeOptions &&
        clonedQ.options &&
        (clonedQ.type === 'pilihan_ganda' || clonedQ.type === 'pilihan_ganda_kompleks')
      ) {
        clonedQ.options = [...clonedQ.options].sort(() => Math.random() - 0.5);
      }
      return clonedQ;
    });

    // Jika sedang melanjutkan draf lokal, pertahankan urutan butir soal sebelumnya
    if (localProgress?.questionsOrderIds && Array.isArray(localProgress.questionsOrderIds)) {
      const qMap = new Map(questionsOrder.map(q => [q.id, q]));
      const ordered = localProgress.questionsOrderIds.map((id: string) => qMap.get(id)).filter(Boolean) as Question[];
      if (ordered.length === questionsOrder.length) {
        questionsOrder = ordered;
      }
    } else if (exam.randomizeQuestions) {
      questionsOrder.sort(() => Math.random() - 0.5);
    }

    // Periksa apakah ada data attempt in_progress di database (hasil guru klik Lanjutkan)
    const dbAttempt = attempts.find(
      (a) => a.examId === exam.id && a.studentId === currentUser.id && a.status === 'in_progress'
    );

    const isSameLocalAttempt =
      !dbAttempt || !localProgress?.attemptId || localProgress.attemptId === dbAttempt.id;

    const dbAnswers = dbAttempt?.answers || {};
    const localAnswers = isSameLocalAttempt ? (localProgress?.answers || {}) : {};
    // Tarik dan gabungkan jawaban dari database dengan lokal
    const resumedAnswers = { ...localAnswers, ...dbAnswers };
    const resumedDoubts =
      (isSameLocalAttempt ? localProgress?.doubtQuestions : undefined) || dbAttempt?.doubtfulAnswers || {};
    const resumedIndex = isSameLocalAttempt ? (localProgress?.currentQuestionIndex || 0) : 0;

    // Hitung sisa waktu terakhir secara akurat dari lokal maupun DB agar tidak pernah kembali ke waktu awal (misal 60 menit)
    const totalDurationSeconds = Math.max(60, (Number(exam.durationMinutes) || 60) * 60);
    const localRemaining =
      isSameLocalAttempt &&
      typeof localProgress?.remainingSeconds === 'number' &&
      Number.isFinite(localProgress.remainingSeconds)
        ? Math.max(0, Math.min(totalDurationSeconds, Math.floor(localProgress.remainingSeconds)))
        : undefined;
    const dbRemaining =
      typeof dbAttempt?.remainingSeconds === 'number' && Number.isFinite(dbAttempt.remainingSeconds)
        ? Math.max(0, Math.min(totalDurationSeconds, Math.floor(dbAttempt.remainingSeconds)))
        : undefined;

    let resumedSeconds = totalDurationSeconds;
    if (localRemaining !== undefined && dbRemaining !== undefined) {
      resumedSeconds = Math.min(localRemaining, dbRemaining);
    } else if (localRemaining !== undefined) {
      resumedSeconds = localRemaining;
    } else if (dbRemaining !== undefined) {
      resumedSeconds = dbRemaining;
    }
    if ((localRemaining !== undefined || dbRemaining !== undefined) && resumedSeconds <= 0) {
      resumedSeconds = 1;
    }

    const resumedViolations = 0; // Reset ke 0 saat dilanjutkan
    const attemptId = dbAttempt?.id || (isSameLocalAttempt ? localProgress?.attemptId : undefined) || 'att_' + Date.now();
    const startedAt = dbAttempt?.startedAt || (isSameLocalAttempt ? localProgress?.startedAt : undefined) || new Date().toISOString();

    const inMemoryAttempt: ExamAttempt = {
      id: attemptId,
      examId: exam.id,
      examTitle: exam.title,
      subjectName: exam.subjectName,
      studentId: currentUser.id,
      studentName: currentUser.name,
      studentNisn: currentUser.nip_nisn,
      studentClass: studentClass,
      answers: resumedAnswers,
      scores: {},
      totalScore: 0,
      maxPossibleScore: exam.questions.reduce((acc, q) => acc + q.points, 0) || 100,
      scorePercentage: 0,
      passedKkm: false,
      totalEarnedPoints: 0,
      totalMaxPoints: exam.questions.reduce((acc, q) => acc + q.points, 0) || 100,
      status: 'in_progress',
      violationCount: resumedViolations,
      startedAt: startedAt,
      remainingSeconds: resumedSeconds,
      violationLogs: [],
      isGraded: false,
    };

    // Perbarui draf simpanan di localStorage HP siswa dengan jawaban & sisa waktu terakhir
    const updatedProgress = {
      attemptId: attemptId,
      examId: exam.id,
      studentId: currentUser.id,
      questionsOrderIds: questionsOrder.map(q => q.id),
      answers: resumedAnswers,
      doubtQuestions: resumedDoubts,
      currentQuestionIndex: Math.min(resumedIndex, Math.max(0, questionsOrder.length - 1)),
      remainingSeconds: resumedSeconds,
      violationCount: 0,
      startedAt: startedAt,
      lastPulledFromDatabaseAt: new Date().toISOString(),
    };
    localStorage.setItem(localKey, JSON.stringify(updatedProgress));

    remainingSecondsRef.current = resumedSeconds;
    userAnswersRef.current = resumedAnswers;
    doubtQuestionsRef.current = resumedDoubts;

    // CATATAN: Tidak mengirim attempt in_progress ke Turso / App attempts agar tidak muncul di riwayat guru saat belum selesai
    setActiveExam({ ...exam, questions: questionsOrder });
    setCurrentAttempt(inMemoryAttempt);
    setUserAnswers(resumedAnswers);
    setDoubtQuestions(resumedDoubts);
    setRemainingSeconds(resumedSeconds);
    setViolationCount(resumedViolations);
    setCurrentQuestionIndex(Math.min(resumedIndex, Math.max(0, questionsOrder.length - 1)));
    isSubmittingRef.current = false;
    setIsSubmittingExam(false);
    setIsQuestionInfoOpen(false);
    setIsQuestionListOpen(true);

    // Request Fullscreen & Anti-dimming screen lock
    requestExamFullScreen();
    requestWakeLock();
  };

  // Screen Wake Lock API (Anti Layar Redup)
  const requestWakeLock = async () => {
    try {
      if ('wakeLock' in navigator) {
        wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
      }
    } catch (err) {
      console.warn('Wake Lock request ignored or unsupported:', err);
    }
  };

  // Fullscreen helper with aggressive status bar / navigation bar hide
  const requestExamFullScreen = () => {
    const docEl = document.documentElement as any;
    if (docEl.requestFullscreen) {
      docEl.requestFullscreen({ navigationUI: 'hide' }).catch(() => {
        docEl.requestFullscreen().catch(() => {});
      });
    }
  };

  // 2. Anti-Cheat Monitoring (Visibility Change, Tab Switch, Blur, Exit Fullscreen)
  useEffect(() => {
    if (!activeExam || !activeExam.lockdownBrowser || currentAttempt?.status !== 'in_progress' || submitPhase !== 'idle') {
      return;
    }

    const playViolationBeep = () => {
      try {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContext) return;
        
        const ctx = new AudioContext();
        let startTime = ctx.currentTime;
        
        // Bunyi alarm bip keras 4 kali selama 1.3 - 1.5 detik
        for (let i = 0; i < 4; i++) {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(880, startTime); // 880Hz alert frequency
          
          gain.gain.setValueAtTime(0.25, startTime);
          gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.25);
          
          osc.connect(gain);
          gain.connect(ctx.destination);
          
          osc.start(startTime);
          osc.stop(startTime + 0.25);
          
          startTime += 0.35;
        }
      } catch (e) {
        console.error('Audio beep failed', e);
      }
    };

    const recordViolation = (reason: string, playBeep = true) => {
      // Abaikan semua deteksi jika siswa sedang dalam proses submit jawaban atau pelanggaran sudah aktif
      if (isSubmittingRef.current) return;
      isSubmittingRef.current = true; // Kunci segera agar tidak terpicu event berulang

      if (playBeep) playViolationBeep();

      // Seketika catat pelanggaran dan tampilkan jendela modal peringatan
      setViolationCount(1);
      setViolationWarningModal(
        `UJIAN DIHENTIKAN OTOMATIS KARENA PELANGGARAN!\n\nTerdeteksi: ${reason}.\nSeluruh lembar jawaban Anda otomatis tersimpan dan telah dikirim ke database pengawas.\n\nSilakan segera lapor ke Pengawas/Guru di ruangan untuk meminta tombol "Lanjutkan Ujian" agar Anda dapat membuka kembali dan melanjutkan pengerjaan dengan jawaban yang telah tersimpan di database.`
      );

      // LANGSUNG kirim status pelanggaran ke database pengawas seketika (< 50ms) tanpa menunggu jeda
      handleFinishExam(true, reason);
    };

    const handleVisibilityChange = () => {
      if (isSubmittingRef.current) return;
      if (document.hidden) {
        setIsPrivacyBlackout(true);
        recordViolation('Meninggalkan tab ujian CBT atau menyembunyikan browser', true);
        // Otomatis logout sehingga saat siswa kembali ke browser harus login ulang + minta izin & token baru
        setTimeout(() => {
          onAutoLogout?.(
            'Ujian dihentikan & Anda otomatis logout karena menyembunyikan browser atau berpindah tab. Silakan login ulang dengan username & password dan hubungi pengawas.'
          );
        }, 120);
      }
    };

    const handleWindowBlur = () => {
      if (isSubmittingRef.current) return;
      setIsPrivacyBlackout(true);
      recordViolation('Kursor atau jendela fokus keluar dari aplikasi CBT', true);
    };

    const handleFullscreenChange = () => {
      const isCurrentlyFs = Boolean(document.fullscreenElement);
      setIsFullScreen(isCurrentlyFs);
      // Jika siswa sedang submit atau jeda pengiriman aktif, jangan anggap pelepasan fullscreen sebagai pelanggaran
      if (isSubmittingRef.current) return;
      if (!isCurrentlyFs && activeExam.lockdownBrowser) {
        recordViolation('Keluar dari mode Layar Penuh (Fullscreen)', true);
      }
    };

    // Keyboard protection (Copy, Print, Screenshot, DevTools, Refresh)
    const triggerScreenshotBlock = (reason: string) => {
      setIsPrivacyBlackout(true);
      try {
        window.getSelection()?.removeAllRanges();
        navigator.clipboard?.writeText?.('').catch(() => {});
      } catch (e) {}
      recordViolation(reason, true);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (isSubmittingRef.current) return;
      const lower = e.key.toLowerCase();

      // Screenshot / Snipping / Print / DevTools shortcuts
      if (
        e.key === 'PrintScreen' ||
        (e.metaKey && e.shiftKey && ['3', '4', '5', 's'].includes(lower)) ||
        (e.ctrlKey && e.shiftKey && ['i', 'j', 'c', 's'].includes(lower)) ||
        e.key === 'F12'
      ) {
        e.preventDefault();
        triggerScreenshotBlock('Terdeteksi percobaan mengambil tangkapan layar (Screenshot) atau membuka inspeksi');
        return;
      }

      if ((e.ctrlKey || e.metaKey) && ['c', 'x', 'v', 'u', 'p', 's', 'a', 'r'].includes(lower)) {
        e.preventDefault();
        if (lower === 'r') {
          recordViolation('Mencoba me-refresh halaman ujian menggunakan pintasan Ctrl+R', true);
        } else if (lower === 'p') {
          triggerScreenshotBlock('Mencoba mencetak / menyimpan halaman soal (Ctrl+P)');
        } else {
          recordViolation(`Menekan tombol pintasan keyboard terlarang (Ctrl+${e.key.toUpperCase()})`, true);
        }
        return;
      }

      if (e.key === 'F5') {
        e.preventDefault();
        recordViolation('Mencoba me-refresh halaman ujian menggunakan tombol F5', true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (isSubmittingRef.current) return;
      if (e.key === 'PrintScreen') {
        e.preventDefault();
        triggerScreenshotBlock('Terdeteksi menekan tombol PrintScreen (Screenshot)');
      }
    };

    // Blokir salin, potong, seleksi teks, dan drag gambar soal
    const handleCopyOrCut = (e: ClipboardEvent) => {
      if (isSubmittingRef.current) return;
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return;
      e.preventDefault();
      try {
        window.getSelection()?.removeAllRanges();
        e.clipboardData?.setData('text/plain', '');
      } catch (err) {}
    };

    const handleSelectOrDragStart = (e: Event) => {
      if (isSubmittingRef.current) return;
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return;
      e.preventDefault();
    };

    // Jika siswa memaksa klik tombol Refresh browser / menutup tab di tengah ujian lockdown:
    // Segera kunci secara lokal & kirim status violation_disqualified dengan keepalive agar tidak bisa lanjut setelah refresh!
    const handlePageHideOrUnload = () => {
      if (isSubmittingRef.current) return;
      isSubmittingRef.current = true;
      try {
        const localKey = getProgressStorageKey(currentUser.id, activeExam.id);
        const rawProgress = localStorage.getItem(localKey);
        const parsedProgress = rawProgress ? JSON.parse(rawProgress) : null;
        const latestAnswers = userAnswersRef.current || parsedProgress?.answers || currentAttempt.answers || {};
        const latestDoubts = doubtQuestionsRef.current || parsedProgress?.doubtQuestions || currentAttempt.doubtfulAnswers || {};
        const latestRemaining = remainingSecondsRef.current;

        // Pastikan sisa waktu tepat hingga detik terakhir ikut tersimpan di localStorage
        if (parsedProgress && typeof parsedProgress === 'object') {
          parsedProgress.answers = latestAnswers;
          parsedProgress.doubtQuestions = latestDoubts;
          parsedProgress.remainingSeconds = latestRemaining;
          parsedProgress.lastSavedAt = new Date().toISOString();
          localStorage.setItem(localKey, JSON.stringify(parsedProgress));
        }

        const lockAttempt: ExamAttempt = {
          ...currentAttempt,
          status: 'violation_disqualified',
          answers: latestAnswers,
          doubtfulAnswers: latestDoubts,
          remainingSeconds: latestRemaining,
          submittedAt: new Date().toISOString(),
          violationCount: Math.max(1, currentAttempt.violationCount || 0),
          violationLogs: [
            ...(currentAttempt.violationLogs || []),
            {
              timestamp: new Date().toISOString(),
              reason: 'Me-refresh atau menutup browser saat ujian berlangsung',
            },
          ],
          isGraded: true,
        };

        localStorage.setItem(
          getViolationLockKey(currentUser.id, activeExam.id),
          JSON.stringify({
            attemptId: lockAttempt.id,
            lockedAt: new Date().toISOString(),
            reason: 'Me-refresh atau menutup browser saat ujian berlangsung',
          })
        );
        localStorage.setItem(`cbt_pending_attempt_${lockAttempt.id}`, JSON.stringify(lockAttempt));

        const updatedLocalAttempts = [
          ...attempts.filter((a) => a.id !== lockAttempt.id),
          lockAttempt,
        ];
        saveAttempts(updatedLocalAttempts);

        tursoService.saveExamAttempt(lockAttempt, { keepalive: true });
      } catch (e) {}
    };

    // Context menu (Right click) protection
    const handleContextMenu = (e: MouseEvent) => {
      if (isSubmittingRef.current) return;
      e.preventDefault();
    };

    // Cegah gesture tarikan dari tepi paling atas atau paling bawah pada ponsel
    const handleTouchStart = (e: TouchEvent) => {
      if (isSubmittingRef.current) return;
      const touch = e.touches[0];
      if (!touch) return;
      if (touch.clientY <= 15 || touch.clientY >= window.innerHeight - 15) {
        if (e.cancelable) e.preventDefault();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    document.addEventListener('copy', handleCopyOrCut);
    document.addEventListener('cut', handleCopyOrCut);
    document.addEventListener('selectstart', handleSelectOrDragStart);
    document.addEventListener('dragstart', handleSelectOrDragStart);
    window.addEventListener('pagehide', handlePageHideOrUnload);
    window.addEventListener('beforeunload', handlePageHideOrUnload);
    window.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('touchstart', handleTouchStart, { passive: false });

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      document.removeEventListener('copy', handleCopyOrCut);
      document.removeEventListener('cut', handleCopyOrCut);
      document.removeEventListener('selectstart', handleSelectOrDragStart);
      document.removeEventListener('dragstart', handleSelectOrDragStart);
      window.removeEventListener('pagehide', handlePageHideOrUnload);
      window.removeEventListener('beforeunload', handlePageHideOrUnload);
      window.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('touchstart', handleTouchStart);
    };
  }, [activeExam, currentAttempt, submitPhase, onAutoLogout]);

  // 3. Countdown Timer & Minimum submit check (tidak ter-reset saat siswa klik jawaban)
  useEffect(() => {
    if (!activeExam || currentAttempt?.status !== 'in_progress') {
      return;
    }

    const timer = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          remainingSecondsRef.current = 0;
          saveActiveProgressToLocal({ remainingSeconds: 0 });
          clearInterval(timer);
          triggerSubmitExam();
          return 0;
        }
        const next = prev - 1;
        remainingSecondsRef.current = next;
        // Simpan sisa detik tepat setiap 1 detik ke localStorage agar kendala jaringan/browser tidak mengembalikan ke menit awal
        saveActiveProgressToLocal({ remainingSeconds: next });
        return next;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [activeExam?.id, currentAttempt?.id, currentAttempt?.status]);

  // 4. Update Answer for current question (Hanya disimpan di LocalStorage perangkat siswa)
  const handleAnswerSelect = (questionId: string, answer: any) => {
    setUserAnswers((prev) => {
      const updated = { ...prev, [questionId]: answer };
      userAnswersRef.current = updated;
      saveActiveProgressToLocal({
        answers: updated,
        currentQuestionIndex,
        remainingSeconds: remainingSecondsRef.current,
      });
      return updated;
    });

    if (currentAttempt) {
      setCurrentAttempt((prev) => (prev ? { ...prev, answers: { ...prev.answers, [questionId]: answer } } : null));
    }
  };

  // Toggle doubt flag (Tersimpan di LocalStorage)
  const handleToggleDoubt = (qId: string) => {
    setDoubtQuestions((prev) => {
      const updated = { ...prev, [qId]: !prev[qId] };
      doubtQuestionsRef.current = updated;
      saveActiveProgressToLocal({
        doubtQuestions: updated,
        remainingSeconds: remainingSecondsRef.current,
      });
      return updated;
    });
  };

  // 5. Submit Exam with Safe 1-2s Delay & Anti-Cheat Protection
  const triggerSubmitExam = async () => {
    if (isSubmittingRef.current) return;
    setIsSubmittingExam(true);
    await handleFinishExam(false);
  };

  // Calculate Score, Save to Turso & localStorage, and Show Submit Animation -> Result Window (Still Fullscreen)
  const handleFinishExam = async (isDisqualified = false, violationReason = '') => {
    if (!activeExam || !currentAttempt) return;

    const finishedExam = activeExam;

    // Pastikan flag submitting aktif agar event fullscreenchange/blur tidak memicu pelanggaran palsu
    isSubmittingRef.current = true;
    if (isDisqualified) {
      // Pada pelanggaran, keluar dari fullscreen dan tampilkan modal pelanggaran di beranda siswa
      try {
        if (wakeLockRef.current) {
          wakeLockRef.current.release?.().catch(() => {});
        }
        if (document.fullscreenElement && document.exitFullscreen) {
          document.exitFullscreen().catch(() => {});
        }
      } catch (e) {}
    }

    let earnedPoints = 0;
    const totalMaxPoints = activeExam.questions.reduce((acc, q) => acc + (q.points || 0), 0) || 100;

    // Automatic grading for supported question types
    activeExam.questions.forEach((q) => {
      const studentAns = userAnswers[q.id];
      if (!studentAns) return;

      if (q.type === 'pilihan_ganda') {
        const sAns = String(studentAns).trim();
        const cAns = String(q.correctAnswer || '').trim();
        const sLetter = sAns.match(/^[A-Ea-e]/)?.[0]?.toUpperCase();
        const cLetter = cAns.match(/^[A-Ea-e]/)?.[0]?.toUpperCase();
        if (sAns === cAns || (sLetter && cLetter && sLetter === cLetter) || (cAns && (sAns.startsWith(cAns) || cAns.startsWith(sAns)))) {
          earnedPoints += q.points;
        }
      } else if (q.type === 'pilihan_ganda_kompleks') {
        if (Array.isArray(studentAns) && Array.isArray(q.correctAnswers)) {
          const matched = studentAns.filter((a) => q.correctAnswers?.includes(a)).length;
          const fraction = matched / q.correctAnswers.length;
          earnedPoints += Math.round(q.points * fraction);
        }
      } else if (q.type === 'isian') {
        if (
          String(studentAns).trim().toLowerCase() ===
          String(q.correctAnswer).trim().toLowerCase()
        ) {
          earnedPoints += q.points;
        }
      } else if (q.type === 'benar_salah') {
        if (q.trueFalseStatements && typeof studentAns === 'object') {
          let correctCount = 0;
          q.trueFalseStatements.forEach((stmt, idx) => {
            if (studentAns[idx] === stmt.answer) {
              correctCount++;
            }
          });
          const fraction = correctCount / q.trueFalseStatements.length;
          earnedPoints += Math.round(q.points * fraction);
        }
      } else if (q.type === 'menjodohkan') {
        if (q.matchingPairs && typeof studentAns === 'object') {
          let correctCount = 0;
          q.matchingPairs.forEach((pair) => {
            const userAns = studentAns[pair.premise];
            if (Array.isArray(userAns)) {
              if (userAns.includes(pair.match)) correctCount++;
            } else {
              if (userAns === pair.match) correctCount++;
            }
          });
          const fraction = correctCount / q.matchingPairs.length;
          earnedPoints += Math.round(q.points * fraction);
        }
      } else if (q.type === 'essay') {
        // Default partial credit for submitted essays until teacher manual rubric review
        if (String(studentAns).trim().length > 10) {
          earnedPoints += Math.round(q.points * 0.8);
        }
      } else if (q.type === 'isi_kosong') {
        if (q.fillInTheBlanks && Array.isArray(studentAns)) {
          let correctCount = 0;
          q.fillInTheBlanks.forEach((ans, idx) => {
            if (String(studentAns[idx]).toLowerCase().trim() === String(ans).toLowerCase().trim()) correctCount++;
          });
          const fraction = correctCount / q.fillInTheBlanks.length;
          earnedPoints += Math.round(q.points * fraction);
        }
      } else if (q.type === 'susun_kata') {
        if (q.correctOrder && Array.isArray(studentAns)) {
          let correctCount = 0;
          q.correctOrder.forEach((word, idx) => {
            if (studentAns[idx] === word) correctCount++;
          });
          const fraction = correctCount / q.correctOrder.length;
          earnedPoints += Math.round(q.points * fraction);
        }
      }
    });

    const scorePercentage = Math.min(100, Math.round((earnedPoints / totalMaxPoints) * 100));

    const calculatedViolationLogs = isDisqualified
      ? [
          ...(currentAttempt?.violationLogs || []),
          {
            timestamp: new Date().toISOString(),
            reason: violationReason || 'Pelanggaran terdeteksi oleh sistem pengawas CBT',
          },
        ]
      : (currentAttempt?.violationLogs || []);

    const finalAttempt: ExamAttempt = {
      ...currentAttempt,
      id: currentAttempt?.id || 'att_' + Date.now(),
      examId: activeExam.id,
      examTitle: activeExam.title,
      subjectName: activeExam.subjectName,
      studentId: currentUser.id,
      studentName: currentUser.name,
      studentNisn: currentUser.nip_nisn || '',
      studentClass: studentClass || currentUser.classGrade || '',
      status: isDisqualified ? 'violation_disqualified' : 'submitted',
      answers: userAnswers || {},
      doubtfulAnswers: doubtQuestions || {},
      scores: {},
      startedAt: currentAttempt?.startedAt || new Date().toISOString(),
      submittedAt: new Date().toISOString(),
      remainingSeconds: remainingSecondsRef.current,
      scorePercentage: Number.isFinite(scorePercentage) ? scorePercentage : 0,
      totalScore: Number.isFinite(earnedPoints) ? earnedPoints : 0,
      maxPossibleScore: Number.isFinite(totalMaxPoints) ? totalMaxPoints : 100,
      totalEarnedPoints: Number.isFinite(earnedPoints) ? earnedPoints : 0,
      totalMaxPoints: Number.isFinite(totalMaxPoints) ? totalMaxPoints : 100,
      passedKkm: scorePercentage >= activeExam.kkm,
      violationCount: isDisqualified ? Math.max(1, violationCount) : violationCount,
      violationLogs: calculatedViolationLogs,
      isGraded: true,
    };

    // Bersihkan seluruh attempt in_progress untuk siswa dan ujian ini agar status final submitted menang mutlak
    const filteredAttempts = attempts.filter(
      (a) =>
        !(
          a.examId === activeExam.id &&
          a.studentId === currentUser.id &&
          a.status === 'in_progress'
        ) && a.id !== finalAttempt.id
    );
    const updatedAttempts = [...filteredAttempts, finalAttempt];

    // 1. Simpan segera ke localStorage riwayat attempts dan perbarui state React App seketika tanpa jeda
    saveAttempts(updatedAttempts);
    onUpdateAttempts(updatedAttempts);

    // 2. Simpan permanen ke storage lokal bahwa siswa sudah menyelesaikan ujian ini atau terkunci pelanggaran
    if (!isDisqualified) {
      try {
        localStorage.setItem(
          `cbt_finished_${currentUser.id}_${activeExam.id}`,
          JSON.stringify(finalAttempt)
        );
        localStorage.removeItem(getProgressStorageKey(currentUser.id, activeExam.id));
        localStorage.removeItem(getViolationLockKey(currentUser.id, activeExam.id));
      } catch (e) {}
    } else {
      saveActiveProgressToLocal({
        answers: userAnswers,
        doubtQuestions,
        currentQuestionIndex,
        remainingSeconds: remainingSecondsRef.current,
        violationCount: Math.max(1, violationCount),
      });
      // Kunci permanen di perangkat agar refresh browser tidak membuka soal kembali
      try {
        localStorage.setItem(
          getViolationLockKey(currentUser.id, activeExam.id),
          JSON.stringify({
            attemptId: finalAttempt.id,
            lockedAt: new Date().toISOString(),
            reason: violationReason || 'Pelanggaran terdeteksi oleh sistem pengawas CBT',
          })
        );
      } catch (e) {}
    }

    // 2b. Simpan ke antrean sinkronisasi pending SECARA SINKRON SEBELUM MENCOBA JARINGAN!
    // Ini menjamin 100%: jika browser di-refresh, ditutup, atau wifi lambat seketika saat submit/pelanggaran,
    // data attempt SUDAH TERSIMPAN di storage lokal dan otomatis di-flush ke Turso saat reload atau online!
    try {
      localStorage.setItem(
        `cbt_pending_attempt_${finalAttempt.id}`,
        JSON.stringify(finalAttempt)
      );
    } catch (e) {}

    // 3. Jika dihentikan karena pelanggaran: langsung kunci & kirim ke DB segera dengan keepalive (tanpa jitter)
    if (isDisqualified) {
      setActiveExam(null);
      setCurrentAttempt(finalAttempt);
      setIsSubmitConfirmOpen(false);
      setIsSubmittingExam(false);
      setIsSavingExam(false);
      setSubmitPhase('idle');

      setTimeout(() => {
        isSubmittingRef.current = false;
      }, 2500);

      (async () => {
        try {
          let success = await tursoService.saveExamAttempt(finalAttempt, { keepalive: true });
          if (!success) {
            await new Promise((res) => setTimeout(res, 800));
            success = await tursoService.saveExamAttempt(finalAttempt, { keepalive: true });
          }
          if (success) {
            try {
              localStorage.removeItem(`cbt_pending_attempt_${finalAttempt.id}`);
            } catch (e) {}
          }
        } catch (err) {
          console.warn('Latar belakang: Gagal menyimpan pelanggaran ke Turso:', err);
        }
      })();
      return;
    }

    // 4. Untuk submit normal: TETAP DI MODE FULLSCREEN!
    // Tampilkan animasi "Mengirim jawaban" -> "Jawaban terkirim" -> Jendela Hasil Nilai Siswa + Tombol OK (Logout)
    setCurrentAttempt(finalAttempt);
    setIsSubmitConfirmOpen(false);
    setIsSubmittingExam(false);
    setIsSavingExam(false);
    setExamResultData({ exam: finishedExam, attempt: finalAttempt, syncedToServer: false });
    setSubmitPhase('sending');

    const startedSendingAt = Date.now();
    let syncSuccess = false;

    try {
      // Sebar koneksi bersamaan dengan jitter acak ringan (0 - 500ms)
      const jitter = Math.floor(Math.random() * 500);
      await new Promise((res) => setTimeout(res, jitter));

      syncSuccess = await tursoService.saveExamAttempt(finalAttempt);
      if (!syncSuccess) {
        await new Promise((res) => setTimeout(res, 900));
        syncSuccess = await tursoService.saveExamAttempt(finalAttempt);
      }

      if (syncSuccess) {
        try {
          localStorage.removeItem(`cbt_pending_attempt_${finalAttempt.id}`);
        } catch (e) {}
      }

      // Bersihkan attempt in_progress lama dari Turso jika ada ID berbeda
      const staleInProgress = attempts.filter(
        (a) =>
          a.examId === finishedExam.id &&
          a.studentId === currentUser.id &&
          a.status === 'in_progress' &&
          a.id !== finalAttempt.id
      );
      for (const stale of staleInProgress) {
        await tursoService.deleteExamAttempt(stale.id);
      }
    } catch (err) {
      console.warn('Gagal mengirim attempt ke Turso:', err);
      syncSuccess = false;
    }

    // Pastikan animasi loading "Mengirim jawaban" terlihat minimal 600ms agar tidak berkedip terlalu cepat
    const elapsed = Date.now() - startedSendingAt;
    if (elapsed < 600) {
      await new Promise((res) => setTimeout(res, 600 - elapsed));
    }

    setExamResultData({ exam: finishedExam, attempt: finalAttempt, syncedToServer: syncSuccess });
    setSubmitPhase('sent');

    // Tampilkan animasi centang "Jawaban terkirim" selama ~1.2 detik sebelum memunculkan jendela hasil nilai
    await new Promise((res) => setTimeout(res, 1200));
    setSubmitPhase('result');

    if (scorePercentage >= finishedExam.kkm) {
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
      });
    }
  };

  // Handler tombol OK pada Jendela Hasil Nilai Siswa -> Keluar Fullscreen & Otomatis Logout ke Halaman Login
  const handleResultOkLogout = async () => {
    try {
      if (wakeLockRef.current) {
        wakeLockRef.current.release?.().catch(() => {});
      }
      if (document.fullscreenElement && document.exitFullscreen) {
        await document.exitFullscreen().catch(() => {});
      }
    } catch (e) {}

    isSubmittingRef.current = false;
    setSubmitPhase('idle');
    setExamResultData(null);
    setActiveExam(null);
    setCurrentAttempt(null);
    onExamActiveChange?.(false);

    if (onLogout) {
      onLogout();
    }
  };

  // Helper time format
  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Check minimum submit time requirement (berdasarkan waktu pengerjaan berjalan dari total durasi - sisa waktu)
  const minSubmitSeconds = Math.max(0, (Number(activeExam?.minSubmitMinutes) || 0) * 60);
  const totalExamDurationSeconds = Math.max(60, (Number(activeExam?.durationMinutes) || 60) * 60);
  const elapsedSeconds = Math.max(0, totalExamDurationSeconds - remainingSeconds);
  const canSubmitNow = elapsedSeconds >= minSubmitSeconds;
  const remainingSecondsUntilSubmitAllowed = Math.max(0, minSubmitSeconds - elapsedSeconds);

  // If student is NOT in exam room: Show Student Dashboard
  if (!activeExam) {
    const finishedStorageAttempts: ExamAttempt[] = [];
    exams.forEach((ex) => {
      try {
        const finishedRaw = localStorage.getItem(`cbt_finished_${currentUser.id}_${ex.id}`);
        if (finishedRaw) {
          const parsed: ExamAttempt = JSON.parse(finishedRaw);
          finishedStorageAttempts.push(parsed);
        }
      } catch (e) {}
    });

    // Peta attempt siswa dengan jaminan: simpanan ujian selesai permanen (cbt_finished_) selalu masuk ke riwayat
    const attemptMap = new Map<string, ExamAttempt>();
    attempts.forEach((a) => {
      if (a.studentId === currentUser.id) {
        attemptMap.set(a.id, a);
      }
    });

    finishedStorageAttempts.forEach((f) => {
      const existing = attemptMap.get(f.id);
      if (!existing || existing.status !== 'submitted') {
        attemptMap.set(f.id, f);
      }
    });

    const riwayatAttempts = Array.from(attemptMap.values())
      .filter((a) => a.status !== 'in_progress')
      .sort((a, b) => new Date(b.submittedAt || b.startedAt).getTime() - new Date(a.submittedAt || a.startedAt).getTime());

    return (
      <div id="siswa-panel-layout" className="flex h-[calc(100vh-64px)] overflow-hidden bg-slate-50">
        {/* Mobile Drawer Overlay */}
        {isSidebarOpen && (
          <div
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-slate-950/60 z-40 backdrop-blur-xs transition-opacity"
          />
        )}

        {/* Sidebar */}
        <aside
          className={`fixed top-16 bottom-0 left-0 z-50 bg-white border-r border-slate-200 w-64 transform transition-transform duration-300 ease-in-out flex flex-col ${
            isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <span className="font-bold text-slate-800">Menu Siswa</span>
            <button onClick={() => setIsSidebarOpen(false)} className="p-1 text-slate-500 hover:bg-slate-100 rounded-lg cursor-pointer">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            <button
              onClick={() => { setActiveTab('dashboard'); setIsSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition ${
                activeTab === 'dashboard'
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <LayoutDashboard className="w-5 h-5" />
              <span>Dashboard Ujian</span>
            </button>
            <button
              onClick={() => { setActiveTab('riwayat'); setIsSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition ${
                activeTab === 'riwayat'
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <History className="w-5 h-5" />
              <span>Riwayat Ujian</span>
            </button>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto relative">
          {/* Header for Sidebar Toggle */}
          <div className="bg-white border-b border-slate-200 px-4 py-3 flex items-center shadow-sm z-10 sticky top-0">
            <button onClick={() => setIsSidebarOpen(true)} className="p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer">
              <Menu className="w-5 h-5" />
            </button>
            <span className="ml-2 font-bold text-slate-800">Panel Siswa</span>
          </div>

          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
            {activeTab === 'dashboard' && (
              <div className="space-y-6">
                {/* Welcome Card */}
                <div className="bg-gradient-to-r from-slate-900 to-indigo-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                  <div>
                    <span className="px-3 py-1 bg-white/20 backdrop-blur-xs rounded-full text-xs font-bold uppercase tracking-wider">
                      Ruang Asesmen Siswa SMP
                    </span>
                    <h1 className="text-2xl sm:text-3xl font-black mt-2">
                      Halo, {currentUser.name}!
                    </h1>
                    <div className="text-emerald-100 text-sm mt-1 flex flex-col gap-0.5">
                      <span>NISN: <strong className="font-mono text-white">{currentUser.nip_nisn}</strong></span>
                      <span>Kelas: <strong>{studentClass}</strong></span>
                    </div>
                  </div>

                  <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 flex items-center gap-4">
                    <Award className="w-10 h-10 text-amber-300" />
                    <div>
                      <span className="text-xs text-emerald-100 block">Status Siswa:</span>
                      <strong className="text-sm font-bold">Siap Mengikuti Ujian CBT</strong>
                    </div>
                  </div>
                </div>

                {/* List of Available Exams */}
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-extrabold text-slate-900">
                        Daftar Ujian
                      </h2>
                      <p className="text-xs text-slate-500">
                        Pilih mata pelajaran yang dijadwalkan, lalu klik Mulai Kerjakan Ujian.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-6">
                    {myExams.map((exam) => {
                      // Cari seluruh percobaan ujian siswa untuk mata pelajaran ini
                      const studentExamAttempts = attempts.filter(
                        (a) => a.examId === exam.id && a.studentId === currentUser.id
                      );

                      // Cari attempt yang sudah diserahkan (submitted) dari props attempts DAN storage lokal permanen
                      const submittedFromStorage: ExamAttempt[] = [];
                      try {
                        const finishedRaw = localStorage.getItem(`cbt_finished_${currentUser.id}_${exam.id}`);
                        if (finishedRaw) {
                          const parsedFinished: ExamAttempt = JSON.parse(finishedRaw);
                          submittedFromStorage.push(parsedFinished);
                        }
                      } catch (e) {}

                      const submittedAttempts = [
                        ...studentExamAttempts.filter((a) => a.status === 'submitted'),
                        ...submittedFromStorage.filter(
                          (sf) => !studentExamAttempts.some((sa) => sa.id === sf.id && sa.status === 'submitted')
                        ),
                      ];

                      const latestSubmitted = [...submittedAttempts].sort(
                        (a, b) => new Date(b.submittedAt || b.startedAt).getTime() - new Date(a.submittedAt || a.startedAt).getTime()
                      )[0];

                      // Cari attempt yang terkena pelanggaran
                      const disqualifiedAttempts = studentExamAttempts.filter((a) => a.status === 'violation_disqualified');
                      const latestDisqualified = [...disqualifiedAttempts].sort(
                        (a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
                      )[0];

                      // Cari attempt in_progress (hanya jika dimulai SETELAH submit terakhir dan tidak punya antrean pelanggaran tertunda)
                      const inProgressAttempt = studentExamAttempts.find((a) => {
                        if (a.status !== 'in_progress') return false;
                        try {
                          if (localStorage.getItem(`cbt_pending_attempt_${a.id}`)) return false;
                        } catch (e) {}
                        if (!latestSubmitted) return true;
                        // Hanya anggap in_progress valid jika dimulai SETELAH submit terakhir (misal remedial aktif)
                        return new Date(a.startedAt).getTime() > new Date(latestSubmitted.submittedAt || latestSubmitted.startedAt).getTime();
                      });

                      const hasLocalProgress = !latestSubmitted && Boolean(localStorage.getItem(getProgressStorageKey(currentUser.id, exam.id)));
                      let hasLocalViolationLock = false;
                      try {
                        hasLocalViolationLock = Boolean(localStorage.getItem(getViolationLockKey(currentUser.id, exam.id)));
                      } catch (e) {}

                      // Jika siswa sudah submit: UJIAN SELESAI MUTLAK!
                      const isFinished = Boolean(latestSubmitted);
                      const isResumedByTeacher = !isFinished && Boolean(inProgressAttempt);
                      const isDisqualified = !isFinished && !isResumedByTeacher && (Boolean(latestDisqualified) || hasLocalViolationLock);
                      const canResume = !isFinished && !isDisqualified && (isResumedByTeacher || hasLocalProgress);

                      const displayScore = latestSubmitted?.scorePercentage ?? latestSubmitted?.totalScore ?? 0;
                      const isPassed = displayScore >= exam.kkm;

                      const subjectColors = [
                        { card: 'bg-indigo-50 border-indigo-200 hover:border-indigo-300 ring-indigo-100', badge: 'bg-indigo-100 text-indigo-700 border-indigo-200', btnStart: 'bg-indigo-600 hover:bg-indigo-700', btnCont: 'bg-amber-500 hover:bg-amber-600' },
                        { card: 'bg-emerald-50 border-emerald-200 hover:border-emerald-300 ring-emerald-100', badge: 'bg-emerald-100 text-emerald-700 border-emerald-200', btnStart: 'bg-emerald-600 hover:bg-emerald-700', btnCont: 'bg-amber-500 hover:bg-amber-600' },
                        { card: 'bg-amber-50 border-amber-200 hover:border-amber-300 ring-amber-100', badge: 'bg-amber-100 text-amber-800 border-amber-200', btnStart: 'bg-amber-600 hover:bg-amber-700', btnCont: 'bg-orange-500 hover:bg-orange-600' },
                        { card: 'bg-rose-50 border-rose-200 hover:border-rose-300 ring-rose-100', badge: 'bg-rose-100 text-rose-700 border-rose-200', btnStart: 'bg-rose-600 hover:bg-rose-700', btnCont: 'bg-amber-500 hover:bg-amber-600' },
                        { card: 'bg-cyan-50 border-cyan-200 hover:border-cyan-300 ring-cyan-100', badge: 'bg-cyan-100 text-cyan-700 border-cyan-200', btnStart: 'bg-cyan-600 hover:bg-cyan-700', btnCont: 'bg-amber-500 hover:bg-amber-600' },
                        { card: 'bg-violet-50 border-violet-200 hover:border-violet-300 ring-violet-100', badge: 'bg-violet-100 text-violet-700 border-violet-200', btnStart: 'bg-violet-600 hover:bg-violet-700', btnCont: 'bg-amber-500 hover:bg-amber-600' },
                      ];
                      let hash = 0;
                      for (let i = 0; i < exam.subjectName.length; i++) hash += exam.subjectName.charCodeAt(i);
                      const theme = subjectColors[hash % subjectColors.length];

                      return (
                        <div
                          key={exam.id}
                          className={`rounded-2xl border p-6 shadow-2xs hover:shadow-md hover:ring-4 transition flex flex-col justify-between ${theme.card}`}
                        >
                          <div>
                            <div className="flex items-center justify-between mb-3">
                              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${theme.badge}`}>
                                {exam.subjectName}
                              </span>
                              {isFinished ? (
                                <span
                                  className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                                    isPassed ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                                  }`}
                                >
                                  {isPassed ? 'TUNTAS KKM' : 'REMEDIAL'}
                                </span>
                              ) : isDisqualified ? (
                                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-300 flex items-center gap-1">
                                  <ShieldAlert className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                                  <span>Terkunci (Pelanggaran)</span>
                                </span>
                              ) : isResumedByTeacher ? (
                                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1 animate-pulse">
                                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                  <span>Izin Guru Aktif</span>
                                </span>
                              ) : canResume ? (
                                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                                  Dapat Dilanjutkan
                                </span>
                              ) : (
                                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                                  Siap Dikerjakan
                                </span>
                              )}
                            </div>

                            <h3 className="font-extrabold text-base text-slate-900 mb-2">{exam.title}</h3>
                            <div className="text-xs text-slate-500 mb-4 flex flex-col gap-0.5">
                              <span>Guru: <strong className="font-medium text-slate-700">{exam.teacherName}</strong></span>
                              <span>Total: <strong className="font-medium text-slate-700">{exam.questions.length} Soal</strong></span>
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-xs bg-white/60 p-3 rounded-xl mb-4">
                              <div>
                                <span className="text-slate-400 block text-[10px]">Durasi:</span>
                                <strong className="text-slate-800">{exam.durationMinutes} Menit</strong>
                              </div>
                              <div>
                                <span className="text-slate-400 block text-[10px]">Nilai KKM:</span>
                                <strong className="text-slate-800">{exam.kkm}</strong>
                              </div>
                              <div>
                                <span className="text-slate-400 block text-[10px]">Min. Submit:</span>
                                <strong className="text-slate-800">{exam.minSubmitMinutes} Menit</strong>
                              </div>
                              <div>
                                <span className="text-slate-400 block text-[10px]">Proteksi:</span>
                                <strong className="text-emerald-700">Lockdown Aktif</strong>
                              </div>
                            </div>

                            {/* If disqualified because of violation */}
                            {isDisqualified && (
                              <div className="p-3 bg-rose-50 rounded-xl border border-rose-200 mb-4 text-xs">
                                <span className="font-bold text-rose-800 block mb-1">
                                  Ujian Dihentikan (Pelanggaran)
                                </span>
                                <p className="text-[11px] text-rose-700 leading-relaxed">
                                  Sesi ini otomatis dihentikan karena terdeteksi pelanggaran. Lapor ke Pengawas/Guru di ruangan untuk meminta tombol <strong>Reset</strong> pada tabel pemantauan agar dapat membuka dan melanjutkan pengerjaan kembali.
                                </p>
                              </div>
                            )}

                            {/* If finished: show score and review */}
                            {isFinished && (
                              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 mb-4 text-xs">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-emerald-800 font-semibold">Hasil Nilai Ujian:</span>
                                  <strong className="text-lg font-black text-emerald-900">
                                    {exam.releaseScore ? `${displayScore ?? '-'}` : 'Tersimpan'}
                                  </strong>
                                </div>
                                {exam.releaseScore ? (
                                  <span className="text-[11px] text-emerald-700">
                                    {isPassed
                                      ? 'Selamat! Nilai Anda memenuhi batas KKM sekolah.'
                                      : 'Nilai di bawah KKM. Silakan hubungi guru mata pelajaran.'}
                                  </span>
                                ) : (
                                  <span className="text-[11px] text-slate-500">
                                    Nilai resmi disimpan guru & akan diumumkan sesuai jadwal.
                                  </span>
                                )}
                              </div>
                            )}
                          </div>

                          <div className="pt-3 border-t border-slate-100 mt-4">
                            {isFinished ? (
                              <div className="flex flex-col sm:flex-row items-center gap-2">
                                {exam.allowRetake && !isPassed ? (
                                  <button
                                    onClick={() => handleStartExam(exam)}
                                    className="w-full sm:w-auto py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1 transition cursor-pointer"
                                  >
                                    <RotateCcw className="w-3.5 h-3.5" />
                                    <span>Remedial</span>
                                  </button>
                                ) : (
                                  <div className="w-full sm:w-auto py-2.5 px-4 bg-slate-100 text-slate-500 rounded-xl font-bold text-xs flex items-center justify-center gap-1">
                                    <CheckCircle className="w-3.5 h-3.5" />
                                    <span>Ujian Telah Selesai</span>
                                  </div>
                                )}
                              </div>
                            ) : isDisqualified ? (
                              <div className="flex flex-col gap-2 w-full">
                                <button
                                  type="button"
                                  onClick={() => handleCheckTeacherPermission(exam)}
                                  disabled={isCheckingPermission}
                                  className="w-full py-2.5 px-4 bg-rose-100 hover:bg-rose-200 text-rose-800 font-bold text-xs rounded-xl flex items-center justify-center gap-2 border border-rose-300 transition cursor-pointer"
                                  title="Klik untuk meminta / mengecek apakah Guru sudah membuka kunci ujian"
                                >
                                  {isCheckingPermission ? (
                                    <Loader2 className="w-4 h-4 animate-spin text-rose-700 shrink-0" />
                                  ) : (
                                    <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
                                  )}
                                  <span className="truncate">Terkunci (Minta Izin Guru)</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleCheckTeacherPermission(exam)}
                                  disabled={isCheckingPermission}
                                  className="w-full py-2 px-3 bg-white hover:bg-slate-100 text-slate-800 font-extrabold text-[11px] rounded-xl flex items-center justify-center gap-1.5 border border-slate-300 transition cursor-pointer shadow-xs"
                                >
                                  <RotateCcw className={`w-3.5 h-3.5 text-blue-600 ${isCheckingPermission ? 'animate-spin' : ''}`} />
                                  <span>{isCheckingPermission ? 'Sedang Memeriksa Izin...' : 'Cek Status Izin Sekarang'}</span>
                                </button>
                              </div>
                            ) : canResume ? (
                              <button
                                id={`btn-start-exam-${exam.id}`}
                                onClick={() => handleStartExam(exam)}
                                className={`w-full py-2.5 px-4 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-xs transition cursor-pointer ${
                                  isResumedByTeacher ? 'bg-emerald-600 hover:bg-emerald-700 ring-2 ring-emerald-300 animate-pulse' : theme.btnCont
                                }`}
                              >
                                <Play className="w-4 h-4 shrink-0" />
                                <span className="truncate">
                                  {isResumedByTeacher ? 'Lanjutkan Ujian (Izin Guru Aktif)' : 'Lanjutkan Pengerjaan'}
                                </span>
                                <ArrowRight className="w-3.5 h-3.5 shrink-0" />
                              </button>
                            ) : (
                              <button
                                id={`btn-start-exam-${exam.id}`}
                                onClick={() => handleStartExam(exam)}
                                className={`w-full py-2.5 px-4 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-xs transition cursor-pointer ${theme.btnStart}`}
                              >
                                <Play className="w-4 h-4 shrink-0" />
                                <span className="truncate">Mulai Kerjakan Ujian</span>
                                <ArrowRight className="w-3.5 h-3.5 shrink-0" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'riwayat' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-extrabold text-slate-900">Riwayat Ujian Saya</h2>
                    <p className="text-xs text-slate-500">
                      Daftar ujian dan asesmen yang telah selesai Anda kerjakan.
                    </p>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
                  {riwayatAttempts.length === 0 ? (
                    <div className="p-8 text-center text-slate-500 text-sm">
                      Belum ada riwayat ujian yang diselesaikan.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 text-xs uppercase font-extrabold">
                          <tr>
                            <th className="py-3 px-4">Nama Ujian</th>
                            <th className="py-3 px-4">Mata Pelajaran</th>
                            <th className="py-3 px-4">Waktu Selesai</th>
                            <th className="py-3 px-4 text-center">Nilai</th>
                            <th className="py-3 px-4 text-center">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700">
                          {riwayatAttempts.map((attempt) => {
                            const exam = exams.find((e) => e.id === attempt.examId);
                            const kkm = exam?.kkm || 75;
                            const isPassed = (attempt.scorePercentage || 0) >= kkm;
                            const isScoreReleased = exam?.releaseScore !== false;
                            const isDisqualified = attempt.status === 'violation_disqualified';
                            
                            return (
                              <tr key={attempt.id} className="hover:bg-slate-50 transition">
                                <td className="py-3 px-4 font-bold text-slate-900">{attempt.examTitle}</td>
                                <td className="py-3 px-4">
                                  <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-semibold text-xs border border-indigo-100">
                                    {attempt.subjectName}
                                  </span>
                                </td>
                                <td className="py-3 px-4 text-xs">
                                  {attempt.submittedAt ? new Date(attempt.submittedAt).toLocaleString('id-ID') : '-'}
                                </td>
                                <td className="py-3 px-4 text-center font-bold">
                                  {isScoreReleased ? attempt.scorePercentage : '-'}
                                </td>
                                <td className="py-3 px-4 text-center">
                                  {isDisqualified ? (
                                    <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-rose-100 text-rose-800 border border-rose-300">
                                      PELANGGARAN
                                    </span>
                                  ) : (
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                      isScoreReleased
                                        ? isPassed
                                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                                        : 'bg-slate-100 text-slate-600 border border-slate-200'
                                    }`}>
                                      {isScoreReleased ? (isPassed ? 'TUNTAS' : 'REMEDIAL') : 'TERSIMPAN'}
                                    </span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}
          </main>
        </div>

        {/* MODAL PELANGGARAN KECURANGAN PADA BERANDA PANEL SISWA */}
        {violationWarningModal && (() => {
          const hasResumedExam = myExams.find((ex) =>
            attempts.some(
              (a) => a.examId === ex.id && a.studentId === currentUser.id && a.status === 'in_progress'
            )
          );

          return (
            <div className="fixed inset-0 z-50 bg-slate-900/85 backdrop-blur-md flex items-center justify-center p-4">
              <div
                className={`bg-white rounded-3xl max-w-md w-full p-6 text-center shadow-2xl border-4 transition-all duration-300 ${
                  hasResumedExam ? 'border-emerald-500 animate-in fade-in zoom-in' : 'border-rose-500 animate-in fade-in zoom-in'
                }`}
              >
                {hasResumedExam ? (
                  <>
                    <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4 animate-bounce">
                      <ShieldCheck className="w-9 h-9" />
                    </div>
                    <h3 className="text-xl font-black text-slate-900 mb-2">
                      IZIN TELAH DIBERIKAN!
                    </h3>
                    <p className="text-xs text-emerald-800 font-bold whitespace-pre-line leading-relaxed mb-4 bg-emerald-50 p-3.5 rounded-xl border border-emerald-200 text-left">
                      Pengawas telah mengizinkan Anda untuk melanjutkan ujian "{hasResumedExam.title}". Seluruh lembar jawaban Anda sebelumnya tersimpan aman di database.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setViolationWarningModal(null);
                        handleStartExam(hasResumedExam);
                      }}
                      className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-extrabold text-xs shadow-md transition cursor-pointer flex items-center justify-center gap-2"
                    >
                      <Play className="w-4 h-4" />
                      <span>Masuk & Lanjutkan Ujian Sekarang</span>
                    </button>
                  </>
                ) : (
                  <>
                    <div className="w-16 h-16 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4 animate-bounce">
                      <ShieldAlert className="w-9 h-9" />
                    </div>

                    <h3 className="text-xl font-black text-slate-900 mb-2">
                      UJIAN DIHENTIKAN OTOMATIS!
                    </h3>

                    <p className="text-xs text-rose-700 font-bold whitespace-pre-line leading-relaxed mb-4 bg-rose-50 p-3.5 rounded-xl border border-rose-200 text-left">
                      {violationWarningModal}
                    </p>

                    <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-900 text-left mb-6 space-y-1">
                      <strong className="block font-bold text-amber-950">
                        Pemberitahuan untuk Siswa:
                      </strong>
                      <span>
                        Apabila pelanggaran ini terjadi tanpa sengaja (misalnya popup atau kendala browser HP), segera lapor ke Pengawas/Guru di ruangan ujian agar tombol <strong>"Lanjutkan"</strong> diklik.
                      </span>
                    </div>

                    <div className="flex flex-col gap-2">
                      <button
                        type="button"
                        onClick={() => handleCheckTeacherPermission()}
                        disabled={isCheckingPermission}
                        className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-extrabold text-xs shadow-md transition cursor-pointer flex items-center justify-center gap-2"
                      >
                        <RotateCcw className={`w-4 h-4 ${isCheckingPermission ? 'animate-spin' : ''}`} />
                        <span>{isCheckingPermission ? 'Sedang Memeriksa Izin...' : 'Cek Status Izin Sekarang'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setViolationWarningModal(null)}
                        className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs transition cursor-pointer"
                      >
                        Tutup & Kembali ke Beranda Siswa
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          );
        })()}
        {/* MODAL VERIFIKASI TOKEN UJIAN */}
        {pendingTokenExam && (
          <div className="fixed inset-0 z-50 bg-slate-900/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                    <Key className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900">
                      Masukkan Token Ujian
                    </h3>
                    <p className="text-xs text-slate-500 font-medium">
                      {pendingTokenExam.subjectName}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setPendingTokenExam(null);
                    setTokenInput('');
                    setTokenError('');
                  }}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-600 mb-4 space-y-1">
                <p className="font-bold text-slate-900">{pendingTokenExam.title}</p>
                <p>
                  {Number(pendingTokenExam.tokenRotationMinutes || 0) > 0
                    ? `Token ujian ini berubah otomatis setiap ${pendingTokenExam.tokenRotationMinutes} menit. Minta token aktif dari Pengawas di ruangan.`
                    : 'Masukkan kode token ujian yang diberikan oleh Pengawas/Guru.'}
                </p>
              </div>

              <form onSubmit={handleVerifyTokenAndEnter} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Kode Token Aktif
                  </label>
                  <input
                    type="text"
                    autoFocus
                    value={tokenInput}
                    onChange={(e) => {
                      setTokenInput(e.target.value.toUpperCase());
                      if (tokenError) setTokenError('');
                    }}
                    placeholder="CONTOH: K7M9P2"
                    className="w-full px-4 py-3 bg-white border-2 border-slate-300 focus:border-indigo-600 rounded-2xl font-mono text-center text-lg font-black tracking-widest uppercase text-slate-900 focus:outline-none"
                  />
                  {tokenError && (
                    <p className="text-xs font-semibold text-rose-600 mt-2 bg-rose-50 p-2.5 rounded-xl border border-rose-200">
                      {tokenError}
                    </p>
                  )}
                </div>

                <div className="flex gap-2.5 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setPendingTokenExam(null);
                      setTokenInput('');
                      setTokenError('');
                    }}
                    className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-extrabold text-xs shadow-md cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>Verifikasi & Mulai</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ACTIVE EXAM SESSION (CBT ROOM WITH ANTI-CHEAT LOCKDOWN)
  const currentQ = activeExam.questions[currentQuestionIndex];
  const totalQ = activeExam.questions.length;
  const isLastQuestion = currentQuestionIndex === totalQ - 1;
  const isFirstQuestion = currentQuestionIndex === 0;
  const currentAnswer = userAnswers[currentQ?.id];
  const isCurrentDoubt = doubtQuestions[currentQ?.id];

  return (
    <div
      id="cbt-exam-room"
      onCopy={(e) => {
        const t = e.target as HTMLElement | null;
        if (!t || (t.tagName !== 'INPUT' && t.tagName !== 'TEXTAREA')) e.preventDefault();
      }}
      onCut={(e) => {
        const t = e.target as HTMLElement | null;
        if (!t || (t.tagName !== 'INPUT' && t.tagName !== 'TEXTAREA')) e.preventDefault();
      }}
      onContextMenu={(e) => e.preventDefault()}
      onDragStart={(e) => e.preventDefault()}
      className="fixed inset-0 z-50 bg-slate-100 flex flex-col justify-between overflow-hidden select-none cbt-lockdown"
    >
      {/* Dynamic Anti-Screenshot / Anti-Foto Student Watermark Overlay */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-[55] overflow-hidden select-none opacity-[0.045]"
      >
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-12 -rotate-12 scale-125 py-12">
          {Array.from({ length: 12 }).map((_, idx) => (
            <div key={idx} className="text-center font-black text-slate-900 text-xs sm:text-sm tracking-wider whitespace-nowrap">
              {currentUser.name} • {currentUser.nip_nisn || currentUser.username} ({studentClass})
            </div>
          ))}
        </div>
      </div>

      {/* Tirai Privasi Anti-Screenshot saat tombol screenshot/blur terdeteksi */}
      {isPrivacyBlackout && submitPhase === 'idle' && (
        <div className="fixed inset-0 z-[130] bg-slate-950 flex flex-col items-center justify-center p-6 text-center text-white select-none">
          <ShieldAlert className="w-12 h-12 text-rose-500 mb-3" />
          <h3 className="text-lg font-black">Layar Soal Disembunyikan</h3>
          <p className="text-xs text-slate-300 mt-1 max-w-xs">
            Sistem keamanan CBT mendeteksi percobaan tangkapan layar atau perpindahan fokus.
          </p>
        </div>
      )}
      {/* Top Header Bar */}
      <header className="bg-white border-b border-slate-200 px-4 sm:px-6 py-3 flex items-center justify-between shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-700 text-white flex items-center justify-center font-black text-sm">
            CBT
          </div>
          <div>
            <h2 className="font-extrabold text-sm sm:text-base text-slate-900 leading-tight">
              {activeExam.title}
            </h2>
            <p className="text-xs text-slate-500">
              {currentUser.name} • NISN: {currentUser.nip_nisn} ({studentClass})
            </p>
          </div>
        </div>

        {/* Timer & Anti-Cheat Strike Badges */}
        <div className="flex items-center gap-3">
          {/* Live Countdown Timer */}
          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border font-mono font-bold text-sm ${
              remainingSeconds < 300
                ? 'bg-rose-50 text-rose-700 border-rose-300 animate-pulse'
                : 'bg-indigo-50 text-indigo-800 border-indigo-200'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>{formatTimer(remainingSeconds)}</span>
          </div>

          {/* Violations badge */}
          <div
            className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border ${
              violationCount > 0
                ? 'bg-amber-50 text-amber-800 border-amber-300'
                : 'bg-emerald-50 text-emerald-800 border-emerald-200'
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            <span>
              Strike: {violationCount}/{activeExam.maxViolations}
            </span>
          </div>

          <button
            onClick={requestExamFullScreen}
            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition cursor-pointer"
            title="Layar Penuh"
          >
            <Maximize className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 overflow-y-auto items-start">
        {/* Left Column: Question Stimulus & Answer Area */}
        <div className={`${isQuestionListOpen ? 'lg:col-span-8' : 'lg:col-span-12'} bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs flex flex-col justify-between min-h-[500px] transition-all duration-200`}>
          <div>
            {/* Top Question Header: Soal | Informasi soal | Daftar soal */}
            <div className="flex items-center justify-between flex-wrap gap-2 pb-4 mb-4 border-b border-slate-100 relative">
              {/* Bagian Kiri: Soal */}
              <div className="flex items-center gap-2">
                <span className="px-3.5 py-1.5 bg-indigo-600 text-white rounded-xl font-black text-xs sm:text-sm tracking-wide shadow-xs flex items-center gap-1.5">
                  <FileCheck className="w-4 h-4" />
                  <span>Soal No. {currentQuestionIndex + 1}</span>
                </span>
              </div>

              {/* Bagian Tengah: Informasi Soal (Membuka jendela pop-up) */}
              <button
                type="button"
                onClick={() => setIsQuestionInfoOpen(true)}
                className="px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer border bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
                title="Buka Jendela Informasi Soal"
              >
                <Info className="w-3.5 h-3.5" />
                <span>Informasi Soal</span>
              </button>

              {/* Bagian Kanan: Daftar Soal (Gantikan tombol ragu-ragu di posisi ini untuk buka/tutup navigasi) */}
              <button
                type="button"
                onClick={() => setIsQuestionListOpen((prev) => !prev)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer border ${
                  isQuestionListOpen
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                }`}
                title="Buka / Tutup Daftar Navigasi Soal"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Daftar Soal</span>
                <span className="ml-1 px-1.5 py-0.5 rounded-md text-[10px] font-black bg-slate-200 text-slate-700">
                  {Object.keys(userAnswers).length}/{totalQ}
                </span>
              </button>
            </div>

            {/* Stimulus Media (Images or Video) */}
            {currentQ?.mediaUrl && currentQ.mediaType === 'image' && (
              <div className="mb-4 max-w-lg rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
                <img
                  src={currentQ.mediaUrl}
                  alt="Stimulus Soal CBT"
                  className="w-full max-h-72 object-contain mx-auto"
                  referrerPolicy="no-referrer"
                />
              </div>
            )}

            {currentQ?.mediaUrl && currentQ.mediaType === 'video' && (
              <div className="mb-4 max-w-lg rounded-xl overflow-hidden border border-slate-200 bg-black">
                <video src={currentQ.mediaUrl} controls className="w-full max-h-72" />
              </div>
            )}

            {/* Prompt */}
            <p className="text-sm sm:text-base font-semibold text-slate-900 mb-6 leading-relaxed whitespace-pre-line">
              {currentQ?.prompt}
            </p>

            {/* Answer Input based on Question Type */}
            {/* TYPE 1: PILIHAN GANDA */}
            {currentQ?.type === 'pilihan_ganda' && currentQ.options && (
              <div className="space-y-3">
                {currentQ.options.map((opt, oIdx) => {
                  const isSelected = currentAnswer === opt;
                  return (
                    <button
                      key={oIdx}
                      type="button"
                      onClick={() => handleAnswerSelect(currentQ.id, opt)}
                      className={`w-full text-left p-4 rounded-xl border text-xs sm:text-sm font-medium transition flex items-center gap-3 cursor-pointer ${
                        isSelected
                          ? 'bg-indigo-50 border-indigo-600 text-indigo-950 font-bold shadow-xs'
                          : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                      }`}
                    >
                      <span
                        className={`w-6 h-6 rounded-full flex items-center justify-center font-extrabold text-xs shrink-0 ${
                          isSelected
                            ? 'bg-indigo-600 text-white'
                            : 'bg-slate-100 text-slate-600 border border-slate-300'
                        }`}
                      >
                        {String.fromCharCode(65 + oIdx)}
                      </span>
                      <span>{opt.replace(/^[A-D]\.\s*/, '')}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* TYPE 2: PILIHAN GANDA KOMPLEKS (Multi Checkbox) */}
            {currentQ?.type === 'pilihan_ganda_kompleks' && currentQ.options && (
              <div className="space-y-3">
                <p className="text-xs text-indigo-600 font-semibold mb-2">
                  * Pilihlah satu atau lebih jawaban yang benar (bisa lebih dari satu opsi).
                </p>
                {currentQ.options.map((opt, oIdx) => {
                  const selectedArr = Array.isArray(currentAnswer) ? currentAnswer : [];
                  const isChecked = selectedArr.includes(opt);

                  return (
                    <button
                      key={oIdx}
                      type="button"
                      onClick={() => {
                        if (isChecked) {
                          handleAnswerSelect(
                            currentQ.id,
                            selectedArr.filter((item: string) => item !== opt)
                          );
                        } else {
                          handleAnswerSelect(currentQ.id, [...selectedArr, opt]);
                        }
                      }}
                      className={`w-full text-left p-4 rounded-xl border text-xs sm:text-sm font-medium transition flex items-center gap-3 cursor-pointer ${
                        isChecked
                          ? 'bg-indigo-50 border-indigo-600 text-indigo-950 font-bold shadow-xs'
                          : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 ${
                          isChecked
                            ? 'bg-indigo-600 text-white'
                            : 'border-2 border-slate-300'
                        }`}
                      >
                        {isChecked && <Check className="w-3.5 h-3.5" />}
                      </div>
                      <span>{opt.replace(/^[A-D]\.\s*/, '')}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* TYPE 3: ISIAN SINGKAT */}
            {currentQ?.type === 'isian' && (
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-600">
                  Tuliskan jawaban singkat Anda (kata kunci / istilah):
                </label>
                <input
                  type="text"
                  placeholder="Ketik jawaban di sini..."
                  value={currentAnswer || ''}
                  onChange={(e) => handleAnswerSelect(currentQ.id, e.target.value)}
                  className="w-full p-3.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            )}

            {/* TYPE 4: ESSAY / URAIAN */}
            {currentQ?.type === 'essay' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>Tuliskan uraian dan penjelasan Anda secara rinci:</span>
                  <span>Panjang teks: {(currentAnswer || '').length} karakter</span>
                </div>
                <textarea
                  rows={6}
                  placeholder="Tuliskan argumen atau penjelasan lengkap Anda..."
                  value={currentAnswer || ''}
                  onChange={(e) => handleAnswerSelect(currentQ.id, e.target.value)}
                  className="w-full p-3.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 leading-relaxed"
                />
              </div>
            )}

                        {/* TYPE 5: MENJODOHKAN (Pemetaan Fungsi Matematika f: A -> B) */}
            {currentQ?.type === 'menjodohkan' && currentQ.matchingPairs && (
              <div className="space-y-4">
                

                {/* Status Pemetaan Sedang Aktif */}
                {selectedDomainItem && (
                  <div className="p-2.5 bg-amber-50 border border-amber-300 rounded-xl flex items-center justify-between text-xs text-amber-900 animate-pulse">
                    <span className="font-semibold">
                      Domain Terpilih: <strong className="text-indigo-700">"{selectedDomainItem}"</strong> ➔ Silakan klik target pasangannya di Himpunan B!
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedDomainItem(null)}
                      className="px-2 py-0.5 bg-amber-200 hover:bg-amber-300 text-amber-900 rounded-lg text-[10px] font-bold cursor-pointer"
                    >
                      Batal
                    </button>
                  </div>
                )}

                {/* Diagram Dua Kolom Himpunan A dan B */}
                <Xwrapper>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Himpunan A (Domain / Soal) */}
                    <div className="bg-slate-50 p-4 rounded-2xl border-2 border-dashed border-indigo-200">
                      <div className="flex items-center justify-between pb-2 mb-3 border-b border-indigo-100">
                        <span className="font-black text-xs text-indigo-950 flex items-center gap-1.5">
                          <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[10px] flex items-center justify-center font-mono font-bold">
                            A
                          </span>
                          <span>Himpunan A (Domain / Butir Soal)</span>
                        </span>
                        <span className="text-[10px] text-indigo-600 font-bold bg-indigo-50 px-2 py-0.5 rounded-full">
                          {currentQ.matchingPairs.length} Elemen
                        </span>
                      </div>
                      <div className="space-y-2.5">
                        {currentQ.matchingPairs.map((pair, pIdx) => {
                          const currentPairs = currentAnswer || {};
                          const mappedArr = Array.isArray(currentPairs[pair.premise]) 
                            ? currentPairs[pair.premise] 
                            : (currentPairs[pair.premise] ? [currentPairs[pair.premise]] : []);
                          
                          const isSelected = selectedDomainItem === pair.premise;
                          const isMapped = mappedArr.length > 0;
                          
                          return (
                            <div
                              key={pIdx}
                              onClick={() => setSelectedDomainItem(isSelected ? null : pair.premise)}
                              className={`p-3 rounded-xl border transition cursor-pointer flex items-center justify-between gap-2 select-none ${
                                isSelected
                                  ? 'bg-indigo-600 text-white border-indigo-700 ring-2 ring-indigo-300 shadow-md scale-[1.01]'
                                  : isMapped
                                  ? 'bg-white text-slate-900 border-indigo-300 shadow-2xs hover:border-indigo-400'
                                  : 'bg-white text-slate-800 border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/40'
                              }`}
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <span
                                  className={`w-5 h-5 rounded-md text-[10px] font-bold flex items-center justify-center shrink-0 ${
                                    isSelected ? 'bg-white/20 text-white' : 'bg-indigo-50 text-indigo-700'
                                  }`}
                                >
                                  a${pIdx + 1}
                                </span>
                                <span className="font-semibold text-xs truncate" title={pair.premise}>
                                  {pair.premise}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0 z-10">
                                <span
                                  id={`domain-${pIdx}`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (isMapped) {
                                      // Click bulatan pemetaan untuk reset pasangan ini
                                      const copy = { ...currentPairs };
                                      delete copy[pair.premise];
                                      handleAnswerSelect(currentQ.id, copy);
                                      if (isSelected) setSelectedDomainItem(null);
                                    } else {
                                      setSelectedDomainItem(isSelected ? null : pair.premise);
                                    }
                                  }}
                                  className={`w-3 h-3 rounded-full border-2 cursor-pointer transition-colors ${
                                    isSelected
                                      ? 'bg-amber-300 border-white ring-2 ring-amber-300'
                                      : isMapped
                                      ? 'bg-emerald-500 border-emerald-600'
                                      : 'bg-slate-200 border-slate-400 hover:bg-slate-300'
                                  }`}
                                  title={isMapped ? 'Klik bulatan ini untuk mereset pasangan' : 'Klik untuk memilih'}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Himpunan B (Kodomain / Pilihan Jawaban) */}
                    <div className="bg-slate-50 p-4 rounded-2xl border-2 border-dashed border-emerald-200">
                      <div className="flex items-center justify-between pb-2 mb-3 border-b border-emerald-100">
                        <span className="font-black text-xs text-emerald-950 flex items-center gap-1.5">
                          <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-[10px] flex items-center justify-center font-mono font-bold">
                            B
                          </span>
                          <span>Himpunan B (Kodomain / Pilihan Jawaban)</span>
                        </span>
                        <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full">
                          Target Pemetaan
                        </span>
                      </div>
                      <div className="space-y-2.5">
                        {currentQ.matchingPairs.map((pair, pIdx) => {
                          const targetMatch = pair.match;
                          const currentPairs = currentAnswer || {};
                          
                          // Cari tahu premise apa saja yang memetakan ke target ini
                          const mappedFromPremises = Object.keys(currentPairs).filter(prem => {
                             const ans = currentPairs[prem];
                             return Array.isArray(ans) ? ans.includes(targetMatch) : ans === targetMatch;
                          });
                          const isMappedToThis = mappedFromPremises.length > 0;
                          
                          // Cek apakah target ini sudah dipetakan oleh domain yang sedang aktif
                          const isActiveDomainMappedHere = selectedDomainItem && (
                            Array.isArray(currentPairs[selectedDomainItem]) 
                               ? currentPairs[selectedDomainItem].includes(targetMatch)
                               : currentPairs[selectedDomainItem] === targetMatch
                          );

                          return (
                            <div
                              key={pIdx}
                              onClick={() => {
                                if (selectedDomainItem) {
                                  const ans = currentPairs[selectedDomainItem];
                                  let newArr = Array.isArray(ans) ? [...ans] : (ans ? [ans] : []);
                                  
                                  if (newArr.includes(targetMatch)) {
                                    newArr = newArr.filter(v => v !== targetMatch);
                                  } else {
                                    newArr.push(targetMatch);
                                  }
                                  
                                  handleAnswerSelect(currentQ.id, {
                                    ...currentPairs,
                                    [selectedDomainItem]: newArr,
                                  });
                                } else {
                                  alert(
                                    'Pilih butir soal di Himpunan A (kolom kiri) terlebih dahulu sebelum memetakan ke jawaban ini!'
                                  );
                                }
                              }}
                              className={`p-3 rounded-xl border transition cursor-pointer flex items-center justify-between gap-2 select-none ${
                                selectedDomainItem
                                  ? 'bg-white hover:bg-emerald-50 text-slate-900 border-emerald-300 hover:border-emerald-500 ring-1 ring-emerald-200 shadow-2xs hover:scale-[1.01]'
                                  : isMappedToThis
                                  ? 'bg-white text-slate-900 border-emerald-300 shadow-2xs'
                                  : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                              }`}
                            >
                              <div className="flex items-center gap-2 z-10">
                                <span id={`match-${pIdx}`} className={`w-3 h-3 rounded-full border-2 shrink-0 ${isActiveDomainMappedHere ? 'bg-amber-300 border-amber-500' : 'bg-slate-200 border-slate-400'}`} />
                                <span className="w-5 h-5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                                  b${pIdx + 1}
                                </span>
                                <span className="font-semibold text-xs" title={targetMatch}>
                                  {targetMatch}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    
                    {/* Render panah pemetaan */}
                    {Object.entries(currentAnswer || {}).flatMap(([prem, matches]) => {
                      const arr = Array.isArray(matches) ? matches : [matches];
                      return arr.map(matchVal => {
                        const premIdx = currentQ.matchingPairs.findIndex(p => p.premise === prem);
                        const matchIdx = currentQ.matchingPairs.findIndex(p => p.match === matchVal);
                        if (premIdx === -1 || matchIdx === -1) return null;
                        
                        // Menambahkan sedikit variasi warna berdasarkan index domain
                        const colors = ['#4f46e5', '#059669', '#ea580c', '#db2777', '#0284c7', '#7c3aed'];
                        const arrowColor = colors[premIdx % colors.length];
                        
                        return (
                          <Xarrow
                            key={`${prem}-${matchVal}`}
                            start={`domain-${premIdx}`}
                            end={`match-${matchIdx}`}
                            color={arrowColor}
                            strokeWidth={3}
                            path="smooth"
                            startAnchor="right"
                            endAnchor="left"
                            headSize={4}
                            curveness={0.8}
                          />
                        );
                      });
                    })}
                  </div>
                </Xwrapper>
              </div>
            )}
            
            {/* TYPE 7: ISI KOSONG */}
            {currentQ?.type === 'isi_kosong' && currentQ.fillInTheBlanks && (
              <div className="space-y-4">
                <p className="text-sm font-semibold text-slate-800">Isilah bagian yang kosong di bawah ini:</p>
                <div className="space-y-3">
                  {currentQ.fillInTheBlanks.map((_, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <span className="font-bold text-indigo-700 w-8">[{idx + 1}]</span>
                      <input
                        type="text"
                        value={(currentAnswer || [])[idx] || ''}
                        onChange={(e) => {
                          const newAns = [...(currentAnswer || [])];
                          newAns[idx] = e.target.value;
                          handleAnswerSelect(currentQ.id, newAns);
                        }}
                        className="flex-1 p-2 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                        placeholder={`Jawaban bagian [${idx + 1}]...`}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TYPE 8: SUSUN KATA */}
            {currentQ?.type === 'susun_kata' && currentQ.jumbledWords && (
              <div className="space-y-4">
                <p className="text-sm font-semibold text-slate-800">Susun kata-kata berikut menjadi urutan yang benar:</p>
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-4">
                  <div className="flex flex-wrap gap-2">
                    {currentQ.jumbledWords.map((word, wIdx) => {
                      const isUsed = (currentAnswer || []).includes(word);
                      return (
                        <button
                          key={wIdx}
                          disabled={isUsed}
                          onClick={() => {
                            const newAns = [...(currentAnswer || []), word];
                            handleAnswerSelect(currentQ.id, newAns);
                          }}
                          className={`px-3 py-1.5 rounded-lg text-sm font-bold shadow-sm transition ${
                            isUsed
                              ? 'bg-slate-200 text-slate-400 cursor-not-allowed opacity-50'
                              : 'bg-white text-indigo-700 border border-indigo-200 hover:bg-indigo-50 cursor-pointer'
                          }`}
                        >
                          {word}
                        </button>
                      );
                    })}
                  </div>
                  <div className="p-3 border-2 border-dashed border-indigo-200 rounded-lg min-h-[60px] bg-white flex flex-wrap gap-2 items-start">
                    {(currentAnswer || []).map((word, aIdx) => (
                      <button
                        key={aIdx}
                        onClick={() => {
                          const newAns = (currentAnswer || []).filter((_, idx) => idx !== aIdx);
                          handleAnswerSelect(currentQ.id, newAns);
                        }}
                        className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-sm font-bold shadow-sm hover:bg-indigo-700 cursor-pointer flex items-center gap-1"
                        title="Klik untuk menghapus dari susunan"
                      >
                        {word} 
                        <span className="text-[10px] bg-white/20 rounded-full w-4 h-4 inline-flex items-center justify-center ml-1">✕</span>
                      </button>
                    ))}
                    {(!currentAnswer || currentAnswer.length === 0) && (
                      <span className="text-slate-400 text-sm italic py-1.5">Klik kata di atas untuk menyusunnya di sini...</span>
                    )}
                  </div>
                  {currentAnswer && currentAnswer.length > 0 && (
                    <button
                      onClick={() => handleAnswerSelect(currentQ.id, [])}
                      className="text-xs text-rose-600 font-semibold hover:underline cursor-pointer"
                    >
                      Reset Susunan
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* TYPE 6: BENAR DAN SALAH */}
            {currentQ?.type === 'benar_salah' && currentQ.trueFalseStatements && (
              <div className="space-y-3">

                <div className="space-y-2.5">
                  {currentQ.trueFalseStatements.map((stmt, sIdx) => {
                    const answersObj = currentAnswer || {};
                    const selectedVal = answersObj[sIdx];

                    return (
                      <div
                        key={sIdx}
                        className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <span className="text-xs sm:text-sm text-slate-800 font-medium sm:w-2/3">
                          {stmt.statement}
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              handleAnswerSelect(currentQ.id, {
                                ...answersObj,
                                [sIdx]: 'Benar',
                              })
                            }
                            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                              selectedVal === 'Benar'
                                ? 'bg-emerald-600 text-white shadow-xs'
                                : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-300'
                            }`}
                          >
                            Benar
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              handleAnswerSelect(currentQ.id, {
                                ...answersObj,
                                [sIdx]: 'Salah',
                              })
                            }
                            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                              selectedVal === 'Salah'
                                ? 'bg-rose-600 text-white shadow-xs'
                                : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-300'
                            }`}
                          >
                            Salah
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Bottom Navigation Buttons: Sebelumnya | Ragu-Ragu | Selanjutnya */}
          <div className="pt-6 mt-6 border-t border-slate-100 flex items-center justify-between gap-2">
            {/* Kiri: Sebelumnya */}
            <button
              type="button"
              disabled={isFirstQuestion}
              onClick={() => handleNavigateQuestion(Math.max(0, currentQuestionIndex - 1))}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-700 font-bold rounded-xl text-xs flex items-center gap-1.5 transition cursor-pointer disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Sebelumnya</span>
            </button>

            {/* Tengah: Ragu-Ragu */}
            <button
              type="button"
              onClick={() => handleToggleDoubt(currentQ.id)}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer border ${
                isCurrentDoubt
                  ? 'bg-amber-500 hover:bg-amber-600 text-white border-amber-500 shadow-xs'
                  : 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-200'
              }`}
            >
              <Flag className="w-4 h-4" />
              <span>{isCurrentDoubt ? 'Ragu-ragu (Ditandai)' : 'Ragu-Ragu'}</span>
            </button>

            {/* Kanan: Selanjutnya / Selesai */}
            {isLastQuestion ? (
              <button
                type="button"
                disabled={!canSubmitNow}
                onClick={() => setIsSubmitConfirmOpen(true)}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                title={canSubmitNow ? 'Kumpulkan Ujian' : `Tunggu menit ke-${activeExam.minSubmitMinutes}`}
              >
                <span>Selesai & Kumpulkan</span>
                <FileCheck className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleNavigateQuestion(Math.min(totalQ - 1, currentQuestionIndex + 1))}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition cursor-pointer shadow-xs"
              >
                <span>Selanjutnya</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Right Column: Question Number Grid & Submit Button */}
        {isQuestionListOpen && (
          <div className="lg:col-span-4 space-y-4 animate-in fade-in slide-in-from-right-4 duration-200">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
                <h3 className="font-extrabold text-xs text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <LayoutGrid className="w-4 h-4 text-indigo-600" />
                  <span>Daftar Nomor Soal</span>
                </h3>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-semibold text-slate-500">
                    {Object.keys(userAnswers).length}/{totalQ} Terisi
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsQuestionListOpen(false)}
                    className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition cursor-pointer"
                    title="Tutup Daftar Soal"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Question Badges Grid */}
              <div className="grid grid-cols-5 gap-2 max-h-60 overflow-y-auto p-1">
                {activeExam.questions.map((q, qIndex) => {
                  const isCurrent = qIndex === currentQuestionIndex;
                  const hasAnswer = userAnswers[q.id] !== undefined && userAnswers[q.id] !== '';
                  const isDoubt = doubtQuestions[q.id];

                  let bgClass = 'bg-slate-100 text-slate-600 hover:bg-slate-200';
                  if (isDoubt) {
                    bgClass = 'bg-amber-500 text-white font-black';
                  } else if (hasAnswer) {
                    bgClass = 'bg-emerald-600 text-white font-bold';
                  }

                  return (
                    <button
                      key={`${q.id}_${qIndex}`}
                      type="button"
                      onClick={() => handleNavigateQuestion(qIndex)}
                      className={`h-10 rounded-xl text-xs font-bold transition flex items-center justify-center cursor-pointer ${bgClass} ${
                        isCurrent ? 'ring-3 ring-indigo-500 ring-offset-1' : ''
                      }`}
                    >
                      {qIndex + 1}
                    </button>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="pt-4 mt-4 border-t border-slate-100 grid grid-cols-3 gap-2 text-[10px] text-slate-600">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-emerald-600"></span>
                  <span>Sudah diisi</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-amber-500"></span>
                  <span>Ragu-ragu</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-slate-200"></span>
                  <span>Belum diisi</span>
                </div>
              </div>
            </div>

            {/* Submit Exam Card with Minimum Submit Rule */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs text-xs space-y-3">
              <h4 className="font-bold text-slate-800">Penyelesaian Ujian</h4>

              {canSubmitNow ? (
                <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-[11px]">
                  Waktu pengerjaan minimal telah tercapai. Anda dapat mengumpulkan lembar jawaban kapan saja.
                </div>
              ) : (
                <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-[11px]">
                  Ujian dapat dikumpulkan setelah {activeExam.minSubmitMinutes} menit pengerjaan (sisa waktu ≤ {formatTimer(Math.max(0, totalExamDurationSeconds - minSubmitSeconds))}).
                  <br />
                  Sisa waktu tunggu:{' '}
                  <strong>{formatTimer(remainingSecondsUntilSubmitAllowed)}</strong>
                </div>
              )}

              <button
                type="button"
                disabled={!canSubmitNow}
                onClick={() => setIsSubmitConfirmOpen(true)}
                className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-sm"
              >
                <FileCheck className="w-4 h-4" />
                <span>Selesaikan & Kumpulkan</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* MODAL PELANGGARAN KECURANGAN - UJIAN OTOMATIS SELESAI */}
      {violationWarningModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 text-center shadow-2xl border-4 border-rose-500 animate-in fade-in zoom-in duration-200">
            <div className="w-16 h-16 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4">
              <ShieldAlert className="w-9 h-9" />
            </div>

            <h3 className="text-xl font-black text-slate-900 mb-2">
              UJIAN DIHENTIKAN OTOMATIS!
            </h3>

            <p className="text-xs text-rose-700 font-bold whitespace-pre-line leading-relaxed mb-4 bg-rose-50 p-3.5 rounded-xl border border-rose-200 text-left">
              {violationWarningModal}
            </p>

            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-900 text-left mb-6 space-y-1">
              <strong className="block font-bold text-amber-950">
                Pemberitahuan untuk Siswa:
              </strong>
              <span>
                Apabila pelanggaran ini terjadi tanpa sengaja (misalnya popup sistem operasi atau kendala perangkat), silakan segera lapor ke Pengawas/Guru di ruangan ujian. Pengawas dapat melakukan <strong>Buka Kunci (Lanjut)</strong> atau <strong>Reset Ujian Siswa</strong> agar Anda bisa melanjutkan kembali.
              </span>
            </div>

            <button
              type="button"
              onClick={() => {
                setViolationWarningModal(null);
              }}
              className="w-full py-3 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-extrabold text-xs shadow-md transition cursor-pointer"
            >
              Tutup & Kembali ke Beranda Siswa
            </button>
          </div>
        </div>
      )}

      {/* MODAL KONFIRMASI PENGUMPULAN UJIAN */}
      {isSubmitConfirmOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            {isSubmittingExam ? (
              <div className="text-center py-4 space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
                  <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 mb-1">
                    Mengirim Jawaban Ujian...
                  </h3>
                  <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
                    Jawaban Anda sedang diverifikasi dan disimpan ke server. Mohon tunggu sejenak (1–2 detik)...
                  </p>
                </div>

                {/* Progress bar animation */}
                <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                  <div className="bg-emerald-600 h-2.5 rounded-full animate-pulse w-full transition-all duration-1000" />
                </div>

                <div className="flex items-center justify-center gap-2 text-[11px] font-semibold text-emerald-700 bg-emerald-50 py-2 px-3 rounded-xl border border-emerald-200">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Jeda aman aktif: Layar penuh dinonaktifkan tanpa pelanggaran</span>
                </div>
              </div>
            ) : (
              <>
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-700 flex items-center justify-center mx-auto mb-4">
                  <FileCheck className="w-6 h-6" />
                </div>

                <h3 className="text-lg font-black text-slate-900 text-center mb-1">
                  Konfirmasi Kumpulkan Ujian
                </h3>
                <p className="text-xs text-slate-500 text-center mb-4">
                  Periksa kembali kelengkapan jawaban Anda sebelum mengakhiri sesi ujian.
                </p>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5 mb-6">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Total Butir Soal:</span>
                    <strong className="text-slate-800">{totalQ} Butir</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Sudah Dijawab:</span>
                    <strong className="text-emerald-700">{Object.keys(userAnswers).length} Soal</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Ditandai Ragu-ragu:</span>
                    <strong className="text-amber-700">
                      {Object.values(doubtQuestions).filter(Boolean).length} Soal
                    </strong>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setIsSubmitConfirmOpen(false)}
                    className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs cursor-pointer"
                  >
                    Cek Jawaban Lagi
                  </button>
                  <button
                    type="button"
                    onClick={triggerSubmitExam}
                    className="py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl text-xs shadow-sm cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <span>Ya, Kumpulkan Sekarang</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* MODAL POP-UP JENDELA INFORMASI SOAL */}
      {isQuestionInfoOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setIsQuestionInfoOpen(false)}
        >
          <div
            className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-150 relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Pop-up */}
            <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-xs">
                  <Info className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 leading-tight">
                    Informasi Soal
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Soal Nomor {currentQuestionIndex + 1} dari {totalQ} Butir
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsQuestionInfoOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                title="Tutup Jendela"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Konten Detail Informasi Soal */}
            <div className="space-y-2.5 text-xs mb-6">
              {/* Jenis Soal */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
                <span className="text-slate-600 font-semibold flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-slate-400" />
                  Jenis Soal:
                </span>
                <span className="px-3 py-1 rounded-xl font-extrabold uppercase text-xs bg-indigo-50 text-indigo-700 border border-indigo-200 tracking-wide">
                  {currentQ?.type.replace(/_/g, ' ')}
                </span>
              </div>

              {/* Bobot Soal */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
                <span className="text-slate-600 font-semibold flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-slate-400" />
                  Bobot Soal:
                </span>
                <span className="px-3 py-1 rounded-xl font-black text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs">
                  {currentQ?.points} Poin
                </span>
              </div>

              {/* Status Pengerjaan Jawaban */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
                <span className="text-slate-600 font-semibold flex items-center gap-1.5">
                  <FileCheck className="w-4 h-4 text-slate-400" />
                  Status Lembar Jawaban:
                </span>
                {userAnswers[currentQ?.id] !== undefined && userAnswers[currentQ?.id] !== '' ? (
                  <span className="px-2.5 py-1 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> Sudah Terjawab
                  </span>
                ) : (
                  <span className="px-2.5 py-1 rounded-xl text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200 flex items-center gap-1">
                    <HelpCircle className="w-3.5 h-3.5 text-slate-400" /> Belum Dijawab
                  </span>
                )}
              </div>

              {/* Status Ragu-Ragu */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
                <span className="text-slate-600 font-semibold flex items-center gap-1.5">
                  <Flag className="w-4 h-4 text-slate-400" />
                  Status Ragu-Ragu:
                </span>
                {isCurrentDoubt ? (
                  <span className="px-2.5 py-1 rounded-xl text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
                    <Flag className="w-3.5 h-3.5 text-amber-600" /> Ditandai Ragu-ragu
                  </span>
                ) : (
                  <span className="px-2.5 py-1 rounded-xl text-xs font-bold bg-slate-100 text-slate-500 border border-slate-200">
                    Tidak Ragu-ragu
                  </span>
                )}
              </div>

              {/* Petunjuk Singkat */}
              <div className="p-3 bg-blue-50/70 rounded-2xl border border-blue-100 text-[11px] text-blue-900 space-y-1">
                <span className="font-bold block text-blue-950">Petunjuk Singkat:</span>
                <p className="text-blue-800 leading-relaxed">
                  {currentQ?.type === 'pilihan_ganda' && 'Pilihlah salah satu opsi jawaban yang paling tepat dari pilihan A sampai E.'}
                  {currentQ?.type === 'pilihan_ganda_kompleks' && 'Pilihlah satu atau lebih opsi jawaban yang sesuai (dapat memilih lebih dari satu).'}
                  {currentQ?.type === 'benar_salah' && 'Tentukan pilihan Benar atau Salah pada setiap baris pernyataan yang disajikan.'}
                  {currentQ?.type === 'menjodohkan' && 'Hubungkan premis di sebelah kiri dengan pasangan yang sesuai di sebelah kanan.'}
                  {currentQ?.type === 'isian' && 'Ketikkan jawaban singkat dan tepat pada kolom isian teks yang tersedia.'}
                  {currentQ?.type === 'essay' && 'Tuliskan uraian atau penjelasan lengkap pada area teks esai yang telah disediakan.'}
                  {currentQ?.type === 'isi_kosong' && 'Isilah kata/istilah yang rumpang pada bagian teks soal.'}
                  {currentQ?.type === 'susun_kata' && 'Urutkan kepingan kata hingga membentuk kalimat yang runtut dan benar.'}
                </p>
              </div>
            </div>

            {/* Tombol Tutup */}
            <button
              type="button"
              onClick={() => setIsQuestionInfoOpen(false)}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-sm transition cursor-pointer flex items-center justify-center gap-1.5"
            >
              <span>Tutup Informasi Soal</span>
            </button>
          </div>
        </div>
      )}

      {/* MODAL POPUP PENYIMPANAN DATA UJIAN KE DATABASE */}
      {isSavingExam && (
        <div className="fixed inset-0 z-[100] bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-sm w-full p-8 text-center shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-150">
            <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-4 shadow-xs">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
            <h3 className="text-lg font-black text-slate-900 mb-1.5">
              Mengirim jawaban
            </h3>
            <p className="text-xs text-slate-500 font-medium leading-relaxed mb-4">
              Mohon tunggu sebentar, jawaban Anda sedang dikirim ke server...
            </p>
            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
              <div className="bg-indigo-600 h-2 rounded-full animate-pulse w-full" />
            </div>
          </div>
        </div>
      )}

      {/* OVERLAY FULLSCREEN: MENGIRIM JAWABAN -> JAWABAN TERKIRIM -> JENDELA HASIL NILAI SISWA */}
      {submitPhase !== 'idle' && (
        <div className="fixed inset-0 z-[120] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          {submitPhase === 'sending' && (
            <div className="bg-white rounded-3xl max-w-sm w-full p-8 text-center shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200">
              <div className="relative w-20 h-20 mx-auto mb-5 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border-4 border-indigo-100" />
                <div className="absolute inset-0 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin" />
                <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
              </div>
              <h3 className="text-xl font-black text-slate-900 mb-2">
                Mengirim jawaban
              </h3>
              <p className="text-xs text-slate-500 font-medium leading-relaxed">
                Mohon tunggu sebentar, sistem sedang mengirim dan mengamankan jawaban Anda...
              </p>
            </div>
          )}

          {submitPhase === 'sent' && (
            <div className="bg-white rounded-3xl max-w-sm w-full p-8 text-center shadow-2xl border border-emerald-100 animate-in zoom-in-95 duration-200">
              <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-5 shadow-inner animate-bounce">
                <CheckCircle className="w-11 h-11 text-emerald-600" />
              </div>
              <h3 className="text-xl font-black text-emerald-900 mb-1.5">
                Jawaban terkirim
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                {examResultData?.syncedToServer
                  ? 'Seluruh jawaban berhasil tersimpan di server. Menyiapkan hasil ujian...'
                  : 'Jawaban diamankan di perangkat & siap disinkronkan. Menyiapkan hasil ujian...'}
              </p>
            </div>
          )}

          {submitPhase === 'result' && examResultData && (() => {
            const { exam: resExam, attempt: resAttempt, syncedToServer } = examResultData;
            const showScore = resExam.releaseScore !== false;
            const scoreVal = resAttempt.scorePercentage ?? 0;
            const isPassed = scoreVal >= resExam.kkm;
            const answeredCount = Object.keys(resAttempt.answers || {}).filter((k) => {
              const v = resAttempt.answers[k];
              if (v === undefined || v === null || v === '') return false;
              if (Array.isArray(v)) return v.length > 0;
              if (typeof v === 'object') return Object.keys(v).length > 0;
              return true;
            }).length;

            return (
              <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-200">
                <div className="text-center mb-5">
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-xs ${
                    showScore
                      ? isPassed
                        ? 'bg-emerald-100 text-emerald-600'
                        : 'bg-amber-100 text-amber-600'
                      : 'bg-indigo-100 text-indigo-600'
                  }`}>
                    <Award className="w-9 h-9" />
                  </div>
                  <span className="inline-block px-3 py-1 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 mb-2">
                    {resExam.subjectName}
                  </span>
                  <h3 className="text-xl font-black text-slate-900 leading-tight">
                    Hasil Ujian Siswa
                  </h3>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    {resExam.title}
                  </p>
                </div>

                {/* Identitas Siswa */}
                <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4 text-xs space-y-2 mb-4">
                  <div className="flex justify-between gap-2">
                    <span className="text-slate-500">Nama Siswa:</span>
                    <strong className="text-slate-900 text-right">{resAttempt.studentName}</strong>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-slate-500">NISN / Kelas:</span>
                    <strong className="text-slate-900 text-right">
                      {resAttempt.studentNisn || '-'} ({resAttempt.studentClass || '-'})
                    </strong>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-slate-500">Soal Terjawab:</span>
                    <strong className="text-slate-900 text-right">
                      {answeredCount} dari {resExam.questions.length} Soal
                    </strong>
                  </div>
                  <div className="flex justify-between gap-2 items-center">
                    <span className="text-slate-500">Status Pengiriman:</span>
                    {syncedToServer ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-[11px]">
                        <CheckCircle className="w-3 h-3" /> Tersimpan di Server
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 font-bold text-[11px]">
                        Tersimpan Lokal (Menunggu Koneksi)
                      </span>
                    )}
                  </div>
                </div>

                {/* Kotak Nilai */}
                <div className={`rounded-2xl border p-5 text-center mb-6 ${
                  showScore
                    ? isPassed
                      ? 'bg-emerald-50 border-emerald-200'
                      : 'bg-rose-50 border-rose-200'
                    : 'bg-indigo-50 border-indigo-200'
                }`}>
                  {showScore ? (
                    <>
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-600 block mb-1">
                        Nilai Akhir Anda
                      </span>
                      <div className={`text-5xl font-black tracking-tight mb-2 ${
                        isPassed ? 'text-emerald-700' : 'text-rose-700'
                      }`}>
                        {scoreVal}
                      </div>
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-extrabold border ${
                        isPassed
                          ? 'bg-white text-emerald-700 border-emerald-300'
                          : 'bg-white text-rose-700 border-rose-300'
                      }`}>
                        {isPassed ? `TUNTAS KKM (${resExam.kkm})` : `BELUM TUNTAS (KKM: ${resExam.kkm})`}
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 block mb-1">
                        Status Ujian
                      </span>
                      <div className="text-2xl font-black text-indigo-900 mb-1">
                        Nilai Tersimpan
                      </div>
                      <p className="text-[11px] text-indigo-700 leading-relaxed">
                        Nilai resmi telah disimpan oleh guru dan akan diumumkan sesuai jadwal sekolah.
                      </p>
                    </>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleResultOkLogout}
                  className="w-full py-3.5 px-6 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-sm shadow-lg shadow-indigo-600/25 transition cursor-pointer flex items-center justify-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  <span>OK</span>
                </button>
                <p className="text-[11px] text-slate-400 text-center mt-2.5">
                  Tekan OK untuk keluar dari mode layar penuh & kembali ke halaman login.
                </p>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}
