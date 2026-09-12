const fs = require('fs');
let code = fs.readFileSync('src/components/GuruPanel.tsx', 'utf-8');

const targetImport = "import React, { useState } from 'react';";
const replaceImport = "import React, { useState } from 'react';\nimport { motion, AnimatePresence } from 'motion/react';";

if (!code.includes("from 'motion/react'")) {
    code = code.replace(targetImport, replaceImport);
}

fs.writeFileSync('src/components/GuruPanel.tsx', code);
