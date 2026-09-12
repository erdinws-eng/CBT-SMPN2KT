const fs = require('fs');
let code = fs.readFileSync('supabase_schema.sql', 'utf-8');

const targetStr = `DROP POLICY IF EXISTS "Akses Penuh School Settings" ON public.school_settings;
DROP POLICY IF EXISTS "Akses Penuh Users" ON public.users;
DROP POLICY IF EXISTS "Akses Penuh Subjects" ON public.subjects;
DROP POLICY IF EXISTS "Akses Penuh Exams" ON public.exams;
DROP POLICY IF EXISTS "Akses Penuh Exam Attempts" ON public.exam_attempts;

CREATE POLICY "Akses Penuh School Settings" ON public.school_settings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Akses Penuh Users" ON public.users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Akses Penuh Subjects" ON public.subjects FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Akses Penuh Exams" ON public.exams FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Akses Penuh Exam Attempts" ON public.exam_attempts FOR ALL USING (true) WITH CHECK (true);`;

const replaceStr = `DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'school_settings' AND policyname = 'Akses Penuh School Settings') THEN
        CREATE POLICY "Akses Penuh School Settings" ON public.school_settings FOR ALL USING (true) WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'users' AND policyname = 'Akses Penuh Users') THEN
        CREATE POLICY "Akses Penuh Users" ON public.users FOR ALL USING (true) WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'subjects' AND policyname = 'Akses Penuh Subjects') THEN
        CREATE POLICY "Akses Penuh Subjects" ON public.subjects FOR ALL USING (true) WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'exams' AND policyname = 'Akses Penuh Exams') THEN
        CREATE POLICY "Akses Penuh Exams" ON public.exams FOR ALL USING (true) WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'exam_attempts' AND policyname = 'Akses Penuh Exam Attempts') THEN
        CREATE POLICY "Akses Penuh Exam Attempts" ON public.exam_attempts FOR ALL USING (true) WITH CHECK (true);
    END IF;
END
$$;`;

if (code.includes('DROP POLICY IF EXISTS')) {
    code = code.replace(targetStr, replaceStr);
    fs.writeFileSync('supabase_schema.sql', code);
    console.log('Fixed supabase_schema.sql with DO block');
} else {
    console.log('Could not find policies to replace');
}
