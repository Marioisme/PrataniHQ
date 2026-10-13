import React, { useState } from 'react';
import type { BrandId, TransaksiItem, BahanItem } from '../../types';

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeBrand: BrandId;
  bahanList?: BahanItem[];
  onSave: (transaksi: TransaksiItem, brand: BrandId) => Promise<void>;
  onUpdateBahan?: (bahan: BahanItem) => Promise<void> | void;
}

interface SelectedBahanEntry {
  bahan: BahanItem;
  qty: number;
  harga: number;
  updateMasterHarga?: boolean;
}

export const AddTransactionModal: React.FC<AddTransactionModalProps> = ({
  isOpen,
  onClose,
  activeBrand: initialBrand,
  bahanList = [],
  onSave,
  onUpdateBahan
}) => {
  const [tanggal, setTanggal] = useState(() => new Date().toISOString().split('T')[0]);
  const [tipe, setTipe] = useState<'masuk' | 'keluar'>('masuk');
  const [brand, setBrand] = useState<BrandId>(initialBrand);
  const [nominal, setNominal] = useState<string>('');
  const [kategori, setKategori] = useState<string>('Penjualan Langsung');
  const [sumber, setSumber] = useState<string>('cash');
  const [deskripsi, setDeskripsi] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Bahan Baku Restock Selector States (For Finance)
  const [selectedBahanEntries, setSelectedBahanEntries] = useState<SelectedBahanEntry[]>([]);

  const handleClose = () => {
    setNominal('');
    setDeskripsi('');
    setSelectedBahanEntries([]);
    onClose();
  };

  if (!isOpen) return null;

  // Sinkronisasi otomatis dari daftar bahan yang dipilih ke kolom nominal & deskripsi
  const syncFromBahanEntries = (entries: SelectedBahanEntry[]) => {
    if (entries.length === 0) return;

    const total = entries.reduce((acc, it) => acc + (it.qty * it.harga), 0);
    setNominal('Rp ' + total.toLocaleString('id-ID'));

    const desc = 'Belanja Bahan: ' + entries
      .map((it) => `${it.bahan.nama} (${it.qty}x)`)
      .join(', ');
    setDeskripsi(desc);
  };

  const handleAddBahan = (b: BahanItem) => {
    const existingIdx = selectedBahanEntries.findIndex((e) => String(e.bahan.id) === String(b.id));
    let nextEntries: SelectedBahanEntry[];

    if (existingIdx >= 0) {
      nextEntries = selectedBahanEntries.map((e, idx) =>
        idx === existingIdx ? { ...e, qty: e.qty + 1 } : e
      );
    } else {
      nextEntries = [
        ...selectedBahanEntries,
        {
          bahan: b,
          qty: 1,
          harga: b.hargaBeli || 0,
          updateMasterHarga: false
        }
      ];
    }

    setSelectedBahanEntries(nextEntries);
    syncFromBahanEntries(nextEntries);
    setKategori('Belanja Bahan Baku');
  };

  const handleUpdateEntryQty = (bahanId: number | string, delta: number) => {
    const nextEntries = selectedBahanEntries
      .map((e) => {
        if (String(e.bahan.id) === String(bahanId)) {
          const newQty = Math.max(1, e.qty + delta);
          return { ...e, qty: newQty };
        }
        return e;
      });
    setSelectedBahanEntries(nextEntries);
    syncFromBahanEntries(nextEntries);
  };

  const handleUpdateEntryHarga = (bahanId: number | string, newHargaStr: string) => {
    const num = parseFloat(newHargaStr.replace(/[^0-9]/g, '')) || 0;
    const nextEntries = selectedBahanEntries.map((e) => {
      if (String(e.bahan.id) === String(bahanId)) {
        return {
          ...e,
          harga: num,
          updateMasterHarga: num !== e.bahan.hargaBeli
        };
      }
      return e;
    });
    setSelectedBahanEntries(nextEntries);
    syncFromBahanEntries(nextEntries);
  };

  const handleToggleUpdateMaster = (bahanId: number | string, checked: boolean) => {
    setSelectedBahanEntries((prev) =>
      prev.map((e) =>
        String(e.bahan.id) === String(bahanId) ? { ...e, updateMasterHarga: checked } : e
      )
    );
  };

  const handleRemoveEntry = (bahanId: number | string) => {
    const nextEntries = selectedBahanEntries.filter((e) => String(e.bahan.id) !== String(bahanId));
    setSelectedBahanEntries(nextEntries);
    if (nextEntries.length > 0) {
      syncFromBahanEntries(nextEntries);
    } else {
      setNominal('');
      setDeskripsi('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanNominal = parseFloat(nominal.replace(/[^0-9]/g, '')) || 0;
    if (cleanNominal <= 0) {
      alert('Masukkan nominal transaksi yang valid');
      return;
    }
    if (!deskripsi.trim()) {
      alert('Masukkan deskripsi transaksi');
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Simpan perubahan master harga bahan jika Finance menyetujui
      if (onUpdateBahan && selectedBahanEntries.length > 0) {
        for (const entry of selectedBahanEntries) {
          if (entry.updateMasterHarga && entry.harga > 0 && entry.harga !== entry.bahan.hargaBeli) {
            const updatedBahan: BahanItem = {
              ...entry.bahan,
              hargaBeli: entry.harga,
              updatedAt: new Date().toISOString()
            };
            await onUpdateBahan(updatedBahan);
          }
        }
      }

      // 2. Buat objek transaksi dengan rincian items terstruktur
      const newTrx: TransaksiItem = {
        id: Date.now(),
        tanggal,
        tipe,
        nominal: cleanNominal,
        kategori,
        sumber,
        deskripsi: deskripsi.trim(),
        transaction_class: tipe === 'keluar' && (kategori === 'Belanja Bahan Baku' || selectedBahanEntries.length > 0) ? 'hpp' : undefined,
        _margin: tipe === 'masuk' ? cleanNominal : 0,
        _source: 'manual',
        created_at: new Date().toISOString()
      };

      // Tambahkan rincian items jika menggunakan pemilih bahan baku
      if (selectedBahanEntries.length > 0) {
        newTrx.items = selectedBahanEntries.map((it) => ({
          id: it.bahan.id,
          nama: it.bahan.nama,
          qty: it.qty,
          price: it.harga,
          subtotal: it.qty * it.harga
        }));
      }

      await onSave(newTrx, brand);
      onClose();
      // Reset form
      setNominal('');
      setDeskripsi('');
      setSelectedBahanEntries([]);
    } catch (err) {
      console.error(err);
      alert('Gagal menyimpan transaksi');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNominalChange = (val: string) => {
    const raw = val.replace(/[^0-9]/g, '');
    if (!raw) {
      setNominal('');
      return;
    }
    const num = parseInt(raw, 10);
    setNominal('Rp ' + num.toLocaleString('id-ID'));
  };

  const isBelanjaBahanMode = brand === 'dikopi' && tipe === 'keluar';

  return (
    <div className="modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}>
      <div className="modal" style={{ maxWidth: '620px', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div className="modal-title" style={{ marginBottom: 0 }}>
            ➕ Catat Transaksi Baru
          </div>
          <button
            onClick={handleClose}
            className="btn btn-ghost btn-sm"
            style={{ padding: '4px 8px', fontSize: '13px' }}
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Tipe Selector Filter Buttons */}
          <div className="filter-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '6px' }}>
            <button
              type="button"
              onClick={() => {
                setTipe('masuk');
                setKategori('Penjualan Langsung');
                setSelectedBahanEntries([]);
              }}
              className={`filter-btn ${tipe === 'masuk' ? 'active' : ''}`}
              style={{
                justifyContent: 'center',
                color: tipe === 'masuk' ? 'var(--green)' : 'var(--muted)',
                borderColor: tipe === 'masuk' ? 'rgba(16, 185, 129, 0.4)' : 'var(--border)'
              }}
            >
              + Kas Masuk (Pemasukan)
            </button>
            <button
              type="button"
              onClick={() => {
                setTipe('keluar');
                setKategori('Belanja Bahan Baku');
              }}
              className={`filter-btn ${tipe === 'keluar' ? 'active' : ''}`}
              style={{
                justifyContent: 'center',
                color: tipe === 'keluar' ? 'var(--red)' : 'var(--muted)',
                borderColor: tipe === 'keluar' ? 'rgba(244, 63, 94, 0.4)' : 'var(--border)'
              }}
            >
              - Kas Keluar (Pengeluaran)
            </button>
          </div>

          {/* Row: Brand & Tanggal */}
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Brand Unit</label>
              <select
                value={brand}
                onChange={(e) => setBrand(e.target.value as BrandId)}
                className="form-select"
              >
                <option value="dikopi">☕ Dikopi F&B</option>
                <option value="kolektiva">🛍️ Kolektiva Apparel</option>
                <option value="imagineer">✨ Imagineer Creative</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Tanggal</label>
              <input
                type="date"
                value={tanggal}
                onChange={(e) => setTanggal(e.target.value)}
                className="form-input"
                style={{ fontFamily: 'DM Mono' }}
              />
            </div>
          </div>

          {/* ══════════════════════════════════════════════════════════════
              PEMILIH BAHAN BAKU OTOMATIS (KHUSUS PENGELUARAN DIKOPI)
          ══════════════════════════════════════════════════════════════ */}
          {isBelanjaBahanMode && (
            <div
              style={{
                background: 'rgba(76,201,160,0.04)',
                border: '1px solid rgba(76,201,160,0.25)',
                borderRadius: '10px',
                padding: '12px 14px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#4cc9a0' }}>
                  🏷️ Pemilih Bahan Baku (Restok Otomatis ke Smart Stok)
                </span>
                <span style={{ fontSize: '11px', color: 'var(--muted)' }}>Bebas typo & otomatis restok</span>
              </div>

              {/* Quick Click Chips */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '10px' }}>
                {bahanList.slice(0, 8).map((b) => {
                  const isSelected = selectedBahanEntries.some((e) => String(e.bahan.id) === String(b.id));
                  return (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => handleAddBahan(b)}
                      style={{
                        padding: '4px 9px',
                        fontSize: '11px',
                        borderRadius: '99px',
                        background: isSelected ? 'rgba(76,201,160,0.2)' : 'var(--surface2)',
                        color: isSelected ? '#4cc9a0' : 'var(--text2)',
                        border: isSelected ? '1px solid #4cc9a0' : '1px solid var(--border)',
                        cursor: 'pointer',
                        transition: 'all 0.15s'
                      }}
                    >
                      + {b.nama}
                    </button>
                  );
                })}
              </div>

              {/* Dropdown Pencarian Semua Bahan */}
              <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                <select
                  className="form-select"
                  style={{ flex: 1, fontSize: '12px' }}
                  value=""
                  onChange={(e) => {
                    if (!e.target.value) return;
                    const found = bahanList.find((b) => String(b.id) === e.target.value);
                    if (found) handleAddBahan(found);
                  }}
                >
                  <option value="">🔍 Pilih bahan baku lain dari daftar...</option>
                  {bahanList.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.nama} — Rp {b.hargaBeli.toLocaleString('id-ID')} / {b.qtyBeli} {b.satuan}
                    </option>
                  ))}
                </select>
              </div>

              {/* Daftar Bahan yang Dipilih (Keranjang Nota Belanja) */}
              {selectedBahanEntries.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px' }}>
                  <div style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: 600 }}>
                    ITEM BELANJAAN TERPILIH ({selectedBahanEntries.length}):
                  </div>

                  {selectedBahanEntries.map((it) => {
                    const subtotal = it.qty * it.harga;
                    const isHargaChanged = it.harga !== it.bahan.hargaBeli;

                    return (
                      <div
                        key={it.bahan.id}
                        style={{
                          background: 'var(--surface)',
                          border: '1px solid var(--border)',
                          borderRadius: '8px',
                          padding: '8px 12px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '6px'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div>
                            <span style={{ fontWeight: 600, color: '#fff', fontSize: '13px' }}>
                              {it.bahan.nama}
                            </span>
                            <span style={{ fontSize: '11px', color: 'var(--muted)', marginLeft: '6px' }}>
                              ({it.bahan.qtyBeli} {it.bahan.satuan}/pack)
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleRemoveEntry(it.bahan.id)}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: 'var(--red)',
                              cursor: 'pointer',
                              fontSize: '14px',
                              padding: '2px 6px'
                            }}
                            title="Hapus item"
                          >
                            ✕
                          </button>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          {/* Qty Counter Buttons */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <button
                              type="button"
                              className="btn btn-ghost btn-sm"
                              style={{ padding: '2px 8px', fontSize: '12px' }}
                              onClick={() => handleUpdateEntryQty(it.bahan.id, -1)}
                            >
                              −
                            </button>
                            <span style={{ fontFamily: 'DM Mono', fontSize: '13px', fontWeight: 700, minWidth: '24px', textAlign: 'center' }}>
                              {it.qty}
                            </span>
                            <button
                              type="button"
                              className="btn btn-ghost btn-sm"
                              style={{ padding: '2px 8px', fontSize: '12px' }}
                              onClick={() => handleUpdateEntryQty(it.bahan.id, 1)}
                            >
                              +
                            </button>
                            <span style={{ fontSize: '11px', color: 'var(--muted)' }}>pack</span>
                          </div>

                          {/* Harga Satuan Beli */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flex: 1 }}>
                            <span style={{ fontSize: '11px', color: 'var(--muted)' }}>@</span>
                            <input
                              type="text"
                              className="form-input"
                              style={{ padding: '4px 8px', fontSize: '12px', fontFamily: 'DM Mono' }}
                              value={'Rp ' + it.harga.toLocaleString('id-ID')}
                              onChange={(e) => handleUpdateEntryHarga(it.bahan.id, e.target.value)}
                            />
                          </div>

                          {/* Subtotal */}
                          <div style={{ fontFamily: 'DM Mono', fontSize: '13px', fontWeight: 700, color: '#4cc9a0', minWidth: '80px', textAlign: 'right' }}>
                            Rp {subtotal.toLocaleString('id-ID')}
                          </div>
                        </div>

                        {/* Opsi Update Master Harga Jika Ada Perubahan Harga Pasar */}
                        {isHargaChanged && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--yellow)', marginTop: '2px' }}>
                            <input
                              type="checkbox"
                              id={`update-master-${it.bahan.id}`}
                              checked={Boolean(it.updateMasterHarga)}
                              onChange={(e) => handleToggleUpdateMaster(it.bahan.id, e.target.checked)}
                            />
                            <label htmlFor={`update-master-${it.bahan.id}`} style={{ cursor: 'pointer' }}>
                              Harga berubah dari master (Rp {it.bahan.hargaBeli.toLocaleString('id-ID')}). Update master harga beli?
                            </label>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Nominal */}
          <div className="form-group">
            <label className="form-label">Nominal Total (Rp)</label>
            <input
              type="text"
              placeholder="Rp 0"
              value={nominal}
              onChange={(e) => handleNominalChange(e.target.value)}
              className="form-input"
              style={{ fontFamily: 'DM Mono', fontSize: '18px', fontWeight: 700 }}
            />
          </div>

          {/* Deskripsi */}
          <div className="form-group">
            <label className="form-label">Keterangan / Deskripsi</label>
            <input
              type="text"
              placeholder="Contoh: Belanja Susu Diamond (2x), SKM (1x)"
              value={deskripsi}
              onChange={(e) => setDeskripsi(e.target.value)}
              className="form-input"
            />
          </div>

          {/* Row: Kategori & Sumber Dana */}
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Kategori</label>
              <select
                value={kategori}
                onChange={(e) => setKategori(e.target.value)}
                className="form-select"
              >
                {tipe === 'masuk' ? (
                  <>
                    <option value="Penjualan Langsung">Penjualan Langsung</option>
                    <option value="Penjualan Event">Penjualan Event</option>
                    <option value="Online / Ojek Online">Online / Ojol</option>
                    <option value="Pendapatan Jasa">Pendapatan Jasa</option>
                    <option value="Lain-lain">Lain-lain</option>
                  </>
                ) : (
                  <>
                    <option value="Belanja Bahan Baku">Belanja Bahan Baku</option>
                    <option value="Operasional & Listrik">Operasional & Listrik</option>
                    <option value="Gaji / Fee Barista">Gaji / Fee Barista</option>
                    <option value="Sewa & Maintenance">Sewa & Maintenance</option>
                    <option value="Marketing & Promosi">Marketing & Promosi</option>
                    <option value="Pengeluaran Lain">Pengeluaran Lain</option>
                  </>
                )}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Sumber Dana</label>
              <select
                value={sumber}
                onChange={(e) => setSumber(e.target.value)}
                className="form-select"
              >
                <option value="cash">🪙 Tunai / Cash</option>
                <option value="qris">📱 QRIS</option>
                <option value="bca">🏦 BCA Transfer</option>
                <option value="mandiri">🏦 Mandiri Transfer</option>
                <option value="shopee">🧡 ShopeeFood / ShopeePay</option>
                <option value="gofood">🟢 GoFood</option>
                <option value="tiktok">🎵 TikTokGo</option>
              </select>
            </div>
          </div>

          {/* Modal Actions */}
          <div className="modal-actions">
            <button
              type="button"
              onClick={handleClose}
              className="btn btn-ghost"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn btn-primary"
            >
              {isSubmitting ? 'Menyimpan...' : 'Simpan Transaksi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
