const fs = require('fs');
const schema = fs.readFileSync('supabase_schema.sql', 'utf-8');
let modal = fs.readFileSync('src/components/SupabaseConfigModal.tsx', 'utf-8');

const prefix = 'const sqlContent = `';
const suffix = '`;\n\n    navigator.clipboard.writeText(sqlContent);';

const startIndex = modal.indexOf(prefix);
const endIndex = modal.indexOf(suffix);

if (startIndex !== -1 && endIndex !== -1) {
    // Escape backticks and dollar signs if needed, though raw string might be fine since we use backticks
    // Let's escape backticks and dollar signs just in case
    const escapedSchema = schema.replace(/`/g, '\\`').replace(/\$/g, '\\$');
    
    const newModal = modal.substring(0, startIndex) + 
                     prefix + escapedSchema + suffix +
                     modal.substring(endIndex + suffix.length);
                     
    fs.writeFileSync('src/components/SupabaseConfigModal.tsx', newModal);
    console.log('Replaced sqlContent inside SupabaseConfigModal.tsx');
} else {
    console.log('Could not find the target block');
}
