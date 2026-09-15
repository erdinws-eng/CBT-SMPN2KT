const fs = require('fs');
let code = fs.readFileSync('src/services/supabaseService.ts', 'utf-8');

code = code.replace(
  /school_npsn: settings\.schoolNpsn,/g,
  `school_npsn: settings.schoolNpsn || '',`
).replace(
  /school_address: settings\.schoolAddress,/g,
  `school_address: settings.schoolAddress || '',`
).replace(
  /school_city: settings\.schoolCity,/g,
  `school_city: settings.schoolCity || '',`
).replace(
  /principal_name: settings\.principalName,/g,
  `principal_name: settings.principalName || '',`
).replace(
  /principal_nip: settings\.principalNip,/g,
  `principal_nip: settings.principalNip || '',`
);

fs.writeFileSync('src/services/supabaseService.ts', code);
console.log('Fixed undefined properties in saveSchoolSettings');
