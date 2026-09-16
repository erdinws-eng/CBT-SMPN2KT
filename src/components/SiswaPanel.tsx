import { useState, useEffect, useRef } from 'react';
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
} from 'lucide-react';
import {
  Exam,
  ExamAttempt,
  Question,
  User,
  SchoolSettings,
  QuestionType,
} from '../types';

interface SiswaPanelProps {
  currentUser: User;
  exams: Exam[];
  attempts: ExamAttempt[];
  settings: SchoolSettings;
  onUpdateAttempts: (attempts: ExamAttempt[]) => void;
}

export default function SiswaPanel({
  currentUser,
  exams,
  attempts,
  settings,
  onUpdateAttempts,
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
  const [isSubmitConfirmOpen, setIsSubmitConfirmOpen] = useState<boolean>(false);

  // Anti-cheat state
  const [violationCount, setViolationCount] = useState<number>(0);
  const [violationWarningModal, setViolationWarningModal] = useState<string | null>(null);
  const [isFullScreen, setIsFullScreen] = useState<boolean>(false);
  const [selectedDomainItem, setSelectedDomainItem] = useState<string | null>(null);

  // Wake lock ref
  const wakeLockRef = useRef<any>(null);

  // Filter exams for student's class
  const studentClass = currentUser.classGrade || '8A';
  const myExams = exams.filter(
    (e) => e.targetClasses.includes(studentClass) || e.targetClasses.includes('all')
  );

  // Calculate elapsed exam time for minimum submit check
  const [elapsedMinutes, setElapsedMinutes] = useState<number>(0);

  // 1. Enter Exam directly without token
  const handleStartExam = (exam: Exam) => {
    // Check existing attempts for this exam
    const existingAttempts = attempts.filter(
      (a) => a.examId === exam.id && a.studentId === currentUser.id
    ).sort((a, b) => new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime());
    
    const latestAttempt = existingAttempts.length > 0 ? existingAttempts[existingAttempts.length - 1] : null;

    if (latestAttempt && latestAttempt.status === 'submitted') {
      if (!exam.allowRetake) {
        alert('Anda sudah menyelesaikan ujian ini dan tidak ada kesempatan remedial.');
        return;
      }
      if (existingAttempts.length >= (exam.maxRetakes || 1) + 1) { // 1 initial + maxRetakes
        alert(`Anda telah mencapai batas maksimal pengerjaan (Total: ${existingAttempts.length} kali).`);
        return;
      }
    }

    if (latestAttempt && latestAttempt.status === 'violation_disqualified') {
      alert(
        'Ujian Anda saat ini terkunci karena terdeteksi pelanggaran. Silakan hubungi Pengawas/Guru di ruangan untuk meminta "Reset Ujian Siswa" agar Anda dapat membuka dan mengerjakan ujian kembali.'
      );
      return;
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

    // Shuffle questions if randomized
    if (exam.randomizeQuestions) {
      questionsOrder.sort(() => Math.random() - 0.5);
    }

    const isRetake = latestAttempt?.status === 'submitted';
    const isResuming = latestAttempt?.status === 'in_progress';

    const newAttempt: ExamAttempt = {
      // If it's a retake, we create a brand NEW attempt ID so we don't overwrite history
      id: (isResuming && latestAttempt) ? latestAttempt.id : 'att_' + Date.now(),
      examId: exam.id,
      examTitle: exam.title,
      subjectName: exam.subjectName,
      studentId: currentUser.id,
      studentName: currentUser.name,
      studentNisn: currentUser.nip_nisn,
      studentClass: studentClass,
      answers: isResuming ? (latestAttempt?.answers || {}) : {},
      scores: isResuming ? (latestAttempt?.scores || {}) : {},
      totalScore: 0,
      maxPossibleScore: exam.questions.reduce((acc, q) => acc + q.points, 0) || 100,
      scorePercentage: 0,
      passedKkm: false,
      totalEarnedPoints: 0,
      totalMaxPoints: exam.questions.reduce((acc, q) => acc + q.points, 0) || 100,
      status: 'in_progress',
      violationCount: isResuming ? (latestAttempt?.violationCount || 0) : 0,
      startedAt: isResuming ? latestAttempt.startedAt : new Date().toISOString(),
      violationLogs: isResuming ? (latestAttempt?.violationLogs || []) : [],
      isGraded: false,
    };

    // Update attempts
    const otherAttempts = attempts.filter((a) => a.id !== newAttempt.id);
    onUpdateAttempts([...otherAttempts, newAttempt]);

    setActiveExam({ ...exam, questions: questionsOrder });
    setCurrentAttempt(newAttempt);
    setUserAnswers(newAttempt.answers || {});
    setRemainingSeconds(exam.durationMinutes * 60);
    setElapsedMinutes(0);
    setViolationCount(0);
    setCurrentQuestionIndex(0);

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

  // Fullscreen helper
  const requestExamFullScreen = () => {
    const docEl = document.documentElement;
    if (docEl.requestFullscreen) {
      docEl.requestFullscreen().catch(() => {});
    }
  };

  // 2. Anti-Cheat Monitoring (Visibility Change, Tab Switch, Blur, Exit Fullscreen)
  useEffect(() => {
    if (!activeExam || !activeExam.lockdownBrowser || currentAttempt?.status !== 'in_progress') {
      return;
    }

    const playViolationBeep = () => {
      try {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContext) return;
        
        const ctx = new AudioContext();
        let startTime = ctx.currentTime;
        
        for (let i = 0; i < 3; i++) {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          
          osc.type = 'square';
          osc.frequency.setValueAtTime(800, startTime); // 800Hz beep
          
          gain.gain.setValueAtTime(0.1, startTime);
          gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.2);
          
          osc.connect(gain);
          gain.connect(ctx.destination);
          
          osc.start(startTime);
          osc.stop(startTime + 0.2);
          
          startTime += 0.3;
        }
      } catch (e) {
        console.error('Audio beep failed', e);
      }
    };

    const recordViolation = (reason: string, playBeep = false) => {
      if (playBeep) playViolationBeep();
      // Seketika selesaikan ujian saat pelanggaran terjadi (tanpa peringatan 3 kali)
      setViolationCount(1);
      setViolationWarningModal(
        `UJIAN DIHENTIKAN OTOMATIS KARENA PELANGGARAN!\n\nTerdeteksi: ${reason}.\nSesuai aturan ujian, jika terjadi pelanggaran maka ujian otomatis selesai tanpa peringatan sampai 3 kali.\n\nJika pelanggaran terjadi tanpa sengaja, silakan segera lapor ke Pengawas/Guru untuk melakukan "Reset Ujian Siswa" agar Anda dapat membuka dan mengerjakan kembali.`
      );
      handleFinishExam(true);
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        recordViolation('Meninggalkan tab ujian CBT atau membuka aplikasi lain', true);
      }
    };

    const handleWindowBlur = () => {
      recordViolation('Kursor atau jendela fokus keluar dari aplikasi CBT', true);
    };

    const handleFullscreenChange = () => {
      const isCurrentlyFs = Boolean(document.fullscreenElement);
      setIsFullScreen(isCurrentlyFs);
      if (!isCurrentlyFs && activeExam.lockdownBrowser) {
        recordViolation('Keluar dari mode Layar Penuh (Fullscreen)');
      }
    };

    // Keyboard protection (Ctrl+C, Ctrl+V, Ctrl+U, PrintScreen, F12)
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        (e.ctrlKey || e.metaKey) &&
        ['c', 'v', 'u', 'p', 's', 'a'].includes(e.key.toLowerCase())
      ) {
        e.preventDefault();
        recordViolation(`Menekan tombol pintasan keyboard terlarang (Ctrl+${e.key.toUpperCase()})`);
      }
      if (e.key === 'PrintScreen' || e.key === 'F12') {
        e.preventDefault();
        recordViolation('Mencoba mengambil tangkapan layar atau membuka inspeksi');
      }
    };

    // Context menu (Right click) protection
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('contextmenu', handleContextMenu);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [activeExam, currentAttempt]);

  // 3. Countdown Timer & Minimum submit check
  useEffect(() => {
    if (!activeExam || remainingSeconds <= 0 || currentAttempt?.status !== 'in_progress') {
      return;
    }

    const timer = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleFinishExam(false);
          return 0;
        }
        return prev - 1;
      });

      setElapsedMinutes((prev) => prev + 1 / 60);
    }, 1000);

    return () => clearInterval(timer);
  }, [activeExam, remainingSeconds, currentAttempt]);

  // Watch for Guru resets from attempts prop
  useEffect(() => {
    if (activeExam && currentAttempt) {
      const globalAttempt = attempts.find(a => a.id === currentAttempt.id);
      if (globalAttempt) {
        // If answers were cleared globally (i.e. Guru reset), but local still has them
        if (Object.keys(globalAttempt.answers).length === 0 && Object.keys(userAnswers).length > 0) {
          // Reset the local state to match the clean attempt
          setUserAnswers({});
          setCurrentAttempt(globalAttempt);
          setCurrentQuestionIndex(0);
          setRemainingSeconds(activeExam.durationMinutes * 60);
          setElapsedMinutes(0);
          setViolationCount(0);
          setViolationWarningModal(null);
          setDoubtQuestions({});
        } else if (globalAttempt.status === 'in_progress' && currentAttempt.status === 'violation_disqualified') {
          // If status was reset but maybe userAnswers is empty anyway
          setCurrentAttempt(globalAttempt);
          setViolationCount(0);
          setViolationWarningModal(null);
        }
      }
    }
  }, [attempts, activeExam, currentAttempt, userAnswers]);

  // 4. Update Answer for current question
  const handleAnswerSelect = (questionId: string, answer: any) => {
    const updated = { ...userAnswers, [questionId]: answer };
    setUserAnswers(updated);

    if (currentAttempt) {
      const updatedAttempt = { ...currentAttempt, answers: updated };
      setCurrentAttempt(updatedAttempt);

      // Sync to main attempts list
      const otherAttempts = attempts.filter((a) => a.id !== updatedAttempt.id);
      onUpdateAttempts([...otherAttempts, updatedAttempt]);
    }
  };

  // Toggle doubt flag
  const handleToggleDoubt = (qId: string) => {
    setDoubtQuestions((prev) => ({ ...prev, [qId]: !prev[qId] }));
  };

  // 5. Calculate Score and Submit Exam
  const handleFinishExam = (isDisqualified = false) => {
    if (!activeExam || !currentAttempt) return;

    let earnedPoints = 0;
    const totalMaxPoints = activeExam.questions.reduce((acc, q) => acc + q.points, 0) || 100;

    // Automatic grading for supported question types
    activeExam.questions.forEach((q) => {
      const studentAns = userAnswers[q.id];
      if (!studentAns) return;

      if (q.type === 'pilihan_ganda') {
        if (studentAns === q.correctAnswer) {
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

    const finalAttempt: ExamAttempt = {
      ...currentAttempt,
      status: isDisqualified ? 'violation_disqualified' : 'submitted',
      answers: userAnswers,
      submittedAt: new Date().toISOString(),
      scorePercentage,
      totalScore: earnedPoints,
      maxPossibleScore: totalMaxPoints,
      totalEarnedPoints: earnedPoints,
      totalMaxPoints,
      passedKkm: scorePercentage >= activeExam.kkm,
      violationCount,
      isGraded: true,
    };

    const otherAttempts = attempts.filter((a) => a.id !== finalAttempt.id);
    onUpdateAttempts([...otherAttempts, finalAttempt]);

    // Release wake lock & fullscreen
    if (wakeLockRef.current) {
      wakeLockRef.current.release?.().catch(() => {});
    }
    if (document.fullscreenElement && document.exitFullscreen) {
      document.exitFullscreen().catch(() => {});
    }

    // Trigger confetti on good completion
    if (!isDisqualified && scorePercentage >= activeExam.kkm) {
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
      });
    }

    setActiveExam(null);
    setCurrentAttempt(finalAttempt);
    setIsSubmitConfirmOpen(false);
  };

  // Helper time format
  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Check minimum submit time requirement
  const minSubmitSeconds = (activeExam?.minSubmitMinutes || 0) * 60;
  const totalExamDurationSeconds = (activeExam?.durationMinutes || 60) * 60;
  const elapsedSeconds = totalExamDurationSeconds - remainingSeconds;
  const canSubmitNow = elapsedSeconds >= minSubmitSeconds;
  const remainingSecondsUntilSubmitAllowed = Math.max(0, minSubmitSeconds - elapsedSeconds);

  // If student is NOT in exam room: Show Student Dashboard
  if (!activeExam) {
    const riwayatAttempts = attempts.filter(
      (a) => a.studentId === currentUser.id && a.status === 'submitted'
    );

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
                      const attempt = attempts.find(
                        (a) => a.examId === exam.id && a.studentId === currentUser.id
                      );
                      const isFinished = attempt?.status === 'submitted';
                      const isDisqualified = attempt?.status === 'violation_disqualified';
                      const isPassed = (attempt?.scorePercentage || 0) >= exam.kkm;

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
                                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800">
                                  Terkunci (Pelanggaran)
                                </span>
                              ) : attempt?.status === 'in_progress' ? (
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
                                    {exam.releaseScore ? `${attempt?.scorePercentage}` : 'Tersimpan'}
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
                                {exam.allowRetake && (
                                  <button
                                    onClick={() => handleStartExam(exam)}
                                    className="w-full sm:w-auto py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1 transition cursor-pointer"
                                  >
                                    <RotateCcw className="w-3.5 h-3.5" />
                                    <span>Remedial</span>
                                  </button>
                                )}
                              </div>
                            ) : isDisqualified ? (
                              <button
                                type="button"
                                onClick={() =>
                                  alert(
                                    'Ujian Anda terkunci karena pelanggaran. Silakan minta Pengawas / Guru di ruangan untuk menekan tombol "Reset" pada tabel pemantauan agar Anda dapat melanjutkan pengerjaan kembali.'
                                  )
                                }
                                className="w-full py-2.5 px-4 bg-rose-100 hover:bg-rose-200 text-rose-800 font-bold text-xs rounded-xl flex items-center justify-center gap-2 border border-rose-300 transition cursor-pointer"
                              >
                                <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
                                <span className="truncate">Terkunci (Minta Reset)</span>
                              </button>
                            ) : attempt?.status === 'in_progress' ? (
                              <button
                                id={`btn-start-exam-${exam.id}`}
                                onClick={() => handleStartExam(exam)}
                                className={`w-full py-2.5 px-4 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-xs transition cursor-pointer ${theme.btnCont}`}
                              >
                                <Play className="w-4 h-4 shrink-0" />
                                <span className="truncate">Lanjutkan Pengerjaan</span>
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
                            <th className="py-3 px-4 text-center">Aksi</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700">
                          {riwayatAttempts.map((attempt) => {
                            const exam = exams.find((e) => e.id === attempt.examId);
                            const kkm = exam?.kkm || 75;
                            const isPassed = (attempt.scorePercentage || 0) >= kkm;
                            const isScoreReleased = exam?.releaseScore !== false;
                            
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
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                    isScoreReleased
                                      ? isPassed
                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                        : 'bg-rose-50 text-rose-700 border border-rose-200'
                                      : 'bg-slate-100 text-slate-600 border border-slate-200'
                                  }`}>
                                    {isScoreReleased ? (isPassed ? 'TUNTAS' : 'REMEDIAL') : 'TERSIMPAN'}
                                  </span>
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
      className="fixed inset-0 z-50 bg-slate-100 flex flex-col justify-between overflow-hidden select-none"
    >
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
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs flex flex-col justify-between min-h-[500px]">
          <div>
            {/* Question Meta header */}
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-indigo-600 text-white rounded-lg font-black text-xs">
                  SOAL NO. {currentQuestionIndex + 1}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase bg-slate-100 text-slate-700">
                  {currentQ?.type.replace(/_/g, ' ')}
                </span>
                <span className="text-xs text-slate-500 font-semibold">
                  (Bobot: {currentQ?.points} Poin)
                </span>
              </div>

              <button
                type="button"
                onClick={() => handleToggleDoubt(currentQ.id)}
                className={`px-3 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                  isCurrentDoubt
                    ? 'bg-amber-500 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                }`}
              >
                <Flag className="w-3.5 h-3.5" />
                <span>{isCurrentDoubt ? 'Ragu-ragu (Ditandai)' : 'Tandai Ragu-ragu'}</span>
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

          {/* Bottom Navigation Buttons inside Question Box */}
          <div className="pt-6 mt-6 border-t border-slate-100 flex items-center justify-between">
            <button
              type="button"
              disabled={isFirstQuestion}
              onClick={() => setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-700 font-bold rounded-xl text-xs flex items-center gap-1.5 transition cursor-pointer disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Sebelumnya</span>
            </button>

            {!isLastQuestion && (
              <button
                type="button"
                onClick={() => setCurrentQuestionIndex((prev) => Math.min(totalQ - 1, prev + 1))}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition cursor-pointer shadow-xs"
              >
                <span>Berikutnya</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Right Column: Question Number Grid & Submit Button */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-xs text-slate-800 uppercase tracking-wider">
                Navigasi Nomor Soal
              </h3>
              <span className="text-[11px] font-semibold text-slate-500">
                {Object.keys(userAnswers).length}/{totalQ} Terisi
              </span>
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
                    onClick={() => setCurrentQuestionIndex(qIndex)}
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
                Ujian hanya dapat dikumpulkan setelah menit ke-{activeExam.minSubmitMinutes}.
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
                onClick={() => handleFinishExam(false)}
                className="py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl text-xs shadow-sm cursor-pointer"
              >
                Ya, Kumpulkan Sekarang
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
