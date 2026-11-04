import { useState, useEffect } from 'react';
import {
  Database,
  CheckCircle2,
  XCircle,
  Copy,
  Check,
  ExternalLink,
  RefreshCw,
  X,
  Key,
  Globe,
  UploadCloud,
  Layers,
  ArrowRight,
  ShieldCheck,
  Info,
  CheckCheck,
  AlertCircle,
} from 'lucide-react';
import {
  getTursoConfig,
  saveTursoConfig,
  clearTursoConfig,
  testTursoConnection,
  initTursoSchema,
  getActiveDbProvider,
  setActiveDbProvider,
  getTursoAuthError,
} from '../lib/turso';
import { tursoService } from '../services/tursoService';
import { SchoolSettings, User, Subject, Exam, ExamAttempt } from '../types';

interface TursoConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentData: {
    settings: SchoolSettings;
    users: User[];
    subjects: Subject[];
    exams: Exam[];
    attempts: ExamAttempt[];
  };
  onMigrationSuccess: () => Promise<void>;
}

export default function TursoConfigModal({
  isOpen,
  onClose,
  currentData,
  onMigrationSuccess,
}: TursoConfigModalProps) {
  const [url, setUrl] = useState('');
  const [token, setToken] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; tablesFound?: string[] } | null>(null);
  const [copiedSql, setCopiedSql] = useState(false);
  const [copiedCli, setCopiedCli] = useState(false);
  const [activeTab, setActiveTab] = useState<'config' | 'guide' | 'schema'>('config');
  const [migrationStatus, setMigrationStatus] = useState<string | null>(null);

  const activeProvider = getActiveDbProvider();

  useEffect(() => {
    if (isOpen) {
      const config = getTursoConfig();
      setUrl(config.url);
      setToken(config.authToken);
      setTestResult(null);
      setMigrationStatus(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    const res = await testTursoConnection(url, token);
    setTestResult(res);
    if (res.normalizedUrl) {
      setUrl(res.normalizedUrl);
    }
    setIsTesting(false);
  };

  const handleInitSchema = async () => {
    if (!url || !token) {
      setTestResult({
        success: false,
        message: 'Masukkan URL dan Token Turso terlebih dahulu sebelum membuat tabel.',
      });
      return;
    }

    saveTursoConfig(url, token);
    setIsInitializing(true);
    try {
      const res = await initTursoSchema();
      setTestResult(res);
      if (res.success) {
        // Refresh test connection to show detected tables
        const recheck = await testTursoConnection(url, token);
        setTestResult(recheck);
      }
    } finally {
      setIsInitializing(false);
    }
  };

  const handleMigrateAll = async () => {
    if (!url || !token) {
      setTestResult({
        success: false,
        message: 'Harap isi URL Turso dan Auth Token sebelum melakukan migrasi.',
      });
      return;
    }

    saveTursoConfig(url, token);
    setIsMigrating(true);
    setMigrationStatus('Memulai migrasi data ke Turso database...');

    try {
      setMigrationStatus('1/5 Menginisialisasi skema tabel SQLite di Turso...');
      const res = await tursoService.migrateAllToTurso({
        settings: currentData.settings,
        users: currentData.users,
        subjects: currentData.subjects,
        exams: currentData.exams,
        attempts: currentData.attempts,
      });

      if (res.success) {
        setActiveDbProvider('turso');
        setTestResult({
          success: true,
          message: res.message,
        });
        setMigrationStatus('Migrasi selesai! Database Turso sekarang menjadi database aktif aplikasi.');
        await onMigrationSuccess();
      } else {
        setTestResult({
          success: false,
          message: res.message,
        });
        setMigrationStatus('Migrasi gagal. Silakan periksa pesan kesalahan di atas.');
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: `Terjadi kendala saat migrasi: ${err?.message || err}`,
      });
      setMigrationStatus('Terjadi kesalahan jaringan atau autentikasi saat migrasi.');
    } finally {
      setIsMigrating(false);
    }
  };

  const handleSaveOnly = () => {
    saveTursoConfig(url, token);
    setActiveDbProvider('turso');
    setTestResult({
      success: true,
      message: 'Konfigurasi Turso berhasil disimpan dan diaktifkan sebagai database utama!',
    });
  };

  const handleClear = () => {
    clearTursoConfig();
    setUrl('');
    setToken('');
    setTestResult({
      success: true,
      message: 'Kredensial Turso dihapus dari browser.',
    });
  };

  const copySqlSchema = () => {
    const sql = `-- ==============================================================================
-- SKEMA LENGKAP DATABASE TURSO (LIBSQL / SQLITE) UNTUK CBT SMART EXAM PRO
-- ==============================================================================
CREATE TABLE IF NOT EXISTS school_settings (
    id TEXT PRIMARY KEY DEFAULT 'default_school',
    app_name TEXT NOT NULL DEFAULT 'SMART CBT PRO',
    school_name TEXT NOT NULL DEFAULT 'SMP NEGERI 1 CERDAS MANDIRI',
    school_npsn TEXT DEFAULT '20210099',
    school_address TEXT DEFAULT '',
    school_city TEXT DEFAULT '',
    academic_year TEXT DEFAULT '2025/2026',
    semester TEXT DEFAULT 'Genap',
    principal_name TEXT DEFAULT '',
    principal_nip TEXT DEFAULT '',
    logo_url TEXT DEFAULT '',
    dinas_name TEXT DEFAULT 'PEMERINTAH KABUPATEN KOTABARU',
    kabupaten_name TEXT DEFAULT 'DINAS PENDIDIKAN DAN KEBUDAYAAN',
    signature_location TEXT DEFAULT 'Kotabaru',
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'guru', 'siswa')),
    nip_nisn TEXT DEFAULT '',
    class_grade TEXT DEFAULT '',
    gender TEXT DEFAULT 'L' CHECK (gender IN ('L', 'P')),
    subject_name TEXT DEFAULT '',
    subject_names TEXT DEFAULT '[]',
    avatar_url TEXT DEFAULT '',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS subjects (
    id TEXT PRIMARY KEY,
    code TEXT NOT NULL,
    name TEXT NOT NULL,
    grade_level TEXT DEFAULT 'Semua Kelas',
    teacher_name TEXT DEFAULT '',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS exams (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    subject_id TEXT DEFAULT '',
    subject_name TEXT NOT NULL,
    teacher_id TEXT NOT NULL,
    teacher_name TEXT NOT NULL,
    target_classes TEXT NOT NULL DEFAULT '[]',
    start_time TEXT DEFAULT '',
    end_time TEXT DEFAULT '',
    duration_minutes INTEGER NOT NULL DEFAULT 60,
    min_submit_minutes INTEGER NOT NULL DEFAULT 15,
    kkm REAL NOT NULL DEFAULT 75,
    allow_retake INTEGER DEFAULT 0,
    max_retakes INTEGER DEFAULT 1,
    release_score INTEGER DEFAULT 1,
    randomize_questions INTEGER DEFAULT 0,
    randomize_options INTEGER DEFAULT 0,
    lockdown_browser INTEGER DEFAULT 1,
    max_violations INTEGER DEFAULT 3,
    token TEXT DEFAULT '',
    questions TEXT NOT NULL DEFAULT '[]',
    status TEXT NOT NULL DEFAULT 'active',
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS exam_attempts (
    id TEXT PRIMARY KEY,
    exam_id TEXT NOT NULL,
    exam_title TEXT NOT NULL,
    subject_name TEXT NOT NULL,
    student_id TEXT NOT NULL,
    student_name TEXT NOT NULL,
    student_nisn TEXT DEFAULT '',
    student_class TEXT DEFAULT '',
    started_at TEXT DEFAULT CURRENT_TIMESTAMP,
    submitted_at TEXT,
    answers TEXT NOT NULL DEFAULT '{}',
    doubtful_answers TEXT DEFAULT '{}',
    scores TEXT DEFAULT '{}',
    total_score REAL DEFAULT 0,
    max_possible_score REAL DEFAULT 100,
    total_earned_points REAL DEFAULT 0,
    total_max_points REAL DEFAULT 100,
    score_percentage REAL DEFAULT 0,
    passed_kkm INTEGER DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'in_progress',
    violation_count INTEGER DEFAULT 0,
    violation_logs TEXT DEFAULT '[]',
    teacher_feedback TEXT DEFAULT '',
    is_graded INTEGER DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_exams_teacher ON exams(teacher_id);
CREATE INDEX IF NOT EXISTS idx_attempts_student_exam ON exam_attempts(student_id, exam_id);
CREATE INDEX IF NOT EXISTS idx_attempts_exam ON exam_attempts(exam_id);`;

    navigator.clipboard.writeText(sql);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  const copyCliCommands = () => {
    const cmds = `# 1. Instal Turso CLI (jika belum)
curl -sSfL https://get.tur.so/install.sh | bash

# 2. Login ke akun Turso Anda
turso auth login

# 3. Buat database baru untuk CBT
turso db create cbt-sekolah

# 4. Dapatkan Database URL (libsql://...)
turso db show cbt-sekolah --url

# 5. Buat Auth Token
turso db tokens create cbt-sekolah`;

    navigator.clipboard.writeText(cmds);
    setCopiedCli(true);
    setTimeout(() => setCopiedCli(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl my-8 overflow-hidden animate-in fade-in duration-200">
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center backdrop-blur-xs border border-white/20">
              <Database className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black tracking-tight">Migrasi Database Turso</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black tracking-wide uppercase bg-white/20 text-white border border-white/30">
                  LibSQL SQLite
                </span>
              </div>
              <p className="text-xs text-emerald-100">
                Pindah ke Turso Database untuk latency super cepat, replikasi edge, dan performa tinggi
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 pt-3 gap-2">
          <button
            onClick={() => setActiveTab('config')}
            className={`pb-3 px-3 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border-b-2 ${
              activeTab === 'config'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>Koneksi & Migrasi</span>
          </button>
          <button
            onClick={() => setActiveTab('guide')}
            className={`pb-3 px-3 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border-b-2 ${
              activeTab === 'guide'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Info className="w-3.5 h-3.5" />
            <span>Panduan Buat Turso</span>
          </button>
          <button
            onClick={() => setActiveTab('schema')}
            className={`pb-3 px-3 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border-b-2 ${
              activeTab === 'schema'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Skrip SQL SQLite</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
          {activeTab === 'config' && (
            <>
              {/* Active Provider Indicator */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${
                      activeProvider === 'turso' && getTursoConfig().isConfigured
                        ? 'bg-emerald-500 animate-pulse'
                        : 'bg-amber-400'
                    }`}
                  />
                  <span className="font-bold text-slate-700">Database Aktif Aplikasi:</span>
                  <span className="font-extrabold text-emerald-700">
                    {activeProvider === 'turso' ? 'Turso Database (LibSQL)' : activeProvider === 'supabase' ? 'Supabase' : 'Lokal (Offline)'}
                  </span>
                </div>
                {activeProvider !== 'turso' && getTursoConfig().isConfigured && (
                  <button
                    onClick={() => {
                      setActiveDbProvider('turso');
                      setTestResult({
                        success: true,
                        message: 'Berhasil beralih ke Turso Database!',
                      });
                    }}
                    className="text-[11px] font-bold text-emerald-600 hover:underline cursor-pointer"
                  >
                    Jadikan Turso Aktif
                  </button>
                )}
              </div>

              {/* Active Auth Error Banner (e.g. 401 Unauthorized) */}
              {getTursoAuthError() && (
                <div className="p-3.5 bg-rose-50 border border-rose-300 rounded-2xl text-xs space-y-1.5 animate-fadeIn">
                  <div className="flex items-center gap-2 font-black text-rose-800">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>Autentikasi Turso Ditolak (HTTP 401 Unauthorized)</span>
                  </div>
                  <p className="text-rose-700 text-[11px] leading-relaxed">
                    Auth Token yang tersimpan tidak valid atau sudah kedaluwarsa. Aplikasi saat ini <strong>otomatis mengamankan data ke penyimpanan lokal (offline)</strong> sehingga tidak ada data atau profil sekolah yang hilang.
                  </p>
                  <p className="text-rose-800 text-[11px] font-semibold">
                    &rarr; Solusi: Buat token baru di tab <strong>Tokens</strong> dashboard Turso, tempelkan di kolom Auth Token di bawah, lalu klik <strong>"Uji Koneksi Turso"</strong>.
                  </p>
                </div>
              )}

              {/* Troubleshooting & Guide Banner */}
              <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl text-xs space-y-2">
                <div className="flex items-center gap-2 font-black text-amber-900">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Belum bisa terhubung ke Turso? Periksa 3 hal berikut:</span>
                </div>
                <ul className="space-y-1.5 text-amber-800 text-[11px] list-disc list-inside">
                  <li>
                    <strong>Database URL Bukan Link Website:</strong> Jangan salin link browser seperti <code className="font-mono bg-white px-1 py-0.5 rounded text-amber-900">https://turso.tech/app/...</code>. Gunakan Database URL yang berakhiran <code className="font-mono bg-white px-1 py-0.5 rounded text-amber-900">.turso.io</code> (contoh: <code className="font-mono bg-white px-1 py-0.5 rounded text-emerald-800">libsql://cbt-sekolah-user.turso.io</code>).
                  </li>
                  <li>
                    <strong>Auth Token:</strong> Bukan password login akun Turso, melainkan JWT token yang dibuat di menu <em>Tokens</em> pada database Anda atau lewat perintah <code className="font-mono bg-white px-1 py-0.5 rounded text-amber-900">turso db tokens create &lt;nama-db&gt;</code>.
                  </li>
                  <li>
                    <strong>Sudah Buat Database?</strong> Jika belum pernah membuat database di Turso, buka tab <em>"Panduan Buat Turso"</em> di atas untuk tutorial 1 menit.
                  </li>
                </ul>
              </div>

              {/* Form Input URL & Token */}
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Turso Database URL</span>
                      <span className="text-rose-500">*</span>
                    </label>
                    <a
                      href="https://turso.tech"
                      target="_blank"
                      rel="noreferrer"
                      className="text-[11px] font-bold text-emerald-600 hover:underline flex items-center gap-1"
                    >
                      Buka Dashboard Turso
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>

                  <input
                    type="text"
                    placeholder="libsql://cbt-sekolah-username.turso.io atau https://..."
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 transition ${
                      url.includes('turso.tech/app') || url.includes('app.turso.tech')
                        ? 'border-rose-400 focus:ring-rose-500 bg-rose-50/40'
                        : 'border-slate-300 focus:ring-emerald-500'
                    }`}
                  />

                  {/* Live Validation Feedback for URL */}
                  {url.trim().length > 0 && (url.includes('turso.tech/app') || url.includes('app.turso.tech')) ? (
                    <div className="mt-1.5 p-2 bg-rose-50 border border-rose-200 rounded-lg text-[11px] text-rose-700 flex items-start gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
                      <div>
                        <strong>Perhatian:</strong> Ini adalah link website konsol Turso, bukan URL database. Buka halaman database Anda di Turso, lalu salin URL yang ada di bagian <em>"Database URL"</em> (berakhiran <code>.turso.io</code>).
                      </div>
                    </div>
                  ) : url.trim().length > 0 && !url.startsWith('libsql://') && !url.startsWith('https://') && !url.startsWith('http://') ? (
                    <div className="mt-1 text-[11px] text-teal-700 flex items-center gap-1">
                      <Check className="w-3 h-3 text-teal-600" />
                      <span>Sistem akan otomatis menambahkan protokol <code className="font-mono font-bold">https://</code> saat menghubungkan.</span>
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-500 mt-1">
                      Format valid: <code className="font-mono text-slate-700">libsql://cbt-sekolah-namaorg.turso.io</code> atau <code className="font-mono text-slate-700">https://cbt-sekolah-namaorg.turso.io</code>
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5 text-teal-600" />
                    <span>Turso Auth Token</span>
                    <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="password"
                    placeholder="eyJhbGciOiJFZERTQ..."
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
                  />

                  {/* Visual Guide Box for finding Auth Token */}
                  <div className="mt-2 p-3 bg-teal-50/70 border border-teal-200 rounded-xl text-[11px] text-teal-900 space-y-1.5">
                    <div className="font-bold flex items-center gap-1.5 text-teal-950">
                      <Key className="w-3.5 h-3.5 text-teal-700" />
                      <span>Lokasi Tombol Auth Token di Dashboard Turso:</span>
                    </div>
                    <div className="bg-white/80 p-2 rounded-lg border border-teal-200 font-mono text-[10px] space-y-1 text-slate-700">
                      <div>
                        <strong>Cara 1 (Tab Tokens):</strong> Buka database Anda &rarr; Klik tab <span className="bg-teal-100 text-teal-900 px-1 py-0.5 rounded font-bold">"Tokens"</span> (di sebelah tab Overview) &rarr; Klik tombol <span className="bg-teal-600 text-white px-1.5 py-0.5 rounded font-bold">"Create Token"</span> / <span className="bg-teal-600 text-white px-1.5 py-0.5 rounded font-bold">"Generate Token"</span>.
                      </div>
                      <div className="pt-0.5 border-t border-slate-200">
                        <strong>Cara 2 (Tombol Connect):</strong> Pada halaman database di Turso &rarr; Klik tombol <span className="bg-slate-900 text-white px-1.5 py-0.5 rounded font-bold">"Connect"</span> di kanan atas &rarr; Pilih opsi token & copy.
                      </div>
                      <div className="pt-0.5 border-t border-slate-200">
                        <strong>Cara 3 (Lewat CLI di Terminal):</strong> Ketik <code className="bg-slate-100 px-1 py-0.5 rounded font-bold text-slate-900">turso db tokens create &lt;nama-db&gt;</code>
                      </div>
                    </div>
                  </div>

                  {/* Live Validation Feedback for Token */}
                  {token.toLowerCase().trim().startsWith('bearer ') ? (
                    <div className="mt-1 text-[11px] text-teal-700 flex items-center gap-1">
                      <Check className="w-3 h-3 text-teal-600" />
                      <span>Awalan 'Bearer ' akan otomatis dibersihkan oleh sistem.</span>
                    </div>
                  ) : null}
                </div>
              </div>

              {/* Data Summary to be Migrated */}
              <div className="p-4 bg-emerald-50/70 border border-emerald-100 rounded-2xl">
                <div className="flex items-center gap-2 mb-2 text-xs font-bold text-emerald-900">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Data yang Siap Dimigrasikan ke Turso:</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                  <div className="bg-white p-2 rounded-xl border border-emerald-200">
                    <div className="text-lg font-black text-slate-800">{currentData.users.length}</div>
                    <div className="text-[10px] text-slate-500 font-medium">Pengguna</div>
                  </div>
                  <div className="bg-white p-2 rounded-xl border border-emerald-200">
                    <div className="text-lg font-black text-slate-800">{currentData.subjects.length}</div>
                    <div className="text-[10px] text-slate-500 font-medium">Mata Pelajaran</div>
                  </div>
                  <div className="bg-white p-2 rounded-xl border border-emerald-200">
                    <div className="text-lg font-black text-slate-800">{currentData.exams.length}</div>
                    <div className="text-[10px] text-slate-500 font-medium">Paket Ujian</div>
                  </div>
                  <div className="bg-white p-2 rounded-xl border border-emerald-200">
                    <div className="text-lg font-black text-slate-800">{currentData.attempts.length}</div>
                    <div className="text-[10px] text-slate-500 font-medium">Riwayat Siswa</div>
                  </div>
                </div>
                <div className="mt-2 text-[11px] text-emerald-800">
                  Profil sekolah ({currentData.settings.schoolName}) dan pengaturan aplikasi juga akan tersimpan otomatis.
                </div>
              </div>

              {/* Test & Migration Feedback Result */}
              {testResult && (
                <div
                  className={`p-3.5 rounded-xl border flex items-start gap-3 text-xs ${
                    testResult.success
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      : 'bg-rose-50 border-rose-200 text-rose-800'
                  }`}
                >
                  {testResult.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <p className="font-semibold">{testResult.message}</p>
                    {testResult.tablesFound && testResult.tablesFound.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {testResult.tablesFound.map((tbl) => (
                          <span
                            key={tbl}
                            className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-mono text-[10px]"
                          >
                            {tbl}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {migrationStatus && (
                <div className="p-3 bg-cyan-50 border border-cyan-200 rounded-xl text-xs text-cyan-800 flex items-center gap-2">
                  <RefreshCw className={`w-3.5 h-3.5 text-cyan-600 ${isMigrating ? 'animate-spin' : ''}`} />
                  <span className="font-semibold">{migrationStatus}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-2 pt-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    onClick={handleTestConnection}
                    disabled={isTesting || isMigrating}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition disabled:opacity-50 cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
                    <span>{isTesting ? 'Menguji...' : 'Uji Koneksi Turso'}</span>
                  </button>

                  <button
                    onClick={handleInitSchema}
                    disabled={isInitializing || isMigrating}
                    className="px-4 py-2.5 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition disabled:opacity-50 cursor-pointer"
                  >
                    <Layers className="w-3.5 h-3.5 text-teal-600" />
                    <span>{isInitializing ? 'Membuat Tabel...' : 'Buat Tabel Otomatis'}</span>
                  </button>
                </div>

                <button
                  onClick={handleMigrateAll}
                  disabled={isMigrating || isInitializing}
                  className="w-full px-4 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 shadow-sm transition disabled:opacity-50 cursor-pointer"
                >
                  <UploadCloud className={`w-4 h-4 ${isMigrating ? 'animate-bounce' : ''}`} />
                  <span>
                    {isMigrating ? 'Sedang Memigrasikan Data...' : 'Migrasikan Semua Data ke Turso Sekarang'}
                  </span>
                </button>

                <div className="flex items-center justify-between pt-2">
                  <button
                    onClick={handleSaveOnly}
                    className="text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
                  >
                    Simpan Konfigurasi Saja
                  </button>

                  {getTursoConfig().isConfigured && (
                    <button
                      onClick={handleClear}
                      className="text-xs font-semibold text-rose-600 hover:underline cursor-pointer"
                    >
                      Hapus Kredensial Turso
                    </button>
                  )}
                </div>
              </div>
            </>
          )}

          {activeTab === 'guide' && (
            <div className="space-y-4 text-xs">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-extrabold text-slate-900 flex items-center gap-1.5">
                    <ExternalLink className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Langkah Cepat Setup Turso Database</span>
                  </h4>
                  <a
                    href="https://turso.tech"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] font-bold text-emerald-600 hover:underline flex items-center gap-1"
                  >
                    Buka Turso.tech
                    <ArrowRight className="w-3 h-3" />
                  </a>
                </div>

                <ol className="list-decimal list-inside space-y-2 text-slate-700">
                  <li>
                    <strong>Daftar / Login di Turso:</strong> Buat akun gratis di{' '}
                    <a href="https://turso.tech" target="_blank" rel="noreferrer" className="text-emerald-600 underline">
                      turso.tech
                    </a>.
                  </li>
                  <li>
                    <strong>Buat Database:</strong> Masuk ke Dashboard Turso, klik <em>"Create Database"</em> dan beri nama (contoh: <code>cbt-sekolah</code>).
                  </li>
                  <li>
                    <strong>Salin URL Database:</strong> Dapatkan URL koneksi Turso (contoh: <code>libsql://cbt-sekolah-[username].turso.io</code>).
                  </li>
                  <li>
                    <strong>Buat & Salin Auth Token:</strong> Klik tab <em>"Settings"</em> atau <em>"Tokens"</em> pada database Anda, lalu klik <em>"Generate Token"</em>.
                  </li>
                  <li>
                    <strong>Selesai:</strong> Masukkan URL dan Token ke tab "Koneksi & Migrasi", lalu klik tombol <strong>"Migrasikan Semua Data ke Turso Sekarang"</strong>. Tabel dan data akan disalin otomatis!
                  </li>
                </ol>
              </div>

              {/* CLI Commands Box */}
              <div className="p-4 bg-slate-900 text-slate-200 rounded-2xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[11px] font-bold text-emerald-400">
                    Bagi Pengguna Turso CLI di Komputer / Server
                  </span>
                  <button
                    onClick={copyCliCommands}
                    className="px-2 py-1 bg-white/10 hover:bg-white/20 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 transition cursor-pointer"
                  >
                    {copiedCli ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedCli ? 'Tersalin' : 'Salin CLI'}</span>
                  </button>
                </div>
                <pre className="font-mono text-[11px] text-slate-300 overflow-x-auto whitespace-pre bg-black/40 p-2.5 rounded-xl">
                  {`# 1. Login ke Turso
turso auth login

# 2. Buat database baru
turso db create cbt-sekolah

# 3. Ambil URL
turso db show cbt-sekolah --url

# 4. Ambil Auth Token
turso db tokens create cbt-sekolah`}
                </pre>
              </div>
            </div>
          )}

          {activeTab === 'schema' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-extrabold text-xs text-slate-900">
                    Skrip SQLite DDL Turso (turso_schema.sql)
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Skema tabel SQLite yang sudah disesuaikan untuk Turso LibSQL engine.
                  </p>
                </div>
                <button
                  onClick={copySqlSchema}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                >
                  {copiedSql ? <CheckCheck className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedSql ? 'Tersalin!' : 'Salin SQL'}</span>
                </button>
              </div>

              <div className="bg-slate-900 text-slate-200 rounded-xl p-3 font-mono text-[11px] max-h-60 overflow-y-auto whitespace-pre">
                {`CREATE TABLE IF NOT EXISTS school_settings (
    id TEXT PRIMARY KEY DEFAULT 'default_school',
    app_name TEXT NOT NULL DEFAULT 'SMART CBT PRO',
    school_name TEXT NOT NULL DEFAULT 'SMP NEGERI 1 CERDAS MANDIRI',
    school_npsn TEXT DEFAULT '20210099',
    school_address TEXT DEFAULT '',
    school_city TEXT DEFAULT '',
    academic_year TEXT DEFAULT '2025/2026',
    semester TEXT DEFAULT 'Genap',
    principal_name TEXT DEFAULT '',
    principal_nip TEXT DEFAULT '',
    logo_url TEXT DEFAULT '',
    dinas_name TEXT DEFAULT 'PEMERINTAH KABUPATEN KOTABARU',
    kabupaten_name TEXT DEFAULT 'DINAS PENDIDIKAN DAN KEBUDAYAAN',
    signature_location TEXT DEFAULT 'Kotabaru',
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'guru', 'siswa')),
    nip_nisn TEXT DEFAULT '',
    class_grade TEXT DEFAULT '',
    gender TEXT DEFAULT 'L' CHECK (gender IN ('L', 'P')),
    subject_name TEXT DEFAULT '',
    subject_names TEXT DEFAULT '[]',
    avatar_url TEXT DEFAULT '',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS subjects (
    id TEXT PRIMARY KEY,
    code TEXT NOT NULL,
    name TEXT NOT NULL,
    grade_level TEXT DEFAULT 'Semua Kelas',
    teacher_name TEXT DEFAULT '',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS exams (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    subject_id TEXT DEFAULT '',
    subject_name TEXT NOT NULL,
    teacher_id TEXT NOT NULL,
    teacher_name TEXT NOT NULL,
    target_classes TEXT NOT NULL DEFAULT '[]',
    start_time TEXT DEFAULT '',
    end_time TEXT DEFAULT '',
    duration_minutes INTEGER NOT NULL DEFAULT 60,
    min_submit_minutes INTEGER NOT NULL DEFAULT 15,
    kkm REAL NOT NULL DEFAULT 75,
    allow_retake INTEGER DEFAULT 0,
    max_retakes INTEGER DEFAULT 1,
    release_score INTEGER DEFAULT 1,
    randomize_questions INTEGER DEFAULT 0,
    randomize_options INTEGER DEFAULT 0,
    lockdown_browser INTEGER DEFAULT 1,
    max_violations INTEGER DEFAULT 3,
    token TEXT DEFAULT '',
    questions TEXT NOT NULL DEFAULT '[]',
    status TEXT NOT NULL DEFAULT 'active',
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS exam_attempts (
    id TEXT PRIMARY KEY,
    exam_id TEXT NOT NULL,
    exam_title TEXT NOT NULL,
    subject_name TEXT NOT NULL,
    student_id TEXT NOT NULL,
    student_name TEXT NOT NULL,
    student_nisn TEXT DEFAULT '',
    student_class TEXT DEFAULT '',
    started_at TEXT DEFAULT CURRENT_TIMESTAMP,
    submitted_at TEXT,
    answers TEXT NOT NULL DEFAULT '{}',
    doubtful_answers TEXT DEFAULT '{}',
    scores TEXT DEFAULT '{}',
    total_score REAL DEFAULT 0,
    max_possible_score REAL DEFAULT 100,
    total_earned_points REAL DEFAULT 0,
    total_max_points REAL DEFAULT 100,
    score_percentage REAL DEFAULT 0,
    passed_kkm INTEGER DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'in_progress',
    violation_count INTEGER DEFAULT 0,
    violation_logs TEXT DEFAULT '[]',
    teacher_feedback TEXT DEFAULT '',
    is_graded INTEGER DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);`}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <span className="text-[11px] text-slate-500">
            LibSQL Client @libsql/client/web v0.14.0+
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
