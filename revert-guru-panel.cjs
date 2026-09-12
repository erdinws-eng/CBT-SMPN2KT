const fs = require('fs');
let code = fs.readFileSync('src/components/GuruPanel.tsx', 'utf-8');

// Reverse target 1 & 3
code = code.replace('<AnimatePresence mode="popLayout" initial={false}>\n              {exams.map((exam) => {', '{exams.map((exam) => {');
code = code.replace(/<motion\.div layout initial=\{\{ opacity: 0, scale: 0\.95 \}\} animate=\{\{ opacity: 1, scale: 1 \}\} exit=\{\{ opacity: 0, scale: 0\.9, backgroundColor: "#fee2e2" \}\} transition=\{\{ duration: 0\.2 \}\}\s*key=\{exam\.id\}/g, '<div\n                    key={exam.id}');
code = code.replace('</motion.div>\n                );\n              })}\n              </AnimatePresence>', '</div>\n                );\n              })}');

// Reverse target 4 & 6
code = code.replace('<AnimatePresence mode="popLayout" initial={false}>\n                {attemptsForSelectedExam.length === 0 ? (', '{attemptsForSelectedExam.length === 0 ? (');
code = code.replace(/<motion\.tr layout initial=\{\{ opacity: 0, y: -10 \}\} animate=\{\{ opacity: 1, y: 0 \}\} exit=\{\{ opacity: 0, x: -10, backgroundColor: "#fecaca" \}\} transition=\{\{ duration: 0\.2 \}\} key=\{att\.id\} className="hover:bg-slate-50 transition">/g, '<tr key={att.id} className="hover:bg-slate-50 transition">');
code = code.replace('</motion.tr>\n                  ))\n                )}\n                </AnimatePresence>', '</tr>\n                  ))\n                )}');

// If there's any floating </AnimatePresence> or <AnimatePresence...
code = code.replace(/<AnimatePresence[^>]*>/g, '');
code = code.replace(/<\/AnimatePresence>/g, '');
code = code.replace(/<motion\.tr[^>]*>/g, '<tr key={att.id} className="hover:bg-slate-50 transition">');
code = code.replace(/<\/motion\.tr>/g, '</tr>');

code = code.replace(/<motion\.div[^>]*>/g, '<div key={exam.id} className={`bg-white rounded-2xl border p-5 shadow-2xs transition flex flex-col justify-between ${exam.id === selectedExamId ? \'border-indigo-500 ring-2 ring-indigo-100\' : \'border-slate-200\'}`}>');
code = code.replace(/<\/motion\.div>/g, '</div>');

fs.writeFileSync('src/components/GuruPanel.tsx', code);
