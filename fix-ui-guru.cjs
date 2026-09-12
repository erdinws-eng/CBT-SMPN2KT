const fs = require('fs');
let code = fs.readFileSync('src/components/GuruPanel.tsx', 'utf-8');

const target = `                  <textarea
                    rows={3}
                    placeholder="Ketik kata-kata dipisahkan dengan enter atau spasi (Misal: Ibu pergi ke pasar)"
                    value={newQuestionCorrectOrder.join(' ')}
                    onChange={(e) => {
                       const words = e.target.value.split(/\\s+/).filter(Boolean);
                       setNewQuestionCorrectOrder(words);
                       setNewQuestionJumbledWords([...words].sort(() => Math.random() - 0.5));
                    }}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl"
                  />`;
const replacement = `                  <textarea
                    rows={3}
                    placeholder="Ketik kata-kata dipisahkan dengan enter atau spasi (Misal: Ibu pergi ke pasar)"
                    onChange={(e) => {
                       const words = e.target.value.split(/\\s+/).filter(Boolean);
                       setNewQuestionCorrectOrder(words);
                       setNewQuestionJumbledWords([...words].sort(() => Math.random() - 0.5));
                    }}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl"
                  />`;
code = code.replace(target, replacement);
fs.writeFileSync('src/components/GuruPanel.tsx', code);
