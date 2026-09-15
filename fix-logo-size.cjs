const fs = require('fs');
let code = fs.readFileSync('src/components/RekapPrintModal.tsx', 'utf-8');

code = code.replace(
  /<div className="w-20 h-20 shrink-0 flex items-center justify-center">/,
  '<div className="w-24 sm:w-28 h-24 sm:h-28 shrink-0 flex items-center justify-center">'
);

fs.writeFileSync('src/components/RekapPrintModal.tsx', code);
console.log('Updated RekapPrintModal logo size');
