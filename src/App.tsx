import React, { useEffect, useMemo, useState } from 'react';
import {
  BookOpen,
  CheckCircle2,
  Database,
  FileSpreadsheet,
  FolderGit2,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Menu,
  PenSquare,
  Printer,
  RefreshCw,
  Users,
  X,
} from 'lucide-react';
import { User } from 'firebase/auth';
import { AdminDashboardView } from './components/AdminDashboardView';
import { ConfirmDialog } from './components/ConfirmDialog';
import { GradeEditorView } from './components/GradeEditorView';
import { MasterManagementView } from './components/MasterManagementView';
import { MdaLogo } from './components/MdaLogo';
import { PortfolioHubView } from './components/PortfolioHubView';
import { PrintableReportView } from './components/PrintableReportView';
import { SettingsSheetsView } from './components/SettingsSheetsView';
import { StudentPortalView } from './components/StudentPortalView';
import { INITIAL_MDA_DATABASE } from './data/seedData';
import { getAccessToken, googleSignIn, initAuth, logout } from './services/googleAuth';
import {
  createMdaSpreadsheet,
  extractSpreadsheetId,
  loadDatabaseFromSheet,
  syncDatabaseToSheet,
  uploadFileToDrive,
} from './services/sheetsDb';
import {
  ConfirmDialogState,
  MdaDatabase,
  PortfolioProject,
  SemesterReport,
  Student,
  TeacherClass,
  AcademicPeriod,
  UserAccess,
  UserRole,
} from './types/mda';

type NavSection =
  | 'overview'
  | 'master'
  | 'grading'
  | 'portal'
  | 'portfolio'
  | 'sheets';

const STORAGE_SHEET_ID_KEY = 'mda_connected_spreadsheet_id';
const STORAGE_LOCAL_DB_KEY = 'mda_cached_db_snapshot';

export default function App() {
  // Check if opened directly via Portfolio QR Code (?portfolio=slug)
  const urlParams = useMemo(() => new URLSearchParams(window.location.search), []);
  const initialPortfolioSlug = urlParams.get('portfolio');
  const initialSheetParam = urlParams.get('sheet');

  const [db, setDb] = useState<MdaDatabase>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_LOCAL_DB_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as MdaDatabase;
        if (Array.isArray(parsed.students) && Array.isArray(parsed.reports)) {
          return parsed;
        }
      }
    } catch {
      // ignore invalid cache
    }
    const savedSheetId =
      initialSheetParam || localStorage.getItem(STORAGE_SHEET_ID_KEY) || undefined;
    return {
      ...INITIAL_MDA_DATABASE,
      spreadsheetId: savedSheetId,
    };
  });

  const [authUser, setAuthUser] = useState<User | null>(null);
  const [hasAccessToken, setHasAccessToken] = useState(false);
  const [guestPreviewMode, setGuestPreviewMode] = useState(false);
  const [publicPortfolioMode, setPublicPortfolioMode] = useState(
    Boolean(initialPortfolioSlug)
  );
  const [authError, setAuthError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  const activePeriod = useMemo(
    () => db.periods.find((p) => p.isActive) || db.periods[db.periods.length - 1],
    [db.periods]
  );

  const [selectedYear, setSelectedYear] = useState<string>(
    activePeriod?.tahunAkademik || '2026/2027'
  );
  const [selectedSemester, setSelectedSemester] = useState<'Gasal' | 'Genap'>(
    activePeriod?.semester || 'Gasal'
  );
  const [selectedStudentId, setSelectedStudentId] = useState<string>(() => {
    if (initialPortfolioSlug) {
      const found = db.students.find((s) => s.portfolioSlug === initialPortfolioSlug);
      if (found) return found.id;
    }
    return db.students[0]?.id || 'std-alwan';
  });

  const [activeNav, setActiveNav] = useState<NavSection>('overview');
  const [printMode, setPrintMode] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Admin role preview switcher (only enabled for Admin / Preview mode so users can test both portals)
  const [previewRole, setPreviewRole] = useState<UserRole>('admin');

  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState>({
    open: false,
    title: '',
    message: '',
    confirmLabel: 'Konfirmasi',
    onConfirm: () => {},
  });

  const showToast = (type: 'ok' | 'err', text: string) => {
    setToast({ type, text });
    setTimeout(() => {
      setToast((prev) => (prev?.text === text ? null : prev));
    }, 4500);
  };

  // Persist non-secret local snapshot (access tokens are NEVER stored here)
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_LOCAL_DB_KEY, JSON.stringify(db));
      if (db.spreadsheetId) {
        localStorage.setItem(STORAGE_SHEET_ID_KEY, db.spreadsheetId);
      }
    } catch {
      // ignore storage quota errors
    }
  }, [db]);

  // Initialize Firebase Google Auth listener
  useEffect(() => {
    const unsubscribe = initAuth(
      async (user, token) => {
        setAuthUser(user);
        setHasAccessToken(Boolean(token));
        setAuthError(null);
      },
      (user) => {
        setAuthUser(user);
        setHasAccessToken(false);
      }
    );
    return () => unsubscribe();
  }, []);

  // Determine real RBAC role from db.userAccess
  const actualRole: UserRole = useMemo(() => {
    if (!authUser?.email) return 'admin';
    const email = authUser.email.toLowerCase();
    const record = db.userAccess.find(
      (u) => u.email.toLowerCase() === email && u.statusAktif
    );
    if (record) return record.role;
    // Check teachers table
    const teacher = db.teachers.find((t) => t.email.toLowerCase() === email);
    if (teacher) return teacher.role;
    // Check student/parent email
    const stu = db.students.find((s) => s.emailSantriOrtu.toLowerCase() === email);
    if (stu) return 'santri_ortu';
    // Default first workspace owner to admin
    return 'admin';
  }, [authUser, db.userAccess, db.teachers, db.students]);

  const effectiveRole: UserRole =
    actualRole === 'admin' ? previewRole : actualRole;

  const lockedStudentId = useMemo(() => {
    if (effectiveRole !== 'santri_ortu' || !authUser?.email) return null;
    const email = authUser.email.toLowerCase();
    const acc = db.userAccess.find((u) => u.email.toLowerCase() === email);
    if (acc?.linkedStudentId) return acc.linkedStudentId;
    const stu = db.students.find((s) => s.emailSantriOrtu.toLowerCase() === email);
    return stu?.id || null;
  }, [effectiveRole, authUser, db.userAccess, db.students]);

  useEffect(() => {
    if (effectiveRole === 'santri_ortu') {
      if (lockedStudentId) setSelectedStudentId(lockedStudentId);
      if (activeNav !== 'portal' && activeNav !== 'portfolio') {
        setActiveNav('portal');
      }
    }
  }, [effectiveRole, lockedStudentId, activeNav]);

  const handleGoogleLogin = async () => {
    setAuthError(null);
    try {
      const res = await googleSignIn();
      if (res) {
        setAuthUser(res.user);
        setHasAccessToken(true);
        setGuestPreviewMode(false);
        showToast('ok', `Berhasil masuk sebagai ${res.user.email}`);

        // Auto-load from connected spreadsheet if available
        const existingSheetId =
          db.spreadsheetId || localStorage.getItem(STORAGE_SHEET_ID_KEY);
        if (existingSheetId) {
          setIsSyncing(true);
          try {
            const loaded = await loadDatabaseFromSheet(
              res.accessToken,
              existingSheetId,
              db
            );
            setDb(loaded);
            showToast('ok', 'Data terbaru berhasil dimuat dari Google Sheets.');
          } catch (err: any) {
            showToast('err', err.message || 'Gagal memuat Google Sheets.');
          } finally {
            setIsSyncing(false);
          }
        }
      }
    } catch (err: any) {
      setAuthError(err.message || 'Gagal login dengan Google.');
    }
  };

  const handleLogout = async () => {
    await logout();
    setAuthUser(null);
    setHasAccessToken(false);
    setGuestPreviewMode(false);
  };

  // Helper to commit DB changes locally AND optionally push to Google Sheets with confirmation
  const commitDatabaseChange = (
    nextDb: MdaDatabase,
    confirmTitle: string,
    confirmMessage: string
  ) => {
    const syncIfConnected = async () => {
      const token = await getAccessToken();
      if (token && nextDb.spreadsheetId) {
        setIsSyncing(true);
        try {
          await syncDatabaseToSheet(token, nextDb.spreadsheetId, nextDb);
          const stamped = { ...nextDb, lastSyncedAt: new Date().toISOString() };
          setDb(stamped);
          showToast('ok', 'Perubahan disimpan dan disinkronkan ke Google Sheets.');
        } catch (err: any) {
          setDb(nextDb);
          showToast('err', `Disimpan lokal, gagal sinkron Sheets: ${err.message}`);
        } finally {
          setIsSyncing(false);
        }
      } else {
        setDb(nextDb);
        showToast(
          'ok',
          'Perubahan disimpan di sesi lokal. Hubungkan Google Sheets untuk sinkronisasi cloud.'
        );
      }
    };

    if (hasAccessToken && nextDb.spreadsheetId) {
      setConfirmDialog({
        open: true,
        title: confirmTitle,
        message: confirmMessage,
        confirmLabel: 'Simpan ke Google Sheets',
        onConfirm: syncIfConnected,
      });
    } else {
      setDb(nextDb);
      showToast('ok', 'Data diperbarui di workspace.');
    }
  };

  const handleCreateSpreadsheet = () => {
    setConfirmDialog({
      open: true,
      title: 'Buat Google Spreadsheet MDA Baru?',
      message:
        'Sistem akan membuat spreadsheet baru di Google Drive Anda berisi 10 tab terstruktur (Master_Akademik, Guru_Kelas, Santri, Rapor_Semester, Sikap_Character, Tahfidz, Nilai_Diniyah, Nilai_Digital, Portofolio, Hak_Akses) beserta data awal MDA.',
      confirmLabel: 'Buat Spreadsheet',
      onConfirm: async () => {
        const token = await getAccessToken();
        if (!token) {
          showToast('err', 'Silakan Sign in with Google terlebih dahulu.');
          return;
        }
        setIsSyncing(true);
        try {
          const created = await createMdaSpreadsheet(token, db);
          setDb({
            ...db,
            spreadsheetId: created.spreadsheetId,
            spreadsheetUrl: created.spreadsheetUrl,
            spreadsheetTitle: created.title,
            lastSyncedAt: new Date().toISOString(),
          });
          showToast('ok', 'Google Spreadsheet MDA berhasil dibuat dan diisi data awal!');
        } catch (err: any) {
          showToast('err', err.message || 'Gagal membuat Google Spreadsheet.');
        } finally {
          setIsSyncing(false);
        }
      },
    });
  };

  const handleConnectSpreadsheet = async (urlOrId: string) => {
    const id = extractSpreadsheetId(urlOrId);
    const token = await getAccessToken();
    if (!token) {
      showToast('err', 'Silakan Sign in with Google terlebih dahulu.');
      return;
    }
    setIsSyncing(true);
    try {
      const loaded = await loadDatabaseFromSheet(token, id, db);
      setDb(loaded);
      showToast('ok', `Berhasil terhubung ke "${loaded.spreadsheetTitle}".`);
    } catch (err: any) {
      showToast('err', err.message || 'Gagal membaca spreadsheet tersebut.');
    } finally {
      setIsSyncing(false);
    }
  };

  const handlePushToSheets = () => {
    if (!db.spreadsheetId) return;
    setConfirmDialog({
      open: true,
      title: 'Sinkronkan & Perbarui Google Sheets?',
      message: `Seluruh data pada ${db.students.length} santri, ${db.reports.length} rapor semester, dan ${db.portfolios.length} karya portofolio akan ditulis ulang ke Google Spreadsheet "${db.spreadsheetTitle || db.spreadsheetId}".`,
      confirmLabel: 'Sinkronkan Sekarang',
      onConfirm: async () => {
        const token = await getAccessToken();
        if (!token || !db.spreadsheetId) return;
        setIsSyncing(true);
        try {
          await syncDatabaseToSheet(token, db.spreadsheetId, db);
          setDb({ ...db, lastSyncedAt: new Date().toISOString() });
          showToast('ok', 'Seluruh data berhasil disinkronkan ke Google Sheets.');
        } catch (err: any) {
          showToast('err', err.message || 'Gagal sinkronisasi ke Google Sheets.');
        } finally {
          setIsSyncing(false);
        }
      },
    });
  };

  const handlePullFromSheets = async () => {
    const token = await getAccessToken();
    if (!token || !db.spreadsheetId) return;
    setIsSyncing(true);
    try {
      const loaded = await loadDatabaseFromSheet(token, db.spreadsheetId, db);
      setDb(loaded);
      showToast('ok', 'Data berhasil dimuat ulang dari Google Sheets.');
    } catch (err: any) {
      showToast('err', err.message || 'Gagal memuat ulang dari Google Sheets.');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleUploadToDrive = async (
    file: File
  ): Promise<{ url: string; type: 'image' | 'video' } | null> => {
    const token = await getAccessToken();
    if (!token) {
      showToast(
        'err',
        'Login dengan Google terlebih dahulu untuk mengunggah file ke Google Drive.'
      );
      return null;
    }

    return new Promise((resolve) => {
      setConfirmDialog({
        open: true,
        title: 'Unggah File Karya ke Google Drive?',
        message: `File "${file.name}" (${Math.round(
          file.size / 1024
        )} KB) akan diunggah ke Google Drive Anda dan diatur agar dapat dilihat melalui link portofolio santri.`,
        confirmLabel: 'Unggah ke Drive',
        onConfirm: async () => {
          try {
            const uploaded = await uploadFileToDrive(token, file);
            showToast('ok', `File "${file.name}" berhasil diunggah ke Google Drive.`);
            resolve({
              url: uploaded.url,
              type: uploaded.mimeType.startsWith('video/') ? 'video' : 'image',
            });
          } catch (err: any) {
            showToast('err', err.message || 'Gagal mengunggah ke Google Drive.');
            resolve(null);
          }
        },
      });
    });
  };

  const handleSaveReport = (report: SemesterReport) => {
    const exists = db.reports.some((r) => r.id === report.id);
    const nextReports = exists
      ? db.reports.map((r) => (r.id === report.id ? report : r))
      : [...db.reports, report];
    const studentName =
      db.students.find((s) => s.id === report.studentId)?.nama || 'Santri';

    commitDatabaseChange(
      { ...db, reports: nextReports },
      'Simpan Perubahan Nilai Rapor?',
      `Nilai rapor semester ${report.semester} ${report.tahunAkademik} untuk ${studentName} akan disimpan dan diperbarui di Google Sheets.`
    );
  };

  const handleSaveStudents = (students: Student[]) => {
    commitDatabaseChange(
      { ...db, students },
      'Simpan Perubahan Data Santri?',
      `Daftar data santri (${students.length} santri) akan diperbarui di tab Santri Google Sheets.`
    );
  };

  const handleSaveTeachers = (teachers: TeacherClass[]) => {
    commitDatabaseChange(
      { ...db, teachers },
      'Simpan Data Guru & Wali Kelas?',
      `Daftar guru dan pembagian kelas (${teachers.length} pengajar) akan diperbarui di Google Sheets.`
    );
  };

  const handleSavePeriods = (periods: AcademicPeriod[]) => {
    commitDatabaseChange(
      { ...db, periods },
      'Simpan Pengaturan Semester & KKM?',
      `Konfigurasi tahun akademik, semester aktif, dan KKM akan diperbarui di Google Sheets.`
    );
  };

  const handleSavePortfolios = (portfolios: PortfolioProject[]) => {
    commitDatabaseChange(
      { ...db, portfolios },
      'Simpan Data Portofolio Karya?',
      `Daftar karya Student Portfolio (${portfolios.length} proyek) akan diperbarui di Google Sheets.`
    );
  };

  const handleSaveUserAccess = (userAccess: UserAccess[]) => {
    commitDatabaseChange(
      { ...db, userAccess },
      'Perbarui Hak Akses Pengguna?',
      `Pengaturan hak akses (${userAccess.length} akun) akan disimpan ke tab Hak_Akses Google Sheets.`
    );
  };

  const handleRestoreBackup = (restored: MdaDatabase) => {
    setConfirmDialog({
      open: true,
      title: 'Pulihkan Database dari File Backup?',
      message: `Data saat ini akan digantikan dengan data dari file backup (${restored.students.length} santri, ${restored.reports.length} rapor).`,
      confirmLabel: 'Pulihkan Data',
      variant: 'danger',
      onConfirm: async () => {
        const merged = {
          ...restored,
          spreadsheetId: db.spreadsheetId,
          spreadsheetUrl: db.spreadsheetUrl,
          spreadsheetTitle: db.spreadsheetTitle,
        };
        setDb(merged);
        const token = await getAccessToken();
        if (token && merged.spreadsheetId) {
          await syncDatabaseToSheet(token, merged.spreadsheetId, merged);
        }
        showToast('ok', 'Database berhasil dipulihkan dari file backup.');
      },
    });
  };

  // 1. Standalone Public QR Portfolio Mode
  if (publicPortfolioMode) {
    return (
      <>
        <PortfolioHubView
          db={db}
          studentId={selectedStudentId}
          canEdit={false}
          isPublicStandalone
          onSavePortfolios={() => {}}
          onUploadMediaToDrive={async () => null}
          onExitPublicStandalone={() => {
            setPublicPortfolioMode(false);
            window.history.replaceState({}, '', window.location.pathname);
          }}
        />
        <ConfirmDialog
          dialog={confirmDialog}
          onClose={() => setConfirmDialog((d) => ({ ...d, open: false }))}
        />
      </>
    );
  }

  // 2. Printable 6-Page A4 PDF Report Mode
  if (printMode) {
    return (
      <PrintableReportView
        db={db}
        studentId={selectedStudentId}
        selectedYear={selectedYear}
        selectedSemester={selectedSemester}
        onBack={() => setPrintMode(false)}
      />
    );
  }

  // 3. Authentication Gate (before signing in or entering preview mode)
  if (!hasAccessToken && !guestPreviewMode) {
    return (
      <div className="min-h-screen bg-[#f6fbf9] flex flex-col justify-between p-4 sm:p-8">
        <div className="max-w-5xl w-full mx-auto my-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Left Branding Panel */}
          <div
            className="lg:col-span-6 rounded-3xl p-8 text-white flex flex-col justify-between shadow-lg"
            style={{
              background:
                'linear-gradient(155deg, #00C478 0%, #0D7A6F 52%, #0F172A 100%)',
            }}
          >
            <div>
              <div className="inline-block bg-white rounded-2xl px-4 py-2.5 shadow-sm">
                <MdaLogo size="md" />
              </div>
              <h1 className="font-display font-extrabold text-3xl sm:text-4xl leading-tight mt-8 text-balance">
                Dashboard Rapor Digital &amp; Student Portfolio
              </h1>
              <p className="mt-3 text-sm text-emerald-50/90 leading-relaxed">
                Sistem pengelolaan hasil belajar terpadu Muslim Digital Academy (MDA) Pondok Pesantren Darul Fithrah dengan penyimpanan permanen di Google Sheets.
              </p>
            </div>

            <div className="mt-8 pt-6 border-t border-white/20 grid grid-cols-2 gap-4 text-xs">
              <div>
                <div className="font-bold text-emerald-300">Admin &amp; Guru</div>
                <div className="text-white/85 mt-1">
                  Input nilai otomatis (KKM &amp; predikat A–D), catatan wali, portofolio, &amp; ekspor PDF 6 halaman.
                </div>
              </div>
              <div>
                <div className="font-bold text-sky-300">Santri &amp; Orang Tua</div>
                <div className="text-white/85 mt-1">
                  Pantau 5 pilar kompetensi, grafik progres antar semester, tahfidz, serta QR portofolio karya.
                </div>
              </div>
            </div>
          </div>

          {/* Right Sign-In Card */}
          <div className="lg:col-span-6 bg-white border border-slate-200 rounded-3xl p-8 flex flex-col justify-center space-y-6">
            <div>
              <div className="text-xs font-mono font-semibold text-emerald-700">
                PONDOK PESANTREN DARUL FITHRAH
              </div>
              <h2 className="font-display font-bold text-2xl text-slate-900 mt-1">
                Masuk ke Sistem Rapor MDA
              </h2>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                Gunakan akun Google untuk menyambungkan dashboard secara langsung dengan Google Sheets dan Google Drive penyimpanan karya santri.
              </p>
            </div>

            {authError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700">
                {authError}
              </div>
            )}

            <div className="space-y-3">
              <button
                type="button"
                onClick={handleGoogleLogin}
                className="gsi-material-button w-full"
              >
                <div className="gsi-material-button-state" />
                <div className="gsi-material-button-content-wrapper">
                  <div className="gsi-material-button-icon">
                    <svg viewBox="0 0 48 48" className="block w-full h-full">
                      <path
                        fill="#EA4335"
                        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                      />
                      <path
                        fill="#4285F4"
                        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                      />
                      <path
                        fill="#34A853"
                        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                      />
                    </svg>
                  </div>
                  <span className="gsi-material-button-contents">
                    Sign in with Google
                  </span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setGuestPreviewMode(true)}
                className="w-full py-2.5 px-4 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-700 transition-colors"
              >
                Lihat Pratinjau Dashboard (Data Contoh Alwan Hanif)
              </button>
            </div>

            <div className="pt-4 border-t border-slate-100 text-[11px] text-slate-500 leading-relaxed">
              Nuricik RT 3/V, Desa Grajegan, Kec. Tawangsari, Sukoharjo, Jawa Tengah · @muslimdigitalacademy
            </div>
          </div>
        </div>
      </div>
    );
  }

  const navItems: {
    id: NavSection;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    roles: UserRole[];
  }[] = [
    {
      id: 'overview',
      label: 'Ringkasan Akademik',
      icon: LayoutDashboard,
      roles: ['admin', 'guru'],
    },
    {
      id: 'master',
      label: 'Santri, Guru & Periode',
      icon: Users,
      roles: ['admin', 'guru'],
    },
    {
      id: 'grading',
      label: 'Input & Hitung Nilai',
      icon: PenSquare,
      roles: ['admin', 'guru'],
    },
    {
      id: 'portal',
      label: 'Portal Santri & Ortu',
      icon: GraduationCap,
      roles: ['admin', 'guru', 'santri_ortu'],
    },
    {
      id: 'portfolio',
      label: 'Student Portfolio',
      icon: FolderGit2,
      roles: ['admin', 'guru', 'santri_ortu'],
    },
    {
      id: 'sheets',
      label: 'Google Sheets & Akses',
      icon: Database,
      roles: ['admin'],
    },
  ];

  const visibleNavItems = navItems.filter((n) => n.roles.includes(effectiveRole));
  const uniqueYears = Array.from(new Set(db.periods.map((p) => p.tahunAkademik)));

  return (
    <div className="min-h-screen bg-[#f6fbf9] flex flex-col md:flex-row">
      {/* Left Sidebar (Desktop) */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-slate-200 flex flex-col justify-between transition-transform duration-200 md:static md:translate-x-0 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div>
          <div className="h-16 px-5 border-b border-slate-200 flex items-center justify-between">
            <MdaLogo size="sm" />
            <button
              type="button"
              onClick={() => setMobileMenuOpen(false)}
              className="md:hidden p-1.5 rounded-lg text-slate-500 hover:bg-slate-100"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <nav className="p-3 space-y-1">
            {visibleNavItems.map((item) => {
              const Icon = item.icon;
              const active = activeNav === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setActiveNav(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold transition-colors whitespace-nowrap ${
                    active
                      ? 'bg-emerald-600 text-white'
                      : 'text-slate-700 hover:bg-emerald-50 hover:text-emerald-900'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Google Sheets Sync Card */}
          <div className="mx-3 mt-4 p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
            <div className="flex items-center justify-between font-semibold text-slate-800">
              <span className="inline-flex items-center gap-1.5">
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
                <span>Google Sheets</span>
              </span>
              <span className="text-[11px] font-mono text-emerald-700">
                {db.spreadsheetId ? 'Tersambung' : 'Lokal'}
              </span>
            </div>
            <div className="text-[11px] text-slate-500 truncate">
              {db.spreadsheetId
                ? db.spreadsheetTitle || db.spreadsheetId
                : 'Belum terhubung ke spreadsheet'}
            </div>
            {!hasAccessToken ? (
              <button
                type="button"
                onClick={handleGoogleLogin}
                className="w-full py-1.5 px-2.5 rounded-lg bg-slate-900 text-white text-[11px] font-semibold hover:bg-slate-800"
              >
                Hubungkan Akun Google
              </button>
            ) : !db.spreadsheetId ? (
              <button
                type="button"
                onClick={() => setActiveNav('sheets')}
                className="w-full py-1.5 px-2.5 rounded-lg bg-emerald-600 text-white text-[11px] font-semibold hover:bg-emerald-700"
              >
                Buat / Pilih Spreadsheet
              </button>
            ) : (
              <button
                type="button"
                disabled={isSyncing}
                onClick={handlePushToSheets}
                className="w-full py-1.5 px-2.5 rounded-lg bg-white border border-slate-200 text-slate-700 text-[11px] font-semibold hover:bg-slate-100 inline-flex items-center justify-center gap-1"
              >
                <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{isSyncing ? 'Menyinkronkan...' : 'Sinkronkan Sheets'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Account & Role Footer */}
        <div className="p-3 border-t border-slate-200 space-y-2">
          {actualRole === 'admin' && (
            <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
              <div className="text-[10px] font-semibold text-slate-500 mb-1">
                Pratinjau Peran Portal
              </div>
              <select
                value={previewRole}
                onChange={(e) => setPreviewRole(e.target.value as UserRole)}
                className="w-full text-xs font-semibold text-slate-800 bg-white border border-slate-200 rounded-md px-2 py-1"
              >
                <option value="admin">Dashboard Admin</option>
                <option value="guru">Dashboard Guru / Wali</option>
                <option value="santri_ortu">Portal Santri &amp; Ortu</option>
              </select>
            </div>
          )}

          <div className="flex items-center justify-between gap-2 px-1">
            <div className="min-w-0">
              <div className="text-xs font-semibold text-slate-900 truncate">
                {authUser?.displayName || 'Mode Pratinjau'}
              </div>
              <div className="text-[11px] text-slate-500 truncate">
                {authUser?.email || 'Data Contoh MDA'}
              </div>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors shrink-0"
              title="Keluar"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top Bar Contract: Breadcrumb on left, Period/Print actions on right */}
        <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100"
              aria-label="Menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="min-w-0">
              <div className="text-xs text-slate-500 truncate">
                Muslim Digital Academy · Darul Fithrah
              </div>
              <div className="font-display font-bold text-slate-900 text-sm sm:text-base truncate">
                {visibleNavItems.find((i) => i.id === activeNav)?.label ||
                  'Dashboard Rapor'}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="hidden sm:flex items-center gap-1.5">
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="px-2.5 py-1.5 text-xs font-mono font-semibold bg-slate-50 border border-slate-200 rounded-lg"
                aria-label="Tahun Akademik"
              >
                {uniqueYears.map((yr) => (
                  <option key={yr} value={yr}>
                    {yr}
                  </option>
                ))}
              </select>
              <select
                value={selectedSemester}
                onChange={(e) =>
                  setSelectedSemester(e.target.value as 'Gasal' | 'Genap')
                }
                className="px-2.5 py-1.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg"
                aria-label="Semester"
              >
                <option value="Gasal">Gasal</option>
                <option value="Genap">Genap</option>
              </select>
            </div>

            <button
              type="button"
              onClick={() => setPrintMode(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 whitespace-nowrap shrink-0"
            >
              <Printer className="w-3.5 h-3.5 text-emerald-400" />
              <span>Cetak PDF</span>
            </button>
          </div>
        </header>

        {/* Toast Notification */}
        {toast && (
          <div className="px-4 sm:px-6 pt-4">
            <div
              className={`px-4 py-2.5 rounded-xl border text-xs font-medium flex items-center justify-between gap-3 ${
                toast.type === 'ok'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-rose-50 border-rose-200 text-rose-800'
              }`}
            >
              <span className="inline-flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{toast.text}</span>
              </span>
              <button
                type="button"
                onClick={() => setToast(null)}
                className="text-slate-500 hover:text-slate-800"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Active Viewport */}
        <main className="flex-1 p-4 sm:p-6 max-w-[1360px] w-full mx-auto">
          {activeNav === 'overview' && (
            <AdminDashboardView
              db={db}
              selectedYear={selectedYear}
              selectedSemester={selectedSemester}
              onOpenGradeEditor={(id) => {
                setSelectedStudentId(id);
                setActiveNav('grading');
              }}
              onOpenStudentPortal={(id) => {
                setSelectedStudentId(id);
                setActiveNav('portal');
              }}
              onOpenPrintReport={(id) => {
                setSelectedStudentId(id);
                setPrintMode(true);
              }}
              onOpenPortfolio={(id) => {
                setSelectedStudentId(id);
                setActiveNav('portfolio');
              }}
            />
          )}

          {activeNav === 'master' && (
            <MasterManagementView
              db={db}
              canManageAll={effectiveRole === 'admin'}
              onSaveStudents={handleSaveStudents}
              onSaveTeachers={handleSaveTeachers}
              onSavePeriods={handleSavePeriods}
              onUploadPhotoToDrive={async (file) => {
                const res = await handleUploadToDrive(file);
                return res ? res.url : null;
              }}
            />
          )}

          {activeNav === 'grading' && (
            <GradeEditorView
              db={db}
              selectedStudentId={selectedStudentId}
              selectedYear={selectedYear}
              selectedSemester={selectedSemester}
              onSelectStudent={setSelectedStudentId}
              onSaveReport={handleSaveReport}
              onOpenPrint={(id) => {
                setSelectedStudentId(id);
                setPrintMode(true);
              }}
            />
          )}

          {activeNav === 'portal' && (
            <StudentPortalView
              db={db}
              studentId={lockedStudentId || selectedStudentId}
              selectedYear={selectedYear}
              selectedSemester={selectedSemester}
              allowStudentSwitch={effectiveRole !== 'santri_ortu'}
              onSelectStudent={setSelectedStudentId}
              onOpenPrint={(id) => {
                setSelectedStudentId(id);
                setPrintMode(true);
              }}
              onOpenPortfolio={(id) => {
                setSelectedStudentId(id);
                setActiveNav('portfolio');
              }}
            />
          )}

          {activeNav === 'portfolio' && (
            <PortfolioHubView
              db={db}
              studentId={lockedStudentId || selectedStudentId}
              canEdit={effectiveRole === 'admin' || effectiveRole === 'guru'}
              onSelectStudent={
                effectiveRole !== 'santri_ortu' ? setSelectedStudentId : undefined
              }
              onSavePortfolios={handleSavePortfolios}
              onUploadMediaToDrive={handleUploadToDrive}
            />
          )}

          {activeNav === 'sheets' && effectiveRole === 'admin' && (
            <SettingsSheetsView
              db={db}
              isGoogleConnected={hasAccessToken}
              userEmail={authUser?.email || null}
              isSyncing={isSyncing}
              onGoogleLogin={handleGoogleLogin}
              onCreateSpreadsheet={handleCreateSpreadsheet}
              onConnectSpreadsheet={handleConnectSpreadsheet}
              onPushToSheets={handlePushToSheets}
              onPullFromSheets={handlePullFromSheets}
              onRestoreBackupJson={handleRestoreBackup}
              onSaveUserAccess={handleSaveUserAccess}
            />
          )}
        </main>
      </div>

      {/* Global Confirmation Modal for Google Sheets / Drive Mutations */}
      <ConfirmDialog
        dialog={confirmDialog}
        onClose={() => setConfirmDialog((d) => ({ ...d, open: false }))}
      />
    </div>
  );
}
