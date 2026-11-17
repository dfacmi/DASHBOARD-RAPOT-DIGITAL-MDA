import React, { useMemo } from 'react';
import { ArrowLeft, Printer } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { MdaDatabase } from '../types/mda';
import {
  formatRupiah,
  getPortfolioUrl,
  hitungPredikat,
  hitungRataRataDigital,
  hitungRataRataDiniyah,
} from '../utils/grading';
import { MdaLogo, PortfolioArtwork, StudentAvatar } from './MdaLogo';

interface PrintableReportViewProps {
  db: MdaDatabase;
  studentId: string;
  selectedYear: string;
  selectedSemester: 'Gasal' | 'Genap';
  onBack: () => void;
}

export const PrintableReportView: React.FC<PrintableReportViewProps> = ({
  db,
  studentId,
  selectedYear,
  selectedSemester,
  onBack,
}) => {
  const student = useMemo(
    () => db.students.find((s) => s.id === studentId) || db.students[0],
    [db.students, studentId]
  );

  const report = useMemo(
    () =>
      db.reports.find(
        (r) =>
          r.studentId === student?.id &&
          r.tahunAkademik === selectedYear &&
          r.semester === selectedSemester
      ) || db.reports.find((r) => r.studentId === student?.id),
    [db.reports, student, selectedYear, selectedSemester]
  );

  const period = useMemo(
    () =>
      db.periods.find(
        (p) =>
          p.tahunAkademik === (report?.tahunAkademik || selectedYear) &&
          p.semester === (report?.semester || selectedSemester)
      ) || db.periods[0],
    [db.periods, report, selectedYear, selectedSemester]
  );

  const projects = useMemo(
    () => db.portfolios.filter((p) => p.studentId === student?.id),
    [db.portfolios, student]
  );

  if (!student || !report) {
    return (
      <div className="p-8 text-center">
        <p className="text-sm text-slate-600 mb-4">Data rapor belum tersedia.</p>
        <button
          type="button"
          onClick={onBack}
          className="px-4 py-2 rounded-lg bg-slate-900 text-white text-xs font-semibold"
        >
          Kembali
        </button>
      </div>
    );
  }

  const portfolioUrl = getPortfolioUrl(student.portfolioSlug, db.spreadsheetId);
  const diniyahAvg = hitungRataRataDiniyah(report.diniyah);
  const digitalAvg = hitungRataRataDigital(report.skillDigital);
  const digitalPredikat = hitungPredikat(digitalAvg);
  const project1 = projects[0];
  const project2 = projects[1];

  const MdaFooter = ({ showMotto = true }: { showMotto?: boolean }) => (
    <div
      className="px-8 py-3 flex items-center justify-between text-[10px] text-slate-900"
      style={{
        background: 'linear-gradient(90deg, #00E676 0%, #00C49A 50%, #00B0FF 100%)',
      }}
    >
      <div className="font-semibold max-w-[270px] leading-snug">
        {showMotto
          ? 'Barakallahu fiikum. Teruslah belajar, berkarya, dan berakhlak mulia.'
          : 'Semoga ilmu yang dipelajari menjadi manfaat dan berkah untuk umat.'}
      </div>
      <div className="text-right leading-snug">
        <div className="font-bold">WhatsApp: 08953 7400 4000</div>
        <div className="font-semibold">@muslimdigitalacademy · info@mda.sch.id</div>
        <div>Nuricik RT 3/V, Desa Grajegan, Kec. Tawangsari, Sukoharjo, Jawa Tengah</div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-200 py-6 print-only-wrapper">
      {/* Screen-only Print Toolbar */}
      <div className="no-print max-w-[210mm] mx-auto mb-5 px-4 sm:px-0 flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-slate-300 text-slate-800 text-xs font-semibold hover:bg-slate-50 shadow-xs"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Dashboard</span>
        </button>

        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-700 font-medium hidden sm:inline">
            Format Resmi A4 · 6 Halaman (Termasuk QR Portofolio)
          </span>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 shadow-sm"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak / Simpan sebagai PDF</span>
          </button>
        </div>
      </div>

      {/* 6 A4 Pages Stack */}
      <div className="flex flex-col items-center gap-8 print:gap-0">
        {/* ================= PAGE 1: COVER ================= */}
        <section
          className="rapor-a4-page relative w-[210mm] h-[297mm] shadow-xl overflow-hidden flex flex-col justify-between text-white"
          style={{
            background:
              'linear-gradient(155deg, #00D084 0%, #0D7A6F 45%, #0B4F6C 100%)',
          }}
        >
          <div className="m-5 flex-1 border-2 border-white/80 rounded-2xl p-8 flex flex-col justify-between relative overflow-hidden">
            {/* Top row */}
            <div className="flex items-start justify-between gap-4">
              <div className="bg-white rounded-2xl px-5 py-3 shadow-md">
                <MdaLogo size="md" />
              </div>
              <div className="bg-[#1DF27A] text-slate-950 font-display font-bold text-xs px-5 py-2.5 rounded-full tracking-wide shadow-sm">
                SEMESTER {report.semester.toUpperCase()} {report.tahunAkademik}
              </div>
            </div>

            {/* Cover Title */}
            <div className="my-auto py-8 space-y-3">
              <h1 className="font-display font-extrabold text-[48px] leading-[1.06] tracking-tight drop-shadow-xs">
                Laporan Hasil
                <br />
                Belajar Santri
              </h1>
              <div className="text-xl font-semibold text-white/95">
                Muslim Digital Academy (MDA)
              </div>
              <div className="text-base text-white/85 font-medium">
                Tahun Akademik {report.tahunAkademik} · Pondok Pesantren Darul Fithrah
              </div>

              {/* Stylized MDA Studio Banner */}
              <div className="mt-8 rounded-2xl bg-slate-950/35 border border-white/25 p-5 grid grid-cols-3 gap-4 backdrop-blur-[2px]">
                <div className="col-span-2 space-y-2">
                  <div className="text-xs font-mono text-emerald-300">
                    PROGRAM TAHFIDZ & TEKNOLOGI DIGITAL
                  </div>
                  <div className="text-sm font-medium text-white/90 leading-relaxed">
                    Dokumentasi Capaian Kompetensi Multimedia, Diniyah Islamiyah, Tahfidzul Qur’an, Kesantrian, dan Character Building.
                  </div>
                  <div className="flex flex-wrap gap-3 pt-1 text-xs font-mono text-emerald-200">
                    <span>ID: {student.nisnMda}</span>
                    <span>·</span>
                    <span>{student.kelas}</span>
                  </div>
                </div>
                <div className="flex items-center justify-center">
                  <div className="bg-white p-2 rounded-xl">
                    <QRCodeSVG value={portfolioUrl} size={78} level="M" />
                  </div>
                </div>
              </div>
            </div>

            {/* Student Name Plaque */}
            <div className="mx-auto w-full max-w-[440px] bg-white border-[3px] border-[#00B0FF] rounded-md py-4 px-6 text-center shadow-lg">
              <div className="font-display font-extrabold text-2xl text-slate-950 tracking-wide uppercase">
                {student.nama}
              </div>
            </div>
          </div>

          <MdaFooter showMotto={false} />
        </section>

        {/* ================= PAGE 2: PROFIL & RINGKASAN CAPAIAN ================= */}
        <section className="rapor-a4-page w-[210mm] h-[297mm] bg-[#E8FAF3] shadow-xl flex flex-col justify-between text-slate-900 overflow-hidden">
          <div className="p-8 space-y-5 flex-1">
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
              <MdaLogo size="md" />
              <div className="text-right">
                <div className="font-display font-extrabold text-lg text-slate-900">
                  LAPORAN HASIL BELAJAR SANTRI
                </div>
                <div className="text-xs font-bold text-sky-600">
                  Semester {report.semester} Tahun Akademik {report.tahunAkademik}
                </div>
                <div className="text-[11px] font-semibold text-slate-700">
                  Muslim Digital Academy (MDA) Pondok Pesantren Darul Fithrah
                </div>
                <div className="text-[10px] text-slate-500">
                  Alamat : Nuricik Rt 3/V Desa Grajegan Tawangsari Sukoharjo, Jawa Tengah 57561
                </div>
              </div>
            </div>

            {/* Banner Title */}
            <div className="bg-[#647D73] text-white text-center font-display font-bold text-base py-2 rounded-lg">
              Competence Report Of Muslim Digital Academy
            </div>

            {/* Profile Card */}
            <div className="bg-white/80 border border-[#728C81] rounded-xl p-4 flex items-center gap-5">
              <StudentAvatar
                name={student.nama}
                fotoUrl={student.fotoUrl}
                className="w-24 h-28 text-2xl shrink-0"
              />
              <div className="space-y-1 text-xs">
                <div className="font-mono font-bold text-slate-700">{student.nisnMda}</div>
                <div className="font-display font-extrabold text-xl text-slate-950">
                  {student.nama}
                </div>
                <div className="font-bold text-slate-900">{student.program}</div>
                <div className="text-slate-700">
                  Semester {report.semester} Tahun Akademik {report.tahunAkademik}
                </div>
                <div className="pt-1 text-slate-700">
                  Wali Kelas: <span className="font-semibold">{student.waliKelasNama}</span>
                </div>
                <div className="italic text-slate-600">
                  Tanggal pembagian rapor : {report.tanggalRapor}
                </div>
              </div>
            </div>

            {/* RINGKASAN CAPAIAN */}
            <div>
              <div className="inline-block bg-[#00AEEF] text-slate-950 font-display font-extrabold text-xs px-4 py-1.5 rounded-full mb-3">
                RINGKASAN CAPAIAN
              </div>

              <div className="space-y-2.5">
                {[
                  ['Penguasaan Multimedia', report.pilar.penguasaanMultimedia],
                  ['Diniyah dan Pembelajaran', report.pilar.diniyahPembelajaran],
                  ["Tahfidzul Qur'an", report.pilar.tahfidzulQuran],
                  ['Kesantrian dan Keasramaan', report.pilar.kesantrianKeasramaan],
                  ['Character Building', report.pilar.characterBuilding],
                ].map(([label, pct]) => (
                  <div key={label as string} className="flex items-center gap-3">
                    <div className="relative flex-1 h-8 bg-white rounded-full border border-emerald-200 overflow-hidden flex items-center">
                      <div
                        className="h-full bg-[#A7EBD0] rounded-full"
                        style={{ width: `${pct}%` }}
                      />
                      <span className="absolute left-4 text-xs font-bold text-slate-900">
                        {label}
                      </span>
                    </div>
                    <div className="w-20 h-8 bg-[#0E2228] text-white rounded-full flex items-center justify-center font-mono text-xs font-bold tabular-nums">
                      {pct}%
                    </div>
                  </div>
                ))}
              </div>
              <div className="text-[10px] italic text-slate-600 mt-2">
                Dasar Perhitungan : Kalkulasi penilaian direktarium selama satu semester.
              </div>
            </div>

            {/* RINGKASAN MDA SEMESTER INI */}
            <div>
              <div className="inline-block bg-[#00AEEF] text-slate-950 font-display font-extrabold text-xs px-4 py-1.5 rounded-full mb-3">
                RINGKASAN MDA SEMESTER INI
              </div>

              <div className="grid grid-cols-3 gap-3">
                {[
                  ['Character Building', String(report.kpiMda.characterBuildingCount)],
                  ['Multimedia Project', String(report.kpiMda.multimediaProjectCount)],
                  ['Client Project', String(report.kpiMda.clientProjectCount)],
                  ['MDA Mengajar', String(report.kpiMda.mdaMengajarCount)],
                  ['Income', formatRupiah(report.kpiMda.incomeRp)],
                  ['Produksi Konten', String(report.kpiMda.produksiKontenCount)],
                ].map(([title, val]) => (
                  <div
                    key={title}
                    className="bg-white border border-slate-200 rounded-xl p-2.5 flex flex-col justify-between gap-2"
                  >
                    <div className="text-xs font-semibold text-slate-800 text-center">
                      {title}
                    </div>
                    <div className="bg-[#1DF27A] text-slate-950 font-mono font-bold text-xs py-1 rounded-full text-center tabular-nums">
                      {val}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Pesan Wali Kelas */}
            <div className="bg-white/75 border border-emerald-200 rounded-xl px-4 py-3 text-xs text-center text-slate-800">
              <span className="font-bold">Pesan wali kelas:</span>{' '}
              <span className="italic">{report.catatanWali.pesanSingkat}</span>
            </div>
          </div>

          <MdaFooter showMotto />
        </section>

        {/* ================= PAGE 3: SIKAP, CHARACTER BUILDING, TAHFIDZ ================= */}
        <section className="rapor-a4-page w-[210mm] h-[297mm] bg-[#E8FAF3] shadow-xl p-8 flex flex-col justify-between text-slate-900 overflow-hidden">
          <div className="space-y-4">
            {/* Sub-header */}
            <div className="flex items-start justify-between">
              <MdaLogo size="sm" />
              <div className="text-right">
                <div className="font-display font-extrabold text-base text-slate-900">
                  LAPORAN HASIL BELAJAR SANTRI
                </div>
                <div className="text-xs font-bold text-sky-600">
                  Semester {report.semester} Tahun Akademik {report.tahunAkademik}
                </div>
                <div className="text-[11px] text-slate-700">
                  Nama Santri: {student.nama} · Kelas: {student.kelas}
                </div>
              </div>
            </div>

            {/* A. SIKAP DAN KARAKTER */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="bg-[#00AEEF] text-slate-950 font-display font-extrabold text-xs px-4 py-1.5 rounded-full">
                  A. SIKAP DAN KARAKTER
                </div>
                <div className="text-[10px] text-slate-600">
                  Predikat: A = Sangat Baik · B = Baik · C = Cukup · D = Perlu Bimbingan
                </div>
              </div>

              <table className="w-full border-collapse text-[11px] bg-white">
                <thead>
                  <tr className="bg-[#5E746C] text-white">
                    <th className="border border-slate-400 py-1.5 px-2.5 text-left w-[34%]">
                      Aspek
                    </th>
                    <th className="border border-slate-400 py-1.5 px-2 text-center w-[12%]">
                      Predikat
                    </th>
                    <th className="border border-slate-400 py-1.5 px-2.5 text-left">
                      Deskripsi Singkat
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {report.sikap.map((s) => (
                    <tr key={s.aspek}>
                      <td className="border border-slate-300 py-1.5 px-2.5 font-medium">
                        {s.aspek}
                      </td>
                      <td className="border border-slate-300 py-1.5 px-2 text-center font-mono font-bold">
                        {s.predikat}
                      </td>
                      <td className="border border-slate-300 py-1.5 px-2.5 text-slate-700">
                        {s.deskripsi}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* CHARACTER BUILDING PROGRAM */}
            <div>
              <div className="inline-block bg-[#00AEEF] text-slate-950 font-display font-extrabold text-xs px-4 py-1.5 rounded-full mb-2">
                CHARACTER BUILDING PROGRAM
              </div>

              <table className="w-full border-collapse text-[11px] bg-white">
                <thead>
                  <tr className="bg-[#5E746C] text-white">
                    <th className="border border-slate-400 py-1.5 px-2.5 text-left w-[24%]">
                      Kegiatan
                    </th>
                    <th className="border border-slate-400 py-1.5 px-2.5 text-left w-[26%]">
                      Keterangan
                    </th>
                    <th className="border border-slate-400 py-1.5 px-2.5 text-left w-[24%]">
                      Kegiatan
                    </th>
                    <th className="border border-slate-400 py-1.5 px-2.5 text-left w-[26%]">
                      Keterangan
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {[0, 1, 2, 3].map((rowIdx) => {
                    const left = report.characterPrograms[rowIdx];
                    const right = report.characterPrograms[rowIdx + 4];
                    return (
                      <tr key={rowIdx}>
                        <td className="border border-slate-300 py-1.5 px-2.5 font-semibold">
                          {left?.kegiatan || ''}
                        </td>
                        <td className="border border-slate-300 py-1.5 px-2.5">
                          {left?.keterangan || ''}
                        </td>
                        <td className="border border-slate-300 py-1.5 px-2.5 font-semibold">
                          {right?.kegiatan || ''}
                        </td>
                        <td className="border border-slate-300 py-1.5 px-2.5">
                          {right?.keterangan || ''}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* B. TAHFIDZ AL-QUR'AN */}
            <div>
              <div className="inline-block bg-[#00AEEF] text-slate-950 font-display font-extrabold text-xs px-4 py-1.5 rounded-full mb-2">
                B. TAHFIDZ AL-QUR&apos;AN
              </div>

              <div className="grid grid-cols-2 gap-3">
                <table className="w-full border-collapse text-[11px] bg-white">
                  <thead>
                    <tr className="bg-[#5E746C] text-white">
                      <th className="border border-slate-400 py-1.5 px-2.5 text-left">
                        Capaian Hafalan
                      </th>
                      <th className="border border-slate-400 py-1.5 px-2.5 text-center">
                        Isian
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ['Total Hafalan', report.tahfidz.totalHafalan],
                      ['Capaian hafalan semester ini', report.tahfidz.capaianSemesterIni],
                      ['Total Juziyah', report.tahfidz.totalJuziyah],
                      ['Total Setoran Ziyadah', report.tahfidz.totalSetoranZiyadah],
                      ['Total Murojaah', report.tahfidz.totalMurojaah],
                    ].map(([lbl, val]) => (
                      <tr key={lbl}>
                        <td className="border border-slate-300 py-1.5 px-2.5 font-semibold">
                          {lbl}
                        </td>
                        <td className="border border-slate-300 py-1.5 px-2.5 text-center">
                          {val}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <table className="w-full border-collapse text-[11px] bg-white">
                  <thead>
                    <tr className="bg-[#5E746C] text-white">
                      <th className="border border-slate-400 py-1.5 px-2.5 text-left">
                        Aspek Penilaian
                      </th>
                      <th className="border border-slate-400 py-1.5 px-2 text-center">
                        Nilai
                      </th>
                      <th className="border border-slate-400 py-1.5 px-2 text-center">
                        Predikat
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ['Kelancaran hafalan', report.tahfidz.kelancaran],
                      ['Tajwid', report.tahfidz.tajwid],
                      ['Makhraj dan fashahah', report.tahfidz.makhrajFashahah],
                      ['Ketepatan ayat', report.tahfidz.ketepatanAyat],
                    ].map(([lbl, val]) => (
                      <tr key={lbl as string}>
                        <td className="border border-slate-300 py-1.5 px-2.5 font-semibold">
                          {lbl}
                        </td>
                        <td className="border border-slate-300 py-1.5 px-2 text-center font-mono tabular-nums">
                          {val}
                        </td>
                        <td className="border border-slate-300 py-1.5 px-2 text-center font-mono font-bold">
                          {hitungPredikat(Number(val))}
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-emerald-50 font-bold">
                      <td className="border border-slate-300 py-1.5 px-2.5">
                        Nilai akhir tahfidz
                      </td>
                      <td className="border border-slate-300 py-1.5 px-2 text-center font-mono tabular-nums">
                        {report.tahfidz.nilaiAkhir}
                      </td>
                      <td className="border border-slate-300 py-1.5 px-2 text-center font-mono">
                        {report.tahfidz.predikat}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="mt-2 bg-white border border-slate-300 rounded-lg p-2.5 text-[11px]">
                <span className="font-bold">Deskripsi capaian tahfidz:</span>{' '}
                <span className="text-slate-700">{report.tahfidz.deskripsi}</span>
              </div>
            </div>
          </div>

          {/* KETERANGAN PENILAIAN */}
          <div className="space-y-2">
            <div className="inline-block bg-[#00AEEF] text-slate-950 font-display font-extrabold text-xs px-4 py-1 rounded-full">
              KETERANGAN PENILAIAN
            </div>
            <table className="w-full border-collapse text-[11px] bg-white text-center">
              <thead>
                <tr className="bg-slate-950 text-white">
                  <th className="border border-slate-700 py-1 px-2 text-left">Predikat</th>
                  <th className="border border-slate-700 py-1 px-2">A</th>
                  <th className="border border-slate-700 py-1 px-2">B</th>
                  <th className="border border-slate-700 py-1 px-2">C</th>
                  <th className="border border-slate-700 py-1 px-2">D</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-slate-300 py-1 px-2 text-left font-semibold">
                    Rentang nilai
                  </td>
                  <td className="border border-slate-300 py-1 px-2 font-mono">90–100</td>
                  <td className="border border-slate-300 py-1 px-2 font-mono">80–89</td>
                  <td className="border border-slate-300 py-1 px-2 font-mono">70–79</td>
                  <td className="border border-slate-300 py-1 px-2">di bawah 70</td>
                </tr>
                <tr>
                  <td className="border border-slate-300 py-1 px-2 text-left font-semibold">
                    Kategori
                  </td>
                  <td className="border border-slate-300 py-1 px-2">Sangat Baik</td>
                  <td className="border border-slate-300 py-1 px-2">Baik</td>
                  <td className="border border-slate-300 py-1 px-2">Cukup</td>
                  <td className="border border-slate-300 py-1 px-2">Perlu Bimbingan</td>
                </tr>
              </tbody>
            </table>
            <div className="text-[11px] text-slate-700">
              <span className="font-bold">KKM (Kriteria Ketuntasan Minimal):</span> Diniyah{' '}
              <span className="font-mono font-bold">{period?.kkmDiniyah || 60}</span> · Tahfidz{' '}
              <span className="font-mono font-bold">{period?.kkmTahfidz || 70}</span> · Skill Digital{' '}
              <span className="font-mono font-bold">{period?.kkmDigital || 60}</span>
            </div>
          </div>
        </section>

        {/* ================= PAGE 4: DINIYAH, SKILL DIGITAL, KEHADIRAN, TTD ================= */}
        <section className="rapor-a4-page w-[210mm] h-[297mm] bg-[#E8FAF3] shadow-xl p-8 flex flex-col justify-between text-slate-900 overflow-hidden">
          <div className="space-y-4">
            {/* Sub-header */}
            <div className="flex items-start justify-between">
              <MdaLogo size="sm" />
              <div className="text-right">
                <div className="font-display font-extrabold text-base text-slate-900">
                  LAPORAN HASIL BELAJAR SANTRI
                </div>
                <div className="text-xs font-bold text-sky-600">
                  Semester {report.semester} Tahun Akademik {report.tahunAkademik}
                </div>
                <div className="text-[11px] text-slate-700">
                  Nama Santri: {student.nama} · Kelas: {student.kelas}
                </div>
              </div>
            </div>

            {/* C. MATA PELAJARAN DINIYAH */}
            <div>
              <div className="inline-block bg-[#00AEEF] text-slate-950 font-display font-extrabold text-xs px-4 py-1.5 rounded-full mb-2">
                C. MATA PELAJARAN DINIYAH
              </div>
              <table className="w-full border-collapse text-[11px] bg-white">
                <thead>
                  <tr className="bg-[#5E746C] text-white">
                    <th className="border border-slate-400 py-1.5 px-2 text-center w-8">No</th>
                    <th className="border border-slate-400 py-1.5 px-2.5 text-left">
                      Mata Pelajaran
                    </th>
                    <th className="border border-slate-400 py-1.5 px-2.5 text-left">
                      Kitab / Materi
                    </th>
                    <th className="border border-slate-400 py-1.5 px-2 text-center w-14">
                      KKM
                    </th>
                    <th className="border border-slate-400 py-1.5 px-2 text-center w-14">
                      Nilai
                    </th>
                    <th className="border border-slate-400 py-1.5 px-2.5 text-left">
                      Deskripsi Capaian
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {report.diniyah.map((d) => (
                    <tr key={d.no}>
                      <td className="border border-slate-300 py-1.5 px-2 text-center font-mono">
                        {d.no}
                      </td>
                      <td className="border border-slate-300 py-1.5 px-2.5 font-semibold">
                        {d.mataPelajaran}
                      </td>
                      <td className="border border-slate-300 py-1.5 px-2.5">
                        {d.kitabMateri}
                      </td>
                      <td className="border border-slate-300 py-1.5 px-2 text-center font-mono">
                        {d.kkm}
                      </td>
                      <td className="border border-slate-300 py-1.5 px-2 text-center font-mono font-bold">
                        {d.nilai}
                      </td>
                      <td className="border border-slate-300 py-1.5 px-2.5 text-slate-700">
                        {d.deskripsi}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-emerald-50 font-bold">
                    <td className="border border-slate-300 py-1.5 px-2" />
                    <td
                      colSpan={3}
                      className="border border-slate-300 py-1.5 px-2.5 text-center"
                    >
                      Rata-rata Nilai Diniyah
                    </td>
                    <td className="border border-slate-300 py-1.5 px-2 text-center font-mono">
                      {diniyahAvg}
                    </td>
                    <td className="border border-slate-300 py-1.5 px-2.5 font-mono">
                      Predikat: {hitungPredikat(diniyahAvg)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* D. SKILL DIGITAL */}
            <div>
              <div className="inline-block bg-[#00AEEF] text-slate-950 font-display font-extrabold text-xs px-4 py-1.5 rounded-full mb-2">
                D. SKILL DIGITAL
              </div>
              <table className="w-full border-collapse text-[11px] bg-white">
                <thead>
                  <tr className="bg-[#5E746C] text-white">
                    <th className="border border-slate-400 py-1.5 px-2 text-center w-8">No</th>
                    <th className="border border-slate-400 py-1.5 px-2.5 text-left">
                      Materi Skill
                    </th>
                    <th className="border border-slate-400 py-1.5 px-2 text-center w-14">
                      KKM
                    </th>
                    <th className="border border-slate-400 py-1.5 px-2 text-center w-22">
                      Pengetahuan
                    </th>
                    <th className="border border-slate-400 py-1.5 px-2 text-center w-22">
                      Keterampilan
                    </th>
                    <th className="border border-slate-400 py-1.5 px-2 text-center w-20">
                      Nilai Akhir
                    </th>
                    <th className="border border-slate-400 py-1.5 px-2 text-center w-18">
                      Predikat
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {report.skillDigital.map((s) => (
                    <tr key={s.no}>
                      <td className="border border-slate-300 py-1.5 px-2 text-center font-mono">
                        {s.no}
                      </td>
                      <td className="border border-slate-300 py-1.5 px-2.5 font-semibold">
                        {s.materiSkill}
                      </td>
                      <td className="border border-slate-300 py-1.5 px-2 text-center font-mono">
                        {s.kkm}
                      </td>
                      <td className="border border-slate-300 py-1.5 px-2 text-center font-mono">
                        {s.pengetahuan || '—'}
                      </td>
                      <td className="border border-slate-300 py-1.5 px-2 text-center font-mono">
                        {s.keterampilan || '—'}
                      </td>
                      <td className="border border-slate-300 py-1.5 px-2 text-center font-mono font-bold">
                        {s.nilaiAkhir || '—'}
                      </td>
                      <td className="border border-slate-300 py-1.5 px-2 text-center font-mono font-bold">
                        {s.nilaiAkhir ? s.predikat : '—'}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-emerald-50 font-bold">
                    <td className="border border-slate-300 py-1.5 px-2" />
                    <td
                      colSpan={4}
                      className="border border-slate-300 py-1.5 px-2.5 text-center"
                    >
                      Rata-rata Skill Digital
                    </td>
                    <td className="border border-slate-300 py-1.5 px-2 text-center font-mono">
                      {digitalAvg}
                    </td>
                    <td className="border border-slate-300 py-1.5 px-2 text-center font-mono">
                      {digitalPredikat}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* E. KEHADIRAN & F. CATATAN WALI KELAS */}
            <div className="grid grid-cols-12 gap-3">
              <div className="col-span-4">
                <div className="inline-block bg-[#00AEEF] text-slate-950 font-display font-extrabold text-xs px-3 py-1 rounded-full mb-2">
                  E. KEHADIRAN
                </div>
                <table className="w-full border-collapse text-[11px] bg-white">
                  <thead>
                    <tr className="bg-[#5E746C] text-white">
                      <th className="border border-slate-400 py-1 px-2 text-left">
                        Keterangan
                      </th>
                      <th className="border border-slate-400 py-1 px-2 text-center w-14">
                        Hari
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-slate-300 py-1.5 px-2 font-semibold">
                        Sakit
                      </td>
                      <td className="border border-slate-300 py-1.5 px-2 text-center font-mono">
                        {report.kehadiran.sakit}
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-slate-300 py-1.5 px-2 font-semibold">
                        Izin
                      </td>
                      <td className="border border-slate-300 py-1.5 px-2 text-center font-mono">
                        {report.kehadiran.izin}
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-slate-300 py-1.5 px-2 font-semibold">
                        Alpa (tanpa keterangan)
                      </td>
                      <td className="border border-slate-300 py-1.5 px-2 text-center font-mono">
                        {report.kehadiran.alpa}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="col-span-8">
                <div className="inline-block bg-[#00AEEF] text-slate-950 font-display font-extrabold text-xs px-3 py-1 rounded-full mb-2">
                  F. CATATAN WALI KELAS
                </div>
                <div className="bg-white border border-slate-300 rounded-lg p-3 text-[11px] space-y-1.5 leading-snug">
                  <div>
                    <span className="font-bold">Perkembangan:</span>{' '}
                    {report.catatanWali.perkembangan}
                  </div>
                  <div>
                    <span className="font-bold">Kekuatan:</span>{' '}
                    {report.catatanWali.kekuatan}
                  </div>
                  <div>
                    <span className="font-bold">Saran semester depan:</span>{' '}
                    {report.catatanWali.saranSemesterDepan}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Keputusan Semester + Pengesahan */}
          <div className="space-y-3">
            <div className="bg-white/80 border border-[#728C81] rounded-lg px-3 py-2 text-[11px] flex flex-wrap items-center gap-3">
              <span className="font-bold">Keputusan semester:</span>
              {[
                'Lanjut ke semester genap',
                'Lanjut dengan bimbingan',
                'Naik tingkat program',
              ].map((opt) => (
                <span key={opt} className="inline-flex items-center gap-1">
                  <span className="font-mono font-bold">
                    ({report.keputusanSemester === opt ? '✓' : ' '})
                  </span>
                  <span>{opt}</span>
                </span>
              ))}
            </div>

            <div className="text-right text-[11px] text-slate-700 font-medium">
              Sukoharjo, {report.tanggalRapor}
            </div>

            <table className="w-full border-collapse text-[11px] bg-white text-center">
              <thead>
                <tr className="bg-slate-950 text-white">
                  <th className="border border-slate-700 py-1.5 px-2 w-1/3">
                    Kepala Unit MDA
                  </th>
                  <th className="border border-slate-700 py-1.5 px-2 w-1/3">Wali Kelas</th>
                  <th className="border border-slate-700 py-1.5 px-2 w-1/3">
                    Mudir / Kepala Pesantren
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-slate-300 pt-14 pb-2 px-2 font-semibold">
                    ({period?.kepalaUnitMda || 'Ustadz Azmuhu Syahid, S. Pd'})
                  </td>
                  <td className="border border-slate-300 pt-14 pb-2 px-2 font-semibold">
                    ({student.waliKelasNama})
                  </td>
                  <td className="border border-slate-300 pt-14 pb-2 px-2 font-semibold">
                    ({period?.mudirPesantren || 'Ustadz Yahya Setiyawan, S. Pd.I, M. Pd'})
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* ================= PAGE 5: STUDENT PROJECT 1 & QR ================= */}
        <section className="rapor-a4-page w-[210mm] h-[297mm] bg-[#E8FAF3] shadow-xl p-8 flex flex-col justify-between text-slate-900 overflow-hidden">
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <MdaLogo size="sm" />
              <div className="text-right">
                <div className="font-display font-extrabold text-xl text-slate-900">
                  STUDENT PROJECT
                </div>
                <div className="text-xs font-bold text-sky-600">
                  Semester {report.semester} · Tahun Akademik {report.tahunAkademik}
                </div>
                <div className="text-[11px] text-slate-700">
                  Lampiran · Nama Santri: {student.nama}
                </div>
              </div>
            </div>

            {/* Summary Portfolio Table + QR */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 space-y-2">
                <div className="inline-block bg-[#00AEEF] text-slate-950 font-display font-extrabold text-xs px-4 py-1.5 rounded-full">
                  PORTOFOLIO / PROYEK SEMESTER INI
                </div>
                <table className="w-full border-collapse text-[11px] bg-white">
                  <thead>
                    <tr className="bg-slate-950 text-white">
                      <th className="border border-slate-700 py-1.5 px-2 text-left">
                        Karya / Proyek
                      </th>
                      <th className="border border-slate-700 py-1.5 px-2 text-left">Jenis</th>
                      <th className="border border-slate-700 py-1.5 px-2 text-left">
                        Keterangan
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {(projects.length > 0
                      ? projects.slice(0, 3)
                      : [
                          {
                            id: 'empty-1',
                            judul: 'Belum ada proyek',
                            jenis: '—',
                            keteranganSingkat: 'Tambahkan pada menu Portofolio',
                          },
                        ]
                    ).map((p) => (
                      <tr key={p.id}>
                        <td className="border border-slate-300 py-1.5 px-2 font-semibold">
                          {p.judul}
                        </td>
                        <td className="border border-slate-300 py-1.5 px-2">{p.jenis}</td>
                        <td className="border border-slate-300 py-1.5 px-2">
                          {p.keteranganSingkat}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="text-[10px] text-slate-700">
                  <span className="font-bold">Portofolio lengkap:</span>{' '}
                  <span className="font-mono text-emerald-800 break-all">
                    {portfolioUrl}
                  </span>
                </div>
              </div>

              <div className="text-center shrink-0">
                <div className="bg-white border-2 border-dashed border-emerald-400 rounded-xl p-2">
                  <QRCodeSVG value={portfolioUrl} size={76} level="M" />
                </div>
                <div className="text-[10px] font-semibold text-emerald-800 mt-1">
                  Scan: portofolio lengkap
                </div>
              </div>
            </div>

            {/* Project 1 Showcase */}
            <div className="space-y-3 pt-1">
              <div>
                <div className="font-display font-extrabold text-xl text-slate-950">
                  Multimedia Project
                </div>
                <div className="font-display font-bold text-sm text-sky-600">
                  {project1 ? project1.judul : 'Proyek 1'}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 h-[118mm]">
                <div className="border-2 border-dashed border-emerald-400 rounded-xl overflow-hidden bg-white">
                  {project1?.mediaItems[0]?.url ? (
                    <img
                      src={project1.mediaItems[0].url}
                      alt={project1.judul}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <PortfolioArtwork
                      preset={project1?.mediaItems[0]?.presetArt || 'poster'}
                      title={project1?.mediaItems[0]?.caption || project1?.judul || 'Karya Utama'}
                    />
                  )}
                </div>

                <div className="grid grid-rows-2 gap-4">
                  <div className="border-2 border-dashed border-emerald-400 rounded-xl overflow-hidden bg-white">
                    {project1?.mediaItems[1]?.url ? (
                      <img
                        src={project1.mediaItems[1].url}
                        alt={project1.judul}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <PortfolioArtwork
                        preset={project1?.mediaItems[1]?.presetArt || 'photo'}
                        title={project1?.mediaItems[1]?.caption || 'Karya 2'}
                      />
                    )}
                  </div>
                  <div className="border-2 border-dashed border-emerald-400 rounded-xl overflow-hidden bg-white">
                    {project1?.mediaItems[2]?.url ? (
                      <img
                        src={project1.mediaItems[2].url}
                        alt={project1.judul}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <PortfolioArtwork
                        preset={project1?.mediaItems[2]?.presetArt || 'poster'}
                        title={project1?.mediaItems[2]?.caption || 'Karya 3'}
                      />
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-[11px]">
                <div className="space-y-2">
                  <div>
                    <div className="font-bold text-slate-900 mb-1">Student Competence</div>
                    <div className="bg-white border border-slate-200 rounded-lg p-2.5 min-h-[58px] text-slate-700">
                      {project1?.competence || '—'}
                    </div>
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 mb-1">Technology</div>
                    <div className="bg-white border border-slate-200 rounded-lg p-2 font-mono text-emerald-800 font-semibold">
                      {project1?.technology || '—'}
                    </div>
                  </div>
                </div>
                <div>
                  <div className="font-bold text-slate-900 mb-1">Description</div>
                  <div className="bg-white border border-slate-200 rounded-lg p-2.5 min-h-[104px] text-slate-700 leading-relaxed">
                    {project1?.description || '—'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ================= PAGE 6: STUDENT PROJECT 2 & CTA QR ================= */}
        <section className="rapor-a4-page w-[210mm] h-[297mm] bg-[#E8FAF3] shadow-xl flex flex-col justify-between text-slate-900 overflow-hidden">
          <div className="p-8 space-y-5 flex-1">
            <div className="flex items-start justify-between">
              <MdaLogo size="sm" />
              <div className="text-right">
                <div className="font-display font-extrabold text-xl text-slate-900">
                  STUDENT PROJECT
                </div>
                <div className="text-xs font-bold text-sky-600">
                  Semester {report.semester} · Tahun Akademik {report.tahunAkademik}
                </div>
                <div className="text-[11px] text-slate-700">
                  Lampiran · Nama Santri: {student.nama}
                </div>
              </div>
            </div>

            <div>
              <div className="font-display font-extrabold text-xl text-slate-950">
                Multimedia Project
              </div>
              <div className="font-display font-bold text-sm text-sky-600">
                {project2 ? project2.judul : 'Proyek 2'}
              </div>
            </div>

            {/* 3-Column Showcase */}
            <div className="grid grid-cols-3 gap-4 h-[92mm]">
              {[0, 1, 2].map((slot) => {
                const item = project2?.mediaItems[slot];
                return (
                  <div
                    key={slot}
                    className="border-2 border-dashed border-emerald-400 rounded-xl overflow-hidden bg-white"
                  >
                    {item?.url ? (
                      <img
                        src={item.url}
                        alt={item.caption || 'Karya'}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <PortfolioArtwork
                        preset={item?.presetArt || 'uiux'}
                        title={item?.caption || `Karya ${slot + 1}`}
                      />
                    )}
                  </div>
                );
              })}
            </div>

            <div className="grid grid-cols-2 gap-4 text-[11px]">
              <div className="space-y-2">
                <div>
                  <div className="font-bold text-slate-900 mb-1">Student Competence</div>
                  <div className="bg-white border border-slate-200 rounded-lg p-2.5 min-h-[64px] text-slate-700">
                    {project2?.competence || '—'}
                  </div>
                </div>
                <div>
                  <div className="font-bold text-slate-900 mb-1">Technology</div>
                  <div className="bg-white border border-slate-200 rounded-lg p-2 font-mono text-emerald-800 font-semibold">
                    {project2?.technology || '—'}
                  </div>
                </div>
              </div>
              <div>
                <div className="font-bold text-slate-900 mb-1">Description</div>
                <div className="bg-white border border-slate-200 rounded-lg p-2.5 min-h-[112px] text-slate-700 leading-relaxed">
                  {project2?.description || '—'}
                </div>
              </div>
            </div>

            {/* Dark CTA Banner with Large QR Code */}
            <div className="bg-[#0E1113] text-white rounded-2xl p-6 flex items-center justify-between gap-6">
              <div className="space-y-2 max-w-[360px]">
                <div className="font-display font-extrabold text-lg text-[#1DF27A]">
                  LIHAT KARYA SELENGKAPNYA
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Semua proyek, video, dan client project santri semester ini dapat dilihat di portofolio online. Silakan buka link atau scan QR code di samping.
                </p>
                <div className="font-mono text-[11px] font-bold text-[#1DF27A] break-all pt-1">
                  {portfolioUrl}
                </div>
              </div>
              <div className="bg-white p-2.5 rounded-2xl border-2 border-dashed border-emerald-400 shrink-0">
                <QRCodeSVG value={portfolioUrl} size={104} level="M" />
              </div>
            </div>
          </div>

          <MdaFooter showMotto={false} />
        </section>
      </div>
    </div>
  );
};
