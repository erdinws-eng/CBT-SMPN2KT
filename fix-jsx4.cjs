const fs = require('fs');
let code = fs.readFileSync('src/components/SiswaPanel.tsx', 'utf-8');

code = code.replace("</Xwrapper>\\n              </div>\\n            )}", "</Xwrapper>\n              </div>\n            )}");

fs.writeFileSync('src/components/SiswaPanel.tsx', code);
