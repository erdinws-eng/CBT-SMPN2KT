const fs = require('fs');
let code = fs.readFileSync('src/components/SiswaPanel.tsx', 'utf-8');

const startMarker = '{/* Himpunan Pasangan Terurut Output */}';
const startIdx = code.indexOf(startMarker);

if (startIdx !== -1) {
    const endMarker = '</div>\n              </div>\n            )}\n\n            {/* TYPE 7: ISI KOSONG */}';
    // wait, I replaced TYPE 6 with TYPE 7, 8, 6. So TYPE 7 should be there.
    const type7Idx = code.indexOf('{/* TYPE 7: ISI KOSONG */}');
    console.log(startIdx, type7Idx);
    
    // the end of Menjodohkan block is `</div>\n              </div>\n            )}`
    const blockEnd = `              </div>\n            )}`;
    const endIdx = code.lastIndexOf(blockEnd, type7Idx);
    if(endIdx !== -1) {
        code = code.substring(0, startIdx) + code.substring(endIdx);
        fs.writeFileSync('src/components/SiswaPanel.tsx', code);
        console.log("Removed output block 2");
    }
}

