const fs = require('fs');
let code = fs.readFileSync('src/components/GuruPanel.tsx', 'utf-8');

// I also need to update the calculateQuestionScore function in GuruPanel.tsx to grade the new types.
const target = `    } else if (q.type === 'essay') {
      if (String(studentAns).trim().length > 10) return Math.round(q.points * 0.8);
    }`;
const replacement = `    } else if (q.type === 'essay') {
      if (String(studentAns).trim().length > 10) return Math.round(q.points * 0.8);
    } else if (q.type === 'isi_kosong') {
      if (q.fillInTheBlanks && Array.isArray(studentAns)) {
        let correctCount = 0;
        q.fillInTheBlanks.forEach((ans, idx) => {
          if (String(studentAns[idx]).toLowerCase().trim() === String(ans).toLowerCase().trim()) correctCount++;
        });
        return Math.round(q.points * (correctCount / q.fillInTheBlanks.length));
      }
    } else if (q.type === 'susun_kata') {
      if (q.correctOrder && Array.isArray(studentAns)) {
        let correctCount = 0;
        q.correctOrder.forEach((word, idx) => {
          if (studentAns[idx] === word) correctCount++;
        });
        return Math.round(q.points * (correctCount / q.correctOrder.length));
      }
    }`;
code = code.replace(target, replacement);

fs.writeFileSync('src/components/GuruPanel.tsx', code);
