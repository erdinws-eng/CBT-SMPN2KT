const fs = require('fs');
let code = fs.readFileSync('src/components/SiswaPanel.tsx', 'utf-8');

code = code.replace(/<\\/Xwrapper>\\s*<\\/div>\\s*<\\/div>\\s*\\)}/g, '</Xwrapper>\\n              </div>\\n            )}');

fs.writeFileSync('src/components/SiswaPanel.tsx', code);
