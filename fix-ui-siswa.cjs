const fs = require('fs');
let code = fs.readFileSync('src/components/SiswaPanel.tsx', 'utf-8');

const targetGrading = `      } else if (q.type === 'essay') {
        // Default partial credit for submitted essays until teacher manual rubric review
        if (String(studentAns).trim().length > 10) {
          earnedPoints += Math.round(q.points * 0.8);
        }
      }`;
const replaceGrading = `      } else if (q.type === 'essay') {
        // Default partial credit for submitted essays until teacher manual rubric review
        if (String(studentAns).trim().length > 10) {
          earnedPoints += Math.round(q.points * 0.8);
        }
      } else if (q.type === 'isi_kosong') {
        if (q.fillInTheBlanks && Array.isArray(studentAns)) {
          let correctCount = 0;
          q.fillInTheBlanks.forEach((ans, idx) => {
            if (String(studentAns[idx]).toLowerCase().trim() === String(ans).toLowerCase().trim()) correctCount++;
          });
          const fraction = correctCount / q.fillInTheBlanks.length;
          earnedPoints += Math.round(q.points * fraction);
        }
      } else if (q.type === 'susun_kata') {
        if (q.correctOrder && Array.isArray(studentAns)) {
          let correctCount = 0;
          q.correctOrder.forEach((word, idx) => {
            if (studentAns[idx] === word) correctCount++;
          });
          const fraction = correctCount / q.correctOrder.length;
          earnedPoints += Math.round(q.points * fraction);
        }
      }`;
code = code.replace(targetGrading, replaceGrading);
fs.writeFileSync('src/components/SiswaPanel.tsx', code);
