import React, { useMemo, useState } from 'react';
import {
  ArrowLeft,
  Check,
  Copy,
  ExternalLink,
  Plus,
  QrCode,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { MdaDatabase, PortfolioMediaItem, PortfolioProject } from '../types/mda';
import { getPortfolioUrl } from '../utils/grading';
import { MdaLogo, PortfolioArtwork, StudentAvatar } from './MdaLogo';

interface PortfolioHubViewProps {
  db: MdaDatabase;
  studentId: string;
  canEdit: boolean;
  isPublicStandalone?: boolean;
  onSelectStudent?: (id: string) => void;
  onSavePortfolios: (projects: PortfolioProject[]) => void;
  onUploadMediaToDrive: (file: File) => Promise<{ url: string; type: 'image' | 'video' } | null>;
  onExitPublicStandalone?: () => void;
}

export const PortfolioHubView: React.FC<PortfolioHubViewProps> = ({
  db,
  studentId,
  canEdit,
  isPublicStandalone = false,
  onSelectStudent,
  onSavePortfolios,
  onUploadMediaToDrive,
  onExitPublicStandalone,
}) => {
  const [copied, setCopied] = useState(false);
  const [editingProject, setEditingProject] = useState<PortfolioProject | null>(null);
  const [uploadingSlot, setUploadingSlot] = useState<number | null>(null);
  const [lightboxMedia, setLightboxMedia] = useState<{
    item: PortfolioMediaItem;
    projectTitle: string;
  } | null>(null);

  const student = useMemo(
    () => db.students.find((s) => s.id === studentId) || db.students[0],
    [db.students, studentId]
  );

  const projects = useMemo(
    () => db.portfolios.filter((p) => p.studentId === student?.id),
    [db.portfolios, student]
  );

  const latestReport = useMemo(() => {
    const reps = db.reports.filter((r) => r.studentId === student?.id);
    return reps[reps.length - 1];
  }, [db.reports, student]);

  if (!student) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-sm text-slate-500">
        Profil santri tidak ditemukan.
      </div>
    );
  }

  const portfolioUrl = getPortfolioUrl(student.portfolioSlug, db.spreadsheetId);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(portfolioUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  const handleNewProject = () => {
    setEditingProject({
      id: `port-${Date.now()}`,
      studentId: student.id,
      tahunAkademik: latestReport?.tahunAkademik || '2026/2027',
      semester: latestReport?.semester || 'Gasal',
      judul: '',
      jenis: 'Graphic Design / UI/UX',
      keteranganSingkat: '',
      competence: '',
      technology: 'Figma, Canva',
      description: '',
      externalLink: '',
      mediaItems: [
        { url: '', type: 'image', caption: 'Karya Utama', presetArt: 'poster' },
        { url: '', type: 'image', caption: 'Tampilan Detail', presetArt: 'uiux' },
        { url: '', type: 'image', caption: 'Dokumentasi / Variasi', presetArt: 'photo' },
      ],
      featured: true,
    });
  };

  const handleMediaUpload = async (
    slotIdx: number,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file || !editingProject) return;
    setUploadingSlot(slotIdx);
    try {
      const res = await onUploadMediaToDrive(file);
      if (res) {
        const nextMedia = [...editingProject.mediaItems];
        nextMedia[slotIdx] = {
          ...nextMedia[slotIdx],
          url: res.url,
          type: res.type,
        };
        setEditingProject({ ...editingProject, mediaItems: nextMedia });
      }
    } finally {
      setUploadingSlot(null);
    }
  };

  const handleSubmitProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProject || !editingProject.judul.trim()) return;
    const exists = db.portfolios.some((p) => p.id === editingProject.id);
    const next = exists
      ? db.portfolios.map((p) => (p.id === editingProject.id ? editingProject : p))
      : [...db.portfolios, editingProject];
    onSavePortfolios(next);
    setEditingProject(null);
  };

  const renderMediaFrame = (
    item: PortfolioMediaItem,
    projectTitle: string,
    heightClass = 'h-48'
  ) => {
    const hasUrl = item.url && item.url.trim() !== '';
    return (
      <button
        type="button"
        onClick={() => setLightboxMedia({ item, projectTitle })}
        className={`group relative w-full ${heightClass} rounded-xl overflow-hidden border border-slate-200 bg-slate-50 text-left focus:outline-none focus:ring-2 focus:ring-emerald-500`}
      >
        {hasUrl ? (
          item.type === 'video' ? (
            <iframe
              src={item.url}
              title={item.caption || projectTitle}
              className="w-full h-full pointer-events-none"
            />
          ) : (
            <img
              src={item.url}
              alt={item.caption || projectTitle}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-200"
            />
          )
        ) : (
          <PortfolioArtwork preset={item.presetArt} title={item.caption || projectTitle} />
        )}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 via-black/30 to-transparent p-2.5">
          <div className="text-[11px] font-medium text-white truncate">
            {item.caption || projectTitle}
          </div>
        </div>
      </button>
    );
  };

  return (
    <div className={isPublicStandalone ? 'min-h-screen bg-[#f6fbf9] py-8 px-4 sm:px-8' : ''}>
      <div className={isPublicStandalone ? 'max-w-5xl mx-auto space-y-6' : 'space-y-6'}>
        {isPublicStandalone && (
          <div className="flex items-center justify-between gap-4 pb-2 border-b border-emerald-100">
            <MdaLogo size="md" />
            {onExitPublicStandalone && (
              <button
                type="button"
                onClick={onExitPublicStandalone}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 whitespace-nowrap"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Masuk ke Dashboard MDA</span>
              </button>
            )}
          </div>
        )}

        {/* Student Portfolio Hero Profile + QR Code */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex items-start sm:items-center gap-4">
              <StudentAvatar
                name={student.nama}
                fotoUrl={student.fotoUrl}
                className="w-16 h-16 sm:w-20 sm:h-20 text-xl shrink-0"
              />
              <div>
                <div className="text-xs font-mono font-semibold text-emerald-700">
                  Student Portfolio · {student.nisnMda}
                </div>
                {!isPublicStandalone && onSelectStudent ? (
                  <select
                    value={student.id}
                    onChange={(e) => onSelectStudent(e.target.value)}
                    className="mt-0.5 font-display font-bold text-2xl text-slate-900 bg-transparent border-b border-dashed border-slate-300 focus:outline-none focus:border-emerald-600 pr-4"
                  >
                    {db.students.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.nama}
                      </option>
                    ))}
                  </select>
                ) : (
                  <h1 className="font-display font-bold text-2xl text-slate-900 mt-0.5">
                    {student.nama}
                  </h1>
                )}
                <p className="text-xs sm:text-sm text-slate-600 mt-1">
                  {student.program} · Pondok Pesantren Darul Fithrah
                </p>
                {latestReport && (
                  <div className="text-xs text-slate-500 mt-1.5 flex flex-wrap items-center gap-2">
                    <span>Tahfidz: {latestReport.tahfidz.totalHafalan}</span>
                    <span aria-hidden="true">·</span>
                    <span>Multimedia: {latestReport.pilar.penguasaanMultimedia}%</span>
                    <span aria-hidden="true">·</span>
                    <span>{projects.length} Proyek Terpublikasi</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-slate-900 text-white rounded-xl p-4 shrink-0">
              <div className="bg-white p-1.5 rounded-lg shrink-0">
                <QRCodeSVG value={portfolioUrl} size={72} level="M" />
              </div>
              <div className="space-y-2 max-w-[240px]">
                <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
                  <QrCode className="w-3.5 h-3.5" />
                  <span>Link Unik Portofolio</span>
                </div>
                <div className="text-[11px] font-mono text-slate-300 truncate">
                  {portfolioUrl}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-xs font-medium text-white"
                  >
                    {copied ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    <span>{copied ? 'Disalin' : 'Salin URL'}</span>
                  </button>
                  {canEdit && (
                    <button
                      type="button"
                      onClick={handleNewProject}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Karya Baru</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Add / Edit Portfolio Form */}
        {canEdit && editingProject && (
          <form
            onSubmit={handleSubmitProject}
            className="bg-white border border-emerald-200 rounded-2xl p-6 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="font-display font-bold text-slate-900 text-base">
                {db.portfolios.some((p) => p.id === editingProject.id)
                  ? 'Edit Karya Portofolio'
                  : 'Tambah Karya / Proyek Santri'}
              </h2>
              <button
                type="button"
                onClick={() => setEditingProject(null)}
                className="text-xs text-slate-500 hover:text-slate-800"
              >
                Tutup
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Judul Proyek / Karya
                </label>
                <input
                  type="text"
                  required
                  value={editingProject.judul}
                  onChange={(e) =>
                    setEditingProject({ ...editingProject, judul: e.target.value })
                  }
                  placeholder="Contoh: UI/UX Design – Aplikasi Mutabaah Tahfidz"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Jenis Karya
                </label>
                <input
                  type="text"
                  required
                  value={editingProject.jenis}
                  onChange={(e) =>
                    setEditingProject({ ...editingProject, jenis: e.target.value })
                  }
                  placeholder="Poster / UI/UX / Video / Web"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Technology / Tools
                </label>
                <input
                  type="text"
                  value={editingProject.technology}
                  onChange={(e) =>
                    setEditingProject({ ...editingProject, technology: e.target.value })
                  }
                  placeholder="Figma, Canva, Premiere Pro"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Keterangan Singkat (Tabel Lampiran PDF)
                </label>
                <input
                  type="text"
                  value={editingProject.keteranganSingkat}
                  onChange={(e) =>
                    setEditingProject({
                      ...editingProject,
                      keteranganSingkat: e.target.value,
                    })
                  }
                  placeholder="3 karya poster kampanye digital"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Link Eksternal Hasil Karya
                </label>
                <input
                  type="url"
                  value={editingProject.externalLink}
                  onChange={(e) =>
                    setEditingProject({ ...editingProject, externalLink: e.target.value })
                  }
                  placeholder="https://figma.com/... atau https://youtube.com/..."
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
                />
              </div>

              <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Student Competence (Kompetensi yang Dicapai)
                  </label>
                  <textarea
                    rows={3}
                    value={editingProject.competence}
                    onChange={(e) =>
                      setEditingProject({ ...editingProject, competence: e.target.value })
                    }
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Description (Tujuan, Konsep & Pembelajaran)
                  </label>
                  <textarea
                    rows={3}
                    value={editingProject.description}
                    onChange={(e) =>
                      setEditingProject({ ...editingProject, description: e.target.value })
                    }
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
                  />
                </div>
              </div>
            </div>

            {/* 3 Media Slots with Google Drive Upload */}
            <div className="pt-2 border-t border-slate-100">
              <div className="text-xs font-semibold text-slate-800 mb-3">
                Galeri Media Karya (3 Slot Foto/Video — Upload ke Google Drive atau URL)
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {editingProject.mediaItems.map((m, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl border border-slate-200 bg-slate-50 space-y-2"
                  >
                    <div className="text-xs font-semibold text-slate-700">
                      Slot Karya {idx + 1}
                    </div>
                    <input
                      type="text"
                      value={m.caption}
                      onChange={(e) => {
                        const next = [...editingProject.mediaItems];
                        next[idx] = { ...next[idx], caption: e.target.value };
                        setEditingProject({ ...editingProject, mediaItems: next });
                      }}
                      placeholder="Judul / Caption gambar"
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg"
                    />
                    <input
                      type="url"
                      value={m.url}
                      onChange={(e) => {
                        const next = [...editingProject.mediaItems];
                        next[idx] = { ...next[idx], url: e.target.value };
                        setEditingProject({ ...editingProject, mediaItems: next });
                      }}
                      placeholder="URL foto/video (opsional)"
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg"
                    />
                    <div className="flex items-center justify-between gap-2">
                      <select
                        value={m.presetArt || 'poster'}
                        onChange={(e) => {
                          const next = [...editingProject.mediaItems];
                          next[idx] = {
                            ...next[idx],
                            presetArt: e.target.value as PortfolioMediaItem['presetArt'],
                          };
                          setEditingProject({ ...editingProject, mediaItems: next });
                        }}
                        className="px-2 py-1 text-[11px] bg-white border border-slate-200 rounded-md"
                      >
                        <option value="poster">Tema Poster</option>
                        <option value="uiux">Tema UI/UX</option>
                        <option value="photo">Tema Foto</option>
                        <option value="video">Tema Video</option>
                      </select>

                      <label className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-white border border-slate-200 hover:bg-slate-100 text-[11px] font-semibold text-slate-700 cursor-pointer">
                        <Upload className="w-3 h-3" />
                        <span>
                          {uploadingSlot === idx ? 'Mengunggah...' : 'Drive Upload'}
                        </span>
                        <input
                          type="file"
                          accept="image/*,video/*"
                          onChange={(e) => handleMediaUpload(idx, e)}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingProject(null)}
                className="px-4 py-2 rounded-lg border border-slate-200 text-xs font-medium"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700"
              >
                Simpan Karya Portofolio
              </button>
            </div>
          </form>
        )}

        {/* Portfolio Projects List */}
        {projects.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center space-y-3">
            <div className="text-sm font-semibold text-slate-800">
              Belum ada karya portofolio untuk {student.nama}
            </div>
            <p className="text-xs text-slate-500">
              Tambahkan proyek desain, UI/UX, fotografi, atau video santri agar muncul di halaman portofolio & lampiran PDF.
            </p>
            {canEdit && (
              <button
                type="button"
                onClick={handleNewProject}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 text-white text-xs font-semibold"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Karya Pertama</span>
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {projects.map((proj, index) => (
              <div
                key={proj.id}
                className="bg-white border border-slate-200 rounded-2xl p-6 space-y-5"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-slate-100 pb-4">
                  <div>
                    <div className="text-xs text-emerald-700 font-semibold">
                      Proyek {index + 1} · {proj.jenis} · {proj.semester} {proj.tahunAkademik}
                    </div>
                    <h2 className="font-display font-bold text-xl text-slate-900 mt-0.5">
                      {proj.judul}
                    </h2>
                    <p className="text-xs text-slate-500 mt-1">{proj.keteranganSingkat}</p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {proj.externalLink && (
                      <a
                        href={proj.externalLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 whitespace-nowrap"
                      >
                        <span>Lihat Karya</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                    {canEdit && (
                      <>
                        <button
                          type="button"
                          onClick={() => setEditingProject(proj)}
                          className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            onSavePortfolios(
                              db.portfolios.filter((x) => x.id !== proj.id)
                            )
                          }
                          className="p-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50"
                          title="Hapus karya"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* 3-Slot Bento Media Showcase */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                  <div className="md:col-span-6">
                    {proj.mediaItems[0] &&
                      renderMediaFrame(proj.mediaItems[0], proj.judul, 'h-64 md:h-72')}
                  </div>
                  <div className="md:col-span-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-1 gap-4">
                    {proj.mediaItems[1] &&
                      renderMediaFrame(proj.mediaItems[1], proj.judul, 'h-32 md:h-[136px]')}
                    {proj.mediaItems[2] &&
                      renderMediaFrame(proj.mediaItems[2], proj.judul, 'h-32 md:h-[136px]')}
                  </div>
                </div>

                {/* Competence, Technology & Description */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-5 pt-2">
                  <div className="md:col-span-5 space-y-3">
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                      <div className="text-xs font-bold text-slate-900 mb-1">
                        Student Competence
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        {proj.competence}
                      </p>
                    </div>
                    <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-100">
                      <div className="text-xs font-bold text-slate-900 mb-1">
                        Technology & Tools
                      </div>
                      <p className="text-xs font-mono font-semibold text-emerald-800">
                        {proj.technology}
                      </p>
                    </div>
                  </div>

                  <div className="md:col-span-7 p-4 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="text-xs font-bold text-slate-900 mb-1">
                      Description
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {proj.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Fullscreen Lightbox */}
      {lightboxMedia && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setLightboxMedia(null)}
        >
          <div
            className="relative w-full max-w-3xl bg-white rounded-2xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200">
              <div>
                <div className="font-display font-bold text-sm text-slate-900">
                  {lightboxMedia.projectTitle}
                </div>
                <div className="text-xs text-slate-500">
                  {lightboxMedia.item.caption}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setLightboxMedia(null)}
                className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="h-[420px] bg-slate-900 flex items-center justify-center">
              {lightboxMedia.item.url ? (
                lightboxMedia.item.type === 'video' ? (
                  <iframe
                    src={lightboxMedia.item.url}
                    title={lightboxMedia.item.caption}
                    className="w-full h-full"
                    allowFullScreen
                  />
                ) : (
                  <img
                    src={lightboxMedia.item.url}
                    alt={lightboxMedia.item.caption}
                    referrerPolicy="no-referrer"
                    className="max-w-full max-h-full object-contain"
                  />
                )
              ) : (
                <PortfolioArtwork
                  preset={lightboxMedia.item.presetArt}
                  title={lightboxMedia.item.caption || lightboxMedia.projectTitle}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
