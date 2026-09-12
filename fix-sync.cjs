const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

// We need to add refs to track previous lists to handle deletions in Supabase.
const targetRefs = `  // Fungsi memuat data dari Supabase`;
const replacementRefs = `  const prevUsersRef = useRef<User[]>(users);
  const prevSubjectsRef = useRef<Subject[]>(subjects);
  const prevExamsRef = useRef<Exam[]>(exams);
  const prevAttemptsRef = useRef<ExamAttempt[]>(attempts);

  // Fungsi memuat data dari Supabase`;

code = code.replace(targetRefs, replacementRefs);

const targetUseEffect = `  // Sync state changes with localStorage & Supabase
  useEffect(() => {
    saveUsers(users);
    if (getSupabaseConfig().isConfigured) {
      users.forEach((u) => supabaseService.saveUser(u));
    }
  }, [users]);

  useEffect(() => {
    saveSubjects(subjects);
    if (getSupabaseConfig().isConfigured) {
      subjects.forEach((s) => supabaseService.saveSubject(s));
    }
  }, [subjects]);

  useEffect(() => {
    saveExams(exams);
    if (getSupabaseConfig().isConfigured) {
      exams.forEach((e) => supabaseService.saveExam(e));
    }
  }, [exams]);

  useEffect(() => {
    saveAttempts(attempts);
    if (getSupabaseConfig().isConfigured) {
      attempts.forEach((a) => supabaseService.saveExamAttempt(a));
    }
  }, [attempts]);`;

const replacementUseEffect = `  // Sync state changes with localStorage & Supabase (including Deletions)
  useEffect(() => {
    saveUsers(users);
    if (getSupabaseConfig().isConfigured) {
      users.forEach((u) => supabaseService.saveUser(u));
      // Detect deletions
      const currentIds = new Set(users.map(u => u.id));
      prevUsersRef.current.forEach(old => {
        if (!currentIds.has(old.id)) supabaseService.deleteUser(old.id);
      });
    }
    prevUsersRef.current = users;
  }, [users]);

  useEffect(() => {
    saveSubjects(subjects);
    if (getSupabaseConfig().isConfigured) {
      subjects.forEach((s) => supabaseService.saveSubject(s));
      // Detect deletions
      const currentIds = new Set(subjects.map(s => s.id));
      prevSubjectsRef.current.forEach(old => {
        if (!currentIds.has(old.id)) supabaseService.deleteSubject(old.id);
      });
    }
    prevSubjectsRef.current = subjects;
  }, [subjects]);

  useEffect(() => {
    saveExams(exams);
    if (getSupabaseConfig().isConfigured) {
      exams.forEach((e) => supabaseService.saveExam(e));
      // Detect deletions
      const currentIds = new Set(exams.map(e => e.id));
      prevExamsRef.current.forEach(old => {
        if (!currentIds.has(old.id)) supabaseService.deleteExam(old.id);
      });
    }
    prevExamsRef.current = exams;
  }, [exams]);

  useEffect(() => {
    saveAttempts(attempts);
    if (getSupabaseConfig().isConfigured) {
      attempts.forEach((a) => supabaseService.saveExamAttempt(a));
      // Detect deletions
      const currentIds = new Set(attempts.map(a => a.id));
      prevAttemptsRef.current.forEach(old => {
        if (!currentIds.has(old.id)) supabaseService.deleteExamAttempt(old.id);
      });
    }
    prevAttemptsRef.current = attempts;
  }, [attempts]);`;

code = code.replace(targetUseEffect, replacementUseEffect);

// Add useRef to import if missing
if (!code.includes("useRef")) {
    code = code.replace("import React, { useState, useEffect, useCallback }", "import React, { useState, useEffect, useCallback, useRef }");
}

fs.writeFileSync('src/App.tsx', code);
