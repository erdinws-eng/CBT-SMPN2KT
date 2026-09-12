const fs = require('fs');
let code = fs.readFileSync('src/components/SiswaPanel.tsx', 'utf-8');

const startMarker = '{/* Himpunan Pasangan Terurut Output */}';
const startIdx = code.indexOf(startMarker);

if (startIdx !== -1) {
    const endMarker = '</div>\n              </div>\n            )}\n\n            {/* TYPE 7: ISI KOSONG */}';
    const endIdx = code.indexOf(endMarker, startIdx);
    
    if (endIdx !== -1) {
        code = code.substring(0, startIdx) + endMarker;
        fs.writeFileSync('src/components/SiswaPanel.tsx', code);
        console.log("Removed output block");
    } else {
        console.log("End marker not found");
    }
} else {
    console.log("Start marker not found");
}

