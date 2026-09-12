const fs = require('fs');
let code = fs.readFileSync('src/components/LoginView.tsx', 'utf-8');

const targetProps = `export default function LoginView({
  users,
  onLoginSuccess,
  settings,
}: LoginViewProps) {`;

const replaceProps = `export default function LoginView({
  users,
  onLoginSuccess,
  settings,
  onOpenSupabaseModal,
}: LoginViewProps) {`;

if (code.includes(targetProps)) {
    code = code.replace(targetProps, replaceProps);
    fs.writeFileSync('src/components/LoginView.tsx', code);
    console.log('Fixed props in LoginView.tsx');
} else {
    console.log('Target not found in LoginView.tsx');
}
