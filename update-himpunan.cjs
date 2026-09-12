const fs = require('fs');
let code = fs.readFileSync('src/components/SiswaPanel.tsx', 'utf-8');

// Remove Himpunan Pasangan Terurut Output
const startMarker = '{/* Himpunan Pasangan Terurut Output */}';
const endMarker = '{/* TYPE 7: ISI KOSONG */}';

const startIdx = code.indexOf(startMarker);
const endIdx = code.indexOf(endMarker);

if (startIdx !== -1 && endIdx !== -1) {
    // We want to keep the closing divs of the Menjodohkan block.
    // Let's see what is between startIdx and endIdx.
    // It's the whole output div, then `</div>\n              </div>\n            )}\n\n            {/* TYPE 7: ISI KOSONG */}`
    
    // Instead of substring, I'll just find the exact block end.
}

// Remove instructions box
const instStart = `<div className="p-3 bg-indigo-50/80 border border-indigo-200 rounded-2xl flex items-start gap-2.5">`;
const instEnd = `</div>\n                </div>\n\n                {/* Status Pemetaan Sedang Aktif */}`;

const iStartIdx = code.indexOf(instStart);
const iEndIdx = code.indexOf(instEnd);
if (iStartIdx !== -1 && iEndIdx !== -1) {
    code = code.substring(0, iStartIdx) + code.substring(iEndIdx + instEnd.length - `\n\n                {/* Status Pemetaan Sedang Aktif */}`.length);
}

// Replace truncate on Himpunan B
const truncateTarget = `<span className="font-semibold text-xs truncate" title={targetMatch}>`;
const truncateReplace = `<span className="font-semibold text-xs" title={targetMatch}>`;
code = code.replace(truncateTarget, truncateReplace);

// Remove min-w-0 on Himpunan B item container
const minTarget = `<div className="flex items-center gap-2 min-w-0 z-10">`;
const minReplace = `<div className="flex items-center gap-2 z-10">`;
code = code.replace(minTarget, minReplace);

fs.writeFileSync('src/components/SiswaPanel.tsx', code);
