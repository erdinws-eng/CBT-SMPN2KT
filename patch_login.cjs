const fs = require('fs');
let code = fs.readFileSync('src/components/LoginView.tsx', 'utf-8');

const targetStr = `© {new Date().getFullYear()} {settings.schoolName || 'SMP NEGERI 1 CERDAS MANDIRI'} • Sistem CBT`;
const replaceStr = `© {new Date().getFullYear()} {settings.schoolName || 'SMP NEGERI 1 CERDAS MANDIRI'} • Sistem CBT
        {onOpenSupabaseModal && (
          <div className="mt-2">
            <button 
              onClick={onOpenSupabaseModal}
              className="text-indigo-400/70 hover:text-indigo-400 transition cursor-pointer"
            >
              Konfigurasi Database (Supabase)
            </button>
          </div>
        )}`;

if (code.includes(targetStr)) {
    code = code.replace(targetStr, replaceStr);
    fs.writeFileSync('src/components/LoginView.tsx', code);
    console.log('Patched LoginView');
} else {
    console.log('Failed to patch LoginView');
}
