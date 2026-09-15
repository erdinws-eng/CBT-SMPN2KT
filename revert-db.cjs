const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://ejhdnmkjmczvwdjentel.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVqaGRubWtqbWN6dndkamVudGVsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg3ODM0NTQsImV4cCI6MjEwNDM1OTQ1NH0.sQCF41lP-3od6FwEK9-LTGy9D74ZEXgw3eOKeaA0woU'
);
async function test() {
  const { data, error } = await supabase.from('school_settings').upsert({
    id: 'default_school',
    school_name: 'SMP NEGERI 1 CERDAS MANDIRI',
    school_npsn: '20210099',
    school_address: 'Jl. Pendidikan Nusantara No. 45, Kompleks Edukasi Terpadu',
    school_city: 'Kota Jakarta Selatan',
    academic_year: '2025/2026',
    semester: 'Genap',
    principal_name: 'Drs. H. Mulyadi, M.Pd.',
    principal_nip: '19750512 199903 1 002',
    logo_url: '',
    updated_at: new Date().toISOString(),
  });
  console.log('Reverted db:', error);
}
test();
