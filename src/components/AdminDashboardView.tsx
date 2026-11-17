import React, { useMemo, useState } from 'react';
import {
  Award,
  BookOpen,
  ExternalLink,
  FileSpreadsheet,
  FolderGit2,
  PenSquare,
  Printer,
  Search,
  Users,
} from 'lucide-react';
import { MdaDatabase, PillarSummary, Student } from '../types/mda';
import {
  formatRupiah,
  hitungPredikat,
  hitungRataRataDigital,
  hitungRataRataDiniyah,
} from '../utils/grading';
import { RadarFivePillarsChart } from './Charts';
import { StudentAvatar } from './MdaLogo';

interface AdminDashboardViewProps {
  db: MdaDatabase;
  selectedYear: string;
  selectedSemester: 'Gasal' | 'Genap';
  onOpenGradeEditor: (studentId: string) => void;
  onOpenStudentPortal: (studentId: string) => void;
  onOpenPrintReport: (studentId: string) => void;
  onOpenPortfolio: (studentId: string) => void;
}

export const AdminDashboardView: React.FC<AdminDashboardViewProps> = ({
  db,
  selectedYear,
  selectedSemester,
  onOpenGradeEditor,
  onOpenStudentPortal,
  onOpenPrintReport,
  onOpenPortfolio,
}) => {
  const [classFilter, setClassFilter] = useState<string>('Semua');
  const [searchQuery, setSearchQuery] = useState('');

  const classOptions = useMemo(() => {
    const set = new Set<string>(['Semua']);
    db.students.forEach((s) => set.add(s.kelas));
    return Array.from(set);
  }, [db.students]);

  const filteredStudents = useMemo(() => {
    return db.students.filter((s) => {
      const matchClass = classFilter === 'Semua' || s.kelas === classFilter;
      const q = searchQuery.trim().toLowerCase();
      const matchSearch =
        q === '' ||
        s.nama.toLowerCase().includes(q) ||
        s.nisnMda.toLowerCase().includes(q) ||
        s.waliKelasNama.toLowerCase().includes(q);
      return matchClass && matchSearch;
    });
  }, [db.students, classFilter, searchQuery]);

  const periodReports = useMemo(() => {
    const ids = new Set(filteredStudents.map((s) => s.id));
    return db.reports.filter(
      (r) =>
        ids.has(r.studentId) &&
        r.tahunAkademik === selectedYear &&
        r.semester === selectedSemester
    );
  }, [db.reports, filteredStudents, selectedYear, selectedSemester]);

  const cohortStats = useMemo(() => {
    const count = periodReports.length || 1;
    const avgPilar: PillarSummary = {
      penguasaanMultimedia: Math.round(
        periodReports.reduce((a, r) => a + r.pilar.penguasaanMultimedia, 0) / count
      ),
      diniyahPembelajaran: Math.round(
        periodReports.reduce((a, r) => a + r.pilar.diniyahPembelajaran, 0) / count
      ),
      tahfidzulQuran: Math.round(
        periodReports.reduce((a, r) => a + r.pilar.tahfidzulQuran, 0) / count
      ),
      kesantrianKeasramaan: Math.round(
        periodReports.reduce((a, r) => a + r.pilar.kesantrianKeasramaan, 0) / count
      ),
      characterBuilding: Math.round(
        periodReports.reduce((a, r) => a + r.pilar.characterBuilding, 0) / count
      ),
      autoCalculate: false,
    };

    const avgTahfidz =
      Math.round(
        (periodReports.reduce((a, r) => a + r.tahfidz.nilaiAkhir, 0) / count) * 10
      ) / 10;

    const avgDiniyah =
      Math.round(
        (periodReports.reduce((a, r) => a + hitungRataRataDiniyah(r.diniyah), 0) / count) *
          10
      ) / 10;

    const avgDigital =
      Math.round(
        (periodReports.reduce((a, r) => a + hitungRataRataDigital(r.skillDigital), 0) /
          count) *
          10
      ) / 10;

    const totalIncome = periodReports.reduce((a, r) => a + (r.kpiMda.incomeRp || 0), 0);
    const totalProjects = db.portfolios.filter((p) =>
      filteredStudents.some((s) => s.id === p.studentId)
    ).length;

    return {
      avgPilar,
      avgTahfidz,
      avgDiniyah,
      avgDigital,
      totalIncome,
      totalProjects,
    };
  }, [periodReports, db.portfolios, filteredStudents]);

  const getReportForStudent = (student: Student) =>
    db.reports.find(
      (r) =>
        r.studentId === student.id &&
        r.tahunAkademik === selectedYear &&
        r.semester === selectedSemester
    );

  return (
    <div className="space-y-6">
      {/* KPI Summary Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Santri Terdaftar</span>
            <Users className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 font-display font-bold text-2xl text-slate-900 tabular-nums">
            {filteredStudents.length}
          </div>
          <div className="mt-1 text-xs text-slate-500">
            {periodReports.length} rapor aktif · {selectedSemester}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Rata-rata Tahfidz</span>
            <BookOpen className="w-4 h-4 text-sky-600" />
          </div>
          <div className="mt-2 font-display font-bold text-2xl text-slate-900 tabular-nums">
            {cohortStats.avgTahfidz || '—'}
          </div>
          <div className="mt-1 text-xs text-slate-500">
            Predikat {hitungPredikat(cohortStats.avgTahfidz || 0)} · Target KKM 70
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Rata-rata Diniyah</span>
            <Award className="w-4 h-4 text-teal-600" />
          </div>
          <div className="mt-2 font-display font-bold text-2xl text-slate-900 tabular-nums">
            {cohortStats.avgDiniyah || '—'}
          </div>
          <div className="mt-1 text-xs text-slate-500">
            5 Kitab Wajib · KKM 60
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Skill Digital</span>
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 font-display font-bold text-2xl text-slate-900 tabular-nums">
            {cohortStats.avgDigital || '—'}
          </div>
          <div className="mt-1 text-xs text-slate-500">
            UI/UX · Desain · Foto · Video
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Portofolio & Income</span>
            <FolderGit2 className="w-4 h-4 text-emerald-700" />
          </div>
          <div className="mt-2 font-display font-bold text-2xl text-slate-900 tabular-nums">
            {cohortStats.totalProjects} Karya
          </div>
          <div className="mt-1 text-xs text-slate-500 tabular-nums">
            Total Income {formatRupiah(cohortStats.totalIncome)}
          </div>
        </div>
      </div>

      {/* Cohort 5-Pillar Overview + Filter Toolbar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="font-display font-bold text-slate-900 text-base">
                Profil 5 Pilar Kompetensi MDA
              </h2>
              <p className="text-xs text-slate-500">
                Rata-rata capaian kelas {classFilter} · {selectedSemester} {selectedYear}
              </p>
            </div>
          </div>

          <RadarFivePillarsChart
            current={cohortStats.avgPilar}
            currentLabel={`Rata-rata ${classFilter}`}
          />
        </div>

        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between">
          <div>
            <h2 className="font-display font-bold text-slate-900 text-base">
              Kalkulasi 5 Pilar Utama Semester Ini
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Mengacu pada format Competence Report Muslim Digital Academy
            </p>

            <div className="mt-5 space-y-4">
              {[
                {
                  label: 'Penguasaan Multimedia',
                  value: cohortStats.avgPilar.penguasaanMultimedia,
                },
                {
                  label: 'Diniyah dan Pembelajaran',
                  value: cohortStats.avgPilar.diniyahPembelajaran,
                },
                {
                  label: "Tahfidzul Qur'an",
                  value: cohortStats.avgPilar.tahfidzulQuran,
                },
                {
                  label: 'Kesantrian dan Keasramaan',
                  value: cohortStats.avgPilar.kesantrianKeasramaan,
                },
                {
                  label: 'Character Building',
                  value: cohortStats.avgPilar.characterBuilding,
                },
              ].map((row) => (
                <div key={row.label} className="flex items-center gap-4">
                  <div className="flex-1">
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-1.5">
                      <span>{row.label}</span>
                    </div>
                    <div className="h-3.5 w-full bg-emerald-50 rounded-full overflow-hidden border border-emerald-100">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-300"
                        style={{ width: `${Math.min(100, row.value)}%` }}
                      />
                    </div>
                  </div>
                  <div className="w-16 py-1 text-center rounded-md bg-slate-900 text-white font-mono text-xs font-semibold tabular-nums shrink-0">
                    {row.value}%
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
            <span>Skala Predikat: A (90–100) · B (80–89) · C (70–79) · D (&lt;70)</span>
            <span>Dasar: Kalkulasi penilaian direktarium</span>
          </div>
        </div>
      </div>

      {/* High-Density Student Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="font-display font-bold text-slate-900 text-base">
              Daftar Rapor & Portofolio Santri
            </h2>
            <p className="text-xs text-slate-500">
              Pilih santri untuk input nilai, lihat portal rapor, cetak PDF resmi, atau buka portofolio
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
              {classOptions.map((cls) => (
                <button
                  key={cls}
                  type="button"
                  onClick={() => setClassFilter(cls)}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                    classFilter === cls
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {cls}
                </button>
              ))}
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama / ID santri..."
                className="pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 w-52"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900 text-white text-xs font-semibold">
                <th className="py-3 px-4">Santri & ID</th>
                <th className="py-3 px-3">Kelas & Wali</th>
                <th className="py-3 px-3 text-right">Tahfidz</th>
                <th className="py-3 px-3 text-right">Diniyah</th>
                <th className="py-3 px-3 text-right">Digital</th>
                <th className="py-3 px-3 text-center">Karya</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-4 text-right">Aksi Cepat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-slate-500">
                    Tidak ada santri yang cocok dengan filter pencarian.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student) => {
                  const rep = getReportForStudent(student);
                  const diniyahAvg = rep ? hitungRataRataDiniyah(rep.diniyah) : 0;
                  const digitalAvg = rep ? hitungRataRataDigital(rep.skillDigital) : 0;
                  const projectCount = db.portfolios.filter(
                    (p) => p.studentId === student.id
                  ).length;

                  return (
                    <tr
                      key={student.id}
                      className="hover:bg-emerald-50/40 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <StudentAvatar
                            name={student.nama}
                            fotoUrl={student.fotoUrl}
                            className="w-9 h-9 text-xs shrink-0"
                          />
                          <div>
                            <div className="font-semibold text-slate-900 text-sm">
                              {student.nama}
                            </div>
                            <div className="font-mono text-[11px] text-slate-500">
                              {student.nisnMda}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-medium text-slate-800">{student.kelas}</div>
                        <div className="text-slate-500 truncate max-w-[190px]">
                          {student.waliKelasNama}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-right font-mono tabular-nums">
                        {rep ? (
                          <div>
                            <span className="font-semibold text-slate-900">
                              {rep.tahfidz.nilaiAkhir}
                            </span>{' '}
                            <span className="text-emerald-700 font-bold">
                              ({rep.tahfidz.predikat})
                            </span>
                            <div className="text-[11px] text-slate-500 font-sans">
                              {rep.tahfidz.totalHafalan}
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400">Belum ada</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right font-mono tabular-nums">
                        {rep ? (
                          <span className="font-semibold text-slate-900">
                            {diniyahAvg} ({hitungPredikat(diniyahAvg)})
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right font-mono tabular-nums">
                        {rep ? (
                          <span className="font-semibold text-slate-900">
                            {digitalAvg} ({hitungPredikat(digitalAvg)})
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center font-mono tabular-nums text-slate-700 font-semibold">
                        {projectCount}
                      </td>
                      <td className="py-3 px-3">
                        {rep ? (
                          <span
                            className={`font-medium ${
                              rep.published ? 'text-emerald-700' : 'text-amber-700'
                            }`}
                          >
                            {rep.published ? 'Terbit' : 'Draf'}
                          </span>
                        ) : (
                          <span className="text-slate-400">Kosong</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => onOpenGradeEditor(student.id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors font-medium whitespace-nowrap shrink-0"
                          >
                            <PenSquare className="w-3.5 h-3.5" />
                            <span>Nilai</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => onOpenStudentPortal(student.id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-colors font-medium whitespace-nowrap shrink-0"
                            title="Lihat tampilan Portal Santri / Orang Tua"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span>Rapor</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => onOpenPortfolio(student.id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-colors font-medium whitespace-nowrap shrink-0"
                            title="Buka Portofolio Santri"
                          >
                            <FolderGit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onOpenPrintReport(student.id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-900 text-white hover:bg-slate-800 transition-colors font-medium whitespace-nowrap shrink-0"
                            title="Cetak / Ekspor PDF Rapor 6 Halaman"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
