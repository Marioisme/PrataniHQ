import React, { useState } from 'react';
import type { ResepItem, BahanItem, ResepGroupItem, ResepIngredient, ComboItemEntry } from '../../types';
import {
  fmtRp,
  bahanHargaPerSatuan,
  hitungHPPResep,
  formatNumericInput,
  parseNumericInput,
  DEFAULT_CHANNELS
} from './resepUtils';

// ── 1. ADD / EDIT RESEP MODAL ──
interface AddEditResepModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: ResepItem | null;
  groups: ResepGroupItem[];
  channels: string[];
  getChannelLabel: (ch: string) => string;
  activeChannel: string;
  onSave: (resep: ResepItem) => void;
}

export const AddEditResepModal: React.FC<AddEditResepModalProps> = ({
  isOpen,
  onClose,
  initialData,
  groups,
  channels,
  getChannelLabel,
  activeChannel,
  onSave
}) => {
  const [nama, setNama] = useState(initialData?.nama || '');
  const [kategori, setKategori] = useState(initialData?.kategori || (groups[0]?.key || 'Coffee'));
  const [channel, setChannel] = useState(initialData?.channel || activeChannel || 'kedai');
  const [hargaJualStr, setHargaJualStr] = useState(
    initialData?.hargaJual ? initialData.hargaJual.toLocaleString('id-ID') : ''
  );
  const [hargaJualLargeStr, setHargaJualLargeStr] = useState(
    initialData?.hargaJualLarge ? initialData.hargaJualLarge.toLocaleString('id-ID') : ''
  );
  const [catatan, setCatatan] = useState(initialData?.catatan || '');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nama.trim()) {
      alert('Nama menu tidak boleh kosong');
      return;
    }
    const hargaJual = parseNumericInput(hargaJualStr);
    const hargaJualLarge = parseNumericInput(hargaJualLargeStr) || undefined;

    const resep: ResepItem = {
      id: initialData?.id || Date.now(),
      nama: nama.trim(),
      kategori,
      channel,
      hargaJual,
      hargaJualLarge,
      catatan: catatan.trim(),
      ingredients: initialData?.ingredients || [],
      hppSnapshot: initialData?.hppSnapshot || 0,
      hppSnapshotLarge: initialData?.hppSnapshotLarge || undefined,
      createdAt: initialData?.createdAt || new Date().toISOString()
    };
    onSave(resep);
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
        <div className="modal-title">{initialData ? '✏️ Edit Resep' : '+ Resep Baru'}</div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-row">
              <div className="form-group" style={{ flex: 2 }}>
                <div className="form-label">Nama Menu *</div>
                <input
                  className="form-input"
                  value={nama}
                  onChange={(e) => setNama(e.target.value)}
                  placeholder="Americano, Es Kopi Susu, Cold Brew..."
                  autoFocus
                />
              </div>
              <div className="form-group">
                <div className="form-label">Kategori</div>
                <select
                  className="form-select"
                  value={kategori}
                  onChange={(e) => setKategori(e.target.value)}
                >
                  {groups.map((g) => (
                    <option key={g.key} value={g.key}>
                      {g.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <div className="form-label">Channel</div>
                <select
                  className="form-select"
                  value={channel}
                  onChange={(e) => setChannel(e.target.value)}
                >
                  {channels.map((ch) => (
                    <option key={ch} value={ch}>
                      {getChannelLabel(ch)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <div className="form-label">Harga Regular (Rp) *</div>
                <input
                  className="form-input"
                  type="text"
                  inputMode="numeric"
                  value={hargaJualStr}
                  onChange={(e) => setHargaJualStr(formatNumericInput(e.target.value))}
                  placeholder="12.000"
                />
              </div>
              <div className="form-group">
                <div className="form-label">Harga Large (Rp)</div>
                <input
                  className="form-input"
                  type="text"
                  inputMode="numeric"
                  value={hargaJualLargeStr}
                  onChange={(e) => setHargaJualLargeStr(formatNumericInput(e.target.value))}
                  placeholder="15.000"
                />
              </div>
            </div>

            <div className="form-group">
              <div className="form-label">Catatan</div>
              <textarea
                className="form-textarea"
                value={catatan}
                onChange={(e) => setCatatan(e.target.value)}
                placeholder="Ukuran cup, suhu, variasi..."
                rows={2}
              />
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              Batal
            </button>
            <button type="submit" className="btn btn-primary">
              Simpan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ── 2. ADD / EDIT COMBO MODAL ──
interface AddEditComboModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: ResepItem | null;
  groups: ResepGroupItem[];
  channels: string[];
  getChannelLabel: (ch: string) => string;
  activeChannel: string;
  resepList: ResepItem[];
  bahanMap: Map<string, BahanItem>;
  onSave: (combo: ResepItem) => void;
}

export const AddEditComboModal: React.FC<AddEditComboModalProps> = ({
  isOpen,
  onClose,
  initialData,
  groups,
  channels,
  getChannelLabel,
  activeChannel,
  resepList,
  bahanMap,
  onSave
}) => {
  const [nama, setNama] = useState(initialData?.nama || '');
  const [kategori, setKategori] = useState(initialData?.kategori || (groups[0]?.key || 'Coffee'));
  const [channel, setChannel] = useState(initialData?.channel || activeChannel || 'kedai');
  const [hargaJualStr, setHargaJualStr] = useState(
    initialData?.hargaJual ? initialData.hargaJual.toLocaleString('id-ID') : ''
  );
  const [catatan, setCatatan] = useState(initialData?.catatan || '');
  const [items, setItems] = useState<ComboItemEntry[]>(initialData?.comboItems || []);
  const [pickedResepId, setPickedResepId] = useState<string>('');
  const [pickedQty, setPickedQty] = useState<number>(1);

  // Resep kandidat untuk bundle: non-combo di channel yang sama
  const candidateRecipes = resepList.filter(
    (r) => !r.isCombo && (r.channel || 'kedai') === channel && (!initialData || String(r.id) !== String(initialData.id))
  );

  const handleAddItem = () => {
    if (!pickedResepId) return;
    const existingIndex = items.findIndex((it) => String(it.resepId) === pickedResepId);
    if (existingIndex >= 0) {
      const copy = [...items];
      copy[existingIndex].qty += pickedQty;
      setItems(copy);
    } else {
      setItems([...items, { resepId: pickedResepId, qty: pickedQty }]);
    }
    setPickedResepId('');
    setPickedQty(1);
  };

  const handleRemoveItem = (rId: string | number) => {
    setItems(items.filter((it) => String(it.resepId) !== String(rId)));
  };

  // Kalkulasi total HPP bundle saat ini
  const totalHpp = React.useMemo(() => {
    let sum = 0;
    items.forEach((ci) => {
      const member = resepList.find((x) => String(x.id) === String(ci.resepId));
      if (member) {
        sum += hitungHPPResep(member, resepList, bahanMap) * (ci.qty || 1);
      }
    });
    return sum;
  }, [items, resepList, bahanMap]);

  const hargaJual = parseNumericInput(hargaJualStr);
  const margin = React.useMemo(() => {
    return hargaJual && totalHpp ? Math.round(((hargaJual - totalHpp) / hargaJual) * 100) : null;
  }, [hargaJual, totalHpp]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nama.trim()) {
      alert('Nama bundle tidak boleh kosong');
      return;
    }
    if (items.length < 2) {
      alert('Bundle minimal terdiri dari 2 menu');
      return;
    }

    const combo: ResepItem = {
      id: initialData?.id || Date.now(),
      nama: nama.trim(),
      isCombo: true,
      comboItems: items,
      kategori,
      channel,
      hargaJual,
      catatan: catatan.trim(),
      ingredients: [],
      hppSnapshot: totalHpp,
      createdAt: initialData?.createdAt || new Date().toISOString()
    };
    onSave(combo);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px' }}>
        <div className="modal-title">{initialData ? '✏️ Edit Bundle' : '🎁 Buat Bundle / Combo'}</div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div style={{ fontSize: '11.5px', color: 'var(--muted)', marginBottom: '12px' }}>
              Bundle menggabungkan HPP beberapa menu jadi 1 paket. Harga jual bisa lebih murah dari total normalnya.
            </div>

            <div className="form-row">
              <div className="form-group" style={{ flex: 2 }}>
                <div className="form-label">Nama Bundle *</div>
                <input
                  className="form-input"
                  value={nama}
                  onChange={(e) => setNama(e.target.value)}
                  placeholder="Bundle Hemat, Paket Pagi, dll..."
                  autoFocus
                />
              </div>
              <div className="form-group">
                <div className="form-label">Kategori</div>
                <select
                  className="form-select"
                  value={kategori}
                  onChange={(e) => setKategori(e.target.value)}
                >
                  {groups.map((g) => (
                    <option key={g.key} value={g.key}>
                      {g.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <div className="form-label">Channel</div>
                <select
                  className="form-select"
                  value={channel}
                  onChange={(e) => setChannel(e.target.value)}
                >
                  {channels.map((ch) => (
                    <option key={ch} value={ch}>
                      {getChannelLabel(ch)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <div className="form-label">Harga Jual Bundle (Rp)</div>
                <input
                  className="form-input"
                  type="text"
                  inputMode="numeric"
                  value={hargaJualStr}
                  onChange={(e) => setHargaJualStr(formatNumericInput(e.target.value))}
                  placeholder="0"
                />
              </div>
            </div>

            {/* Isi Bundle */}
            <div className="form-group">
              <div className="form-label">Isi Bundle (Minimal 2 menu)</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '8px' }}>
                {items.length === 0 ? (
                  <div style={{ fontSize: '12px', color: 'var(--muted)', padding: '6px 0' }}>
                    Belum ada menu di dalam bundle.
                  </div>
                ) : (
                  items.map((ci) => {
                    const r = resepList.find((x) => String(x.id) === String(ci.resepId));
                    if (!r) return null;
                    const rHpp = hitungHPPResep(r, resepList, bahanMap) * (ci.qty || 1);
                    return (
                      <div
                        key={ci.resepId}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '7px 12px',
                          background: 'var(--surface2)',
                          border: '1px solid var(--border)',
                          borderRadius: '8px'
                        }}
                      >
                        <span style={{ fontSize: '13px', flex: 1 }}>🎯 {r.nama}</span>
                        <span style={{ fontSize: '11px', color: 'var(--muted)' }}>×{ci.qty}</span>
                        <span style={{ fontSize: '12px', fontFamily: 'DM Mono', color: '#4cc9a0' }}>
                          {fmtRp(rHpp)}
                        </span>
                        <button
                          type="button"
                          className="tbl-action-btn tbl-del"
                          onClick={() => handleRemoveItem(ci.resepId)}
                        >
                          ✕
                        </button>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Picker tambah item */}
              <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
                <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                  <select
                    className="form-select"
                    value={pickedResepId}
                    onChange={(e) => setPickedResepId(e.target.value)}
                  >
                    <option value="">— Pilih menu —</option>
                    {candidateRecipes.map((r) => {
                      const rHpp = hitungHPPResep(r, resepList, bahanMap);
                      return (
                        <option key={r.id} value={r.id}>
                          {r.nama} (HPP {fmtRp(rHpp)})
                        </option>
                      );
                    })}
                  </select>
                </div>
                <div className="form-group" style={{ width: '70px', marginBottom: 0 }}>
                  <input
                    className="form-input"
                    type="number"
                    min={1}
                    value={pickedQty}
                    onChange={(e) => setPickedQty(Math.max(1, parseInt(e.target.value) || 1))}
                    style={{ textAlign: 'center' }}
                  />
                </div>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  style={{ marginBottom: 0 }}
                  onClick={handleAddItem}
                >
                  + Tambah
                </button>
              </div>

              {items.length > 0 && (
                <div
                  style={{
                    marginTop: '10px',
                    fontSize: '12px',
                    color: 'var(--muted)',
                    fontFamily: 'DM Mono'
                  }}
                >
                  Total HPP Bundle:{' '}
                  <span style={{ color: '#4cc9a0', fontWeight: 700 }}>{fmtRp(totalHpp)}</span>
                  {hargaJual > 0 && (
                    <>
                      {' · '}Margin:{' '}
                      <span
                        style={{
                          color: (margin ?? 0) >= 50 ? '#4cc9a0' : (margin ?? 0) >= 30 ? '#f5a623' : 'var(--red)',
                          fontWeight: 700
                        }}
                      >
                        {margin}%
                      </span>
                    </>
                  )}
                </div>
              )}
            </div>

            <div className="form-group">
              <div className="form-label">Catatan</div>
              <textarea
                className="form-textarea"
                value={catatan}
                onChange={(e) => setCatatan(e.target.value)}
                placeholder="Keterangan promo, syarat, dll..."
                rows={2}
              />
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              Batal
            </button>
            <button type="submit" className="btn btn-primary">
              🎁 Simpan Bundle
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ── 3. ADD COMBO ITEM MODAL ──
interface AddComboItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  combo: ResepItem;
  resepList: ResepItem[];
  bahanMap: Map<string, BahanItem>;
  getChannelLabel: (ch: string) => string;
  onSave: (comboId: number | string, resepId: number | string, qty: number) => void;
}

export const AddComboItemModal: React.FC<AddComboItemModalProps> = ({
  isOpen,
  onClose,
  combo,
  resepList,
  bahanMap,
  getChannelLabel,
  onSave
}) => {
  const [selectedResepId, setSelectedResepId] = useState('');
  const [qty, setQty] = useState(1);

  if (!isOpen) return null;

  const existingIds = (combo.comboItems || []).map((x) => String(x.resepId));
  const candidates = resepList.filter(
    (r) => !r.isCombo && String(r.id) !== String(combo.id) && !existingIds.includes(String(r.id))
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedResepId) {
      alert('Pilih menu terlebih dahulu');
      return;
    }
    onSave(combo.id, selectedResepId, qty);
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px' }}>
        <div className="modal-title">+ Tambah Menu ke Bundle</div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '12px' }}>
              Menambah menu ke <strong>{combo.nama}</strong>
            </div>

            <div className="form-row">
              <div className="form-group" style={{ flex: 1 }}>
                <div className="form-label">Pilih Menu</div>
                <select
                  className="form-select"
                  value={selectedResepId}
                  onChange={(e) => setSelectedResepId(e.target.value)}
                >
                  <option value="">— Pilih menu —</option>
                  {candidates.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.nama} · HPP {fmtRp(hitungHPPResep(r, resepList, bahanMap))} ·{' '}
                      {getChannelLabel(r.channel || 'kedai')}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group" style={{ width: '80px' }}>
                <div className="form-label">Qty</div>
                <input
                  className="form-input"
                  type="number"
                  min={1}
                  value={qty}
                  onChange={(e) => setQty(Math.max(1, parseInt(e.target.value) || 1))}
                  style={{ textAlign: 'center' }}
                />
              </div>
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              Batal
            </button>
            <button type="submit" className="btn btn-primary">
              + Tambah
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ── 4. COPY RESEP TO CHANNEL MODAL ──
interface CopyResepModalProps {
  isOpen: boolean;
  onClose: () => void;
  resep: ResepItem;
  channels: string[];
  getChannelLabel: (ch: string) => string;
  onSave: (targetChannel: string, newHarga: number) => void;
}

export const CopyResepModal: React.FC<CopyResepModalProps> = ({
  isOpen,
  onClose,
  resep,
  channels,
  getChannelLabel,
  onSave
}) => {
  const availableChannels = channels.filter((ch) => ch !== (resep.channel || 'kedai'));
  const [targetCh, setTargetCh] = useState(availableChannels[0] || 'marketplace');
  const [hargaStr, setHargaStr] = useState(
    resep.hargaJual ? resep.hargaJual.toLocaleString('id-ID') : ''
  );

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newHarga = parseNumericInput(hargaStr);
    onSave(targetCh, newHarga);
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px' }}>
        <div className="modal-title">📋 Salin Resep ke Channel Lain</div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div style={{ fontSize: '12px', color: 'var(--text2)', marginBottom: '14px', lineHeight: 1.5 }}>
              Menyalin <strong>{resep.nama}</strong> dari{' '}
              <strong>{getChannelLabel(resep.channel || 'kedai')}</strong>.<br />
              Komposisi bahan ikut disalin — edit HPP setelah ini (tambah packaging, fee admin, dll).
            </div>

            <div className="form-group">
              <div className="form-label">Salin ke Channel *</div>
              <select
                className="form-select"
                value={targetCh}
                onChange={(e) => setTargetCh(e.target.value)}
              >
                {availableChannels.map((ch) => (
                  <option key={ch} value={ch}>
                    {getChannelLabel(ch)}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <div className="form-label">Harga Jual di Channel Baru (Rp)</div>
              <input
                className="form-input"
                type="text"
                inputMode="numeric"
                value={hargaStr}
                onChange={(e) => setHargaStr(formatNumericInput(e.target.value))}
              />
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              Batal
            </button>
            <button type="submit" className="btn btn-primary">
              📋 Salin
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ── 5. ADD INGREDIENT MODAL ──
interface AddIngredientModalProps {
  isOpen: boolean;
  onClose: () => void;
  resep: ResepItem;
  bahanList: BahanItem[];
  onSave: (bahanId: number | string, qty: number) => void;
}

export const AddIngredientModal: React.FC<AddIngredientModalProps> = ({
  isOpen,
  onClose,
  resep,
  bahanList,
  onSave
}) => {
  const [selectedBahanId, setSelectedBahanId] = useState('');
  const [qty, setQty] = useState<string>('15');

  if (!isOpen) return null;

  const usedIds = new Set((resep.ingredients || []).map((i) => String(i.bahanId)));
  const availableBahan = bahanList.filter((b) => !usedIds.has(String(b.id)));

  const currentBahan = bahanList.find((b) => String(b.id) === selectedBahanId);
  const hps = currentBahan ? bahanHargaPerSatuan(currentBahan) : 0;
  const numQty = parseFloat(qty) || 0;
  const subtotal = Math.round(hps * numQty);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBahanId) {
      alert('Pilih bahan baku terlebih dahulu');
      return;
    }
    if (!numQty || numQty <= 0) {
      alert('Qty tidak boleh 0');
      return;
    }
    onSave(selectedBahanId, numQty);
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px' }}>
        <div className="modal-title">+ Bahan — {resep.nama}</div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-row">
              <div className="form-group" style={{ flex: 2 }}>
                <div className="form-label">Bahan Baku</div>
                <select
                  className="form-select"
                  value={selectedBahanId}
                  onChange={(e) => setSelectedBahanId(e.target.value)}
                >
                  <option value="">— Pilih bahan —</option>
                  {availableBahan.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.nama} ({fmtRp(Math.round(bahanHargaPerSatuan(b)))}/{b.satuan})
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <div className="form-label">Qty per Cup</div>
                <input
                  className="form-input"
                  type="number"
                  min="0.1"
                  step="0.5"
                  value={qty}
                  onChange={(e) => setQty(e.target.value)}
                  placeholder="15"
                />
              </div>
            </div>

            {currentBahan && numQty > 0 && (
              <div
                style={{
                  fontSize: '12px',
                  color: '#4cc9a0',
                  fontFamily: 'DM Mono',
                  padding: '6px 0'
                }}
              >
                {numQty} {currentBahan.satuan} × {fmtRp(Math.round(hps))}/{currentBahan.satuan} ={' '}
                {fmtRp(subtotal)}/cup
              </div>
            )}
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              Batal
            </button>
            <button type="submit" className="btn btn-primary">
              + Tambahkan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ── 6. EDIT INGREDIENT MODAL ──
interface EditIngredientModalProps {
  isOpen: boolean;
  onClose: () => void;
  resep: ResepItem;
  ingredient: ResepIngredient;
  bahanList: BahanItem[];
  onSave: (oldBahanId: number | string, newBahanId: number | string, qty: number) => void;
  onDelete: (bahanId: number | string) => void;
}

export const EditIngredientModal: React.FC<EditIngredientModalProps> = ({
  isOpen,
  onClose,
  resep,
  ingredient,
  bahanList,
  onSave,
  onDelete
}) => {
  const [selectedBahanId, setSelectedBahanId] = useState(String(ingredient.bahanId));
  const [qty, setQty] = useState<string>(String(ingredient.qty));

  if (!isOpen) return null;

  const currentBahan = bahanList.find((b) => String(b.id) === selectedBahanId);
  const hps = currentBahan ? bahanHargaPerSatuan(currentBahan) : 0;
  const numQty = parseFloat(qty) || 0;
  const subtotal = Math.round(hps * numQty);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!numQty || numQty <= 0) {
      alert('Qty tidak boleh 0');
      return;
    }
    onSave(ingredient.bahanId, selectedBahanId, numQty);
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px' }}>
        <div className="modal-title">✏️ Edit Bahan — {resep.nama}</div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group" style={{ marginBottom: '12px' }}>
              <div className="form-label">Ganti Bahan (opsional)</div>
              <select
                className="form-select"
                value={selectedBahanId}
                onChange={(e) => setSelectedBahanId(e.target.value)}
              >
                {bahanList.map((bh) => (
                  <option key={bh.id} value={bh.id}>
                    {bh.nama} — {fmtRp(Math.round(bahanHargaPerSatuan(bh)))}/{bh.satuan}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-row">
              <div className="form-group">
                <div className="form-label">Qty per Cup *</div>
                <input
                  className="form-input"
                  type="number"
                  min="0.1"
                  step="0.5"
                  value={qty}
                  onChange={(e) => setQty(e.target.value)}
                />
              </div>
              <div className="form-group">
                <div className="form-label">Satuan</div>
                <div
                  style={{
                    padding: '9px 12px',
                    background: 'var(--surface2)',
                    borderRadius: '8px',
                    fontFamily: 'DM Mono',
                    fontSize: '12px',
                    color: 'var(--text2)'
                  }}
                >
                  {currentBahan?.satuan || 'unit'}
                </div>
              </div>
            </div>

            {currentBahan && numQty > 0 && (
              <div
                style={{
                  fontSize: '12px',
                  color: '#4cc9a0',
                  fontFamily: 'DM Mono',
                  padding: '6px 0'
                }}
              >
                {numQty} {currentBahan.satuan} × {fmtRp(Math.round(hps))}/{currentBahan.satuan} ={' '}
                {fmtRp(subtotal)}/cup
              </div>
            )}
          </div>

          <div className="modal-actions">
            <button
              type="button"
              className="btn btn-ghost"
              style={{ color: 'var(--red)', borderColor: 'var(--red)', marginRight: 'auto' }}
              onClick={() => {
                onDelete(ingredient.bahanId);
                onClose();
              }}
            >
              🗑️ Hapus
            </button>
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              Batal
            </button>
            <button type="submit" className="btn btn-primary">
              Simpan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ── 7. ADD / EDIT BAHAN BAKU MODAL ──
interface AddEditBahanModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: BahanItem | null;
  onSave: (bahan: BahanItem) => void;
}

export const AddEditBahanModal: React.FC<AddEditBahanModalProps> = ({
  isOpen,
  onClose,
  initialData,
  onSave
}) => {
  const [nama, setNama] = useState(initialData?.nama || '');
  const [satuan, setSatuan] = useState(initialData?.satuan || 'gram');
  const [hargaBeliStr, setHargaBeliStr] = useState(
    initialData?.hargaBeli ? initialData.hargaBeli.toLocaleString('id-ID') : ''
  );
  const [qtyBeli, setQtyBeli] = useState<number>(initialData?.qtyBeli || 1000);
  const [stokAwalStr, setStokAwalStr] = useState(
    initialData?.stokAwal !== undefined ? initialData.stokAwal.toLocaleString('id-ID') : ''
  );

  if (!isOpen) return null;

  const hargaBeli = parseNumericInput(hargaBeliStr);
  const costPerUnit = qtyBeli > 0 ? Math.round(hargaBeli / qtyBeli) : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nama.trim()) {
      alert('Nama bahan tidak boleh kosong');
      return;
    }
    if (!hargaBeli || hargaBeli <= 0) {
      alert('Harga beli tidak boleh 0');
      return;
    }

    const parsedStokAwal = stokAwalStr.trim() !== '' ? parseNumericInput(stokAwalStr) : undefined;

    const bahan: BahanItem = {
      id: initialData?.id || Date.now(),
      nama: nama.trim(),
      satuan,
      hargaBeli,
      qtyBeli: qtyBeli || 1,
      stokAwal: parsedStokAwal,
      createdAt: initialData?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    onSave(bahan);
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px' }}>
        <div className="modal-title">{initialData ? '✏️ Edit Bahan Baku' : '+ Bahan Baku Baru'}</div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-row">
              <div className="form-group" style={{ flex: 2 }}>
                <div className="form-label">Nama Bahan *</div>
                <input
                  className="form-input"
                  value={nama}
                  onChange={(e) => setNama(e.target.value)}
                  placeholder="Robusta, Susu UHT, Gula..."
                  autoFocus
                />
              </div>
              <div className="form-group">
                <div className="form-label">Satuan</div>
                <select
                  className="form-select"
                  value={satuan}
                  onChange={(e) => setSatuan(e.target.value)}
                >
                  <option value="gram">gram</option>
                  <option value="ml">ml</option>
                  <option value="pcs">pcs</option>
                  <option value="liter">liter</option>
                  <option value="kg">kg</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <div className="form-label">Harga Beli (Rp) *</div>
                <input
                  className="form-input"
                  type="text"
                  inputMode="numeric"
                  value={hargaBeliStr}
                  onChange={(e) => setHargaBeliStr(formatNumericInput(e.target.value))}
                  placeholder="0"
                />
              </div>
              <div className="form-group">
                <div className="form-label">Qty per Pembelian</div>
                <input
                  className="form-input"
                  type="number"
                  value={qtyBeli}
                  onChange={(e) => setQtyBeli(parseFloat(e.target.value) || 1)}
                  placeholder="1000"
                />
              </div>
            </div>

            <div className="form-group">
              <div className="form-label">Stok Awal Fisik (Opsional)</div>
              <input
                className="form-input"
                type="text"
                inputMode="numeric"
                value={stokAwalStr}
                onChange={(e) => setStokAwalStr(formatNumericInput(e.target.value))}
                placeholder={`Kosongkan atau isi stok fisik (${satuan})`}
              />
              <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '4px' }}>
                Stok awal fisik di bar/gudang sebelum transaksi penjualan/restok dihitung.
              </div>
            </div>

            {hargaBeli > 0 && qtyBeli > 0 && (
              <div
                style={{
                  fontSize: '12px',
                  color: 'var(--accent)',
                  fontFamily: 'DM Mono',
                  padding: '4px 0'
                }}
              >
                = {fmtRp(costPerUnit)} per {satuan}
              </div>
            )}

            {initialData && (
              <div
                style={{
                  fontSize: '11px',
                  color: 'var(--muted)',
                  marginTop: '8px',
                  fontFamily: 'DM Mono',
                  lineHeight: 1.4
                }}
              >
                ⚠️ Mengubah harga akan memicu warning di resep yang menggunakan bahan ini.
              </div>
            )}
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              Batal
            </button>
            <button type="submit" className="btn btn-primary">
              Simpan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ── 10. QUICK RESTOCK MODAL ──
interface QuickRestockModalProps {
  isOpen: boolean;
  onClose: () => void;
  bahan: BahanItem | null;
  onSaveRestock: (
    bahan: BahanItem,
    addedQty: number,
    createExpenseTrx: boolean,
    nominal: number
  ) => void;
}

export const QuickRestockModal: React.FC<QuickRestockModalProps> = ({
  isOpen,
  onClose,
  bahan,
  onSaveRestock
}) => {
  const [units, setUnits] = useState<number>(1);
  const [customQtyStr, setCustomQtyStr] = useState<string>('');
  const [isCustomQty, setIsCustomQty] = useState(false);
  const [createExpenseTrx, setCreateExpenseTrx] = useState(true);

  if (!isOpen || !bahan) return null;

  const totalAddedQty = isCustomQty
    ? parseNumericInput(customQtyStr)
    : units * (bahan.qtyBeli || 1);

  const totalNominal = isCustomQty
    ? Math.round((totalAddedQty / (bahan.qtyBeli || 1)) * (bahan.hargaBeli || 0))
    : units * (bahan.hargaBeli || 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (totalAddedQty <= 0) {
      alert('Kuantitas restok harus lebih dari 0');
      return;
    }
    onSaveRestock(bahan, totalAddedQty, createExpenseTrx, totalNominal);
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '460px' }}>
        <div className="modal-title">📦 Restok Bahan — {bahan.nama}</div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div
              style={{
                background: 'rgba(76,201,160,0.06)',
                border: '1px solid rgba(76,201,160,0.2)',
                borderRadius: '8px',
                padding: '10px 14px',
                marginBottom: '14px',
                fontSize: '12px'
              }}
            >
              <div style={{ color: 'var(--muted)', marginBottom: '4px' }}>Spesifikasi Pembelian:</div>
              <div style={{ fontWeight: 600, color: '#fff' }}>
                1 Kemasan = {bahan.qtyBeli.toLocaleString('id-ID')} {bahan.satuan} ({fmtRp(bahan.hargaBeli)})
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
              <button
                type="button"
                className={`btn btn-sm ${!isCustomQty ? 'btn-primary' : 'btn-ghost'}`}
                style={{ flex: 1 }}
                onClick={() => setIsCustomQty(false)}
              >
                Berdasarkan Kemasan
              </button>
              <button
                type="button"
                className={`btn btn-sm ${isCustomQty ? 'btn-primary' : 'btn-ghost'}`}
                style={{ flex: 1 }}
                onClick={() => setIsCustomQty(true)}
              >
                Kuantitas Kustom
              </button>
            </div>

            {!isCustomQty ? (
              <div className="form-group">
                <div className="form-label">Jumlah Kemasan Dibeli *</div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input
                    className="form-input"
                    type="number"
                    min="1"
                    step="1"
                    value={units}
                    onChange={(e) => setUnits(Math.max(1, parseInt(e.target.value, 10) || 1))}
                    style={{ flex: 1 }}
                  />
                  <span style={{ fontSize: '13px', color: 'var(--text2)', whiteSpace: 'nowrap' }}>
                    pack / unit
                  </span>
                </div>
              </div>
            ) : (
              <div className="form-group">
                <div className="form-label">Kuantitas Masuk ({bahan.satuan}) *</div>
                <input
                  className="form-input"
                  type="text"
                  inputMode="numeric"
                  value={customQtyStr}
                  onChange={(e) => setCustomQtyStr(formatNumericInput(e.target.value))}
                  placeholder={`Contoh: 1.000 ${bahan.satuan}`}
                />
              </div>
            )}

            <div
              style={{
                background: 'var(--surface2)',
                borderRadius: '8px',
                padding: '12px',
                marginTop: '12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                <span style={{ color: 'var(--muted)' }}>Total Stok Bertambah:</span>
                <span style={{ fontWeight: 700, color: '#4cc9a0', fontFamily: 'DM Mono' }}>
                  +{totalAddedQty.toLocaleString('id-ID')} {bahan.satuan}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                <span style={{ color: 'var(--muted)' }}>Estimasi Biaya Belanja:</span>
                <span style={{ fontWeight: 700, color: 'var(--accent)', fontFamily: 'DM Mono' }}>
                  {fmtRp(totalNominal)}
                </span>
              </div>
            </div>

            <div style={{ marginTop: '14px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px' }}>
                <input
                  type="checkbox"
                  checked={createExpenseTrx}
                  onChange={(e) => setCreateExpenseTrx(e.target.checked)}
                />
                <span>Catat transaksi pengeluaran otomatis di Buku Kas Dikopi</span>
              </label>
              <div style={{ fontSize: '11px', color: 'var(--muted)', marginLeft: '22px', marginTop: '2px' }}>
                {createExpenseTrx
                  ? `Pengeluaran Rp ${totalNominal.toLocaleString('id-ID')} akan otomatis masuk ke Buku Kas Dikopi.`
                  : 'Stok akan bertambah tanpa memotong saldo kas (cocok untuk hibah/stok opname).'}
              </div>
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              Batal
            </button>
            <button type="submit" className="btn btn-primary">
              💾 Simpan Restok
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ── 8. MANAGE CHANNELS MODAL ──
interface ManageChannelsModalProps {
  isOpen: boolean;
  onClose: () => void;
  channels: string[];
  channelLabels: Record<string, string>;
  getChannelLabel: (ch: string) => string;
  onSaveChannels: (channels: string[], labels: Record<string, string>) => void;
}

export const ManageChannelsModal: React.FC<ManageChannelsModalProps> = ({
  isOpen,
  onClose,
  channels,
  channelLabels,
  getChannelLabel,
  onSaveChannels
}) => {
  const [newChannelName, setNewChannelName] = useState('');
  const [editingCh, setEditingCh] = useState<string | null>(null);
  const [editingLabel, setEditingLabel] = useState('');

  if (!isOpen) return null;

  const handleAddChannel = () => {
    const raw = newChannelName.trim().toLowerCase().replace(/\s+/g, '-');
    if (!raw) return;
    if (channels.includes(raw)) {
      alert('Channel sudah ada');
      return;
    }
    const updatedChannels = [...channels, raw];
    onSaveChannels(updatedChannels, channelLabels);
    setNewChannelName('');
  };

  const handleDeleteChannel = (ch: string) => {
    if (DEFAULT_CHANNELS.includes(ch)) return;
    const updatedChannels = channels.filter((c) => c !== ch);
    const updatedLabels = { ...channelLabels };
    delete updatedLabels[ch];
    onSaveChannels(updatedChannels, updatedLabels);
  };

  const handleStartRename = (ch: string) => {
    setEditingCh(ch);
    setEditingLabel(getChannelLabel(ch));
  };

  const handleSaveRename = () => {
    if (!editingCh || !editingLabel.trim()) return;
    const updatedLabels = { ...channelLabels, [editingCh]: editingLabel.trim() };
    onSaveChannels(channels, updatedLabels);
    setEditingCh(null);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
        <div className="modal-title">Kelola Channel Menu</div>
        <div className="modal-body">
          <div style={{ fontSize: '11px', color: 'var(--muted)', marginBottom: '12px' }}>
            Channel default tidak bisa dihapus, tapi bisa di-rename.
          </div>

          {editingCh ? (
            <div style={{ padding: '12px', background: 'var(--surface2)', borderRadius: '8px', marginBottom: '14px' }}>
              <div style={{ fontSize: '12px', fontWeight: 600, color: '#fff', marginBottom: '6px' }}>
                ✏️ Rename Channel ({editingCh})
              </div>
              <input
                className="form-input"
                value={editingLabel}
                onChange={(e) => setEditingLabel(e.target.value)}
                placeholder="☕ Kedai"
                style={{ marginBottom: '8px' }}
              />
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <button className="btn btn-ghost btn-sm" onClick={() => setEditingCh(null)}>
                  Batal
                </button>
                <button className="btn btn-primary btn-sm" onClick={handleSaveRename}>
                  Simpan Label
                </button>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '14px' }}>
              {channels.map((ch) => (
                <div
                  key={ch}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 12px',
                    background: 'var(--surface2)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px'
                  }}
                >
                  <span style={{ fontSize: '13px', flex: 1 }}>{getChannelLabel(ch)}</span>
                  <span style={{ fontSize: '10px', color: 'var(--muted)', fontFamily: 'DM Mono' }}>
                    {ch}
                  </span>
                  <button
                    className="tbl-action-btn tbl-edit"
                    onClick={() => handleStartRename(ch)}
                    title="Rename channel"
                  >
                    ✏️
                  </button>
                  {!DEFAULT_CHANNELS.includes(ch) && (
                    <button
                      className="tbl-action-btn tbl-del"
                      onClick={() => handleDeleteChannel(ch)}
                      title="Hapus channel"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="form-row">
            <div className="form-group" style={{ flex: 1 }}>
              <div className="form-label">Tambah Channel Baru</div>
              <input
                className="form-input"
                value={newChannelName}
                onChange={(e) => setNewChannelName(e.target.value)}
                placeholder="catering, event, bazaar..."
              />
            </div>
            <div style={{ paddingTop: '22px' }}>
              <button className="btn btn-primary btn-sm" onClick={handleAddChannel}>
                + Tambah
              </button>
            </div>
          </div>
        </div>

        <div className="modal-actions">
          <button className="btn btn-ghost" onClick={onClose}>
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};

// ── 9. MANAGE KATEGORI MODAL ──
interface ManageKategoriModalProps {
  isOpen: boolean;
  onClose: () => void;
  groups: ResepGroupItem[];
  resepList: ResepItem[];
  onSaveGroups: (groups: ResepGroupItem[]) => void;
}

export const ManageKategoriModal: React.FC<ManageKategoriModalProps> = ({
  isOpen,
  onClose,
  groups,
  resepList,
  onSaveGroups
}) => {
  const [newKatName, setNewKatName] = useState('');
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [editLabel, setEditLabel] = useState('');
  const [editKey, setEditKey] = useState('');

  if (!isOpen) return null;

  const handleAddKategori = () => {
    const raw = newKatName.trim();
    if (!raw) return;
    const key = raw.replace(/\p{Emoji_Presentation}/gu, '').trim() || raw;
    if (groups.some((g) => g.key === key)) {
      alert('Kategori dengan key ini sudah ada');
      return;
    }
    const updated = [...groups, { key, label: raw }];
    onSaveGroups(updated);
    setNewKatName('');
  };

  const handleDeleteKategori = (idx: number) => {
    const g = groups[idx];
    const count = resepList.filter((r) => (r.kategori || 'Coffee') === g.key).length;
    if (count > 0) {
      alert('Hapus atau pindahkan resep di kategori ini terlebih dahulu');
      return;
    }
    const updated = groups.filter((_, i) => i !== idx);
    onSaveGroups(updated);
  };

  const handleMove = (idx: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= groups.length) return;
    const copy = [...groups];
    const temp = copy[idx];
    copy[idx] = copy[targetIdx];
    copy[targetIdx] = temp;
    onSaveGroups(copy);
  };

  const handleStartEdit = (idx: number) => {
    setEditingIdx(idx);
    setEditLabel(groups[idx].label);
    setEditKey(groups[idx].key);
  };

  const handleSaveEdit = () => {
    if (editingIdx === null) return;
    if (!editLabel.trim() || !editKey.trim()) return;
    const copy = [...groups];
    copy[editingIdx] = { key: editKey.trim(), label: editLabel.trim() };
    onSaveGroups(copy);
    setEditingIdx(null);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
        <div className="modal-title">🗂️ Kelola Kategori Resep</div>
        <div className="modal-body">
          <div style={{ fontSize: '11px', color: 'var(--muted)', marginBottom: '12px' }}>
            Urutkan kategori atau tambahkan kategori baru. Kategori dengan resep tidak bisa dihapus.
          </div>

          {editingIdx !== null ? (
            <div style={{ padding: '12px', background: 'var(--surface2)', borderRadius: '8px', marginBottom: '14px' }}>
              <div className="form-group" style={{ marginBottom: '8px' }}>
                <div className="form-label">Emoji + Nama Label</div>
                <input
                  className="form-input"
                  value={editLabel}
                  onChange={(e) => setEditLabel(e.target.value)}
                  placeholder="☕ Coffee"
                />
              </div>
              <div className="form-group" style={{ marginBottom: '8px' }}>
                <div className="form-label">Key (internal)</div>
                <input
                  className="form-input"
                  value={editKey}
                  onChange={(e) => setEditKey(e.target.value)}
                  placeholder="Coffee"
                />
              </div>
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <button className="btn btn-ghost btn-sm" onClick={() => setEditingIdx(null)}>
                  Batal
                </button>
                <button className="btn btn-primary btn-sm" onClick={handleSaveEdit}>
                  Simpan Kategori
                </button>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '16px' }}>
              {groups.map((g, i) => {
                const count = resepList.filter((r) => (r.kategori || 'Coffee') === g.key).length;
                return (
                  <div
                    key={g.key}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 12px',
                      background: 'var(--surface2)',
                      border: '1px solid var(--border)',
                      borderRadius: '8px'
                    }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <button
                        type="button"
                        onClick={() => handleMove(i, 'up')}
                        disabled={i === 0}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: i === 0 ? 'var(--muted)' : 'var(--text)',
                          cursor: i === 0 ? 'default' : 'pointer',
                          fontSize: '10px',
                          padding: '0 2px'
                        }}
                      >
                        ▲
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMove(i, 'down')}
                        disabled={i === groups.length - 1}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: i === groups.length - 1 ? 'var(--muted)' : 'var(--text)',
                          cursor: i === groups.length - 1 ? 'default' : 'pointer',
                          fontSize: '10px',
                          padding: '0 2px'
                        }}
                      >
                        ▼
                      </button>
                    </div>

                    <span style={{ flex: 1, fontSize: '13px', fontWeight: 500 }}>{g.label}</span>
                    <span style={{ fontSize: '11px', color: 'var(--muted)', fontFamily: 'DM Mono' }}>
                      {count} resep
                    </span>

                    <button
                      className="tbl-action-btn tbl-edit"
                      onClick={() => handleStartEdit(i)}
                      title="Edit kategori"
                    >
                      ✏️
                    </button>
                    <button
                      className="tbl-action-btn tbl-del"
                      onClick={() => handleDeleteKategori(i)}
                      disabled={count > 0}
                      title={count > 0 ? 'Masih ada resep di kategori ini' : 'Hapus kategori'}
                      style={{ opacity: count > 0 ? 0.3 : 1, cursor: count > 0 ? 'not-allowed' : 'pointer' }}
                    >
                      🗑️
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
            <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
              <div className="form-label">Emoji + Nama Kategori Baru</div>
              <input
                className="form-input"
                value={newKatName}
                onChange={(e) => setNewKatName(e.target.value)}
                placeholder="🍵 Teh, 🧋 Boba, dll..."
              />
            </div>
            <button
              className="btn btn-primary btn-sm"
              style={{ marginBottom: 0 }}
              onClick={handleAddKategori}
            >
              + Tambah
            </button>
          </div>
        </div>

        <div className="modal-actions">
          <button className="btn btn-ghost" onClick={onClose}>
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
