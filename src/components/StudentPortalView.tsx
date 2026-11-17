import React, { useMemo, useState } from 'react';
import {
  BookOpen,
  Check,
  Copy,
  ExternalLink,
  FolderGit2,
  Printer,
  QrCode,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { MdaDatabase } from '../types/mda';
import {
  formatRupiah,
  getKategoriPredikat,
  getPortfolioUrl,
  hitungRataRataDigital,
  hitungRataRataDiniyah,
} from '../utils/grading';
import {
  RadarFivePillarsChart,
  SemesterProgressChart,
  TrendSeriesPoint,
} from './Charts';
import { StudentAvatar } from './MdaLogo';

interface StudentPortalViewProps {
  db: MdaDatabase;
  studentId: string;
  selectedYear: string;
  selectedSemester: 'Gasal' | 'Genap';
  allowStudentSwitch: boolean;
  onSelectStudent: (id: string) => void;
  onOpenPrint: (studentId: string) => void;
  onOpenPortfolio: (studentId: string) => void;
}

export const StudentPortalView: React.FC<StudentPortalViewProps> = ({
  db,
  studentId,
  selectedYear,
  selectedSemester,
  allowStudentSwitch,
  onSelectStudent,
  onOpenPrint,
  onOpenPortfolio,
}) => {
  const [copied, setCopied] = useState(false);

  const student = useMemo(
    () => db.students.find((s) => s.id === studentId) || db.students[0],
    [db.students, studentId]
  );

  const studentReports = useMemo(() => {
    if (!student) return [];
    return db.reports
      .filter((r) => r.studentId === student.id)
      .sort((a, b) => {
        const keyA = `${a.tahunAkademik}-${a.semester === 'Gasal' ? '1' : '2'}`;
        const keyB = `${b.tahunAkademik}-${b.semester === 'Gasal' ? '1' : '2'}`;
        return keyA.localeCompare(keyB);
      });
  }, [db.reports, student]);

  const currentReport = useMemo(() => {
    return (
      studentReports.find(
        (r) => r.tahunAkademik === selectedYear && r.semester === selectedSemester
      ) || studentReports[studentReports.length - 1]
    );
  }, [studentReports, selectedYear, selectedSemester]);

  const previousReport = useMemo(() => {
    if (!currentReport) return undefined;
    const idx = studentReports.findIndex((r) => r.id === currentReport.id);
    return idx > 0 ? studentReports[idx - 1] : undefined;
  }, [studentReports, currentReport]);

  const trendData: TrendSeriesPoint[] = useMemo(() => {
    return studentReports.map((r) => {
      const avg =
        Math.round(
          ((r.pilar.penguasaanMultimedia +
            r.pilar.diniyahPembelajaran +
            r.pilar.tahfidzulQuran +
            r.pilar.characterBuilding) /
            4) *
            10
        ) / 10;
      return {
        label: `${r.semester} ${r.tahunAkademik}`,
        multimedia: r.pilar.penguasaanMultimedia,
        diniyah: r.pilar.diniyahPembelajaran,
        tahfidz: r.pilar.tahfidzulQuran,
        character: r.pilar.characterBuilding,
        rataRata: avg,
      };
    });
  }, [studentReports]);

  const studentProjects = useMemo(
    () => db.portfolios.filter((p) => p.studentId === student?.id),
    [db.portfolios, student]
  );

  if (!student || !currentReport) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-sm text-slate-500">
        Laporan hasil belajar untuk santri ini belum tersedia pada semester terpilih.
      </div>
    );
  }

  const portfolioUrl = getPortfolioUrl(student.portfolioSlug, db.spreadsheetId);
  const diniyahAvg = hitungRataRataDiniyah(currentReport.diniyah);
  const digitalAvg = hitungRataRataDigital(currentReport.skillDigital);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(portfolioUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Ignore clipboard errors in restricted frames
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Competence Identity Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="flex items-start sm:items-center gap-4">
            <StudentAvatar
              name={student.nama}
              fotoUrl={student.fotoUrl}
              className="w-16 h-16 sm:w-20 sm:h-20 text-xl shrink-0"
            />
            <div>
              <div className="text-xs font-mono font-semibold text-emerald-700">
                {student.nisnMda} · {currentReport.semester} {currentReport.tahunAkademik}
              </div>
              {allowStudentSwitch ? (
                <select
                  value={student.id}
                  onChange={(e) => onSelectStudent(e.target.value)}
                  className="mt-1 font-display font-bold text-xl sm:text-2xl text-slate-900 bg-transparent border-b border-dashed border-slate-300 focus:outline-none focus:border-emerald-600 pr-4"
                >
                  {db.students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.nama}
                    </option>
                  ))}
                </select>
              ) : (
                <h1 className="mt-0.5 font-display font-bold text-xl sm:text-2xl text-slate-900">
                  {student.nama}
                </h1>
              )}
              <div className="text-xs sm:text-sm text-slate-600 mt-1">
                {student.program} · Wali Kelas: {student.waliKelasNama}
              </div>
              <div className="text-xs text-slate-500 mt-0.5">
                Tanggal Rapor: {currentReport.tanggalRapor} · Keputusan:{' '}
                <span className="font-semibold text-emerald-700">
                  {currentReport.keputusanSemester}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => onOpenPortfolio(student.id)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 hover:bg-slate-50 text-xs font-semibold whitespace-nowrap"
            >
              <FolderGit2 className="w-4 h-4 text-emerald-600" />
              <span>Portofolio ({studentProjects.length})</span>
            </button>

            <button
              type="button"
              onClick={() => onOpenPrint(student.id)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 text-white hover:bg-slate-800 text-xs font-semibold whitespace-nowrap"
            >
              <Printer className="w-4 h-4 text-emerald-400" />
              <span>Cetak / Ekspor PDF Rapor</span>
            </button>
          </div>
        </div>
      </div>

      {/* 5 Pillars + Multi-Semester Growth Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-5">
          <h2 className="font-display font-bold text-slate-900 text-base">
            Ringkasan Capaian 5 Pilar
          </h2>
          <p className="text-xs text-slate-500 mb-3">
            Perbandingan kompetensi semester aktif vs sebelumnya
          </p>
          <RadarFivePillarsChart
            current={currentReport.pilar}
            previous={previousReport?.pilar}
            currentLabel={`${currentReport.semester} ${currentReport.tahunAkademik}`}
            previousLabel={
              previousReport
                ? `${previousReport.semester} ${previousReport.tahunAkademik}`
                : undefined
            }
          />
        </div>

        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-5 flex flex-col justify-between">
          <div>
            <h2 className="font-display font-bold text-slate-900 text-base">
              Grafik Perkembangan Kompetensi Antar Semester
            </h2>
            <p className="text-xs text-slate-500 mb-4">
              Tren nilai Multimedia, Tahfidz, Diniyah, dan Character Building per semester
            </p>
            <SemesterProgressChart data={trendData} />
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <div className="text-slate-500">Character Building</div>
              <div className="font-mono font-bold text-slate-900 text-base tabular-nums">
                {currentReport.kpiMda.characterBuildingCount} Kegiatan
              </div>
            </div>
            <div>
              <div className="text-slate-500">Multimedia & Client</div>
              <div className="font-mono font-bold text-slate-900 text-base tabular-nums">
                {currentReport.kpiMda.multimediaProjectCount} /{' '}
                {currentReport.kpiMda.clientProjectCount} Proyek
              </div>
            </div>
            <div>
              <div className="text-slate-500">MDA Mengajar & Income</div>
              <div className="font-mono font-bold text-emerald-700 text-base tabular-nums">
                {currentReport.kpiMda.mdaMengajarCount}x ·{' '}
                {formatRupiah(currentReport.kpiMda.incomeRp)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tahfidz + Sikap & Character Building */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-bold text-slate-900 text-base inline-flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-emerald-600" />
              <span>Tahfidz Al-Qur’an</span>
            </h2>
            <span className="font-mono text-xs font-bold text-emerald-700 tabular-nums">
              {currentReport.tahfidz.nilaiAkhir} ({currentReport.tahfidz.predikat})
            </span>
          </div>

          <div className="divide-y divide-slate-100 text-xs">
            {[
              ['Total Hafalan', currentReport.tahfidz.totalHafalan],
              ['Capaian Semester Ini', currentReport.tahfidz.capaianSemesterIni],
              ['Total Juziyah', currentReport.tahfidz.totalJuziyah],
              ['Setoran Ziyadah', currentReport.tahfidz.totalSetoranZiyadah],
              ['Total Murojaah', currentReport.tahfidz.totalMurojaah],
            ].map(([lbl, val]) => (
              <div key={lbl} className="py-2 flex items-center justify-between">
                <span className="text-slate-500">{lbl}</span>
                <span className="font-semibold text-slate-900">{val || '—'}</span>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2">
            {[
              ['Kelancaran', currentReport.tahfidz.kelancaran],
              ['Tajwid', currentReport.tahfidz.tajwid],
              ['Makhraj', currentReport.tahfidz.makhrajFashahah],
              ['Ketepatan Ayat', currentReport.tahfidz.ketepatanAyat],
            ].map(([lbl, score]) => (
              <div
                key={lbl as string}
                className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between text-xs"
              >
                <span className="text-slate-600">{lbl}</span>
                <span className="font-mono font-bold text-slate-900 tabular-nums">
                  {score}
                </span>
              </div>
            ))}
          </div>

          <p className="text-xs text-slate-600 leading-relaxed bg-emerald-50/60 border border-emerald-100 rounded-lg p-3">
            {currentReport.tahfidz.deskripsi}
          </p>
        </div>

        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
          <h2 className="font-display font-bold text-slate-900 text-base">
            Sikap, Karakter & Program Character Building
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-900 text-white">
                  <th className="py-2 px-3">Aspek Sikap</th>
                  <th className="py-2 px-3 w-28">Predikat</th>
                  <th className="py-2 px-3">Catatan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {currentReport.sikap.map((s) => (
                  <tr key={s.aspek}>
                    <td className="py-2 px-3 font-medium text-slate-800">{s.aspek}</td>
                    <td className="py-2 px-3 font-mono font-bold text-emerald-700">
                      {s.predikat} · {getKategoriPredikat(s.predikat)}
                    </td>
                    <td className="py-2 px-3 text-slate-600">{s.deskripsi}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2">
            {currentReport.characterPrograms.map((c) => (
              <div
                key={c.kegiatan}
                className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs"
              >
                <div className="font-semibold text-slate-800">{c.kegiatan}</div>
                <div className="text-slate-600 mt-0.5 truncate" title={c.keterangan}>
                  {c.keterangan || '—'}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Diniyah & Skill Digital Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <h3 className="font-display font-bold text-slate-900 text-sm">
              Mata Pelajaran Diniyah
            </h3>
            <span className="font-mono text-xs font-bold text-slate-900 tabular-nums">
              Rata-rata: {diniyahAvg}
            </span>
          </div>
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-900 text-white">
                <th className="py-2 px-3">Mapel & Kitab</th>
                <th className="py-2 px-3 text-right">KKM</th>
                <th className="py-2 px-3 text-right">Nilai</th>
                <th className="py-2 px-3">Predikat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {currentReport.diniyah.map((d) => (
                <tr key={d.no}>
                  <td className="py-2.5 px-3">
                    <div className="font-semibold text-slate-900">{d.mataPelajaran}</div>
                    <div className="text-slate-500">{d.kitabMateri}</div>
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono tabular-nums">
                    {d.kkm}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 tabular-nums">
                    {d.nilai}
                  </td>
                  <td className="py-2.5 px-3 font-semibold text-emerald-700">
                    {d.predikat} · {d.nilai >= d.kkm ? 'Tuntas' : 'Perlu Bimbingan'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <h3 className="font-display font-bold text-slate-900 text-sm">
              Kompetensi Skill Digital
            </h3>
            <span className="font-mono text-xs font-bold text-slate-900 tabular-nums">
              Rata-rata: {digitalAvg}
            </span>
          </div>
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-900 text-white">
                <th className="py-2 px-3">Materi Skill</th>
                <th className="py-2 px-3 text-right">Pengetahuan</th>
                <th className="py-2 px-3 text-right">Keterampilan</th>
                <th className="py-2 px-3 text-right">Akhir</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {currentReport.skillDigital
                .filter((s) => s.nilaiAkhir > 0)
                .map((s) => (
                  <tr key={s.no}>
                    <td className="py-2.5 px-3 font-semibold text-slate-900">
                      {s.materiSkill}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums">
                      {s.pengetahuan}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums">
                      {s.keterampilan}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-700 tabular-nums">
                      {s.nilaiAkhir} ({s.predikat})
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Catatan Wali Kelas + Integrated QR Code Portfolio */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-2xl p-5 space-y-3 text-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-display font-bold text-slate-900 text-base">
              Catatan Wali Kelas & Kehadiran
            </h3>
            <div className="font-mono text-slate-600 tabular-nums">
              Sakit: {currentReport.kehadiran.sakit} hr · Izin: {currentReport.kehadiran.izin} hr · Alpa:{' '}
              {currentReport.kehadiran.alpa} hr
            </div>
          </div>

          <div className="space-y-2 text-slate-700 leading-relaxed">
            <p>
              <strong className="text-slate-900">Perkembangan:</strong>{' '}
              {currentReport.catatanWali.perkembangan}
            </p>
            <p>
              <strong className="text-slate-900">Kekuatan:</strong>{' '}
              {currentReport.catatanWali.kekuatan}
            </p>
            <p>
              <strong className="text-slate-900">Saran Semester Depan:</strong>{' '}
              {currentReport.catatanWali.saranSemesterDepan}
            </p>
          </div>

          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-950 italic">
            “{currentReport.catatanWali.pesanSingkat}”
          </div>
        </div>

        <div className="lg:col-span-4 bg-slate-900 text-white rounded-2xl p-5 flex flex-col justify-between gap-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="inline-flex items-center gap-1.5 text-emerald-400 text-xs font-semibold">
                <QrCode className="w-4 h-4" />
                <span>QR Portofolio Santri</span>
              </div>
              <h3 className="font-display font-bold text-base mt-1">
                Akses Karya Online
              </h3>
              <p className="text-xs text-slate-300 mt-1">
                Scan QR code untuk melihat seluruh proyek desain, UI/UX, dan video {student.nama}.
              </p>
            </div>
            <div className="bg-white p-2 rounded-xl shrink-0">
              <QRCodeSVG value={portfolioUrl} size={84} level="M" />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={handleCopyLink}
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-white transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Link Disalin' : 'Salin Link'}</span>
            </button>
            <button
              type="button"
              onClick={() => onOpenPortfolio(student.id)}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white transition-colors"
            >
              <span>Buka</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
