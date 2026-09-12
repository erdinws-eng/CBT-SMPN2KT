import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Users,
  GraduationCap,
  BookOpen,
  Settings as SettingsIcon,
  Plus,
  Upload,
  Download,
  Trash2,
  Edit2,
  Search,
  CheckCircle,
  FileSpreadsheet,
  Building,
  UserPlus,
  AlertCircle,
  X,
  Lock,
  KeyRound,
  Check,
  Database,
  LayoutDashboard,
  Menu,
  LogOut,
  ShieldCheck,
  School,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Eye,
  EyeOff,
  Image as ImageIcon,
  UserCog,
  Save,
  Loader2,
  AlertTriangle,
} from 'lucide-react';
import { User, Subject, SchoolSettings } from '../types';
import { getSupabaseConfig } from '../lib/supabase';
import {
  exportSiswaToExcel,
  downloadTemplateSiswaExcel,
  parseSiswaExcel,
  exportGuruToExcel,
  downloadTemplateGuruExcel,
  parseGuruExcel,
  exportMapelToExcel,
  downloadTemplateMapelExcel,
  parseMapelExcel,
} from '../lib/excelExportImport';

interface AdminPanelProps {
  users: User[];
  subjects: Subject[];
  settings: SchoolSettings;
  currentUser?: User | null;
  onUpdateUsers: (users: User[]) => void;
  onUpdateCurrentUser?: (user: User) => void;
  onUpdateSubjects: (subjects: Subject[]) => void;
  onUpdateSettings: (settings: SchoolSettings) => void;
  onOpenSupabaseModal?: () => void;
  onLogout?: () => void;
}

export default function AdminPanel({
  users,
  subjects,
  settings,
  currentUser,
  onUpdateUsers,
  onUpdateCurrentUser,
  onUpdateSubjects,
  onUpdateSettings,
  onOpenSupabaseModal,
  onLogout,
}: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'siswa' | 'guru' | 'mapel' | 'settings'>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterClass, setFilterClass] = useState('all');

  // Modals state - Create
  const [isAddSiswaModalOpen, setIsAddSiswaModalOpen] = useState(false);
  const [isAddGuruModalOpen, setIsAddGuruModalOpen] = useState(false);
  const [isAddMapelModalOpen, setIsAddMapelModalOpen] = useState(false);

  // Modals state - Edit
  const [isEditSiswaModalOpen, setIsEditSiswaModalOpen] = useState(false);
  const [editingSiswa, setEditingSiswa] = useState<User | null>(null);

  const [isEditGuruModalOpen, setIsEditGuruModalOpen] = useState(false);
  const [editingGuru, setEditingGuru] = useState<User | null>(null);

  const [isEditMapelModalOpen, setIsEditMapelModalOpen] = useState(false);
  const [editingMapel, setEditingMapel] = useState<Subject | null>(null);

  // Form states for NEW entities
  const [newSiswa, setNewSiswa] = useState({
    name: '',
    nip_nisn: '',
    username: '',
    password: 'password123',
    classGrade: '8A',
    gender: 'L' as 'L' | 'P',
  });

  const [newGuru, setNewGuru] = useState({
    name: '',
    nip_nisn: '',
    username: '',
    password: 'password123',
    selectedSubjects: [] as string[],
  });

  const [newMapel, setNewMapel] = useState({
    code: '',
    name: '',
    gradeLevel: 'SMP Kelas 8',
    teacherName: '',
  });

  // Form states for EDITING entities
  const [editSiswaForm, setEditSiswaForm] = useState({
    name: '',
    nip_nisn: '',
    username: '',
    password: '',
    classGrade: '8A',
    gender: 'L' as 'L' | 'P',
  });

  const [editGuruForm, setEditGuruForm] = useState({
    name: '',
    nip_nisn: '',
    username: '',
    password: '',
    selectedSubjects: [] as string[],
  });

  const [editMapelForm, setEditMapelForm] = useState({
    code: '',
    name: '',
    gradeLevel: 'SMP Kelas 8',
    teacherName: '',
  });

  const [localSettings, setLocalSettings] = useState<SchoolSettings>({ ...settings });
  const [successMessage, setSuccessMessage] = useState('');

  // Admin Account Settings State
  const currentAdminUser = users.find((u) => u.role === 'admin') || currentUser || {
    id: 'user_admin_1',
    username: 'admin',
    password: 'admin123',
    name: 'Administrator',
    role: 'admin' as const,
    nip_nisn: '198205142006041008',
  };

  const [adminUsername, setAdminUsername] = useState(currentAdminUser.username || 'admin');
  const [adminPassword, setAdminPassword] = useState(currentAdminUser.password || 'admin123');
  const [adminConfirmPassword, setAdminConfirmPassword] = useState(currentAdminUser.password || 'admin123');
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [adminAccountMsg, setAdminAccountMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Logo upload state
  const [logoPreview, setLogoPreview] = useState<string>(settings.logoUrl || '');

  // Keep localSettings & logoPreview in sync if settings props update
  useEffect(() => {
    setLocalSettings({ ...settings });
    setLogoPreview(settings.logoUrl || '');
  }, [settings]);

  // Keep admin user form fields in sync if users update
  useEffect(() => {
    const foundAdmin = users.find((u) => u.role === 'admin') || currentUser;
    if (foundAdmin) {
      setAdminUsername(foundAdmin.username);
      setAdminPassword(foundAdmin.password || '');
      setAdminConfirmPassword(foundAdmin.password || '');
    }
  }, [users, currentUser]);

  // Loading States for Saving Data
  const [isSavingSiswa, setIsSavingSiswa] = useState(false);
  const [isSavingEditSiswa, setIsSavingEditSiswa] = useState(false);
  const [isSavingGuru, setIsSavingGuru] = useState(false);
  const [isSavingEditGuru, setIsSavingEditGuru] = useState(false);
  const [isSavingMapel, setIsSavingMapel] = useState(false);
  const [isSavingEditMapel, setIsSavingEditMapel] = useState(false);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [isSavingAdminAccount, setIsSavingAdminAccount] = useState(false);

  // In-App Delete Confirmation State (Bypasses iframe blocked window.confirm)
  interface DeleteConfirmState {
    isOpen: boolean;
    id: string;
    name: string;
    type: 'siswa' | 'guru' | 'mapel' | 'logo';
  }
  const [deleteConfirm, setDeleteConfirm] = useState<DeleteConfirmState>({
    isOpen: false,
    id: '',
    name: '',
    type: 'siswa',
  });

  // Floating Toast Notifications State
  interface ToastNotification {
    id: string;
    type: 'success' | 'delete' | 'error' | 'info';
    title: string;
    message: string;
  }
  const [toasts, setToasts] = useState<ToastNotification[]>([]);

  const showToast = (
    message: string,
    type: 'success' | 'delete' | 'error' | 'info' = 'success',
    title?: string
  ) => {
    const id = Date.now().toString() + Math.random().toString(36).substring(2, 7);
    const defaultTitle =
      type === 'delete' ? 'Data Dihapus' : type === 'error' ? 'Perhatian' : 'Berhasil Disimpan';
    const newToast: ToastNotification = {
      id,
      type,
      title: title || defaultTitle,
      message,
    };
    setToasts((prev) => [...prev, newToast]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  const showSuccess = (msg: string) => {
    setSuccessMessage(msg);
    showToast(msg, 'success');
    setTimeout(() => setSuccessMessage(''), 4000);
  };

  // Execution of in-app delete confirmation
  const executeDelete = () => {
    const { id, name, type } = deleteConfirm;
    if (type === 'siswa') {
      onUpdateUsers(users.filter((u) => u.id !== id));
      showToast(`Data siswa "${name}" berhasil dihapus dari sistem.`, 'delete');
    } else if (type === 'guru') {
      onUpdateUsers(users.filter((u) => u.id !== id));
      showToast(`Data guru "${name}" berhasil dihapus dari sistem.`, 'delete');
    } else if (type === 'mapel') {
      onUpdateSubjects(subjects.filter((s) => s.id !== id));
      showToast(`Mata pelajaran "${name}" berhasil dihapus.`, 'delete');
    } else if (type === 'logo') {
      setLogoPreview('');
      const updated = { ...localSettings, logoUrl: '' };
      setLocalSettings(updated);
      onUpdateSettings(updated);
      showToast('Logo resmi sekolah berhasil dihapus.', 'delete');
    }
    setDeleteConfirm({ isOpen: false, id: '', name: '', type: 'siswa' });
  };

  const students = users.filter((u) => u.role === 'siswa');
  const teachers = users.filter((u) => u.role === 'guru');

  // Filtered lists
  const filteredStudents = students.filter((s) => {
    const matchSearch =
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.nip_nisn.includes(searchTerm) ||
      s.username.toLowerCase().includes(searchTerm.toLowerCase());
    const matchClass = filterClass === 'all' || s.classGrade === filterClass;
    return matchSearch && matchClass;
  });

  const filteredTeachers = teachers.filter((t) => {
    const subjectsText = (t.subjectNames?.join(' ') || t.subjectName || '').toLowerCase();
    return (
      t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.nip_nisn.includes(searchTerm) ||
      t.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      subjectsText.includes(searchTerm.toLowerCase())
    );
  });

  const filteredSubjects = subjects.filter(
    (m) =>
      m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (m.teacherName && m.teacherName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // ==========================================
  // HANDLERS FOR SISWA (CRUD)
  // ==========================================
  const handleAddSiswa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSiswa.name || !newSiswa.nip_nisn) return;

    setIsSavingSiswa(true);
    await new Promise((r) => setTimeout(r, 600));

    const created: User = {
      id: 'user_siswa_' + Date.now(),
      name: newSiswa.name,
      nip_nisn: newSiswa.nip_nisn,
      username: newSiswa.username || `siswa_${newSiswa.nip_nisn}`,
      password: newSiswa.password || 'password123',
      role: 'siswa',
      classGrade: newSiswa.classGrade,
      gender: newSiswa.gender,
    };

    onUpdateUsers([...users, created]);
    setIsAddSiswaModalOpen(false);
    setIsSavingSiswa(false);
    setNewSiswa({
      name: '',
      nip_nisn: '',
      username: '',
      password: 'password123',
      classGrade: '8A',
      gender: 'L',
    });
    showToast(`Data siswa "${created.name}" berhasil ditambahkan!`, 'success');
  };

  const handleOpenEditSiswa = (siswa: User) => {
    setEditingSiswa(siswa);
    setEditSiswaForm({
      name: siswa.name,
      nip_nisn: siswa.nip_nisn,
      username: siswa.username,
      password: siswa.password || 'password123',
      classGrade: siswa.classGrade || '8A',
      gender: siswa.gender || 'L',
    });
    setIsEditSiswaModalOpen(true);
  };

  const handleSaveEditSiswa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSiswa) return;

    setIsSavingEditSiswa(true);
    await new Promise((r) => setTimeout(r, 600));

    const updated = users.map((u) => {
      if (u.id === editingSiswa.id) {
        return {
          ...u,
          name: editSiswaForm.name,
          nip_nisn: editSiswaForm.nip_nisn,
          username: editSiswaForm.username || `siswa_${editSiswaForm.nip_nisn}`,
          password: editSiswaForm.password || 'password123',
          classGrade: editSiswaForm.classGrade,
          gender: editSiswaForm.gender,
        };
      }
      return u;
    });

    onUpdateUsers(updated);
    setIsEditSiswaModalOpen(false);
    setIsSavingEditSiswa(false);
    setEditingSiswa(null);
    showToast(`Data siswa "${editSiswaForm.name}" berhasil diperbarui!`, 'success');
  };

  const handleDeleteUser = (userId: string, userName: string, role: 'siswa' | 'guru' = 'siswa') => {
    setDeleteConfirm({
      isOpen: true,
      id: userId,
      name: userName,
      type: role,
    });
  };

  const handleImportSiswaExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const imported = await parseSiswaExcel(file);
      if (imported.length === 0) {
        showToast('File Excel kosong atau format tidak sesuai template.', 'error');
        return;
      }
      onUpdateUsers([...users, ...imported]);
      showToast(`Berhasil mengimpor ${imported.length} data siswa via Excel (.xlsx)!`, 'success');
    } catch (err: any) {
      showToast('Gagal membaca file Excel: ' + (err?.message || 'Format tidak didukung'), 'error');
    }
    e.target.value = '';
  };

  // ==========================================
  // HANDLERS FOR GURU (CRUD + MULTI-MAPEL)
  // ==========================================
  const handleAddGuru = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGuru.name || !newGuru.nip_nisn) return;

    setIsSavingGuru(true);
    await new Promise((r) => setTimeout(r, 600));

    const selectedSubs = newGuru.selectedSubjects;
    const subjectDisplayName = selectedSubs.length > 0 ? selectedSubs.join(', ') : 'Umum';

    const created: User = {
      id: 'user_guru_' + Date.now(),
      name: newGuru.name,
      nip_nisn: newGuru.nip_nisn,
      username: newGuru.username || `guru_${newGuru.nip_nisn.slice(-4)}`,
      password: newGuru.password || 'password123',
      role: 'guru',
      subjectName: subjectDisplayName,
      subjectNames: selectedSubs,
    };

    onUpdateUsers([...users, created]);
    setIsAddGuruModalOpen(false);
    setIsSavingGuru(false);
    setNewGuru({
      name: '',
      nip_nisn: '',
      username: '',
      password: 'password123',
      selectedSubjects: [],
    });
    showToast(`Data guru "${created.name}" berhasil ditambahkan!`, 'success');
  };

  const handleOpenEditGuru = (guru: User) => {
    setEditingGuru(guru);
    // Parse existing subjects
    let existingSubs: string[] = [];
    if (guru.subjectNames && guru.subjectNames.length > 0) {
      existingSubs = [...guru.subjectNames];
    } else if (guru.subjectName) {
      existingSubs = guru.subjectName.split(',').map((s) => s.trim()).filter(Boolean);
    }

    setEditGuruForm({
      name: guru.name,
      nip_nisn: guru.nip_nisn,
      username: guru.username,
      password: guru.password || 'password123',
      selectedSubjects: existingSubs,
    });
    setIsEditGuruModalOpen(true);
  };

  const handleSaveEditGuru = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGuru) return;

    setIsSavingEditGuru(true);
    await new Promise((r) => setTimeout(r, 600));

    const selectedSubs = editGuruForm.selectedSubjects;
    const subjectDisplayName = selectedSubs.length > 0 ? selectedSubs.join(', ') : 'Umum';

    const updated = users.map((u) => {
      if (u.id === editingGuru.id) {
        return {
          ...u,
          name: editGuruForm.name,
          nip_nisn: editGuruForm.nip_nisn,
          username: editGuruForm.username || `guru_${editGuruForm.nip_nisn.slice(-4)}`,
          password: editGuruForm.password || 'password123',
          subjectName: subjectDisplayName,
          subjectNames: selectedSubs,
        };
      }
      return u;
    });

    onUpdateUsers(updated);
    setIsEditGuruModalOpen(false);
    setIsSavingEditGuru(false);
    setEditingGuru(null);
    showToast(`Data guru "${editGuruForm.name}" berhasil diperbarui!`, 'success');
  };

  const handleImportGuruExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const imported = await parseGuruExcel(file);
      onUpdateUsers([...users, ...imported]);
      showToast(`Berhasil mengimpor ${imported.length} data guru via Excel (.xlsx)!`, 'success');
    } catch (err: any) {
      showToast('Gagal membaca file Excel guru: ' + (err?.message || 'Format salah'), 'error');
    }
    e.target.value = '';
  };

  // ==========================================
  // HANDLERS FOR MAPEL (CRUD)
  // ==========================================
  const handleAddMapel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMapel.name || !newMapel.code) return;

    setIsSavingMapel(true);
    await new Promise((r) => setTimeout(r, 600));

    const created: Subject = {
      id: 'sub_' + Date.now(),
      code: newMapel.code.toUpperCase(),
      name: newMapel.name,
      gradeLevel: newMapel.gradeLevel,
      teacherName: newMapel.teacherName || undefined,
    };

    onUpdateSubjects([...subjects, created]);
    setIsAddMapelModalOpen(false);
    setIsSavingMapel(false);
    setNewMapel({ code: '', name: '', gradeLevel: 'SMP Kelas 8', teacherName: '' });
    showToast(`Mata pelajaran "${created.name}" berhasil ditambahkan!`, 'success');
  };

  const handleOpenEditMapel = (mapel: Subject) => {
    setEditingMapel(mapel);
    setEditMapelForm({
      code: mapel.code,
      name: mapel.name,
      gradeLevel: mapel.gradeLevel,
      teacherName: mapel.teacherName || '',
    });
    setIsEditMapelModalOpen(true);
  };

  const handleSaveEditMapel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMapel) return;

    setIsSavingEditMapel(true);
    await new Promise((r) => setTimeout(r, 600));

    const updated = subjects.map((m) => {
      if (m.id === editingMapel.id) {
        return {
          ...m,
          code: editMapelForm.code.toUpperCase(),
          name: editMapelForm.name,
          gradeLevel: editMapelForm.gradeLevel,
          teacherName: editMapelForm.teacherName || undefined,
        };
      }
      return m;
    });

    onUpdateSubjects(updated);
    setIsEditMapelModalOpen(false);
    setIsSavingEditMapel(false);
    setEditingMapel(null);
    showToast(`Mata pelajaran "${editMapelForm.name}" berhasil diperbarui!`, 'success');
  };

  const handleDeleteMapel = (subId: string, subName: string) => {
    setDeleteConfirm({
      isOpen: true,
      id: subId,
      name: subName,
      type: 'mapel',
    });
  };

  const handleImportMapelExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const imported = await parseMapelExcel(file);
      onUpdateSubjects([...subjects, ...imported]);
      showToast(`Berhasil mengimpor ${imported.length} mata pelajaran via Excel (.xlsx)!`, 'success');
    } catch (err: any) {
      showToast('Gagal membaca file Excel mapel: ' + (err?.message || 'Format salah'), 'error');
    }
    e.target.value = '';
  };

  // ==========================================
  // HANDLERS FOR SETTINGS, LOGO & ADMIN ACCOUNT
  // ==========================================
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingSettings(true);
    await new Promise((r) => setTimeout(r, 650));
    onUpdateSettings(localSettings);
    setIsSavingSettings(false);
    showToast('Profil sekolah dan pengaturan aplikasi berhasil disimpan!', 'success');
  };

  const handleSaveAdminAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminAccountMsg(null);

    const trimmedUsername = adminUsername.trim();
    if (!trimmedUsername) {
      setAdminAccountMsg({ type: 'error', text: 'Username admin tidak boleh kosong.' });
      showToast('Username admin tidak boleh kosong.', 'error');
      return;
    }
    if (!adminPassword || adminPassword.length < 4) {
      setAdminAccountMsg({ type: 'error', text: 'Password admin minimal harus 4 karakter.' });
      showToast('Password admin minimal harus 4 karakter.', 'error');
      return;
    }
    if (adminPassword !== adminConfirmPassword) {
      setAdminAccountMsg({ type: 'error', text: 'Konfirmasi password tidak sesuai dengan password baru.' });
      showToast('Konfirmasi password tidak cocok.', 'error');
      return;
    }

    // Check conflict with other users
    const conflict = users.some(
      (u) => u.username.toLowerCase() === trimmedUsername.toLowerCase() && u.id !== currentAdminUser.id
    );
    if (conflict) {
      setAdminAccountMsg({ type: 'error', text: 'Username tersebut sudah digunakan oleh akun lain.' });
      showToast('Username sudah dipakai akun lain.', 'error');
      return;
    }

    setIsSavingAdminAccount(true);
    await new Promise((r) => setTimeout(r, 650));

    // Update users array
    const updatedUsers = users.map((u) => {
      if (u.id === currentAdminUser.id || (u.role === 'admin' && !users.some((x) => x.id === currentAdminUser.id))) {
        return {
          ...u,
          username: trimmedUsername,
          password: adminPassword,
        };
      }
      return u;
    });

    if (!users.some((u) => u.role === 'admin')) {
      updatedUsers.push({
        id: currentAdminUser.id || 'user_admin_1',
        name: 'Administrator',
        role: 'admin',
        username: trimmedUsername,
        password: adminPassword,
        nip_nisn: '198205142006041008',
      });
    }

    onUpdateUsers(updatedUsers);
    if (onUpdateCurrentUser) {
      onUpdateCurrentUser({
        ...currentAdminUser,
        username: trimmedUsername,
        password: adminPassword,
      });
    }

    setIsSavingAdminAccount(false);
    setAdminAccountMsg({
      type: 'success',
      text: 'Akun Administrator (Username & Password) berhasil diperbarui dan disimpan!',
    });
    showToast('Kredensial Akun Administrator berhasil disimpan!', 'success');
    setTimeout(() => setAdminAccountMsg(null), 5000);
  };

  const handleLogoFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Mohon pilih file gambar (PNG, JPG, JPEG, SVG, WebP).');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      alert('Ukuran file logo terlalu besar. Maksimal 2 MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setLogoPreview(base64);
      const updated = { ...localSettings, logoUrl: base64 };
      setLocalSettings(updated);
      onUpdateSettings(updated);
      showSuccess('Logo resmi sekolah berhasil diunggah dan disimpan!');
    };
    reader.onerror = () => {
      alert('Gagal membaca file gambar logo.');
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleRemoveLogo = () => {
    setDeleteConfirm({
      isOpen: true,
      id: 'logo',
      name: 'Logo Resmi Sekolah',
      type: 'logo',
    });
  };

  const isSupabaseActive = getSupabaseConfig().isConfigured;

  return (
    <div id="admin-panel-layout" className="min-h-screen bg-slate-100 flex relative text-slate-800">
      {/* Mobile Drawer Overlay */}
      {isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 bg-slate-950/60 z-40 lg:hidden backdrop-blur-xs transition-opacity"
        />
      )}

      {/* Collapsible Sidebar */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 bg-slate-900 text-slate-300 transition-all duration-300 ease-in-out flex flex-col justify-between border-r border-slate-800 ${
          isSidebarOpen ? 'w-64 translate-x-0' : '-translate-x-full lg:translate-x-0 lg:w-20'
        }`}
      >
        {/* Sidebar Top: Logo & Title */}
        <div>
          <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800">
            <div className="flex items-center gap-3 overflow-hidden">
              {settings.logoUrl ? (
                <div className="w-10 h-10 flex items-center justify-center shrink-0">
                  <img
                    src={settings.logoUrl}
                    alt="Logo"
                    className="w-full h-full object-contain"
                  />
                </div>
              ) : (
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-600 to-rose-700 flex items-center justify-center text-white shrink-0 shadow-md shadow-rose-950/50">
                  <School className="w-5 h-5" />
                </div>
              )}
              {isSidebarOpen && (
                <div className="min-w-0 transition-opacity">
                  <span className="font-black text-white text-sm tracking-tight block truncate">
                    {settings.appName || 'SMART CBT'}
                  </span>
                  <span className="text-[10px] text-white font-bold block uppercase tracking-wider truncate">
                    Panel Administrator
                  </span>
                </div>
              )}
            </div>
            {/* Close button on mobile */}
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg lg:hidden cursor-pointer"
              title="Tutup Menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1.5 text-xs font-semibold">
            {/* Menu Dashboard */}
            <button
              id="menu-sidebar-dashboard"
              onClick={() => {
                setActiveTab('dashboard');
                if (window.innerWidth < 1024) setIsSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition cursor-pointer ${
                activeTab === 'dashboard'
                  ? 'bg-white text-slate-900 font-extrabold shadow-sm'
                  : 'text-slate-300 hover:bg-slate-800/80 hover:text-white font-medium'
              }`}
              title="Dashboard"
            >
              <LayoutDashboard className={`w-5 h-5 shrink-0 ${activeTab === 'dashboard' ? 'text-slate-900' : 'text-slate-400'}`} />
              {isSidebarOpen && <span className="truncate">Dashboard</span>}
            </button>

            {/* Menu Master Siswa */}
            <button
              id="menu-sidebar-siswa"
              onClick={() => {
                setActiveTab('siswa');
                if (window.innerWidth < 1024) setIsSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition cursor-pointer ${
                activeTab === 'siswa'
                  ? 'bg-white text-slate-900 font-extrabold shadow-sm'
                  : 'text-slate-300 hover:bg-slate-800/80 hover:text-white font-medium'
              }`}
              title="Data Siswa"
            >
              <GraduationCap className={`w-5 h-5 shrink-0 ${activeTab === 'siswa' ? 'text-slate-900' : 'text-slate-400'}`} />
              {isSidebarOpen && <span className="truncate">Data Siswa</span>}
            </button>

            {/* Menu Master Guru */}
            <button
              id="menu-sidebar-guru"
              onClick={() => {
                setActiveTab('guru');
                if (window.innerWidth < 1024) setIsSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition cursor-pointer ${
                activeTab === 'guru'
                  ? 'bg-white text-slate-900 font-extrabold shadow-sm'
                  : 'text-slate-300 hover:bg-slate-800/80 hover:text-white font-medium'
              }`}
              title="Data Guru"
            >
              <Users className={`w-5 h-5 shrink-0 ${activeTab === 'guru' ? 'text-slate-900' : 'text-slate-400'}`} />
              {isSidebarOpen && <span className="truncate">Data Guru</span>}
            </button>

            {/* Menu Mata Pelajaran */}
            <button
              id="menu-sidebar-mapel"
              onClick={() => {
                setActiveTab('mapel');
                if (window.innerWidth < 1024) setIsSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition cursor-pointer ${
                activeTab === 'mapel'
                  ? 'bg-white text-slate-900 font-extrabold shadow-sm'
                  : 'text-slate-300 hover:bg-slate-800/80 hover:text-white font-medium'
              }`}
              title="Mata Pelajaran"
            >
              <BookOpen className={`w-5 h-5 shrink-0 ${activeTab === 'mapel' ? 'text-slate-900' : 'text-slate-400'}`} />
              {isSidebarOpen && <span className="truncate">Mata Pelajaran</span>}
            </button>

            {/* Menu Pengaturan Sekolah */}
            <button
              id="menu-sidebar-settings"
              onClick={() => {
                setActiveTab('settings');
                if (window.innerWidth < 1024) setIsSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition cursor-pointer ${
                activeTab === 'settings'
                  ? 'bg-white text-slate-900 font-extrabold shadow-sm'
                  : 'text-slate-300 hover:bg-slate-800/80 hover:text-white font-medium'
              }`}
              title="Pengaturan"
            >
              <Building className={`w-5 h-5 shrink-0 ${activeTab === 'settings' ? 'text-slate-900' : 'text-slate-400'}`} />
              {isSidebarOpen && <span className="truncate">Pengaturan</span>}
            </button>
          </nav>
        </div>

        {/* Sidebar Bottom: School Identity */}
        {isSidebarOpen && (
          <div className="p-4 border-t border-slate-800 bg-slate-950/40">
            <p className="text-[11px] font-bold text-white truncate">
              {settings.schoolName}
            </p>
            <p className="text-[10px] text-slate-400 truncate">
              T.A. {settings.academicYear} • Sem {settings.semester}
            </p>
          </div>
        )}
      </aside>

      {/* Main Content Column */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${
          isSidebarOpen ? 'lg:pl-64' : 'lg:pl-20'
        }`}
      >
        {/* Admin Topbar */}
        <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 h-16 px-4 sm:px-6 flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-3 min-w-0">
            {/* Ikon Burger untuk Buka Tutup Menu Sidebar */}
            <button
              id="btn-toggle-admin-sidebar"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition cursor-pointer"
              title="Buka / Tutup Sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="min-w-0">
              <h2 className="font-extrabold text-slate-900 text-sm sm:text-base leading-tight truncate">
                {activeTab === 'dashboard' && 'Dashboard Administrator'}
                {activeTab === 'siswa' && 'Master Data Siswa'}
                {activeTab === 'guru' && 'Master Data Guru'}
                {activeTab === 'mapel' && 'Kurikulum Mata Pelajaran'}
                {activeTab === 'settings' && 'Pengaturan'}
              </h2>
              <p className="text-[11px] text-slate-500 hidden sm:block truncate">
                {settings.schoolName}
              </p>
            </div>
          </div>

          {/* Sisi Kanan: Status Supabase, Profil Cukup Administrator, & Logout */}
          <div className="flex items-center gap-3">
            {onOpenSupabaseModal && (
              <button
                onClick={onOpenSupabaseModal}
                className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition cursor-pointer ${
                  isSupabaseActive
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-700 hover:bg-emerald-100'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
                title={isSupabaseActive ? 'Database Supabase Terhubung' : 'Konfigurasi Database Supabase'}
              >
                <Database className="w-3.5 h-3.5 text-emerald-600" />
                <span className="hidden md:inline">Supabase</span>
                <span className={`w-2 h-2 rounded-full ${isSupabaseActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
              </button>
            )}

            {/* Profil Admin: Cukup Administrator */}
            <div
              id="admin-profile-badge"
              className="flex items-center gap-2.5 px-3 py-1.5 bg-slate-100 rounded-xl border border-slate-200"
            >
              <div className="w-7 h-7 rounded-lg bg-rose-600 flex items-center justify-center text-white font-bold shadow-2xs">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <span className="text-xs font-extrabold text-slate-800 leading-tight">
                Administrator
              </span>
            </div>

            {/* Tombol Keluar / Logout */}
            {onLogout && (
              <button
                id="btn-admin-logout"
                onClick={onLogout}
                className="flex items-center gap-1.5 px-3 py-1.5 text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-xl border border-slate-200 transition cursor-pointer text-xs font-bold"
                title="Keluar dari Sistem"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Keluar</span>
              </button>
            )}
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
          {/* Global Success Notification */}
          {successMessage && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-sm font-semibold flex items-center justify-between shadow-xs">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>{successMessage}</span>
              </div>
              <button onClick={() => setSuccessMessage('')} className="text-emerald-600 hover:text-emerald-800 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 0: DASHBOARD ADMINISTRATOR                             */}
          {/* ========================================================= */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6 animate-fadeIn">
              {/* Welcome Hero Banner - Biru Kehitaman (Midnight Dark Blue) */}
              <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-blue-950 border border-blue-900/40 rounded-3xl p-6 sm:p-8 text-white shadow-md relative overflow-hidden">
                <div className="absolute -top-16 -right-16 w-64 h-64 bg-blue-600/15 rounded-full blur-2xl pointer-events-none" />
                <div className="absolute -bottom-16 -left-16 w-64 h-64 bg-indigo-600/15 rounded-full blur-2xl pointer-events-none" />

                <div className="relative z-10 max-w-3xl">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/15 border border-blue-400/30 text-xs font-bold text-blue-300 mb-3 shadow-2xs">
                    <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                    <span>Panel Administrator Utama</span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight">
                    Selamat Datang di Sistem CBT
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed">
                    Kelola data master kurikulum sekolah, peserta didik, guru pengampu mata pelajaran, dan konfigurasi ujian terintegrasi dengan database cloud.
                  </p>

                  <div className="mt-5 flex flex-wrap items-center gap-2.5 text-xs font-semibold">
                    <span className="px-3 py-1 bg-white/10 backdrop-blur-xs rounded-xl border border-white/15 text-slate-200 font-semibold shadow-2xs">
                      {settings.schoolName}
                    </span>
                    <span className="px-3 py-1 bg-white/10 backdrop-blur-xs rounded-xl border border-white/15 text-slate-200 font-semibold shadow-2xs">
                      T.A. {settings.academicYear}
                    </span>
                    <span className="px-3 py-1 bg-white/10 backdrop-blur-xs rounded-xl border border-white/15 text-slate-200 font-semibold shadow-2xs">
                      Semester {settings.semester}
                    </span>
                  </div>
                </div>
              </div>

              {/* KPI Stat Cards (Grid 4 Kolom) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Card Total Siswa */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs hover:shadow-xs transition flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Total Siswa
                    </span>
                    <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
                      <GraduationCap className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="mt-3">
                    <span className="text-3xl font-black text-slate-900 tracking-tight">
                      {students.length}
                    </span>
                    <span className="text-xs text-slate-500 ml-1.5 font-medium">Siswa terdaftar</span>
                  </div>
                  <button
                    onClick={() => setActiveTab('siswa')}
                    className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-rose-600 hover:text-rose-700 cursor-pointer"
                  >
                    <span>Kelola Data Siswa</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Card Total Guru */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs hover:shadow-xs transition flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Total Guru
                    </span>
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                      <Users className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="mt-3">
                    <span className="text-3xl font-black text-slate-900 tracking-tight">
                      {teachers.length}
                    </span>
                    <span className="text-xs text-slate-500 ml-1.5 font-medium">Tenaga pendidik</span>
                  </div>
                  <button
                    onClick={() => setActiveTab('guru')}
                    className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-indigo-600 hover:text-indigo-700 cursor-pointer"
                  >
                    <span>Kelola Data Guru</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Card Mata Pelajaran */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs hover:shadow-xs transition flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Mata Pelajaran
                    </span>
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                      <BookOpen className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="mt-3">
                    <span className="text-3xl font-black text-slate-900 tracking-tight">
                      {subjects.length}
                    </span>
                    <span className="text-xs text-slate-500 ml-1.5 font-medium">Mapel aktif</span>
                  </div>
                  <button
                    onClick={() => setActiveTab('mapel')}
                    className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-emerald-600 hover:text-emerald-700 cursor-pointer"
                  >
                    <span>Kelola Mata Pelajaran</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Card Supabase Database */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs hover:shadow-xs transition flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Database Cloud
                    </span>
                    <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold">
                      <Database className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${isSupabaseActive ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                    <span className="text-base font-extrabold text-slate-900">
                      {isSupabaseActive ? 'Supabase Aktif' : 'Lokal (Offline)'}
                    </span>
                  </div>
                  {onOpenSupabaseModal ? (
                    <button
                      onClick={onOpenSupabaseModal}
                      className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-indigo-600 hover:text-indigo-700 cursor-pointer"
                    >
                      <span>Konfigurasi Supabase</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-400">
                      Tersinkronisasi otomatis
                    </div>
                  )}
                </div>
              </div>

              {/* Status Operasional Sistem CBT */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs">
                <h3 className="font-extrabold text-sm text-slate-900 mb-4 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Status Operasional Sistem CBT</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="font-bold text-slate-800 block">Anti-Curang Lockdown</span>
                    <span className="text-slate-500 mt-0.5 block">
                      Proteksi layar penuh, deteksi pergantian tab, anti copy-paste, dan Wake Lock aktif.
                    </span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="font-bold text-slate-800 block">Format Soal Ujian</span>
                    <span className="text-slate-500 mt-0.5 block">
                      Mendukung Pilihan Ganda, PG Kompleks, Isian Singkat, Essay, Menjodohkan, dan Benar/Salah.
                    </span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="font-bold text-slate-800 block">Pencadangan & Ekspor</span>
                    <span className="text-slate-500 mt-0.5 block">
                      Dapat mengunduh template Excel dan mengekspor seluruh master data siswa & nilai kapan saja.
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

      {/* ========================================================= */}
      {/* TAB 1: MASTER SISWA                                       */}
      {/* ========================================================= */}
      {activeTab === 'siswa' && (
        <div className="space-y-4">
          {/* Action Bar */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
            <div className="flex flex-1 items-center gap-3">
              <div className="relative flex-1 max-w-sm">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cari nama siswa, NISN, atau username..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>
              <select
                value={filterClass}
                onChange={(e) => setFilterClass(e.target.value)}
                className="py-2 px-3 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-700 font-semibold focus:outline-none"
              >
                <option value="all">Semua Kelas</option>
                <option value="7A">Kelas 7A</option>
                <option value="7B">Kelas 7B</option>
                <option value="8A">Kelas 8A</option>
                <option value="8B">Kelas 8B</option>
                <option value="9A">Kelas 9A</option>
                <option value="9B">Kelas 9B</option>
              </select>
            </div>

            {/* Mass Import/Export Excel & Add Student */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                id="btn-download-template-siswa"
                onClick={downloadTemplateSiswaExcel}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                title="Unduh Format Template Excel untuk Impor Massal"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" />
                Template Excel
              </button>

              <label className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer">
                <Upload className="w-3.5 h-3.5" />
                <span>Impor Excel (.xlsx)</span>
                <input
                  type="file"
                  accept=".xlsx, .xls"
                  onChange={handleImportSiswaExcel}
                  className="hidden"
                />
              </label>

              <button
                id="btn-export-siswa-excel"
                onClick={() => exportSiswaToExcel(students)}
                className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                Ekspor Excel (.xlsx)
              </button>

              <button
                id="btn-open-modal-add-siswa"
                onClick={() => setIsAddSiswaModalOpen(true)}
                className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
              >
                <UserPlus className="w-3.5 h-3.5" />
                Tambah Siswa
              </button>
            </div>
          </div>

          {/* Table of Students with Password and Edit Action */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-slate-700 uppercase font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4 w-12 text-center">No</th>
                    <th className="py-3 px-4">Nama Siswa</th>
                    <th className="py-3 px-4">NISN</th>
                    <th className="py-3 px-4 text-center">Kelas</th>
                    <th className="py-3 px-4 text-center">L/P</th>
                    <th className="py-3 px-4">Username Login</th>
                    <th className="py-3 px-4">Password Login</th>
                    <th className="py-3 px-4 text-center w-28">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <AnimatePresence mode="popLayout" initial={false}>
                  {filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-10 text-slate-400">
                        Tidak ada data siswa yang cocok dengan pencarian.
                      </td>
                    </tr>
                  ) : (
                    filteredStudents.map((s, idx) => (
                      <motion.tr layout initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -10, backgroundColor: '#fecaca' }} transition={{ duration: 0.2 }} key={s.id} className="hover:bg-slate-50 transition">
                        <td className="py-3 px-4 text-center font-bold text-slate-500">{idx + 1}</td>
                        <td className="py-3 px-4 font-bold text-slate-900">{s.name}</td>
                        <td className="py-3 px-4 font-mono font-semibold text-slate-600">{s.nip_nisn}</td>
                        <td className="py-3 px-4 text-center">
                          <span className="px-2 py-0.5 rounded-full font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                            {s.classGrade || '8A'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center font-semibold text-slate-600">
                          {s.gender || 'L'}
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-600">{s.username}</td>
                        <td className="py-3 px-4">
                          <span className="font-mono bg-slate-100 px-2 py-1 rounded text-slate-800 font-semibold text-[11px] border border-slate-200">
                            {s.password || 'password123'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              id={`btn-edit-siswa-${s.id}`}
                              onClick={() => handleOpenEditSiswa(s)}
                              className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition cursor-pointer"
                              title="Edit Data Siswa"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              id={`btn-delete-siswa-${s.id}`}
                              onClick={() => handleDeleteUser(s.id, s.name)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                              title="Hapus Siswa"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    ))
                  )}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
            <div className="p-3 bg-slate-50 text-xs text-slate-500 flex justify-between border-t border-slate-200">
              <span>Menampilkan {filteredStudents.length} dari total {students.length} siswa</span>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: MASTER GURU                                        */}
      {/* ========================================================= */}
      {activeTab === 'guru' && (
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari nama guru, NIP, atau mapel..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                id="btn-download-template-guru"
                onClick={downloadTemplateGuruExcel}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" />
                Template Excel
              </button>

              <label className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer">
                <Upload className="w-3.5 h-3.5" />
                <span>Impor Excel (.xlsx)</span>
                <input
                  type="file"
                  accept=".xlsx, .xls"
                  onChange={handleImportGuruExcel}
                  className="hidden"
                />
              </label>

              <button
                id="btn-export-guru-excel"
                onClick={() => exportGuruToExcel(teachers)}
                className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                Ekspor Excel (.xlsx)
              </button>

              <button
                id="btn-open-modal-add-guru"
                onClick={() => setIsAddGuruModalOpen(true)}
                className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
              >
                <UserPlus className="w-3.5 h-3.5" />
                Tambah Guru
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-slate-700 uppercase font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4 w-12 text-center">No</th>
                    <th className="py-3 px-4">Nama Lengkap & Gelar</th>
                    <th className="py-3 px-4">NIP</th>
                    <th className="py-3 px-4">Mata Pelajaran yang Diampu (Multi-Mapel)</th>
                    <th className="py-3 px-4">Username</th>
                    <th className="py-3 px-4">Password Login</th>
                    <th className="py-3 px-4 text-center w-28">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <AnimatePresence mode="popLayout" initial={false}>
                  {filteredTeachers.map((t, idx) => {
                    const teacherSubs: string[] =
                      t.subjectNames && t.subjectNames.length > 0
                        ? t.subjectNames
                        : t.subjectName
                        ? t.subjectName.split(',').map((x) => x.trim()).filter(Boolean)
                        : ['Umum / Pengawas'];

                    return (
                      <motion.tr layout initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -10, backgroundColor: '#fecaca' }} transition={{ duration: 0.2 }} key={t.id} className="hover:bg-slate-50 transition">
                        <td className="py-3 px-4 text-center font-bold text-slate-500">{idx + 1}</td>
                        <td className="py-3 px-4 font-bold text-slate-900">{t.name}</td>
                        <td className="py-3 px-4 font-mono font-semibold text-slate-600">{t.nip_nisn}</td>
                        <td className="py-3 px-4">
                          <div className="flex flex-wrap gap-1.5">
                            {teacherSubs.map((sub, sIdx) => (
                              <span
                                key={sIdx}
                                className="px-2 py-0.5 rounded-full font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100 text-[11px]"
                              >
                                {sub}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-600">{t.username}</td>
                        <td className="py-3 px-4">
                          <span className="font-mono bg-slate-100 px-2 py-1 rounded text-slate-800 font-semibold text-[11px] border border-slate-200">
                            {t.password || 'password123'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              id={`btn-edit-guru-${t.id}`}
                              onClick={() => handleOpenEditGuru(t)}
                              className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition cursor-pointer"
                              title="Edit Data Guru"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              id={`btn-delete-guru-${t.id}`}
                              onClick={() => handleDeleteUser(t.id, t.name, 'guru')}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                              title="Hapus Guru"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
            <div className="p-3 bg-slate-50 text-xs text-slate-500 flex justify-between border-t border-slate-200">
              <span>Menampilkan {filteredTeachers.length} dari total {teachers.length} guru</span>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 3: MASTER MATA PELAJARAN                              */}
      {/* ========================================================= */}
      {activeTab === 'mapel' && (
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari kode atau nama mata pelajaran..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                id="btn-download-template-mapel"
                onClick={downloadTemplateMapelExcel}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" />
                Template Excel
              </button>

              <label className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer">
                <Upload className="w-3.5 h-3.5" />
                <span>Impor Excel (.xlsx)</span>
                <input
                  type="file"
                  accept=".xlsx, .xls"
                  onChange={handleImportMapelExcel}
                  className="hidden"
                />
              </label>

              <button
                id="btn-export-mapel-excel"
                onClick={() => exportMapelToExcel(subjects)}
                className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                Ekspor Excel (.xlsx)
              </button>

              <button
                id="btn-open-modal-add-mapel"
                onClick={() => setIsAddMapelModalOpen(true)}
                className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                Tambah Mapel
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-slate-700 uppercase font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4 w-12 text-center">No</th>
                    <th className="py-3 px-4">Kode Mapel</th>
                    <th className="py-3 px-4">Nama Mata Pelajaran</th>
                    <th className="py-3 px-4">Tingkat / Jenjang</th>
                    <th className="py-3 px-4">Guru Pengampu</th>
                    <th className="py-3 px-4 text-center w-28">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <AnimatePresence mode="popLayout" initial={false}>
                  {filteredSubjects.map((m, idx) => (
                    <motion.tr layout initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -10, backgroundColor: '#fecaca' }} transition={{ duration: 0.2 }} key={m.id} className="hover:bg-slate-50 transition">
                      <td className="py-3 px-4 text-center font-bold text-slate-500">{idx + 1}</td>
                      <td className="py-3 px-4 font-mono font-bold text-indigo-700">{m.code}</td>
                      <td className="py-3 px-4 font-bold text-slate-900">{m.name}</td>
                      <td className="py-3 px-4 font-medium text-slate-600">{m.gradeLevel}</td>
                      <td className="py-3 px-4 text-slate-700">{m.teacherName || '-'}</td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            id={`btn-edit-mapel-${m.id}`}
                            onClick={() => handleOpenEditMapel(m)}
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition cursor-pointer"
                            title="Edit Mata Pelajaran"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            id={`btn-delete-mapel-${m.id}`}
                            onClick={() => handleDeleteMapel(m.id, m.name)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                            title="Hapus Mapel"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
            <div className="p-3 bg-slate-50 text-xs text-slate-500 flex justify-between border-t border-slate-200">
              <span>Menampilkan {filteredSubjects.length} mata pelajaran terdaftar</span>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 4: PENGATURAN SEKOLAH & KOP SURAT                     */}
      {/* ========================================================= */}
      {activeTab === 'settings' && (
        <div className="space-y-6 max-w-4xl">
          {/* Supabase Database Connection Card */}
          <div className="bg-gradient-to-br from-slate-900 to-indigo-950 rounded-2xl p-6 text-white shadow-md border border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-emerald-400 shrink-0 border border-white/10">
                <Database className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-base text-white">Database Cloud Supabase (PostgreSQL)</h3>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                      getSupabaseConfig().isConfigured
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    }`}
                  >
                    {getSupabaseConfig().isConfigured ? 'Aktif Terhubung' : 'Belum Terhubung'}
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  Menyimpan bank soal asesmen, master data kurikulum, serta rekap jawaban & nilai siswa secara terpusat di Supabase.
                </p>
              </div>
            </div>

            {onOpenSupabaseModal && (
              <button
                type="button"
                onClick={onOpenSupabaseModal}
                className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition cursor-pointer shrink-0"
              >
                <Database className="w-4 h-4 text-slate-950" />
                <span>Konfigurasi Supabase</span>
              </button>
            )}
          </div>

          {/* ========================================================= */}
          {/* KARTU 2: PENGATURAN AKUN ADMINISTRATOR                   */}
          {/* ========================================================= */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-2xs">
            <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0 shadow-sm">
                  <UserCog className="w-5 h-5 text-rose-400" />
                </div>
                <div>
                  <h2 className="text-lg font-extrabold text-slate-900">
                    Pengaturan Akun Administrator
                  </h2>
                  <p className="text-xs text-slate-500">
                    Atur username dan kata sandi akses masuk untuk akun Administrator CBT.
                  </p>
                </div>
              </div>
              <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-slate-100 border border-slate-200 rounded-lg text-[11px] text-slate-600 font-semibold">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Akun Aktif: <strong className="text-slate-900 font-bold">{currentAdminUser.username}</strong></span>
              </div>
            </div>

            {adminAccountMsg && (
              <div
                className={`mb-6 p-3.5 rounded-xl border flex items-center gap-3 text-xs font-semibold ${
                  adminAccountMsg.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : 'bg-rose-50 text-rose-800 border-rose-200'
                }`}
              >
                {adminAccountMsg.type === 'success' ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                )}
                <span>{adminAccountMsg.text}</span>
              </div>
            )}

            <form onSubmit={handleSaveAdminAccount} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1.5">
                    Username Administrator Baru
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={adminUsername}
                      onChange={(e) => setAdminUsername(e.target.value)}
                      placeholder="Contoh: admin"
                      className="w-full p-2.5 pl-9 bg-slate-50 border border-slate-300 rounded-xl font-semibold text-slate-900 focus:ring-2 focus:ring-rose-500 focus:bg-white transition"
                      required
                    />
                    <Users className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 block">Digunakan saat masuk login panel CBT</span>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1.5">
                    Password Baru
                  </label>
                  <div className="relative">
                    <input
                      type={showAdminPassword ? 'text' : 'password'}
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      placeholder="Minimal 4 karakter"
                      className="w-full p-2.5 pl-9 pr-10 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-900 focus:ring-2 focus:ring-rose-500 focus:bg-white transition"
                      required
                    />
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <button
                      type="button"
                      onClick={() => setShowAdminPassword(!showAdminPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                      title={showAdminPassword ? 'Sembunyikan' : 'Tampilkan'}
                    >
                      {showAdminPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 block">Kombinasi huruf & angka disarankan</span>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1.5">
                    Konfirmasi Password
                  </label>
                  <div className="relative">
                    <input
                      type={showAdminPassword ? 'text' : 'password'}
                      value={adminConfirmPassword}
                      onChange={(e) => setAdminConfirmPassword(e.target.value)}
                      placeholder="Ulangi password baru"
                      className="w-full p-2.5 pl-9 pr-10 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-900 focus:ring-2 focus:ring-rose-500 focus:bg-white transition"
                      required
                    />
                    <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 block">Harus sama persis dengan password baru</span>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={isSavingAdminAccount}
                  className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-60 text-white rounded-xl font-bold text-xs flex items-center gap-2 shadow-sm transition cursor-pointer"
                >
                  {isSavingAdminAccount ? (
                    <Loader2 className="w-4 h-4 text-rose-400 animate-spin" />
                  ) : (
                    <KeyRound className="w-4 h-4 text-rose-400" />
                  )}
                  <span>{isSavingAdminAccount ? 'Menyimpan Perubahan...' : 'Perbarui Akun Administrator'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* ========================================================= */}
          {/* KARTU 3: PENGATURAN UPLOAD LOGO SEKOLAH                  */}
          {/* ========================================================= */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-2xs">
            <div className="flex items-center gap-3 pb-4 mb-6 border-b border-slate-200">
              <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center shrink-0">
                <ImageIcon className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h2 className="text-lg font-extrabold text-slate-900">
                  Pengaturan Logo Resmi Sekolah
                </h2>
                <p className="text-xs text-slate-500">
                  Logo resmi ini otomatis muncul pada halaman login, header panel, dan kop surat cetak berita acara.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
              {/* Preview Box */}
              <div className="w-32 h-32 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 p-2 flex flex-col items-center justify-center text-center shrink-0 shadow-inner relative group overflow-hidden">
                {logoPreview ? (
                  <>
                    <img
                      src={logoPreview}
                      alt="Logo Sekolah Pratinjau"
                      className="w-full h-full object-contain"
                    />
                    <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="text-[10px] text-white font-bold bg-slate-900/80 px-2 py-1 rounded-md">
                        Logo Aktif
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center text-slate-400 gap-1.5 p-2">
                    <School className="w-8 h-8 text-slate-300" />
                    <span className="text-[10px] font-bold text-slate-400 leading-tight">
                      Belum Ada Logo
                    </span>
                  </div>
                )}
              </div>

              {/* Upload Controls & Guidelines */}
              <div className="flex-1 space-y-3 text-xs w-full">
                <div className="flex flex-wrap items-center gap-3">
                  <label
                    htmlFor="school-logo-input-field"
                    className="cursor-pointer inline-flex items-center gap-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold shadow-xs transition"
                  >
                    <Upload className="w-4 h-4" />
                    <span>{logoPreview ? 'Ganti File Logo Sekolah' : 'Pilih & Unggah File Logo'}</span>
                  </label>
                  <input
                    id="school-logo-input-field"
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml"
                    onChange={handleLogoFileUpload}
                    className="hidden"
                  />

                  {logoPreview && (
                    <button
                      type="button"
                      onClick={handleRemoveLogo}
                      className="inline-flex items-center gap-2 px-3.5 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl font-bold transition cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Hapus Logo</span>
                    </button>
                  )}
                </div>

                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 text-slate-600">
                  <p className="font-bold text-slate-800 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    Panduan & Rekomendasi Berkas:
                  </p>
                  <ul className="list-disc list-inside space-y-0.5 text-[11px] text-slate-500">
                    <li>Format didukung: <strong>PNG</strong> (latar transparan disarankan), <strong>JPG / JPEG</strong>, <strong>SVG</strong>, atau <strong>WebP</strong>.</li>
                    <li>Ukuran berkas maksimal <strong>2 MB</strong>.</li>
                    <li>Rasio gambar persegi (1:1) atau lingkaran proporsional memberikan hasil terbaik.</li>
                    <li>Berkas langsung dikonversi dan disimpan ke database tanpa perlu server penyimpanan terpisah.</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-2xs">
            <div className="flex items-center gap-3 pb-4 mb-6 border-b border-slate-200">
              <Building className="w-6 h-6 text-rose-600" />
              <div>
                <h2 className="text-lg font-extrabold text-slate-900">
                  Profil Sekolah & Konfigurasi Dokumen Resmi
                </h2>
                <p className="text-xs text-slate-500">
                  Data ini otomatis tercetak pada Kop Surat Berita Acara dan Lembar Rapor CBT Siswa.
                </p>
              </div>
            </div>

          <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nama Aplikasi CBT</label>
                <input
                  type="text"
                  value={localSettings.appName || ''}
                  onChange={(e) => setLocalSettings({ ...localSettings, appName: e.target.value })}
                  placeholder="Contoh: SMART CBT PRO"
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-rose-500 focus:bg-white"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">Tampil di portal login, judul aplikasi, dan navigasi</span>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Nama Resmi Sekolah (SMP)</label>
                <input
                  type="text"
                  value={localSettings.schoolName}
                  onChange={(e) => setLocalSettings({ ...localSettings, schoolName: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-semibold text-slate-900 focus:ring-2 focus:ring-rose-500 focus:bg-white"
                  required
                />
                <span className="text-[10px] text-slate-400 mt-1 block">Dicetak pada kop surat resmi ujian & lembar hasil</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">NPSN Sekolah</label>
                <input
                  type="text"
                  value={localSettings.schoolNpsn}
                  onChange={(e) => setLocalSettings({ ...localSettings, schoolNpsn: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono text-slate-900 focus:ring-2 focus:ring-rose-500 focus:bg-white"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Kota / Kabupaten</label>
                <input
                  type="text"
                  value={localSettings.schoolCity}
                  onChange={(e) => setLocalSettings({ ...localSettings, schoolCity: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:ring-2 focus:ring-rose-500 focus:bg-white"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Alamat Lengkap Sekolah</label>
              <input
                type="text"
                value={localSettings.schoolAddress}
                onChange={(e) => setLocalSettings({ ...localSettings, schoolAddress: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:ring-2 focus:ring-rose-500 focus:bg-white"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Tahun Ajaran</label>
                <input
                  type="text"
                  value={localSettings.academicYear}
                  onChange={(e) => setLocalSettings({ ...localSettings, academicYear: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:ring-2 focus:ring-rose-500 focus:bg-white"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Semester</label>
                <select
                  value={localSettings.semester}
                  onChange={(e) => setLocalSettings({ ...localSettings, semester: e.target.value as 'Ganjil' | 'Genap' })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-semibold text-slate-900 focus:ring-2 focus:ring-rose-500 focus:bg-white"
                >
                  <option value="Ganjil">Ganjil</option>
                  <option value="Genap">Genap</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nama Kepala Sekolah & Gelar</label>
                <input
                  type="text"
                  value={localSettings.principalName}
                  onChange={(e) => setLocalSettings({ ...localSettings, principalName: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-semibold text-slate-900 focus:ring-2 focus:ring-rose-500"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">NIP Kepala Sekolah</label>
                <input
                  type="text"
                  value={localSettings.principalNip}
                  onChange={(e) => setLocalSettings({ ...localSettings, principalNip: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono text-slate-900 focus:ring-2 focus:ring-rose-500"
                  required
                />
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="submit"
                disabled={isSavingSettings}
                className="px-6 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-60 text-white rounded-xl font-bold shadow-md hover:shadow-lg transition cursor-pointer flex items-center gap-2"
              >
                {isSavingSettings && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>{isSavingSettings ? 'Menyimpan Profil...' : 'Simpan Profil Sekolah'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    )}
        </main>
      </div>

      {/* ========================================================= */}
      {/* MODAL 1A: TAMBAH SISWA BARU                               */}
      {/* ========================================================= */}
      {isAddSiswaModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-rose-600" />
                <h3 className="font-bold text-base text-slate-900">Tambah Data Siswa Baru</h3>
              </div>
              <button onClick={() => setIsAddSiswaModalOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSiswa} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nama Lengkap Siswa</label>
                <input
                  type="text"
                  placeholder="Contoh: Farhan Alamsyah"
                  value={newSiswa.name}
                  onChange={(e) => setNewSiswa({ ...newSiswa, name: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">NISN (10 Digit)</label>
                  <input
                    type="text"
                    placeholder="0098472199"
                    value={newSiswa.nip_nisn}
                    onChange={(e) => setNewSiswa({ ...newSiswa, nip_nisn: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Kelas</label>
                  <select
                    value={newSiswa.classGrade}
                    onChange={(e) => setNewSiswa({ ...newSiswa, classGrade: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                  >
                    <option value="7A">7A</option>
                    <option value="7B">7B</option>
                    <option value="8A">8A</option>
                    <option value="8B">8B</option>
                    <option value="9A">9A</option>
                    <option value="9B">9B</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Jenis Kelamin</label>
                  <select
                    value={newSiswa.gender}
                    onChange={(e) => setNewSiswa({ ...newSiswa, gender: e.target.value as 'L' | 'P' })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                  >
                    <option value="L">Laki-Laki (L)</option>
                    <option value="P">Perempuan (P)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Username CBT</label>
                  <input
                    type="text"
                    placeholder="Otomatis jika kosong"
                    value={newSiswa.username}
                    onChange={(e) => setNewSiswa({ ...newSiswa, username: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Password Login CBT <span className="text-rose-500 font-bold">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="password123"
                    value={newSiswa.password}
                    onChange={(e) => setNewSiswa({ ...newSiswa, password: e.target.value })}
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono"
                    required
                  />
                </div>
                <span className="text-[10px] text-slate-400">Password ini digunakan siswa untuk login ke ruang asesmen CBT.</span>
              </div>

              <div className="pt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddSiswaModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSavingSiswa}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-60 text-white rounded-xl font-bold cursor-pointer shadow-xs flex items-center gap-2"
                >
                  {isSavingSiswa && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{isSavingSiswa ? 'Menyimpan...' : 'Simpan Siswa'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 1B: EDIT SISWA (UPDATE)                             */}
      {/* ========================================================= */}
      {isEditSiswaModalOpen && editingSiswa && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-base text-slate-900">Edit Data Siswa</h3>
              </div>
              <button onClick={() => setIsEditSiswaModalOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditSiswa} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nama Lengkap Siswa</label>
                <input
                  type="text"
                  value={editSiswaForm.name}
                  onChange={(e) => setEditSiswaForm({ ...editSiswaForm, name: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">NISN (10 Digit)</label>
                  <input
                    type="text"
                    value={editSiswaForm.nip_nisn}
                    onChange={(e) => setEditSiswaForm({ ...editSiswaForm, nip_nisn: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Kelas</label>
                  <select
                    value={editSiswaForm.classGrade}
                    onChange={(e) => setEditSiswaForm({ ...editSiswaForm, classGrade: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-semibold"
                  >
                    <option value="7A">7A</option>
                    <option value="7B">7B</option>
                    <option value="8A">8A</option>
                    <option value="8B">8B</option>
                    <option value="9A">9A</option>
                    <option value="9B">9B</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Jenis Kelamin</label>
                  <select
                    value={editSiswaForm.gender}
                    onChange={(e) => setEditSiswaForm({ ...editSiswaForm, gender: e.target.value as 'L' | 'P' })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                  >
                    <option value="L">Laki-Laki (L)</option>
                    <option value="P">Perempuan (P)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Username Login</label>
                  <input
                    type="text"
                    value={editSiswaForm.username}
                    onChange={(e) => setEditSiswaForm({ ...editSiswaForm, username: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Password Login CBT <span className="text-rose-500 font-bold">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={editSiswaForm.password}
                    onChange={(e) => setEditSiswaForm({ ...editSiswaForm, password: e.target.value })}
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono"
                    required
                  />
                </div>
                <span className="text-[10px] text-slate-400">Anda dapat mengubah kata sandi siswa kapan saja.</span>
              </div>

              <div className="pt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditSiswaModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSavingEditSiswa}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white rounded-xl font-bold cursor-pointer shadow-xs flex items-center gap-2"
                >
                  {isSavingEditSiswa && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{isSavingEditSiswa ? 'Menyimpan...' : 'Simpan Perubahan Siswa'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 2A: TAMBAH GURU BARU (MULTI-MAPEL + PASSWORD)       */}
      {/* ========================================================= */}
      {isAddGuruModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-rose-600" />
                <h3 className="font-bold text-base text-slate-900">Tambah Data Guru Baru</h3>
              </div>
              <button onClick={() => setIsAddGuruModalOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddGuru} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nama Lengkap & Gelar</label>
                <input
                  type="text"
                  placeholder="Contoh: Rina Anggraeni, S.Pd."
                  value={newGuru.name}
                  onChange={(e) => setNewGuru({ ...newGuru, name: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">NIP (18 Digit)</label>
                  <input
                    type="text"
                    placeholder="198305122008012009"
                    value={newGuru.nip_nisn}
                    onChange={(e) => setNewGuru({ ...newGuru, nip_nisn: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Username CBT</label>
                  <input
                    type="text"
                    placeholder="guru_1234"
                    value={newGuru.username}
                    onChange={(e) => setNewGuru({ ...newGuru, username: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Password Login CBT <span className="text-rose-500 font-bold">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="password123"
                    value={newGuru.password}
                    onChange={(e) => setNewGuru({ ...newGuru, password: e.target.value })}
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono"
                    required
                  />
                </div>
              </div>

              {/* Multi-Mapel Selector */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="font-semibold text-slate-700">
                    Mata Pelajaran yang Diampu (Boleh Lebih Dari Satu) <span className="text-rose-500">*</span>
                  </label>
                  <div className="flex items-center gap-2 text-[10px]">
                    <button
                      type="button"
                      onClick={() => setNewGuru({ ...newGuru, selectedSubjects: subjects.map((s) => s.name) })}
                      className="text-indigo-600 hover:underline font-bold cursor-pointer"
                    >
                      Pilih Semua
                    </button>
                    <span>•</span>
                    <button
                      type="button"
                      onClick={() => setNewGuru({ ...newGuru, selectedSubjects: [] })}
                      className="text-slate-500 hover:underline cursor-pointer"
                    >
                      Kosongkan
                    </button>
                  </div>
                </div>

                <div className="border border-slate-200 rounded-xl p-2.5 bg-slate-50 max-h-44 overflow-y-auto space-y-1.5">
                  {subjects.length === 0 ? (
                    <p className="text-center py-4 text-slate-400">Belum ada mata pelajaran terdaftar.</p>
                  ) : (
                    subjects.map((sub) => {
                      const isChecked = newGuru.selectedSubjects.includes(sub.name);
                      return (
                        <label
                          key={sub.id}
                          className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition ${
                            isChecked
                              ? 'bg-indigo-50/80 border border-indigo-200 text-indigo-900 font-semibold'
                              : 'hover:bg-white text-slate-700'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setNewGuru({
                                    ...newGuru,
                                    selectedSubjects: [...newGuru.selectedSubjects, sub.name],
                                  });
                                } else {
                                  setNewGuru({
                                    ...newGuru,
                                    selectedSubjects: newGuru.selectedSubjects.filter((n) => n !== sub.name),
                                  });
                                }
                              }}
                              className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                            />
                            <span>{sub.name}</span>
                          </div>
                          <span className="text-[10px] font-mono text-slate-400">{sub.code}</span>
                        </label>
                      );
                    })
                  )}
                </div>
                <div className="mt-1 text-[11px] text-slate-500">
                  Terpilih: <strong>{newGuru.selectedSubjects.length}</strong> mata pelajaran
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddGuruModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSavingGuru}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-60 text-white rounded-xl font-bold cursor-pointer shadow-xs flex items-center gap-2"
                >
                  {isSavingGuru && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{isSavingGuru ? 'Menyimpan...' : 'Simpan Guru'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 2B: EDIT GURU (UPDATE + MULTI-MAPEL + PASSWORD)      */}
      {/* ========================================================= */}
      {isEditGuruModalOpen && editingGuru && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-base text-slate-900">Edit Data Guru</h3>
              </div>
              <button onClick={() => setIsEditGuruModalOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditGuru} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nama Lengkap & Gelar</label>
                <input
                  type="text"
                  value={editGuruForm.name}
                  onChange={(e) => setEditGuruForm({ ...editGuruForm, name: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">NIP (18 Digit)</label>
                  <input
                    type="text"
                    value={editGuruForm.nip_nisn}
                    onChange={(e) => setEditGuruForm({ ...editGuruForm, nip_nisn: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Username Login</label>
                  <input
                    type="text"
                    value={editGuruForm.username}
                    onChange={(e) => setEditGuruForm({ ...editGuruForm, username: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Password Login CBT <span className="text-rose-500 font-bold">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={editGuruForm.password}
                    onChange={(e) => setEditGuruForm({ ...editGuruForm, password: e.target.value })}
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono"
                    required
                  />
                </div>
                <span className="text-[10px] text-slate-400">Password ini digunakan guru untuk login CBT dan membuat soal.</span>
              </div>

              {/* Multi-Mapel Edit Selector */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="font-semibold text-slate-700">
                    Mata Pelajaran yang Diampu (Boleh Lebih Dari Satu) <span className="text-rose-500">*</span>
                  </label>
                  <div className="flex items-center gap-2 text-[10px]">
                    <button
                      type="button"
                      onClick={() => setEditGuruForm({ ...editGuruForm, selectedSubjects: subjects.map((s) => s.name) })}
                      className="text-indigo-600 hover:underline font-bold cursor-pointer"
                    >
                      Pilih Semua
                    </button>
                    <span>•</span>
                    <button
                      type="button"
                      onClick={() => setEditGuruForm({ ...editGuruForm, selectedSubjects: [] })}
                      className="text-slate-500 hover:underline cursor-pointer"
                    >
                      Kosongkan
                    </button>
                  </div>
                </div>

                <div className="border border-slate-200 rounded-xl p-2.5 bg-slate-50 max-h-44 overflow-y-auto space-y-1.5">
                  {subjects.length === 0 ? (
                    <p className="text-center py-4 text-slate-400">Belum ada mata pelajaran terdaftar.</p>
                  ) : (
                    subjects.map((sub) => {
                      const isChecked = editGuruForm.selectedSubjects.includes(sub.name);
                      return (
                        <label
                          key={sub.id}
                          className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition ${
                            isChecked
                              ? 'bg-indigo-50/80 border border-indigo-200 text-indigo-900 font-semibold'
                              : 'hover:bg-white text-slate-700'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setEditGuruForm({
                                    ...editGuruForm,
                                    selectedSubjects: [...editGuruForm.selectedSubjects, sub.name],
                                  });
                                } else {
                                  setEditGuruForm({
                                    ...editGuruForm,
                                    selectedSubjects: editGuruForm.selectedSubjects.filter((n) => n !== sub.name),
                                  });
                                }
                              }}
                              className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                            />
                            <span>{sub.name}</span>
                          </div>
                          <span className="text-[10px] font-mono text-slate-400">{sub.code}</span>
                        </label>
                      );
                    })
                  )}
                </div>
                <div className="mt-1 text-[11px] text-slate-500">
                  Terpilih: <strong>{editGuruForm.selectedSubjects.length}</strong> mata pelajaran
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditGuruModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSavingEditGuru}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white rounded-xl font-bold cursor-pointer shadow-xs flex items-center gap-2"
                >
                  {isSavingEditGuru && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{isSavingEditGuru ? 'Menyimpan...' : 'Simpan Perubahan Guru'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 3A: TAMBAH MAPEL BARU                               */}
      {/* ========================================================= */}
      {isAddMapelModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-rose-600" />
                <h3 className="font-bold text-base text-slate-900">Tambah Mata Pelajaran</h3>
              </div>
              <button onClick={() => setIsAddMapelModalOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddMapel} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Kode Mapel</label>
                  <input
                    type="text"
                    placeholder="Contoh: IPS-8"
                    value={newMapel.code}
                    onChange={(e) => setNewMapel({ ...newMapel, code: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono uppercase"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tingkat / Jenjang</label>
                  <select
                    value={newMapel.gradeLevel}
                    onChange={(e) => setNewMapel({ ...newMapel, gradeLevel: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                  >
                    <option value="SMP Kelas 7">SMP Kelas 7</option>
                    <option value="SMP Kelas 8">SMP Kelas 8</option>
                    <option value="SMP Kelas 9">SMP Kelas 9</option>
                    <option value="Semua Tingkat">Semua Tingkat</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nama Mata Pelajaran</label>
                <input
                  type="text"
                  placeholder="Contoh: Ilmu Pengetahuan Sosial (IPS)"
                  value={newMapel.name}
                  onChange={(e) => setNewMapel({ ...newMapel, name: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Guru Pengampu</label>
                <select
                  value={newMapel.teacherName}
                  onChange={(e) => setNewMapel({ ...newMapel, teacherName: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                >
                  <option value="">-- Pilih Guru Pengampu --</option>
                  {teachers.map((t) => (
                    <option key={t.id} value={t.name}>
                      {t.name} ({t.nip_nisn})
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddMapelModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSavingMapel}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-60 text-white rounded-xl font-bold cursor-pointer shadow-xs flex items-center gap-2"
                >
                  {isSavingMapel && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{isSavingMapel ? 'Menyimpan...' : 'Simpan Mapel'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 3B: EDIT MAPEL (UPDATE)                             */}
      {/* ========================================================= */}
      {isEditMapelModalOpen && editingMapel && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-base text-slate-900">Edit Mata Pelajaran</h3>
              </div>
              <button onClick={() => setIsEditMapelModalOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditMapel} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Kode Mapel</label>
                  <input
                    type="text"
                    value={editMapelForm.code}
                    onChange={(e) => setEditMapelForm({ ...editMapelForm, code: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono uppercase"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tingkat / Jenjang</label>
                  <select
                    value={editMapelForm.gradeLevel}
                    onChange={(e) => setEditMapelForm({ ...editMapelForm, gradeLevel: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                  >
                    <option value="SMP Kelas 7">SMP Kelas 7</option>
                    <option value="SMP Kelas 8">SMP Kelas 8</option>
                    <option value="SMP Kelas 9">SMP Kelas 9</option>
                    <option value="Semua Tingkat">Semua Tingkat</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nama Mata Pelajaran</label>
                <input
                  type="text"
                  value={editMapelForm.name}
                  onChange={(e) => setEditMapelForm({ ...editMapelForm, name: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Guru Pengampu</label>
                <select
                  value={editMapelForm.teacherName}
                  onChange={(e) => setEditMapelForm({ ...editMapelForm, teacherName: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                >
                  <option value="">-- Pilih Guru Pengampu --</option>
                  {teachers.map((t) => (
                    <option key={t.id} value={t.name}>
                      {t.name} ({t.nip_nisn})
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditMapelModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSavingEditMapel}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white rounded-xl font-bold cursor-pointer shadow-xs flex items-center gap-2"
                >
                  {isSavingEditMapel && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{isSavingEditMapel ? 'Menyimpan...' : 'Simpan Perubahan Mapel'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* IN-APP DELETE CONFIRMATION MODAL                          */}
      {/* ========================================================= */}
      {deleteConfirm.isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-scaleUp">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-6 h-6 text-rose-600" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-extrabold text-base text-slate-900 leading-tight">
                  Konfirmasi Hapus Data
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Apakah Anda yakin ingin menghapus data{' '}
                  <strong className="text-slate-800 font-semibold underline decoration-rose-400">
                    "{deleteConfirm.name}"
                  </strong>
                  ?
                </p>
                <div className="mt-3 p-3 bg-rose-50/80 border border-rose-200/80 rounded-xl text-[11px] text-rose-700 flex items-center gap-2 font-medium">
                  <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                  <span>Tindakan ini permanen dan data yang dihapus tidak dapat dipulihkan.</span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setDeleteConfirm({ isOpen: false, id: '', name: '', type: 'siswa' })}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Batalkan
              </button>
              <button
                type="button"
                id="btn-confirm-delete-action"
                onClick={executeDelete}
                className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-sm flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>Ya, Hapus Sekarang</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* FLOATING TOAST NOTIFICATIONS                              */}
      {/* ========================================================= */}
      <div className="fixed top-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto p-4 rounded-2xl shadow-xl border flex items-start gap-3 transition-all duration-300 transform translate-y-0 ${
              toast.type === 'delete'
                ? 'bg-rose-900/95 text-white border-rose-700 shadow-rose-900/20'
                : toast.type === 'error'
                ? 'bg-amber-900/95 text-white border-amber-700 shadow-amber-900/20'
                : 'bg-slate-900/95 text-white border-slate-700 shadow-slate-900/20'
            }`}
          >
            <div className="mt-0.5 shrink-0">
              {toast.type === 'delete' ? (
                <div className="w-7 h-7 rounded-lg bg-rose-500/30 border border-rose-400/40 flex items-center justify-center">
                  <Trash2 className="w-4 h-4 text-rose-300" />
                </div>
              ) : toast.type === 'error' ? (
                <div className="w-7 h-7 rounded-lg bg-amber-500/30 border border-amber-400/40 flex items-center justify-center">
                  <AlertCircle className="w-4 h-4 text-amber-300" />
                </div>
              ) : (
                <div className="w-7 h-7 rounded-lg bg-emerald-500/30 border border-emerald-400/40 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0 pr-1">
              <h4 className="text-xs font-bold tracking-tight text-white">{toast.title}</h4>
              <p className="text-[11px] text-slate-200 mt-0.5 leading-snug">{toast.message}</p>
            </div>

            <button
              onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
              className="text-slate-400 hover:text-white p-1 rounded-lg transition shrink-0 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
