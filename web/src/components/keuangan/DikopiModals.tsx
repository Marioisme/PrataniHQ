import React, { useState } from 'react';
import type { 
  TransaksiItem, 
  ResepItem, 
  BahanItem, 
  AsetItem, 
  HistoryEntry, 
  BrandId 
} from '../../types';

import {
  fmtInputDots,
  parseInputDots,
  autoSlashDate,
  toDisplayDate,
  toStorageDate,
  getTodayDisplay,
  DIKOPI_HPP_ITEMS,
  DIKOPI_OPS_ITEMS
} from '../../lib/keuanganUtils';

// ============================================================
// 1. DIKOPI PENJUALAN MODAL
// ============================================================
interface DikopiPenjualanModalProps {
  isOpen?: boolean;
  onClose: () => void;
  resepList: ResepItem[];
  bahanList: BahanItem[];
  onSave: (transaksi: TransaksiItem) => Promise<void>;
}

export const DikopiPenjualanModal: React.FC<DikopiPenjualanModalProps> = ({
  onClose,
  resepList,
  bahanList,
  onSave
}) => {
  const [tanggal, setTanggal] = useState(() => getTodayDisplay());
  const [sumber, setSumber] = useState<'cash' | 'rekening' | 'shopee'>('cash');
  const [deskripsi, setDeskripsi] = useState('');
  const [nominal, setNominal] = useState('');
  const [nota, setNota] = useState<string | null>(null);
  const [notaType, setNotaType] = useState<string | null>(null);
  
  // Menu item picker state
  const [items, setItems] = useState<Array<{
    resepId: number | string;
    nama: string;
    hargaJual: number;
    hppSnapshot: number;
    qty: number;
  }>>([]);
  const [selectedResepId, setSelectedResepId] = useState<string>('');
  const [itemQty, setItemQty] = useState<number>(1);

  const getResepHPP = (r: ResepItem): number => {
    if (r.hppSnapshot && r.hppSnapshot > 0) return r.hppSnapshot;
    let total = 0;
    (r.ingredients || []).forEach((ing) => {
      const b = bahanList.find((x) => String(x.id) === String(ing.bahanId));
      if (!b) return;
      const unit = b.qtyBeli > 0 ? b.hargaBeli / b.qtyBeli : 0;
      total += unit * (ing.qty || 0);
    });
    return Math.round(total);
  };

  const handleAddItem = () => {
    if (!selectedResepId) return;
    const r = resepList.find((x) => String(x.id) === selectedResepId);
    if (!r) return;

    const hpp = getResepHPP(r);
    const existingIdx = items.findIndex((x) => String(x.resepId) === selectedResepId);

    let nextItems;
    if (existingIdx >= 0) {
      nextItems = [...items];
      nextItems[existingIdx].qty += itemQty;
    } else {
      nextItems = [
        ...items,
        {
          resepId: r.id,
          nama: r.nama,
          hargaJual: r.hargaJual || 0,
          hppSnapshot: hpp,
          qty: itemQty
        }
      ];
    }
    setItems(nextItems);

    const totalOmzet = nextItems.reduce((s, it) => s + it.hargaJual * it.qty, 0);
    setNominal(totalOmzet > 0 ? totalOmzet.toLocaleString('id-ID') : '');
    setItemQty(1);
  };

  const handleRemoveItem = (resepId: number | string) => {
    const nextItems = items.filter((x) => String(x.resepId) !== String(resepId));
    setItems(nextItems);
    const totalOmzet = nextItems.reduce((s, it) => s + it.hargaJual * it.qty, 0);
    setNominal(totalOmzet > 0 ? totalOmzet.toLocaleString('id-ID') : '');
  };

  const totalOmzet = items.reduce((s, it) => s + it.hargaJual * it.qty, 0);
  const totalHPP = items.reduce((s, it) => s + it.hppSnapshot * it.qty, 0);
  const margin = totalOmzet - totalHPP;

  const handleNotaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      setNota(evt.target?.result as string);
      setNotaType(file.type);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanNom = parseInputDots(nominal);
    if (cleanNom <= 0) {
      alert('Nominal tidak boleh 0');
      return;
    }

    const tglStorage = toStorageDate(tanggal);
    const savedItems = items.length
      ? items.map((i) => ({
          resepId: i.resepId,
          nama: i.nama,
          name: i.nama,
          hargaJual: i.hargaJual,
          price: i.hargaJual,
          hppSnapshot: i.hppSnapshot,
          qty: i.qty,
          subtotal: i.hargaJual * i.qty
        }))
      : undefined;

    const itemDesc = items.length
      ? `Penjualan [${sumber === 'shopee' ? 'Shopee Food' : 'Kedai'}] - ` +
        items.map((i) => `${i.nama} (${i.qty}x)`).join(', ')
      : deskripsi.trim() || 'Penjualan';

    const calculatedHpp = items.reduce((s, it) => s + it.hppSnapshot * it.qty, 0);
    const calculatedMargin = cleanNom - calculatedHpp;

    const newTrx: TransaksiItem = {
      id: Date.now(),
      tanggal: tglStorage,
      deskripsi: itemDesc,
      kategori: 'Penjualan Langsung',
      tipe: 'masuk',
      sumber,
      nominal: cleanNom,
      _margin: items.length ? calculatedMargin : cleanNom,
      _hppTotal: items.length ? calculatedHpp : 0,
      items: savedItems,
      nota,
      nota_type: notaType,
      _source: 'manual',
      created_at: new Date().toISOString()
    };

    await onSave(newTrx);
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal" style={{ maxWidth: '640px' }}>
        <div className="modal-title">☕ Catat Penjualan Dikopi</div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Tanggal</label>
              <input
                className="form-input"
                value={tanggal}
                onChange={(e) => setTanggal(autoSlashDate(e.target.value))}
                placeholder="DD/MM/YYYY"
                maxLength={10}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Metode Pembayaran</label>
              <select
                className="form-select"
                value={sumber}
                onChange={(e) => setSumber(e.target.value as 'cash' | 'rekening' | 'shopee')}
              >
                <option value="cash">🪙 Tunai → Cash</option>
                <option value="rekening">🏦 QRIS / Transfer → Rekening</option>
                <option value="shopee">🛒 Shopee → Shopee Wallet</option>
              </select>
            </div>
          </div>

          {/* Menu item breakdown */}
          <div style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: '8px', padding: '12px' }}>
            <div style={{ fontSize: '12px', fontWeight: 600, marginBottom: '8px', color: 'var(--text2)' }}>
              📋 Input per Menu <span style={{ fontWeight: 400, color: 'var(--muted)' }}>(opsional — untuk kalkulasi HPP & margin otomatis)</span>
            </div>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '8px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
              <div className="form-group" style={{ flex: 2, marginBottom: 0, minWidth: '150px' }}>
                <label className="form-label">Menu</label>
                <select
                  className="form-select"
                  value={selectedResepId}
                  onChange={(e) => setSelectedResepId(e.target.value)}
                >
                  <option value="">-- Pilih menu --</option>
                  {resepList.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.nama} — Rp {(r.hargaJual || 0).toLocaleString('id-ID')}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group" style={{ flex: '0 0 70px', marginBottom: 0 }}>
                <label className="form-label">Qty</label>
                <input
                  className="form-input"
                  type="number"
                  min={1}
                  value={itemQty}
                  onChange={(e) => setItemQty(parseInt(e.target.value, 10) || 1)}
                />
              </div>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                style={{ flexShrink: 0, height: '36px' }}
                onClick={handleAddItem}
              >
                + Add
              </button>
            </div>

            {items.length === 0 ? (
              <div style={{ fontSize: '11px', color: 'var(--muted)' }}>
                Belum ada item. Input item untuk kalkulasi margin otomatis.
              </div>
            ) : (
              <div>
                <div style={{ border: '1px solid var(--border)', borderRadius: '6px', overflow: 'hidden', marginBottom: '8px' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: 'var(--surface3)' }}>
                        <th style={{ padding: '5px 8px', textAlign: 'left', fontSize: '10px', color: 'var(--muted)' }}>Menu</th>
                        <th style={{ padding: '5px 8px', textAlign: 'center', fontSize: '10px', color: 'var(--muted)' }}>Qty</th>
                        <th style={{ padding: '5px 8px', textAlign: 'right', fontSize: '10px', color: 'var(--muted)' }}>Subtotal</th>
                        <th style={{ padding: '5px 8px', textAlign: 'right', fontSize: '10px', color: 'var(--muted)' }}>HPP</th>
                        <th style={{ width: '24px' }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((i) => (
                        <tr key={i.resepId} style={{ borderTop: '1px solid var(--border)' }}>
                          <td style={{ padding: '5px 8px', fontWeight: 600, fontSize: '12px' }}>{i.nama}</td>
                          <td style={{ padding: '5px 8px', textAlign: 'center', fontFamily: 'DM Mono', fontSize: '12px' }}>×{i.qty}</td>
                          <td style={{ padding: '5px 8px', textAlign: 'right', fontFamily: 'DM Mono', fontSize: '12px', color: '#4cc9a0' }}>
                            Rp {(i.hargaJual * i.qty).toLocaleString('id-ID')}
                          </td>
                          <td style={{ padding: '5px 8px', textAlign: 'right', fontFamily: 'DM Mono', fontSize: '12px', color: 'var(--muted)' }}>
                            Rp {(i.hppSnapshot * i.qty).toLocaleString('id-ID')}
                          </td>
                          <td style={{ padding: '2px 4px', textAlign: 'center' }}>
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(i.resepId)}
                              style={{ background: 'none', border: 'none', color: 'var(--red)', cursor: 'pointer', fontSize: '14px', lineHeight: 1 }}
                            >
                              ×
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div style={{ display: 'flex', gap: '16px', fontSize: '11px', fontFamily: 'DM Mono', background: 'var(--surface3)', borderRadius: '6px', padding: '7px 10px' }}>
                  <span>Omzet: <strong style={{ color: '#4cc9a0' }}>Rp {totalOmzet.toLocaleString('id-ID')}</strong></span>
                  <span>HPP: <strong style={{ color: '#f5a623' }}>Rp {totalHPP.toLocaleString('id-ID')}</strong></span>
                  <span>Margin: <strong style={{ color: margin >= 0 ? '#4cc9a0' : 'var(--red)' }}>Rp {margin.toLocaleString('id-ID')}</strong></span>
                </div>
              </div>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">Total Penjualan (Rp) *</label>
            <input
              className="form-input"
              value={nominal}
              onChange={(e) => setNominal(fmtInputDots(e.target.value))}
              placeholder="0"
              style={{ fontFamily: 'DM Mono', fontSize: '16px', fontWeight: 700 }}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              Keterangan <span style={{ color: 'var(--muted)', fontSize: '10px' }}>(opsional)</span>
            </label>
            <input
              className="form-input"
              value={deskripsi}
              onChange={(e) => setDeskripsi(e.target.value)}
              placeholder="Penjualan hari ini, event, dll..."
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              Upload Nota <span style={{ color: 'var(--muted)', fontSize: '10px' }}>(opsional)</span>
            </label>
            <input
              type="file"
              accept="image/*,.pdf"
              style={{ fontSize: '12px' }}
              onChange={handleNotaChange}
            />
            {nota && (
              <div style={{ marginTop: '8px' }}>
                <span style={{ fontSize: '11px', color: '#4cc9a0' }}>✓ File nota siap diunggah</span>
              </div>
            )}
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              Batal
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              style={{ background: '#4cc9a0', borderColor: '#4cc9a0', color: '#080c14', fontWeight: 700 }}
            >
              💾 Simpan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ============================================================
// 2. DIKOPI PENGELUARAN (HPP & OPERASIONAL) MODAL
// ============================================================
interface DikopiPengeluaranModalProps {
  isOpen?: boolean;
  onClose: () => void;
  mode: 'hpp' | 'ops';
  onSave: (transaksi: TransaksiItem) => Promise<void>;
}

export const DikopiPengeluaranModal: React.FC<DikopiPengeluaranModalProps> = ({
  onClose,
  mode,
  onSave
}) => {
  const isHPP = mode === 'hpp';
  const items = isHPP ? DIKOPI_HPP_ITEMS : DIKOPI_OPS_ITEMS;

  const [tanggal, setTanggal] = useState(getTodayDisplay());
  const [sumber, setSumber] = useState<'cash' | 'rekening'>('cash');
  const [kategori, setKategori] = useState(items[0]);
  const [deskripsi, setDeskripsi] = useState('');
  const [nominal, setNominal] = useState('');
  const [nota, setNota] = useState<string | null>(null);
  const [notaType, setNotaType] = useState<string | null>(null);

  const handleNotaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      setNota(evt.target?.result as string);
      setNotaType(file.type);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanNom = parseInputDots(nominal);
    if (cleanNom <= 0) {
      alert('Nominal tidak boleh 0');
      return;
    }
    if (!deskripsi.trim()) {
      alert('Keterangan / Detail tidak boleh kosong');
      return;
    }

    const newTrx: TransaksiItem = {
      id: Date.now(),
      tanggal: toStorageDate(tanggal),
      deskripsi: deskripsi.trim(),
      kategori,
      tipe: 'keluar',
      sumber,
      nominal: cleanNom,
      transaction_class: isHPP ? 'hpp' : 'operational',
      nota,
      nota_type: notaType,
      _source: 'manual',
      created_at: new Date().toISOString()
    };

    await onSave(newTrx);
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal" style={{ maxWidth: '580px' }}>
        <div className="modal-title">
          {isHPP ? '📦 Catat HPP / Pembelian Bahan' : '💸 Catat Pengeluaran Operasional'}
        </div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Tanggal</label>
              <input
                className="form-input"
                value={tanggal}
                onChange={(e) => setTanggal(autoSlashDate(e.target.value))}
                placeholder="DD/MM/YYYY"
                maxLength={10}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Bayar Dari</label>
              <select
                className="form-select"
                value={sumber}
                onChange={(e) => setSumber(e.target.value as 'cash' | 'rekening')}
              >
                <option value="cash">🪙 Cash</option>
                <option value="rekening">🏦 Rekening / Transfer</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">{isHPP ? 'Item Bahan' : 'Kategori Operasional'}</label>
            <select
              className="form-select"
              value={kategori}
              onChange={(e) => setKategori(e.target.value)}
            >
              {items.map((k) => (
                <option key={k} value={k}>{k}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Keterangan / Detail *</label>
            <input
              className="form-input"
              value={deskripsi}
              onChange={(e) => setDeskripsi(e.target.value)}
              placeholder={isHPP ? 'Beli biji kopi 1kg @ 80rb...' : 'Gaji karyawan bulan Mei...'}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Nominal (Rp) *</label>
            <input
              className="form-input"
              value={nominal}
              onChange={(e) => setNominal(fmtInputDots(e.target.value))}
              placeholder="0"
              style={{ fontFamily: 'DM Mono', fontSize: '16px', fontWeight: 700 }}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              Upload Nota <span style={{ color: 'var(--muted)', fontSize: '10px' }}>(opsional)</span>
            </label>
            <input
              type="file"
              accept="image/*,.pdf"
              style={{ fontSize: '12px' }}
              onChange={handleNotaChange}
            />
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              Batal
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              style={{
                background: isHPP ? '#f5a623' : 'var(--red)',
                borderColor: isHPP ? '#f5a623' : 'var(--red)',
                color: isHPP ? '#080c14' : '#fff',
                fontWeight: 700
              }}
            >
              💾 Simpan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ============================================================
// 3. DIKOPI MUTASI KAS MODAL
// ============================================================
interface DikopiMutasiModalProps {
  isOpen?: boolean;
  onClose: () => void;
  onSave: (transaksi: TransaksiItem) => Promise<void>;
}

export const DikopiMutasiModal: React.FC<DikopiMutasiModalProps> = ({
  onClose,
  onSave
}) => {
  const [tanggal, setTanggal] = useState(getTodayDisplay());
  const [dari, setDari] = useState<'cash' | 'rekening'>('cash');
  const [nominal, setNominal] = useState('');
  const [deskripsi, setDeskripsi] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanNom = parseInputDots(nominal);
    if (cleanNom <= 0) {
      alert('Nominal tidak boleh 0');
      return;
    }

    const defaultDesc = dari === 'cash' ? 'Setor Cash ke Rekening' : 'Ambil dari Rekening ke Cash';
    const newTrx: TransaksiItem = {
      id: Date.now(),
      tanggal: toStorageDate(tanggal),
      deskripsi: deskripsi.trim() || defaultDesc,
      kategori: 'Mutasi',
      tipe: 'mutasi',
      sumber: dari,
      nominal: cleanNom,
      transaction_class: 'transfer',
      nota: null,
      created_at: new Date().toISOString()
    };

    await onSave(newTrx);
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal" style={{ maxWidth: '540px' }}>
        <div className="modal-title">🔄 Mutasi Dana</div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ fontSize: '12px', color: 'var(--muted)', background: 'var(--surface2)', borderRadius: '8px', padding: '10px 14px', lineHeight: 1.7 }}>
            Mutasi memindahkan uang antar Cash dan Rekening <strong>tanpa mempengaruhi total aset</strong>.<br />
            <span style={{ color: 'var(--accent)' }}>Contoh: setor hasil QRIS ke rekening, atau ambil uang tunai dari ATM.</span>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Tanggal</label>
              <input
                className="form-input"
                value={tanggal}
                onChange={(e) => setTanggal(autoSlashDate(e.target.value))}
                placeholder="DD/MM/YYYY"
                maxLength={10}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Arah Mutasi</label>
              <select
                className="form-select"
                value={dari}
                onChange={(e) => setDari(e.target.value as 'cash' | 'rekening')}
              >
                <option value="cash">🪙 Cash → 🏦 Rekening</option>
                <option value="rekening">🏦 Rekening → 🪙 Cash</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Nominal (Rp) *</label>
            <input
              className="form-input"
              value={nominal}
              onChange={(e) => setNominal(fmtInputDots(e.target.value))}
              placeholder="0"
              style={{ fontFamily: 'DM Mono', fontSize: '16px', fontWeight: 700 }}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              Keterangan <span style={{ color: 'var(--muted)', fontSize: '10px' }}>(opsional)</span>
            </label>
            <input
              className="form-input"
              value={deskripsi}
              onChange={(e) => setDeskripsi(e.target.value)}
              placeholder="Setor QRIS hari ini, ambil cash untuk belanja bahan..."
            />
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              Batal
            </button>
            <button type="submit" className="btn btn-primary">
              🔄 Catat Mutasi
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ============================================================
// 4. DIKOPI CAIRKAN SHOPEE MODAL
// ============================================================
interface DikopiCairShopeeModalProps {
  isOpen?: boolean;
  onClose: () => void;
  onSaveBatch: (items: TransaksiItem[]) => Promise<void>;
}

export const DikopiCairShopeeModal: React.FC<DikopiCairShopeeModalProps> = ({
  onClose,
  onSaveBatch
}) => {
  const [tanggal, setTanggal] = useState(getTodayDisplay());
  const [nominalGross, setNominalGross] = useState('');
  const [nominalAdmin, setNominalAdmin] = useState('');
  const [keterangan, setKeterangan] = useState('Withdrawal Shopee');

  const gross = parseInputDots(nominalGross);
  const admin = parseInputDots(nominalAdmin);
  const net = Math.max(gross - admin, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (gross <= 0) {
      alert('Nominal kotor Shopee tidak boleh 0');
      return;
    }
    if (net < 0) {
      alert('Potongan admin melebihi total');
      return;
    }

    const tglStorage = toStorageDate(tanggal);
    const ts = Date.now();
    const batchItems: TransaksiItem[] = [];

    // Entry 1: Admin fee
    if (admin > 0) {
      batchItems.push({
        id: ts,
        tanggal: tglStorage,
        deskripsi: 'Biaya Admin Shopee — ' + (keterangan.trim() || 'Withdrawal Shopee'),
        kategori: 'Biaya Admin & Dokumen',
        tipe: 'keluar',
        sumber: 'shopee',
        nominal: admin,
        transaction_class: 'operational',
        nota: null,
        created_at: new Date().toISOString()
      });
    }

    // Entry 2: Net transfer from shopee wallet to rekening
    batchItems.push({
      id: ts + 1,
      tanggal: tglStorage,
      deskripsi: (keterangan.trim() || 'Withdrawal Shopee') + (admin > 0 ? ` (net setelah admin Rp${admin.toLocaleString('id-ID')})` : ''),
      kategori: 'Mutasi',
      tipe: 'mutasi',
      sumber: 'shopee2rek',
      nominal: net,
      transaction_class: 'transfer',
      nota: null,
      created_at: new Date().toISOString()
    });

    await onSaveBatch(batchItems);
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal" style={{ maxWidth: '560px' }}>
        <div className="modal-title">💸 Cairkan Shopee → Rekening</div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ fontSize: '12px', color: '#ff7900', background: 'rgba(255,121,0,0.06)', border: '1px solid rgba(255,121,0,0.25)', borderRadius: '8px', padding: '10px 14px', lineHeight: 1.8 }}>
            Isi nominal <strong>pemasukan kotor</strong> dari Shopee (sebelum dipotong admin).<br />
            Otomatis buat 2 entri: <strong>biaya admin keluar Shopee</strong> + <strong>net masuk Rekening</strong>.
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Tanggal Cair</label>
              <input
                className="form-input"
                value={tanggal}
                onChange={(e) => setTanggal(autoSlashDate(e.target.value))}
                placeholder="DD/MM/YYYY"
                maxLength={10}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Total dari Shopee (Rp) *</label>
              <input
                className="form-input"
                value={nominalGross}
                onChange={(e) => setNominalGross(fmtInputDots(e.target.value))}
                placeholder="0"
                style={{ fontFamily: 'DM Mono', fontWeight: 700 }}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Potongan Admin Shopee (Rp)</label>
              <input
                className="form-input"
                value={nominalAdmin}
                onChange={(e) => setNominalAdmin(fmtInputDots(e.target.value))}
                placeholder="0"
                style={{ fontFamily: 'DM Mono' }}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Yang Masuk Rekening (auto)</label>
              <input
                className="form-input"
                readOnly
                value={`Rp ${net.toLocaleString('id-ID')}`}
                style={{ opacity: 0.8, cursor: 'default', color: '#4cc9a0', fontWeight: 700, fontFamily: 'DM Mono' }}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Keterangan</label>
            <input
              className="form-input"
              value={keterangan}
              onChange={(e) => setKeterangan(e.target.value)}
              placeholder="Withdrawal Shopee..."
            />
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              Batal
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              style={{ background: '#ff7900', borderColor: '#ff7900' }}
            >
              💸 Cairkan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ============================================================
// 5. DIKOPI SUNTIKAN MODAL / DANA OWNER
// ============================================================
interface DikopiSuntikanModalProps {
  isOpen?: boolean;
  onClose: () => void;
  onSave: (transaksi: TransaksiItem) => Promise<void>;
}

export const DikopiSuntikanModal: React.FC<DikopiSuntikanModalProps> = ({
  onClose,
  onSave
}) => {
  const [tanggal, setTanggal] = useState(getTodayDisplay());
  const [tujuan, setTujuan] = useState<'cash' | 'rekening'>('cash');
  const [kategori, setKategori] = useState<'Suntikan Dana Owner' | 'Tambahan Modal'>('Suntikan Dana Owner');
  const [nominal, setNominal] = useState('');
  const [keterangan, setKeterangan] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanNom = parseInputDots(nominal);
    if (cleanNom <= 0) {
      alert('Nominal tidak boleh 0');
      return;
    }

    const newTrx: TransaksiItem = {
      id: Date.now(),
      tanggal: toStorageDate(tanggal),
      deskripsi: keterangan.trim() || kategori,
      kategori,
      tipe: 'masuk',
      sumber: tujuan,
      nominal: cleanNom,
      transaction_class: 'capital_injection',
      nota: null,
      created_at: new Date().toISOString()
    };

    await onSave(newTrx);
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal" style={{ maxWidth: '560px' }}>
        <div className="modal-title">💉 Suntikan Dana</div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ fontSize: '12px', color: 'var(--muted)', background: 'rgba(155,130,245,0.06)', border: '1px solid rgba(155,130,245,0.2)', borderRadius: '8px', padding: '10px 14px', lineHeight: 1.8 }}>
            Dana dari luar (owner/investor) masuk ke kas Dikopi.<br />
            <span style={{ color: '#9b82f5' }}>Pilih tipe: <strong>Tambahan Modal</strong> (tidak perlu dikembalikan) atau <strong>Hutang ke Owner</strong> (perlu dicatat di tab Hutang juga).</span>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Tanggal</label>
              <input
                className="form-input"
                value={tanggal}
                onChange={(e) => setTanggal(autoSlashDate(e.target.value))}
                placeholder="DD/MM/YYYY"
                maxLength={10}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Masuk Ke</label>
              <select
                className="form-select"
                value={tujuan}
                onChange={(e) => setTujuan(e.target.value as 'cash' | 'rekening')}
              >
                <option value="cash">🪙 Cash di Laci</option>
                <option value="rekening">🏦 Rekening</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Tipe Suntikan</label>
            <select
              className="form-select"
              value={kategori}
              onChange={(e) => setKategori(e.target.value as any)}
            >
              <option value="Suntikan Dana Owner">💉 Suntikan Dana Owner (modal, tidak dikembalikan)</option>
              <option value="Tambahan Modal">💰 Tambahan Modal (ekuitas)</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Nominal (Rp) *</label>
            <input
              className="form-input"
              value={nominal}
              onChange={(e) => setNominal(fmtInputDots(e.target.value))}
              placeholder="0"
              style={{ fontFamily: 'DM Mono', fontSize: '16px', fontWeight: 700 }}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              Keterangan <span style={{ color: 'var(--muted)', fontSize: '10px' }}>(opsional)</span>
            </label>
            <input
              className="form-input"
              value={keterangan}
              onChange={(e) => setKeterangan(e.target.value)}
              placeholder="Beli bahan baku, modal awal bulan, dll..."
            />
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              Batal
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              style={{ background: 'linear-gradient(135deg, #9b82f5, #7c5cfc)', borderColor: '#9b82f5' }}
            >
              💉 Catat Suntikan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ============================================================
// 6. DIKOPI PRIVE (AMBIL UANG PRIBADI)
// ============================================================
interface DikopiPriveModalProps {
  isOpen?: boolean;
  onClose: () => void;
  onSave: (transaksi: TransaksiItem) => Promise<void>;
}

export const DikopiPriveModal: React.FC<DikopiPriveModalProps> = ({
  onClose,
  onSave
}) => {
  const [tanggal, setTanggal] = useState(getTodayDisplay());
  const [nominal, setNominal] = useState('');
  const [sumber, setSumber] = useState<'cash' | 'rekening'>('cash');
  const [keterangan, setKeterangan] = useState('Ambil Uang Pribadi');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanNom = parseInputDots(nominal);
    if (cleanNom <= 0) {
      alert('Nominal tidak boleh 0');
      return;
    }

    const newTrx: TransaksiItem = {
      id: Date.now(),
      tanggal: toStorageDate(tanggal),
      deskripsi: keterangan.trim() || 'Ambil Uang Pribadi',
      kategori: 'Ambil Uang Pribadi',
      transaction_class: 'owner_draw',
      tipe: 'keluar',
      sumber,
      nominal: cleanNom,
      nota: null,
      created_at: new Date().toISOString()
    };

    await onSave(newTrx);
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal" style={{ maxWidth: '540px' }}>
        <div className="modal-title">💸 Ambil Uang Pribadi (Prive)</div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ background: 'rgba(255,159,67,0.08)', border: '1px solid rgba(255,159,67,0.3)', borderRadius: '8px', padding: '10px 14px', fontSize: '12px', color: '#ff9f43', lineHeight: 1.7 }}>
            💡 <strong>Prive</strong> — Mengurangi uang usaha, <strong>tidak mengurangi profit</strong>.<br />
            Ini bukan biaya operasional. Profit bisnis tetap terhitung penuh.
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Tanggal</label>
              <input
                className="form-input"
                value={tanggal}
                onChange={(e) => setTanggal(autoSlashDate(e.target.value))}
                placeholder="DD/MM/YYYY"
                maxLength={10}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Nominal (Rp) *</label>
              <input
                className="form-input"
                value={nominal}
                onChange={(e) => setNominal(fmtInputDots(e.target.value))}
                placeholder="0"
                style={{ fontFamily: 'DM Mono', fontWeight: 700 }}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Sumber Dana</label>
              <select
                className="form-select"
                value={sumber}
                onChange={(e) => setSumber(e.target.value as 'cash' | 'rekening')}
              >
                <option value="cash">🪙 Cash</option>
                <option value="rekening">🏦 Rekening</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Keterangan</label>
              <input
                className="form-input"
                value={keterangan}
                onChange={(e) => setKeterangan(e.target.value)}
                placeholder="Ambil untuk kebutuhan pribadi..."
              />
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              Batal
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              style={{ background: '#ff9f43', borderColor: '#ff9f43', color: '#080c14', fontWeight: 700 }}
            >
              💾 Simpan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ============================================================
// 7. DIKOPI PEMBELIAN ASET MODAL
// ============================================================
interface DikopiBeliAsetModalProps {
  isOpen?: boolean;
  onClose: () => void;
  onSave: (transaksi: TransaksiItem, newAset: AsetItem) => Promise<void>;
}

export const DikopiBeliAsetModal: React.FC<DikopiBeliAsetModalProps> = ({
  onClose,
  onSave
}) => {
  const [tanggal, setTanggal] = useState(getTodayDisplay());
  const [nominal, setNominal] = useState('');
  const [namaAset, setNamaAset] = useState('');
  const [sumber, setSumber] = useState<'cash' | 'rekening'>('cash');
  const [keterangan, setKeterangan] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanNom = parseInputDots(nominal);
    if (cleanNom <= 0) {
      alert('Nominal tidak boleh 0');
      return;
    }
    if (!namaAset.trim()) {
      alert('Nama aset tidak boleh kosong');
      return;
    }

    const ts = Date.now();
    const tglStorage = toStorageDate(tanggal);

    const newTrx: TransaksiItem = {
      id: ts,
      tanggal: tglStorage,
      deskripsi: 'Beli Aset: ' + namaAset.trim(),
      kategori: 'Pembelian Aset',
      transaction_class: 'asset_purchase',
      tipe: 'keluar',
      sumber,
      nominal: cleanNom,
      nota: null,
      created_at: new Date().toISOString()
    };

    const newAset: AsetItem = {
      id: ts + 1,
      nama: namaAset.trim(),
      tanggal: tglStorage,
      nominal: cleanNom,
      sumber,
      keterangan: keterangan.trim()
    };

    await onSave(newTrx, newAset);
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal" style={{ maxWidth: '560px' }}>
        <div className="modal-title">📦 Pembelian Aset</div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ background: 'rgba(139,111,255,0.08)', border: '1px solid rgba(139,111,255,0.3)', borderRadius: '8px', padding: '10px 14px', fontSize: '12px', color: '#8b6fff', lineHeight: 1.7 }}>
            💡 <strong>Pembelian Aset</strong> — Mengurangi uang usaha dan menambah aset, <strong>tidak mengurangi profit</strong>.<br />
            Aset akan otomatis tercatat di data Aset.
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Tanggal</label>
              <input
                className="form-input"
                value={tanggal}
                onChange={(e) => setTanggal(autoSlashDate(e.target.value))}
                placeholder="DD/MM/YYYY"
                maxLength={10}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Nominal (Rp) *</label>
              <input
                className="form-input"
                value={nominal}
                onChange={(e) => setNominal(fmtInputDots(e.target.value))}
                placeholder="0"
                style={{ fontFamily: 'DM Mono', fontWeight: 700 }}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Nama Aset *</label>
            <input
              className="form-input"
              value={namaAset}
              onChange={(e) => setNamaAset(e.target.value)}
              placeholder="Mesin Grinder, Laptop, Meja Kasir..."
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Sumber Dana</label>
              <select
                className="form-select"
                value={sumber}
                onChange={(e) => setSumber(e.target.value as 'cash' | 'rekening')}
              >
                <option value="cash">🪙 Cash</option>
                <option value="rekening">🏦 Rekening</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Keterangan</label>
              <input
                className="form-input"
                value={keterangan}
                onChange={(e) => setKeterangan(e.target.value)}
                placeholder="Untuk operasional..."
              />
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              Batal
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              style={{ background: '#8b6fff', borderColor: '#8b6fff', color: '#fff' }}
            >
              💾 Simpan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ============================================================
// 8. DIKOPI DISTRIBUSI LABA MODAL
// ============================================================
interface DikopiDistribusiLabaModalProps {
  isOpen?: boolean;
  onClose: () => void;
  onSave: (transaksi: TransaksiItem) => Promise<void>;
}

export const DikopiDistribusiLabaModal: React.FC<DikopiDistribusiLabaModalProps> = ({
  onClose,
  onSave
}) => {
  const [tanggal, setTanggal] = useState(getTodayDisplay());
  const [nominal, setNominal] = useState('');
  const [sumber, setSumber] = useState<'cash' | 'rekening'>('rekening');
  const [keterangan, setKeterangan] = useState('Distribusi Laba');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanNom = parseInputDots(nominal);
    if (cleanNom <= 0) {
      alert('Nominal tidak boleh 0');
      return;
    }

    const newTrx: TransaksiItem = {
      id: Date.now(),
      tanggal: toStorageDate(tanggal),
      deskripsi: keterangan.trim() || 'Distribusi Laba',
      kategori: 'Distribusi Laba',
      transaction_class: 'profit_distribution',
      tipe: 'keluar',
      sumber,
      nominal: cleanNom,
      nota: null,
      created_at: new Date().toISOString()
    };

    await onSave(newTrx);
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal" style={{ maxWidth: '540px' }}>
        <div className="modal-title">💰 Distribusi Laba</div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ background: 'rgba(192,57,43,0.08)', border: '1px solid rgba(192,57,43,0.3)', borderRadius: '8px', padding: '10px 14px', fontSize: '12px', color: '#e74c3c', lineHeight: 1.7 }}>
            💡 <strong>Distribusi Laba</strong> — Pembagian keuntungan kepada pemilik.<br />
            <strong>Tidak mempengaruhi profit bulan berjalan.</strong>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Tanggal</label>
              <input
                className="form-input"
                value={tanggal}
                onChange={(e) => setTanggal(autoSlashDate(e.target.value))}
                placeholder="DD/MM/YYYY"
                maxLength={10}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Nominal (Rp) *</label>
              <input
                className="form-input"
                value={nominal}
                onChange={(e) => setNominal(fmtInputDots(e.target.value))}
                placeholder="0"
                style={{ fontFamily: 'DM Mono', fontWeight: 700 }}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Sumber Dana</label>
              <select
                className="form-select"
                value={sumber}
                onChange={(e) => setSumber(e.target.value as 'cash' | 'rekening')}
              >
                <option value="rekening">🏦 Rekening</option>
                <option value="cash">🪙 Cash</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Keterangan</label>
              <input
                className="form-input"
                value={keterangan}
                onChange={(e) => setKeterangan(e.target.value)}
                placeholder="Distribusi laba..."
              />
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              Batal
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              style={{ background: '#c0392b', borderColor: '#c0392b', color: '#fff' }}
            >
              💾 Simpan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ============================================================
// 9. SETUP & EDIT SALDO AWAL MODAL
// ============================================================
interface EditSaldoAwalModalProps {
  isOpen?: boolean;
  onClose: () => void;
  periode: string; // YYYY-MM
  initialCash: number;
  initialRek: number;
  onSave: (cash: number, rek: number) => Promise<void>;
}

export const EditSaldoAwalModal: React.FC<EditSaldoAwalModalProps> = ({
  onClose,
  initialCash,
  initialRek,
  onSave
}) => {
  const [cash, setCash] = useState(initialCash ? initialCash.toLocaleString('id-ID') : '');
  const [rek, setRek] = useState(initialRek ? initialRek.toLocaleString('id-ID') : '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const c = parseInputDots(cash);
    const r = parseInputDots(rek);
    await onSave(c, r);
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal" style={{ maxWidth: '520px' }}>
        <div className="modal-title">💵 Ubah Saldo Awal</div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">🪙 Cash di Laci (Rp)</label>
              <input
                className="form-input"
                value={cash}
                onChange={(e) => setCash(fmtInputDots(e.target.value))}
                placeholder="0"
                style={{ fontFamily: 'DM Mono' }}
              />
            </div>
            <div className="form-group">
              <label className="form-label">🏦 Saldo Rekening (Rp)</label>
              <input
                className="form-input"
                value={rek}
                onChange={(e) => setRek(fmtInputDots(e.target.value))}
                placeholder="0"
                style={{ fontFamily: 'DM Mono' }}
              />
            </div>
          </div>
          <div style={{ fontSize: '11px', color: 'var(--muted)' }}>
            Cash = uang tunai di laci · Rekening = saldo di bank/dompet digital
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              Batal
            </button>
            <button type="submit" className="btn btn-primary">
              💾 Simpan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ============================================================
// 10. EDIT TRANSAKSI MODAL (UNIVERSAL)
// ============================================================
interface EditTransactionModalProps {
  isOpen?: boolean;
  onClose: () => void;
  brand: BrandId;
  transaksi: TransaksiItem;
  onSave: (updated: TransaksiItem) => Promise<void>;
}

export const EditTransactionModal: React.FC<EditTransactionModalProps> = ({
  onClose,
  brand,
  transaksi,
  onSave
}) => {
  const [tanggal, setTanggal] = useState(toDisplayDate(transaksi.tanggal || ''));
  const [tipe, setTipe] = useState<'masuk' | 'keluar' | 'mutasi'>(transaksi.tipe || 'masuk');
  const [deskripsi, setDeskripsi] = useState(transaksi.deskripsi || '');
  const [sumber, setSumber] = useState(transaksi.sumber || 'cash');
  const [nominal, setNominal] = useState(transaksi.nominal ? transaksi.nominal.toLocaleString('id-ID') : '');
  const [kategori, setKategori] = useState(transaksi.kategori || '');

  const isDikopi = brand === 'dikopi';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanNom = parseInputDots(nominal);

    const updated: TransaksiItem = {
      ...transaksi,
      tanggal: toStorageDate(tanggal),
      tipe,
      deskripsi: deskripsi.trim(),
      kategori,
      sumber,
      nominal: cleanNom,
      updated_at: new Date().toISOString()
    };

    await onSave(updated);
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal" style={{ maxWidth: '580px' }}>
        <div className="modal-title">✏️ Edit Transaksi</div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Tanggal</label>
              <input
                className="form-input"
                value={tanggal}
                onChange={(e) => setTanggal(autoSlashDate(e.target.value))}
                placeholder="DD/MM/YYYY"
                maxLength={10}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Tipe</label>
              <select
                className="form-select"
                value={tipe}
                onChange={(e) => setTipe(e.target.value as any)}
              >
                <option value="masuk">💚 Masuk</option>
                <option value="keluar">❤️ Keluar</option>
                <option value="mutasi">🔄 Mutasi</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Deskripsi</label>
            <input
              className="form-input"
              value={deskripsi}
              onChange={(e) => setDeskripsi(e.target.value)}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Metode Pembayaran</label>
              <select
                className="form-select"
                value={sumber}
                onChange={(e) => setSumber(e.target.value)}
              >
                <option value="cash">🪙 Tunai / Cash</option>
                <option value="rekening">🏦 Transfer / QRIS → Rekening</option>
                {isDikopi && <option value="shopee">🛒 Shopee Wallet</option>}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Nominal (Rp)</label>
              <input
                className="form-input"
                value={nominal}
                onChange={(e) => setNominal(fmtInputDots(e.target.value))}
                style={{ fontFamily: 'DM Mono', fontWeight: 700 }}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Kategori</label>
            <select
              className="form-select"
              value={kategori}
              onChange={(e) => setKategori(e.target.value)}
            >
              <optgroup label="📥 Revenue">
                <option value="Penjualan Langsung">Penjualan Langsung</option>
                <option value="Pembayaran DP">Pembayaran DP</option>
                <option value="Pelunasan Order">Pelunasan Order</option>
                <option value="Pendapatan Lainnya">Pendapatan Lainnya</option>
              </optgroup>
              <optgroup label="💉 Modal / Suntikan">
                <option value="Suntikan Dana Owner">Suntikan Dana Owner</option>
                <option value="Tambahan Modal">Tambahan Modal</option>
              </optgroup>
              <optgroup label="📦 HPP">
                <option value="Bahan Baku">Bahan Baku</option>
                <option value="Biaya Produksi/Vendor">Biaya Produksi/Vendor</option>
                <option value="Packaging">Packaging</option>
                <option value="Ongkir/Pengiriman">Ongkir/Pengiriman</option>
                {DIKOPI_HPP_ITEMS.map((h) => (
                  <option key={h} value={h}>{h}</option>
                ))}
              </optgroup>
              <optgroup label="💸 Operasional">
                <option value="Gaji/Honorarium">Gaji/Honorarium</option>
                <option value="Biaya Admin & Dokumen">Biaya Admin & Dokumen</option>
                <option value="Iklan & Marketing">Iklan & Marketing</option>
                <option value="Software & Tools">Software & Tools</option>
                <option value="Utilitas (Listrik, Air)">Utilitas (Listrik, Air)</option>
                <option value="Sewa">Sewa</option>
                <option value="Biaya Admin Shopee">Biaya Admin Shopee</option>
                <option value="Lain-lain">Lain-lain</option>
                {DIKOPI_OPS_ITEMS.map((o) => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </optgroup>
              <optgroup label="👤 Owner">
                <option value="Ambil Uang Pribadi">Ambil Uang Pribadi</option>
                <option value="Distribusi Laba">Distribusi Laba</option>
              </optgroup>
              <optgroup label="🏭 Aset">
                <option value="Pembelian Aset">Pembelian Aset</option>
              </optgroup>
              <optgroup label="🔄 Mutasi">
                <option value="Mutasi">Mutasi</option>
              </optgroup>
            </select>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              Batal
            </button>
            <button type="submit" className="btn btn-primary">
              💾 Simpan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ============================================================
// 11. RIWAYAT EDIT TRANSAKSI (HISTORY)
// ============================================================
interface TxnHistoryModalProps {
  isOpen?: boolean;
  onClose: () => void;
  brand: BrandId;
  transaksi: TransaksiItem;
  historyList: HistoryEntry[];
  onRestore: (snapshot: TransaksiItem) => Promise<void>;
}

export const TxnHistoryModal: React.FC<TxnHistoryModalProps> = ({
  onClose,
  brand,
  transaksi,
  historyList,
  onRestore
}) => {
  const entries = historyList
    .filter((h) => h.brand === brand && String(h.txnId) === String(transaksi.id))
    .sort((a, b) => b.editedAt.localeCompare(a.editedAt));

  return (
    <div className="modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal" style={{ maxWidth: '600px' }}>
        <div className="modal-title">🕐 Riwayat Edit Transaksi</div>
        {entries.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px', color: 'var(--muted)' }}>
            Belum ada riwayat edit untuk transaksi ini.
          </div>
        ) : (
          <div>
            <div style={{ fontSize: '11px', color: 'var(--muted)', marginBottom: '12px' }}>
              {entries.length} riwayat versi sebelumnya
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '420px', overflowY: 'auto', paddingRight: '4px' }}>
              {entries.map((h, i) => {
                const s = h.snapshot;
                const isLatest = i === 0;
                const editDate = new Date(h.editedAt);
                const dateStr = editDate.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
                const timeStr = editDate.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
                const srcLabel = s.sumber === 'shopee' ? '🛒 Shopee' : s.sumber === 'rekening' ? '🏦 Rekening' : '🪙 Cash';

                return (
                  <div
                    key={h.id}
                    style={{
                      border: '1px solid var(--border)',
                      borderRadius: '10px',
                      padding: '12px',
                      background: 'var(--surface2)',
                      borderColor: isLatest ? 'var(--border2)' : undefined
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <div>
                        <span style={{ fontSize: '11px', fontFamily: 'DM Mono', color: 'var(--muted)' }}>
                          {dateStr} · {timeStr}
                        </span>
                        {isLatest && (
                          <span style={{ marginLeft: '8px', fontSize: '9px', background: 'rgba(46,156,255,0.15)', color: 'var(--accent)', padding: '1px 7px', borderRadius: '99px', fontFamily: 'DM Mono' }}>
                            TERAKHIR DIEDIT
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        style={{ color: '#4cc9a0', borderColor: '#4cc9a0', fontSize: '11px' }}
                        onClick={async () => {
                          if (confirm('Kembalikan data transaksi ke versi ini?')) {
                            await onRestore(s);
                            onClose();
                          }
                        }}
                      >
                        ↩ Restore
                      </button>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '3px 12px', fontSize: '11px' }}>
                      <span style={{ color: 'var(--muted)' }}>Tanggal</span>
                      <span>{s.tanggal}</span>
                      <span style={{ color: 'var(--muted)' }}>Deskripsi</span>
                      <span style={{ color: 'var(--text)' }}>{s.deskripsi || '—'}</span>
                      <span style={{ color: 'var(--muted)' }}>Tipe</span>
                      <span>{s.tipe === 'masuk' ? '💚 Masuk' : '❤️ Keluar'}</span>
                      <span style={{ color: 'var(--muted)' }}>Metode</span>
                      <span>{srcLabel}</span>
                      <span style={{ color: 'var(--muted)' }}>Kategori</span>
                      <span>{s.kategori || '—'}</span>
                      <span style={{ color: 'var(--muted)' }}>Nominal</span>
                      <span style={{ fontFamily: 'DM Mono', fontWeight: 600, color: s.tipe === 'masuk' ? '#4cc9a0' : 'var(--red)' }}>
                        {s.tipe === 'masuk' ? '+' : '−'} Rp {(s.nominal || 0).toLocaleString('id-ID')}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        <div className="modal-actions" style={{ marginTop: '14px' }}>
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================================
// 12. PREVIEW NOTA MODAL
// ============================================================
interface PreviewNotaModalProps {
  isOpen?: boolean;
  onClose: () => void;
  transaksi: TransaksiItem;
}

export const PreviewNotaModal: React.FC<PreviewNotaModalProps> = ({
  onClose,
  transaksi
}) => {
  if (!transaksi.nota) return null;

  const isImg = !transaksi.nota_type || transaksi.nota_type.startsWith('image');

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = transaksi.nota!;
    const ext = transaksi.nota_type?.split('/')[1] || 'jpg';
    a.download = `nota_${(transaksi.deskripsi || 'trx').slice(0, 20).replace(/\s/g, '_')}.${ext}`;
    a.click();
  };

  return (
    <div className="modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal" style={{ maxWidth: '640px' }}>
        <div className="modal-title">📑 Nota — {transaksi.deskripsi}</div>
        <div style={{ textAlign: 'center', margin: '14px 0' }}>
          {isImg ? (
            <img
              src={transaksi.nota}
              alt="Nota"
              style={{ width: '100%', maxHeight: '500px', objectFit: 'contain', borderRadius: '8px' }}
            />
          ) : (
            <div style={{ padding: '30px 20px' }}>
              <div style={{ fontSize: '48px', marginBottom: '12px' }}>📄</div>
              <div style={{ color: 'var(--text2)' }}>Dokumen PDF — Klik Download untuk membuka berkas</div>
            </div>
          )}
        </div>
        <div className="modal-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Tutup
          </button>
          <button type="button" className="btn btn-primary" onClick={handleDownload}>
            📥 Download
          </button>
        </div>
      </div>
    </div>
  );
};
