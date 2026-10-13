import React, { useState } from 'react';
import type { TodoContentItem, PilarItem, BrandId } from '../../types';
import { 
  getHari, 
  fmtTanggal, 
  getPilarStyle, 
  hexToRgba, 
  BRAND_LABEL, 
  SAMPLE_TEMPLATE_JSON 
} from '../../lib/contentPlanUtils';
import { autoSlashDate, toDisplayDate, toStorageDate, getBulanLabel } from '../../lib/keuanganUtils';

// ============================================================
// 1. DETAIL KONTEN MODAL
// ============================================================
interface ContentDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: TodoContentItem | null;
  pilars: PilarItem[];
  onEdit: (item: TodoContentItem) => void;
  onDelete: (id: number | string) => Promise<void>;
  onToggleDone: (id: number | string) => Promise<void>;
}

export const ContentDetailModal: React.FC<ContentDetailModalProps> = ({
  isOpen,
  onClose,
  item,
  pilars,
  onEdit,
  onDelete,
  onToggleDone
}) => {
  if (!isOpen || !item) return null;

  const hari = getHari(item.tanggalPosting);

  const detailCard = (icon: string, label: string, value?: string) => (
    <div style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: '10px', padding: '12px' }}>
      <div className="form-label" style={{ marginBottom: '5px' }}>{icon} {label}</div>
      <div style={{ fontSize: '13px', color: 'var(--text)', lineHeight: 1.6, wordBreak: 'break-word' }}>
        {value || '—'}
      </div>
    </div>
  );

  return (
    <div className="modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal" style={{ maxWidth: '640px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <div className="modal-title" style={{ marginBottom: 0 }}>📋 Detail Konten</div>
          <button 
            type="button" 
            className="btn btn-ghost btn-sm" 
            onClick={onClose}
            style={{ padding: '3px 8px', fontSize: '13px' }}
          >
            ✕
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* Header Badges */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
            <span className={`pill pill-${item.brand}`} style={{ fontWeight: 600 }}>
              {BRAND_LABEL[item.brand] || item.brand}
            </span>
            {item.pilar && (
              <span className="pill-pilar" style={{ ...getPilarStyle(item.pilar, pilars), padding: '3px 10px', borderRadius: '99px', fontSize: '11px' }}>
                {item.pilar}
              </span>
            )}
            {item.format && (
              <span style={{ fontSize: '11px', color: 'var(--muted)', background: 'var(--surface3)', padding: '2px 10px', borderRadius: '99px' }}>
                {item.format}
              </span>
            )}
            {item.done ? (
              <span className="pill pill-done">✅ Sudah Diposting</span>
            ) : (
              <span className="pill pill-pending">⏳ Belum Diposting</span>
            )}
          </div>

          {/* Title Box */}
          <div style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: '10px', padding: '14px' }}>
            <div className="form-label" style={{ marginBottom: '6px' }}>📝 Judul / Tema Konten</div>
            <div style={{ fontSize: '15.5px', fontWeight: 600, color: 'var(--text)', lineHeight: 1.5 }}>
              {item.judul || 'Tanpa Judul'}
            </div>
          </div>

          {/* Date Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
            {detailCard('📅', 'Tanggal Posting', fmtTanggal(item.tanggalPosting))}
            {detailCard('📆', 'Hari', hari)}
            {detailCard('📆', 'Bulan', getBulanLabel(item.bulan))}
          </div>

          {/* Caption Hook */}
          {item.hook && detailCard('🪝', 'Caption Hook', item.hook)}

          {/* CTA & Hashtags */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            {detailCard('📣', 'CTA', item.cta)}
            {detailCard('🏷️', 'Hashtag Bucket', item.hashtag)}
          </div>

          {/* Notes */}
          {item.notes && detailCard('📌', 'Notes', item.notes)}
        </div>

        {/* Modal Actions */}
        <div className="modal-actions" style={{ marginTop: '20px' }}>
          <button 
            type="button" 
            className="btn btn-danger btn-sm"
            onClick={async () => {
              if (window.confirm('Hapus konten ini dari Content Plan?')) {
                await onDelete(item.id);
                onClose();
              }
            }}
          >
            🗑️ Hapus
          </button>
          <button 
            type="button" 
            className="btn btn-ghost btn-sm"
            onClick={() => {
              onEdit(item);
              onClose();
            }}
          >
            ✏️ Edit
          </button>
          <button 
            type="button" 
            className="btn btn-primary btn-sm"
            onClick={async () => {
              await onToggleDone(item.id);
              onClose();
            }}
          >
            {item.done ? '↩️ Belum Diposting' : '✅ Mark Posted'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================================
// 2. ADD & EDIT KONTEN MODAL
// ============================================================
interface AddEditContentModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemToEdit?: TodoContentItem | null;
  initialBrand: BrandId;
  initialBulan?: string;
  pilars: PilarItem[];
  onSave: (todo: TodoContentItem) => Promise<void>;
}

export const AddEditContentModal: React.FC<AddEditContentModalProps> = ({
  isOpen,
  onClose,
  itemToEdit,
  initialBrand,
  initialBulan,
  pilars,
  onSave
}) => {
  const isEditing = Boolean(itemToEdit);

  // Local state form (mounts fresh on modal open)
  const [brand, setBrand] = useState<string>(() => itemToEdit?.brand || initialBrand);
  const [bulan, setBulan] = useState<string>(() => (
    itemToEdit?.bulan || initialBulan || new Date().toISOString().substring(0, 7)
  ));
  const [tanggalPosting, setTanggalPosting] = useState<string>(() => (
    itemToEdit?.tanggalPosting ? toDisplayDate(itemToEdit.tanggalPosting) : ''
  ));
  const [pilar, setPilar] = useState<string>(() => itemToEdit?.pilar || (pilars[0]?.nama || ''));
  const [format, setFormat] = useState<string>(() => itemToEdit?.format || 'Reels');
  const [judul, setJudul] = useState<string>(() => itemToEdit?.judul || '');
  const [hook, setHook] = useState<string>(() => itemToEdit?.hook || '');
  const [cta, setCta] = useState<string>(() => itemToEdit?.cta || '');
  const [hashtag, setHashtag] = useState<string>(() => itemToEdit?.hashtag || '');
  const [notes, setNotes] = useState<string>(() => itemToEdit?.notes || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!judul.trim()) {
      alert('Judul atau tema konten tidak boleh kosong');
      return;
    }

    setIsSubmitting(true);
    try {
      const storageDate = toStorageDate(tanggalPosting);
      const computedBulan = bulan || (storageDate ? storageDate.substring(0, 7) : new Date().toISOString().substring(0, 7));

      const todoItem: TodoContentItem = {
        id: itemToEdit?.id ?? Date.now(),
        brand,
        bulan: computedBulan,
        tanggalPosting: storageDate,
        pilar,
        format,
        judul: judul.trim(),
        hook: hook.trim(),
        cta: cta.trim(),
        hashtag: hashtag.trim(),
        notes: notes.trim(),
        done: itemToEdit?.done ?? false,
        boardStatus: itemToEdit?.boardStatus ?? 'not_started'
      };

      await onSave(todoItem);
      onClose();
    } catch (err) {
      console.error(err);
      alert('Gagal menyimpan konten planning');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal" style={{ maxWidth: '640px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <div className="modal-title" style={{ marginBottom: 0 }}>
            {isEditing ? '✏️ Edit Konten' : '+ Tambah Konten Planning'}
          </div>
          <button 
            type="button" 
            className="btn btn-ghost btn-sm" 
            onClick={onClose}
            style={{ padding: '3px 8px', fontSize: '13px' }}
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Brand / Divisi</label>
              <select className="form-select" value={brand} onChange={(e) => setBrand(e.target.value)}>
                {(['dikopi', 'kolektiva', 'imagineer'] as BrandId[]).map((b) => (
                  <option key={b} value={b}>{BRAND_LABEL[b]}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Bulan</label>
              <input
                className="form-input"
                type="month"
                value={bulan}
                onChange={(e) => setBulan(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Tanggal Posting</label>
              <input
                className="form-input"
                placeholder="DD/MM/YYYY"
                maxLength={10}
                value={tanggalPosting}
                onChange={(e) => setTanggalPosting(autoSlashDate(e.target.value))}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Konten Pilar</label>
              <select className="form-select" value={pilar} onChange={(e) => setPilar(e.target.value)}>
                <option value="">— Pilih Pilar —</option>
                {pilars.map((p) => (
                  <option key={p.nama} value={p.nama}>{p.nama}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Format Konten</label>
              <select className="form-select" value={format} onChange={(e) => setFormat(e.target.value)}>
                <option value="">— Pilih Format —</option>
                {['Reels', 'Carousel', 'Single Post', 'Story', 'Video', 'Blog', 'Thread'].map((f) => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Judul / Tema Konten *</label>
            <input
              className="form-input"
              value={judul}
              onChange={(e) => setJudul(e.target.value)}
              placeholder="Judul atau tema utama konten..."
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Caption Hook</label>
            <textarea
              className="form-textarea"
              style={{ minHeight: '65px' }}
              value={hook}
              onChange={(e) => setHook(e.target.value)}
              placeholder="Kalimat pembuka yang menarik perhatian..."
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">CTA (Call To Action)</label>
              <input
                className="form-input"
                value={cta}
                onChange={(e) => setCta(e.target.value)}
                placeholder="Call to action..."
              />
            </div>
            <div className="form-group" style={{ flex: 2 }}>
              <label className="form-label">Hashtag Bucket</label>
              <input
                className="form-input"
                value={hashtag}
                onChange={(e) => setHashtag(e.target.value)}
                placeholder="#hashtag1 #hashtag2 ..."
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Notes / Brief Visual</label>
            <textarea
              className="form-textarea"
              style={{ minHeight: '65px' }}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Catatan tambahan, referensi visual, instruksi editor..."
            />
          </div>

          <div className="modal-actions" style={{ marginTop: '10px' }}>
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              Batal
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Menyimpan...' : '💾 Simpan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ============================================================
// 3. KELOLA PILAR MODAL
// ============================================================
interface KelolaPilarModalProps {
  isOpen: boolean;
  onClose: () => void;
  pilars: PilarItem[];
  onSavePilars: (pilars: PilarItem[]) => Promise<void>;
}

export const KelolaPilarModal: React.FC<KelolaPilarModalProps> = ({
  isOpen,
  onClose,
  pilars,
  onSavePilars
}) => {
  const [localPilars, setLocalPilars] = useState<PilarItem[]>(() => pilars);
  const [newNama, setNewNama] = useState('');
  const [newColor, setNewColor] = useState('#4d9ef7');

  if (!isOpen) return null;

  const handleUpdateColor = (index: number, color: string) => {
    const updated = [...localPilars];
    updated[index] = {
      ...updated[index],
      color,
      bg: hexToRgba(color, 0.15)
    };
    setLocalPilars(updated);
  };

  const handleDeletePilar = (index: number) => {
    const updated = localPilars.filter((_, i) => i !== index);
    setLocalPilars(updated);
  };

  const handleAddPilar = () => {
    const trimmed = newNama.trim();
    if (!trimmed) {
      alert('Nama pilar tidak boleh kosong');
      return;
    }
    if (localPilars.some((p) => p.nama.toLowerCase() === trimmed.toLowerCase())) {
      alert('Pilar dengan nama tersebut sudah ada');
      return;
    }

    const newItem: PilarItem = {
      nama: trimmed,
      color: newColor,
      bg: hexToRgba(newColor, 0.15)
    };
    setLocalPilars([...localPilars, newItem]);
    setNewNama('');
  };

  const handleSave = async () => {
    await onSavePilars(localPilars);
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal" style={{ maxWidth: '520px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <div className="modal-title" style={{ marginBottom: 0 }}>🏷️ Kelola Konten Pilar</div>
          <button 
            type="button" 
            className="btn btn-ghost btn-sm" 
            onClick={onClose}
            style={{ padding: '3px 8px', fontSize: '13px' }}
          >
            ✕
          </button>
        </div>

        {/* List Pilars */}
        <div style={{ maxHeight: '280px', overflowY: 'auto', marginBottom: '16px' }}>
          {localPilars.map((p, i) => (
            <div 
              key={p.nama + i} 
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '10px', 
                padding: '8px 4px', 
                borderBottom: '1px solid var(--border)' 
              }}
            >
              <span 
                className="pill-pilar" 
                style={{ 
                  background: p.bg, 
                  color: p.color, 
                  minWidth: '120px', 
                  textAlign: 'center', 
                  fontSize: '12px' 
                }}
              >
                {p.nama}
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: 'auto' }}>
                <input
                  type="color"
                  value={p.color}
                  title="Warna pilar"
                  onChange={(e) => handleUpdateColor(i, e.target.value)}
                  style={{ width: '28px', height: '28px', border: 'none', background: 'none', cursor: 'pointer', padding: 0 }}
                />
                <button
                  type="button"
                  className="btn btn-danger btn-sm"
                  onClick={() => handleDeletePilar(i)}
                  style={{ padding: '2px 8px', fontSize: '11px', height: '26px' }}
                  title="Hapus Pilar"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Add New Pilar */}
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
          <div className="form-label" style={{ marginBottom: '8px' }}>Tambah Pilar Baru</div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <input
              className="form-input"
              placeholder="Nama pilar baru..."
              value={newNama}
              onChange={(e) => setNewNama(e.target.value)}
              style={{ flex: 1 }}
            />
            <input
              type="color"
              value={newColor}
              onChange={(e) => setNewColor(e.target.value)}
              title="Pilih warna"
              style={{ width: '38px', height: '36px', border: '1px solid var(--border)', borderRadius: '8px', background: 'var(--surface2)', cursor: 'pointer', padding: '2px' }}
            />
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={handleAddPilar}
              style={{ height: '36px', whiteSpace: 'nowrap' }}
            >
              + Tambah
            </button>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="modal-actions" style={{ marginTop: '20px' }}>
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Tutup
          </button>
          <button type="button" className="btn btn-primary" onClick={handleSave}>
            ✅ Selesai & Simpan
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================================
// 4. BULK IMPORT TODOS MODAL (SUPPORT FILE JSON)
// ============================================================
interface BulkImportTodosModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeBrand: BrandId;
  onImport: (items: TodoContentItem[], mode: 'append' | 'replaceBrand', targetBrand?: string) => Promise<void>;
}

export const BulkImportTodosModal: React.FC<BulkImportTodosModalProps> = ({
  isOpen,
  onClose,
  activeBrand,
  onImport
}) => {
  const [fileName, setFileName] = useState<string>('');
  const [parsedItems, setParsedItems] = useState<TodoContentItem[]>([]);
  const [importMode, setImportMode] = useState<'append' | 'replaceBrand'>('append');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleProcessFile = (file: File) => {
    setFileName(file.name);
    setErrorMsg(null);
    setParsedItems([]);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const parsed = JSON.parse(text);

        let entries: any[] = [];
        if (Array.isArray(parsed)) {
          entries = parsed;
        } else if (parsed && Array.isArray(parsed.todos)) {
          entries = parsed.todos;
        } else if (parsed && Array.isArray(parsed.sheets)) {
          // Flatten sheet rows if todolist format
          entries = parsed.sheets.flatMap((s: any) => s.rows || []);
        } else {
          throw new Error('Format JSON tidak valid. Harus berupa array data atau objek yang memiliki array todos.');
        }

        const LEGACY_MAP: Record<string, string> = {
          snm: 'kolektiva',
          evercraft: 'kolektiva'
        };

        const sanitized: TodoContentItem[] = entries.map((raw: any, idx: number) => {
          let brand = (raw.brand || activeBrand).toLowerCase();
          if (LEGACY_MAP[brand]) brand = LEGACY_MAP[brand];

          const tgl = raw.tanggalPosting || raw.tanggal || '';
          const bln = raw.bulan || (tgl ? tgl.substring(0, 7) : new Date().toISOString().substring(0, 7));

          return {
            id: raw.id ? Number(raw.id) || raw.id : Date.now() + idx,
            brand,
            bulan: bln,
            tanggalPosting: tgl,
            pilar: raw.pilar || 'Educational',
            format: raw.format || 'Reels',
            judul: String(raw.judul || raw.konsep || raw.title || `Konten #${idx + 1}`).trim(),
            hook: raw.hook || '',
            cta: raw.cta || '',
            hashtag: raw.hashtag || '',
            notes: raw.notes || raw.catatan || '',
            done: Boolean(raw.done || raw.boardStatus === 'done'),
            boardStatus: raw.boardStatus || (raw.done ? 'done' : 'not_started')
          };
        });

        if (sanitized.length === 0) {
          throw new Error('Tidak ditemukan baris konten di dalam file JSON ini.');
        }

        setParsedItems(sanitized);
      } catch (err: any) {
        setErrorMsg(err.message || 'Gagal memproses file JSON');
        setParsedItems([]);
      }
    };
    reader.readAsText(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleProcessFile(file);
  };

  const handleDownloadTemplate = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(SAMPLE_TEMPLATE_JSON, null, 2));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute('href', dataStr);
    dlAnchor.setAttribute('download', 'template_content_plan.json');
    dlAnchor.click();
  };

  const handleSubmit = async () => {
    if (parsedItems.length === 0) return;
    setIsSubmitting(true);
    try {
      await onImport(parsedItems, importMode, activeBrand);
      onClose();
    } catch (err) {
      console.error(err);
      alert('Gagal mengimport data konten');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal" style={{ maxWidth: '620px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <div className="modal-title" style={{ marginBottom: 0 }}>📥 Import Konten Plan (Bulk JSON)</div>
          <button 
            type="button" 
            className="btn btn-ghost btn-sm" 
            onClick={onClose}
            style={{ padding: '3px 8px', fontSize: '13px' }}
          >
            ✕
          </button>
        </div>

        {/* Upload Zone */}
        <div 
          style={{
            border: '2px dashed var(--border)',
            borderRadius: '12px',
            padding: '24px',
            textAlign: 'center',
            background: 'var(--surface2)',
            cursor: 'pointer',
            marginBottom: '16px',
            transition: 'border-color 0.2s'
          }}
          onClick={() => document.getElementById('bulkJsonInput')?.click()}
          onDragOver={(e) => { e.preventDefault(); }}
          onDrop={(e) => {
            e.preventDefault();
            const file = e.dataTransfer.files?.[0];
            if (file) handleProcessFile(file);
          }}
        >
          <div style={{ fontSize: '32px', marginBottom: '8px' }}>📂</div>
          <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)' }}>
            Klik atau Tarik File JSON ke Sini
          </div>
          <div style={{ fontSize: '11.5px', color: 'var(--muted)', marginTop: '4px' }}>
            {fileName ? `File terpilih: ${fileName}` : 'Mendukung format .json (array objek todos)'}
          </div>
          <input
            id="bulkJsonInput"
            type="file"
            accept=".json"
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
        </div>

        {errorMsg && (
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--red)', borderRadius: '8px', padding: '10px 14px', color: 'var(--red)', fontSize: '12.5px', marginBottom: '14px' }}>
            ⚠️ {errorMsg}
          </div>
        )}

        {/* Preview of Parsed Items */}
        {parsedItems.length > 0 && (
          <div style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--green)' }}>
                ✨ Terdeteksi {parsedItems.length} konten planning
              </span>
              <span style={{ fontSize: '11px', color: 'var(--muted)', fontFamily: 'DM Mono' }}>
                Preview 5 item pertama:
              </span>
            </div>

            <div style={{ maxHeight: '160px', overflowY: 'auto', border: '1px solid var(--border)', borderRadius: '8px', background: 'var(--surface)' }}>
              <table style={{ width: '100%', fontSize: '11.5px', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'var(--surface3)', textAlign: 'left', color: 'var(--muted)' }}>
                    <th style={{ padding: '6px 8px' }}>Brand</th>
                    <th style={{ padding: '6px 8px' }}>Tanggal</th>
                    <th style={{ padding: '6px 8px' }}>Pilar</th>
                    <th style={{ padding: '6px 8px' }}>Judul</th>
                  </tr>
                </thead>
                <tbody>
                  {parsedItems.slice(0, 5).map((it, idx) => (
                    <tr key={idx} style={{ borderTop: '1px solid var(--border)' }}>
                      <td style={{ padding: '6px 8px', textTransform: 'capitalize' }}>{it.brand}</td>
                      <td style={{ padding: '6px 8px', fontFamily: 'DM Mono' }}>{fmtTanggal(it.tanggalPosting)}</td>
                      <td style={{ padding: '6px 8px' }}>{it.pilar}</td>
                      <td style={{ padding: '6px 8px', fontWeight: 500 }}>{it.judul}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Import Mode Options */}
            <div style={{ marginTop: '14px' }}>
              <div className="form-label" style={{ marginBottom: '8px' }}>Mode Import:</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <label 
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: `1px solid ${importMode === 'append' ? 'var(--accent)' : 'var(--border)'}`,
                    background: importMode === 'append' ? 'rgba(56, 189, 248, 0.08)' : 'var(--surface2)',
                    cursor: 'pointer',
                    fontSize: '12.5px'
                  }}
                >
                  <input
                    type="radio"
                    name="importMode"
                    checked={importMode === 'append'}
                    onChange={() => setImportMode('append')}
                  />
                  <div>
                    <strong>Tambahkan (Append)</strong>
                    <div style={{ fontSize: '10.5px', color: 'var(--muted)' }}>Menambah ke data yang ada</div>
                  </div>
                </label>

                <label 
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: `1px solid ${importMode === 'replaceBrand' ? 'var(--yellow)' : 'var(--border)'}`,
                    background: importMode === 'replaceBrand' ? 'rgba(245, 158, 11, 0.08)' : 'var(--surface2)',
                    cursor: 'pointer',
                    fontSize: '12.5px'
                  }}
                >
                  <input
                    type="radio"
                    name="importMode"
                    checked={importMode === 'replaceBrand'}
                    onChange={() => setImportMode('replaceBrand')}
                  />
                  <div>
                    <strong>Timpa Brand Ini</strong>
                    <div style={{ fontSize: '10.5px', color: 'var(--muted)' }}>Ganti konten {BRAND_LABEL[activeBrand]}</div>
                  </div>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Modal Actions */}
        <div className="modal-actions" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={handleDownloadTemplate}
            style={{ fontSize: '11.5px', color: 'var(--accent)' }}
          >
            📋 Download Template JSON
          </button>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              Batal
            </button>
            <button
              type="button"
              className="btn btn-primary"
              disabled={parsedItems.length === 0 || isSubmitting}
              onClick={handleSubmit}
            >
              {isSubmitting ? 'Mengimport...' : `📥 Import ${parsedItems.length} Konten`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
