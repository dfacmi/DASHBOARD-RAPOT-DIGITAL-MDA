import React, { useState } from 'react';
import { Calendar, Plus, Trash2, Upload, UserCheck, Users } from 'lucide-react';
import {
  AcademicPeriod,
  MdaDatabase,
  Student,
  TeacherClass,
} from '../types/mda';
import { slugifyName } from '../utils/grading';
import { StudentAvatar } from './MdaLogo';

interface MasterManagementViewProps {
  db: MdaDatabase;
  canManageAll: boolean;
  onSaveStudents: (students: Student[]) => void;
  onSaveTeachers: (teachers: TeacherClass[]) => void;
  onSavePeriods: (periods: AcademicPeriod[]) => void;
  onUploadPhotoToDrive: (file: File) => Promise<string | null>;
}

export const MasterManagementView: React.FC<MasterManagementViewProps> = ({
  db,
  canManageAll,
  onSaveStudents,
  onSaveTeachers,
  onSavePeriods,
  onUploadPhotoToDrive,
}) => {
  const [activeTab, setActiveTab] = useState<'santri' | 'guru' | 'periode'>('santri');
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [editingTeacher, setEditingTeacher] = useState<TeacherClass | null>(null);
  const [editingPeriod, setEditingPeriod] = useState<AcademicPeriod | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const handleNewStudent = () => {
    const defaultTeacher = db.teachers[0];
    setEditingStudent({
      id: `std-${Date.now()}`,
      nisnMda: `MDA02.2627.${Math.floor(800 + Math.random() * 190)}`,
      nama: '',
      kelas: 'MDA Senior',
      program: 'Muslim Digital Academy – Senior',
      waliKelasId: defaultTeacher?.id || '',
      waliKelasNama: defaultTeacher?.nama || '',
      fotoUrl: '',
      emailSantriOrtu: '',
      portfolioSlug: '',
      statusAktif: 'Aktif',
    });
  };

  const handleSaveStudentForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent || !editingStudent.nama.trim()) return;
    const wali = db.teachers.find((t) => t.id === editingStudent.waliKelasId);
    const cleaned: Student = {
      ...editingStudent,
      waliKelasNama: wali ? wali.nama : editingStudent.waliKelasNama,
      portfolioSlug:
        editingStudent.portfolioSlug.trim() || slugifyName(editingStudent.nama),
    };
    const exists = db.students.some((s) => s.id === cleaned.id);
    const next = exists
      ? db.students.map((s) => (s.id === cleaned.id ? cleaned : s))
      : [...db.students, cleaned];
    onSaveStudents(next);
    setEditingStudent(null);
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingStudent) return;
    setUploadingPhoto(true);
    try {
      const url = await onUploadPhotoToDrive(file);
      if (url) {
        setEditingStudent({ ...editingStudent, fotoUrl: url });
      }
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleNewTeacher = () => {
    setEditingTeacher({
      id: `guru-${Date.now()}`,
      nama: '',
      jabatan: 'Wali Kelas & Pengajar',
      email: '',
      kelasDiampu: 'MDA Senior',
      role: 'guru',
    });
  };

  const handleSaveTeacherForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTeacher || !editingTeacher.nama.trim()) return;
    const exists = db.teachers.some((t) => t.id === editingTeacher.id);
    const next = exists
      ? db.teachers.map((t) => (t.id === editingTeacher.id ? editingTeacher : t))
      : [...db.teachers, editingTeacher];
    onSaveTeachers(next);
    setEditingTeacher(null);
  };

  const handleNewPeriod = () => {
    setEditingPeriod({
      id: `per-${Date.now()}`,
      tahunAkademik: '2026/2027',
      semester: 'Genap',
      tanggalRapor: '20 Juni 2027',
      kkmDiniyah: 60,
      kkmTahfidz: 70,
      kkmDigital: 60,
      kepalaUnitMda: 'Ustadz Azmuhu Syahid, S. Pd',
      mudirPesantren: 'Ustadz Yahya Setiyawan, S. Pd.I, M. Pd',
      isActive: false,
    });
  };

  const handleSavePeriodForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPeriod) return;
    let next = db.periods.some((p) => p.id === editingPeriod.id)
      ? db.periods.map((p) => (p.id === editingPeriod.id ? editingPeriod : p))
      : [...db.periods, editingPeriod];
    if (editingPeriod.isActive) {
      next = next.map((p) => ({ ...p, isActive: p.id === editingPeriod.id }));
    }
    onSavePeriods(next);
    setEditingPeriod(null);
  };

  return (
    <div className="space-y-6">
      {/* Sub-Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white border border-slate-200 rounded-xl p-3">
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
          <button
            type="button"
            onClick={() => setActiveTab('santri')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors whitespace-nowrap ${
              activeTab === 'santri'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Data Santri ({db.students.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('guru')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors whitespace-nowrap ${
              activeTab === 'guru'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Guru & Wali Kelas ({db.teachers.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('periode')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors whitespace-nowrap ${
              activeTab === 'periode'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Semester & KKM ({db.periods.length})</span>
          </button>
        </div>

        {activeTab === 'santri' && (
          <button
            type="button"
            onClick={handleNewStudent}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition-colors whitespace-nowrap shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Santri</span>
          </button>
        )}
        {activeTab === 'guru' && canManageAll && (
          <button
            type="button"
            onClick={handleNewTeacher}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition-colors whitespace-nowrap shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Guru</span>
          </button>
        )}
        {activeTab === 'periode' && canManageAll && (
          <button
            type="button"
            onClick={handleNewPeriod}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition-colors whitespace-nowrap shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Semester</span>
          </button>
        )}
      </div>

      {/* TAB: SANTRI */}
      {activeTab === 'santri' && (
        <div className="space-y-4">
          {editingStudent && (
            <form
              onSubmit={handleSaveStudentForm}
              className="bg-white border border-emerald-200 rounded-xl p-5 space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-display font-bold text-slate-900 text-sm">
                  {db.students.some((s) => s.id === editingStudent.id)
                    ? 'Edit Profil Santri'
                    : 'Tambah Santri Baru'}
                </h3>
                <button
                  type="button"
                  onClick={() => setEditingStudent(null)}
                  className="text-xs text-slate-500 hover:text-slate-800"
                >
                  Tutup
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ID Santri MDA
                  </label>
                  <input
                    type="text"
                    required
                    value={editingStudent.nisnMda}
                    onChange={(e) =>
                      setEditingStudent({ ...editingStudent, nisnMda: e.target.value })
                    }
                    className="w-full px-3 py-2 text-xs font-mono border border-slate-200 rounded-lg"
                    placeholder="MDA02.2526.791"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nama Lengkap Santri
                  </label>
                  <input
                    type="text"
                    required
                    value={editingStudent.nama}
                    onChange={(e) =>
                      setEditingStudent({ ...editingStudent, nama: e.target.value })
                    }
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
                    placeholder="Alwan Hanif"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Kelas
                  </label>
                  <select
                    value={editingStudent.kelas}
                    onChange={(e) =>
                      setEditingStudent({
                        ...editingStudent,
                        kelas: e.target.value,
                        program: `Muslim Digital Academy – ${e.target.value.replace('MDA ', '')}`,
                      })
                    }
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                  >
                    <option value="MDA Junior">MDA Junior</option>
                    <option value="MDA Intermediate">MDA Intermediate</option>
                    <option value="MDA Senior">MDA Senior</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Wali Kelas
                  </label>
                  <select
                    value={editingStudent.waliKelasId}
                    onChange={(e) =>
                      setEditingStudent({ ...editingStudent, waliKelasId: e.target.value })
                    }
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                  >
                    {db.teachers.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.nama}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Email Google Santri / Orang Tua
                  </label>
                  <input
                    type="email"
                    value={editingStudent.emailSantriOrtu}
                    onChange={(e) =>
                      setEditingStudent({
                        ...editingStudent,
                        emailSantriOrtu: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
                    placeholder="wali.santri@gmail.com"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Slug Link Portofolio Unik
                  </label>
                  <input
                    type="text"
                    value={editingStudent.portfolioSlug}
                    onChange={(e) =>
                      setEditingStudent({
                        ...editingStudent,
                        portfolioSlug: slugifyName(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 text-xs font-mono border border-slate-200 rounded-lg"
                    placeholder="alwan-hanif"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Foto Profil Santri (URL atau Upload ke Google Drive)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="url"
                      value={editingStudent.fotoUrl}
                      onChange={(e) =>
                        setEditingStudent({ ...editingStudent, fotoUrl: e.target.value })
                      }
                      className="flex-1 px-3 py-2 text-xs border border-slate-200 rounded-lg"
                      placeholder="https://..."
                    />
                    <label className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-medium text-slate-700 cursor-pointer whitespace-nowrap">
                      <Upload className="w-3.5 h-3.5" />
                      <span>{uploadingPhoto ? 'Mengunggah...' : 'Upload Foto'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Status Santri
                  </label>
                  <select
                    value={editingStudent.statusAktif}
                    onChange={(e) =>
                      setEditingStudent({
                        ...editingStudent,
                        statusAktif: e.target.value as Student['statusAktif'],
                      })
                    }
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                  >
                    <option value="Aktif">Aktif</option>
                    <option value="Alumni">Alumni</option>
                    <option value="Cuti">Cuti</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingStudent(null)}
                  className="px-4 py-2 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700"
                >
                  Simpan Data Santri
                </button>
              </div>
            </form>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {db.students.map((student) => (
              <div
                key={student.id}
                className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col justify-between gap-4"
              >
                <div className="flex items-start gap-3">
                  <StudentAvatar
                    name={student.nama}
                    fotoUrl={student.fotoUrl}
                    className="w-12 h-12 text-sm shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="font-display font-bold text-slate-900 text-sm truncate">
                      {student.nama}
                    </div>
                    <div className="font-mono text-xs text-emerald-700 font-semibold">
                      {student.nisnMda}
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      {student.kelas} · {student.statusAktif}
                    </div>
                  </div>
                </div>

                <div className="text-xs text-slate-600 space-y-1 border-t border-slate-100 pt-3">
                  <div className="truncate">
                    <span className="text-slate-400">Wali Kelas:</span>{' '}
                    {student.waliKelasNama}
                  </div>
                  <div className="truncate">
                    <span className="text-slate-400">Email Ortu:</span>{' '}
                    {student.emailSantriOrtu || '—'}
                  </div>
                  <div className="truncate font-mono text-[11px] text-slate-500">
                    ?portfolio={student.portfolioSlug}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setEditingStudent(student)}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Edit
                  </button>
                  {canManageAll && (
                    <button
                      type="button"
                      onClick={() =>
                        onSaveStudents(db.students.filter((s) => s.id !== student.id))
                      }
                      className="p-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50"
                      title="Hapus Santri"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB: GURU & KELAS */}
      {activeTab === 'guru' && (
        <div className="space-y-4">
          {editingTeacher && (
            <form
              onSubmit={handleSaveTeacherForm}
              className="bg-white border border-emerald-200 rounded-xl p-5 space-y-4"
            >
              <h3 className="font-display font-bold text-slate-900 text-sm">
                Form Data Ustadz / Wali Kelas
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nama Lengkap & Gelar
                  </label>
                  <input
                    type="text"
                    required
                    value={editingTeacher.nama}
                    onChange={(e) =>
                      setEditingTeacher({ ...editingTeacher, nama: e.target.value })
                    }
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Jabatan / Bidang
                  </label>
                  <input
                    type="text"
                    required
                    value={editingTeacher.jabatan}
                    onChange={(e) =>
                      setEditingTeacher({ ...editingTeacher, jabatan: e.target.value })
                    }
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Email Google
                  </label>
                  <input
                    type="email"
                    required
                    value={editingTeacher.email}
                    onChange={(e) =>
                      setEditingTeacher({ ...editingTeacher, email: e.target.value })
                    }
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Kelas Diampu
                  </label>
                  <input
                    type="text"
                    value={editingTeacher.kelasDiampu}
                    onChange={(e) =>
                      setEditingTeacher({ ...editingTeacher, kelasDiampu: e.target.value })
                    }
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Role Sistem
                  </label>
                  <select
                    value={editingTeacher.role}
                    onChange={(e) =>
                      setEditingTeacher({
                        ...editingTeacher,
                        role: e.target.value as 'admin' | 'guru',
                      })
                    }
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                  >
                    <option value="guru">Guru / Wali Kelas</option>
                    <option value="admin">Admin MDA</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingTeacher(null)}
                  className="px-4 py-2 rounded-lg border border-slate-200 text-xs font-medium"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-xs font-semibold"
                >
                  Simpan Guru
                </button>
              </div>
            </form>
          )}

          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-900 text-white">
                  <th className="py-3 px-4">Nama Pengajar</th>
                  <th className="py-3 px-4">Jabatan</th>
                  <th className="py-3 px-4">Kelas Diampu</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Role</th>
                  {canManageAll && <th className="py-3 px-4 text-right">Aksi</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {db.teachers.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-semibold text-slate-900">{t.nama}</td>
                    <td className="py-3 px-4 text-slate-600">{t.jabatan}</td>
                    <td className="py-3 px-4 text-slate-700">{t.kelasDiampu}</td>
                    <td className="py-3 px-4 font-mono text-slate-600">{t.email}</td>
                    <td className="py-3 px-4 uppercase font-semibold text-emerald-700">
                      {t.role}
                    </td>
                    {canManageAll && (
                      <td className="py-3 px-4 text-right space-x-2">
                        <button
                          type="button"
                          onClick={() => setEditingTeacher(t)}
                          className="text-emerald-700 hover:underline font-medium"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            onSaveTeachers(db.teachers.filter((x) => x.id !== t.id))
                          }
                          className="text-rose-600 hover:underline font-medium"
                        >
                          Hapus
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB: PERIODE & KKM */}
      {activeTab === 'periode' && (
        <div className="space-y-4">
          {editingPeriod && (
            <form
              onSubmit={handleSavePeriodForm}
              className="bg-white border border-emerald-200 rounded-xl p-5 space-y-4"
            >
              <h3 className="font-display font-bold text-slate-900 text-sm">
                Pengaturan Semester, KKM & Pengesahan Rapor
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tahun Akademik
                  </label>
                  <input
                    type="text"
                    required
                    value={editingPeriod.tahunAkademik}
                    onChange={(e) =>
                      setEditingPeriod({ ...editingPeriod, tahunAkademik: e.target.value })
                    }
                    className="w-full px-3 py-2 text-xs font-mono border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Semester
                  </label>
                  <select
                    value={editingPeriod.semester}
                    onChange={(e) =>
                      setEditingPeriod({
                        ...editingPeriod,
                        semester: e.target.value as 'Gasal' | 'Genap',
                      })
                    }
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                  >
                    <option value="Gasal">Gasal</option>
                    <option value="Genap">Genap</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tanggal Pembagian Rapor
                  </label>
                  <input
                    type="text"
                    required
                    value={editingPeriod.tanggalRapor}
                    onChange={(e) =>
                      setEditingPeriod({ ...editingPeriod, tanggalRapor: e.target.value })
                    }
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
                  />
                </div>
                <div className="flex items-end pb-2">
                  <label className="inline-flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingPeriod.isActive}
                      onChange={(e) =>
                        setEditingPeriod({ ...editingPeriod, isActive: e.target.checked })
                      }
                      className="rounded border-slate-300 text-emerald-600"
                    />
                    <span>Jadikan Semester Aktif</span>
                  </label>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    KKM Diniyah
                  </label>
                  <input
                    type="number"
                    value={editingPeriod.kkmDiniyah}
                    onChange={(e) =>
                      setEditingPeriod({
                        ...editingPeriod,
                        kkmDiniyah: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 text-xs font-mono border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    KKM Tahfidz
                  </label>
                  <input
                    type="number"
                    value={editingPeriod.kkmTahfidz}
                    onChange={(e) =>
                      setEditingPeriod({
                        ...editingPeriod,
                        kkmTahfidz: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 text-xs font-mono border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    KKM Skill Digital
                  </label>
                  <input
                    type="number"
                    value={editingPeriod.kkmDigital}
                    onChange={(e) =>
                      setEditingPeriod({
                        ...editingPeriod,
                        kkmDigital: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 text-xs font-mono border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Kepala Unit MDA
                  </label>
                  <input
                    type="text"
                    value={editingPeriod.kepalaUnitMda}
                    onChange={(e) =>
                      setEditingPeriod({ ...editingPeriod, kepalaUnitMda: e.target.value })
                    }
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Mudir / Kepala Pesantren
                  </label>
                  <input
                    type="text"
                    value={editingPeriod.mudirPesantren}
                    onChange={(e) =>
                      setEditingPeriod({ ...editingPeriod, mudirPesantren: e.target.value })
                    }
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingPeriod(null)}
                  className="px-4 py-2 rounded-lg border border-slate-200 text-xs font-medium"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-xs font-semibold"
                >
                  Simpan Periode
                </button>
              </div>
            </form>
          )}

          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-900 text-white">
                  <th className="py-3 px-4">Tahun Akademik</th>
                  <th className="py-3 px-4">Semester</th>
                  <th className="py-3 px-4">Tanggal Rapor</th>
                  <th className="py-3 px-4">KKM (D / T / SD)</th>
                  <th className="py-3 px-4">Kepala Unit & Mudir</th>
                  <th className="py-3 px-4">Status</th>
                  {canManageAll && <th className="py-3 px-4 text-right">Aksi</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {db.periods.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-mono font-semibold text-slate-900">
                      {p.tahunAkademik}
                    </td>
                    <td className="py-3 px-4 font-medium">{p.semester}</td>
                    <td className="py-3 px-4 text-slate-600">{p.tanggalRapor}</td>
                    <td className="py-3 px-4 font-mono tabular-nums">
                      {p.kkmDiniyah} / {p.kkmTahfidz} / {p.kkmDigital}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      <div>{p.kepalaUnitMda}</div>
                      <div className="text-[11px] text-slate-400">{p.mudirPesantren}</div>
                    </td>
                    <td className="py-3 px-4 font-semibold">
                      {p.isActive ? (
                        <span className="text-emerald-700">Aktif</span>
                      ) : (
                        <span className="text-slate-400">Arsip</span>
                      )}
                    </td>
                    {canManageAll && (
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => setEditingPeriod(p)}
                          className="text-emerald-700 hover:underline font-medium"
                        >
                          Edit
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
