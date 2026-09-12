const fs = require('fs');
let code = fs.readFileSync('supabase_schema.sql', 'utf-8');

const targetStr = `DO $
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
$;`;

const replaceStr = `DROP POLICY IF EXISTS "Akses Penuh School Settings" ON public.school_settings;
CREATE POLICY "Akses Penuh School Settings" ON public.school_settings FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Akses Penuh Users" ON public.users;
CREATE POLICY "Akses Penuh Users" ON public.users FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Akses Penuh Subjects" ON public.subjects;
CREATE POLICY "Akses Penuh Subjects" ON public.subjects FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Akses Penuh Exams" ON public.exams;
CREATE POLICY "Akses Penuh Exams" ON public.exams FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Akses Penuh Exam Attempts" ON public.exam_attempts;
CREATE POLICY "Akses Penuh Exam Attempts" ON public.exam_attempts FOR ALL USING (true) WITH CHECK (true);`;

if (code.includes('DO $')) {
    code = code.replace(targetStr, replaceStr);
    fs.writeFileSync('supabase_schema.sql', code);
    console.log('Reverted to DROP and CREATE POLICY');
} else {
    console.log('Could not find DO $ to replace');
}
