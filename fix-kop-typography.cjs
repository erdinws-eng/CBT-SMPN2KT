const fs = require('fs');
let code = fs.readFileSync('src/components/RekapPrintModal.tsx', 'utf-8');

const regex = /<p className="text-sm font-bold uppercase tracking-wide text-slate-900 mb-0\.5">\s*\{settings\.dinasName \|\| 'DINAS PENDIDIKAN DAN KEBUDAYAAN'\}\s*<\/p>\s*<p className="text-sm font-bold uppercase tracking-wide text-slate-900 mb-1">\s*\{settings\.kabupatenName \|\| 'PEMERINTAH KABUPATEN KOTABARU'\}\s*<\/p>\s*<h2 className="text-xl sm:text-2xl font-black uppercase tracking-wide text-slate-900">\s*\{settings\.schoolName\}\s*<\/h2>\s*<p className="text-xs text-slate-600 font-medium">\s*\{settings\.schoolAddress\} • \{settings\.schoolCity\} • NPSN: \{settings\.schoolNpsn\}\s*<\/p>\s*<p className="text-xs text-slate-600 font-medium">/m;

const replacement = `<p className="text-lg sm:text-xl font-black uppercase tracking-wider text-slate-900 mb-0.5">
                {settings.dinasName || 'DINAS PENDIDIKAN DAN KEBUDAYAAN'}
              </p>
              <p className="text-xl sm:text-2xl font-black uppercase tracking-wider text-slate-900 mb-1">
                {settings.kabupatenName || 'PEMERINTAH KABUPATEN KOTABARU'}
              </p>
              <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-wider text-slate-900 mb-1.5">
                {settings.schoolName}
              </h2>
              <p className="text-sm text-slate-800 font-semibold mb-0.5">
                {settings.schoolAddress} • {settings.schoolCity} • NPSN: {settings.schoolNpsn}
              </p>
              <p className="text-sm text-slate-800 font-semibold">`;

if (regex.test(code)) {
  code = code.replace(regex, replacement);
  fs.writeFileSync('src/components/RekapPrintModal.tsx', code);
  console.log('Updated RekapPrintModal kop surat typography');
} else {
  console.log('Regex did not match');
}
