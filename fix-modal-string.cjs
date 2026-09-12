const fs = require('fs');

const sql = fs.readFileSync('supabase_schema.sql', 'utf-8');

let code = fs.readFileSync('src/components/SupabaseConfigModal.tsx', 'utf-8');

// The file likely has something like `const SUPABASE_SCHEMA = \`...\`;`
// Let's replace whatever is inside those backticks if we can find it reliably.
// We can use a regex to replace everything between `const SUPABASE_SCHEMA = \`` and `\`;`

code = code.replace(/const SUPABASE_SCHEMA = \`([\s\S]*?)\`;/, "const SUPABASE_SCHEMA = `" + sql.replace(/\`/g, "\\`").replace(/\$/g, "\\$") + "`;");

fs.writeFileSync('src/components/SupabaseConfigModal.tsx', code);
console.log('Updated SupabaseConfigModal.tsx with latest schema');

