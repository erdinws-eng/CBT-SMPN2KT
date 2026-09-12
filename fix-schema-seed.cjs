const fs = require('fs');
let code = fs.readFileSync('supabase_schema.sql', 'utf-8');

const targetStr = `INSERT INTO public.school_settings (id, school_name, school_npsn, school_address, school_city, academic_year, semester, principal_name, principal_nip)
VALUES (
    'default_school',
    'SMP NEGERI 1 CERDAS MANDIRI',
    '20210099',
    'Jl. Pendidikan Nusantara No. 45, Kompleks Edukasi Terpadu',
    'Kota Jakarta Selatan',
    '2025/2026',
    'Genap',
    'Drs. H. Mulyadi, M.Pd.',
    '19750512 199903 1 002'
) ON CONFLICT (id) DO NOTHING;`;

const replaceStr = `INSERT INTO public.school_settings (id, school_name, school_npsn, school_address, school_city, academic_year, semester, principal_name, principal_nip)
VALUES (
    'default_school',
    'SMP NEGERI 1 CERDAS MANDIRI',
    '20210099',
    'Jl. Pendidikan Nusantara No. 45, Kompleks Edukasi Terpadu',
    'Kota Jakarta Selatan',
    '2025/2026',
    'Genap',
    'Drs. H. Mulyadi, M.Pd.',
    '19750512 199903 1 002'
) ON CONFLICT (id) DO UPDATE SET 
    school_name = EXCLUDED.school_name,
    school_npsn = EXCLUDED.school_npsn,
    school_address = EXCLUDED.school_address,
    school_city = EXCLUDED.school_city,
    academic_year = EXCLUDED.academic_year,
    semester = EXCLUDED.semester,
    principal_name = EXCLUDED.principal_name,
    principal_nip = EXCLUDED.principal_nip;`;

if (code.includes('INSERT INTO public.school_settings')) {
    code = code.replace(targetStr, replaceStr);
    fs.writeFileSync('supabase_schema.sql', code);
    console.log('Fixed supabase_schema.sql UPSERT');
} else {
    console.log('Could not find seed data to replace');
}
