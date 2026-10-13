import React, { useState, useMemo } from 'react';
import type { KontakItem, BrandId } from '../../types';
import { BRAND_LABEL, BRAND_ICONS } from '../../lib/contentPlanUtils';

interface KontakViewProps {
  kontakList: KontakItem[];
  activeBrand: BrandId;
  onBrandChange: (brand: BrandId) => void;
  onSaveKontak: (item: KontakItem) => Promise<void>;
  onUpdateKontak: (item: KontakItem) => Promise<void>;
  onDeleteKontak: (id: number | string) => Promise<void>;
}

export const KontakView: React.FC<KontakViewProps> = ({
  kontakList,
  activeBrand,
  onBrandChange,
  onSaveKontak,
  onUpdateKontak,
  onDeleteKontak
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [brandFilter, setBrandFilter] = useState<string>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<KontakItem | null>(null);

  // Form states
  const [formData, setFormData] = useState<Partial<KontakItem>>({
    nama: '',
    peran: '',
    brand: activeBrand,
    hp: '',
    email: '',
    alamat: '',
    catatan: ''
  });

  const openAddModal = () => {
    setFormData({
      nama: '',
      peran: '',
      brand: activeBrand === 'pratani' ? '' : activeBrand,
      hp: '',
      email: '',
      alamat: '',
      catatan: ''
    });
    setEditItem(null);
    setIsAddModalOpen(true);
  };

  const openEditModal = (item: KontakItem) => {
    setFormData({ ...item });
    setEditItem(item);
    setIsAddModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nama?.trim()) return;

    if (editItem) {
      await onUpdateKontak({
        ...editItem,
        ...formData,
        nama: formData.nama.trim()
      } as KontakItem);
    } else {
      const newItem: KontakItem = {
        id: Date.now(),
        nama: formData.nama.trim(),
        peran: formData.peran || '',
        brand: formData.brand || '',
        hp: formData.hp || '',
        email: formData.email || '',
        alamat: formData.alamat || '',
        catatan: formData.catatan || ''
      };
      await onSaveKontak(newItem);
    }
    setIsAddModalOpen(false);
  };

  const filteredKontak = useMemo(() => {
    let list = [...(kontakList || [])];

    if (brandFilter !== 'all') {
      if (brandFilter === 'umum') {
        list = list.filter((k) => !k.brand);
      } else {
        list = list.filter((k) => (k.brand || '').toLowerCase() === brandFilter.toLowerCase());
      }
    }

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      list = list.filter((k) =>
        (k.nama || '').toLowerCase().includes(q) ||
        (k.peran || '').toLowerCase().includes(q) ||
        (k.hp || '').toLowerCase().includes(q) ||
        (k.email || '').toLowerCase().includes(q) ||
        (k.alamat || '').toLowerCase().includes(q) ||
        (k.catatan || '').toLowerCase().includes(q)
      );
    }

    return list.sort((a, b) => a.nama.localeCompare(b.nama));
  }, [kontakList, brandFilter, searchTerm]);

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '40px' }}>
      {/* Header Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <div style={{ fontSize: '11px', fontFamily: 'DM Mono', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            👥 Direktori Kontak & Stakeholder
          </div>
          <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text)' }}>
            Daftar Kontak ({filteredKontak.length} Orang)
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button className="btn btn-primary btn-sm" onClick={openAddModal}>
            + Tambah Kontak
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          <button
            className={`filter-btn ${brandFilter === 'all' ? 'active' : ''}`}
            onClick={() => setBrandFilter('all')}
          >
            Semua ({kontakList?.length || 0})
          </button>
          <button
            className={`filter-btn ${brandFilter === 'dikopi' ? 'active' : ''}`}
            onClick={() => { setBrandFilter('dikopi'); onBrandChange('dikopi'); }}
          >
            ☕ Dikopi
          </button>
          <button
            className={`filter-btn ${brandFilter === 'kolektiva' ? 'active' : ''}`}
            onClick={() => { setBrandFilter('kolektiva'); onBrandChange('kolektiva'); }}
          >
            🛍️ Kolektiva
          </button>
          <button
            className={`filter-btn ${brandFilter === 'imagineer' ? 'active' : ''}`}
            onClick={() => { setBrandFilter('imagineer'); onBrandChange('imagineer'); }}
          >
            ✨ Imagineer
          </button>
          <button
            className={`filter-btn ${brandFilter === 'umum' ? 'active' : ''}`}
            onClick={() => setBrandFilter('umum')}
          >
            🏢 Umum / PT
          </button>
        </div>

        <div style={{ position: 'relative', minWidth: '240px', flex: 1, maxWidth: '360px' }}>
          <input
            className="form-input"
            placeholder="Cari kontak, jabatan, HP, email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ paddingLeft: '32px', fontSize: '12px' }}
          />
          <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)', fontSize: '13px' }}>
            🔍
          </span>
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer' }}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Grid Kontak Cards */}
      {filteredKontak.length === 0 ? (
        <div className="empty" style={{ padding: '60px 20px', textAlign: 'center' }}>
          <div className="empty-icon" style={{ fontSize: '40px', marginBottom: '8px' }}>👥</div>
          <div style={{ fontWeight: 600, fontSize: '15px' }}>Belum ada kontak</div>
          <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '4px' }}>
            Klik tombol &quot;+ Tambah Kontak&quot; untuk mencatat klien, supplier, atau partner.
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '12px' }}>
          {filteredKontak.map((k) => {
            const initial = (k.nama || '?').charAt(0).toUpperCase();
            const brandLabel = k.brand ? (BRAND_LABEL[k.brand] || k.brand) : 'Umum';
            const brandIcon = k.brand ? (BRAND_ICONS[k.brand] || '🏢') : '🏢';

            return (
              <div key={k.id} className="kontak-card" style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', position: 'relative' }}>
                <div className="kontak-avatar" style={{ flexShrink: 0 }}>
                  {initial}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                    <div className="kontak-name" style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text)' }}>
                      {k.nama}
                    </div>
                  </div>

                  <div className="kontak-role" style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '2px' }}>
                    {k.peran || '—'} · <span style={{ color: 'var(--accent)', fontWeight: 500 }}>{brandIcon} {brandLabel}</span>
                  </div>

                  {k.hp && (
                    <div className="kontak-hp" style={{ marginTop: '6px', fontSize: '12px', fontFamily: 'DM Mono' }}>
                      <a href={`https://wa.me/${k.hp.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" style={{ color: '#4cc9a0', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <span>📱</span> {k.hp}
                      </a>
                    </div>
                  )}

                  {k.email && (
                    <div style={{ fontSize: '11px', color: 'var(--text2)', marginTop: '3px' }}>
                      <a href={`mailto:${k.email}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                        ✉️ {k.email}
                      </a>
                    </div>
                  )}

                  {k.alamat && (
                    <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '4px', lineHeight: 1.4 }}>
                      📍 {k.alamat}
                    </div>
                  )}

                  {k.catatan && (
                    <div style={{ fontSize: '10.5px', color: 'var(--muted)', background: 'var(--surface3)', borderRadius: '6px', padding: '4px 8px', marginTop: '6px', lineHeight: 1.4 }}>
                      💬 {k.catatan}
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flexShrink: 0 }}>
                  <button
                    className="btn btn-ghost btn-sm"
                    style={{ padding: '4px 6px', fontSize: '11px' }}
                    onClick={() => openEditModal(k)}
                    title="Edit Kontak"
                  >
                    ✏️
                  </button>
                  <button
                    className="btn btn-danger btn-sm"
                    style={{ padding: '4px 6px', fontSize: '11px' }}
                    onClick={() => {
                      if (window.confirm(`Hapus kontak "${k.nama}"?`)) {
                        onDeleteKontak(k.id);
                      }
                    }}
                    title="Hapus Kontak"
                  >
                    ✕
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Add / Edit Kontak */}
      {isAddModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsAddModalOpen(false)}>
          <div className="modal" style={{ maxWidth: '480px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">{editItem ? '✏️ Edit Kontak' : '👥 Tambah Kontak Baru'}</div>
              <button className="modal-close" onClick={() => setIsAddModalOpen(false)}>✕</button>
            </div>

            <form onSubmit={handleFormSubmit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div className="form-group">
                  <div className="form-label">Nama Lengkap *</div>
                  <input
                    className="form-input"
                    required
                    placeholder="Contoh: Aditya Uki Nugroho"
                    value={formData.nama || ''}
                    onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                    autoFocus
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div className="form-group">
                    <div className="form-label">Peran / Jabatan</div>
                    <input
                      className="form-input"
                      placeholder="Co Danus, Vendor, dll"
                      value={formData.peran || ''}
                      onChange={(e) => setFormData({ ...formData, peran: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <div className="form-label">Afiliasi Brand</div>
                    <select
                      className="form-select"
                      value={formData.brand || ''}
                      onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    >
                      <option value="">Umum / PT Pratani</option>
                      <option value="dikopi">☕ Dikopi F&B</option>
                      <option value="kolektiva">🛍️ Kolektiva</option>
                      <option value="imagineer">✨ Imagineer</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div className="form-group">
                    <div className="form-label">No. HP / WhatsApp</div>
                    <input
                      className="form-input"
                      placeholder="0812-xxxx-xxxx"
                      value={formData.hp || ''}
                      onChange={(e) => setFormData({ ...formData, hp: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <div className="form-label">Email</div>
                    <input
                      className="form-input"
                      type="email"
                      placeholder="email@domain.com"
                      value={formData.email || ''}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <div className="form-label">Alamat / Lokasi</div>
                  <input
                    className="form-input"
                    placeholder="Kota, Kecamatan, atau nama instansi"
                    value={formData.alamat || ''}
                    onChange={(e) => setFormData({ ...formData, alamat: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <div className="form-label">Catatan Tambahan</div>
                  <textarea
                    className="form-textarea"
                    rows={2}
                    placeholder="Preferensi komunikasi, history kolaborasi..."
                    value={formData.catatan || ''}
                    onChange={(e) => setFormData({ ...formData, catatan: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button type="button" className="btn btn-ghost" onClick={() => setIsAddModalOpen(false)}>
                  Batal
                </button>
                <button type="submit" className="btn btn-primary">
                  💾 Simpan Kontak
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
