const fs = require('fs');
let code = fs.readFileSync('src/lib/supabase.ts', 'utf-8');
code = code.replace("const envUrl = (import.meta as any).env.VITE_SUPABASE_URL || '';", "const envUrl = import.meta.env.VITE_SUPABASE_URL || '';");
code = code.replace("const envKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY || '';", "const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';");
fs.writeFileSync('src/lib/supabase.ts', code);
console.log('Fixed supabase.ts import.meta.env');
