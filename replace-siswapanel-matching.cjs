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

// Target 2: Remove Himpunan Pasangan Terurut Output completely
// Find the exact block we edited last time
const target2Start = `                {/* Himpunan Pasangan Terurut Output */}
                <div className="p-3.5 bg-slate-100/80 rounded-2xl border border-slate-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono font-bold text-xs text-slate-800">
                      Himpunan Pasangan Terurut: f = &#123; (a, b) &#125;
                    </span>`;

// Let's just remove the entire div, so I'll find its start and end. It starts at `{/* Himpunan Pasangan Terurut Output */}`
// and ends right before `</div>\n              </div>\n            )}` 
const blockStart = code.indexOf(`{/* Himpunan Pasangan Terurut Output */}`);
if(blockStart !== -1) {
    const nextBlockStart = code.indexOf(`            {/* TYPE 6: BENAR DAN SALAH */}`, blockStart);
    // Find the end of the matching div. It's the `</div>` just before `</div>\n            )}` that precedes TYPE 6.
    // Let's just do a string substring replacement.
    const beforeBlock = code.substring(0, blockStart);
    // The closing of the menhjdohkan block is:
    // `                  </div>\n                </div>\n              </div>\n            )}` 
    // Wait, earlier we had `<Xwrapper>...</Xwrapper>` wrapping the grid and arrows, then `{/* Himpunan Pasangan... */}`.
    // Let's see exactly what's at the end of menhjdohkan.
}
