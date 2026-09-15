const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

// We need to add an isLoaded flag so we don't sync default empty states to Supabase before loading is done.
if (!code.includes('isDataLoaded')) {
  code = code.replace(
    /const \[isSupabaseModalOpen, setIsSupabaseModalOpen\] = useState<boolean>\(false\);/,
    `const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState<boolean>(false);\n  const [isDataLoaded, setIsDataLoaded] = useState<boolean>(false);`
  );

  code = code.replace(
    /if \(sbAttempts\) setAttempts\(sbAttempts\);\n    } catch \(err\) {/,
    `if (sbAttempts) setAttempts(sbAttempts);\n      setIsDataLoaded(true);\n    } catch (err) {`
  );

  // For each useEffect that syncs:
  const syncEffects = [
    { state: 'users', service: 'saveUser', delete: 'deleteUser', ref: 'prevUsersRef' },
    { state: 'subjects', service: 'saveSubject', delete: 'deleteSubject', ref: 'prevSubjectsRef' },
    { state: 'exams', service: 'saveExam', delete: 'deleteExam', ref: 'prevExamsRef' },
    { state: 'attempts', service: 'saveExamAttempt', delete: 'deleteExamAttempt', ref: 'prevAttemptsRef' }
  ];

  for (const {state, service, delete: del, ref} of syncEffects) {
    const regex = new RegExp(`useEffect\\(\\(\\) => \\{\\s*save${state.charAt(0).toUpperCase() + state.slice(1)}\\(${state}\\);\\s*if \\(getSupabaseConfig\\(\\)\\.isConfigured\\) \\{[\\s\\S]*?\\}\\s*${ref}\\.current = ${state};\\s*\\}, \\\[${state}\\\]\\);`);
    const replacement = `useEffect(() => {
    save${state.charAt(0).toUpperCase() + state.slice(1)}(${state});
    if (getSupabaseConfig().isConfigured && isDataLoaded) {
      ${state}.forEach((item) => supabaseService.${service}(item));
      const currentIds = new Set(${state}.map(item => item.id));
      ${ref}.current.forEach(old => {
        if (!currentIds.has(old.id)) supabaseService.${del}(old.id);
      });
    }
    ${ref}.current = ${state};
  }, [${state}, isDataLoaded]);`;
    code = code.replace(regex, replacement);
  }
  
  // Settings
  code = code.replace(
    /useEffect\(\(\) => \{\s*saveSettings\(settings\);\s*if \(getSupabaseConfig\(\)\.isConfigured\) \{\s*supabaseService\.saveSchoolSettings\(settings\);\s*\}\s*\}, \[settings\]\);/,
    `useEffect(() => {
    saveSettings(settings);
    if (getSupabaseConfig().isConfigured && isDataLoaded) {
      supabaseService.saveSchoolSettings(settings);
    }
  }, [settings, isDataLoaded]);`
  );

  fs.writeFileSync('src/App.tsx', code);
  console.log('Fixed sync logic in App.tsx');
}
