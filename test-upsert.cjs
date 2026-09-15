const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://ejhdnmkjmczvwdjentel.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVqaGRubWtqbWN6dndkamVudGVsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg3ODM0NTQsImV4cCI6MjEwNDM1OTQ1NH0.sQCF41lP-3od6FwEK9-LTGy9D74ZEXgw3eOKeaA0woU'
);

async function test() {
  const { data, error } = await supabase.from('school_settings').upsert({
    id: 'default_school',
    app_name: 'SMART CBT PRO',
    school_name: 'TEST SEKOLAH BARU',
    school_npsn: '12345678',
    school_address: 'Jl. Test',
    school_city: 'Kota Test',
    academic_year: '2023/2024',
    semester: 'Ganjil',
    principal_name: 'Test Name',
    principal_nip: '123',
    logo_url: '',
    updated_at: new Date().toISOString(),
  });
  console.log({ data, error });
}
test();
