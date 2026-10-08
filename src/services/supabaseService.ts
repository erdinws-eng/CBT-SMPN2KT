import { getSupabase } from '../lib/supabase';
import { SchoolSettings, User, Subject, Exam, ExamAttempt } from '../types';

export const supabaseService = {
  // 1. Ambil data sekolah
  async getSchoolSettings(): Promise<SchoolSettings | null> {
    const supabase = getSupabase();
    if (!supabase) return null;

    try {
      const { data, error } = await supabase
        .from('school_settings')
        .select('*')
        .eq('id', 'default_school')
        .single();

      if (error || !data) return null;

      return {
        appName: data.app_name || 'SMART CBT PRO',
        schoolName: data.school_name,
        schoolNpsn: data.school_npsn || '',
        schoolAddress: data.school_address || '',
        schoolCity: data.school_city || '',
        academicYear: data.academic_year || '',
        semester: data.semester || 'Genap',
        principalName: data.principal_name || '',
        principalNip: data.principal_nip || '',
        logoUrl: data.logo_url || '',
      };
    } catch (err) {
      console.warn('Error fetching school settings from Supabase:', err);
      return null;
    }
  },

  async saveSchoolSettings(settings: SchoolSettings): Promise<boolean> {
    const supabase = getSupabase();
    if (!supabase) return false;

    try {
      const { error } = await supabase.from('school_settings').upsert({
        id: 'default_school',
        
        school_name: settings.schoolName,
        school_npsn: settings.schoolNpsn || '',
        school_address: settings.schoolAddress || '',
        school_city: settings.schoolCity || '',
        academic_year: settings.academicYear,
        semester: settings.semester,
        principal_name: settings.principalName || '',
        principal_nip: settings.principalNip || '',
        logo_url: settings.logoUrl || '',
        updated_at: new Date().toISOString(),
      });
      return !error;
    } catch (err) {
      console.error('Error saving school settings to Supabase:', err);
      return false;
    }
  },

  // 2. Data Pengguna (Users)
  async getUsers(): Promise<User[] | null> {
    const supabase = getSupabase();
    if (!supabase) return null;

    try {
      const { data, error } = await supabase.from('users').select('*');
      if (error || !data || data.length === 0) return null;

      return data.map((u) => ({
        id: u.id,
        username: u.username,
        password: u.password,
        name: u.name,
        role: u.role,
        nip_nisn: u.nip_nisn || '',
        classGrade: u.class_grade || '',
        gender: u.gender || 'L',
        subjectName: u.subject_name || '',
        subjectNames: u.subject_names || [],
        avatarUrl: u.avatar_url || '',
      }));
    } catch (err) {
      console.warn('Error fetching users from Supabase:', err);
      return null;
    }
  },

  async saveUser(user: User): Promise<boolean> {
    const supabase = getSupabase();
    if (!supabase) return false;

    try {
      const { error } = await supabase.from('users').upsert({
        id: user.id,
        username: user.username,
        password: user.password || '123456',
        name: user.name,
        role: user.role,
        nip_nisn: user.nip_nisn || '',
        class_grade: user.classGrade || '',
        gender: user.gender || 'L',
        subject_name: user.subjectName || '',
        subject_names: user.subjectNames || [],
        avatar_url: user.avatarUrl || '',
      });
      return !error;
    } catch (err) {
      console.error('Error saving user to Supabase:', err);
      return false;
    }
  },

  async deleteUser(userId: string): Promise<boolean> {
    const supabase = getSupabase();
    if (!supabase) return false;

    try {
      const { error } = await supabase.from('users').delete().eq('id', userId);
      return !error;
    } catch (err) {
      return false;
    }
  },

  // 3. Data Mata Pelajaran (Subjects)
  async getSubjects(): Promise<Subject[] | null> {
    const supabase = getSupabase();
    if (!supabase) return null;

    try {
      const { data, error } = await supabase.from('subjects').select('*');
      if (error || !data || data.length === 0) return null;

      return data.map((s) => ({
        id: s.id,
        code: s.code,
        name: s.name,
        gradeLevel: s.grade_level || '',
        teacherName: s.teacher_name || '',
      }));
    } catch (err) {
      return null;
    }
  },

  async saveSubject(subject: Subject): Promise<boolean> {
    const supabase = getSupabase();
    if (!supabase) return false;

    try {
      const { error } = await supabase.from('subjects').upsert({
        id: subject.id,
        code: subject.code,
        name: subject.name,
        grade_level: subject.gradeLevel,
        teacher_name: subject.teacherName || '',
      });
      return !error;
    } catch (err) {
      return false;
    }
  },

  async deleteSubject(subjectId: string): Promise<boolean> {
    const supabase = getSupabase();
    if (!supabase) return false;

    try {
      const { error } = await supabase.from('subjects').delete().eq('id', subjectId);
      return !error;
    } catch (err) {
      return false;
    }
  },

  // 4. Data Ujian (Exams)
  async getExams(): Promise<Exam[] | null> {
    const supabase = getSupabase();
    if (!supabase) return null;

    try {
      const { data, error } = await supabase.from('exams').select('*');
      if (error || !data || data.length === 0) return null;

      return data.map((e) => ({
        id: e.id,
        title: e.title,
        subjectId: e.subject_id || '',
        subjectName: e.subject_name,
        teacherId: e.teacher_id,
        teacherName: e.teacher_name,
        targetClasses: e.target_classes || [],
        startTime: e.start_time || '',
        endTime: e.end_time || '',
        durationMinutes: e.duration_minutes,
        minSubmitMinutes: e.min_submit_minutes,
        kkm: Number(e.kkm),
        allowRetake: Boolean(e.allow_retake),
        maxRetakes: e.max_retakes || 1,
        releaseScore: Boolean(e.release_score),
        randomizeQuestions: Boolean(e.randomize_questions),
        randomizeOptions: Boolean(e.randomize_options),
        lockdownBrowser: Boolean(e.lockdown_browser),
        maxViolations: e.max_violations || 1,
        token: e.token || '',
        questions: e.questions || [],
        status: e.status,
        isActive: e.status !== 'inactive',
        createdAt: e.created_at || new Date().toISOString(),
      }));
    } catch (err) {
      console.warn('Error fetching exams from Supabase:', err);
      return null;
    }
  },

  async saveExam(exam: Exam): Promise<boolean> {
    const supabase = getSupabase();
    if (!supabase) return false;

    try {
      const { error } = await supabase.from('exams').upsert({
        id: exam.id,
        title: exam.title,
        subject_id: exam.subjectId,
        subject_name: exam.subjectName,
        teacher_id: exam.teacherId,
        teacher_name: exam.teacherName,
        target_classes: exam.targetClasses,
        start_time: exam.startTime,
        end_time: exam.endTime,
        duration_minutes: exam.durationMinutes,
        min_submit_minutes: exam.minSubmitMinutes,
        kkm: exam.kkm,
        allow_retake: exam.allowRetake,
        max_retakes: exam.maxRetakes,
        release_score: exam.releaseScore,
        randomize_questions: exam.randomizeQuestions,
        randomize_options: exam.randomizeOptions,
        lockdown_browser: exam.lockdownBrowser,
        max_violations: exam.maxViolations,
        token: exam.token || '',
        questions: exam.questions,
        status: exam.isActive === false ? 'inactive' : 'active',
      });
      return !error;
    } catch (err) {
      console.error('Error saving exam to Supabase:', err);
      return false;
    }
  },

  async deleteExam(examId: string): Promise<boolean> {
    const supabase = getSupabase();
    if (!supabase) return false;

    try {
      // 1. Hapus pengerjaan siswa yang terhubung dengan paket ujian ini terlebih dahulu
      // agar tidak terbentur constraint foreign key PostgreSQL
      await supabase.from('exam_attempts').delete().eq('exam_id', examId);
      // 2. Hapus paket ujian dari tabel exams
      const { error } = await supabase.from('exams').delete().eq('id', examId);
      return !error;
    } catch (err) {
      console.error('Error deleting exam from Supabase:', err);
      return false;
    }
  },

  // 5. Data Pengerjaan Ujian Siswa (Exam Attempts)
  async getExamAttempts(): Promise<ExamAttempt[] | null> {
    const supabase = getSupabase();
    if (!supabase) return null;

    try {
      const { data, error } = await supabase.from('exam_attempts').select('*');
      if (error || !data) return null;

      return data.map((a) => ({
        id: a.id,
        examId: a.exam_id,
        examTitle: a.exam_title,
        subjectName: a.subject_name,
        studentId: a.student_id,
        studentName: a.student_name,
        studentNisn: a.student_nisn || '',
        studentClass: a.student_class || '',
        startedAt: a.started_at,
        submittedAt: a.submitted_at || undefined,
        answers: a.answers || {},
        doubtfulAnswers: a.doubtful_answers || {},
        scores: a.scores || {},
        totalScore: Number(a.total_score || 0),
        maxPossibleScore: Number(a.max_possible_score || 100),
        totalEarnedPoints: Number(a.total_earned_points || 0),
        totalMaxPoints: Number(a.total_max_points || 100),
        scorePercentage: Number(a.score_percentage || 0),
        passedKkm: Boolean(a.passed_kkm),
        status: a.status,
        violationCount: a.violation_count || 0,
        violationLogs: a.violation_logs || [],
        teacherFeedback: a.teacher_feedback || '',
        isGraded: Boolean(a.is_graded),
      }));
    } catch (err) {
      console.warn('Error fetching exam attempts from Supabase:', err);
      return null;
    }
  },

  async saveExamAttempt(attempt: ExamAttempt): Promise<boolean> {
    const supabase = getSupabase();
    if (!supabase) return false;

    const sanitizedPayload = {
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
      answers: attempt.answers || {},
      doubtful_answers: attempt.doubtfulAnswers || {},
      scores: attempt.scores || {},
      total_score: Number.isFinite(attempt.totalScore) ? Number(attempt.totalScore) : 0,
      max_possible_score: Number.isFinite(attempt.maxPossibleScore) ? Number(attempt.maxPossibleScore) : 100,
      total_earned_points: Number.isFinite(attempt.totalEarnedPoints) ? Number(attempt.totalEarnedPoints) : (Number.isFinite(attempt.totalScore) ? Number(attempt.totalScore) : 0),
      total_max_points: Number.isFinite(attempt.totalMaxPoints) ? Number(attempt.totalMaxPoints) : (Number.isFinite(attempt.maxPossibleScore) ? Number(attempt.maxPossibleScore) : 100),
      score_percentage: Number.isFinite(attempt.scorePercentage) ? Number(attempt.scorePercentage) : 0,
      passed_kkm: Boolean(attempt.passedKkm),
      status: attempt.status || 'in_progress',
      violation_count: Number.isFinite(attempt.violationCount) ? Number(attempt.violationCount) : 0,
      violation_logs: Array.isArray(attempt.violationLogs) ? attempt.violationLogs : [],
      teacher_feedback: String(attempt.teacherFeedback || ''),
      is_graded: Boolean(attempt.isGraded),
    };

    const timeoutPromise = (ms: number) =>
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Supabase network timeout')), ms)
      );

    try {
      // Coba pertama dengan timeout 6 detik
      await Promise.race([
        (async () => {
          const { error } = await supabase.from('exam_attempts').upsert(sanitizedPayload);
          if (error) throw error;
        })(),
        timeoutPromise(6000),
      ]);
      return true;
    } catch (err) {
      console.warn('Upsert attempt ke Supabase tertunda/gagal, mencoba ulang...', err);
      try {
        await new Promise((res) => setTimeout(res, 500));
        await Promise.race([
          (async () => {
            const { error: retryError } = await supabase.from('exam_attempts').upsert(sanitizedPayload);
            if (retryError) throw retryError;
          })(),
          timeoutPromise(6000),
        ]);
        return true;
      } catch (retryErr) {
        console.error('Retry upsert attempt gagal:', retryErr);
        return false;
      }
    }
  },

  async deleteExamAttempt(attemptId: string): Promise<boolean> {
    const supabase = getSupabase();
    if (!supabase) return false;

    try {
      const { error } = await supabase.from('exam_attempts').delete().eq('id', attemptId);
      return !error;
    } catch (err) {
      return false;
    }
  },

  async deleteExamAttempts(attemptIds: string[]): Promise<boolean> {
    const supabase = getSupabase();
    if (!supabase || attemptIds.length === 0) return true;

    try {
      const chunkSize = 100;
      for (let i = 0; i < attemptIds.length; i += chunkSize) {
        const chunk = attemptIds.slice(i, i + chunkSize);
        await supabase.from('exam_attempts').delete().in('id', chunk);
      }
      return true;
    } catch (err) {
      console.error('Error batch deleting exam attempts from Supabase:', err);
      return false;
    }
  },
};
