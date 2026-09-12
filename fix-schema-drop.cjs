const fs = require('fs');
let code = fs.readFileSync('supabase_schema.sql', 'utf-8');

const prefix = `-- ==============================================================================
-- SKEMA LENGKAP DATABASE SUPABASE UNTUK APLIKASI CBT SMART EXAM PRO
-- Jalankan skrip ini pada menu "SQL Editor" di Dashboard Supabase Anda
-- ==============================================================================

-- BERSIHKAN TABEL LAMA (Jika ada)
DROP TABLE IF EXISTS public.exam_attempts CASCADE;
DROP TABLE IF EXISTS public.exams CASCADE;
DROP TABLE IF EXISTS public.subjects CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;
DROP TABLE IF EXISTS public.school_settings CASCADE;

`;

if (!code.includes('DROP TABLE IF EXISTS public.exam_attempts CASCADE;')) {
    code = code.replace(`-- ==============================================================================
-- SKEMA LENGKAP DATABASE SUPABASE UNTUK APLIKASI CBT SMART EXAM PRO
-- Jalankan skrip ini pada menu "SQL Editor" di Dashboard Supabase Anda
-- ==============================================================================`, prefix);
    fs.writeFileSync('supabase_schema.sql', code);
    console.log('Added DROP TABLE to supabase_schema.sql');
}
