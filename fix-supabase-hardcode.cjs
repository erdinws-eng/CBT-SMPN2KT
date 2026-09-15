const fs = require('fs');
let code = fs.readFileSync('src/lib/supabase.ts', 'utf-8');

code = code.replace(
  /const envUrl = import\.meta\.env\.VITE_SUPABASE_URL \|\| '';\s*const envKey = import\.meta\.env\.VITE_SUPABASE_ANON_KEY \|\| '';/,
  `const envUrl = import.meta.env.VITE_SUPABASE_URL || 'https://ejhdnmkjmczvwdjentel.supabase.co';
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVqaGRubWtqbWN6dndkamVudGVsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg3ODM0NTQsImV4cCI6MjEwNDM1OTQ1NH0.sQCF41lP-3od6FwEK9-LTGy9D74ZEXgw3eOKeaA0woU';`
);

fs.writeFileSync('src/lib/supabase.ts', code);
console.log('Added fallback to supabase.ts');
