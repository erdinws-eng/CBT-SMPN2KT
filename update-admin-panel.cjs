const fs = require('fs');
let code = fs.readFileSync('src/components/AdminPanel.tsx', 'utf-8');

if (!code.includes("import { motion, AnimatePresence }")) {
    code = code.replace("import React, { useState, useEffect } from 'react';", "import React, { useState, useEffect } from 'react';\nimport { motion, AnimatePresence } from 'motion/react';");
}

// Students
code = code.replace(
    `                <tbody className="divide-y divide-slate-100">
                  {filteredStudents.length === 0 ? (`,
    `                <tbody className="divide-y divide-slate-100">
                  <AnimatePresence mode="popLayout" initial={false}>
                  {filteredStudents.length === 0 ? (`
);
code = code.replace(
    `                  ) : (
                    filteredStudents.map((s, idx) => (
                      <tr key={s.id} className="hover:bg-slate-50 transition">`,
    `                  ) : (
                    filteredStudents.map((s, idx) => (
                      <motion.tr layout initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -10, backgroundColor: '#fecaca' }} transition={{ duration: 0.2 }} key={s.id} className="hover:bg-slate-50 transition">`
);
code = code.replace(
    `                        </td>
                      </tr>
                    ))
                  )}
                </tbody>`,
    `                        </td>
                      </motion.tr>
                    ))
                  )}
                  </AnimatePresence>
                </tbody>`
);

// Teachers
code = code.replace(
    `                <tbody className="divide-y divide-slate-100">
                  {filteredTeachers.map((t, idx) => {`,
    `                <tbody className="divide-y divide-slate-100">
                  <AnimatePresence mode="popLayout" initial={false}>
                  {filteredTeachers.map((t, idx) => {`
);
code = code.replace(
    `                    return (
                      <tr key={t.id} className="hover:bg-slate-50 transition">`,
    `                    return (
                      <motion.tr layout initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -10, backgroundColor: '#fecaca' }} transition={{ duration: 0.2 }} key={t.id} className="hover:bg-slate-50 transition">`
);
code = code.replace(
    `                        </td>
                      </tr>
                    );
                  })}
                </tbody>`,
    `                        </td>
                      </motion.tr>
                    );
                  })}
                  </AnimatePresence>
                </tbody>`
);

// Subjects
code = code.replace(
    `                <tbody className="divide-y divide-slate-100">
                  {filteredSubjects.map((m, idx) => (
                    <tr key={m.id} className="hover:bg-slate-50 transition">`,
    `                <tbody className="divide-y divide-slate-100">
                  <AnimatePresence mode="popLayout" initial={false}>
                  {filteredSubjects.map((m, idx) => (
                    <motion.tr layout initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -10, backgroundColor: '#fecaca' }} transition={{ duration: 0.2 }} key={m.id} className="hover:bg-slate-50 transition">`
);
code = code.replace(
    `                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>`,
    `                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                  </AnimatePresence>
                </tbody>`
);

fs.writeFileSync('src/components/AdminPanel.tsx', code);
