-- ==============================================================================
-- SKEMA LENGKAP DATABASE TURSO (LIBSQL / SQLITE) UNTUK CBT SMART EXAM PRO
-- Jalankan skrip ini via Turso CLI: turso db shell <nama-database> < turso_schema.sql
-- Atau langsung gunakan tombol "Buat Tabel Otomatis di Turso" pada modal aplikasi.
-- ==============================================================================

-- 1. Tabel Pengaturan Sekolah / Madrasah & Aplikasi
CREATE TABLE IF NOT EXISTS school_settings (
    id TEXT PRIMARY KEY DEFAULT 'default_school',
    app_name TEXT NOT NULL DEFAULT 'SMART CBT PRO',
    school_name TEXT NOT NULL DEFAULT 'SMP NEGERI 1 CERDAS MANDIRI',
    school_npsn TEXT DEFAULT '20210099',
    school_address TEXT DEFAULT 'Jl. Pendidikan Nusantara No. 45, Kompleks Edukasi Terpadu',
    school_city TEXT DEFAULT 'Kota Jakarta Selatan',
    academic_year TEXT DEFAULT '2025/2026',
    semester TEXT DEFAULT 'Genap',
    principal_name TEXT DEFAULT 'Drs. H. Mulyadi, M.Pd.',
    principal_nip TEXT DEFAULT '19750512 199903 1 002',
    logo_url TEXT DEFAULT '',
    dinas_name TEXT DEFAULT 'PEMERINTAH KABUPATEN KOTABARU',
    kabupaten_name TEXT DEFAULT 'DINAS PENDIDIKAN DAN KEBUDAYAAN',
    signature_location TEXT DEFAULT 'Kotabaru',
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- 2. Tabel Pengguna (Admin, Guru, Siswa)
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
    subject_names TEXT DEFAULT '[]', -- JSON string array
    avatar_url TEXT DEFAULT '',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- 3. Tabel Mata Pelajaran
CREATE TABLE IF NOT EXISTS subjects (
    id TEXT PRIMARY KEY,
    code TEXT NOT NULL,
    name TEXT NOT NULL,
    grade_level TEXT DEFAULT 'Semua Kelas',
    teacher_name TEXT DEFAULT '',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- 4. Tabel Ujian / Asesmen
CREATE TABLE IF NOT EXISTS exams (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    subject_id TEXT DEFAULT '',
    subject_name TEXT NOT NULL,
    teacher_id TEXT NOT NULL,
    teacher_name TEXT NOT NULL,
    target_classes TEXT NOT NULL DEFAULT '[]', -- JSON string array: ["7A", "7B", "8A"]
    start_time TEXT DEFAULT '',
    end_time TEXT DEFAULT '',
    duration_minutes INTEGER NOT NULL DEFAULT 60,
    min_submit_minutes INTEGER NOT NULL DEFAULT 15,
    kkm REAL NOT NULL DEFAULT 75,
    allow_retake INTEGER DEFAULT 0, -- 0 = false, 1 = true
    max_retakes INTEGER DEFAULT 1,
    release_score INTEGER DEFAULT 1, -- 0 = false, 1 = true
    randomize_questions INTEGER DEFAULT 0,
    randomize_options INTEGER DEFAULT 0,
    lockdown_browser INTEGER DEFAULT 1,
    max_violations INTEGER DEFAULT 3,
    token TEXT DEFAULT '',
    questions TEXT NOT NULL DEFAULT '[]', -- JSON string array of Question objects
    status TEXT NOT NULL DEFAULT 'active', -- draft, active, finished, inactive
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- 5. Tabel Pengerjaan Siswa (Exam Attempts & Anti-Cheat Records)
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
    answers TEXT NOT NULL DEFAULT '{}', -- JSON string object
    doubtful_answers TEXT DEFAULT '{}', -- JSON string object
    scores TEXT DEFAULT '{}', -- JSON string object
    total_score REAL DEFAULT 0,
    max_possible_score REAL DEFAULT 100,
    total_earned_points REAL DEFAULT 0,
    total_max_points REAL DEFAULT 100,
    score_percentage REAL DEFAULT 0,
    passed_kkm INTEGER DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'in_progress', -- in_progress, submitted, violation_disqualified
    violation_count INTEGER DEFAULT 0,
    violation_logs TEXT DEFAULT '[]', -- JSON string array
    teacher_feedback TEXT DEFAULT '',
    is_graded INTEGER DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Index performa tinggi untuk pencarian dan filter cepat
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_exams_teacher ON exams(teacher_id);
CREATE INDEX IF NOT EXISTS idx_attempts_student_exam ON exam_attempts(student_id, exam_id);
CREATE INDEX IF NOT EXISTS idx_attempts_exam ON exam_attempts(exam_id);
CREATE INDEX IF NOT EXISTS idx_attempts_status ON exam_attempts(status);

-- Data Default (Seed Awal)
INSERT OR IGNORE INTO school_settings (
    id, app_name, school_name, school_npsn, school_address, school_city,
    academic_year, semester, principal_name, principal_nip, dinas_name, kabupaten_name, signature_location
) VALUES (
    'default_school', 'SMART CBT PRO', 'SMP NEGERI 1 CERDAS MANDIRI', '20210099',
    'Jl. Pendidikan Nusantara No. 45, Kompleks Edukasi Terpadu', 'Kota Jakarta Selatan',
    '2025/2026', 'Genap', 'Drs. H. Mulyadi, M.Pd.', '19750512 199903 1 002',
    'PEMERINTAH KABUPATEN KOTABARU', 'DINAS PENDIDIKAN DAN KEBUDAYAAN', 'Kotabaru'
);

INSERT OR IGNORE INTO users (id, username, password, name, role, nip_nisn, class_grade, gender, subject_name)
VALUES 
    ('u_admin', 'admin', 'admin123', 'Administrator Utama CBT', 'admin', '19880101 201201 1 001', '', 'L', ''),
    ('u_guru1', 'guru_ipa', 'guru123', 'Dra. Siti Rahmawati, M.Pd.', 'guru', '19820315 200801 2 015', '', 'P', 'Ilmu Pengetahuan Alam'),
    ('u_guru2', 'guru_mat', 'guru123', 'Budi Santoso, S.Pd.', 'guru', '19860720 201001 1 008', '', 'L', 'Matematika'),
    ('u_siswa1', 'siswa8a_1', 'siswa123', 'Ahmad Fadillah', 'siswa', '0089123451', '8A', 'L', ''),
    ('u_siswa2', 'siswa8a_2', 'siswa123', 'Zahra Anindya Putri', 'siswa', '0089123452', '8A', 'P', ''),
    ('u_siswa3', 'siswa8b_1', 'siswa123', 'Muhammad Rizky Pratama', 'siswa', '0089123453', '8B', 'L', '');

INSERT OR IGNORE INTO subjects (id, code, name, grade_level, teacher_name)
VALUES 
    ('sub_1', 'IPA-8', 'Ilmu Pengetahuan Alam', 'SMP Kelas 8', 'Dra. Siti Rahmawati, M.Pd.'),
    ('sub_2', 'MAT-8', 'Matematika', 'SMP Kelas 8', 'Budi Santoso, S.Pd.'),
    ('sub_3', 'BIN-8', 'Bahasa Indonesia', 'SMP Kelas 8', 'Nurul Hidayah, S.Pd.');
