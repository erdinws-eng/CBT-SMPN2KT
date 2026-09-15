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
  ShieldCheck,
} from 'lucide-react';
import {
  getSupabaseConfig,
  saveSupabaseConfig,
  clearSupabaseConfig,
  testSupabaseConnection,
} from '../lib/supabase';

interface SupabaseConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSyncNow: () => Promise<void>;
}

export default function SupabaseConfigModal({
  isOpen,
  onClose,
  onSyncNow,
}: SupabaseConfigModalProps) {
  const [url, setUrl] = useState('');
  const [key, setKey] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [copiedSql, setCopiedSql] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const config = getSupabaseConfig();
      setUrl(config.url);
      setKey(config.key);
      setTestResult(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    const res = await testSupabaseConnection(url, key);
    setTestResult(res);
    setIsTesting(false);
  };

  const handleSave = async () => {
    saveSupabaseConfig(url, key);
    setTestResult({
      success: true,
      message: 'Konfigurasi Supabase berhasil disimpan!',
    });
    // Trigger sync
    setIsSyncing(true);
    try {
      await onSyncNow();
    } finally {
      setIsSyncing(false);
    }
  };

  const handleResetToEnv = () => {
    clearSupabaseConfig();
    const config = getSupabaseConfig();
    setUrl(config.url);
    setKey(config.key);
    setTestResult({
      success: true,
      message: 'Pengaturan dikembalikan ke environment variable default.',
    });
  };

  const copySqlSchema = () => {
    const sqlContent = `-- ==============================================================================
-- SKEMA LENGKAP DATABASE SUPABASE UNTUK APLIKASI CBT SMART EXAM PRO
-- Jalankan skrip ini pada menu "SQL Editor" di Dashboard Supabase Anda
-- ==============================================================================

-- BERSIHKAN TABEL LAMA (Jika ada)
DROP TABLE IF EXISTS public.exam_attempts CASCADE;
DROP TABLE IF EXISTS public.exams CASCADE;
DROP TABLE IF EXISTS public.subjects CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;
DROP TABLE IF EXISTS public.school_settings CASCADE;



-- 1. Tabel Pengaturan Sekolah / Madrasah
CREATE TABLE IF NOT EXISTS public.school_settings (
    id TEXT PRIMARY KEY DEFAULT 'default_school',
    school_name TEXT NOT NULL DEFAULT 'SMP NEGERI 1 CERDAS MANDIRI',
    school_npsn TEXT DEFAULT '20210099',
    school_address TEXT DEFAULT 'Jl. Pendidikan Nusantara No. 45, Kompleks Edukasi Terpadu',
    school_city TEXT DEFAULT 'Kota Jakarta Selatan',
    academic_year TEXT DEFAULT '2025/2026',
    semester TEXT DEFAULT 'Genap',
    principal_name TEXT DEFAULT 'Drs. H. Mulyadi, M.Pd.',
    principal_nip TEXT DEFAULT '19750512 199903 1 002',
    logo_url TEXT DEFAULT '',
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tabel Pengguna (Admin, Guru, Siswa)
CREATE TABLE IF NOT EXISTS public.users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'guru', 'siswa')),
    nip_nisn TEXT DEFAULT '',
    class_grade TEXT DEFAULT '',
    gender TEXT CHECK (gender IN ('L', 'P')),
    subject_name TEXT DEFAULT '',
    subject_names JSONB DEFAULT '[]'::JSONB,
    avatar_url TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tabel Mata Pelajaran
CREATE TABLE IF NOT EXISTS public.subjects (
    id TEXT PRIMARY KEY,
    code TEXT NOT NULL,
    name TEXT NOT NULL,
    grade_level TEXT DEFAULT 'Semua Kelas',
    teacher_name TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Tabel Ujian / Asesmen
CREATE TABLE IF NOT EXISTS public.exams (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    subject_id TEXT,
    subject_name TEXT NOT NULL,
    teacher_id TEXT NOT NULL,
    teacher_name TEXT NOT NULL,
    target_classes JSONB NOT NULL DEFAULT '[]'::JSONB,
    start_time TEXT,
    end_time TEXT,
    duration_minutes INTEGER NOT NULL DEFAULT 60,
    min_submit_minutes INTEGER NOT NULL DEFAULT 15,
    kkm NUMERIC NOT NULL DEFAULT 75,
    allow_retake BOOLEAN DEFAULT FALSE,
    max_retakes INTEGER DEFAULT 1,
    release_score BOOLEAN DEFAULT TRUE,
    randomize_questions BOOLEAN DEFAULT FALSE,
    randomize_options BOOLEAN DEFAULT FALSE,
    lockdown_browser BOOLEAN DEFAULT TRUE,
    max_violations INTEGER DEFAULT 3,
    token TEXT DEFAULT '',
    questions JSONB NOT NULL DEFAULT '[]'::JSONB,
    status TEXT NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Tabel Pengerjaan Siswa (Exam Attempts & Anti-Cheat Records)
CREATE TABLE IF NOT EXISTS public.exam_attempts (
    id TEXT PRIMARY KEY,
    exam_id TEXT NOT NULL,
    exam_title TEXT NOT NULL,
    subject_name TEXT NOT NULL,
    student_id TEXT NOT NULL,
    student_name TEXT NOT NULL,
    student_nisn TEXT DEFAULT '',
    student_class TEXT DEFAULT '',
    started_at TIMESTAMPTZ DEFAULT NOW(),
    submitted_at TIMESTAMPTZ,
    answers JSONB NOT NULL DEFAULT '{}'::JSONB,
    doubtful_answers JSONB DEFAULT '{}'::JSONB,
    scores JSONB DEFAULT '{}'::JSONB,
    total_score NUMERIC DEFAULT 0,
    max_possible_score NUMERIC DEFAULT 100,
    total_earned_points NUMERIC DEFAULT 0,
    total_max_points NUMERIC DEFAULT 100,
    score_percentage NUMERIC DEFAULT 0,
    passed_kkm BOOLEAN DEFAULT FALSE,
    status TEXT NOT NULL DEFAULT 'in_progress',
    violation_count INTEGER DEFAULT 0,
    violation_logs JSONB DEFAULT '[]'::JSONB,
    teacher_feedback TEXT DEFAULT '',
    is_graded BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- KEBIJAKAN ROW LEVEL SECURITY (RLS)
-- Mengizinkan akses publik/anon untuk aplikasi frontend CBT
-- ==============================================================================
ALTER TABLE public.school_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_attempts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Akses Penuh School Settings" ON public.school_settings;
CREATE POLICY "Akses Penuh School Settings" ON public.school_settings FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Akses Penuh Users" ON public.users;
CREATE POLICY "Akses Penuh Users" ON public.users FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Akses Penuh Subjects" ON public.subjects;
CREATE POLICY "Akses Penuh Subjects" ON public.subjects FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Akses Penuh Exams" ON public.exams;
CREATE POLICY "Akses Penuh Exams" ON public.exams FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Akses Penuh Exam Attempts" ON public.exam_attempts;
CREATE POLICY "Akses Penuh Exam Attempts" ON public.exam_attempts FOR ALL USING (true) WITH CHECK (true);

-- ==============================================================================
-- DATA AWAL (SEED DATA)
-- ==============================================================================
INSERT INTO public.school_settings (id, school_name, school_npsn, school_address, school_city, academic_year, semester, principal_name, principal_nip)
VALUES (
    'default_school',
    'SMP NEGERI 1 CERDAS MANDIRI',
    '20210099',
    'Jl. Pendidikan Nusantara No. 45, Kompleks Edukasi Terpadu',
    'Kota Jakarta Selatan',
    '2025/2026',
    'Genap',
    'Drs. H. Mulyadi, M.Pd.',
    '19750512 199903 1 002'
) ON CONFLICT (id) DO UPDATE SET 
    school_name = EXCLUDED.school_name,
    school_npsn = EXCLUDED.school_npsn,
    school_address = EXCLUDED.school_address,
    school_city = EXCLUDED.school_city,
    academic_year = EXCLUDED.academic_year,
    semester = EXCLUDED.semester,
    principal_name = EXCLUDED.principal_name,
    principal_nip = EXCLUDED.principal_nip;

-- Akun Default: Admin, Guru, dan Siswa
INSERT INTO public.users (id, username, password, name, role, nip_nisn, class_grade, gender, subject_name)
VALUES 
    ('u_admin', 'admin', 'admin123', 'Administrator Utama CBT', 'admin', '19880101 201201 1 001', '', 'L', ''),
    ('u_guru1', 'guru_ipa', 'guru123', 'Dra. Siti Rahmawati, M.Pd.', 'guru', '19820315 200801 2 015', '', 'P', 'Ilmu Pengetahuan Alam'),
    ('u_guru2', 'guru_mat', 'guru123', 'Budi Santoso, S.Pd.', 'guru', '19860720 201001 1 008', '', 'L', 'Matematika'),
    ('u_siswa1', 'siswa8a_1', 'siswa123', 'Ahmad Fadillah', 'siswa', '0089123451', '8A', 'L', ''),
    ('u_siswa2', 'siswa8a_2', 'siswa123', 'Zahra Anindya Putri', 'siswa', '0089123452', '8A', 'P', ''),
    ('u_siswa3', 'siswa8b_1', 'siswa123', 'Muhammad Rizky Pratama', 'siswa', '0089123453', '8B', 'L', '')
ON CONFLICT (id) DO NOTHING;

-- Data Mata Pelajaran Awal
INSERT INTO public.subjects (id, code, name, grade_level, teacher_name)
VALUES 
    ('sub_1', 'IPA-8', 'Ilmu Pengetahuan Alam', '7A, 7B', 'Dra. Siti Rahmawati, M.Pd.'),
    ('sub_2', 'MAT-8', 'Matematika', '7A, 7B', 'Budi Santoso, S.Pd.'),
    ('sub_3', 'BIN-8', 'Bahasa Indonesia', '7A, 7B', 'Nurul Hidayah, S.Pd.')
ON CONFLICT (id) DO NOTHING;
`;

    navigator.clipboard.writeText(sqlContent);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 3000);
  };

  const isConnected = getSupabaseConfig().isConfigured;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                <span>Konfigurasi Database Supabase</span>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                    isConnected
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {isConnected ? 'Aktif Terhubung' : 'Belum Terhubung'}
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                Penyimpanan data ujian, bank butir soal, dan nilai siswa secara cloud di Supabase
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-600 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="overflow-y-auto py-4 space-y-5 pr-1">
          {/* Quick Step Guide */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs space-y-2">
            <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-indigo-600" />
              <span>Langkah Cepat Integrasi Supabase:</span>
            </h4>
            <ol className="list-decimal list-inside space-y-1 text-slate-600 leading-relaxed">
              <li>
                Buka proyek di{' '}
                <a
                  href="https://supabase.com/dashboard"
                  target="_blank"
                  rel="noreferrer"
                  className="text-indigo-600 font-bold hover:underline inline-flex items-center gap-0.5"
                >
                  Supabase Dashboard <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>
                Buka menu <strong>SQL Editor</strong>, lalu klik tombol di bawah untuk salin dan jalankan skrip tabel:
              </li>
            </ol>
            <div className="pt-1">
              <button
                type="button"
                onClick={copySqlSchema}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs transition"
              >
                {copiedSql ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedSql ? 'Skrip SQL Tersalin!' : 'Salin Skema Tabel SQL Supabase'}</span>
              </button>
            </div>
            <p className="text-[11px] text-slate-500 italic pt-1">
              (File lengkap skema juga tersedia di file <code>supabase_schema.sql</code> di proyek ini).
            </p>
          </div>

          {/* Form Input Kredensial */}
          <div className="space-y-3.5 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-slate-400" />
                <span>Supabase Project URL (VITE_SUPABASE_URL)</span>
              </label>
              <input
                type="text"
                placeholder="https://your-project-id.supabase.co"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-slate-400" />
                <span>Supabase Anon Public Key (VITE_SUPABASE_ANON_KEY)</span>
              </label>
              <input
                type="password"
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                value={key}
                onChange={(e) => setKey(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Test Connection Output */}
          {testResult && (
            <div
              className={`p-3 rounded-2xl border text-xs flex items-start gap-2.5 ${
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
              <span className="font-semibold leading-relaxed">{testResult.message}</span>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <button
            type="button"
            onClick={handleResetToEnv}
            className="text-xs text-slate-500 hover:text-slate-800 font-semibold cursor-pointer underline"
          >
            Reset Pengaturan
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={isTesting || !url || !key}
              onClick={handleTestConnection}
              className="py-2.5 px-3.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-700 rounded-xl font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
              <span>{isTesting ? 'Menguji...' : 'Uji Koneksi'}</span>
            </button>

            <button
              type="button"
              disabled={isSyncing || !url || !key}
              onClick={handleSave}
              className="py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-sm transition cursor-pointer"
            >
              <UploadCloud className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Menyimpan & Sinkronisasi...' : 'Simpan & Sinkronkan'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
