const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://ejhdnmkjmczvwdjentel.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVqaGRubWtqbWN6dndkamVudGVsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg3ODM0NTQsImV4cCI6MjEwNDM1OTQ1NH0.sQCF41lP-3od6FwEK9-LTGy9D74ZEXgw3eOKeaA0woU'
);

async function run() {
  const { data, error } = await supabase
    .from('subjects')
    .select('id, name, grade_level');
  
  console.log('Subjects:', data);
}
run();
