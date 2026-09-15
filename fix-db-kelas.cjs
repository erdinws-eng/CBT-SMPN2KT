const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://ejhdnmkjmczvwdjentel.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVqaGRubWtqbWN6dndkamVudGVsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg3ODM0NTQsImV4cCI6MjEwNDM1OTQ1NH0.sQCF41lP-3od6FwEK9-LTGy9D74ZEXgw3eOKeaA0woU'
);

async function run() {
  const { data, error } = await supabase
    .from('subjects')
    .update({ grade_level: '7A, 7B' })
    .eq('grade_level', 'SMP Kelas 8');
  
  console.log('Updated db subjects:', error || 'Success');
}
run();
