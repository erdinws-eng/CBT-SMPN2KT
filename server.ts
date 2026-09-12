import express from "express";
import path from "path";
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

    const systemPrompt = `Anda adalah pakar pembuat soal ujian kurikulum nasional Indonesia untuk jenjang Sekolah Menengah Pertama (SMP/MTs) yang berstandar Asesmen Nasional (AKM) dan Kurikulum Merdeka.
Buatlah soal-soal ujian berkualitas tinggi dan variatif untuk mata pelajaran "${subject}", jenjang "${gradeLevel}", materi pokok "${topic}".
Tingkat kesulitan: ${difficulty}.
Jumlah soal: ${count}.
Tipe soal yang diminta: ${JSON.stringify(questionTypes)}.
Catatan khusus: ${additionalInstructions || "Sertakan stimulus teks atau skenario kontekstual dunia nyata SMP."}

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

    // Try candidate models in sequence with fallback
    for (const modelName of CANDIDATE_MODELS) {
      try {
        console.log(`[AI Generator] Mencoba model: ${modelName}...`);
        const response = await ai.models.generateContent({
          model: modelName,
          contents: `Buatlah tepat ${count} butir soal ${subject} materi "${topic}" sesuai petunjuk sistem. Seluruh konten dalam bahasa Indonesia yang baku dan komunikatif. Output murni JSON array.`,
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

    // Sanitize and ensure standard Question schema
    const questions = rawList.map((item: any, idx: number) => {
      const qId = item.id || `q_ai_${Date.now()}_${idx + 1}`;
      const qType = item.type || "pilihan_ganda";
      const options = Array.isArray(item.options) ? item.options : [];
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
