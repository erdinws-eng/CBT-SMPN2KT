const fs = require('fs');
let code = fs.readFileSync('src/components/RekapPrintModal.tsx', 'utf-8');

// Add teacherNip to props interface
code = code.replace(
  /settings: SchoolSettings;\n}/,
  'settings: SchoolSettings;\n  teacherNip?: string;\n}'
);

// Add teacherNip to component parameters
code = code.replace(
  /  settings,\n}: RekapPrintModalProps\) {/,
  '  settings,\n  teacherNip,\n}: RekapPrintModalProps) {'
);

// Update NIP placeholder
code = code.replace(
  /<p className="text-slate-500 font-mono">NIP\. -<\/p>/,
  '<p className="text-slate-500 font-mono">NIP. {teacherNip || "-"}</p>'
);

fs.writeFileSync('src/components/RekapPrintModal.tsx', code);
console.log('Added teacherNip to RekapPrintModal');
