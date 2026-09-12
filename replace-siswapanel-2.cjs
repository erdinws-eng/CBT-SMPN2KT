const fs = require('fs');
let code = fs.readFileSync('src/components/SiswaPanel.tsx', 'utf-8');

// Target 1: Remove "Pemetaan Relasi Fungsi Matematika (f: A ➔ B)" heading block
const matchTarget1 = `<div className="w-7 h-7 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 shadow-xs">
                    f
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-indigo-950 uppercase tracking-wide">
                      Pemetaan Relasi Fungsi Matematika (f: A ➔ B)
                    </h4>
                    <p className="text-[11px] text-indigo-800 leading-relaxed mt-0.5">`;

const replaceTarget1 = `<div>
                    <p className="text-[11px] text-indigo-800 leading-relaxed mt-0.5">`;

code = code.replace(matchTarget1, replaceTarget1);

// Target 2: Remove Himpunan Pasangan Terurut Output
const target2Start = `                {/* Himpunan Pasangan Terurut Output */}`;
const target2End = `              </div>\n            )}\n\n            {/* TYPE 6: BENAR DAN SALAH */}`;

const startIdx2 = code.indexOf(target2Start);
const endIdx2 = code.indexOf(target2End);
if(startIdx2 !== -1 && endIdx2 !== -1) {
    code = code.substring(0, startIdx2) + `              </div>\n            )}\n\n            {/* TYPE 6: BENAR DAN SALAH */}` + code.substring(endIdx2 + target2End.length);
}

// Target 3: Remove "Tentukan apakah setiap pernyataan berikut bernilai "Benar" atau "Salah"."
const target3 = `                <p className="text-xs text-indigo-600 font-semibold mb-2">
                  * Tentukan apakah setiap pernyataan berikut bernilai "Benar" atau "Salah".
                </p>`;
code = code.replace(target3, '');

fs.writeFileSync('src/components/SiswaPanel.tsx', code);
console.log('done');
