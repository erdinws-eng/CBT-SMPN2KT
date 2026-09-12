import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  FileSpreadsheet,
  Upload,
  Download,
  Plus,
  Trash2,
  Calendar,
  Clock,
  Award,
  Lock,
  RefreshCw,
  Eye,
  CheckCircle,
  AlertTriangle,
  FileText,
  Printer,
  Search,
  BookOpen,
  ClipboardCheck,
  Image as ImageIcon,
  Video,
  X,
  Shuffle,
  ShieldAlert,
  Save,
  Check,
  ChevronRight,
  HelpCircle,
  Edit2,
  RotateCcw,
  Loader2,
  CheckCircle2,
  AlertCircle,
  LayoutDashboard,
  Menu,
  LogOut,
  Database,
  School,
  Users,
  GraduationCap,
  TrendingUp,
  UserCheck,
  Zap,
  Filter,
  Layers,
  History,
} from 'lucide-react';
import {
  Exam,
  Question,
  QuestionType,
  ExamAttempt,
  Subject,
  User,
  SchoolSettings,
} from '../types';
import {
  exportExamResultsToExcel,
  downloadTemplateSoalExcel,
  parseSoalExcel,
  parseDocxTextQuestions,
} from '../lib/excelExportImport';
import { getSupabaseConfig } from '../lib/supabase';

import RekapPrintModal from './RekapPrintModal';

interface GuruPanelProps {
  currentUser: User;
  exams: Exam[];
  subjects: Subject[];
  students: User[];
  attempts: ExamAttempt[];
  settings: SchoolSettings;
  onUpdateExams: (exams: Exam[]) => void;
  onUpdateAttempts: (attempts: ExamAttempt[]) => void;
  onOpenSupabaseModal?: () => void;
  onLogout?: () => void;
}

export default function GuruPanel({
  currentUser,
  exams,
  subjects,
  students,
  attempts,
  settings,
  onUpdateExams,
  onUpdateAttempts,
  onOpenSupabaseModal,
  onLogout,
}: GuruPanelProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'jadwal' | 'bank_soal' | 'monitoring' | 'rekap' | 'evaluasi' | 'riwayat_siswa'>('dashboard');
  const [searchAttemptQuery, setSearchAttemptQuery] = useState('');
  const [selectedClassFilter, setSelectedClassFilter] = useState('');
  const [riwayatSelectedExamId, setRiwayatSelectedExamId] = useState<string>('');
  const [riwayatSelectedClass, setRiwayatSelectedClass] = useState<string>('');
  const [isRiwayatModalOpen, setIsRiwayatModalOpen] = useState(false);
  const [selectedRiwayatStudent, setSelectedRiwayatStudent] = useState<{studentId: string, studentName: string, studentNisn: string} | null>(null);
  const [selectedExamId, setSelectedExamId] = useState<string>(exams[0]?.id || '');
  const [bankSoalSubjectFilter, setBankSoalSubjectFilter] = useState<string>('all');
  const [bankSoalSearchQuery, setBankSoalSearchQuery] = useState<string>('');
  const [bankSoalTypeFilter, setBankSoalTypeFilter] = useState<string>('all');
  const [rekapClassFilter, setRekapClassFilter] = useState<string>('Semua Kelas');
  const [evaluatingAttemptId, setEvaluatingAttemptId] = useState<string | null>(null);
  const [evaluatingScores, setEvaluatingScores] = useState<Record<string, number>>({});
  const [successMessage, setSuccessMessage] = useState('');
  const isSupabaseActive = getSupabaseConfig().isConfigured;

  // AI Question Generator Modal
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [aiSubject, setAiSubject] = useState(subjects[0]?.name || 'Ilmu Pengetahuan Alam (IPA)');
  const [aiTopic, setAiTopic] = useState('Sistem Ekskresi dan Nefron Ginjal Manusia');
  const [aiCount, setAiCount] = useState(5);
  const [aiDifficulty, setAiDifficulty] = useState('Sedang');
  const [aiTypes, setAiTypes] = useState<QuestionType[]>([
    'pilihan_ganda',
    'pilihan_ganda_kompleks',
    'isian',
    'essay',
    'menjodohkan',
    'benar_salah',
  ]);
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [aiErrorMessage, setAiErrorMessage] = useState('');

  // Manual Question Creator Modal
  const [isManualQuestionModalOpen, setIsManualQuestionModalOpen] = useState(false);
  const [newQuestionType, setNewQuestionType] = useState<QuestionType>('pilihan_ganda');
  const [newQuestionPrompt, setNewQuestionPrompt] = useState('');
  const [newQuestionPoints, setNewQuestionPoints] = useState(15);
  const [newQuestionMediaType, setNewQuestionMediaType] = useState<'image' | 'video' | 'none'>('none');
  const [newQuestionMediaUrl, setNewQuestionMediaUrl] = useState('');
  const [newQuestionOptions, setNewQuestionOptions] = useState<string[]>([
    'A. ',
    'B. ',
    'C. ',
    'D. ',
  ]);
  const [newQuestionCorrectAnswer, setNewQuestionCorrectAnswer] = useState('A. ');
  const [newQuestionMultiCorrect, setNewQuestionMultiCorrect] = useState<string[]>([]);
  const [newMatchingPairs, setNewMatchingPairs] = useState<{ premise: string; match: string }[]>([
    { premise: '', match: '' },
    { premise: '', match: '' },
    { premise: '', match: '' },
  ]);
  const [newTrueFalseStatements, setNewTrueFalseStatements] = useState<{ statement: string; answer: 'Benar' | 'Salah' }[]>([
    { statement: '', answer: 'Benar' },
    { statement: '', answer: 'Salah' },
  ]);
  const [newQuestionExplanation, setNewQuestionExplanation] = useState('');

  // Create Exam Modal
  const [isCreateExamModalOpen, setIsCreateExamModalOpen] = useState(false);
  const [newExamForm, setNewExamForm] = useState<Partial<Exam>>({
    title: '',
    subjectId: subjects[0]?.id || '',
    subjectName: subjects[0]?.name || '',
    targetClasses: ['8A', '8B'],
    startTime: new Date().toISOString().slice(0, 16),
    endTime: new Date(Date.now() + 3600 * 1000 * 48).toISOString().slice(0, 16),
    durationMinutes: 60,
    minSubmitMinutes: 10,
    kkm: 75,
    allowRetake: false,
    maxRetakes: 1,
    releaseScore: true,
    randomizeQuestions: true,
    randomizeOptions: true,
    lockdownBrowser: true,
    maxViolations: 1,
    token: 'CBT' + Math.floor(1000 + Math.random() * 9000),
    status: 'active',
  });

  // Print Rekap Nilai Modal (Lembar Rekap Kelas)
  const [isPrintRekapModalOpen, setIsPrintRekapModalOpen] = useState(false);

  // Edit Exam Modal State (CRUD Edit Ujian)
  const [isEditExamModalOpen, setIsEditExamModalOpen] = useState(false);
  const [editingExam, setEditingExam] = useState<Exam | null>(null);
  const [editExamForm, setEditExamForm] = useState({
    title: '',
    subjectId: '',
    targetClasses: ['8A', '8B'] as string[],
    durationMinutes: 60,
    startTime: '',
    endTime: '',
    kkm: 75,
    minSubmitMinutes: 10,
    randomizeQuestions: true,
    randomizeOptions: true,
    lockdownBrowser: true,
    releaseScore: true,
    allowRetake: false,
    maxRetakes: 1,
  });

  // Edit Question Modal State (CRUD Edit Soal)
  const [isEditQuestionModalOpen, setIsEditQuestionModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [editQuestionForm, setEditQuestionForm] = useState({
    prompt: '',
    points: 10,
    correctAnswer: '',
    correctAnswers: [] as string[],
    options: ['', '', '', ''],
    matchingPairs: [] as { premise: string; match: string }[],
    trueFalseStatements: [] as { statement: string; answer: 'Benar' | 'Salah' }[],
    explanation: '',
    essayRubric: '',
  });

  // Essay Grading Modal
  const [gradingAttempt, setGradingAttempt] = useState<ExamAttempt | null>(null);

  // Toast and Delete Confirmation States
  const [toasts, setToasts] = useState<
    Array<{ id: string; title: string; message: string; type: 'success' | 'delete' | 'error' }>
  >([]);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    id: string;
    title: string;
    subtitle?: string;
    type: 'exam' | 'question' | 'force_submit';
  }>({
    isOpen: false,
    id: '',
    title: '',
    type: 'exam',
  });

  const [isSavingNewExam, setIsSavingNewExam] = useState(false);
  const [isSavingEditExam, setIsSavingEditExam] = useState(false);
  const [isSavingNewQuestion, setIsSavingNewQuestion] = useState(false);
  const [isSavingEditQuestion, setIsSavingEditQuestion] = useState(false);

  const showToast = (title: string, message: string, type: 'success' | 'delete' | 'error' = 'success') => {
    const id = 'toast_' + Date.now() + Math.random().toString(36).substring(2, 6);
    setToasts((prev) => [...prev, { id, title, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const showSuccess = (msg: string) => {
    setSuccessMessage(msg);
    showToast('Berhasil', msg, 'success');
    setTimeout(() => setSuccessMessage(''), 4500);
  };

  const selectedExam = exams.find((e) => e.id === selectedExamId) || exams[0];
  const examAttempts = attempts.filter((a) => a.examId === selectedExam?.id);
  const uniqueRekapClasses = Array.from(new Set(examAttempts.map((a) => a.studentClass))).sort();
  const filteredRekapAttempts = examAttempts.filter((a) => rekapClassFilter === 'Semua Kelas' || a.studentClass === rekapClassFilter);

  const calculateQuestionScore = (q: Question, studentAns: any): number => {
    if (studentAns === undefined || studentAns === null || studentAns === '') return 0;
    if (q.type === 'pilihan_ganda') {
      if (String(studentAns).trim() === String(q.correctAnswer).trim()) return q.points;
    } else if (q.type === 'pilihan_ganda_kompleks') {
      if (Array.isArray(studentAns) && Array.isArray(q.correctAnswers)) {
        const matched = studentAns.filter((a) => q.correctAnswers?.includes(a)).length;
        return Math.round(q.points * (matched / q.correctAnswers.length));
      }
    } else if (q.type === 'isian') {
      if (String(studentAns).trim().toLowerCase() === String(q.correctAnswer).trim().toLowerCase()) return q.points;
    } else if (q.type === 'benar_salah') {
      if (q.trueFalseStatements && typeof studentAns === 'object') {
        let correctCount = 0;
        q.trueFalseStatements.forEach((stmt, idx) => {
          if (studentAns[idx] === stmt.answer) correctCount++;
        });
        return Math.round(q.points * (correctCount / q.trueFalseStatements.length));
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
        return Math.round(q.points * (correctCount / q.matchingPairs.length));
      }
    } else if (q.type === 'essay') {
      if (String(studentAns).trim().length > 10) return Math.round(q.points * 0.8);
    } else if (q.type === 'isi_kosong') {
      if (q.fillInTheBlanks && Array.isArray(studentAns)) {
        let correctCount = 0;
        q.fillInTheBlanks.forEach((ans, idx) => {
          if (String(studentAns[idx]).toLowerCase().trim() === String(ans).toLowerCase().trim()) correctCount++;
        });
        return Math.round(q.points * (correctCount / q.fillInTheBlanks.length));
      }
    } else if (q.type === 'susun_kata') {
      if (q.correctOrder && Array.isArray(studentAns)) {
        let correctCount = 0;
        q.correctOrder.forEach((word, idx) => {
          if (studentAns[idx] === word) correctCount++;
        });
        return Math.round(q.points * (correctCount / q.correctOrder.length));
      }
    }
    return 0;
  };

  const handleSaveEvaluasi = () => {
    if (!evaluatingAttemptId || !selectedExam) return;
    const attempt = examAttempts.find(a => a.id === evaluatingAttemptId);
    if (!attempt) return;

    let earnedPoints = 0;
    const totalMaxPoints = selectedExam.questions.reduce((sum, q) => sum + q.points, 0) || 100;
    
    selectedExam.questions.forEach((q) => {
      if (evaluatingScores[q.id] !== undefined) {
        earnedPoints += evaluatingScores[q.id];
      } else if (attempt.scores?.[q.id] !== undefined) {
        earnedPoints += attempt.scores[q.id];
      } else {
        earnedPoints += calculateQuestionScore(q, attempt.answers[q.id]);
      }
    });

    const scorePercentage = Math.min(100, Math.round((earnedPoints / totalMaxPoints) * 100));
    
    const updatedAttempt = {
      ...attempt,
      scores: { ...(attempt.scores || {}), ...evaluatingScores },
      totalScore: earnedPoints,
      totalEarnedPoints: earnedPoints,
      scorePercentage,
      passedKkm: scorePercentage >= (selectedExam.kkm || 75),
    };

    onUpdateAttempts(attempts.map(a => a.id === updatedAttempt.id ? updatedAttempt : a));
    setEvaluatingAttemptId(null);
    setEvaluatingScores({});
    showToast('Berhasil', 'Evaluasi soal berhasil disimpan dan nilai akhir telah diperbarui.', 'success');
  };

  // AI Generator Submit Handler (calls server.ts /api/ai/generate-questions)
  const handleGenerateAiQuestions = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiTopic.trim()) {
      setAiErrorMessage('Materi pokok / topik soal wajib diisi');
      return;
    }

    setIsAiGenerating(true);
    setAiErrorMessage('');
    try {
      const response = await fetch('/api/ai/generate-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: aiSubject,
          gradeLevel: 'SMP Kelas 8',
          topic: aiTopic,
          count: aiCount,
          questionTypes: aiTypes,
          difficulty: aiDifficulty,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Gagal menghasilkan soal dengan AI.');
      }

      const generated: Question[] = data.questions;

      // Append to selected exam questions
      if (selectedExam) {
        const updatedExams = exams.map((ex) =>
          ex.id === selectedExam.id
            ? { ...ex, questions: [...ex.questions, ...generated] }
            : ex
        );
        onUpdateExams(updatedExams);
        showSuccess(`Berhasil membuat ${generated.length} butir soal variatif otomatis dengan AI!`);
        setIsAiModalOpen(false);
      }
    } catch (err: any) {
      const errorMsg = err?.message || 'Koneksi ke AI server sedang bermasalah. Silakan coba sesaat lagi.';
      setAiErrorMessage(errorMsg);
      showToast('Gagal Menghasilkan Soal AI', errorMsg, 'error');
    } finally {
      setIsAiGenerating(false);
    }
  };

  // Upload Soal Excel Handler
  const handleUploadSoalExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedExam) return;

    try {
      const parsed = await parseSoalExcel(file);
      if (parsed.length === 0) {
        alert('File Excel tidak memiliki baris soal yang valid.');
        return;
      }
      const updatedExams = exams.map((ex) =>
        ex.id === selectedExam.id
          ? { ...ex, questions: [...ex.questions, ...parsed] }
          : ex
      );
      onUpdateExams(updatedExams);
      showSuccess(`Berhasil mengimpor ${parsed.length} butir soal dari Excel (.xlsx)!`);
    } catch (err: any) {
      alert('Gagal membaca Excel: ' + (err?.message || 'Format tidak sesuai'));
    }
    e.target.value = '';
  };

  // Upload Soal DOCX/Doc/Text Handler
  const handleUploadDocxText = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedExam) return;

    try {
      const parsed = await parseDocxTextQuestions(file);
      if (parsed.length === 0) {
        alert('Tidak dapat mengekstrak soal dari file ini. Pastikan format teks memuat nomor soal (1. 2. dll).');
        return;
      }
      const updatedExams = exams.map((ex) =>
        ex.id === selectedExam.id
          ? { ...ex, questions: [...ex.questions, ...parsed] }
          : ex
      );
      onUpdateExams(updatedExams);
      showSuccess(`Berhasil membaca ${parsed.length} soal dari dokumen "${file.name}"!`);
    } catch (err: any) {
      alert('Gagal memproses dokumen: ' + (err?.message || 'Error'));
    }
    e.target.value = '';
  };

  // In-App Delete / Action Executor
  const executeDelete = () => {
    if (!deleteConfirm.isOpen) return;

    if (deleteConfirm.type === 'exam') {
      const examId = deleteConfirm.id;
      const examTitle = deleteConfirm.title;
      const updated = exams.filter((e) => e.id !== examId);
      onUpdateExams(updated);
      if (selectedExamId === examId) {
        setSelectedExamId(updated[0]?.id || '');
      }
      showToast('Paket Ujian Dihapus', `Paket ujian "${examTitle}" berhasil dihapus.`, 'delete');
    } else if (deleteConfirm.type === 'question') {
      if (selectedExam) {
        const qId = deleteConfirm.id;
        const updatedExams = exams.map((ex) =>
          ex.id === selectedExam.id
            ? { ...ex, questions: ex.questions.filter((q) => q.id !== qId) }
            : ex
        );
        onUpdateExams(updatedExams);
        showToast('Butir Soal Dihapus', 'Butir soal berhasil dihapus dari bank soal.', 'delete');
      }
    } else if (deleteConfirm.type === 'force_submit') {
      const attemptId = deleteConfirm.id;
      const studentName = deleteConfirm.title;
      const updated = attempts.map((att) => {
        if (att.id === attemptId) {
          return {
            ...att,
            status: 'submitted' as const,
            submittedAt: new Date().toISOString(),
          };
        }
        return att;
      });
      onUpdateAttempts(updated);
      showToast('Ujian Dikumpulkan', `Sesi ujian ${studentName} berhasil dikumpulkan paksa.`, 'delete');
    }

    setDeleteConfirm({ isOpen: false, id: '', title: '', type: 'exam' });
  };

  // Manual Question Save Handler
  const handleSaveManualQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestionPrompt.trim() || !selectedExam) return;

    let finalOptions: string[] | undefined = undefined;
    let finalCorrectAnswer: string | undefined = undefined;
    let finalCorrectAnswers: string[] | undefined = undefined;
    let finalMatchingPairs: { premise: string; match: string }[] | undefined = undefined;
    let finalTrueFalse: { statement: string; answer: 'Benar' | 'Salah' }[] | undefined = undefined;
    let finalFillInTheBlanks: string[] | undefined = undefined;
    let finalJumbledWords: string[] | undefined = undefined;
    let finalCorrectOrder: string[] | undefined = undefined;

    if (newQuestionType === 'pilihan_ganda') {
      finalOptions = newQuestionOptions.filter((o) => o.trim().length > 0);
      finalCorrectAnswer = newQuestionCorrectAnswer;
    } else if (newQuestionType === 'pilihan_ganda_kompleks') {
      finalOptions = newQuestionOptions.filter((o) => o.trim().length > 0);
      finalCorrectAnswers = newQuestionMultiCorrect.length > 0 ? newQuestionMultiCorrect : [newQuestionOptions[0]];
      finalCorrectAnswer = finalCorrectAnswers[0];
    } else if (newQuestionType === 'menjodohkan') {
      finalMatchingPairs = newMatchingPairs.filter((p) => p.premise.trim().length > 0 && p.match.trim().length > 0);
      if (finalMatchingPairs.length === 0) {
        showToast('Gagal Simpan', 'Mohon isi minimal 1 pasangan domain (soal) dan kodomain (jawaban).', 'error');
        return;
      }
    } else if (newQuestionType === 'benar_salah') {
      finalTrueFalse = newTrueFalseStatements.filter((s) => s.statement.trim().length > 0);
      if (finalTrueFalse.length === 0) {
        showToast('Gagal Simpan', 'Mohon isi minimal 1 pernyataan untuk soal Benar dan Salah.', 'error');
        return;
      }
    } else if (newQuestionType === 'isian') {
      finalCorrectAnswer = newQuestionCorrectAnswer;
    } else if (newQuestionType === 'isi_kosong') {
      finalFillInTheBlanks = newQuestionFillInTheBlanks.filter((v) => v.trim().length > 0);
    } else if (newQuestionType === 'susun_kata') {
      finalJumbledWords = newQuestionJumbledWords.filter((v) => v.trim().length > 0);
      finalCorrectOrder = newQuestionCorrectOrder.filter((v) => v.trim().length > 0);
    }

    setIsSavingNewQuestion(true);
    await new Promise((r) => setTimeout(r, 350));

    const newQ: Question = {
      id: 'q_manual_' + Date.now(),
      type: newQuestionType,
      prompt: newQuestionPrompt,
      points: Number(newQuestionPoints) || 10,
      mediaType: newQuestionMediaType,
      mediaUrl: newQuestionMediaUrl.trim() || undefined,
      options: finalOptions,
      correctAnswer: finalCorrectAnswer,
      correctAnswers: finalCorrectAnswers,
      matchingPairs: finalMatchingPairs,
      trueFalseStatements: finalTrueFalse,
      fillInTheBlanks: finalFillInTheBlanks,
      jumbledWords: finalJumbledWords,
      correctOrder: finalCorrectOrder,
      explanation: newQuestionExplanation.trim() || undefined,
    };

    const updatedExams = exams.map((ex) =>
      ex.id === selectedExam.id ? { ...ex, questions: [...ex.questions, newQ] } : ex
    );
    onUpdateExams(updatedExams);
    setIsSavingNewQuestion(false);
    showToast('Soal Tersimpan', 'Soal berhasil ditambahkan ke bank soal ujian!', 'success');
    setIsManualQuestionModalOpen(false);
    setNewQuestionPrompt('');
    setNewQuestionMediaUrl('');
    setNewQuestionMultiCorrect([]);
    setNewMatchingPairs([
      { premise: '', match: '' },
      { premise: '', match: '' },
      { premise: '', match: '' },
    ]);
    setNewTrueFalseStatements([
      { statement: '', answer: 'Benar' },
      { statement: '', answer: 'Salah' },
    ]);
  };

  // Open Edit Exam Modal
  const handleOpenEditExam = (exam: Exam) => {
    setEditingExam(exam);
    setEditExamForm({
      title: exam.title,
      subjectId: exam.subjectId,
      targetClasses: exam.targetClasses || ['8A', '8B'],
      durationMinutes: exam.durationMinutes,
      startTime: exam.startTime ? exam.startTime.slice(0, 16) : '',
      endTime: exam.endTime ? exam.endTime.slice(0, 16) : '',
      kkm: exam.kkm,
      minSubmitMinutes: exam.minSubmitMinutes,
      randomizeQuestions: exam.randomizeQuestions,
      randomizeOptions: exam.randomizeOptions,
      lockdownBrowser: exam.lockdownBrowser,
      releaseScore: exam.releaseScore,
      allowRetake: exam.allowRetake,
      maxRetakes: exam.maxRetakes || 1,
    });
    setIsEditExamModalOpen(true);
  };

  // Save Edit Exam Handler
  const handleSaveEditExam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingExam) return;
    const sub = subjects.find((s) => s.id === editExamForm.subjectId);

    setIsSavingEditExam(true);
    await new Promise((r) => setTimeout(r, 350));

    const updated = exams.map((ex) => {
      if (ex.id === editingExam.id) {
        return {
          ...ex,
          title: editExamForm.title,
          subjectId: editExamForm.subjectId,
          subjectName: sub ? sub.name : ex.subjectName,
          targetClasses: editExamForm.targetClasses,
          durationMinutes: Number(editExamForm.durationMinutes),
          startTime: editExamForm.startTime,
          endTime: editExamForm.endTime,
          kkm: Number(editExamForm.kkm),
          minSubmitMinutes: Number(editExamForm.minSubmitMinutes),
          randomizeQuestions: editExamForm.randomizeQuestions,
          randomizeOptions: editExamForm.randomizeOptions,
          lockdownBrowser: editExamForm.lockdownBrowser,
          releaseScore: editExamForm.releaseScore,
          allowRetake: editExamForm.allowRetake,
          maxRetakes: Number(editExamForm.maxRetakes) || 1,
        };
      }
      return ex;
    });

    onUpdateExams(updated);
    setIsSavingEditExam(false);
    setIsEditExamModalOpen(false);
    setEditingExam(null);
    showToast('Ujian Diperbarui', `Pengaturan ujian "${editExamForm.title}" berhasil diperbarui!`, 'success');
  };

  // Delete Exam Handler
  const handleDeleteExam = (examId: string, examTitle: string) => {
    setDeleteConfirm({
      isOpen: true,
      id: examId,
      title: examTitle,
      type: 'exam',
      subtitle: 'Paket Ujian',
    });
  };

  // Open Edit Question Modal
  const handleOpenEditQuestion = (q: Question) => {
    setEditingQuestion(q);
    setEditQuestionForm({
      prompt: q.prompt,
      points: q.points || 10,
      correctAnswer: q.correctAnswer || '',
      correctAnswers: q.correctAnswers || (q.correctAnswer ? [q.correctAnswer] : []),
      options: q.options && q.options.length > 0 ? [...q.options] : ['A. ', 'B. ', 'C. ', 'D. '],
      matchingPairs:
        q.matchingPairs && q.matchingPairs.length > 0
          ? q.matchingPairs.map((p) => ({ ...p }))
          : [
              { premise: '', match: '' },
              { premise: '', match: '' },
            ],
      trueFalseStatements:
        q.trueFalseStatements && q.trueFalseStatements.length > 0
          ? q.trueFalseStatements.map((s) => ({ ...s }))
          : [
              { statement: '', answer: 'Benar' },
              { statement: '', answer: 'Salah' },
            ],
      explanation: q.explanation || '',
      essayRubric: q.essayRubric || '',
    });
    setIsEditQuestionModalOpen(true);
  };

  // Save Edit Question Handler
  const handleSaveEditQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedExam || !editingQuestion) return;

    setIsSavingEditQuestion(true);
    await new Promise((r) => setTimeout(r, 350));

    const updatedQuestions = selectedExam.questions.map((q) => {
      if (q.id === editingQuestion.id) {
        let finalOptions = q.options ? editQuestionForm.options.filter((opt) => opt.trim().length > 0) : undefined;
        let finalCorrectAnswer = editQuestionForm.correctAnswer;
        let finalCorrectAnswers = editQuestionForm.correctAnswers;
        let finalMatchingPairs = q.matchingPairs;
        let finalTrueFalse = q.trueFalseStatements;

        if (q.type === 'pilihan_ganda_kompleks') {
          finalOptions = editQuestionForm.options.filter((opt) => opt.trim().length > 0);
          finalCorrectAnswers = editQuestionForm.correctAnswers.length > 0 ? editQuestionForm.correctAnswers : [editQuestionForm.options[0]];
          finalCorrectAnswer = finalCorrectAnswers[0];
        } else if (q.type === 'menjodohkan') {
          finalMatchingPairs = editQuestionForm.matchingPairs.filter((p) => p.premise.trim() && p.match.trim());
        } else if (q.type === 'benar_salah') {
          finalTrueFalse = editQuestionForm.trueFalseStatements.filter((s) => s.statement.trim());
        }

        return {
          ...q,
          prompt: editQuestionForm.prompt,
          points: Number(editQuestionForm.points),
          correctAnswer: finalCorrectAnswer,
          correctAnswers: finalCorrectAnswers,
          options: finalOptions,
          matchingPairs: finalMatchingPairs,
          trueFalseStatements: finalTrueFalse,
          explanation: editQuestionForm.explanation.trim() || undefined,
          essayRubric: editQuestionForm.essayRubric.trim() || undefined,
        };
      }
      return q;
    });

    const updatedExam = { ...selectedExam, questions: updatedQuestions };
    onUpdateExams(exams.map((ex) => (ex.id === selectedExam.id ? updatedExam : ex)));
    setIsSavingEditQuestion(false);
    setIsEditQuestionModalOpen(false);
    setEditingQuestion(null);
    showToast('Soal Diperbarui', 'Butir soal berhasil diperbarui!', 'success');
  };

  // Delete Question Handler
  const handleDeleteQuestion = (qId: string, promptPreview?: string) => {
    if (!selectedExam) return;
    setDeleteConfirm({
      isOpen: true,
      id: qId,
      title: promptPreview ? promptPreview.slice(0, 60) + (promptPreview.length > 60 ? '...' : '') : 'Butir Soal',
      type: 'question',
      subtitle: 'Butir Soal Ujian',
    });
  };

  // Create New Exam Handler
  const handleSaveNewExam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExamForm.title || !newExamForm.subjectId) return;

    setIsSavingNewExam(true);
    await new Promise((r) => setTimeout(r, 350));

    const sub = subjects.find((s) => s.id === newExamForm.subjectId);
    const createdExam: Exam = {
      id: 'exam_' + Date.now(),
      title: newExamForm.title || 'Ujian Baru',
      subjectId: newExamForm.subjectId,
      subjectName: sub ? sub.name : 'Mata Pelajaran',
      teacherId: currentUser.id,
      teacherName: currentUser.name,
      targetClasses: newExamForm.targetClasses || ['8A', '8B'],
      startTime: newExamForm.startTime || new Date().toISOString(),
      endTime: newExamForm.endTime || new Date(Date.now() + 3600 * 1000 * 24).toISOString(),
      durationMinutes: Number(newExamForm.durationMinutes) || 60,
      minSubmitMinutes: Number(newExamForm.minSubmitMinutes) || 10,
      kkm: Number(newExamForm.kkm) || 75,
      allowRetake: Boolean(newExamForm.allowRetake),
      maxRetakes: Number(newExamForm.maxRetakes) || 1,
      releaseScore: Boolean(newExamForm.releaseScore),
      randomizeQuestions: Boolean(newExamForm.randomizeQuestions),
      randomizeOptions: Boolean(newExamForm.randomizeOptions),
      lockdownBrowser: Boolean(newExamForm.lockdownBrowser),
      maxViolations: Number(newExamForm.maxViolations) || 3,
      token: 'DIRECT',
      status: 'active',
      createdAt: new Date().toISOString(),
      questions: [],
    };

    onUpdateExams([createdExam, ...exams]);
    setSelectedExamId(createdExam.id);
    setIsSavingNewExam(false);
    showToast('Ujian Dibuat', `Paket ujian "${createdExam.title}" berhasil dibuat! Silakan tambahkan butir soal.`, 'success');
    setIsCreateExamModalOpen(false);
  };

  // Toggle Release Score
  const handleToggleReleaseScore = (examId: string) => {
    const target = exams.find((e) => e.id === examId);
    if (!target) return;
    const newStatus = !target.releaseScore;
    const updated = exams.map((e) =>
      e.id === examId ? { ...e, releaseScore: newStatus } : e
    );
    onUpdateExams(updated);
    showSuccess(`Status nilai berhasil diubah: ${newStatus ? 'Nilai Dirilis' : 'Nilai Disembunyikan'}`);
  };

  // Force Submit Student Exam (from Live Monitor)
  const handleForceSubmit = (attemptId: string, studentName?: string) => {
    setDeleteConfirm({
      isOpen: true,
      id: attemptId,
      title: studentName || 'Siswa Terpilih',
      type: 'force_submit',
      subtitle: 'Paksa Pengumpulan Ujian',
    });
  };

  // Tindakan Pengawas: Reset untuk Membuka Ujian Siswa yang Terdampak Pelanggaran
  const handleResetStudentExam = (attemptId: string, studentName: string) => {
    const updated = attempts.map((att) => {
      if (att.id === attemptId) {
        return {
          ...att,
          violationCount: 0,
          status: 'in_progress' as const,
          submittedAt: undefined,
          answers: {},
          scores: {},
          scorePercentage: 0,
          totalScore: 0,
          totalEarnedPoints: 0,
          passedKkm: false,
        };
      }
      return att;
    });
    onUpdateAttempts(updated);
    showSuccess(`Ujian siswa "${studentName}" berhasil di-reset. Ujian dikosongkan dan siswa mengerjakan dari awal.`);
  };

  return (
    <div id="guru-panel-layout" className="min-h-screen bg-slate-50 flex">
      {/* Mobile Drawer Overlay */}
      {isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 bg-slate-950/60 z-40 lg:hidden backdrop-blur-xs transition-opacity"
        />
      )}

      {/* Collapsible Sidebar (mirip panel admin) */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 bg-slate-900 text-slate-300 transition-all duration-300 ease-in-out flex flex-col justify-between border-r border-slate-800 ${
          isSidebarOpen ? 'w-64 translate-x-0' : '-translate-x-full lg:translate-x-0 lg:w-20'
        }`}
      >
        {/* Sidebar Top: Logo & Title */}
        <div>
          <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800">
            <div className="flex items-center gap-3 overflow-hidden">
              {settings.logoUrl ? (
                <div className="w-10 h-10 flex items-center justify-center shrink-0">
                  <img
                    src={settings.logoUrl}
                    alt="Logo Sekolah"
                    className="w-full h-full object-contain"
                  />
                </div>
              ) : (
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-700 flex items-center justify-center text-white shrink-0 shadow-md shadow-indigo-950/50">
                  <School className="w-5 h-5" />
                </div>
              )}
              {isSidebarOpen && (
                <div className="min-w-0 transition-opacity">
                  <span className="font-black text-white text-sm tracking-tight block truncate">
                    {settings.appName || 'SMART CBT'}
                  </span>
                  <span className="text-[10px] text-indigo-400 font-bold block uppercase tracking-wider truncate">
                    Panel Guru & Pengawas
                  </span>
                </div>
              )}
            </div>
            {/* Close button on mobile */}
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg lg:hidden cursor-pointer"
              title="Tutup Menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1.5 text-xs font-semibold">
            {/* Menu Dashboard */}
            <button
              id="menu-sidebar-guru-dashboard"
              onClick={() => {
                setActiveTab('dashboard');
                if (window.innerWidth < 1024) setIsSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition cursor-pointer ${
                activeTab === 'dashboard'
                  ? 'bg-white text-slate-900 font-extrabold shadow-sm'
                  : 'text-slate-300 hover:bg-slate-800/80 hover:text-white font-medium'
              }`}
              title="Dashboard"
            >
              <LayoutDashboard className={`w-5 h-5 shrink-0 ${activeTab === 'dashboard' ? 'text-slate-900' : 'text-slate-400'}`} />
              {isSidebarOpen && <span className="truncate">Dashboard</span>}
            </button>

            {/* Menu Jadwal Ujian */}
            <button
              id="menu-sidebar-guru-jadwal"
              onClick={() => {
                setActiveTab('jadwal');
                if (window.innerWidth < 1024) setIsSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition cursor-pointer ${
                activeTab === 'jadwal'
                  ? 'bg-white text-slate-900 font-extrabold shadow-sm'
                  : 'text-slate-300 hover:bg-slate-800/80 hover:text-white font-medium'
              }`}
              title="Manajemen Jadwal Ujian"
            >
              <Calendar className={`w-5 h-5 shrink-0 ${activeTab === 'jadwal' ? 'text-slate-900' : 'text-slate-400'}`} />
              {isSidebarOpen && <span className="truncate">Jadwal Ujian</span>}
            </button>

            {/* Menu Bank Soal */}
            <button
              id="menu-sidebar-guru-bank-soal"
              onClick={() => {
                setActiveTab('bank_soal');
                if (window.innerWidth < 1024) setIsSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition cursor-pointer ${
                activeTab === 'bank_soal'
                  ? 'bg-white text-slate-900 font-extrabold shadow-sm'
                  : 'text-slate-300 hover:bg-slate-800/80 hover:text-white font-medium'
              }`}
              title="Bank Soal"
            >
              <BookOpen className={`w-5 h-5 shrink-0 ${activeTab === 'bank_soal' ? 'text-slate-900' : 'text-slate-400'}`} />
              {isSidebarOpen && <span className="truncate">Bank Soal</span>}
            </button>

            {/* Menu Live Monitor & Anti-Curang */}
            <button
              id="menu-sidebar-guru-monitoring"
              onClick={() => {
                setActiveTab('monitoring');
                if (window.innerWidth < 1024) setIsSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition cursor-pointer ${
                activeTab === 'monitoring'
                  ? 'bg-white text-slate-900 font-extrabold shadow-sm'
                  : 'text-slate-300 hover:bg-slate-800/80 hover:text-white font-medium'
              }`}
              title="Live Monitor & Anti-Curang"
            >
              <ShieldAlert className={`w-5 h-5 shrink-0 ${activeTab === 'monitoring' ? 'text-slate-900' : 'text-slate-400'}`} />
              {isSidebarOpen && <span className="truncate">Live Monitoring</span>}
            </button>

            {/* Menu Laporan & Rekap Nilai */}
            <button
              id="menu-sidebar-guru-rekap"
              onClick={() => {
                setActiveTab('rekap');
                if (window.innerWidth < 1024) setIsSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition cursor-pointer ${
                activeTab === 'rekap'
                  ? 'bg-white text-slate-900 font-extrabold shadow-sm'
                  : 'text-slate-300 hover:bg-slate-800/80 hover:text-white font-medium'
              }`}
              title="Laporan & Rekap Nilai"
            >
              <Award className={`w-5 h-5 shrink-0 ${activeTab === 'rekap' ? 'text-slate-900' : 'text-slate-400'}`} />
              {isSidebarOpen && <span className="truncate">Rekap & Laporan</span>}
            </button>

            {/* Menu Evaluasi Soal */}
            <button
              id="menu-sidebar-guru-evaluasi"
              onClick={() => {
                setActiveTab('evaluasi');
                if (window.innerWidth < 1024) setIsSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition cursor-pointer ${
                activeTab === 'evaluasi'
                  ? 'bg-white text-slate-900 font-extrabold shadow-sm'
                  : 'text-slate-300 hover:bg-slate-800/80 hover:text-white font-medium'
              }`}
              title="Evaluasi Soal Essai"
            >
              <ClipboardCheck className={`w-5 h-5 shrink-0 ${activeTab === 'evaluasi' ? 'text-slate-900' : 'text-slate-400'}`} />
              {isSidebarOpen && <span className="truncate">Evaluasi Soal</span>}
            </button>

            {/* Menu Riwayat Siswa */}
            <button
              id="menu-sidebar-guru-riwayat"
              onClick={() => {
                setActiveTab('riwayat_siswa');
                if (window.innerWidth < 1024) setIsSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition cursor-pointer ${
                activeTab === 'riwayat_siswa'
                  ? 'bg-white text-slate-900 font-extrabold shadow-sm'
                  : 'text-slate-300 hover:bg-slate-800/80 hover:text-white font-medium'
              }`}
              title="Riwayat Ujian Siswa"
            >
              <History className={`w-5 h-5 shrink-0 ${activeTab === 'riwayat_siswa' ? 'text-slate-900' : 'text-slate-400'}`} />
              {isSidebarOpen && <span className="truncate">Riwayat Ujian Siswa</span>}
            </button>
          </nav>
        </div>
      </aside>

      {/* Main Content Column */}
      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${isSidebarOpen ? 'lg:pl-64' : 'lg:pl-20'}`}>
        {/* Guru Topbar */}
        <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 py-3 min-h-[4rem] px-4 sm:px-6 flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-3 min-w-0">
            {/* Hamburger Button untuk Buka Tutup Sidebar */}
            <button
              id="btn-toggle-guru-sidebar"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition cursor-pointer shrink-0"
              title="Buka / Tutup Sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="min-w-0">
              <h2 className="font-extrabold text-slate-900 text-sm sm:text-base leading-tight truncate">
                {activeTab === 'dashboard' && 'Dashboard Guru & Pengawas'}
                {activeTab === 'jadwal' && 'Manajemen Jadwal Ujian'}
                {activeTab === 'bank_soal' && 'Bank Soal'}
                {activeTab === 'monitoring' && 'Live Monitor & Anti-Curang'}
                {activeTab === 'rekap' && 'Laporan Nilai & Cetak PDF'}
                {activeTab === 'evaluasi' && 'Evaluasi Soal Essai'}
                {activeTab === 'riwayat_siswa' && 'Riwayat & Remedial Siswa'}
              </h2>
            </div>
          </div>

          {/* Sisi Kanan: Profil Guru & Logout */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Profil Guru */}
            <div className="px-3 py-2 bg-slate-50 rounded-xl border border-slate-200">
              <div className="text-right hidden sm:block max-w-[250px]">
                <div className="text-[10px] text-slate-500 font-semibold truncate leading-tight mb-0.5">
                  {settings.schoolName}
                </div>
                <div className="text-xs font-bold text-slate-800 leading-tight truncate">
                  {currentUser.name}
                </div>
                <div className="text-[10px] text-slate-600 truncate mt-0.5">
                  {currentUser.subjectName || 'Guru Pengampu'}
                </div>
              </div>
            </div>

            {/* Logout Button */}
            {onLogout && (
              <button
                id="btn-guru-logout"
                onClick={onLogout}
                className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl border border-slate-200 transition cursor-pointer"
                title="Keluar dari Sistem"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </header>

        {/* Main Content Body */}
        <main className="p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
          {/* Success Notification */}
          {successMessage && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-sm font-semibold flex items-center justify-between shadow-xs">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>{successMessage}</span>
              </div>
              <button onClick={() => setSuccessMessage('')} className="text-emerald-600 hover:text-emerald-800 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 0: DASHBOARD GURU & PENGAWAS                          */}
          {/* ========================================================= */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              {/* 1. Welcome Greeting Banner */}
              <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-slate-800">
                <div className="absolute -top-24 -right-24 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-rose-600/10 rounded-full blur-3xl pointer-events-none" />

                <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2.5 py-0.5 rounded-full">
                        Panel Guru & Pengawas Asesmen
                      </span>
                      <span className="text-[10px] font-semibold text-slate-400">
                        T.A. {settings.academicYear} • Semester {settings.semester}
                      </span>
                    </div>
                    <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-white tracking-tight">
                      Selamat Datang, {currentUser.name}
                    </h1>
                    <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
                      Kelola butir soal berstandar AKM, jadwalkan paket ujian, dan pantau kejujuran pengerjaan siswa secara real-time melalui sistem anti-curang.
                    </p>
                  </div>

                  {/* Quick Action Buttons on Welcome Banner */}
                  <div className="flex flex-col items-stretch gap-2.5 shrink-0 min-w-[220px]">
                    <button
                      id="btn-dash-create-exam"
                      onClick={() => setIsCreateExamModalOpen(true)}
                      className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-extrabold transition cursor-pointer shadow-lg shadow-indigo-900/40 flex items-center gap-2 justify-center"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Buat Ujian Baru</span>
                    </button>
                    <button
                      id="btn-dash-ai-generator"
                      onClick={() => setActiveTab('bank_soal')}
                      className="px-4 py-2.5 bg-slate-800/80 hover:bg-slate-700 text-white border border-slate-700 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 justify-center"
                    >
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      <span>AI Generator Soal</span>
                    </button>
                    <button
                      id="btn-dash-monitoring"
                      onClick={() => setActiveTab('monitoring')}
                      className="px-4 py-2.5 bg-slate-800/80 hover:bg-slate-700 text-white border border-slate-700 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 justify-center"
                    >
                      <ShieldAlert className="w-4 h-4 text-emerald-400" />
                      <span>Live Monitor</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* 2. Key Metrics Grid (4 Stat Cards) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                {/* Stat Card 1: Paket Ujian */}
                <div
                  onClick={() => setActiveTab('jadwal')}
                  className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs hover:border-indigo-400 hover:shadow-md transition cursor-pointer group"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Paket Ujian</span>
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-110 transition shrink-0">
                      <Calendar className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-slate-900">
                    {exams.length}
                  </div>
                  <div className="mt-1 flex items-center justify-between text-xs text-slate-500">
                    <span>{exams.filter((e) => e.status === 'active').length} Berstatus Aktif</span>
                    <span className="text-indigo-600 font-bold group-hover:translate-x-0.5 transition">Kelola →</span>
                  </div>
                </div>

                {/* Stat Card 2: Total Butir Soal */}
                <div
                  onClick={() => setActiveTab('bank_soal')}
                  className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs hover:border-emerald-400 hover:shadow-md transition cursor-pointer group"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Bank Butir Soal</span>
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition shrink-0">
                      <BookOpen className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-slate-900">
                    {exams.reduce((sum, e) => sum + (e.questions?.length || 0), 0)}
                  </div>
                  <div className="mt-1 flex items-center justify-between text-xs text-slate-500">
                    <span>{selectedExam ? `${selectedExam.questions.length} soal terpilih` : 'Di seluruh paket'}</span>
                    <span className="text-emerald-600 font-bold group-hover:translate-x-0.5 transition">Buka Soal →</span>
                  </div>
                </div>

                {/* Stat Card 3: Sesi & Peserta Ujian */}
                <div
                  onClick={() => setActiveTab('monitoring')}
                  className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs hover:border-blue-400 hover:shadow-md transition cursor-pointer group"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Peserta & Sesi</span>
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition shrink-0">
                      <Users className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-slate-900 flex items-center gap-2">
                    <span>{attempts.length}</span>
                    {attempts.some((a) => a.status === 'in_progress') && (
                      <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                        {attempts.filter((a) => a.status === 'in_progress').length} Aktif
                      </span>
                    )}
                  </div>
                  <div className="mt-1 flex items-center justify-between text-xs text-slate-500">
                    <span>{attempts.filter((a) => a.status === 'submitted').length} Selesai Dikumpulkan</span>
                    <span className="text-blue-600 font-bold group-hover:translate-x-0.5 transition">Monitor →</span>
                  </div>
                </div>

                {/* Stat Card 4: Rata-Rata Nilai & KKM */}
                <div
                  onClick={() => setActiveTab('rekap')}
                  className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs hover:border-amber-400 hover:shadow-md transition cursor-pointer group"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Rerata Nilai Siswa</span>
                    <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-110 transition shrink-0">
                      <Award className="w-5 h-5" />
                    </div>
                  </div>
                  {(() => {
                    const submitted = attempts.filter((a) => a.status === 'submitted');
                    const avg = submitted.length > 0 ? submitted.reduce((sum, a) => sum + (a.scorePercentage || a.totalScore || 0), 0) / submitted.length : 0;
                    const passing = submitted.filter((a) => {
                      const exam = exams.find((e) => e.id === a.examId);
                      return a.passedKkm ?? ((a.scorePercentage || a.totalScore || 0) >= (exam?.kkm || 75));
                    }).length;
                    const passRate = submitted.length > 0 ? Math.round((passing / submitted.length) * 100) : 0;

                    return (
                      <>
                        <div className="text-2xl sm:text-3xl font-black text-slate-900">
                          {avg.toFixed(1)} <span className="text-xs font-bold text-slate-400">/ 100</span>
                        </div>
                        <div className="mt-1 flex items-center justify-between text-xs text-slate-500">
                          <span>{passing}/{submitted.length} Lulus KKM ({passRate}%)</span>
                          <span className="text-amber-600 font-bold group-hover:translate-x-0.5 transition">Rekap →</span>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>

              {/* 3. Main Split Section: Daftar Paket Ujian & Pemantauan Kilat */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left Column: Daftar Paket Ujian (7 Cols) */}
                <div className="lg:col-span-7 space-y-6">
                  <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs">
                    <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                      <div>
                        <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-indigo-600" />
                          <span>Paket Ujian & Jadwal Pelaksanaan</span>
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Daftar paket asesmen yang Anda ampu untuk peserta didik
                        </p>
                      </div>
                      <button
                        onClick={() => setIsCreateExamModalOpen(true)}
                        className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Ujian Baru</span>
                      </button>
                    </div>

                    <div className="divide-y divide-slate-100 mt-3">
                      {exams.map((exam) => {
                        const qCount = exam.questions.length;
                        const attCount = attempts.filter((a) => a.examId === exam.id).length;
                        const isSelected = exam.id === selectedExamId;

                        return (
                          <div
                            key={exam.id}
                            className={`py-3.5 px-2 rounded-xl transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                              isSelected ? 'bg-indigo-50/60' : 'hover:bg-slate-50'
                            }`}
                          >
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-800">
                                  {exam.subjectName}
                                </span>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                                  exam.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'
                                }`}>
                                  {exam.status === 'active' ? 'Aktif' : 'Arsip'}
                                </span>
                                <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                                  Token: {exam.token}
                                </span>
                              </div>
                              <h4 className="text-sm font-bold text-slate-900 truncate">
                                {exam.title}
                              </h4>
                              <div className="flex flex-wrap items-center gap-x-3 text-[11px] text-slate-500 mt-1">
                                <span>Durasi: {exam.durationMinutes} mnt</span>
                                <span>•</span>
                                <span>KKM: {exam.kkm}</span>
                                <span>•</span>
                                <span>{qCount} Soal</span>
                                <span>•</span>
                                <span>{attCount} Peserta</span>
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                              <button
                                onClick={() => {
                                  setSelectedExamId(exam.id);
                                  setActiveTab('bank_soal');
                                }}
                                className="px-2.5 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1"
                                title="Kelola Soal Ujian"
                              >
                                <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
                                <span>Soal</span>
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedExamId(exam.id);
                                  setActiveTab('monitoring');
                                }}
                                className="px-2.5 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1"
                                title="Buka Monitor"
                              >
                                <ShieldAlert className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Pantau</span>
                              </button>
                              <button
                                onClick={() => handleOpenEditExam(exam)}
                                className="p-1.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 rounded-lg text-xs transition cursor-pointer"
                                title="Edit Jadwal & Pengaturan"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                      <span>Total {exams.length} paket asesmen</span>
                      <button
                        onClick={() => setActiveTab('jadwal')}
                        className="font-bold text-indigo-600 hover:text-indigo-800 transition cursor-pointer"
                      >
                        Buka Manajemen Jadwal Lengkap →
                      </button>
                    </div>
                  </div>

                  {/* Panduan Alur Kerja Guru CBT */}
                  <div className="bg-slate-900 rounded-2xl p-5 text-white shadow-md border border-slate-800">
                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-indigo-400 mb-2 flex items-center gap-1.5">
                      <Zap className="w-4 h-4" />
                      Alur Pengelolaan Asesmen CBT
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-300">
                      <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/60">
                        <span className="font-bold text-white block mb-0.5">1. Jadwalkan Ujian</span>
                        Atur durasi pengerjaan, KKM, kelas sasaran, serta token aktivasi pada menu <strong>Jadwal Ujian</strong>.
                      </div>
                      <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/60">
                        <span className="font-bold text-white block mb-0.5">2. Susun Bank Soal</span>
                        Tambahkan stimulus AKM, impor file Excel/Word, atau buat butir soal otomatis dengan <strong>Gemini AI</strong>.
                      </div>
                      <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/60">
                        <span className="font-bold text-white block mb-0.5">3. Live Monitoring</span>
                        Awasi peserta saat jam ujian berjalan, pantau peringatan kecurangan tab switch, dan lakukan reset kunci bila diperlukan.
                      </div>
                      <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/60">
                        <span className="font-bold text-white block mb-0.5">4. Rekapitulasi & Cetak</span>
                        Unduh file Excel nilai atau cetak lembar hasil ujian & berita acara resmi berformat PDF.
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column: Live Monitor Kilat & Hasil Terkini (5 Cols) */}
                <div className="lg:col-span-5 space-y-6">
                  {/* Card 1: Pemantauan Siswa Real-Time */}
                  <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
                          <ShieldAlert className="w-4 h-4" />
                        </div>
                        <div>
                          <h3 className="font-extrabold text-sm text-slate-900">
                            Ruang Ujian Real-Time
                          </h3>
                          <p className="text-[11px] text-slate-500">
                            Siswa aktif saat ini
                          </p>
                        </div>
                      </div>
                      {attempts.some((a) => a.status === 'in_progress') && (
                        <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                          Aktif Berlangsung
                        </span>
                      )}
                    </div>

                    {/* Content: If there are active students or empty */}
                    {(() => {
                      const activeOnes = attempts.filter((a) => a.status === 'in_progress');
                      if (activeOnes.length === 0) {
                        return (
                          <div className="py-8 text-center">
                            <div className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center mx-auto mb-3">
                              <ShieldAlert className="w-6 h-6" />
                            </div>
                            <p className="font-bold text-xs text-slate-800">Ruang Ujian Sedang Hening</p>
                            <p className="text-[11px] text-slate-500 mt-0.5 max-w-xs mx-auto">
                              Tidak ada siswa yang sedang mengerjakan ujian saat ini. Buka menu Live Monitor saat jadwal ujian berlangsung.
                            </p>
                            <button
                              onClick={() => setActiveTab('monitoring')}
                              className="mt-3 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
                            >
                              Buka Panel Pengawasan
                            </button>
                          </div>
                        );
                      }

                      return (
                        <div className="divide-y divide-slate-100 mt-2">
                          {activeOnes.slice(0, 5).map((att) => {
                            const stu = students.find((s) => s.id === att.studentId);
                            const ex = exams.find((e) => e.id === att.examId);

                            return (
                              <div key={att.id} className="py-2.5 flex items-center justify-between gap-2">
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-bold text-xs text-slate-900 truncate">
                                      {att.studentName || stu?.name || 'Siswa'}
                                    </span>
                                    <span className="text-[10px] px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded">
                                      {stu?.classGrade || '8A'}
                                    </span>
                                  </div>
                                  <p className="text-[10px] text-slate-500 truncate mt-0.5">
                                    {ex?.title || 'Ujian CBT'}
                                  </p>
                                </div>
                                <div className="text-right shrink-0">
                                  {att.violationCount && att.violationCount > 0 ? (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-100 text-rose-700">
                                      {att.violationCount}x Pelanggaran
                                    </span>
                                  ) : (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700">
                                      Aman
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                          <div className="pt-2 text-right">
                            <button
                              onClick={() => setActiveTab('monitoring')}
                              className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition cursor-pointer"
                            >
                              Lihat Seluruh {activeOnes.length} Siswa Aktif →
                            </button>
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Card 2: Hasil Nilai Terbaru */}
                  <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                          <Award className="w-4 h-4" />
                        </div>
                        <div>
                          <h3 className="font-extrabold text-sm text-slate-900">
                            Hasil Pengerjaan Terkini
                          </h3>
                          <p className="text-[11px] text-slate-500">
                            Ujian yang baru dikumpulkan
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => setActiveTab('rekap')}
                        className="text-[11px] font-bold text-amber-600 hover:text-amber-800 transition cursor-pointer"
                      >
                        Rekap →
                      </button>
                    </div>

                    {(() => {
                      const submitted = attempts.filter((a) => a.status === 'submitted');
                      if (submitted.length === 0) {
                        return (
                          <p className="text-xs text-slate-500 py-6 text-center">
                            Belum ada siswa yang menyelesaikan dan mengumpulkan ujian.
                          </p>
                        );
                      }

                      return (
                        <div className="divide-y divide-slate-100 mt-2">
                          {submitted.slice(-5).reverse().map((att) => {
                            const stu = students.find((s) => s.id === att.studentId);
                            const ex = exams.find((e) => e.id === att.examId);
                            const kkm = ex?.kkm || 75;
                            const scoreVal = att.scorePercentage ?? att.totalScore ?? 0;
                            const isPass = att.passedKkm ?? (scoreVal >= kkm);

                            return (
                              <div key={att.id} className="py-2.5 flex items-center justify-between gap-2">
                                <div className="min-w-0 flex-1">
                                  <p className="text-xs font-bold text-slate-900 truncate">
                                    {att.studentName || stu?.name}
                                  </p>
                                  <p className="text-[10px] text-slate-500 truncate">
                                    {ex?.title} • {stu?.classGrade || '8A'}
                                  </p>
                                </div>
                                <div className="text-right shrink-0">
                                  <span className="text-xs font-black text-slate-900 block">
                                    {scoreVal.toFixed(1)}
                                  </span>
                                  <span className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded ${
                                    isPass ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                                  }`}>
                                    {isPass ? 'Lulus KKM' : 'Belum Lulus'}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>
            </div>
          )}

      {/* TAB 1: MANAJEMEN JADWAL UJIAN */}
      {activeTab === 'jadwal' && (
        <div className="space-y-6">
          {/* Header Action Bar dengan Tombol Buat Ujian */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                  <Calendar className="w-5 h-5" />
                </span>
                <h2 className="text-base sm:text-lg font-extrabold text-slate-900">
                  Manajemen Jadwal Ujian
                </h2>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Kelola jadwal pelaksanaan asesmen, token akses, durasi pengerjaan, KKM, dan status rilis nilai.
              </p>
            </div>

            <button
              id="btn-create-exam-jadwal"
              onClick={() => setIsCreateExamModalOpen(true)}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Buat Ujian Baru</span>
            </button>
          </div>

          {exams.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center">
              <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="font-bold text-slate-700 text-sm">Belum Ada Paket Ujian Terjadwal</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-4">
                Mulai dengan membuat paket ujian baru untuk menentukan mata pelajaran, tanggal ujian, durasi, dan KKM.
              </p>
              <button
                onClick={() => setIsCreateExamModalOpen(true)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>Buat Ujian Sekarang</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {exams.map((exam) => {
                const count = exam.questions.length;

                return (
                  <div
                    key={exam.id}
                    className={`bg-white rounded-2xl border p-5 shadow-2xs transition flex flex-col justify-between ${
                      exam.id === selectedExamId
                        ? 'border-indigo-500 ring-2 ring-indigo-100'
                        : 'border-slate-200'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                          {exam.subjectName}
                        </span>
                        <span
                          className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                            exam.releaseScore
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {exam.releaseScore ? 'Nilai Dirilis' : 'Nilai Ditahan'}
                        </span>
                      </div>

                      <h3 className="font-extrabold text-base text-slate-900 line-clamp-2 mb-2">
                        {exam.title}
                      </h3>

                      {/* Key settings badges */}
                      <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 bg-slate-50 p-3 rounded-xl mb-4">
                        <div>
                          <span className="text-slate-400 block text-[10px]">Total Butir Soal:</span>
                          <strong className="text-indigo-700 text-xs font-bold">{count} Butir</strong>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px]">Nilai KKM:</span>
                          <strong className="text-slate-800 text-sm">{exam.kkm}</strong>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px]">Durasi:</span>
                          <strong className="text-slate-800">{exam.durationMinutes} Menit</strong>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px]">Min. Submit:</span>
                          <strong className="text-slate-800">{exam.minSubmitMinutes} Menit</strong>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px]">Acak Soal:</span>
                          <span className="font-semibold text-emerald-600">
                            {exam.randomizeQuestions ? 'Aktif' : 'Tidak'}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px]">Acak Opsi:</span>
                          <span className="font-semibold text-emerald-600">
                            {exam.randomizeOptions ? 'Aktif' : 'Tidak'}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px]">Lockdown Browser:</span>
                          <span className="font-semibold text-rose-600">
                            {exam.lockdownBrowser ? 'Aktif' : 'Mati'}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-1 text-xs text-slate-500 mb-4">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>Mulai: {new Date(exam.startTime).toLocaleString('id-ID')}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>Selesai: {new Date(exam.endTime).toLocaleString('id-ID')}</span>
                        </div>
                        <div className="text-[11px] text-slate-600 pt-1">
                          Kelas Sasaran: <strong>{exam.targetClasses.join(', ')}</strong> • Total Soal: <strong>{count} butir</strong>
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleOpenEditExam(exam)}
                          className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs flex items-center gap-1 transition cursor-pointer"
                          title="Edit Pengaturan Ujian"
                        >
                          <Edit2 className="w-3.5 h-3.5 text-indigo-600" />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => handleDeleteExam(exam.id, exam.title)}
                          className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-xl text-xs flex items-center gap-1 transition cursor-pointer"
                          title="Hapus Paket Ujian"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                          <span>Hapus</span>
                        </button>
                        <button
                          onClick={() => handleToggleReleaseScore(exam.id)}
                          className="text-[11px] font-semibold text-slate-600 hover:text-indigo-600 cursor-pointer ml-1"
                        >
                          {exam.releaseScore ? 'Tahan Nilai' : 'Rilis Nilai'}
                        </button>
                      </div>

                      <button
                        onClick={() => {
                          setSelectedExamId(exam.id);
                          setActiveTab('bank_soal');
                        }}
                        className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-xl text-xs flex items-center gap-1 transition cursor-pointer"
                      >
                        <span>Kelola Soal</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: BANK SOAL & GENERATOR AI (TAMPILAN PER PAKET SOAL MAPEL) */}
      {activeTab === 'bank_soal' && (() => {
        // Daftar Mapel unik dari seluruh paket ujian
        const uniqueSubjects = Array.from(new Set(exams.map((e) => e.subjectName).filter(Boolean)));

        // Filter paket ujian berdasarkan Mapel yang dipilih di Bank Soal
        const filteredPackages = exams.filter((e) => {
          if (bankSoalSubjectFilter === 'all') return true;
          return e.subjectName === bankSoalSubjectFilter;
        });

        // Paket ujian yang sedang aktif dibuka
        const activeExam = exams.find((e) => e.id === selectedExamId) || filteredPackages[0] || exams[0];
        const questionsList = activeExam?.questions || [];

        // Filter butir soal dalam paket yang aktif
        const filteredQuestions = questionsList.filter((q) => {
          if (bankSoalTypeFilter !== 'all' && q.type !== bankSoalTypeFilter) {
            return false;
          }
          if (bankSoalSearchQuery.trim()) {
            const query = bankSoalSearchQuery.toLowerCase();
            const promptMatches = q.prompt.toLowerCase().includes(query);
            const optionsMatch = q.options?.some((opt) => opt.toLowerCase().includes(query));
            const expMatch = q.explanation?.toLowerCase().includes(query);
            const answerMatch = q.correctAnswer?.toLowerCase().includes(query);
            return promptMatches || optionsMatch || expMatch || answerMatch;
          }
          return true;
        });

        const totalPoints = questionsList.reduce((acc, q) => acc + q.points, 0);

        return (
          <div className="space-y-6">
            {/* 1. Header Bank Soal */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
              <div>
                <div className="flex items-center gap-2">
                  <span className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                    <BookOpen className="w-5 h-5" />
                  </span>
                  <h2 className="text-base sm:text-lg font-extrabold text-slate-900">
                    Bank Soal & Manajemen Asesmen
                  </h2>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Kelola butir soal per paket mata pelajaran (seperti IPA, Matematika, dll). Pilih paket soal untuk mengelola, menambah butir soal, atau membuat dengan AI.
                </p>
              </div>

              <button
                onClick={() => setIsCreateExamModalOpen(true)}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Buat Paket Ujian Baru</span>
              </button>
            </div>

            {/* 2. Pemilih & Pengelompokan Paket Soal (Per Mapel) */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-indigo-600" />
                  <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                    Pilih Paket Soal Asesmen
                  </h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full">
                    {filteredPackages.length} Paket Tersedia
                  </span>
                </div>

                {/* Filter Mapel Tabs */}
                {uniqueSubjects.length > 1 && (
                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      onClick={() => setBankSoalSubjectFilter('all')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                        bankSoalSubjectFilter === 'all'
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      Semua Mapel ({exams.length})
                    </button>
                    {uniqueSubjects.map((subName) => {
                      const countSub = exams.filter((e) => e.subjectName === subName).length;
                      return (
                        <button
                          key={subName}
                          onClick={() => setBankSoalSubjectFilter(subName)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                            bankSoalSubjectFilter === subName
                              ? 'bg-indigo-600 text-white shadow-xs'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {subName} ({countSub})
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Grid Kartu Paket Soal */}
              {filteredPackages.length === 0 ? (
                <div className="p-8 text-center border border-dashed border-slate-200 rounded-xl">
                  <p className="text-xs text-slate-500">
                    Tidak ada paket soal untuk kategori mata pelajaran ini.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                  {filteredPackages.map((pkg) => {
                    const isSelected = activeExam?.id === pkg.id;
                    const pkgPoints = pkg.questions.reduce((sum, q) => sum + q.points, 0);

                    // Dynamic styling for mapel badge
                    const isIpa = pkg.subjectName.toLowerCase().includes('ipa') || pkg.subjectName.toLowerCase().includes('alam');
                    const isMtk = pkg.subjectName.toLowerCase().includes('matematika') || pkg.subjectName.toLowerCase().includes('math');
                    const isIndo = pkg.subjectName.toLowerCase().includes('indonesia');

                    let badgeColor = 'bg-indigo-50 text-indigo-700 border-indigo-200';
                    if (isIpa) badgeColor = 'bg-emerald-50 text-emerald-700 border-emerald-200';
                    else if (isMtk) badgeColor = 'bg-blue-50 text-blue-700 border-blue-200';
                    else if (isIndo) badgeColor = 'bg-amber-50 text-amber-800 border-amber-200';

                    return (
                      <div
                        key={pkg.id}
                        onClick={() => setSelectedExamId(pkg.id)}
                        className={`p-4 rounded-xl border text-left transition cursor-pointer relative flex flex-col justify-between ${
                          isSelected
                            ? 'bg-indigo-50/40 border-indigo-600 ring-2 ring-indigo-500/20 shadow-xs'
                            : 'bg-slate-50/50 hover:bg-white border-slate-200 hover:border-indigo-300'
                        }`}
                      >
                        <div>
                          <div className="flex items-start justify-between gap-1.5 mb-2">
                            <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${badgeColor}`}>
                              {pkg.subjectName}
                            </span>
                            {isSelected ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-indigo-700 bg-indigo-100/80 px-2 py-0.5 rounded-full">
                                <Check className="w-3 h-3" />
                                <span>Dipilih</span>
                              </span>
                            ) : (
                              <span className="text-[10px] text-slate-400 font-medium">
                                KKM {pkg.kkm}
                              </span>
                            )}
                          </div>

                          <h4 className="font-extrabold text-xs sm:text-sm text-slate-900 line-clamp-2 mb-2 leading-snug">
                            {pkg.title}
                          </h4>

                          <div className="text-[11px] text-slate-500 space-y-0.5 mb-3">
                            <p className="truncate">Kelas: <strong className="text-slate-700">{pkg.targetClasses.join(', ')}</strong></p>
                            <p>Waktu: <strong className="text-slate-700">{pkg.durationMinutes} menit</strong> • Token: <code className="font-mono text-indigo-600 bg-white px-1 py-0.2 rounded border border-slate-200">{pkg.token}</code></p>
                          </div>
                        </div>

                        <div className="pt-2.5 border-t border-slate-200/80 flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
                            <span className="text-xs font-black text-slate-800">
                              {pkg.questions.length} <span className="font-normal text-slate-500">Soal</span>
                            </span>
                          </div>
                          <span className="text-[11px] font-bold text-slate-500">
                            {pkgPoints} Poin
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 3. Workspace Butir Soal Paket Terpilih */}
            {activeExam && (
              <div className="space-y-4">
                {/* Banner & Action Bar Paket Terpilih */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-1.5">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider bg-indigo-600 text-white px-2.5 py-0.5 rounded-full">
                          Paket Soal Aktif
                        </span>
                        <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full">
                          {activeExam.subjectName}
                        </span>
                        <span className="text-xs text-slate-500">
                          KKM: <strong className="text-slate-700">{activeExam.kkm}</strong> • Durasi: <strong className="text-slate-700">{activeExam.durationMinutes} mnt</strong>
                        </span>
                      </div>

                      <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                        {activeExam.title}
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Total Soal: <strong className="text-indigo-700">{questionsList.length} butir</strong> • Total Bobot: <strong className="text-slate-800">{totalPoints} Poin</strong> • Acak Soal: {activeExam.randomizeQuestions ? 'Aktif' : 'Nonaktif'} • Acak Opsi: {activeExam.randomizeOptions ? 'Aktif' : 'Nonaktif'}
                      </p>
                    </div>

                    {/* Toolbar Tombol Aksi Lengkap */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full lg:w-auto mt-4 lg:mt-0">
                      {/* Tambah Manual Button */}
                      <button
                        id="btn-open-manual-question-modal"
                        onClick={() => setIsManualQuestionModalOpen(true)}
                        className="px-3 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Tambah Manual</span>
                      </button>

                      {/* AI Auto Generate */}
                      <button
                        id="btn-open-ai-generator"
                        onClick={() => {
                          setAiSubject(activeExam.subjectName);
                          setIsAiModalOpen(true);
                        }}
                        className="px-3.5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition cursor-pointer shadow-xs"
                      >
                        <Sparkles className="w-4 h-4 text-amber-300" />
                        <span>Buat Soal AI</span>
                      </button>

                      {/* Template Word Button */}
                      <a
                        href="/template_soal.docx"
                        download
                        className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition shadow-xs cursor-pointer"
                        onClick={(e) => {
                          e.preventDefault();
                          alert('File template_soal.docx belum tersedia di public folder. Harap tambahkan file ke dalam folder public.');
                        }}
                      >
                        <FileText className="w-4 h-4 text-blue-500" />
                        <span>Template Soal (Word)</span>
                      </a>

                      {/* Download Excel Template */}
                      <button
                        onClick={downloadTemplateSoalExcel}
                        className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition shadow-xs cursor-pointer"
                        title="Download Template Format Excel Soal"
                      >
                        <Download className="w-4 h-4 text-emerald-500" />
                        <span>Template Soal (Excel)</span>
                      </button>

                      {/* Upload DOC / DOCX Soal */}
                      <label className="px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer">
                        <FileText className="w-4 h-4" />
                        <span>Impor Word</span>
                        <input
                          type="file"
                          accept=".doc, .docx, .txt"
                          onChange={handleUploadDocxText}
                          className="hidden"
                        />
                      </label>

                      {/* Upload Excel Soal */}
                      <label className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer">
                        <Upload className="w-4 h-4" />
                        <span>Impor Excel</span>
                        <input
                          type="file"
                          accept=".xlsx, .xls"
                          onChange={handleUploadSoalExcel}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>

                  {/* Search & Filter Bar dalam Paket */}
                  <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex flex-1 items-center gap-2 max-w-md">
                      <div className="relative flex-1">
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={bankSoalSearchQuery}
                          onChange={(e) => setBankSoalSearchQuery(e.target.value)}
                          placeholder="Cari teks soal, pilihan jawaban, atau pembahasan..."
                          className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800"
                        />
                        {bankSoalSearchQuery && (
                          <button
                            onClick={() => setBankSoalSearchQuery('')}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </div>

                      {/* Filter Tipe Soal */}
                      <div className="flex items-center gap-1 shrink-0">
                        <Filter className="w-3.5 h-3.5 text-slate-400" />
                        <select
                          value={bankSoalTypeFilter}
                          onChange={(e) => setBankSoalTypeFilter(e.target.value)}
                          className="py-1.5 px-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                        >
                          <option value="all">Semua Tipe Soal</option>
                          <option value="pilihan_ganda">Pilihan Ganda</option>
                          <option value="pilihan_ganda_kompleks">PG Kompleks</option>
                          <option value="menjodohkan">Menjodohkan</option>
                          <option value="benar_salah">Benar / Salah</option>
                          <option value="isian">Isian Singkat</option>
                          <option value="essay">Uraian / Essay</option>
                        </select>
                      </div>
                    </div>

                    <div className="text-xs text-slate-500 font-medium">
                      Menampilkan <strong>{filteredQuestions.length}</strong> dari <strong>{questionsList.length}</strong> butir soal
                    </div>
                  </div>
                </div>

                {/* Daftar Soal dalam Paket */}
                {questionsList.length === 0 ? (
                  <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center">
                    <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <h3 className="font-bold text-slate-700 text-sm">
                      Belum ada butir soal pada paket "{activeExam.title}"
                    </h3>
                    <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-4">
                      Gunakan tombol "Buat Soal Otomatis AI" untuk merancang butir soal AKM secara instan, atau impor berkas Excel / Word.
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-2">
                      <button
                        onClick={() => {
                          setAiSubject(activeExam.subjectName);
                          setIsAiModalOpen(true);
                        }}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <Sparkles className="w-4 h-4 text-amber-300" />
                        <span>Buat dengan AI Sekarang</span>
                      </button>
                      <button
                        onClick={() => setIsManualQuestionModalOpen(true)}
                        className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Tambah Soal Manual</span>
                      </button>
                    </div>
                  </div>
                ) : filteredQuestions.length === 0 ? (
                  <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-8 text-center">
                    <p className="text-xs text-slate-500">
                      Tidak ada butir soal yang cocok dengan pencarian atau filter tipe soal.
                    </p>
                    <button
                      onClick={() => {
                        setBankSoalSearchQuery('');
                        setBankSoalTypeFilter('all');
                      }}
                      className="mt-2 text-xs font-bold text-indigo-600 hover:underline cursor-pointer"
                    >
                      Reset Filter Pencarian
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredQuestions.map((q, idx) => (
                      <div
                        key={q.id}
                        className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs hover:shadow-xs transition"
                      >
                        <div className="flex items-start justify-between gap-4 mb-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="w-7 h-7 rounded-lg bg-indigo-600 text-white font-extrabold flex items-center justify-center text-xs">
                              {idx + 1}
                            </span>
                            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase bg-slate-100 text-slate-700">
                              {q.type.replace(/_/g, ' ')}
                            </span>
                            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                              Bobot: {q.points} Poin
                            </span>
                            {q.mediaType && q.mediaType !== 'none' && (
                              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-purple-50 text-purple-700 border border-purple-200 flex items-center gap-1">
                                {q.mediaType === 'image' ? <ImageIcon className="w-3 h-3" /> : <Video className="w-3 h-3" />}
                                Media {q.mediaType.toUpperCase()}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleOpenEditQuestion(q)}
                              className="text-slate-400 hover:text-indigo-600 p-1.5 hover:bg-indigo-50 rounded-lg transition cursor-pointer"
                              title="Edit Butir Soal"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteQuestion(q.id, q.prompt)}
                              className="text-slate-400 hover:text-rose-600 p-1.5 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                              title="Hapus Soal"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Prompt Teks Soal */}
                        <p className="text-sm font-semibold text-slate-900 mb-3 whitespace-pre-line leading-relaxed">
                          {q.prompt}
                        </p>

                        {/* Multimedia Preview if exists */}
                        {q.mediaUrl && q.mediaType === 'image' && (
                          <div className="mb-3 max-w-sm rounded-xl overflow-hidden border border-slate-200">
                            <img
                              src={q.mediaUrl}
                              alt="Stimulus Soal"
                              className="w-full max-h-56 object-cover"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                        )}

                        {q.mediaUrl && q.mediaType === 'video' && (
                          <div className="mb-3 max-w-md rounded-xl overflow-hidden border border-slate-200 bg-black">
                            <video src={q.mediaUrl} controls className="w-full max-h-56" />
                          </div>
                        )}

                        {/* Question details based on type */}
                        {q.options && q.options.length > 0 && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
                            {q.options.map((opt, optI) => {
                              const isAnswer =
                                q.correctAnswer === opt ||
                                (q.correctAnswers && q.correctAnswers.includes(opt));

                              return (
                                <div
                                  key={optI}
                                  className={`p-2.5 rounded-xl border text-xs flex items-center justify-between ${
                                    isAnswer
                                      ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-bold'
                                      : 'bg-slate-50 border-slate-200 text-slate-700'
                                  }`}
                                >
                                  <span>{opt}</span>
                                  {isAnswer && (
                                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-200 text-emerald-800 font-black uppercase">
                                      KUNCI
                                    </span>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {q.matchingPairs && q.matchingPairs.length > 0 && (
                          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 mb-3 text-xs">
                            <span className="font-bold text-slate-700 block mb-1.5">Kunci Pasangan Menjodohkan:</span>
                            <div className="space-y-1">
                              {q.matchingPairs.map((pair, pIdx) => (
                                <div key={pIdx} className="flex items-center gap-2 text-slate-700">
                                  <span className="font-semibold text-indigo-700">{pair.premise}</span>
                                  <span>➔</span>
                                  <span className="bg-white px-2 py-0.5 rounded border border-slate-200 font-medium">
                                    {pair.match}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {q.trueFalseStatements && q.trueFalseStatements.length > 0 && (
                          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 mb-3 text-xs">
                            <span className="font-bold text-slate-700 block mb-1.5">Pernyataan Benar / Salah:</span>
                            <div className="space-y-1.5">
                              {q.trueFalseStatements.map((item, tIdx) => (
                                <div key={tIdx} className="flex items-center justify-between bg-white p-2 rounded-lg border border-slate-200">
                                  <span>{item.statement}</span>
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                    item.answer === 'Benar' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                                  }`}>
                                    {item.answer}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {q.type === 'isian' && (
                          <div className="text-xs text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-200 mb-2">
                            <span className="font-bold text-slate-500">Kunci Jawaban Isian: </span>
                            <strong className="text-emerald-700 font-mono">{q.correctAnswer}</strong>
                          </div>
                        )}

                        {q.type === 'essay' && (
                          <div className="text-xs text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-200 mb-2">
                            <span className="font-bold text-slate-500">Pedoman Rubrik Essay: </span>
                            <span className="text-slate-800 italic">{q.essayRubric || q.correctAnswer || 'Penilaian berdasarkan kelengkapan konsep dan argumen.'}</span>
                          </div>
                        )}

                        {q.explanation && (
                          <div className="text-xs text-slate-600 bg-slate-50/80 p-2.5 rounded-xl border border-slate-200/80 mt-2">
                            <strong className="text-indigo-700">Pembahasan: </strong>
                            {q.explanation}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })()}

      {/* TAB 3: LIVE MONITORING UJIAN REAL-TIME */}
      {activeTab === 'monitoring' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Pemantauan Langsung Sesi Ujian (Live Anti-Curang)
              </h2>
              <p className="text-xs text-slate-500">
                Memantau status pengerjaan, peringatan tab switch / keluar browser lockdown, dan auto-submit.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-semibold">Ujian:</span>
              <strong className="text-xs text-slate-800">{selectedExam?.title}</strong>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-slate-700 uppercase font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4 w-12 text-center">No</th>
                    <th className="py-3 px-4">Nama Siswa</th>
                    <th className="py-3 px-4">NISN</th>
                    <th className="py-3 px-4 text-center">Kelas</th>
                    <th className="py-3 px-4 text-center">Status Sesi</th>
                    <th className="py-3 px-4 text-center">Pelanggaran Strike</th>
                    <th className="py-3 px-4 text-center">Progres Jawaban</th>
                    <th className="py-3 px-4 text-center">Skor Sementara</th>
                    <th className="py-3 px-4 text-center w-36">Tindakan Pengawas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {examAttempts.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="text-center py-10 text-slate-400">
                        Belum ada siswa yang memulai sesi pengerjaan pada ujian ini.
                      </td>
                    </tr>
                  ) : (
                    examAttempts.map((att, idx) => {
                      const answeredCount = Object.keys(att.answers || {}).length;
                      const totalQuestions = selectedExam?.questions.length || 1;

                      return (
                        <tr key={att.id} className="hover:bg-slate-50 transition">
                          <td className="py-3 px-4 text-center font-bold text-slate-500">{idx + 1}</td>
                          <td className="py-3 px-4 font-bold text-slate-900">{att.studentName}</td>
                          <td className="py-3 px-4 font-mono text-slate-700 font-semibold">
                            {att.studentNisn}
                          </td>
                          <td className="py-3 px-4 text-center font-bold text-indigo-700">
                            {att.studentClass}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                att.status === 'violation_disqualified'
                                  ? 'bg-rose-100 text-rose-800'
                                  : att.status === 'submitted'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-blue-100 text-blue-800'
                              }`}
                            >
                              {att.status === 'violation_disqualified'
                                ? 'Didiskualifikasi'
                                : att.status === 'submitted'
                                ? 'Selesai'
                                : 'Sedang Mengerjakan'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span
                              className={`px-2.5 py-0.5 rounded-full font-bold text-xs ${
                                att.status === 'violation_disqualified' || att.violationCount > 0
                                  ? 'bg-rose-100 text-rose-700 font-extrabold'
                                  : 'bg-emerald-50 text-emerald-700'
                              }`}
                            >
                              {att.status === 'violation_disqualified'
                                ? '1 Pelanggaran (Selesai Otomatis)'
                                : att.violationCount > 0
                                ? `${att.violationCount} Pelanggaran`
                                : 'Tertib (0)'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className="font-semibold text-slate-800">
                              {answeredCount} / {totalQuestions} Soal
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center font-bold text-indigo-700">
                            {att.scorePercentage}%
                          </td>
                          <td className="py-3 px-4 text-center">
                            <div className="flex items-center justify-center gap-1.5 flex-wrap">
                              {att.status === 'in_progress' && (
                                <button
                                  onClick={() => handleForceSubmit(att.id, att.studentName)}
                                  className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-[10px] font-bold cursor-pointer transition shadow-2xs"
                                  title="Paksa Kumpulkan Ujian Siswa"
                                >
                                  Kumpulkan
                                </button>
                              )}
                              {(att.status === 'violation_disqualified' || att.violationCount > 0) && (
                                <button
                                  type="button"
                                  onClick={() => handleResetStudentExam(att.id, att.studentName)}
                                  className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white rounded-xl text-xs font-extrabold cursor-pointer transition shadow-sm flex items-center gap-1.5"
                                  title="Reset untuk membuka kembali ujian siswa yang terdampak pelanggaran"
                                >
                                  <RotateCcw className="w-3.5 h-3.5" />
                                  <span>Reset</span>
                                </button>
                              )}
                              {att.status === 'submitted' && att.violationCount === 0 && (
                                <span className="text-[11px] text-slate-400 italic">Selesai</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                  
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: REKAPITULASI & LAPORAN NILAI */}
      {activeTab === 'rekap' && (
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
            <div>
              <h2 className="text-base font-extrabold text-slate-900">
                Rekap Nilai Siswa: {selectedExam?.title}
              </h2>
              <p className="text-xs text-slate-500">
                Kriteria Ketuntasan Minimal (KKM): <strong>{selectedExam?.kkm}</strong> • Status Rilis: {selectedExam?.releaseScore ? 'Terbuka untuk Siswa' : 'Ditutup'}
              </p>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 hide-scrollbar max-w-full">
              <select
                value={rekapClassFilter}
                onChange={(e) => setRekapClassFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              >
                <option value="Semua Kelas">Semua Kelas</option>
                {uniqueRekapClasses.map(cls => (
                  <option key={cls} value={cls}>Kelas {cls}</option>
                ))}
              </select>
              <button
                id="btn-export-exam-results-excel"
                onClick={() =>
                  exportExamResultsToExcel(
                    selectedExam?.title || 'Ujian',
                    selectedExam?.subjectName || 'Mapel',
                    selectedExam?.kkm || 75,
                    filteredRekapAttempts
                  )
                }
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Unduh Rekap Excel (.xlsx)</span>
              </button>

              <button
                id="btn-print-exam-rekap"
                onClick={() => setIsPrintRekapModalOpen(true)}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
              >
                <Printer className="w-4 h-4" />
                <span>Print Rekap Nilai</span>
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-slate-700 uppercase font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4 w-12 text-center">NO</th>
                    <th className="py-3 px-4">NISN</th>
                    <th className="py-3 px-4">Nama Siswa</th>
                    <th className="py-3 px-4 text-center">Kelas</th>
                    <th className="py-3 px-4 text-center">KKM</th>
                    <th className="py-3 px-4 text-center">Nilai Akhir</th>
                    <th className="py-3 px-4 text-center">Keterangan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredRekapAttempts.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-10 text-slate-400">
                        Belum ada laporan nilai untuk ujian ini.
                      </td>
                    </tr>
                  ) : (
                    filteredRekapAttempts.map((att, idx) => {
                      const isPassed = att.scorePercentage >= (selectedExam?.kkm || 75);

                      return (
                        <tr key={att.id} className="hover:bg-slate-50 transition">
                          <td className="py-3 px-4 text-center font-bold text-slate-500">{idx + 1}</td>
                          <td className="py-3 px-4 font-mono text-slate-700 font-semibold">
                            {att.studentNisn}
                          </td>
                          <td className="py-3 px-4 font-bold text-slate-900">{att.studentName}</td>
                          <td className="py-3 px-4 text-center font-bold text-indigo-700">
                            {att.studentClass}
                          </td>
                          <td className="py-3 px-4 text-center font-semibold text-slate-500">
                            {selectedExam?.kkm || 75}
                          </td>
                          <td className="py-3 px-4 text-center font-extrabold text-base text-slate-900">
                            {att.scorePercentage}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span
                              className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                                isPassed
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              {isPassed ? 'TUNTAS' : 'REMEDIAL'}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: RIWAYAT & REMEDIAL SISWA */}
      {activeTab === 'riwayat_siswa' && (() => {
        // Find unique classes for dropdowns across all attempts
        const uniqueClasses = Array.from(new Set(attempts.map(a => a.studentClass).filter(Boolean))).sort();

        // If exam and class are selected, filter attempts for these
        const filteredAttempts = attempts.filter(a =>
          a.status === 'submitted' &&
          a.examId === riwayatSelectedExamId &&
          a.studentClass === riwayatSelectedClass
        ).sort((a,b) => new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime());

        // Group by student
        const studentRiwayat = [];
        const studentGroups = {};

        filteredAttempts.forEach(a => {
          if (!studentGroups[a.studentId]) {
            studentGroups[a.studentId] = {
              studentId: a.studentId,
              studentName: a.studentName,
              studentNisn: a.studentNisn,
              studentClass: a.studentClass,
              attempts: []
            };
          }
          studentGroups[a.studentId].attempts.push(a);
        });

        for (const studentId in studentGroups) {
          const group = studentGroups[studentId];
          const bestScore = Math.max(...group.attempts.map(a => a.totalScore || 0));
          const latestAttempt = group.attempts[group.attempts.length - 1];
          studentRiwayat.push({
            ...group,
            totalAttempts: group.attempts.length,
            bestScore,
            passedKkm: latestAttempt.passedKkm
          });
        }
        
        // Filter by search query
        const finalStudentList = studentRiwayat.filter(s =>
            s.studentName.toLowerCase().includes(searchAttemptQuery.toLowerCase()) || 
            s.studentNisn.includes(searchAttemptQuery)
        );

        return (
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
            <div>
              <h2 className="text-base font-extrabold text-slate-900">Riwayat Ujian & Remedial</h2>
              <p className="text-xs text-slate-500">Pilih ujian dan kelas untuk melihat daftar riwayat dan remedial siswa.</p>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
            <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row gap-4 sm:items-center justify-between">
              <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                 <select
                   value={riwayatSelectedExamId}
                   onChange={(e) => setRiwayatSelectedExamId(e.target.value)}
                   className="px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 transition shadow-xs cursor-pointer min-w-[200px]"
                 >
                   <option value="">-- Pilih Ujian --</option>
                   {exams.map(ex => (
                     <option key={ex.id} value={ex.id}>{ex.title}</option>
                   ))}
                 </select>

                 <select
                   value={riwayatSelectedClass}
                   onChange={(e) => setRiwayatSelectedClass(e.target.value)}
                   className="px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 transition shadow-xs cursor-pointer min-w-[150px]"
                 >
                   <option value="">-- Pilih Kelas --</option>
                   {uniqueClasses.map(cls => (
                     <option key={cls} value={cls}>{cls}</option>
                   ))}
                 </select>
              </div>

              {riwayatSelectedExamId && riwayatSelectedClass && (
                <div className="relative max-w-sm w-full sm:w-auto">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Cari Nama / NISN..."
                    value={searchAttemptQuery}
                    onChange={(e) => setSearchAttemptQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-white border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 transition shadow-xs"
                  />
                </div>
              )}
            </div>

            <div className="overflow-x-auto min-h-[300px]">
              {(!riwayatSelectedExamId || !riwayatSelectedClass) ? (
                <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                  <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mb-4 text-indigo-400">
                    <FileSpreadsheet className="w-8 h-8" />
                  </div>
                  <h3 className="text-slate-900 font-bold mb-1">Pilih Filter Ujian dan Kelas</h3>
                  <p className="text-slate-500 text-sm max-w-sm">
                    Untuk melihat daftar riwayat siswa dan aksi melihat percobaan atau menghapus, silakan pilih Ujian dan Kelas di atas terlebih dahulu.
                  </p>
                </div>
              ) : (
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-white border-b border-slate-200 text-slate-500 text-[11px] uppercase font-extrabold tracking-wider">
                    <tr>
                      <th className="py-3.5 px-5">Siswa</th>
                      <th className="py-3.5 px-5 text-center">Jumlah Percobaan</th>
                      <th className="py-3.5 px-5 text-center">Nilai Tertinggi</th>
                      <th className="py-3.5 px-5 text-center">Status Akhir</th>
                      <th className="py-3.5 px-5 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    <AnimatePresence mode="popLayout" initial={false}>
                    {finalStudentList.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center py-12 text-slate-400">
                           Tidak ada siswa yang ditemukan untuk kelas ini.
                        </td>
                      </tr>
                    ) : (
                      finalStudentList.map((student) => (
                        <motion.tr layout initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} key={student.studentId} className="hover:bg-slate-50 transition">
                          <td className="py-3 px-5">
                            <div className="font-bold text-slate-900">{student.studentName}</div>
                            <div className="text-[10px] text-slate-500 font-mono">{student.studentNisn}</div>
                          </td>
                          <td className="py-3 px-5 text-center">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${student.totalAttempts > 1 ? 'bg-amber-100 text-amber-700 border border-amber-200' : 'bg-slate-100 text-slate-600'}`}>
                              {student.totalAttempts > 1 ? `${student.totalAttempts} Kali (Remedial)` : '1 Kali'}
                            </span>
                          </td>
                          <td className="py-3 px-5 text-center font-black text-slate-900">
                            {student.bestScore}
                          </td>
                          <td className="py-3 px-5 text-center">
                            <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${student.passedKkm ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'}`}>
                              {student.passedKkm ? 'Tuntas' : 'Tidak Tuntas'}
                            </span>
                          </td>
                          <td className="py-3 px-5 text-center">
                            <button
                              onClick={() => {
                                setSelectedRiwayatStudent({
                                  studentId: student.studentId,
                                  studentName: student.studentName,
                                  studentNisn: student.studentNisn
                                });
                                setIsRiwayatModalOpen(true);
                              }}
                              className="px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-bold hover:bg-indigo-100 transition cursor-pointer"
                            >
                              Lihat Detail
                            </button>
                          </td>
                        </motion.tr>
                      ))
                    )}
                    </AnimatePresence>
                  </tbody>
                </table>
              )}
            </div>
            
            {riwayatSelectedExamId && riwayatSelectedClass && (
              <div className="p-3 bg-slate-50 text-xs text-slate-500 border-t border-slate-200 flex justify-between">
                <span>Menampilkan {finalStudentList.length} siswa</span>
              </div>
            )}
          </div>
        </div>
        );
      })()}
      {/* TAB 5: EVALUASI SOAL & HASIL UJIAN */}
      {activeTab === 'evaluasi' && (
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
            <div>
              <h2 className="text-base font-extrabold text-slate-900">
                Evaluasi Hasil Ujian: {selectedExam?.title}
              </h2>
              <p className="text-xs text-slate-500">
                Tinjau ulang jawaban siswa dan sesuaikan nilai setiap soal (termasuk soal Uraian / Essay).
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden p-6">
            <div className="space-y-6">
              {/* List students with submitted attempts */}
              {examAttempts.filter(a => a.status === 'submitted').length === 0 ? (
                  <div className="text-center py-10 text-slate-500 text-sm">
                    Belum ada siswa yang menyelesaikan ujian ini.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {examAttempts.filter(a => a.status === 'submitted').map((att) => (
                      <div key={att.id} className="p-4 border border-slate-200 rounded-xl bg-slate-50 flex flex-col justify-between">
                        <div>
                          <h3 className="font-bold text-slate-900 mb-1">{att.studentName}</h3>
                          <p className="text-xs text-slate-500 font-mono mb-3">{att.studentNisn} - {att.studentClass}</p>
                        </div>
                        <button
                          onClick={() => {
                            setEvaluatingAttemptId(att.id);
                            setEvaluatingScores(att.scores || {});
                          }}
                          className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-1"
                        >
                          <ClipboardCheck className="w-4 h-4" />
                          Evaluasi Hasil Ujian
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
          </div>
        </div>
      )}
        </main>
      </div>

      {/* MODAL EVALUASI HASIL UJIAN */}
      {evaluatingAttemptId && (() => {
        const attempt = examAttempts.find(a => a.id === evaluatingAttemptId);
        if (!attempt) return null;
        const evalQs = selectedExam?.questions || [];
        
        return (
          <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4 backdrop-blur-xs">
            <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between shrink-0">
                <div>
                  <h3 className="font-bold text-lg text-slate-900">
                    Evaluasi Hasil: {attempt.studentName}
                  </h3>
                  <p className="text-sm text-slate-500 font-mono mt-1">
                    NISN: {attempt.studentNisn} - Kelas: {attempt.studentClass}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setEvaluatingAttemptId(null);
                    setEvaluatingScores({});
                  }}
                  className="p-2 hover:bg-slate-100 rounded-xl transition cursor-pointer text-slate-400 hover:text-slate-900"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto space-y-6 flex-1">
                {evalQs.map((q, idx) => {
                  const studentAns = attempt.answers[q.id];
                  
                  // Helper function to format answer for display
                  const renderAnswer = (ans: any, qType?: string, question?: any) => {
                    if (ans === undefined || ans === null || ans === '') return <span className="italic text-slate-400">Tidak dijawab.</span>;
                    if (Array.isArray(ans)) {
                      if (qType === 'susun_kata') {
                        return <span>{ans.join(' ')}</span>;
                      }
                      return (
                        <ul className="list-none space-y-1">
                          {ans.map((item, i) => <li key={i}>{String(item)}</li>)}
                        </ul>
                      );
                    }
                    if (typeof ans === 'object') {
                      if (qType === 'benar_salah' && question?.trueFalseStatements) {
                        return (
                          <ul className="list-none space-y-1">
                            {question.trueFalseStatements.map((stmt: any, i: number) => (
                              <li key={i}><span className="font-semibold">{stmt.statement}:</span> {ans[i] || '-'}</li>
                            ))}
                          </ul>
                        );
                      }
                      return (
                        <ul className="list-none space-y-1">
                          {Object.entries(ans).map(([k, v]) => (
                            <li key={k}><span className="font-semibold">{k}</span> <span className="text-slate-400 mx-1">→</span> {String(v)}</li>
                          ))}
                        </ul>
                      );
                    }
                    return String(ans);
                  };

                  return (
                    <div key={q.id} className="p-5 bg-slate-50 border border-slate-200 rounded-xl space-y-4">
                      <div>
                        <span className="text-xs font-bold text-indigo-600 mb-1 block">Soal No. {idx + 1} ({q.type.replace('_', ' ').toUpperCase()}) - Maks: {q.points} Poin</span>
                        <div
                          className="text-sm text-slate-800 prose prose-sm max-w-none"
                          dangerouslySetInnerHTML={{ __html: q.prompt }}
                        />
                      </div>
                      <div className="bg-white p-4 border border-slate-200 rounded-xl space-y-3">
                        <div>
                          <span className="text-xs font-bold text-slate-500 mb-1 block">Jawaban Siswa:</span>
                          <div className="text-sm text-slate-900 font-medium whitespace-pre-wrap">
                            {renderAnswer(studentAns, q.type, q)}
                          </div>
                        </div>
                        {q.type !== 'essay' && (
                          <div className="pt-3 border-t border-slate-100">
                            <span className="text-xs font-bold text-slate-500 mb-1 block">Kunci Jawaban:</span>
                            <div className="text-sm text-emerald-700 font-bold whitespace-pre-wrap">
                              {q.correctAnswer && renderAnswer(q.correctAnswer)}
                              {q.correctAnswers && renderAnswer(q.correctAnswers)}
                              {q.trueFalseStatements && renderAnswer(q.trueFalseStatements.map(t => `${t.statement}: ${t.answer}`))}
                              {q.matchingPairs && renderAnswer(q.matchingPairs.map(p => `${p.premise} -> ${p.match}`))}
                              {q.fillInTheBlanks && renderAnswer(q.fillInTheBlanks)}
                              {q.correctOrder && renderAnswer(q.correctOrder.join(' '))}

                            </div>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-3 bg-white p-3 border border-indigo-100 rounded-xl">
                        <label className="text-sm font-bold text-slate-700">Nilai:</label>
                        <input
                          type="number"
                          min="0"
                          max={q.points}
                          value={evaluatingScores[q.id] ?? attempt.scores?.[q.id] ?? calculateQuestionScore(q, attempt.answers[q.id])}
                          onChange={(e) => {
                            let val = parseInt(e.target.value);
                            if (isNaN(val)) val = 0;
                            if (val > q.points) val = q.points;
                            if (val < 0) val = 0;
                            setEvaluatingScores({ ...evaluatingScores, [q.id]: val });
                          }}
                          className="w-24 px-3 py-1.5 border border-slate-300 rounded-lg text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          placeholder={`0 - ${q.points}`}
                        />
                        <span className="text-xs text-slate-500">/ {q.points} Poin</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="p-6 border-t border-slate-100 shrink-0 flex items-center justify-end gap-3 bg-slate-50 rounded-b-2xl">
                <button
                  onClick={() => {
                    setEvaluatingAttemptId(null);
                    setEvaluatingScores({});
                  }}
                  className="px-5 py-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold rounded-xl text-sm transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  onClick={handleSaveEvaluasi}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm transition cursor-pointer flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  Simpan Nilai
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* MODAL GENERATOR SOAL AI (GEMINI) */}
      {isAiModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">
                    Generator Soal Otomatis AI (Gemini Flash)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Menghasilkan soal kurikulum SMP berstandar AKM secara instan
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAiModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleGenerateAiQuestions} className="space-y-4 text-xs">
              {aiErrorMessage && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-red-700">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
                  <div className="space-y-1">
                    <p className="font-bold">{aiErrorMessage}</p>
                    <p className="text-[11px] text-red-600/90 leading-relaxed">
                      Sistem telah menyiapkan rute model AI alternatif. Anda dapat mengklik tombol <strong>Buat Soal Sekarang</strong> lagi untuk mencoba kembali.
                    </p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Mata Pelajaran</label>
                  <select
                    value={aiSubject}
                    onChange={(e) => setAiSubject(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                  >
                    {subjects.map((s) => (
                      <option key={s.id} value={s.name}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tingkat Kesulitan</label>
                  <select
                    value={aiDifficulty}
                    onChange={(e) => setAiDifficulty(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                  >
                    <option value="Mudah">Mudah (LOTS)</option>
                    <option value="Sedang">Sedang (MOTS)</option>
                    <option value="HOTS (Tinggi)">HOTS / Penalaran Tinggi</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Materi Pokok / Topik / Stimulus Soal
                </label>
                <textarea
                  value={aiTopic}
                  onChange={(e) => setAiTopic(e.target.value)}
                  placeholder="Contoh: Sistem Pencernaan dan Enzim, Teorema Pythagoras, Teks Laporan Percobaan, etc."
                  rows={2}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Jumlah Butir Soal yang Dibuat: <strong className="text-purple-700">{aiCount} Soal</strong>
                </label>
                <input
                  type="range"
                  min={1}
                  max={10}
                  value={aiCount}
                  onChange={(e) => setAiCount(Number(e.target.value))}
                  className="w-full accent-purple-600 cursor-pointer"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1.5">
                  Variasi Tipe Soal yang Disertakan:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    { id: 'pilihan_ganda', label: 'Pilihan Ganda' },
                    { id: 'pilihan_ganda_kompleks', label: 'PG Kompleks' },
                    { id: 'isian', label: 'Isian Singkat' },
                    { id: 'essay', label: 'Uraian / Essay' },
                    { id: 'menjodohkan', label: 'Menjodohkan' },
                    { id: 'benar_salah', label: 'Benar / Salah' },
                  ].map((item) => {
                    const isChecked = aiTypes.includes(item.id as QuestionType);
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          if (isChecked) {
                            if (aiTypes.length > 1) {
                              setAiTypes(aiTypes.filter((t) => t !== item.id));
                            }
                          } else {
                            setAiTypes([...aiTypes, item.id as QuestionType]);
                          }
                        }}
                        className={`p-2 rounded-xl border text-left flex items-center gap-2 cursor-pointer transition ${
                          isChecked
                            ? 'bg-purple-50 border-purple-300 text-purple-900 font-semibold'
                            : 'bg-slate-50 border-slate-200 text-slate-600'
                        }`}
                      >
                        <div
                          className={`w-4 h-4 rounded flex items-center justify-center text-white text-[10px] ${
                            isChecked ? 'bg-purple-600' : 'border border-slate-300'
                          }`}
                        >
                          {isChecked && <Check className="w-3 h-3" />}
                        </div>
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAiModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isAiGenerating}
                  className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl font-extrabold flex items-center gap-2 shadow-md cursor-pointer disabled:opacity-50"
                >
                  {isAiGenerating ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Sedang Merancang Soal...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-amber-300" />
                      <span>Buat Soal Sekarang</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

            {/* MODAL RIWAYAT & REMEDIAL */}
      {isRiwayatModalOpen && selectedRiwayatStudent && (() => {
        const studentAttempts = attempts.filter(a => 
          a.status === 'submitted' && 
          a.examId === riwayatSelectedExamId &&
          a.studentId === selectedRiwayatStudent.studentId
        ).sort((a,b) => new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime());

        return (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-base text-slate-900">Detail Riwayat & Remedial Siswa</h3>
                <p className="text-xs text-slate-500 mt-1">{selectedRiwayatStudent.studentName} ({selectedRiwayatStudent.studentNisn})</p>
              </div>
              <button onClick={() => setIsRiwayatModalOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              {studentAttempts.map((att, idx) => (
                <div key={att.id} className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">
                      {idx === 0 ? 'Percobaan Pertama' : `Percobaan Remedial Ke-${idx}`}
                    </h4>
                    <p className="text-xs text-slate-500 mt-1">
                      Waktu Mulai: {new Date(att.startedAt).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                    </p>
                    <p className="text-xs text-slate-500">
                      Waktu Kumpul: {att.submittedAt ? new Date(att.submittedAt).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }) : '-'}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <span className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Nilai</span>
                      <span className="text-xl font-black text-slate-900">{att.totalScore}</span>
                    </div>
                    <div className="text-center">
                      <span className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Status</span>
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${att.passedKkm ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'}`}>
                        {att.passedKkm ? 'Tuntas' : 'Tidak Tuntas'}
                      </span>
                    </div>
                    <button
                      onClick={() => {
                         if(confirm('Apakah Anda yakin ingin menghapus data percobaan ujian ini?')) {
                            const newAttempts = attempts.filter(a => a.id !== att.id);
                            onUpdateAttempts(newAttempts);
                            // If it was the last attempt, close modal
                            if (studentAttempts.length === 1) {
                                setIsRiwayatModalOpen(false);
                            }
                         }
                      }}
                      className="p-2 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-100 transition cursor-pointer shrink-0"
                      title="Hapus Percobaan"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-6 pt-4 border-t border-slate-100 flex justify-end">
              <button 
                onClick={() => setIsRiwayatModalOpen(false)}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-200 transition cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
        );
      })()}

      {/* MODAL BUAT UJIAN BARU */}
      {isCreateExamModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
              <h3 className="font-bold text-base text-slate-900">Pengaturan Jadwal & Ujian CBT Baru</h3>
              <button onClick={() => setIsCreateExamModalOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveNewExam} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Judul Ujian / Asesmen</label>
                <input
                  type="text"
                  placeholder="Contoh: Asesmen Sumatif Akhir Semester IPA Kelas 8"
                  value={newExamForm.title}
                  onChange={(e) => setNewExamForm({ ...newExamForm, title: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Mata Pelajaran</label>
                <select
                  value={newExamForm.subjectId}
                  onChange={(e) => setNewExamForm({ ...newExamForm, subjectId: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                >
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Waktu Mulai Ujian</label>
                  <input
                    type="datetime-local"
                    value={newExamForm.startTime}
                    onChange={(e) => setNewExamForm({ ...newExamForm, startTime: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Waktu Berakhir Ujian</label>
                  <input
                    type="datetime-local"
                    value={newExamForm.endTime}
                    onChange={(e) => setNewExamForm({ ...newExamForm, endTime: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Durasi (Menit)</label>
                  <input
                    type="number"
                    min={10}
                    max={180}
                    value={newExamForm.durationMinutes}
                    onChange={(e) => setNewExamForm({ ...newExamForm, durationMinutes: Number(e.target.value) })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Min. Submit (Menit)</label>
                  <input
                    type="number"
                    min={1}
                    max={60}
                    value={newExamForm.minSubmitMinutes}
                    onChange={(e) => setNewExamForm({ ...newExamForm, minSubmitMinutes: Number(e.target.value) })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nilai KKM</label>
                  <input
                    type="number"
                    min={50}
                    max={100}
                    value={newExamForm.kkm}
                    onChange={(e) => setNewExamForm({ ...newExamForm, kkm: Number(e.target.value) })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono"
                    required
                  />
                </div>
              </div>

              {/* Toggles & Options */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
                <span className="font-bold text-slate-800 block mb-1">Pengaturan Tambahan Ujian:</span>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newExamForm.releaseScore}
                    onChange={(e) => setNewExamForm({ ...newExamForm, releaseScore: e.target.checked })}
                    className="rounded text-indigo-600"
                  />
                  <span>Rilis Nilai & Pembahasan Langsung ke Siswa setelah Ujian</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newExamForm.lockdownBrowser}
                    onChange={(e) => setNewExamForm({ ...newExamForm, lockdownBrowser: e.target.checked })}
                    className="rounded text-indigo-600"
                  />
                  <span>Mode Anti-Curang Lockdown (Layar Penuh, Anti-Copy, Pantau Pindah Tab)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newExamForm.randomizeQuestions}
                    onChange={(e) => setNewExamForm({ ...newExamForm, randomizeQuestions: e.target.checked })}
                    className="rounded text-indigo-600"
                  />
                  <span>Acak Urutan Nomor Soal untuk Setiap Siswa</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newExamForm.randomizeOptions}
                    onChange={(e) => setNewExamForm({ ...newExamForm, randomizeOptions: e.target.checked })}
                    className="rounded text-indigo-600"
                  />
                  <span>Acak Opsi Jawaban (Pilihan Ganda) untuk Setiap Siswa</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newExamForm.allowRetake}
                    onChange={(e) => setNewExamForm({ ...newExamForm, allowRetake: e.target.checked })}
                    className="rounded text-indigo-600"
                  />
                  <span>Izinkan Remedial / Pengulangan Ujian</span>
                </label>
              </div>

              <div className="pt-4 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateExamModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSavingNewExam}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white rounded-xl font-bold cursor-pointer flex items-center gap-2"
                >
                  {isSavingNewExam && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{isSavingNewExam ? 'Menyimpan Ujian...' : 'Simpan Jadwal Ujian'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL TAMBAH SOAL MANUAL */}
      {isManualQuestionModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
              <h3 className="font-bold text-base text-slate-900">Tambah Butir Soal CBT Baru</h3>
              <button onClick={() => setIsManualQuestionModalOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveManualQuestion} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tipe Soal</label>
                  <select
                    value={newQuestionType}
                    onChange={(e) => setNewQuestionType(e.target.value as QuestionType)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl"
                  >
                    <option value="pilihan_ganda">Pilihan Ganda (Single)</option>
                    <option value="pilihan_ganda_kompleks">Pilihan Ganda Kompleks (Multi)</option>
                    <option value="isian">Isian Singkat</option>
                    <option value="isi_kosong">Isi Kosong (Fill in the Blank)</option>
                    <option value="essay">Uraian / Essay</option>
                    <option value="menjodohkan">Menjodohkan</option>
                    <option value="benar_salah">Benar dan Salah</option>
                    <option value="susun_kata">Menyusun Kata</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Bobot Poin</label>
                  <input
                    type="number"
                    value={newQuestionPoints}
                    onChange={(e) => setNewQuestionPoints(Number(e.target.value))}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Teks Pertanyaan / Soal</label>
                <textarea
                  value={newQuestionPrompt}
                  onChange={(e) => setNewQuestionPrompt(e.target.value)}
                  rows={3}
                  placeholder="Tuliskan stimulus atau pertanyaan soal..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                  required
                />
              </div>

              {/* Multimedia Attachment */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Lampiran Media</label>
                  <select
                    value={newQuestionMediaType}
                    onChange={(e) => setNewQuestionMediaType(e.target.value as any)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl"
                  >
                    <option value="none">Tanpa Media</option>
                    <option value="image">Gambar (Image)</option>
                    <option value="video">Video Edukasi</option>
                  </select>
                </div>
                {newQuestionMediaType !== 'none' && (
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">URL Media (Link)</label>
                    <input
                      type="url"
                      placeholder="https://images.unsplash.com/..."
                      value={newQuestionMediaUrl}
                      onChange={(e) => setNewQuestionMediaUrl(e.target.value)}
                      className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl font-mono text-[11px]"
                    />
                  </div>
                )}
              </div>

              {/* Options for PG */}
              {newQuestionType === 'pilihan_ganda' && (
                <div className="space-y-2 pt-2">
                  <label className="block font-bold text-slate-700">Pilihan Opsi Jawaban (Pilih 1 Kunci):</label>
                  {newQuestionOptions.map((opt, oIdx) => (
                    <div key={oIdx} className="flex items-center gap-2">
                      <span className="font-bold text-indigo-700 w-6">
                        {String.fromCharCode(65 + oIdx)}.
                      </span>
                      <input
                        type="text"
                        value={opt.replace(/^[A-D]\.\s*/, '')}
                        onChange={(e) => {
                          const letter = String.fromCharCode(65 + oIdx);
                          const updated = [...newQuestionOptions];
                          updated[oIdx] = `${letter}. ${e.target.value}`;
                          setNewQuestionOptions(updated);
                        }}
                        placeholder={`Teks pilihan ${String.fromCharCode(65 + oIdx)}...`}
                        className="flex-1 p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                      />
                      <input
                        type="radio"
                        name="correctAnswerRadio"
                        checked={newQuestionCorrectAnswer.startsWith(String.fromCharCode(65 + oIdx))}
                        onChange={() => setNewQuestionCorrectAnswer(newQuestionOptions[oIdx])}
                        className="cursor-pointer"
                        title="Tandai sebagai kunci jawaban"
                      />
                    </div>
                  ))}
                  <p className="text-[11px] text-slate-500">Pilih radio button untuk menentukan 1 kunci jawaban yang benar.</p>
                </div>
              )}

              {/* Options for Pilihan Ganda Kompleks (Multi Kunci) */}
              {newQuestionType === 'pilihan_ganda_kompleks' && (
                <div className="space-y-2 pt-2">
                  <div className="flex items-center justify-between">
                    <label className="block font-bold text-slate-700">Pilihan Opsi & Centang Semua Kunci Jawaban Benar:</label>
                    <span className="text-[11px] text-indigo-600 font-semibold">
                      {newQuestionMultiCorrect.length} Kunci Terpilih
                    </span>
                  </div>
                  {newQuestionOptions.map((opt, oIdx) => {
                    const isChecked = newQuestionMultiCorrect.includes(opt);
                    return (
                      <div key={oIdx} className="flex items-center gap-2">
                        <span className="font-bold text-indigo-700 w-6">
                          {String.fromCharCode(65 + oIdx)}.
                        </span>
                        <input
                          type="text"
                          value={opt.replace(/^[A-D]\.\s*/, '')}
                          onChange={(e) => {
                            const letter = String.fromCharCode(65 + oIdx);
                            const oldVal = newQuestionOptions[oIdx];
                            const newVal = `${letter}. ${e.target.value}`;
                            const updated = [...newQuestionOptions];
                            updated[oIdx] = newVal;
                            setNewQuestionOptions(updated);
                            if (newQuestionMultiCorrect.includes(oldVal)) {
                              setNewQuestionMultiCorrect(
                                newQuestionMultiCorrect.map((item) => (item === oldVal ? newVal : item))
                              );
                            }
                          }}
                          placeholder={`Teks pilihan ${String.fromCharCode(65 + oIdx)}...`}
                          className="flex-1 p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                        />
                        <label className="flex items-center gap-1.5 px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer text-[11px] font-semibold text-slate-700">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setNewQuestionMultiCorrect([...newQuestionMultiCorrect, opt]);
                              } else {
                                setNewQuestionMultiCorrect(newQuestionMultiCorrect.filter((item) => item !== opt));
                              }
                            }}
                            className="rounded text-indigo-600"
                          />
                          <span>Kunci</span>
                        </label>
                      </div>
                    );
                  })}
                  <p className="text-[11px] text-slate-500">
                    Centang kotak "Kunci" pada opsi yang merupakan jawaban benar (bisa lebih dari satu).
                  </p>
                </div>
              )}

              {/* Options for Menjodohkan (Pemetaan Fungsi Matematika: Domain A -> Kodomain B) */}
              {newQuestionType === 'menjodohkan' && (
                <div className="space-y-2 pt-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="block font-bold text-slate-700">
                        Pasangan Pemetaan Fungsi (Domain A ➔ Kodomain B):
                      </label>
                      <p className="text-[11px] text-slate-500">
                        Tentukan pernyataan di sisi kiri dan jawaban tepat di sisi kanannya.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setNewMatchingPairs([...newMatchingPairs, { premise: '', match: '' }])}
                      className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg font-bold text-[11px] cursor-pointer"
                    >
                      + Tambah Pasangan
                    </button>
                  </div>
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {newMatchingPairs.map((pair, pIdx) => (
                      <div key={pIdx} className="flex items-center gap-2 p-2 bg-slate-50 rounded-xl border border-slate-200">
                        <span className="font-bold text-slate-500 w-5 text-center">{pIdx + 1}.</span>
                        <input
                          type="text"
                          value={pair.premise}
                          onChange={(e) => {
                            const updated = [...newMatchingPairs];
                            updated[pIdx].premise = e.target.value;
                            setNewMatchingPairs(updated);
                          }}
                          placeholder="Pertanyaan / Domain A..."
                          className="flex-1 p-2 bg-white border border-slate-300 rounded-lg text-xs"
                          required
                        />
                        <span className="text-indigo-600 font-bold">➔</span>
                        <input
                          type="text"
                          value={pair.match}
                          onChange={(e) => {
                            const updated = [...newMatchingPairs];
                            updated[pIdx].match = e.target.value;
                            setNewMatchingPairs(updated);
                          }}
                          placeholder="Kunci Jawaban / Kodomain B..."
                          className="flex-1 p-2 bg-white border border-slate-300 rounded-lg text-xs"
                          required
                        />
                        {newMatchingPairs.length > 1 && (
                          <button
                            type="button"
                            onClick={() => setNewMatchingPairs(newMatchingPairs.filter((_, idx) => idx !== pIdx))}
                            className="text-rose-500 hover:text-rose-700 p-1 cursor-pointer"
                            title="Hapus baris pasangan"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Options for Benar dan Salah */}
              {newQuestionType === 'benar_salah' && (
                <div className="space-y-2 pt-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="block font-bold text-slate-700">Daftar Pernyataan & Kunci Jawaban:</label>
                      <p className="text-[11px] text-slate-500">Tentukan teks pernyataan dan status nilainya (Benar atau Salah).</p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setNewTrueFalseStatements([
                          ...newTrueFalseStatements,
                          { statement: '', answer: 'Benar' },
                        ])
                      }
                      className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg font-bold text-[11px] cursor-pointer"
                    >
                      + Tambah Pernyataan
                    </button>
                  </div>
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {newTrueFalseStatements.map((stmt, sIdx) => (
                      <div key={sIdx} className="flex items-center gap-2 p-2 bg-slate-50 rounded-xl border border-slate-200">
                        <span className="font-bold text-slate-500 w-5 text-center">{sIdx + 1}.</span>
                        <input
                          type="text"
                          value={stmt.statement}
                          onChange={(e) => {
                            const updated = [...newTrueFalseStatements];
                            updated[sIdx].statement = e.target.value;
                            setNewTrueFalseStatements(updated);
                          }}
                          placeholder="Tuliskan pernyataan evaluasi..."
                          className="flex-1 p-2 bg-white border border-slate-300 rounded-lg text-xs"
                          required
                        />
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              const updated = [...newTrueFalseStatements];
                              updated[sIdx].answer = 'Benar';
                              setNewTrueFalseStatements(updated);
                            }}
                            className={`px-2.5 py-1 rounded-md text-[11px] font-bold cursor-pointer transition ${
                              stmt.answer === 'Benar'
                                ? 'bg-emerald-600 text-white'
                                : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                            }`}
                          >
                            Benar
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const updated = [...newTrueFalseStatements];
                              updated[sIdx].answer = 'Salah';
                              setNewTrueFalseStatements(updated);
                            }}
                            className={`px-2.5 py-1 rounded-md text-[11px] font-bold cursor-pointer transition ${
                              stmt.answer === 'Salah'
                                ? 'bg-rose-600 text-white'
                                : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                            }`}
                          >
                            Salah
                          </button>
                        </div>
                        {newTrueFalseStatements.length > 1 && (
                          <button
                            type="button"
                            onClick={() =>
                              setNewTrueFalseStatements(
                                newTrueFalseStatements.filter((_, idx) => idx !== sIdx)
                              )
                            }
                            className="text-rose-500 hover:text-rose-700 p-1 cursor-pointer"
                            title="Hapus pernyataan"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {newQuestionType === 'isian' && (
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Kunci Jawaban Isian Singkat</label>
                  <input
                    type="text"
                    value={newQuestionCorrectAnswer}
                    onChange={(e) => setNewQuestionCorrectAnswer(e.target.value)}
                    placeholder="Contoh: protein"
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl font-mono"
                    required
                  />
                </div>
              )}

              {newQuestionType === 'essay' && (
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Rubrik / Pedoman Penilaian Uraian</label>
                  <textarea
                    rows={2}
                    value={newQuestionExplanation}
                    onChange={(e) => setNewQuestionExplanation(e.target.value)}
                    placeholder="Kriteria penilaian jawaban siswa..."
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl"
                  />
                </div>
              )}

              {newQuestionType === 'isi_kosong' && (
                <div className="space-y-2 pt-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="block font-bold text-slate-700">Kunci Jawaban Bagian yang Kosong:</label>
                      <p className="text-[11px] text-slate-500">Tulis teks dengan [kosong1], [kosong2] di pertanyaan, dan isi kuncinya di bawah.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setNewQuestionFillInTheBlanks([...newQuestionFillInTheBlanks, ''])}
                      className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg font-bold text-[11px]"
                    >
                      + Tambah Kosong
                    </button>
                  </div>
                  <div className="space-y-2">
                    {newQuestionFillInTheBlanks.map((ans, idx) => (
                      <div key={idx} className="flex gap-2 items-center">
                        <span className="font-bold text-indigo-700">[{idx + 1}]</span>
                        <input
                          type="text"
                          value={ans}
                          onChange={(e) => {
                            const arr = [...newQuestionFillInTheBlanks];
                            arr[idx] = e.target.value;
                            setNewQuestionFillInTheBlanks(arr);
                          }}
                          className="flex-1 p-2 bg-slate-50 border border-slate-300 rounded-lg"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {newQuestionType === 'susun_kata' && (
                <div className="space-y-2 pt-2">
                  <div>
                    <label className="block font-bold text-slate-700">Daftar Kata (Acak Otomatis di Siswa):</label>
                    <p className="text-[11px] text-slate-500">Ketik kata-kata dengan urutan yang BENAR di sini. Sistem akan mengacaknya untuk siswa.</p>
                  </div>
                  <textarea
                    rows={3}
                    placeholder="Ketik kata-kata dipisahkan dengan enter atau spasi (Misal: Ibu pergi ke pasar)"
                    onChange={(e) => {
                       const words = e.target.value.split(/\s+/).filter(Boolean);
                       setNewQuestionCorrectOrder(words);
                       setNewQuestionJumbledWords([...words].sort(() => Math.random() - 0.5));
                    }}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl"
                  />
                  <div className="p-2 bg-emerald-50 text-emerald-800 rounded-lg text-xs font-semibold">
                    Kata: {newQuestionCorrectOrder.length > 0 ? newQuestionCorrectOrder.join(' • ') : '-'}
                  </div>
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 mb-1">Penjelasan Pembahasan (Opsional)</label>
                <input
                  type="text"
                  value={newQuestionExplanation}
                  onChange={(e) => setNewQuestionExplanation(e.target.value)}
                  placeholder="Keterangan pembahasan konsep..."
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="pt-4 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsManualQuestionModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSavingNewQuestion}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white rounded-xl font-bold cursor-pointer flex items-center gap-2"
                >
                  {isSavingNewQuestion && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{isSavingNewQuestion ? 'Menyimpan Soal...' : 'Simpan Soal'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL EDIT UJIAN (CRUD EDIT UJIAN) */}
      {isEditExamModalOpen && editingExam && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-indigo-600" />
                <span>Edit Pengaturan Paket Ujian</span>
              </h3>
              <button
                onClick={() => {
                  setIsEditExamModalOpen(false);
                  setEditingExam(null);
                }}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditExam} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Judul Ujian / Asesmen</label>
                <input
                  type="text"
                  value={editExamForm.title}
                  onChange={(e) => setEditExamForm({ ...editExamForm, title: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Mata Pelajaran</label>
                <select
                  value={editExamForm.subjectId}
                  onChange={(e) => setEditExamForm({ ...editExamForm, subjectId: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                >
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Waktu Mulai</label>
                  <input
                    type="datetime-local"
                    value={editExamForm.startTime}
                    onChange={(e) => setEditExamForm({ ...editExamForm, startTime: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Waktu Selesai</label>
                  <input
                    type="datetime-local"
                    value={editExamForm.endTime}
                    onChange={(e) => setEditExamForm({ ...editExamForm, endTime: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Durasi (Menit)</label>
                  <input
                    type="number"
                    min={10}
                    max={180}
                    value={editExamForm.durationMinutes}
                    onChange={(e) =>
                      setEditExamForm({ ...editExamForm, durationMinutes: Number(e.target.value) })
                    }
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Min. Submit (Menit)</label>
                  <input
                    type="number"
                    min={1}
                    max={60}
                    value={editExamForm.minSubmitMinutes}
                    onChange={(e) =>
                      setEditExamForm({ ...editExamForm, minSubmitMinutes: Number(e.target.value) })
                    }
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nilai KKM</label>
                  <input
                    type="number"
                    min={50}
                    max={100}
                    value={editExamForm.kkm}
                    onChange={(e) => setEditExamForm({ ...editExamForm, kkm: Number(e.target.value) })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono"
                    required
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
                <span className="font-bold text-slate-800 block mb-1">Pengaturan Ujian:</span>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editExamForm.releaseScore}
                    onChange={(e) =>
                      setEditExamForm({ ...editExamForm, releaseScore: e.target.checked })
                    }
                    className="rounded text-indigo-600"
                  />
                  <span>Rilis Nilai & Pembahasan Langsung ke Siswa setelah Ujian</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editExamForm.lockdownBrowser}
                    onChange={(e) =>
                      setEditExamForm({ ...editExamForm, lockdownBrowser: e.target.checked })
                    }
                    className="rounded text-indigo-600"
                  />
                  <span>Mode Anti-Curang Lockdown (Layar Penuh, Anti-Copy, Pantau Pindah Tab)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editExamForm.randomizeQuestions}
                    onChange={(e) =>
                      setEditExamForm({ ...editExamForm, randomizeQuestions: e.target.checked })
                    }
                    className="rounded text-indigo-600"
                  />
                  <span>Acak Urutan Nomor Soal untuk Setiap Siswa</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editExamForm.randomizeOptions}
                    onChange={(e) =>
                      setEditExamForm({ ...editExamForm, randomizeOptions: e.target.checked })
                    }
                    className="rounded text-indigo-600"
                  />
                  <span>Acak Opsi Jawaban (Pilihan Ganda) untuk Setiap Siswa</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editExamForm.allowRetake}
                    onChange={(e) =>
                      setEditExamForm({ ...editExamForm, allowRetake: e.target.checked })
                    }
                    className="rounded text-indigo-600"
                  />
                  <span>Izinkan Remedial / Pengulangan Ujian</span>
                </label>
              </div>

              <div className="pt-4 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditExamModalOpen(false);
                    setEditingExam(null);
                  }}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSavingEditExam}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white rounded-xl font-bold cursor-pointer flex items-center gap-2"
                >
                  {isSavingEditExam && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{isSavingEditExam ? 'Menyimpan Perubahan...' : 'Simpan Perubahan Ujian'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL EDIT SOAL (CRUD EDIT SOAL) */}
      {isEditQuestionModalOpen && editingQuestion && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-indigo-600" />
                <span>Edit Butir Soal ({editingQuestion.type.replace(/_/g, ' ')})</span>
              </h3>
              <button
                onClick={() => {
                  setIsEditQuestionModalOpen(false);
                  setEditingQuestion(null);
                }}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditQuestion} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Teks Soal / Pertanyaan / Stimulus
                </label>
                <textarea
                  rows={3}
                  value={editQuestionForm.prompt}
                  onChange={(e) => setEditQuestionForm({ ...editQuestionForm, prompt: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Bobot Poin Soal</label>
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={editQuestionForm.points}
                  onChange={(e) =>
                    setEditQuestionForm({ ...editQuestionForm, points: Number(e.target.value) })
                  }
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl font-mono"
                  required
                />
              </div>

              {/* Options for single choice */}
              {editingQuestion.type === 'pilihan_ganda' && (
                <div className="space-y-2">
                  <label className="block font-bold text-slate-700">Pilihan Jawaban (Pilih 1 Kunci):</label>
                  {editQuestionForm.options.map((opt, oIdx) => (
                    <div key={oIdx} className="flex items-center gap-2">
                      <span className="w-6 font-bold text-slate-500">
                        {String.fromCharCode(65 + oIdx)}.
                      </span>
                      <input
                        type="text"
                        value={opt}
                        onChange={(e) => {
                          const copy = [...editQuestionForm.options];
                          copy[oIdx] = e.target.value;
                          setEditQuestionForm({ ...editQuestionForm, options: copy });
                        }}
                        placeholder={`Pilihan ${String.fromCharCode(65 + oIdx)}...`}
                        className="flex-1 p-2 bg-slate-50 border border-slate-300 rounded-xl"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setEditQuestionForm({
                            ...editQuestionForm,
                            correctAnswer: opt,
                          })
                        }
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold cursor-pointer transition ${
                          editQuestionForm.correctAnswer === opt
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {editQuestionForm.correctAnswer === opt ? 'Kunci Jawaban' : 'Set Kunci'}
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Options for Pilihan Ganda Kompleks */}
              {editingQuestion.type === 'pilihan_ganda_kompleks' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block font-bold text-slate-700">Pilihan Jawaban & Centang Kunci Benar:</label>
                    <span className="text-[11px] text-indigo-600 font-semibold">
                      {editQuestionForm.correctAnswers.length} Kunci Terpilih
                    </span>
                  </div>
                  {editQuestionForm.options.map((opt, oIdx) => {
                    const isChecked = editQuestionForm.correctAnswers.includes(opt);
                    return (
                      <div key={oIdx} className="flex items-center gap-2">
                        <span className="w-6 font-bold text-slate-500">
                          {String.fromCharCode(65 + oIdx)}.
                        </span>
                        <input
                          type="text"
                          value={opt}
                          onChange={(e) => {
                            const oldVal = editQuestionForm.options[oIdx];
                            const newVal = e.target.value;
                            const copy = [...editQuestionForm.options];
                            copy[oIdx] = newVal;
                            let newCorrects = [...editQuestionForm.correctAnswers];
                            if (newCorrects.includes(oldVal)) {
                              newCorrects = newCorrects.map((c) => (c === oldVal ? newVal : c));
                            }
                            setEditQuestionForm({
                              ...editQuestionForm,
                              options: copy,
                              correctAnswers: newCorrects,
                            });
                          }}
                          placeholder={`Pilihan ${String.fromCharCode(65 + oIdx)}...`}
                          className="flex-1 p-2 bg-slate-50 border border-slate-300 rounded-xl"
                        />
                        <label className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer text-[11px] font-semibold text-slate-700">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setEditQuestionForm({
                                  ...editQuestionForm,
                                  correctAnswers: [...editQuestionForm.correctAnswers, opt],
                                });
                              } else {
                                setEditQuestionForm({
                                  ...editQuestionForm,
                                  correctAnswers: editQuestionForm.correctAnswers.filter((c) => c !== opt),
                                });
                              }
                            }}
                            className="rounded text-indigo-600"
                          />
                          <span>Kunci</span>
                        </label>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Menjodohkan (Pemetaan Fungsi: Domain A -> Kodomain B) */}
              {editingQuestion.type === 'menjodohkan' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="block font-bold text-slate-700">
                        Pasangan Pemetaan Fungsi (Domain A ➔ Kodomain B):
                      </label>
                      <p className="text-[11px] text-slate-500">Edit pasangan soal (kiri) dan kunci jawaban (kanan).</p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setEditQuestionForm({
                          ...editQuestionForm,
                          matchingPairs: [
                            ...editQuestionForm.matchingPairs,
                            { premise: '', match: '' },
                          ],
                        })
                      }
                      className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg font-bold text-[11px] cursor-pointer"
                    >
                      + Tambah Pasangan
                    </button>
                  </div>
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {editQuestionForm.matchingPairs.map((pair, pIdx) => (
                      <div key={pIdx} className="flex items-center gap-2 p-2 bg-slate-50 rounded-xl border border-slate-200">
                        <span className="font-bold text-slate-500 w-5 text-center">{pIdx + 1}.</span>
                        <input
                          type="text"
                          value={pair.premise}
                          onChange={(e) => {
                            const updated = [...editQuestionForm.matchingPairs];
                            updated[pIdx].premise = e.target.value;
                            setEditQuestionForm({ ...editQuestionForm, matchingPairs: updated });
                          }}
                          placeholder="Pertanyaan / Domain A..."
                          className="flex-1 p-2 bg-white border border-slate-300 rounded-lg text-xs"
                          required
                        />
                        <span className="text-indigo-600 font-bold">➔</span>
                        <input
                          type="text"
                          value={pair.match}
                          onChange={(e) => {
                            const updated = [...editQuestionForm.matchingPairs];
                            updated[pIdx].match = e.target.value;
                            setEditQuestionForm({ ...editQuestionForm, matchingPairs: updated });
                          }}
                          placeholder="Kunci Jawaban / Kodomain B..."
                          className="flex-1 p-2 bg-white border border-slate-300 rounded-lg text-xs"
                          required
                        />
                        {editQuestionForm.matchingPairs.length > 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              const updated = editQuestionForm.matchingPairs.filter((_, idx) => idx !== pIdx);
                              setEditQuestionForm({ ...editQuestionForm, matchingPairs: updated });
                            }}
                            className="text-rose-500 hover:text-rose-700 p-1 cursor-pointer"
                            title="Hapus baris pasangan"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Benar dan Salah */}
              {editingQuestion.type === 'benar_salah' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="block font-bold text-slate-700">Daftar Pernyataan & Kunci Jawaban:</label>
                      <p className="text-[11px] text-slate-500">Edit teks pernyataan dan status nilai (Benar/Salah).</p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setEditQuestionForm({
                          ...editQuestionForm,
                          trueFalseStatements: [
                            ...editQuestionForm.trueFalseStatements,
                            { statement: '', answer: 'Benar' },
                          ],
                        })
                      }
                      className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg font-bold text-[11px] cursor-pointer"
                    >
                      + Tambah Pernyataan
                    </button>
                  </div>
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {editQuestionForm.trueFalseStatements.map((stmt, sIdx) => (
                      <div key={sIdx} className="flex items-center gap-2 p-2 bg-slate-50 rounded-xl border border-slate-200">
                        <span className="font-bold text-slate-500 w-5 text-center">{sIdx + 1}.</span>
                        <input
                          type="text"
                          value={stmt.statement}
                          onChange={(e) => {
                            const updated = [...editQuestionForm.trueFalseStatements];
                            updated[sIdx].statement = e.target.value;
                            setEditQuestionForm({ ...editQuestionForm, trueFalseStatements: updated });
                          }}
                          placeholder="Tuliskan pernyataan evaluasi..."
                          className="flex-1 p-2 bg-white border border-slate-300 rounded-lg text-xs"
                          required
                        />
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              const updated = [...editQuestionForm.trueFalseStatements];
                              updated[sIdx].answer = 'Benar';
                              setEditQuestionForm({ ...editQuestionForm, trueFalseStatements: updated });
                            }}
                            className={`px-2.5 py-1 rounded-md text-[11px] font-bold cursor-pointer transition ${
                              stmt.answer === 'Benar'
                                ? 'bg-emerald-600 text-white'
                                : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                            }`}
                          >
                            Benar
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const updated = [...editQuestionForm.trueFalseStatements];
                              updated[sIdx].answer = 'Salah';
                              setEditQuestionForm({ ...editQuestionForm, trueFalseStatements: updated });
                            }}
                            className={`px-2.5 py-1 rounded-md text-[11px] font-bold cursor-pointer transition ${
                              stmt.answer === 'Salah'
                                ? 'bg-rose-600 text-white'
                                : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                            }`}
                          >
                            Salah
                          </button>
                        </div>
                        {editQuestionForm.trueFalseStatements.length > 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              const updated = editQuestionForm.trueFalseStatements.filter((_, idx) => idx !== sIdx);
                              setEditQuestionForm({ ...editQuestionForm, trueFalseStatements: updated });
                            }}
                            className="text-rose-500 hover:text-rose-700 p-1 cursor-pointer"
                            title="Hapus pernyataan"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Isian / Essay */}
              {editingQuestion.type === 'isian' && (
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Kunci Jawaban Isian</label>
                  <input
                    type="text"
                    value={editQuestionForm.correctAnswer}
                    onChange={(e) =>
                      setEditQuestionForm({ ...editQuestionForm, correctAnswer: e.target.value })
                    }
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl font-mono"
                    required
                  />
                </div>
              )}

              {editingQuestion.type === 'essay' && (
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Pedoman Penilaian / Rubrik Uraian
                  </label>
                  <textarea
                    rows={2}
                    value={editQuestionForm.essayRubric}
                    onChange={(e) =>
                      setEditQuestionForm({ ...editQuestionForm, essayRubric: e.target.value })
                    }
                    placeholder="Pedoman poin penskoran untuk guru/pengawas..."
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl"
                  />
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 mb-1">Penjelasan Pembahasan</label>
                <input
                  type="text"
                  value={editQuestionForm.explanation}
                  onChange={(e) =>
                    setEditQuestionForm({ ...editQuestionForm, explanation: e.target.value })
                  }
                  placeholder="Keterangan pembahasan konsep..."
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="pt-4 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditQuestionModalOpen(false);
                    setEditingQuestion(null);
                  }}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSavingEditQuestion}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white rounded-xl font-bold cursor-pointer flex items-center gap-2"
                >
                  {isSavingEditQuestion && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{isSavingEditQuestion ? 'Menyimpan Soal...' : 'Simpan Perubahan Soal'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REKAP PRINT MODAL (Official Indonesian Class Rekap Kop Surat + Print) */}
      <RekapPrintModal
        isOpen={isPrintRekapModalOpen}
        onClose={() => setIsPrintRekapModalOpen(false)}
        exam={selectedExam || null}
        attempts={filteredRekapAttempts}
        settings={settings}
      />

      {/* ========================================================= */}
      {/* IN-APP CONFIRMATION MODAL (NO WINDOW.CONFIRM / IFRAME SAFE) */}
      {/* ========================================================= */}
      {deleteConfirm.isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-scaleUp">
            <div className="flex items-start gap-4">
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                  deleteConfirm.type === 'force_submit'
                    ? 'bg-amber-100 text-amber-600'
                    : 'bg-rose-100 text-rose-600'
                }`}
              >
                {deleteConfirm.type === 'force_submit' ? (
                  <Clock className="w-6 h-6 text-amber-600" />
                ) : (
                  <Trash2 className="w-6 h-6 text-rose-600" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-extrabold text-base text-slate-900 leading-tight">
                  {deleteConfirm.type === 'force_submit'
                    ? 'Konfirmasi Kumpulkan Ujian Siswa'
                    : deleteConfirm.type === 'exam'
                    ? 'Konfirmasi Hapus Paket Ujian'
                    : 'Konfirmasi Hapus Butir Soal'}
                </h3>
                <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                  {deleteConfirm.type === 'force_submit' ? (
                    <>
                      Apakah Anda yakin ingin menghentikan dan memaksa pengumpulan lembar ujian siswa{' '}
                      <strong className="text-slate-900 font-semibold underline decoration-amber-400">
                        "{deleteConfirm.title}"
                      </strong>
                      ?
                    </>
                  ) : (
                    <>
                      Apakah Anda yakin ingin menghapus {deleteConfirm.subtitle || 'data'}{' '}
                      <strong className="text-slate-900 font-semibold underline decoration-rose-400">
                        "{deleteConfirm.title}"
                      </strong>
                      ?
                    </>
                  )}
                </p>

                <div
                  className={`mt-3 p-3 rounded-xl text-[11px] font-medium flex items-center gap-2 border ${
                    deleteConfirm.type === 'force_submit'
                      ? 'bg-amber-50/90 border-amber-200 text-amber-800'
                      : 'bg-rose-50/90 border-rose-200 text-rose-700'
                  }`}
                >
                  <AlertTriangle
                    className={`w-4 h-4 shrink-0 ${
                      deleteConfirm.type === 'force_submit' ? 'text-amber-500' : 'text-rose-500'
                    }`}
                  />
                  <span>
                    {deleteConfirm.type === 'force_submit'
                      ? 'Lembar jawaban siswa akan langsung tersimpan & siswa tidak dapat melanjutkan ujian.'
                      : 'Tindakan ini bersifat permanen dan data yang dihapus tidak dapat dipulihkan.'}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() =>
                  setDeleteConfirm({
                    isOpen: false,
                    id: '',
                    title: '',
                    type: 'exam',
                  })
                }
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Batalkan
              </button>
              <button
                type="button"
                id="btn-guru-confirm-action"
                onClick={executeDelete}
                className={`px-4 py-2.5 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-sm flex items-center gap-1.5 ${
                  deleteConfirm.type === 'force_submit'
                    ? 'bg-amber-600 hover:bg-amber-700'
                    : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                {deleteConfirm.type === 'force_submit' ? (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    <span>Ya, Kumpulkan Sekarang</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>Ya, Hapus Sekarang</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* FLOATING TOAST NOTIFICATIONS (GURU / PENGAWAS)             */}
      {/* ========================================================= */}
      <div className="fixed top-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto p-4 rounded-2xl shadow-xl border flex items-start gap-3 transition-all duration-300 transform translate-y-0 ${
              toast.type === 'delete'
                ? 'bg-rose-900/95 text-white border-rose-700 shadow-rose-900/20'
                : toast.type === 'error'
                ? 'bg-amber-900/95 text-white border-amber-700 shadow-amber-900/20'
                : 'bg-slate-900/95 text-white border-slate-700 shadow-slate-900/20'
            }`}
          >
            <div className="mt-0.5 shrink-0">
              {toast.type === 'delete' ? (
                <div className="w-7 h-7 rounded-lg bg-rose-500/30 border border-rose-400/40 flex items-center justify-center">
                  <Trash2 className="w-4 h-4 text-rose-300" />
                </div>
              ) : toast.type === 'error' ? (
                <div className="w-7 h-7 rounded-lg bg-amber-500/30 border border-amber-400/40 flex items-center justify-center">
                  <AlertCircle className="w-4 h-4 text-amber-300" />
                </div>
              ) : (
                <div className="w-7 h-7 rounded-lg bg-emerald-500/30 border border-emerald-400/40 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0 pr-1">
              <h4 className="text-xs font-bold tracking-tight text-white">{toast.title}</h4>
              <p className="text-[11px] text-slate-200 mt-0.5 leading-snug">{toast.message}</p>
            </div>

            <button
              onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
              className="text-slate-400 hover:text-white p-1 rounded-lg transition shrink-0 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
