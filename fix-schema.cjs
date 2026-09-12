const fs = require('fs');
let code = fs.readFileSync('supabase_schema.sql', 'utf-8');

const targetStr = `CREATE POLICY "Akses Penuh School Settings" ON public.school_settings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Akses Penuh Users" ON public.users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Akses Penuh Subjects" ON public.subjects FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Akses Penuh Exams" ON public.exams FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Akses Penuh Exam Attempts" ON public.exam_attempts FOR ALL USING (true) WITH CHECK (true);`;

const replaceStr = `DROP POLICY IF EXISTS "Akses Penuh School Settings" ON public.school_settings;
DROP POLICY IF EXISTS "Akses Penuh Users" ON public.users;
DROP POLICY IF EXISTS "Akses Penuh Subjects" ON public.subjects;
DROP POLICY IF EXISTS "Akses Penuh Exams" ON public.exams;
DROP POLICY IF EXISTS "Akses Penuh Exam Attempts" ON public.exam_attempts;

CREATE POLICY "Akses Penuh School Settings" ON public.school_settings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Akses Penuh Users" ON public.users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Akses Penuh Subjects" ON public.subjects FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Akses Penuh Exams" ON public.exams FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Akses Penuh Exam Attempts" ON public.exam_attempts FOR ALL USING (true) WITH CHECK (true);`;

if (code.includes('CREATE POLICY "Akses Penuh School Settings" ON public.school_settings FOR ALL USING (true) WITH CHECK (true);')) {
    code = code.replace(targetStr, replaceStr);
    fs.writeFileSync('supabase_schema.sql', code);
    console.log('Fixed supabase_schema.sql');
} else {
    console.log('Could not find policies to replace');
}
