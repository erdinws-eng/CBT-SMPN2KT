const fs = require('fs');
let code = fs.readFileSync('src/lib/storage.ts', 'utf-8');

code = code.replace(
  /logoUrl: 'https:\/\/images\.unsplash\.com\/photo-1546410531-bb4caa6b424d\?w=160&auto=format&fit=crop&q=80',/,
  "logoUrl: 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=160&auto=format&fit=crop&q=80',\n  dinasName: 'PEMERINTAH KABUPATEN KOTABARU',\n  kabupatenName: 'DINAS PENDIDIKAN DAN KEBUDAYAAN',\n  signatureLocation: 'Kotabaru',"
);

fs.writeFileSync('src/lib/storage.ts', code);
console.log('Updated storage.ts defaults');
