const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://ejhdnmkjmczvwdjentel.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVqaGRubWtqbWN6dndkamVudGVsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg3ODM0NTQsImV4cCI6MjEwNDM1OTQ1NH0.sQCF41lP-3od6FwEK9-LTGy9D74ZEXgw3eOKeaA0woU'
);

async function run() {
  const { data: subjects, error: fetchError } = await supabase
    .from('subjects')
    .select('id, name, grade_level');
  
  if (fetchError) {
    console.error(fetchError);
    return;
  }

  for (const sub of subjects) {
    if (sub.grade_level && sub.grade_level.includes('SMP Kelas 8, ')) {
      const newGradeLevel = sub.grade_level.replace('SMP Kelas 8, ', '');
      await supabase.from('subjects').update({ grade_level: newGradeLevel }).eq('id', sub.id);
      console.log(`Updated ${sub.name}: ${sub.grade_level} -> ${newGradeLevel}`);
    } else if (sub.grade_level && sub.grade_level.includes('7A, 7B, ')) {
      const newGradeLevel = sub.grade_level.replace('7A, 7B, ', '');
      await supabase.from('subjects').update({ grade_level: newGradeLevel }).eq('id', sub.id);
      console.log(`Updated ${sub.name}: ${sub.grade_level} -> ${newGradeLevel}`);
    }
  }
  console.log('Done fixing subjects in DB.');
}
run();
