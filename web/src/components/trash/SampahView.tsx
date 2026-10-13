import React, { useState, useMemo } from 'react';
import type { TrashItem } from '../../types';

interface SampahViewProps {
  trashList: TrashItem[];
  onRestoreItem: (id: number | string) => Promise<void>;
  onPermanentDeleteItem: (id: number | string) => Promise<void>;
  onRestoreAll: () => Promise<void>;
  onEmptyTrash: () => Promise<void>;
}

const TABLE_LABEL: Record<string, string> = {
  todos: 'Content Plan',
  projects: 'Projects',
  orders: 'Orders',
  dokumen: 'Dokumen',
  keuangan: 'Keuangan',
  kontak: 'Kontak',
  analytics: 'Analytics',
  adsplan: 'Ads Plan',
  folder_tree: 'Folder'
};

function getFileIcon(ext?: string): string {
  if (!ext) return '📄';
  const e = ext.toLowerCase().replace('.', '');
  if (['png', 'jpg', 'jpeg', 'svg', 'webp'].includes(e)) return '🖼️';
  if (['pdf'].includes(e)) return '📕';
  if (['xls', 'xlsx', 'csv'].includes(e)) return '📊';
  if (['doc', 'docx'].includes(e)) return '📝';
  if (['zip', 'rar', '7z'].includes(e)) return '📦';
  return '📄';
}

function fmtSize(bytes?: number): string {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export const SampahView: React.FC<SampahViewProps> = ({
  trashList,
  onRestoreItem,
  onPermanentDeleteItem,
  onRestoreAll,
  onEmptyTrash
}) => {
  const [deleteConfirmItem, setDeleteConfirmItem] = useState<TrashItem | null>(null);

  const sortedTrash = useMemo(() => {
    return [...(trashList || [])].sort((a, b) => {
      const ta = a.deletedAt ? new Date(a.deletedAt).getTime() : 0;
      const tb = b.deletedAt ? new Date(b.deletedAt).getTime() : 0;
      return tb - ta;
    });
  }, [trashList]);

  if (!trashList || trashList.length === 0) {
    return (
      <div className="trash-empty" style={{ textAlign: 'center', padding: '80px 20px' }}>
        <div className="empty-icon" style={{ fontSize: '52px', marginBottom: '16px', opacity: 0.5 }}>
          🗑️
        </div>
        <div style={{ fontSize: '16px', fontWeight: 600 }}>Sampah kosong</div>
        <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '4px' }}>
          File dan data yang dihapus akan muncul di sini dan dapat dipulihkan kapan saja.
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', paddingBottom: '40px' }}>
      {/* Header Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
        <div>
          <div style={{ fontSize: '11px', fontFamily: 'DM Mono', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            🗑️ Recycle Bin & File Recovery
          </div>
          <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text)' }}>
            Kotak Sampah ({trashList.length} Item)
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            className="btn btn-ghost btn-sm"
            onClick={async () => {
              if (window.confirm('Pulihkan semua item di sampah kembali ke tempat semula?')) {
                await onRestoreAll();
              }
            }}
          >
            ↩️ Pulihkan Semua
          </button>
          <button
            className="btn btn-danger btn-sm"
            onClick={async () => {
              if (window.confirm('⚠️ Kosongkan sampah sekarang? Semua item akan dihapus permanen!')) {
                await onEmptyTrash();
              }
            }}
          >
            🗑️ Kosongkan Sampah
          </button>
        </div>
      </div>

      {/* Warning Notice */}
      <div
        style={{
          background: 'rgba(212, 96, 58, 0.08)',
          border: '1px solid rgba(212, 96, 58, 0.25)',
          borderRadius: '8px',
          padding: '10px 14px',
          fontSize: '12px',
          color: 'var(--red)',
          marginBottom: '14px',
          lineHeight: 1.5
        }}
      >
        ⚠️ Item di sampah <strong>belum terhapus dari storage</strong>. Anda bisa memulihkan item atau klik Hapus Permanen untuk membersihkan storage.
      </div>

      {/* Trash Items List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {sortedTrash.map((t) => {
          const icon = t.isFolder ? '📂' : getFileIcon(t.item?.ext);
          const when = t.deletedAt
            ? new Date(t.deletedAt).toLocaleDateString('id-ID', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })
            : '—';
          const from = TABLE_LABEL[t.originalTable] || t.originalTable || 'Data';
          const sizeStr = t.item?.size ? ` · ${fmtSize(t.item.size)}` : '';

          return (
            <div
              key={t.id}
              className="trash-item"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 16px',
                background: 'var(--surface2)',
                border: '1px solid var(--border)',
                borderRadius: '10px'
              }}
            >
              <div className="trash-item-icon" style={{ fontSize: '24px', flexShrink: 0 }}>
                {icon}
              </div>

              <div className="trash-item-info" style={{ flex: 1, minWidth: 0 }}>
                <div className="trash-item-name" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>
                  {t.label}
                </div>
                <div className="trash-item-meta" style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '2px' }}>
                  Dari: {from}{sizeStr} · Dihapus {when}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => onRestoreItem(t.id)}
                  title="Pulihkan ke tempat semula"
                >
                  ↩️ Pulihkan
                </button>
                <button
                  className="btn btn-danger btn-sm"
                  onClick={() => setDeleteConfirmItem(t)}
                  title="Hapus permanen dari disk"
                >
                  💀 Hapus
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Permanent Delete Confirmation Modal */}
      {deleteConfirmItem && (
        <div className="modal-backdrop" onClick={() => setDeleteConfirmItem(null)}>
          <div className="modal" style={{ maxWidth: '420px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">⚠️ Hapus Permanen</div>
              <button className="modal-close" onClick={() => setDeleteConfirmItem(null)}>✕</button>
            </div>

            <div className="modal-body" style={{ textAlign: 'center', padding: '16px 12px' }}>
              <div style={{ fontSize: '36px', marginBottom: '10px' }}>💀</div>
              <div style={{ fontSize: '14px', fontWeight: 700, marginBottom: '6px', color: 'var(--text)' }}>
                &quot;{deleteConfirmItem.label}&quot;
              </div>
              <div style={{ fontSize: '12px', color: 'var(--muted)', lineHeight: 1.6 }}>
                Item akan <strong>dihapus permanen dari storage</strong>.<br />
                Tindakan ini tidak bisa dibatalkan setelah dieksekusi.
              </div>
            </div>

            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button className="btn btn-ghost" onClick={() => setDeleteConfirmItem(null)}>
                Batal
              </button>
              <button
                className="btn btn-danger"
                onClick={async () => {
                  const id = deleteConfirmItem.id;
                  setDeleteConfirmItem(null);
                  await onPermanentDeleteItem(id);
                }}
              >
                💀 Ya, Hapus Permanen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
