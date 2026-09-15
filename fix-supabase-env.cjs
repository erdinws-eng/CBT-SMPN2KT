const fs = require('fs');
let code = fs.readFileSync('src/lib/supabase.ts', 'utf-8');

code = code.replace(/const metaEnv = \(import\.meta as any\)\?\.env \|\| \{\};\s*const envUrl = metaEnv\.VITE_SUPABASE_URL \|\| '';\s*const envKey = metaEnv\.VITE_SUPABASE_ANON_KEY \|\| '';/g, 
`const envUrl = (import.meta as any).env.VITE_SUPABASE_URL || '';
  const envKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY || '';`);

fs.writeFileSync('src/lib/supabase.ts', code);
console.log('Fixed env variable access for Vite static replacement.');
