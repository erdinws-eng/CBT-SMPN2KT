const fs = require('fs');
let code = fs.readFileSync('src/components/GuruPanel.tsx', 'utf-8');

code = code.replace(
  /\{subjects\.map\(\(s\) => \(\s*<option key=\{s\.id\} value=\{s\.name\}>\s*\{s\.name\}\s*<\/option>\s*\)\)\}/g,
  `{teacherSubjects.map((s) => (
                      <option key={s.id} value={s.name}>
                        {s.name}
                      </option>
                    ))}`
);

fs.writeFileSync('src/components/GuruPanel.tsx', code);
console.log('Patched GuruPanel.tsx AI Subject');
