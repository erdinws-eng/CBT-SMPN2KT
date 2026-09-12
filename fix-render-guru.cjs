const fs = require('fs');
let code = fs.readFileSync('src/components/GuruPanel.tsx', 'utf-8');

const target = `{q.matchingPairs && renderAnswer(q.matchingPairs.map(p => \`\${p.premise} -> \${p.match}\`))}`;
const replacement = `{q.matchingPairs && renderAnswer(q.matchingPairs.map(p => \`\${p.premise} -> \${p.match}\`))}
                              {q.fillInTheBlanks && renderAnswer(q.fillInTheBlanks)}
                              {q.correctOrder && renderAnswer(q.correctOrder.join(' '))}
`;

code = code.replace(target, replacement);

// And when student answer is an array for 'susun_kata', we probably want to join it with spaces instead of a list? 
// No, the default array render is a list. That's fine, or we can just join it.
const arrayRenderTarget = `                    if (Array.isArray(ans)) {
                      return (
                        <ul className="list-none space-y-1">
                          {ans.map((item, i) => <li key={i}>{String(item)}</li>)}
                        </ul>
                      );
                    }`;
const arrayRenderReplacement = `                    if (Array.isArray(ans)) {
                      if (qType === 'susun_kata') {
                        return <span>{ans.join(' ')}</span>;
                      }
                      return (
                        <ul className="list-none space-y-1">
                          {ans.map((item, i) => <li key={i}>{String(item)}</li>)}
                        </ul>
                      );
                    }`;
code = code.replace(arrayRenderTarget, arrayRenderReplacement);

fs.writeFileSync('src/components/GuruPanel.tsx', code);
