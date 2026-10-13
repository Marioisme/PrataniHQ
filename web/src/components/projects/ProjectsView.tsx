import React, { useState, useMemo } from 'react';
import type { ProjectItem, BrandId } from '../../types';
import { fmtRp, autoSlashDate, toDisplayDate, toStorageDate, getBulanLabel } from '../../lib/keuanganUtils';
import { fmtTanggal, BRAND_LABEL, BRAND_ICONS } from '../../lib/contentPlanUtils';

interface ProjectsViewProps {
  projects: ProjectItem[];
  activeBrand: BrandId;
  onBrandChange: (brand: BrandId) => void;
  onSaveProject: (p: ProjectItem) => Promise<void>;
  onUpdateProject: (p: ProjectItem) => Promise<void>;
  onDeleteProject: (id: number | string) => Promise<void>;
}

export const ProjectsView: React.FC<ProjectsViewProps> = ({
  projects,
  activeBrand,
  onBrandChange,
  onSaveProject,
  onUpdateProject,
  onDeleteProject
}) => {
  const [viewMode, setViewMode] = useState<'table' | 'board'>('table');
  const [searchTerm, setSearchTerm] = useState('');
  const [collapsedMonths, setCollapsedMonths] = useState<Record<string, boolean>>({});

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<ProjectItem | null>(null);
  const [fileModalItem, setFileModalItem] = useState<ProjectItem | null>(null);

  // Drag & drop state
  const [draggedId, setDraggedId] = useState<number | string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<string | null>(null);

  const brandProjects = useMemo(() => {
    return projects.filter((p) => (p.brand || '').toLowerCase() === activeBrand.toLowerCase());
  }, [projects, activeBrand]);

  const searchedProjects = useMemo(() => {
    if (!searchTerm.trim()) return brandProjects;
    const q = searchTerm.toLowerCase();
    return brandProjects.filter((p) => {
      const mNama = (p.nama || '').toLowerCase().includes(q);
      const mCp = (p.contactPerson || '').toLowerCase().includes(q);
      const mDesk = (p.deskripsi || '').toLowerCase().includes(q);
      return mNama || mCp || mDesk;
    });
  }, [brandProjects, searchTerm]);

  const [currentMonthKey] = useState(() => new Date().toISOString().substring(0, 7));

  const boardCols = [
    { key: 'planning' as const, label: 'Planning', dot: '#5a7a9a', cls: 'col-planning' },
    { key: 'ongoing' as const, label: 'Ongoing', dot: 'var(--accent)', cls: 'col-ongoing' },
    { key: 'review' as const, label: 'Review', dot: '#ff9f43', cls: 'col-review' },
    { key: 'done' as const, label: 'Done', dot: 'var(--green)', cls: 'col-done' }
  ];

  const projStatusLabel = (s: string) => {
    const map: Record<string, string> = {
      planning: '📅 Planning',
      ongoing: '⚡ Ongoing',
      review: '👁️ Review',
      done: '✅ Done'
    };
    return map[s] || s;
  };

  // Grouped by month for Table View
  const { sortedMonths, byMonth } = useMemo(() => {
    const map: Record<string, ProjectItem[]> = {};
    searchedProjects.forEach((p) => {
      const ref = p.tanggalMulai || p.deadline || '';
      const key = ref ? ref.substring(0, 7) : 'unset';
      if (!map[key]) map[key] = [];
      map[key].push(p);
    });
    const months = Object.keys(map).sort((a, b) => b.localeCompare(a));
    return { sortedMonths: months, byMonth: map };
  }, [searchedProjects]);

  const handleDragStart = (e: React.DragEvent, id: number | string) => {
    setDraggedId(id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setDraggedId(null);
    setDragOverCol(null);
  };

  const handleDrop = async (e: React.DragEvent, colKey: ProjectItem['status']) => {
    e.preventDefault();
    setDragOverCol(null);
    if (!draggedId) return;
    const target = projects.find((p) => p.id === draggedId);
    if (target) {
      await onUpdateProject({
        ...target,
        status: colKey,
        progress: colKey === 'done' ? 100 : target.progress
      });
    }
    setDraggedId(null);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* ── TOPBAR ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
        <div className="filter-row" style={{ marginBottom: 0 }}>
          {(['dikopi', 'kolektiva', 'imagineer'] as BrandId[]).map((b) => (
            <button
              key={b}
              onClick={() => onBrandChange(b)}
              className={`filter-btn ${activeBrand === b ? 'active' : ''}`}
              style={{ textTransform: 'capitalize' }}
            >
              {BRAND_ICONS[b]} {BRAND_LABEL[b]} ({projects.filter((p) => p.brand === b).length})
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          <input
            type="text"
            className="form-input"
            placeholder="🔍 Cari project / klien..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '200px', padding: '6px 12px', fontSize: '12px' }}
          />

          <div className="view-toggle">
            <button
              type="button"
              className={`view-toggle-btn ${viewMode === 'table' ? 'active' : ''}`}
              onClick={() => setViewMode('table')}
            >
              ≡ Table
            </button>
            <button
              type="button"
              className={`view-toggle-btn ${viewMode === 'board' ? 'active' : ''}`}
              onClick={() => setViewMode('board')}
            >
              ⊞ Board
            </button>
          </div>

          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => setIsAddModalOpen(true)}
          >
            + New Project
          </button>
        </div>
      </div>

      {/* ── TABLE VIEW ── */}
      {viewMode === 'table' ? (
        <div>
          {sortedMonths.length === 0 ? (
            <div className="empty">
              <div className="empty-icon">💼</div>
              Belum ada proyek untuk brand {BRAND_LABEL[activeBrand]}
            </div>
          ) : (
            sortedMonths.map((key) => {
              const items = byMonth[key];
              const doneCount = items.filter((p) => p.status === 'done').length;
              const isCollapsed = collapsedMonths[`${activeBrand}_${key}`] ?? (key !== currentMonthKey && doneCount === items.length);
              const label = key === 'unset' ? 'Tanpa Tanggal' : getBulanLabel(key);

              return (
                <div key={key} className="month-block">
                  <div
                    className={`month-header ${isCollapsed ? 'collapsed' : ''}`}
                    onClick={() => setCollapsedMonths((prev) => ({ ...prev, [`${activeBrand}_${key}`]: !prev[`${activeBrand}_${key}`] }))}
                  >
                    <div className="month-header-left">
                      <span className="month-chevron">▾</span>
                      <span className="month-title">{label}</span>
                      <span className="month-count">{items.length} proyek</span>
                      {doneCount > 0 && <span className="month-done-count">· {doneCount} done</span>}
                      {doneCount === items.length && items.length > 0 && (
                        <span className="pill pill-done" style={{ fontSize: '10px' }}>
                          ✅ Selesai
                        </span>
                      )}
                    </div>
                  </div>

                  {!isCollapsed && (
                    <div className="content-table-wrap">
                      <table className="content-table">
                        <thead>
                          <tr>
                            <th style={{ width: '130px' }}>Periode / Deadline</th>
                            <th style={{ width: '22%' }}>Nama Proyek</th>
                            <th style={{ width: '15%' }}>Contact Person</th>
                            <th>Deskripsi</th>
                            <th style={{ width: '120px' }}>Nilai Proyek</th>
                            <th style={{ width: '90px', textAlign: 'center' }}>Progress</th>
                            <th style={{ width: '100px', textAlign: 'center' }}>Status</th>
                            <th style={{ width: '90px', textAlign: 'center' }}>Files</th>
                            <th style={{ width: '80px', textAlign: 'center' }}>Aksi</th>
                          </tr>
                        </thead>
                        <tbody>
                          {items.map((p) => {
                            const pct = p.progress || 0;
                            const fileCount = (p.files || []).length;
                            return (
                              <tr key={p.id}>
                                <td style={{ fontFamily: 'DM Mono', fontSize: '11px', whiteSpace: 'nowrap' }}>
                                  <div>{fmtTanggal(p.tanggalMulai)}</div>
                                  <div style={{ color: 'var(--muted)', fontSize: '10px', marginTop: '2px' }}>
                                    s/d {fmtTanggal(p.deadline)}
                                  </div>
                                </td>
                                <td style={{ fontWeight: 600, fontSize: '13px' }}>{p.nama}</td>
                                <td style={{ fontSize: '12px', color: 'var(--text2)' }}>{p.contactPerson || '—'}</td>
                                <td style={{ fontSize: '12px', color: 'var(--text2)' }}>{p.deskripsi || '—'}</td>
                                <td style={{ fontFamily: 'DM Mono', fontSize: '12px', color: 'var(--green)', whiteSpace: 'nowrap' }}>
                                  {p.nilaiProyek ? fmtRp(p.nilaiProyek) : '—'}
                                </td>
                                <td style={{ textAlign: 'center' }}>
                                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px' }}>
                                    <div className="progress-bar" style={{ width: '60px', height: '5px' }}>
                                      <div className="progress-fill" style={{ width: `${pct}%`, background: pct === 100 ? 'var(--green)' : 'var(--accent)' }} />
                                    </div>
                                    <span style={{ fontFamily: 'DM Mono', fontSize: '10px', color: 'var(--accent)' }}>{pct}%</span>
                                  </div>
                                </td>
                                <td style={{ textAlign: 'center' }}>
                                  <span className={`pill pill-proj-${p.status}`} style={{ fontSize: '10px' }}>
                                    {projStatusLabel(p.status)}
                                  </span>
                                </td>
                                <td style={{ textAlign: 'center' }}>
                                  <button
                                    type="button"
                                    className="board-action-btn"
                                    style={{ fontSize: '11px', padding: '3px 6px' }}
                                    onClick={() => setFileModalItem(p)}
                                  >
                                    📎 {fileCount ? `${fileCount} file` : 'Upload'}
                                  </button>
                                </td>
                                <td style={{ textAlign: 'center' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                                    <button
                                      type="button"
                                      className="tbl-action-btn tbl-edit"
                                      onClick={() => setEditItem(p)}
                                      title="Edit"
                                    >
                                      ✏️
                                    </button>
                                    <button
                                      type="button"
                                      className="tbl-action-btn tbl-del"
                                      onClick={async () => {
                                        if (window.confirm('Hapus proyek ini?')) {
                                          await onDeleteProject(p.id);
                                        }
                                      }}
                                      title="Hapus"
                                    >
                                      🗑️
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      ) : (
        /* ── BOARD VIEW ── */
        <div className="board-wrap" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
          {boardCols.map((col) => {
            const colItems = searchedProjects.filter((p) => (p.status || 'planning') === col.key);
            const isColOver = dragOverCol === col.key;

            return (
              <div key={col.key} className={`board-col ${col.cls}`}>
                <div className="board-col-header">
                  <div className="board-col-dot" style={{ background: col.dot }} />
                  <div className="board-col-title">{col.label}</div>
                  <div className="board-col-count">{colItems.length}</div>
                </div>

                <div
                  className={`board-cards ${isColOver ? 'drag-over' : ''}`}
                  onDragOver={(e) => {
                    e.preventDefault();
                    if (dragOverCol !== col.key) setDragOverCol(col.key);
                  }}
                  onDragLeave={(e) => {
                    const rel = e.relatedTarget as Node | null;
                    if (!e.currentTarget.contains(rel)) setDragOverCol(null);
                  }}
                  onDrop={(e) => handleDrop(e, col.key)}
                >
                  {colItems.map((p) => {
                    const otherCols = boardCols.filter((c) => c.key !== p.status);
                    const isDraggingThis = draggedId === p.id;

                    return (
                      <div
                        key={p.id}
                        className={`board-card ${isDraggingThis ? 'dragging' : ''}`}
                        draggable
                        onDragStart={(e) => handleDragStart(e, p.id)}
                        onDragEnd={handleDragEnd}
                      >
                        <div className="board-card-brand" style={{ color: `var(--${p.brand})` }}>
                          {BRAND_LABEL[p.brand]}
                        </div>
                        <div className="board-card-konsep">{p.nama}</div>
                        <div className="board-card-meta" style={{ marginBottom: '8px' }}>
                          {p.deadline && <span className="board-card-date">📅 {fmtTanggal(p.deadline)}</span>}
                          {p.nilaiProyek ? (
                            <span className="board-card-date" style={{ color: 'var(--green)' }}>
                              💵 {fmtRp(p.nilaiProyek)}
                            </span>
                          ) : null}
                        </div>

                        {/* Actions */}
                        <div className="board-card-actions">
                          {otherCols.map((c) => (
                            <button
                              key={c.key}
                              type="button"
                              className="board-action-btn"
                              onClick={() => onUpdateProject({ ...p, status: c.key, progress: c.key === 'done' ? 100 : p.progress })}
                            >
                              → {c.label}
                            </button>
                          ))}
                          <button
                            type="button"
                            className="board-action-btn"
                            onClick={() => setEditItem(p)}
                            style={{ flex: '0 0 auto' }}
                          >
                            ✏️
                          </button>
                          <button
                            type="button"
                            className="board-action-btn danger"
                            onClick={async () => {
                              if (window.confirm('Hapus proyek ini?')) {
                                await onDeleteProject(p.id);
                              }
                            }}
                            style={{ flex: '0 0 auto' }}
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <button
                  type="button"
                  className="board-add-btn"
                  onClick={() => setIsAddModalOpen(true)}
                >
                  + New project
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* ── ADD & EDIT MODAL ── */}
      {(isAddModalOpen || editItem) && (
        <ProjectModal
          isOpen={true}
          onClose={() => {
            setIsAddModalOpen(false);
            setEditItem(null);
          }}
          initialBrand={activeBrand}
          itemToEdit={editItem}
          onSave={async (item) => {
            if (editItem) {
              await onUpdateProject(item);
            } else {
              await onSaveProject(item);
            }
          }}
        />
      )}

      {/* ── FILE ATTACHMENTS MODAL ── */}
      {fileModalItem && (
        <ProjectFilesModal
          isOpen={true}
          onClose={() => setFileModalItem(null)}
          project={fileModalItem}
          onUpdateProject={onUpdateProject}
        />
      )}
    </div>
  );
};

// ── PROJECT MODAL FORM ──
interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialBrand: BrandId;
  itemToEdit: ProjectItem | null;
  onSave: (p: ProjectItem) => Promise<void>;
}

const ProjectModal: React.FC<ProjectModalProps> = ({
  isOpen,
  onClose,
  initialBrand,
  itemToEdit,
  onSave
}) => {
  const isEditing = Boolean(itemToEdit);

  const [brand, setBrand] = useState<string>(() => itemToEdit?.brand || initialBrand);
  const [nama, setNama] = useState<string>(() => itemToEdit?.nama || '');
  const [contactPerson, setContactPerson] = useState<string>(() => itemToEdit?.contactPerson || '');
  const [tanggalMulai, setTanggalMulai] = useState<string>(() => (itemToEdit?.tanggalMulai ? toDisplayDate(itemToEdit.tanggalMulai) : ''));
  const [deadline, setDeadline] = useState<string>(() => (itemToEdit?.deadline ? toDisplayDate(itemToEdit.deadline) : ''));
  const [nilaiProyek, setNilaiProyek] = useState<string>(() => (itemToEdit?.nilaiProyek ? String(itemToEdit.nilaiProyek) : ''));
  const [progress, setProgress] = useState<number>(() => itemToEdit?.progress || 0);
  const [status, setStatus] = useState<ProjectItem['status']>(() => itemToEdit?.status || 'planning');
  const [deskripsi, setDeskripsi] = useState<string>(() => itemToEdit?.deskripsi || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nama.trim()) {
      alert('Nama proyek tidak boleh kosong');
      return;
    }

    setIsSubmitting(true);
    try {
      const p: ProjectItem = {
        id: itemToEdit?.id ?? Date.now(),
        brand,
        nama: nama.trim(),
        contactPerson: contactPerson.trim(),
        tanggalMulai: toStorageDate(tanggalMulai),
        deadline: toStorageDate(deadline),
        nilaiProyek: parseFloat(nilaiProyek.replace(/\./g, '')) || 0,
        progress: Number(progress) || 0,
        status,
        deskripsi: deskripsi.trim(),
        files: itemToEdit?.files || []
      };

      await onSave(p);
      onClose();
    } catch (err) {
      console.error(err);
      alert('Gagal menyimpan proyek');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal" style={{ maxWidth: '580px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <div className="modal-title" style={{ marginBottom: 0 }}>
            {isEditing ? '✏️ Edit Proyek' : '+ Tambah Proyek Baru'}
          </div>
          <button type="button" className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Brand</label>
              <select className="form-select" value={brand} onChange={(e) => setBrand(e.target.value)}>
                {(['dikopi', 'kolektiva', 'imagineer'] as BrandId[]).map((b) => (
                  <option key={b} value={b}>{BRAND_LABEL[b]}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Status</label>
              <select className="form-select" value={status} onChange={(e) => setStatus(e.target.value as any)}>
                <option value="planning">📅 Planning</option>
                <option value="ongoing">⚡ Ongoing</option>
                <option value="review">👁️ Review</option>
                <option value="done">✅ Done</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Nama Proyek *</label>
            <input
              className="form-input"
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              placeholder="Misal: Redesain Menu Dikopi 2026..."
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Contact Person (PIC / Klien)</label>
              <input
                className="form-input"
                value={contactPerson}
                onChange={(e) => setContactPerson(e.target.value)}
                placeholder="Nama PIC atau organisasi..."
              />
            </div>
            <div className="form-group">
              <label className="form-label">Nilai Proyek (Rp)</label>
              <input
                className="form-input"
                value={nilaiProyek ? Number(nilaiProyek.replace(/\D/g, '')).toLocaleString('id-ID') : ''}
                onChange={(e) => setNilaiProyek(e.target.value.replace(/\D/g, ''))}
                placeholder="0"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Tanggal Mulai</label>
              <input
                className="form-input"
                placeholder="DD/MM/YYYY"
                maxLength={10}
                value={tanggalMulai}
                onChange={(e) => setTanggalMulai(autoSlashDate(e.target.value))}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Deadline</label>
              <input
                className="form-input"
                placeholder="DD/MM/YYYY"
                maxLength={10}
                value={deadline}
                onChange={(e) => setDeadline(autoSlashDate(e.target.value))}
              />
            </div>
            <div className="form-group" style={{ flex: '0 0 100px' }}>
              <label className="form-label">Progress ({progress}%)</label>
              <input
                type="number"
                min="0"
                max="100"
                className="form-input"
                value={progress}
                onChange={(e) => setProgress(Math.min(100, Math.max(0, Number(e.target.value))))}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Deskripsi / Ruang Lingkup</label>
            <textarea
              className="form-textarea"
              style={{ minHeight: '70px' }}
              value={deskripsi}
              onChange={(e) => setDeskripsi(e.target.value)}
              placeholder="Catatan proyek, deliverable, spesifikasi..."
            />
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Batal</button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Menyimpan...' : '💾 Simpan Proyek'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ── PROJECT FILES MODAL ──
interface ProjectFilesModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: ProjectItem;
  onUpdateProject: (p: ProjectItem) => Promise<void>;
}

const ProjectFilesModal: React.FC<ProjectFilesModalProps> = ({
  isOpen,
  onClose,
  project,
  onUpdateProject
}) => {
  const [files, setFiles] = useState(() => project.files || []);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploaded = Array.from(e.target.files || []);
    if (!uploaded.length) return;

    const newEntries = uploaded.map((f) => ({
      name: f.name,
      size: f.size,
      ext: f.name.split('.').pop() || '',
      url: URL.createObjectURL(f)
    }));

    const updated = [...files, ...newEntries];
    setFiles(updated);
    onUpdateProject({ ...project, files: updated });
  };

  const handleDeleteFile = (idx: number) => {
    const updated = files.filter((_, i) => i !== idx);
    setFiles(updated);
    onUpdateProject({ ...project, files: updated });
  };

  return (
    <div className="modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal" style={{ maxWidth: '500px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <div className="modal-title" style={{ marginBottom: 0 }}>📎 Lampiran File: {project.nama}</div>
          <button type="button" className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label className="btn btn-primary btn-sm" style={{ cursor: 'pointer', display: 'inline-block' }}>
            + Upload File Baru
            <input type="file" multiple onChange={handleFileUpload} style={{ display: 'none' }} />
          </label>
        </div>

        <div style={{ maxHeight: '240px', overflowY: 'auto' }}>
          {files.length === 0 ? (
            <div style={{ fontSize: '12px', color: 'var(--muted)', textAlign: 'center', padding: '16px' }}>
              Belum ada file terlampir
            </div>
          ) : (
            files.map((f, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 10px',
                  background: 'var(--surface2)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  marginBottom: '6px'
                }}
              >
                <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, marginRight: '10px' }}>
                  <span style={{ fontSize: '14px', marginRight: '6px' }}>📄</span>
                  <span style={{ fontSize: '12.5px', fontWeight: 500 }}>{f.name}</span>
                </div>
                <button
                  type="button"
                  className="btn btn-danger btn-sm"
                  style={{ padding: '2px 8px', fontSize: '11px' }}
                  onClick={() => handleDeleteFile(i)}
                >
                  ✕
                </button>
              </div>
            ))
          )}
        </div>

        <div className="modal-actions" style={{ marginTop: '16px' }}>
          <button type="button" className="btn btn-ghost" onClick={onClose}>Tutup</button>
        </div>
      </div>
    </div>
  );
};
