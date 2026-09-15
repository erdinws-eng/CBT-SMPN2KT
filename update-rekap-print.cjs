const fs = require('fs');
let code = fs.readFileSync('src/components/RekapPrintModal.tsx', 'utf-8');

const regexKop = /<div className="flex-1 text-center">\s*<h2 className="text-lg sm:text-xl font-black uppercase tracking-wider text-slate-900">\s*PEMERINTAH KOTA \/ KABUPATEN PENDIDIKAN\s*<\/h2>\s*<h1 className="text-xl sm:text-2xl font-black uppercase tracking-wide text-slate-900">\s*\{settings\.schoolName\}\s*<\/h1>/;

const replacementKop = `<div className="flex-1 text-center">
              <p className="text-sm font-bold uppercase tracking-wide text-slate-900 mb-0.5">
                {settings.dinasName || 'DINAS PENDIDIKAN DAN KEBUDAYAAN'}
              </p>
              <p className="text-sm font-bold uppercase tracking-wide text-slate-900 mb-1">
                {settings.kabupatenName || 'PEMERINTAH KABUPATEN KOTABARU'}
              </p>
              <h2 className="text-xl sm:text-2xl font-black uppercase tracking-wide text-slate-900">
                {settings.schoolName}
              </h2>`;

code = code.replace(regexKop, replacementKop);

const regexSig = /\{settings\.schoolCity\},\{' '\}\s*\{new Date\(\)\.toLocaleDateString\('id-ID', \{/;

const replacementSig = `{settings.signatureLocation || settings.schoolCity},{' '}
                {new Date().toLocaleDateString('id-ID', {`;

code = code.replace(regexSig, replacementSig);

fs.writeFileSync('src/components/RekapPrintModal.tsx', code);
console.log('Updated RekapPrintModal kop surat and signature location');
