const fs = require('fs');
let code = fs.readFileSync('src/components/SiswaPanel.tsx', 'utf-8');

const target = `                </Xwrapper>
                </div>
              </div>
            )}`;
const replacement = `                </Xwrapper>
              </div>
            )}`;

code = code.replace(target, replacement);

fs.writeFileSync('src/components/SiswaPanel.tsx', code);
