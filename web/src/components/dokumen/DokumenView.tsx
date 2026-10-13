import React, { useState, useMemo } from 'react';
import type { FolderItem, DokumenFileItem } from '../../types';

interface DokumenViewProps {
  folders: FolderItem[];
  dokumen: DokumenFileItem[];
  onSaveFolder: (f: FolderItem) => Promise<void>;
  onUpdateFolder: (f: FolderItem) => Promise<void>;
  onDeleteFolder: (id: number | string) => Promise<void>;
  onSaveFile: (f: DokumenFileItem) => Promise<void>;
  onDeleteFile: (id: number | string) => Promise<void>;
}

export const DokumenView: React.FC<DokumenViewProps> = ({
  folders,
  dokumen,
  onSaveFolder,
  onUpdateFolder,
  onDeleteFolder,
  onSaveFile,
  onDeleteFile
}) => {
  const [currentFolderId, setCurrentFolderId] = useState<number | string | null>(null);
  const [fmView, setFmView] = useState<'large' | 'medium' | 'small' | 'list' | 'detail'>('large');
  const [searchTerm, setSearchTerm] = useState('');

  // Modals
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [editingFolder, setEditingFolder] = useState<FolderItem | null>(null);

  // Breadcrumbs path
  const breadcrumbs = useMemo(() => {
    const path: FolderItem[] = [];
    let cur = currentFolderId;
    while (cur) {
      const f = folders.find((x) => String(x.id) === String(cur));
      if (!f) break;
      path.unshift(f);
      cur = f.parentId || null;
    }
    return path;
  }, [folders, currentFolderId]);

  // Current subfolders & files
  const subFolders = useMemo(() => {
    return folders
      .filter((f) => (f.parentId || null) === (currentFolderId || null))
      .filter((f) => !searchTerm.trim() || f.name.toLowerCase().includes(searchTerm.toLowerCase()))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [folders, currentFolderId, searchTerm]);

  const currentFiles = useMemo(() => {
    return dokumen
      .filter((d) => (d.folderId || null) === (currentFolderId || null))
      .filter((d) => !searchTerm.trim() || d.origName.toLowerCase().includes(searchTerm.toLowerCase()))
      .sort((a, b) => Number(b.id) - Number(a.id));
  }, [dokumen, currentFolderId, searchTerm]);

  const fmtSize = (n?: number) => {
    if (!n) return '0 KB';
    if (n > 1024 * 1024) return (n / (1024 * 1024)).toFixed(1) + ' MB';
    return Math.round(n / 1024) + ' KB';
  };

  const getFileIcon = (ext?: string) => {
    const e = (ext || '').toLowerCase();
    if (['jpg', 'jpeg', 'png', 'svg', 'webp', 'gif'].includes(e)) return '🖼️';
    if (['pdf'].includes(e)) return '📄';
    if (['xlsx', 'xls', 'csv'].includes(e)) return '📊';
    if (['doc', 'docx'].includes(e)) return '📝';
    if (['zip', 'rar', '7z'].includes(e)) return '📦';
    return '📁';
  };

  const handleUploadFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = async (evt) => {
        const base64 = evt.target?.result as string;
        const newDoc: DokumenFileItem = {
          id: Date.now() + Math.random(),
          origName: file.name,
          folderId: currentFolderId,
          size: file.size,
          ext: file.name.split('.').pop() || '',
          date: new Date().toISOString().split('T')[0],
          stored: base64
        };
        await onSaveFile(newDoc);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleDownloadFile = (f: DokumenFileItem) => {
    if (!f.stored) return;
    const a = document.createElement('a');
    a.href = f.stored;
    a.download = f.origName;
    a.click();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* ── TOOLBAR & BREADCRUMBS ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
        {/* Breadcrumb */}
        <div className="fm-breadcrumb" style={{ flex: 1, minWidth: '220px' }}>
          <span
            className={`fm-bread-item ${!currentFolderId ? 'active' : ''}`}
            onClick={() => setCurrentFolderId(null)}
          >
            📁 Dokumen
          </span>
          {breadcrumbs.map((f, i) => (
            <React.Fragment key={f.id}>
              <span className="fm-bread-sep">›</span>
              <span
                className={`fm-bread-item ${i === breadcrumbs.length - 1 ? 'active' : ''}`}
                onClick={() => setCurrentFolderId(f.id)}
              >
                {f.icon || '📁'} {f.name}
              </span>
            </React.Fragment>
          ))}
        </div>

        {/* Search, View Toggles & Actions */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          <input
            type="text"
            className="form-input"
            placeholder="🔍 Cari file / folder..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '180px', padding: '6px 12px', fontSize: '12px' }}
          />

          {/* View Toggles */}
          <div className="fm-view-toggle">
            <button
              type="button"
              className={`fm-view-btn ${fmView === 'large' ? 'active' : ''}`}
              onClick={() => setFmView('large')}
              title="Large Grid"
            >
              ⊞
            </button>
            <button
              type="button"
              className={`fm-view-btn ${fmView === 'medium' ? 'active' : ''}`}
              onClick={() => setFmView('medium')}
              title="Medium Grid"
            >
              ⊟
            </button>
            <button
              type="button"
              className={`fm-view-btn ${fmView === 'small' ? 'active' : ''}`}
              onClick={() => setFmView('small')}
              title="Small Grid"
            >
              ⊠
            </button>
            <button
              type="button"
              className={`fm-view-btn ${fmView === 'list' ? 'active' : ''}`}
              onClick={() => setFmView('list')}
              title="List View"
            >
              ☰
            </button>
            <button
              type="button"
              className={`fm-view-btn ${fmView === 'detail' ? 'active' : ''}`}
              onClick={() => setFmView('detail')}
              title="Detail Table"
            >
              ⊟
            </button>
          </div>

          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => {
              setEditingFolder(null);
              setIsFolderModalOpen(true);
            }}
          >
            + Folder
          </button>

          <label className="btn btn-primary btn-sm" style={{ cursor: 'pointer', margin: 0 }}>
            ⬆ Upload File
            <input type="file" multiple onChange={handleUploadFiles} style={{ display: 'none' }} />
          </label>
        </div>
      </div>

      {/* ── CONTENT AREA ── */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '16px', minHeight: '380px' }}>
        {subFolders.length === 0 && currentFiles.length === 0 ? (
          <div className="fm-empty-folder" style={{ textAlign: 'center', padding: '48px 0', color: 'var(--muted)' }}>
            <div className="empty-icon" style={{ fontSize: '48px', marginBottom: '12px' }}>📂</div>
            Folder ini kosong<br />
            <span style={{ fontSize: '12px' }}>Upload file atau buat folder baru di atas</span>
          </div>
        ) : fmView === 'detail' ? (
          /* Detail Table View */
          <div>
            <div className="fm-detail-header" style={{ display: 'grid', gridTemplateColumns: '32px 1fr 100px 100px 120px 80px', padding: '8px 12px', borderBottom: '1px solid var(--border)', fontSize: '11px', color: 'var(--muted)', fontFamily: 'DM Mono' }}>
              <span></span>
              <span>Nama</span>
              <span>Tipe</span>
              <span>Ukuran</span>
              <span>Tanggal</span>
              <span style={{ textAlign: 'right' }}>Aksi</span>
            </div>

            {subFolders.map((f) => (
              <div
                key={`f_${f.id}`}
                className="fm-item"
                style={{ display: 'grid', gridTemplateColumns: '32px 1fr 100px 100px 120px 80px', padding: '8px 12px', borderBottom: '1px solid var(--border)', alignItems: 'center', cursor: 'pointer' }}
                onClick={() => setCurrentFolderId(f.id)}
              >
                <span>{f.icon || '📁'}</span>
                <span style={{ fontWeight: 600 }}>{f.name}</span>
                <span style={{ color: 'var(--muted)', fontSize: '11px' }}>Folder</span>
                <span style={{ color: 'var(--muted)', fontSize: '11px' }}>—</span>
                <span style={{ color: 'var(--muted)', fontSize: '11px' }}>{f.date || '—'}</span>
                <div style={{ textAlign: 'right', display: 'flex', gap: '4px', justifyContent: 'flex-end' }} onClick={(e) => e.stopPropagation()}>
                  <button type="button" className="fm-item-btn" onClick={() => { setEditingFolder(f); setIsFolderModalOpen(true); }}>✏️</button>
                  <button type="button" className="fm-item-btn danger" onClick={async () => { if (window.confirm('Hapus folder ini?')) await onDeleteFolder(f.id); }}>🗑️</button>
                </div>
              </div>
            ))}

            {currentFiles.map((d) => (
              <div
                key={`d_${d.id}`}
                className="fm-item"
                style={{ display: 'grid', gridTemplateColumns: '32px 1fr 100px 100px 120px 80px', padding: '8px 12px', borderBottom: '1px solid var(--border)', alignItems: 'center' }}
              >
                <span>{getFileIcon(d.ext)}</span>
                <span style={{ fontWeight: 500 }}>{d.origName}</span>
                <span style={{ color: 'var(--muted)', fontSize: '11px' }}>{d.ext?.toUpperCase() || 'FILE'}</span>
                <span style={{ color: 'var(--muted)', fontSize: '11px' }}>{fmtSize(d.size)}</span>
                <span style={{ color: 'var(--muted)', fontSize: '11px' }}>{d.date || '—'}</span>
                <div style={{ textAlign: 'right', display: 'flex', gap: '4px', justifyContent: 'flex-end' }}>
                  {d.stored && <button type="button" className="fm-item-btn" onClick={() => handleDownloadFile(d)} title="Download">⬇️</button>}
                  <button type="button" className="fm-item-btn danger" onClick={async () => { if (window.confirm('Hapus file ini?')) await onDeleteFile(d.id); }} title="Hapus">🗑️</button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Grid & List Views */
          <div className={`fm-view-${fmView}`}>
            {/* Folders */}
            {subFolders.map((f) => (
              <div
                key={`f_${f.id}`}
                className="fm-item"
                onClick={() => setCurrentFolderId(f.id)}
              >
                <div className="fm-item-actions" onClick={(e) => e.stopPropagation()}>
                  <button type="button" className="fm-item-btn" onClick={() => { setEditingFolder(f); setIsFolderModalOpen(true); }}>✏️</button>
                  <button type="button" className="fm-item-btn danger" onClick={async () => { if (window.confirm('Hapus folder ini?')) await onDeleteFolder(f.id); }}>🗑️</button>
                </div>
                <div className="fm-icon">{f.icon || '📁'}</div>
                <div className="fm-item-name">{f.name}</div>
                <div className="fm-item-meta">{f.date || 'Folder'}</div>
              </div>
            ))}

            {/* Files */}
            {currentFiles.map((d) => (
              <div key={`d_${d.id}`} className="fm-item">
                <div className="fm-item-actions" onClick={(e) => e.stopPropagation()}>
                  {d.stored && <button type="button" className="fm-item-btn" onClick={() => handleDownloadFile(d)} title="Download">⬇️</button>}
                  <button type="button" className="fm-item-btn danger" onClick={async () => { if (window.confirm('Hapus file ini?')) await onDeleteFile(d.id); }} title="Hapus">🗑️</button>
                </div>
                <div className="fm-icon">{getFileIcon(d.ext)}</div>
                <div className="fm-item-name">{d.origName}</div>
                <div className="fm-item-meta">{fmtSize(d.size)}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── FOLDER CREATE / EDIT MODAL ── */}
      {isFolderModalOpen && (
        <FolderModal
          isOpen={true}
          onClose={() => setIsFolderModalOpen(false)}
          folderToEdit={editingFolder}
          parentId={currentFolderId}
          onSave={async (item) => {
            if (editingFolder) {
              await onUpdateFolder(item);
            } else {
              await onSaveFolder(item);
            }
          }}
        />
      )}
    </div>
  );
};

// ── FOLDER MODAL ──
interface FolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  folderToEdit: FolderItem | null;
  parentId: number | string | null;
  onSave: (f: FolderItem) => Promise<void>;
}

const FolderModal: React.FC<FolderModalProps> = ({
  isOpen,
  onClose,
  folderToEdit,
  parentId,
  onSave
}) => {
  const [name, setName] = useState(() => folderToEdit?.name || '');
  const [icon, setIcon] = useState(() => folderToEdit?.icon || '📁');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      const f: FolderItem = {
        id: folderToEdit?.id ?? Date.now(),
        name: name.trim(),
        parentId: folderToEdit ? folderToEdit.parentId : parentId,
        icon,
        date: new Date().toISOString().split('T')[0]
      };
      await onSave(f);
      onClose();
    } catch (err) {
      console.error(err);
      alert('Gagal menyimpan folder');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal" style={{ maxWidth: '400px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <div className="modal-title" style={{ marginBottom: 0 }}>
            {folderToEdit ? '✏️ Edit Folder' : '+ Folder Baru'}
          </div>
          <button type="button" className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div className="form-group">
            <label className="form-label">Nama Folder *</label>
            <input
              className="form-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Misal: Marketing Assets, Foto Produk..."
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="form-label">Ikon Folder</label>
            <select className="form-select" value={icon} onChange={(e) => setIcon(e.target.value)}>
              <option value="📁">📁 Folder Biasa</option>
              <option value="🛍️">🛍️ Kolektiva</option>
              <option value="☕">☕ Dikopi</option>
              <option value="✨">✨ Imagineer</option>
              <option value="🖼️">🖼️ Foto / Galeri</option>
              <option value="📊">📊 Laporan & Data</option>
              <option value="📄">📄 Dokumen Kontrak</option>
            </select>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Batal</button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Menyimpan...' : '💾 Simpan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
