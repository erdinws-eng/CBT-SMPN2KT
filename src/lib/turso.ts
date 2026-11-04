import { createClient, Client } from '@libsql/client/web';

export interface TursoConfig {
  url: string;
  authToken: string;
  isConfigured: boolean;
}

export function sanitizeTursoUrl(rawUrl: string): { url: string; error?: string } {
  let url = (rawUrl || '').trim().replace(/^['"]+|['"]+$/g, '');
  if (!url) {
    return { url: '', error: 'URL Database Turso belum diisi.' };
  }
  if (url.includes('turso.tech/app') || url.includes('app.turso.tech')) {
    return {
      url: '',
      error: 'URL yang dimasukkan adalah tautan halaman web Dashboard Turso. Salin URL database yang berakhiran .turso.io (contoh: libsql://cbt-sekolah-username.turso.io).',
    };
  }
  if (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('libsql://')) {
    url = 'https://' + url;
  }
  return { url };
}

export function sanitizeTursoToken(rawToken: string): string {
  let token = (rawToken || '').trim().replace(/^['"]+|['"]+$/g, '');
  if (token.toLowerCase().startsWith('bearer ')) {
    token = token.substring(7).trim();
  }
  return token;
}

export const getTursoConfig = (): TursoConfig => {
  const envUrl = (import.meta.env.VITE_TURSO_DATABASE_URL || '').trim();
  const envToken = (import.meta.env.VITE_TURSO_AUTH_TOKEN || '').trim();

  const localUrl = (localStorage.getItem('cbt_turso_url') || '').trim();
  const localToken = (localStorage.getItem('cbt_turso_token') || '').trim();

  const rawUrl = localUrl || envUrl;
  const rawToken = localToken || envToken;

  const { url } = sanitizeTursoUrl(rawUrl);
  const authToken = sanitizeTursoToken(rawToken);

  const isConfigured = Boolean(
    url &&
    authToken &&
    (url.startsWith('libsql://') || url.startsWith('https://') || url.startsWith('http://'))
  );

  return {
    url,
    authToken,
    isConfigured,
  };
};

let tursoAuthErrorState: string | null = null;

export const getTursoAuthError = (): string | null => {
  return tursoAuthErrorState;
};

export const setTursoAuthError = (err: string | null) => {
  tursoAuthErrorState = err;
  if (err) {
    tursoInstance = null;
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('turso-auth-error', { detail: { message: err } }));
    }
  }
};

export const clearTursoAuthError = () => {
  tursoAuthErrorState = null;
};

export const saveTursoConfig = (rawUrl: string, rawToken: string) => {
  const { url } = sanitizeTursoUrl(rawUrl);
  const cleanToken = sanitizeTursoToken(rawToken);
  localStorage.setItem('cbt_turso_url', url || rawUrl.trim());
  localStorage.setItem('cbt_turso_token', cleanToken);
  // Auto set active db provider to Turso
  localStorage.setItem('cbt_active_db_provider', 'turso');
  tursoInstance = null;
  clearTursoAuthError();
};

export const clearTursoConfig = () => {
  localStorage.removeItem('cbt_turso_url');
  localStorage.removeItem('cbt_turso_token');
  tursoInstance = null;
  clearTursoAuthError();
};

export type DatabaseProvider = 'turso' | 'supabase' | 'local';

export const getActiveDbProvider = (): DatabaseProvider => {
  const stored = localStorage.getItem('cbt_active_db_provider') as DatabaseProvider | null;
  if (stored === 'turso' || stored === 'supabase' || stored === 'local') {
    return stored;
  }
  // Default to Turso if configured, then Supabase, then Local
  if (getTursoConfig().isConfigured) return 'turso';
  return 'supabase';
};

export const setActiveDbProvider = (provider: DatabaseProvider) => {
  localStorage.setItem('cbt_active_db_provider', provider);
};

let tursoInstance: Client | null = null;

export const getTursoClient = (): Client | null => {
  const config = getTursoConfig();
  if (!config.isConfigured || tursoAuthErrorState) {
    return null;
  }

  if (!tursoInstance) {
    try {
      // Normalize libsql:// to https:// for standard web fetch in browser
      let fetchUrl = config.url;
      if (fetchUrl.startsWith('libsql://')) {
        fetchUrl = fetchUrl.replace('libsql://', 'https://');
      }
      tursoInstance = createClient({
        url: fetchUrl,
        authToken: config.authToken,
      });
    } catch (err) {
      console.warn('Failed to initialize Turso client:', err);
      return null;
    }
  }

  return tursoInstance;
};

export const testTursoConnection = async (
  testUrl?: string,
  testToken?: string
): Promise<{ success: boolean; message: string; tablesFound: string[]; normalizedUrl?: string }> => {
  const config = getTursoConfig();
  const rawUrl = (testUrl !== undefined ? testUrl : config.url) || '';
  const rawToken = (testToken !== undefined ? testToken : config.authToken) || '';

  const { url, error: urlError } = sanitizeTursoUrl(rawUrl);
  if (urlError) {
    return {
      success: false,
      message: urlError,
      tablesFound: [],
    };
  }

  const authToken = sanitizeTursoToken(rawToken);
  if (!authToken) {
    return {
      success: false,
      message: 'Auth Token Turso belum diisi. Buat token di dashboard Turso (tab Tokens) atau jalankan: turso db tokens create <nama-db>.',
      tablesFound: [],
    };
  }

  // 1. Coba verifikasi lewat Server-side Express API (Anti-CORS & aman)
  try {
    const res = await fetch('/api/turso/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, authToken }),
    });
    if (res.ok) {
      const data = await res.json();
      return data;
    } else {
      const errData = await res.json().catch(() => ({}));
      if (errData.message) {
        return {
          success: false,
          message: errData.message,
          tablesFound: [],
        };
      }
    }
  } catch (proxyErr) {
    console.warn('Server proxy test failed, trying client-side test:', proxyErr);
  }

  // 2. Fallback uji langsung di browser
  try {
    let clientUrl = url;
    if (clientUrl.startsWith('libsql://')) {
      clientUrl = clientUrl.replace('libsql://', 'https://');
    }

    const testClient = createClient({
      url: clientUrl,
      authToken,
    });

    const res = await testClient.execute(
      "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_litestream_%'"
    );

    const tablesFound = res.rows.map((r: any) => String(r.name || r[0]));

    if (tablesFound.length === 0) {
      return {
        success: true,
        message: 'Koneksi ke Turso BERHASIL! Database masih kosong (belum ada tabel CBT). Klik "Buat Tabel Otomatis" untuk inisialisasi.',
        tablesFound,
        normalizedUrl: url,
      };
    }

    return {
      success: true,
      message: `Koneksi ke Turso BERHASIL! Ditemukan ${tablesFound.length} tabel: ${tablesFound.join(', ')}.`,
      tablesFound,
      normalizedUrl: url,
    };
  } catch (err: any) {
    console.error('Turso connection error:', err);
    let msg = err?.message || String(err);
    if (msg.includes('401') || msg.includes('Unauthorized') || msg.includes('JWT')) {
      msg = 'Autentikasi ditolak (401 Unauthorized). Pastikan Auth Token valid dan belum kadaluarsa.';
    } else if (msg.includes('Failed to fetch') || msg.includes('NetworkError')) {
      msg = 'Koneksi jaringan ke Turso gagal atau diblokir browser. Pastikan URL diawali dengan libsql:// atau https:// dan koneksi internet stabil.';
    }
    return {
      success: false,
      message: `Gagal tersambung ke Turso: ${msg}`,
      tablesFound: [],
    };
  }
};

export const initTursoSchema = async (customClient?: Client): Promise<{ success: boolean; message: string }> => {
  const client = customClient || getTursoClient();
  if (!client) {
    return { success: false, message: 'Client Turso belum terkonfigurasi.' };
  }

  const ddlStatements = [
    `CREATE TABLE IF NOT EXISTS school_settings (
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
    )`,

    `CREATE TABLE IF NOT EXISTS users (
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
    )`,

    `CREATE TABLE IF NOT EXISTS subjects (
      id TEXT PRIMARY KEY,
      code TEXT NOT NULL,
      name TEXT NOT NULL,
      grade_level TEXT DEFAULT 'Semua Kelas',
      teacher_name TEXT DEFAULT '',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )`,

    `CREATE TABLE IF NOT EXISTS exams (
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
    )`,

    `CREATE TABLE IF NOT EXISTS exam_attempts (
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
    )`,

    `CREATE INDEX IF NOT EXISTS idx_users_role ON users(role)`,
    `CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)`,
    `CREATE INDEX IF NOT EXISTS idx_exams_teacher ON exams(teacher_id)`,
    `CREATE INDEX IF NOT EXISTS idx_attempts_student_exam ON exam_attempts(student_id, exam_id)`,
    `CREATE INDEX IF NOT EXISTS idx_attempts_exam ON exam_attempts(exam_id)`,
    `CREATE INDEX IF NOT EXISTS idx_attempts_status ON exam_attempts(status)`,
  ];

  try {
    for (const sql of ddlStatements) {
      await client.execute(sql);
    }
    return {
      success: true,
      message: 'Skema tabel database Turso berhasil dibuat dan siap digunakan!',
    };
  } catch (err: any) {
    console.error('Error initializing Turso schema:', err);
    return {
      success: false,
      message: `Gagal inisialisasi tabel di Turso: ${err?.message || err}`,
    };
  }
};
