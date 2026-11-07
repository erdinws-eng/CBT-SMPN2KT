import { getTursoClient, initTursoSchema, setTursoAuthError } from '../lib/turso';
import { SchoolSettings, User, Subject, Exam, ExamAttempt } from '../types';
import { getStoredSettings, saveStoredSettings } from '../lib/storage';

function isTurso401(err: any): boolean {
  if (!err) return false;
  const fullText = (
    String(err?.message || '') + ' ' +
    String(err?.code || '') + ' ' +
    String(err?.cause?.message || '') + ' ' +
    String(err?.cause || '') + ' ' +
    String(err || '')
  ).toLowerCase();
  return fullText.includes('401') || fullText.includes('unauthorized');
}

function handleTursoError(action: string, err: any): void {
  const msg = String(err?.message || err || '');
  if (isTurso401(err)) {
    setTursoAuthError('Auth Token Turso tidak valid atau sudah kadaluarsa (HTTP status 401). Silakan periksa kembali Auth Token di menu Turso DB.');
    console.warn(`[Turso ${action}] Autentikasi ditolak (HTTP status 401). Operasi dialihkan ke penyimpanan lokal offline.`);
  } else {
    console.warn(`[Turso ${action}] Kendala:`, msg);
  }
}

export const tursoService = {
  // 1. Ambil data profil sekolah dari Turso
  async getSchoolSettings(): Promise<SchoolSettings | null> {
    const client = getTursoClient();
    if (!client) return null;

    try {
      const res = await client.execute({
        sql: `SELECT * FROM school_settings WHERE id = 'default_school' LIMIT 1`,
        args: [],
      });

      if (!res.rows || res.rows.length === 0) return null;

      const row = res.rows[0] as any;
      const local = getStoredSettings();

      return {
        appName: String(row.app_name || local.appName || 'SMART CBT PRO'),
        schoolName: String(row.school_name || local.schoolName || 'SMP NEGERI 1 CERDAS MANDIRI'),
        schoolNpsn: String(row.school_npsn ?? local.schoolNpsn ?? ''),
        schoolAddress: String(row.school_address ?? local.schoolAddress ?? ''),
        schoolCity: String(row.school_city ?? local.schoolCity ?? ''),
        academicYear: String(row.academic_year ?? local.academicYear ?? '2025/2026'),
        semester: ((row.semester as 'Ganjil' | 'Genap') || local.semester || 'Genap'),
        principalName: String(row.principal_name ?? local.principalName ?? ''),
        principalNip: String(row.principal_nip ?? local.principalNip ?? ''),
        logoUrl: String(row.logo_url || local.logoUrl || ''),
        dinasName: String(row.dinas_name || local.dinasName || 'PEMERINTAH KABUPATEN KOTABARU'),
        kabupatenName: String(row.kabupaten_name || local.kabupatenName || 'DINAS PENDIDIKAN DAN KEBUDAYAAN'),
        signatureLocation: String(row.signature_location || local.signatureLocation || 'Kotabaru'),
      };
    } catch (err) {
      handleTursoError('getSchoolSettings', err);
      return null;
    }
  },

  async saveSchoolSettings(settings: SchoolSettings): Promise<boolean> {
    // Selalu pastikan tersimpan ke localStorage terlebih dahulu
    saveStoredSettings(settings);

    const client = getTursoClient();
    if (!client) return false;

    try {
      const now = new Date().toISOString();
      await client.execute({
        sql: `INSERT OR REPLACE INTO school_settings (
          id, app_name, school_name, school_npsn, school_address, school_city,
          academic_year, semester, principal_name, principal_nip, logo_url,
          dinas_name, kabupaten_name, signature_location, updated_at
        ) VALUES (
          'default_school', ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?,
          ?, ?, ?, ?
        )`,
        args: [
          settings.appName || 'SMART CBT PRO',
          settings.schoolName || 'SMP NEGERI 1 CERDAS MANDIRI',
          settings.schoolNpsn || '',
          settings.schoolAddress || '',
          settings.schoolCity || '',
          settings.academicYear || '2025/2026',
          settings.semester || 'Genap',
          settings.principalName || '',
          settings.principalNip || '',
          settings.logoUrl || '',
          settings.dinasName || 'PEMERINTAH KABUPATEN KOTABARU',
          settings.kabupatenName || 'DINAS PENDIDIKAN DAN KEBUDAYAAN',
          settings.signatureLocation || 'Kotabaru',
          now,
        ],
      });
      return true;
    } catch (err) {
      handleTursoError('saveSchoolSettings', err);
      return false;
    }
  },

  // 2. Data Pengguna (Users)
  async getUsers(): Promise<User[] | null> {
    const client = getTursoClient();
    if (!client) return null;

    try {
      const res = await client.execute(`SELECT * FROM users ORDER BY created_at ASC`);
      if (!res.rows || res.rows.length === 0) return null;

      return res.rows.map((row: any) => {
        let subjectNames: string[] = [];
        if (row.subject_names) {
          try {
            subjectNames = typeof row.subject_names === 'string' ? JSON.parse(row.subject_names) : row.subject_names;
          } catch {}
        }

        return {
          id: String(row.id),
          username: String(row.username),
          password: String(row.password || ''),
          name: String(row.name),
          role: row.role as 'admin' | 'guru' | 'siswa',
          nip_nisn: String(row.nip_nisn || ''),
          classGrade: String(row.class_grade || ''),
          gender: (row.gender as 'L' | 'P') || 'L',
          subjectName: String(row.subject_name || ''),
          subjectNames,
          avatarUrl: String(row.avatar_url || ''),
        };
      });
    } catch (err) {
      console.warn('Error fetching users from Turso:', err);
      return null;
    }
  },

  async saveUser(user: User): Promise<boolean> {
    const client = getTursoClient();
    if (!client) return false;

    try {
      await client.execute({
        sql: `INSERT OR REPLACE INTO users (
          id, username, password, name, role, nip_nisn, class_grade, gender, subject_name, subject_names, avatar_url
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          user.id,
          user.username,
          user.password || '123456',
          user.name,
          user.role,
          user.nip_nisn || '',
          user.classGrade || '',
          user.gender || 'L',
          user.subjectName || '',
          JSON.stringify(user.subjectNames || []),
          user.avatarUrl || '',
        ],
      });
      return true;
    } catch (err) {
      handleTursoError('saveUser', err);
      return false;
    }
  },

  async deleteUser(userId: string): Promise<boolean> {
    const client = getTursoClient();
    if (!client) return false;

    try {
      await client.execute({
        sql: `DELETE FROM users WHERE id = ?`,
        args: [userId],
      });
      return true;
    } catch (err) {
      handleTursoError('deleteUser', err);
      return false;
    }
  },

  // 3. Data Mata Pelajaran (Subjects)
  async getSubjects(): Promise<Subject[] | null> {
    const client = getTursoClient();
    if (!client) return null;

    try {
      const res = await client.execute(`SELECT * FROM subjects ORDER BY code ASC`);
      if (!res.rows || res.rows.length === 0) return null;

      return res.rows.map((row: any) => ({
        id: String(row.id),
        code: String(row.code),
        name: String(row.name),
        gradeLevel: String(row.grade_level || 'Semua Kelas'),
        teacherName: String(row.teacher_name || ''),
      }));
    } catch (err) {
      console.warn('Error fetching subjects from Turso:', err);
      return null;
    }
  },

  async saveSubject(subject: Subject): Promise<boolean> {
    const client = getTursoClient();
    if (!client) return false;

    try {
      await client.execute({
        sql: `INSERT OR REPLACE INTO subjects (id, code, name, grade_level, teacher_name)
              VALUES (?, ?, ?, ?, ?)`,
        args: [
          subject.id,
          subject.code,
          subject.name,
          subject.gradeLevel || 'Semua Kelas',
          subject.teacherName || '',
        ],
      });
      return true;
    } catch (err) {
      handleTursoError('saveSubject', err);
      return false;
    }
  },

  async deleteSubject(subjectId: string): Promise<boolean> {
    const client = getTursoClient();
    if (!client) return false;

    try {
      await client.execute({
        sql: `DELETE FROM subjects WHERE id = ?`,
        args: [subjectId],
      });
      return true;
    } catch (err) {
      handleTursoError('deleteSubject', err);
      return false;
    }
  },

  // 4. Data Ujian (Exams)
  async getExams(): Promise<Exam[] | null> {
    const client = getTursoClient();
    if (!client) return null;

    try {
      const res = await client.execute(`SELECT * FROM exams ORDER BY created_at DESC`);
      if (!res.rows || res.rows.length === 0) return null;

      return res.rows.map((row: any) => {
        let targetClasses: string[] = [];
        try {
          targetClasses = typeof row.target_classes === 'string' ? JSON.parse(row.target_classes) : (row.target_classes || []);
        } catch {}

        let questions: any[] = [];
        try {
          questions = typeof row.questions === 'string' ? JSON.parse(row.questions) : (row.questions || []);
        } catch {}

        return {
          id: String(row.id),
          title: String(row.title),
          subjectId: String(row.subject_id || ''),
          subjectName: String(row.subject_name),
          teacherId: String(row.teacher_id),
          teacherName: String(row.teacher_name),
          targetClasses,
          startTime: String(row.start_time || ''),
          endTime: String(row.end_time || ''),
          durationMinutes: Number(row.duration_minutes || 60),
          minSubmitMinutes: Number(row.min_submit_minutes || 15),
          kkm: Number(row.kkm || 75),
          allowRetake: Boolean(row.allow_retake),
          maxRetakes: Number(row.max_retakes || 1),
          releaseScore: Boolean(row.release_score),
          randomizeQuestions: Boolean(row.randomize_questions),
          randomizeOptions: Boolean(row.randomize_options),
          lockdownBrowser: Boolean(row.lockdown_browser),
          maxViolations: Number(row.max_violations || 3),
          token: String(row.token || ''),
          questions,
          status: row.status as 'draft' | 'active' | 'finished',
          isActive: Boolean(row.is_active !== 0 && row.status !== 'inactive'),
          createdAt: String(row.created_at || new Date().toISOString()),
        };
      });
    } catch (err) {
      console.warn('Error fetching exams from Turso:', err);
      return null;
    }
  },

  async saveExam(exam: Exam): Promise<boolean> {
    const client = getTursoClient();
    if (!client) return false;

    try {
      await client.execute({
        sql: `INSERT OR REPLACE INTO exams (
          id, title, subject_id, subject_name, teacher_id, teacher_name,
          target_classes, start_time, end_time, duration_minutes, min_submit_minutes,
          kkm, allow_retake, max_retakes, release_score, randomize_questions,
          randomize_options, lockdown_browser, max_violations, token, questions,
          status, is_active
        ) VALUES (
          ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?,
          ?, ?
        )`,
        args: [
          exam.id,
          exam.title,
          exam.subjectId || '',
          exam.subjectName,
          exam.teacherId,
          exam.teacherName,
          JSON.stringify(exam.targetClasses || []),
          exam.startTime || '',
          exam.endTime || '',
          exam.durationMinutes,
          exam.minSubmitMinutes,
          exam.kkm,
          exam.allowRetake ? 1 : 0,
          exam.maxRetakes || 1,
          exam.releaseScore ? 1 : 0,
          exam.randomizeQuestions ? 1 : 0,
          exam.randomizeOptions ? 1 : 0,
          exam.lockdownBrowser ? 1 : 0,
          exam.maxViolations || 3,
          exam.token || '',
          JSON.stringify(exam.questions || []),
          exam.status,
          exam.isActive === false ? 0 : 1,
        ],
      });
      return true;
    } catch (err) {
      handleTursoError('saveExam', err);
      return false;
    }
  },

  async deleteExam(examId: string): Promise<boolean> {
    const client = getTursoClient();
    if (!client) return false;

    try {
      await client.execute({
        sql: `DELETE FROM exam_attempts WHERE exam_id = ?`,
        args: [examId],
      });
      await client.execute({
        sql: `DELETE FROM exams WHERE id = ?`,
        args: [examId],
      });
      return true;
    } catch (err) {
      handleTursoError('deleteExam', err);
      return false;
    }
  },

  // 5. Data Pengerjaan Ujian Siswa (Exam Attempts)
  async getExamAttempts(): Promise<ExamAttempt[] | null> {
    const client = getTursoClient();
    if (!client) return null;

    try {
      const res = await client.execute(`SELECT * FROM exam_attempts ORDER BY started_at DESC`);
      if (!res.rows || res.rows.length === 0) return [];

      return res.rows.map((row: any) => {
        let answers = {};
        try {
          answers = typeof row.answers === 'string' ? JSON.parse(row.answers) : (row.answers || {});
        } catch {}

        let doubtfulAnswers = {};
        try {
          doubtfulAnswers = typeof row.doubtful_answers === 'string' ? JSON.parse(row.doubtful_answers) : (row.doubtful_answers || {});
        } catch {}

        let scores = {};
        try {
          scores = typeof row.scores === 'string' ? JSON.parse(row.scores) : (row.scores || {});
        } catch {}

        let violationLogs = [];
        try {
          violationLogs = typeof row.violation_logs === 'string' ? JSON.parse(row.violation_logs) : (row.violation_logs || []);
        } catch {}

        return {
          id: String(row.id),
          examId: String(row.exam_id),
          examTitle: String(row.exam_title),
          subjectName: String(row.subject_name),
          studentId: String(row.student_id),
          studentName: String(row.student_name),
          studentNisn: String(row.student_nisn || ''),
          studentClass: String(row.student_class || ''),
          startedAt: String(row.started_at),
          submittedAt: row.submitted_at ? String(row.submitted_at) : undefined,
          answers,
          doubtfulAnswers,
          scores,
          totalScore: Number(row.total_score || 0),
          maxPossibleScore: Number(row.max_possible_score || 100),
          totalEarnedPoints: Number(row.total_earned_points || 0),
          totalMaxPoints: Number(row.total_max_points || 100),
          scorePercentage: Number(row.score_percentage || 0),
          passedKkm: Boolean(row.passed_kkm),
          status: row.status as 'in_progress' | 'submitted' | 'violation_disqualified',
          violationCount: Number(row.violation_count || 0),
          violationLogs,
          teacherFeedback: String(row.teacher_feedback || ''),
          isGraded: Boolean(row.is_graded),
        };
      });
    } catch (err) {
      console.warn('Error fetching exam attempts from Turso:', err);
      return null;
    }
  },

  async saveExamAttempt(attempt: ExamAttempt): Promise<boolean> {
    const client = getTursoClient();
    if (!client) return false;

    try {
      const sanitized = {
        id: String(attempt.id || 'att_' + Date.now()),
        exam_id: String(attempt.examId || ''),
        exam_title: String(attempt.examTitle || 'Ujian'),
        subject_name: String(attempt.subjectName || '-'),
        student_id: String(attempt.studentId || ''),
        student_name: String(attempt.studentName || 'Siswa'),
        student_nisn: String(attempt.studentNisn || ''),
        student_class: String(attempt.studentClass || ''),
        started_at: attempt.startedAt || new Date().toISOString(),
        submitted_at: attempt.submittedAt || (attempt.status === 'submitted' || attempt.status === 'violation_disqualified' ? new Date().toISOString() : null),
        answers: JSON.stringify(attempt.answers || {}),
        doubtful_answers: JSON.stringify(attempt.doubtfulAnswers || {}),
        scores: JSON.stringify(attempt.scores || {}),
        total_score: Number.isFinite(attempt.totalScore) ? Number(attempt.totalScore) : 0,
        max_possible_score: Number.isFinite(attempt.maxPossibleScore) ? Number(attempt.maxPossibleScore) : 100,
        total_earned_points: Number.isFinite(attempt.totalEarnedPoints) ? Number(attempt.totalEarnedPoints) : (Number.isFinite(attempt.totalScore) ? Number(attempt.totalScore) : 0),
        total_max_points: Number.isFinite(attempt.totalMaxPoints) ? Number(attempt.totalMaxPoints) : 100,
        score_percentage: Number.isFinite(attempt.scorePercentage) ? Number(attempt.scorePercentage) : 0,
        passed_kkm: attempt.passedKkm ? 1 : 0,
        status: attempt.status || 'in_progress',
        violation_count: Number.isFinite(attempt.violationCount) ? Number(attempt.violationCount) : 0,
        violation_logs: JSON.stringify(Array.isArray(attempt.violationLogs) ? attempt.violationLogs : []),
        teacher_feedback: String(attempt.teacherFeedback || ''),
        is_graded: attempt.isGraded ? 1 : 0,
      };

      await client.execute({
        sql: `INSERT OR REPLACE INTO exam_attempts (
          id, exam_id, exam_title, subject_name, student_id, student_name,
          student_nisn, student_class, started_at, submitted_at,
          answers, doubtful_answers, scores, total_score, max_possible_score,
          total_earned_points, total_max_points, score_percentage, passed_kkm,
          status, violation_count, violation_logs, teacher_feedback, is_graded
        ) VALUES (
          ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?,
          ?, ?, ?, ?, ?,
          ?, ?, ?, ?,
          ?, ?, ?, ?, ?
        )`,
        args: [
          sanitized.id,
          sanitized.exam_id,
          sanitized.exam_title,
          sanitized.subject_name,
          sanitized.student_id,
          sanitized.student_name,
          sanitized.student_nisn,
          sanitized.student_class,
          sanitized.started_at,
          sanitized.submitted_at,
          sanitized.answers,
          sanitized.doubtful_answers,
          sanitized.scores,
          sanitized.total_score,
          sanitized.max_possible_score,
          sanitized.total_earned_points,
          sanitized.total_max_points,
          sanitized.score_percentage,
          sanitized.passed_kkm,
          sanitized.status,
          sanitized.violation_count,
          sanitized.violation_logs,
          sanitized.teacher_feedback,
          sanitized.is_graded,
        ],
      });
      return true;
    } catch (err) {
      handleTursoError('saveExamAttempt', err);
      return false;
    }
  },

  async deleteExamAttempt(attemptId: string): Promise<boolean> {
    const client = getTursoClient();
    if (!client) return false;

    try {
      await client.execute({
        sql: `DELETE FROM exam_attempts WHERE id = ?`,
        args: [attemptId],
      });
      return true;
    } catch (err) {
      handleTursoError('deleteExamAttempt', err);
      return false;
    }
  },

  async deleteExamAttempts(attemptIds: string[]): Promise<boolean> {
    const client = getTursoClient();
    if (!client || attemptIds.length === 0) return true;

    try {
      // Chunking for safe execution
      const chunkSize = 50;
      for (let i = 0; i < attemptIds.length; i += chunkSize) {
        const chunk = attemptIds.slice(i, i + chunkSize);
        const placeholders = chunk.map(() => '?').join(',');
        await client.execute({
          sql: `DELETE FROM exam_attempts WHERE id IN (${placeholders})`,
          args: chunk,
        });
      }
      return true;
    } catch (err) {
      handleTursoError('deleteExamAttempts', err);
      return false;
    }
  },

  // 6. Fungsi Migrasi Penuh (One-Click Migration ke Turso)
  async migrateAllToTurso(data: {
    settings: SchoolSettings;
    users: User[];
    subjects: Subject[];
    exams: Exam[];
    attempts: ExamAttempt[];
  }): Promise<{
    success: boolean;
    message: string;
    counts: { users: number; subjects: number; exams: number; attempts: number };
  }> {
    const config = (await import('../lib/turso')).getTursoConfig();
    
    // 1. Coba migrasi cepat & tangguh via Server-side Express API
    if (config.isConfigured) {
      try {
        const res = await fetch('/api/turso/migrate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            url: config.url,
            authToken: config.authToken,
            settings: data.settings,
            users: data.users,
            subjects: data.subjects,
            exams: data.exams,
            attempts: data.attempts,
          }),
        });
        if (res.ok) {
          const result = await res.json();
          return result;
        } else {
          const errData = await res.json().catch(() => ({}));
          if (errData.message) {
            return {
              success: false,
              message: errData.message,
              counts: { users: 0, subjects: 0, exams: 0, attempts: 0 },
            };
          }
        }
      } catch (proxyErr) {
        console.warn('Server proxy migration failed, trying client-side loop:', proxyErr);
      }
    }

    const client = getTursoClient();
    if (!client) {
      return {
        success: false,
        message: 'Koneksi Turso belum aktif. Silakan isi URL dan Auth Token terlebih dahulu.',
        counts: { users: 0, subjects: 0, exams: 0, attempts: 0 },
      };
    }

    try {
      // 1. Inisialisasi skema tabel jika belum ada
      const initResult = await initTursoSchema(client);
      if (!initResult.success) {
        return {
          success: false,
          message: `Inisialisasi tabel gagal: ${initResult.message}`,
          counts: { users: 0, subjects: 0, exams: 0, attempts: 0 },
        };
      }

      // 2. Simpan profil sekolah
      await this.saveSchoolSettings(data.settings);

      // 3. Simpan seluruh user
      let userCount = 0;
      for (const u of data.users) {
        const ok = await this.saveUser(u);
        if (ok) userCount++;
      }

      // 4. Simpan seluruh mapel
      let subjectCount = 0;
      for (const s of data.subjects) {
        const ok = await this.saveSubject(s);
        if (ok) subjectCount++;
      }

      // 5. Simpan seluruh paket ujian
      let examCount = 0;
      for (const e of data.exams) {
        const ok = await this.saveExam(e);
        if (ok) examCount++;
      }

      // 6. Simpan seluruh attempt pengerjaan siswa
      let attemptCount = 0;
      for (const a of data.attempts) {
        const ok = await this.saveExamAttempt(a);
        if (ok) attemptCount++;
      }

      return {
        success: true,
        message: `Migrasi ke Turso berhasil! Data tersimpan: ${userCount} Pengguna, ${subjectCount} Mapel, ${examCount} Ujian, dan ${attemptCount} Riwayat Pengerjaan.`,
        counts: {
          users: userCount,
          subjects: subjectCount,
          exams: examCount,
          attempts: attemptCount,
        },
      };
    } catch (err: any) {
      console.error('Migration to Turso failed:', err);
      return {
        success: false,
        message: `Gagal migrasi ke Turso: ${err?.message || err}`,
        counts: { users: 0, subjects: 0, exams: 0, attempts: 0 },
      };
    }
  },
};
