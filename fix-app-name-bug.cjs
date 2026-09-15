const fs = require('fs');
let code = fs.readFileSync('src/services/supabaseService.ts', 'utf-8');

code = code.replace(/app_name: data\.app_name \|\| 'SMART CBT PRO',/g, "appName: 'SMART CBT PRO',");
code = code.replace(/app_name: settings\.appName \|\| 'SMART CBT PRO',/g, "");

fs.writeFileSync('src/services/supabaseService.ts', code);
console.log('Fixed app_name bug in supabaseService.ts');
