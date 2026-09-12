const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

if (!code.includes('useRef')) {
    code = code.replace("import { useState, useEffect, useCallback } from 'react';", "import { useState, useEffect, useCallback, useRef } from 'react';");
}

fs.writeFileSync('src/App.tsx', code);
