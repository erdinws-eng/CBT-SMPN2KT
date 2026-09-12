-- ==============================================================================
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
    ('sub_1', 'IPA-8', 'Ilmu Pengetahuan Alam', 'SMP Kelas 8', 'Dra. Siti Rahmawati, M.Pd.'),
    ('sub_2', 'MAT-8', 'Matematika', 'SMP Kelas 8', 'Budi Santoso, S.Pd.'),
    ('sub_3', 'BIN-8', 'Bahasa Indonesia', 'SMP Kelas 8', 'Nurul Hidayah, S.Pd.')
ON CONFLICT (id) DO NOTHING;
