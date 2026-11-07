import express from "express";
import path from "path";
import fs from "fs";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ extended: true, limit: "25mb" }));

// Lazy Gemini AI initialization helper
function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured in server environment");
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

// API Health Check
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    appName: "CBT Sekolah SMP",
    timestamp: new Date().toISOString(),
  });
});

// Candidate models in order of priority (handles temporary 503 high demand spikes)
const CANDIDATE_MODELS = [
  "gemini-3.1-flash-lite",
  "gemini-3.8-flash",
  "gemini-flash-latest",
];

// Helper to clean markdown json code fences
function cleanJsonOutput(rawText: string): string {
  let text = rawText.trim();
  if (text.startsWith("```json")) {
    text = text.replace(/^```json\s*/, "").replace(/\s*```$/, "");
  } else if (text.startsWith("```")) {
    text = text.replace(/^```\s*/, "").replace(/\s*```$/, "");
  }
  return text.trim();
}

// API AI Auto Question Generator
app.post("/api/ai/generate-questions", async (req, res) => {
  try {
    const {
      subject,
      gradeLevel = "SMP Kelas 8",
      topic,
      count = 5,
      questionTypes = ["pilihan_ganda"],
      difficulty = "Sedang",
      additionalInstructions = "",
    } = req.body;

    if (!topic || !subject) {
      return res.status(400).json({
        error: "Mata pelajaran dan topik/materi pokok wajib diisi",
      });
    }

    const ai = getGeminiClient();

    const typeLabelMap: Record<string, string> = {
      pilihan_ganda: 'Pilihan Ganda (Single Choice: 4 opsi pilihan A, B, C, D dan tepat 1 jawaban benar pada "correctAnswer")',
      pilihan_ganda_kompleks: 'Pilihan Ganda Kompleks (Multi Choice: 4-5 opsi dan minimal 2 jawaban benar pada array "correctAnswers")',
      essay: 'Uraian / Essay (pertanyaan berbasis analisis/studi kasus, sertakan panduan rubrik penilaian pada "explanation")',
      isian: 'Isian Singkat (pertanyaan langsung dengan jawaban singkat pasti berupa kata/angka pada "correctAnswer")',
      menjodohkan: 'Menjodohkan (pertanyaan dengan 3-4 pasang pernyataan premis & pasangan cocok pada array "matchingPairs")',
      benar_salah: 'Benar / Salah (tabel berisi 2-3 pernyataan yang masing-masing bernilai "Benar" atau "Salah" pada array "trueFalseStatements")',
    };

    const requestedTypeDetails = Array.isArray(questionTypes) && questionTypes.length > 0
      ? questionTypes.map((t: string) => `- "${t}": ${typeLabelMap[t] || t}`).join("\n")
      : '- "pilihan_ganda": Pilihan Ganda (Single Choice)';

    const systemPrompt = `Anda adalah pakar pembuat soal ujian kurikulum nasional Indonesia untuk jenjang Sekolah Menengah Pertama (SMP/MTs) yang berstandar Asesmen Nasional (AKM) dan Kurikulum Merdeka.
Buatlah soal-soal ujian berkualitas tinggi untuk mata pelajaran "${subject}", jenjang "${gradeLevel}", materi pokok "${topic}".
Tingkat kesulitan: ${difficulty}.
Jumlah soal: Tepat ${count} butir soal.

ATURAN WAJIB JENIS SOAL:
Setiap soal yang dihasilkan HARUS memiliki nilai field "type" yang diambil HANYA dari jenis berikut:
${requestedTypeDetails}

PENTING:
- Jika hanya 1 jenis soal yang tercantum di atas, SELURUH ${count} butir soal HARUS berjenis tersebut!
- Jika ada beberapa jenis soal, variasikan tipe soal di antara jenis-jenis yang diminta saja. JANGAN membuat jenis soal di luar daftar di atas.
- Catatan materi: ${additionalInstructions || "Sertakan stimulus teks atau skenario kontekstual dunia nyata SMP."}

Format Output WAJIB berupa JSON Array of objects (VALID JSON ONLY, tanpa komentar atau teks pembuka/penutup):
[
  {
    "id": "q_ai_1",
    "type": "pilihan_ganda", // salah satu dari: "pilihan_ganda" | "pilihan_ganda_kompleks" | "isian" | "essay" | "menjodohkan" | "benar_salah"
    "prompt": "Pertanyaan atau stimulus soal lengkap",
    "points": 10,
    "options": ["Pilihan A", "Pilihan B", "Pilihan C", "Pilihan D"], // untuk pilihan_ganda dan pilihan_ganda_kompleks
    "correctAnswer": "Pilihan A", // jika pilihan_ganda atau isian atau essay
    "correctAnswers": ["Pilihan A", "Pilihan B"], // jika pilihan_ganda_kompleks
    "matchingPairs": [
      { "premise": "Pernyataan Kolom Kiri", "match": "Pasangan Kolom Kanan" }
    ], // jika menjodohkan
    "trueFalseStatements": [
      { "statement": "Pernyataan 1", "answer": "Benar" },
      { "statement": "Pernyataan 2", "answer": "Salah" }
    ], // jika benar_salah multi pernyataan
    "explanation": "Penjelasan singkat pembahasan dan konsep materi"
  }
]`;

    let generatedText = "";
    let lastError: any = null;
    let successfulModel = "";

    const requestedTypesText = Array.isArray(questionTypes) && questionTypes.length > 0
      ? questionTypes.join(", ")
      : "pilihan_ganda";

    // Try candidate models in sequence with fallback
    for (const modelName of CANDIDATE_MODELS) {
      try {
        console.log(`[AI Generator] Mencoba model: ${modelName}...`);
        const response = await ai.models.generateContent({
          model: modelName,
          contents: `Buatlah tepat ${count} butir soal ${subject} materi "${topic}".
JENIS SOAL YANG WAJIB DIBUAT: ${requestedTypesText}.
Semua butir soal HARUS berjenis sesuai daftar di atas. Seluruh konten dalam bahasa Indonesia yang baku dan komunikatif untuk siswa SMP. Output murni JSON array.`,
          config: {
            systemInstruction: systemPrompt,
            responseMimeType: "application/json",
          },
        });

        if (response.text) {
          generatedText = response.text;
          successfulModel = modelName;
          console.log(`[AI Generator] Berhasil menggunakan model: ${modelName}`);
          break;
        }
      } catch (err: any) {
        lastError = err;
        const errCode = err?.status || err?.code || "";
        const errMsg = err?.message || "";
        console.warn(
          `[AI Generator] Model ${modelName} gagal (${errCode}): ${errMsg}. Mencoba model alternatif...`
        );
      }
    }

    if (!generatedText) {
      throw lastError || new Error("Semua model AI sedang tidak tersedia");
    }

    const cleanedText = cleanJsonOutput(generatedText);
    let parsed: any;
    try {
      parsed = JSON.parse(cleanedText);
    } catch (parseErr) {
      // Fallback regex attempt if minor formatting issue
      const match = cleanedText.match(/\[[\s\S]*\]/);
      if (match) {
        parsed = JSON.parse(match[0]);
      } else {
        throw new Error("Gagal memproses format jawaban JSON dari AI");
      }
    }

    const rawList = Array.isArray(parsed) ? parsed : [parsed];

    // Sanitize and ensure standard Question schema with guaranteed unique IDs
    const questions = rawList.map((item: any, idx: number) => {
      const uniqueSuffix = Math.random().toString(36).substring(2, 8);
      const qId = `q_ai_${Date.now()}_${idx + 1}_${uniqueSuffix}`;
      
      // Robust question type normalization
      let qType = "pilihan_ganda";
      const rawType = String(item.type || "").toLowerCase().trim();
      if (rawType.includes("kompleks") || rawType.includes("multiple_choice") || rawType === "pg_kompleks") {
        qType = "pilihan_ganda_kompleks";
      } else if (rawType.includes("isi") || rawType.includes("short") || rawType === "fill_in") {
        qType = "isian";
      } else if (rawType.includes("uraian") || rawType.includes("essay")) {
        qType = "essay";
      } else if (rawType.includes("jodoh") || rawType.includes("matching") || rawType === "match") {
        qType = "menjodohkan";
      } else if (rawType.includes("benar") || rawType.includes("salah") || rawType.includes("true_false") || rawType === "tf") {
        qType = "benar_salah";
      } else if (rawType.includes("pilihan") || rawType.includes("ganda") || rawType === "single_choice") {
        qType = "pilihan_ganda";
      }

      // ONLY pilihan_ganda & pilihan_ganda_kompleks should have options array.
      // For isian, essay, menjodohkan, benar_salah, options MUST be undefined.
      const isChoiceType = qType === "pilihan_ganda" || qType === "pilihan_ganda_kompleks";
      const options = isChoiceType && Array.isArray(item.options) && item.options.length > 0
        ? item.options
        : (isChoiceType ? ["A. Pilihan A", "B. Pilihan B", "C. Pilihan C", "D. Pilihan D"] : undefined);

      let correctAnswer = item.correctAnswer || "";
      if (!correctAnswer && Array.isArray(item.correctAnswers) && item.correctAnswers.length > 0) {
        correctAnswer = item.correctAnswers[0];
      }

      return {
        id: qId,
        type: qType,
        prompt: item.prompt || `Soal nomor ${idx + 1}`,
        points: typeof item.points === "number" ? item.points : 10,
        options,
        correctAnswer: typeof correctAnswer === "string" ? correctAnswer : String(correctAnswer || ""),
        correctAnswers: Array.isArray(item.correctAnswers) ? item.correctAnswers : undefined,
        matchingPairs: Array.isArray(item.matchingPairs) ? item.matchingPairs : undefined,
        trueFalseStatements: Array.isArray(item.trueFalseStatements) ? item.trueFalseStatements : undefined,
        explanation: item.explanation || "",
      };
    });

    return res.json({
      success: true,
      modelUsed: successfulModel,
      questions,
    });
  } catch (error: any) {
    console.error("Gemini Question Generation Error:", error);
    const isHighDemand =
      error?.status === 503 ||
      error?.code === 503 ||
      String(error?.message || "").includes("503") ||
      String(error?.message || "").includes("high demand") ||
      String(error?.message || "").includes("UNAVAILABLE");

    const userMessage = isHighDemand
      ? "Layanan AI (Google Gemini) saat ini sedang mengalami lonjakan trafik tinggi secara global. Silakan coba kembali dalam beberapa saat."
      : error?.message || "Gagal membuat soal otomatis dengan AI. Periksa koneksi atau konfigurasi.";

    return res.status(isHighDemand ? 503 : 500).json({
      error: userMessage,
    });
  }
});

// ==============================================================================
// TURSO DATABASE PROXY ENDPOINTS (Prevents CORS & Network Issues)
// ==============================================================================
import { createClient as createLibsqlClient } from "@libsql/client/web";

function normalizeTursoUrl(rawUrl: string): { url: string; error?: string } {
  let url = (rawUrl || "").trim().replace(/^['"]+|['"]+$/g, "");
  if (!url) {
    return { url: "", error: "URL Database Turso belum diisi." };
  }
  if (url.includes("turso.tech/app") || url.includes("app.turso.tech")) {
    return {
      url: "",
      error: "URL yang Anda masukkan adalah tautan halaman web Dashboard Turso. Salin URL database yang sebenarnya di halaman Overview (contoh: libsql://cbt-sekolah-username.turso.io atau https://cbt-sekolah-username.turso.io).",
    };
  }
  if (!url.startsWith("http://") && !url.startsWith("https://") && !url.startsWith("libsql://")) {
    url = "https://" + url;
  }
  if (url.startsWith("libsql://")) {
    url = url.replace("libsql://", "https://");
  }
  return { url };
}

function normalizeTursoToken(rawToken: string): string {
  let token = (rawToken || "").trim().replace(/^['"]+|['"]+$/g, "");
  if (token.toLowerCase().startsWith("bearer ")) {
    token = token.substring(7).trim();
  }
  return token;
}

const TURSO_CONFIG_FILE = path.join(process.cwd(), "turso-config.json");

function getStoredTursoConfig(): { url: string; authToken: string; isConfigured: boolean } {
  try {
    if (fs.existsSync(TURSO_CONFIG_FILE)) {
      const data = JSON.parse(fs.readFileSync(TURSO_CONFIG_FILE, "utf-8"));
      if (data.url && data.authToken) {
        return {
          url: data.url,
          authToken: data.authToken,
          isConfigured: true,
        };
      }
    }
  } catch (e) {
    console.warn("Failed to read turso-config.json:", e);
  }

  const envUrl = process.env.VITE_TURSO_DATABASE_URL || process.env.TURSO_DATABASE_URL || "";
  const envToken = process.env.VITE_TURSO_AUTH_TOKEN || process.env.TURSO_AUTH_TOKEN || "";
  if (envUrl && envToken) {
    return {
      url: envUrl,
      authToken: envToken,
      isConfigured: true,
    };
  }

  return { url: "", authToken: "", isConfigured: false };
}

function saveStoredTursoConfig(url: string, authToken: string): void {
  try {
    fs.writeFileSync(
      TURSO_CONFIG_FILE,
      JSON.stringify({ url, authToken, updatedAt: new Date().toISOString() }, null, 2),
      "utf-8"
    );
  } catch (e) {
    console.warn("Failed to save turso-config.json:", e);
  }
}

// 0. Get & Save Shared Turso Database Configuration (Cross-Browser Shared)
app.get("/api/turso/config", (req, res) => {
  const config = getStoredTursoConfig();
  res.json(config);
});

app.post("/api/turso/config", (req, res) => {
  const { url: rawUrl, authToken: rawToken } = req.body;
  const { url, error: urlError } = normalizeTursoUrl(rawUrl);
  if (urlError) return res.status(400).json({ success: false, message: urlError });
  const authToken = normalizeTursoToken(rawToken);
  if (!authToken) return res.status(400).json({ success: false, message: "Auth Token belum diisi." });

  saveStoredTursoConfig(url, authToken);
  res.json({ success: true, message: "Konfigurasi Turso berhasil disimpan dan dibagikan ke semua perangkat.", url, authToken });
});

app.delete("/api/turso/config", (req, res) => {
  try {
    if (fs.existsSync(TURSO_CONFIG_FILE)) {
      fs.unlinkSync(TURSO_CONFIG_FILE);
    }
  } catch (e) {}
  res.json({ success: true, message: "Konfigurasi Turso berhasil dihapus dari server." });
});

// 1. Test Turso Connection
app.post("/api/turso/test", async (req, res) => {
  try {
    const { url: rawUrl, authToken: rawToken } = req.body;
    const { url, error: urlError } = normalizeTursoUrl(rawUrl);
    if (urlError) {
      return res.json({ success: false, message: urlError, tablesFound: [] });
    }

    const authToken = normalizeTursoToken(rawToken);
    if (!authToken) {
      return res.json({
        success: false,
        message: "Auth Token Turso belum diisi. Buat token di dashboard Turso (tab Tokens) atau jalankan: turso db tokens create <nama-db>.",
        tablesFound: [],
      });
    }

    const client = createLibsqlClient({ url, authToken });
    const result = await client.execute(
      "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_litestream_%'"
    );

    const tablesFound = result.rows.map((r: any) => String(r.name || r[0]));

    if (tablesFound.length === 0) {
      return res.json({
        success: true,
        message: 'Koneksi ke Turso BERHASIL! Database masih kosong (belum ada tabel CBT). Silakan klik "Buat Tabel Otomatis" atau "Migrasikan Semua Data".',
        tablesFound,
        normalizedUrl: url,
      });
    }

    return res.json({
      success: true,
      message: `Koneksi ke Turso BERHASIL! Ditemukan ${tablesFound.length} tabel: ${tablesFound.join(', ')}.`,
      tablesFound,
      normalizedUrl: url,
    });
  } catch (err: any) {
    const errMsg = String(err?.message || err || '');
    const is401 = errMsg.includes("401") || errMsg.includes("Unauthorized") || String(err?.cause || '').includes("401");
    
    console.warn(`[Turso Test] Result: ${is401 ? '401 Unauthorized' : errMsg}`);
    
    let msg = errMsg;
    if (is401) {
      msg = "Autentikasi ditolak (HTTP status 401 Unauthorized). Auth Token yang dimasukkan tidak valid atau sudah kadaluarsa. Pastikan Anda menyalin Auth Token dari menu Tokens di database Turso Anda, atau buat token baru dengan perintah: turso db tokens create <nama-db>.";
    } else if (msg.includes("404") || msg.includes("Not Found")) {
      msg = "Database tidak ditemukan (404 Not Found). Periksa kembali nama database di URL Turso Anda.";
    } else if (msg.includes("ENOTFOUND") || msg.includes("getaddrinfo")) {
      msg = "Domain database tidak ditemukan. Periksa apakah alamat URL Turso sudah benar.";
    }
    return res.json({
      success: false,
      isAuthError: is401,
      message: `Gagal tersambung ke Turso: ${msg}`,
      tablesFound: [],
    });
  }
});

// 2. Initialize Turso Database Schema
app.post("/api/turso/init-schema", async (req, res) => {
  try {
    const { url: rawUrl, authToken: rawToken } = req.body;
    const { url, error: urlError } = normalizeTursoUrl(rawUrl);
    if (urlError) return res.status(400).json({ success: false, message: urlError });

    const authToken = normalizeTursoToken(rawToken);
    if (!authToken) return res.status(400).json({ success: false, message: "Auth Token Turso belum diisi." });

    const client = createLibsqlClient({ url, authToken });

    const ddl = [
      `CREATE TABLE IF NOT EXISTS school_settings (
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

    for (const sql of ddl) {
      await client.execute(sql);
    }

    return res.json({
      success: true,
      message: "Tabel dan index SQLite di Turso Database berhasil diinisialisasi!",
    });
  } catch (err: any) {
    console.error("Turso init schema error:", err);
    return res.status(500).json({
      success: false,
      message: `Gagal membuat tabel di Turso: ${err?.message || err}`,
    });
  }
});

// 3. Batch Migrate All Data to Turso
app.post("/api/turso/migrate", async (req, res) => {
  try {
    const { url: rawUrl, authToken: rawToken, settings, users, subjects, exams, attempts } = req.body;
    const { url, error: urlError } = normalizeTursoUrl(rawUrl);
    if (urlError) return res.status(400).json({ success: false, message: urlError });

    const authToken = normalizeTursoToken(rawToken);
    if (!authToken) return res.status(400).json({ success: false, message: "Auth Token belum diisi." });

    const client = createLibsqlClient({ url, authToken });

    // 1. Ensure tables exist
    const testRes = await client.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='school_settings'");
    if (!testRes.rows || testRes.rows.length === 0) {
      // Create tables first
      const initUrl = "http://127.0.0.1:3000/api/turso/init-schema";
      await fetch(initUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, authToken }),
      });
    }

    // 2. Insert/replace settings
    if (settings) {
      await client.execute({
        sql: `INSERT OR REPLACE INTO school_settings (
          id, app_name, school_name, school_npsn, school_address, school_city,
          academic_year, semester, principal_name, principal_nip, logo_url,
          dinas_name, kabupaten_name, signature_location, updated_at
        ) VALUES ('default_school', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          settings.appName || "SMART CBT PRO",
          settings.schoolName || "SMP NEGERI 1 CERDAS MANDIRI",
          settings.schoolNpsn || "",
          settings.schoolAddress || "",
          settings.schoolCity || "",
          settings.academicYear || "2025/2026",
          settings.semester || "Genap",
          settings.principalName || "",
          settings.principalNip || "",
          settings.logoUrl || "",
          settings.dinasName || "PEMERINTAH KABUPATEN KOTABARU",
          settings.kabupatenName || "DINAS PENDIDIKAN DAN KEBUDAYAAN",
          settings.signatureLocation || "Kotabaru",
          new Date().toISOString(),
        ],
      });
    }

    // 3. Batch users
    let userCount = 0;
    if (Array.isArray(users)) {
      for (const u of users) {
        await client.execute({
          sql: `INSERT OR REPLACE INTO users (
            id, username, password, name, role, nip_nisn, class_grade, gender, subject_name, subject_names, avatar_url
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          args: [
            u.id,
            u.username,
            u.password || "123456",
            u.name,
            u.role,
            u.nip_nisn || "",
            u.classGrade || "",
            u.gender || "L",
            u.subjectName || "",
            JSON.stringify(u.subjectNames || []),
            u.avatarUrl || "",
          ],
        });
        userCount++;
      }
    }

    // 4. Batch subjects
    let subjectCount = 0;
    if (Array.isArray(subjects)) {
      for (const s of subjects) {
        await client.execute({
          sql: `INSERT OR REPLACE INTO subjects (id, code, name, grade_level, teacher_name) VALUES (?, ?, ?, ?, ?)`,
          args: [s.id, s.code, s.name, s.gradeLevel || "Semua Kelas", s.teacherName || ""],
        });
        subjectCount++;
      }
    }

    // 5. Batch exams
    let examCount = 0;
    if (Array.isArray(exams)) {
      for (const e of exams) {
        await client.execute({
          sql: `INSERT OR REPLACE INTO exams (
            id, title, subject_id, subject_name, teacher_id, teacher_name,
            target_classes, start_time, end_time, duration_minutes, min_submit_minutes,
            kkm, allow_retake, max_retakes, release_score, randomize_questions,
            randomize_options, lockdown_browser, max_violations, token, questions,
            status, is_active
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          args: [
            e.id,
            e.title,
            e.subjectId || "",
            e.subjectName,
            e.teacherId,
            e.teacherName,
            JSON.stringify(e.targetClasses || []),
            e.startTime || "",
            e.endTime || "",
            e.durationMinutes || 60,
            e.minSubmitMinutes || 15,
            e.kkm || 75,
            e.allowRetake ? 1 : 0,
            e.maxRetakes || 1,
            e.releaseScore ? 1 : 0,
            e.randomizeQuestions ? 1 : 0,
            e.randomizeOptions ? 1 : 0,
            e.lockdownBrowser ? 1 : 0,
            e.maxViolations || 3,
            e.token || "",
            JSON.stringify(e.questions || []),
            e.status || "active",
            e.isActive === false ? 0 : 1,
          ],
        });
        examCount++;
      }
    }

    // 6. Batch attempts
    let attemptCount = 0;
    if (Array.isArray(attempts)) {
      for (const a of attempts) {
        await client.execute({
          sql: `INSERT OR REPLACE INTO exam_attempts (
            id, exam_id, exam_title, subject_name, student_id, student_name,
            student_nisn, student_class, started_at, submitted_at,
            answers, doubtful_answers, scores, total_score, max_possible_score,
            total_earned_points, total_max_points, score_percentage, passed_kkm,
            status, violation_count, violation_logs, teacher_feedback, is_graded
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          args: [
            a.id,
            a.examId,
            a.examTitle || "Ujian",
            a.subjectName || "-",
            a.studentId,
            a.studentName,
            a.studentNisn || "",
            a.studentClass || "",
            a.startedAt || new Date().toISOString(),
            a.submittedAt || null,
            JSON.stringify(a.answers || {}),
            JSON.stringify(a.doubtfulAnswers || {}),
            JSON.stringify(a.scores || {}),
            Number(a.totalScore || 0),
            Number(a.maxPossibleScore || 100),
            Number(a.totalEarnedPoints || a.totalScore || 0),
            Number(a.totalMaxPoints || a.maxPossibleScore || 100),
            Number(a.scorePercentage || 0),
            a.passedKkm ? 1 : 0,
            a.status || "in_progress",
            Number(a.violationCount || 0),
            JSON.stringify(Array.isArray(a.violationLogs) ? a.violationLogs : []),
            a.teacherFeedback || "",
            a.isGraded ? 1 : 0,
          ],
        });
        attemptCount++;
      }
    }

    return res.json({
      success: true,
      message: `Migrasi ke Turso BERHASIL! Data berhasil disalin: ${userCount} Pengguna, ${subjectCount} Mapel, ${examCount} Ujian, dan ${attemptCount} Riwayat Siswa.`,
      counts: {
        users: userCount,
        subjects: subjectCount,
        exams: examCount,
        attempts: attemptCount,
      },
    });
  } catch (err: any) {
    console.error("Turso migrate error:", err);
    return res.status(500).json({
      success: false,
      message: `Gagal migrasi ke Turso: ${err?.message || err}`,
    });
  }
});

// Vite & Static Asset Handling
async function start() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`CBT SMP server running at http://0.0.0.0:${PORT}`);
  });
}

start();
