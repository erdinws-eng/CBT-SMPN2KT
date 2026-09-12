const fs = require('fs');
let code = fs.readFileSync('src/components/GuruPanel.tsx', 'utf-8');

const targetState = `  // Search & Filter State`;
const replaceState = `  // Riwayat Siswa State
  const [searchAttemptQuery, setSearchAttemptQuery] = useState('');
  const [selectedClassFilter, setSelectedClassFilter] = useState('');

  // Search & Filter State`;

if (!code.includes('searchAttemptQuery')) {
    code = code.replace(targetState, replaceState);
} else if (!code.includes('const [searchAttemptQuery')) {
    code = code.replace(targetState, replaceState);
}

fs.writeFileSync('src/components/GuruPanel.tsx', code);
