import React, { useState, useMemo } from 'react';
import type { ProdukKolektivaItem, MoqTierItem, KomponenBiayaItem } from '../../types';
import { fmtRp } from '../../lib/keuanganUtils';
import { PRODUK_KATEGORI, hitungHPPProduk, hitungHargaJualProduk } from '../../lib/kolektivaUtils';

interface ProdukKolektivaViewProps {
  produkList: ProdukKolektivaItem[];
  onSaveProduk: (p: ProdukKolektivaItem) => Promise<void>;
  onUpdateProduk: (p: ProdukKolektivaItem) => Promise<void>;
  onDeleteProduk: (id: number | string) => Promise<void>;
  onLaunchHpp: (produkId: number | string) => void;
  onBulkImportProduk: (items: ProdukKolektivaItem[]) => Promise<void>;
}

export const ProdukKolektivaView: React.FC<ProdukKolektivaViewProps> = ({
  produkList,
  onSaveProduk,
  onUpdateProduk,
  onDeleteProduk,
  onLaunchHpp,
  onBulkImportProduk
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeProdukId, setActiveProdukId] = useState<number | string | null>(null);
  const [katOpenState, setKatOpenState] = useState<Record<string, boolean>>({});

  // Modals
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProdukKolektivaItem | null>(null);

  const [isMoqModalOpen, setIsMoqModalOpen] = useState(false);
  const [isKomponenModalOpen, setIsKomponenModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // Form states for Product
  const [formProduct, setFormProduct] = useState<Partial<ProdukKolektivaItem>>({
    nama: '',
    kategori: 'Apparel',
    moq: 1,
    hargaDasar: 0,
    marginRekomendasi: 35,
    hargaJual: null,
    supplier: {
      nama: '',
      kontak: '',
      alamat: '',
      ongkirKePratani: 0
    },
    catatan: ''
  });

  // Komponen Modal state
  const [komponenData, setKomponenData] = useState<{ nama: string; nominal: number; per: 'pcs' | 'order' }>({
    nama: '',
    nominal: 0,
    per: 'order'
  });

  // MOQ Tier editing state
  const [editingTiers, setEditingTiers] = useState<MoqTierItem[]>([]);

  // Bulk Import text
  const [importJsonText, setImportJsonText] = useState('');

  // Active product determination
  const activeProduct = useMemo(() => {
    if (!produkList || produkList.length === 0) return null;
    if (activeProdukId) {
      const found = produkList.find((p) => String(p.id) === String(activeProdukId));
      if (found) return found;
    }
    return produkList[0];
  }, [produkList, activeProdukId]);

  // Grouped products
  const groupedCategories = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();
    return PRODUK_KATEGORI.map((kat) => {
      const items = (produkList || []).filter((p) => {
        const matchesKat = (p.kategori || 'Lainnya') === kat;
        if (!matchesKat) return false;
        if (!q) return true;
        return (
          (p.nama || '').toLowerCase().includes(q) ||
          (p.supplier?.nama || '').toLowerCase().includes(q) ||
          (p.catatan || '').toLowerCase().includes(q)
        );
      });
      return { kat, items };
    }).filter((g) => g.items.length > 0);
  }, [produkList, searchTerm]);

  const totalFilteredCount = useMemo(() => {
    return groupedCategories.reduce((sum, g) => sum + g.items.length, 0);
  }, [groupedCategories]);

  // Handlers
  const handleOpenAdd = () => {
    setEditingProduct(null);
    setFormProduct({
      nama: '',
      kategori: 'Apparel',
      moq: 12,
      hargaDasar: 50000,
      marginRekomendasi: 35,
      hargaJual: null,
      supplier: {
        nama: '',
        kontak: '',
        alamat: '',
        ongkirKePratani: 15000
      },
      catatan: ''
    });
    setIsProductModalOpen(true);
  };

  const handleOpenEdit = (p: ProdukKolektivaItem) => {
    setEditingProduct(p);
    setFormProduct({
      ...p,
      supplier: {
        nama: p.supplier?.nama || '',
        kontak: p.supplier?.kontak || '',
        alamat: p.supplier?.alamat || '',
        ongkirKePratani: p.supplier?.ongkirKePratani || 0
      }
    });
    setIsProductModalOpen(true);
  };

  const handleDuplicate = async (p: ProdukKolektivaItem) => {
    const duplicated: ProdukKolektivaItem = {
      ...JSON.parse(JSON.stringify(p)),
      id: Date.now(),
      nama: `${p.nama} (Copy)`,
      createdAt: new Date().toISOString()
    };
    await onSaveProduk(duplicated);
    setActiveProdukId(duplicated.id);
  };

  const handleSaveProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formProduct.nama?.trim()) return;

    if (editingProduct) {
      const updated: ProdukKolektivaItem = {
        ...editingProduct,
        ...formProduct,
        nama: formProduct.nama.trim(),
        moq: Number(formProduct.moq) || 1,
        hargaDasar: Number(formProduct.hargaDasar) || 0,
        marginRekomendasi: Number(formProduct.marginRekomendasi) || 35,
        hargaJual: formProduct.hargaJual ? Number(formProduct.hargaJual) : null,
        supplier: {
          ...formProduct.supplier,
          ongkirKePratani: Number(formProduct.supplier?.ongkirKePratani) || 0
        }
      };
      await onUpdateProduk(updated);
    } else {
      const newItem: ProdukKolektivaItem = {
        id: Date.now(),
        nama: formProduct.nama.trim(),
        kategori: formProduct.kategori || 'Apparel',
        moq: Number(formProduct.moq) || 1,
        hargaDasar: Number(formProduct.hargaDasar) || 0,
        marginRekomendasi: Number(formProduct.marginRekomendasi) || 35,
        hargaJual: formProduct.hargaJual ? Number(formProduct.hargaJual) : null,
        moqTiers: [],
        komponenBiaya: [],
        supplier: {
          ...formProduct.supplier,
          ongkirKePratani: Number(formProduct.supplier?.ongkirKePratani) || 0
        },
        catatan: formProduct.catatan || '',
        createdAt: new Date().toISOString()
      };
      await onSaveProduk(newItem);
      setActiveProdukId(newItem.id);
    }
    setIsProductModalOpen(false);
  };

  // MOQ Tiers Management
  const handleOpenMoqModal = () => {
    if (!activeProduct) return;
    setEditingTiers([...(activeProduct.moqTiers || [])]);
    setIsMoqModalOpen(true);
  };

  const handleAddTierRow = () => {
    setEditingTiers([
      ...editingTiers,
      { qty: 50, hargaDasar: (activeProduct?.hargaDasar || 0) * 0.95 }
    ]);
  };

  const handleRemoveTierRow = (idx: number) => {
    setEditingTiers(editingTiers.filter((_, i) => i !== idx));
  };

  const handleSaveMoqTiers = async () => {
    if (!activeProduct) return;
    const sorted = [...editingTiers].sort((a, b) => a.qty - b.qty);
    await onUpdateProduk({
      ...activeProduct,
      moqTiers: sorted
    });
    setIsMoqModalOpen(false);
  };

  // Komponen Biaya Management
  const handleAddKomponen = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProduct || !komponenData.nama.trim()) return;

    const newKomp: KomponenBiayaItem = {
      id: Date.now(),
      nama: komponenData.nama.trim(),
      nominal: Number(komponenData.nominal) || 0,
      per: komponenData.per
    };

    const updated = {
      ...activeProduct,
      komponenBiaya: [...(activeProduct.komponenBiaya || []), newKomp]
    };

    await onUpdateProduk(updated);
    setIsKomponenModalOpen(false);
    setKomponenData({ nama: '', nominal: 0, per: 'order' });
  };

  const handleDeleteKomponen = async (idx: number) => {
    if (!activeProduct) return;
    const updatedKomponen = (activeProduct.komponenBiaya || []).filter((_, i) => i !== idx);
    await onUpdateProduk({
      ...activeProduct,
      komponenBiaya: updatedKomponen
    });
  };

  // Bulk Import
  const handleBulkImportSubmit = async () => {
    if (!importJsonText.trim()) return;
    try {
      const parsed = JSON.parse(importJsonText);
      const items = Array.isArray(parsed) ? parsed : [parsed];
      if (items.length > 0) {
        await onBulkImportProduk(items);
        setIsImportModalOpen(false);
        setImportJsonText('');
      }
    } catch (err: unknown) {
      alert('Format JSON tidak valid: ' + (err instanceof Error ? err.message : 'Error parsing'));
    }
  };

  // Calculated values for active product
  const activeHpp = activeProduct ? hitungHPPProduk(activeProduct) : 0;
  const activeJual = activeProduct ? hitungHargaJualProduk(activeProduct) : 0;
  const activeMargin = activeProduct?.hargaJual
    ? Math.round((1 - activeHpp / activeProduct.hargaJual) * 100)
    : activeProduct?.marginRekomendasi || 35;
  const activeProfit = activeJual - activeHpp;

  // Render MOQ table rows
  const allTiers = useMemo(() => {
    if (!activeProduct) return [];
    return [
      { qty: activeProduct.moq || 1, hargaDasar: activeProduct.hargaDasar || 0, isBase: true },
      ...(activeProduct.moqTiers || [])
    ].sort((a, b) => a.qty - b.qty);
  }, [activeProduct]);

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', paddingBottom: '40px' }}>
      {/* Top Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
        <div>
          <div style={{ fontSize: '11px', fontFamily: 'DM Mono', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            🛍️ Produk Kolektiva — Price List & Katalog
          </div>
          <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text)' }}>
            Katalog Produk Merch & Konveksi
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button className="btn btn-ghost btn-sm" onClick={() => setIsImportModalOpen(true)}>
            📥 Import Excel / JSON
          </button>
          <button className="btn btn-primary btn-sm" onClick={handleOpenAdd}>
            + Produk Baru
          </button>
        </div>
      </div>

      {/* Main 2-Column Catalog Layout */}
      <div className="resep-layout">
        {/* Left Column: Product List & Categories */}
        <div>
          {/* Search Bar */}
          <div style={{ position: 'relative', marginBottom: '10px' }}>
            <input
              className="form-input"
              placeholder="Cari produk, supplier, catatan..."
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
                style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: '14px' }}
              >
                ✕
              </button>
            )}
          </div>

          {searchTerm && (
            <div style={{ fontSize: '10px', color: 'var(--muted)', fontFamily: 'DM Mono', marginBottom: '8px' }}>
              {totalFilteredCount} dari {produkList.length} produk
            </div>
          )}

          {/* Categories Accordion */}
          {groupedCategories.length === 0 ? (
            <div style={{ fontSize: '12px', color: 'var(--muted)', textAlign: 'center', padding: '24px 0' }}>
              Tidak ada produk ditemukan
            </div>
          ) : (
            groupedCategories.map((g) => {
              const isOpen = katOpenState[g.kat] !== false; // default open
              return (
                <div key={g.kat} style={{ marginBottom: '6px' }}>
                  <div
                    onClick={() => setKatOpenState({ ...katOpenState, [g.kat]: !isOpen })}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '6px 8px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      background: 'var(--surface2)',
                      border: '1px solid var(--border)',
                      userSelect: 'none',
                      marginBottom: isOpen ? '6px' : '0'
                    }}
                  >
                    <span style={{ fontSize: '10px', fontFamily: 'DM Mono', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--muted)' }}>
                      {g.kat} <span style={{ color: 'var(--accent)' }}>({g.items.length})</span>
                    </span>
                    <span
                      style={{
                        color: 'var(--muted)',
                        fontSize: '11px',
                        transition: 'transform 0.2s',
                        display: 'inline-block',
                        transform: isOpen ? 'rotate(0deg)' : 'rotate(180deg)'
                      }}
                    >
                      ▲
                    </span>
                  </div>

                  {isOpen && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {g.items.map((p) => {
                        const hpp = hitungHPPProduk(p);
                        const jual = hitungHargaJualProduk(p);
                        const isActive = activeProduct?.id === p.id;

                        return (
                          <div
                            key={p.id}
                            className={`resep-card ${isActive ? 'active' : ''}`}
                            onClick={() => setActiveProdukId(p.id)}
                            style={{ cursor: 'pointer', padding: '10px 12px' }}
                          >
                            <div className="resep-nama" style={{ fontSize: '13px', fontWeight: 600 }}>
                              {p.nama}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginTop: '4px' }}>
                              <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--accent)' }}>
                                {fmtRp(Math.round(jual))}
                              </div>
                              <div style={{ fontSize: '10.5px', color: 'var(--muted)', fontFamily: 'DM Mono' }}>
                                HPP {fmtRp(Math.round(hpp))}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Right Column: Product Detail Panel */}
        <div>
          {!activeProduct ? (
            <div className="empty" style={{ padding: '60px 20px', textAlign: 'center' }}>
              <div className="empty-icon" style={{ fontSize: '40px', marginBottom: '8px' }}>🛍️</div>
              <div style={{ fontWeight: 600, fontSize: '15px' }}>Pilih atau tambah produk</div>
              <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '4px' }}>
                Pilih produk di daftar sebelah kiri untuk melihat rincian HPP, MOQ tier, dan supplier.
              </div>
            </div>
          ) : (
            <div>
              {/* Header Details & Actions */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
                <div>
                  <div style={{ fontSize: '17px', fontWeight: 700, color: 'var(--text)' }}>
                    {activeProduct.nama}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '2px' }}>
                    {activeProduct.kategori || '—'} · MOQ {activeProduct.moq || 1} pcs
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  <button
                    className="btn btn-sm"
                    style={{ background: 'var(--accent)', borderColor: 'var(--accent)', color: '#fff', fontWeight: 600 }}
                    onClick={() => onLaunchHpp(activeProduct.id)}
                  >
                    📊 Hitung HPP
                  </button>
                  <button className="btn btn-ghost btn-sm" onClick={() => handleDuplicate(activeProduct)}>
                    📋 Duplikat
                  </button>
                  <button className="btn btn-ghost btn-sm" onClick={() => handleOpenEdit(activeProduct)}>
                    ✏️ Edit
                  </button>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => {
                      if (window.confirm(`Hapus produk "${activeProduct.nama}"?`)) {
                        onDeleteProduk(activeProduct.id);
                      }
                    }}
                  >
                    🗑️
                  </button>
                </div>
              </div>

              {/* Price / Margin Overview Banner */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '12px' }}>
                <div style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: '10px', padding: '10px 14px' }}>
                  <div style={{ fontSize: '10px', fontFamily: 'DM Mono', color: 'var(--muted)', textTransform: 'uppercase' }}>HPP / pcs</div>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: '#4cc9a0', fontFamily: 'DM Mono', marginTop: '2px' }}>
                    {fmtRp(Math.round(activeHpp))}
                  </div>
                </div>
                <div style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: '10px', padding: '10px 14px' }}>
                  <div style={{ fontSize: '10px', fontFamily: 'DM Mono', color: 'var(--muted)', textTransform: 'uppercase' }}>Harga Jual</div>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--accent)', fontFamily: 'DM Mono', marginTop: '2px' }}>
                    {fmtRp(Math.round(activeJual))}
                  </div>
                </div>
                <div style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: '10px', padding: '10px 14px' }}>
                  <div style={{ fontSize: '10px', fontFamily: 'DM Mono', color: 'var(--muted)', textTransform: 'uppercase' }}>Margin</div>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: '#f5a623', fontFamily: 'DM Mono', marginTop: '2px' }}>
                    {activeMargin}%
                  </div>
                </div>
                <div style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: '10px', padding: '10px 14px' }}>
                  <div style={{ fontSize: '10px', fontFamily: 'DM Mono', color: 'var(--muted)', textTransform: 'uppercase' }}>Profit / pcs</div>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: '#4cc9a0', fontFamily: 'DM Mono', marginTop: '2px' }}>
                    +{fmtRp(Math.round(activeProfit))}
                  </div>
                </div>
              </div>

              {/* Supplier Info Card */}
              <div className="card" style={{ marginBottom: '12px', padding: '12px 14px' }}>
                <div style={{ fontSize: '10px', fontFamily: 'DM Mono', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '8px' }}>
                  🏭 Supplier & Vendor
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', fontSize: '12px' }}>
                  <div><span style={{ color: 'var(--muted)' }}>Nama: </span><strong>{activeProduct.supplier?.nama || '—'}</strong></div>
                  <div><span style={{ color: 'var(--muted)' }}>Kontak: </span><span>{activeProduct.supplier?.kontak || '—'}</span></div>
                  <div style={{ gridColumn: 'span 2' }}><span style={{ color: 'var(--muted)' }}>Alamat: </span><span>{activeProduct.supplier?.alamat || '—'}</span></div>
                  <div><span style={{ color: 'var(--muted)' }}>Ongkir ke Pratani: </span><span style={{ color: '#f5a623', fontWeight: 600 }}>{fmtRp(activeProduct.supplier?.ongkirKePratani || 0)}</span></div>
                  <div><span style={{ color: 'var(--muted)' }}>MOQ: </span><strong>{activeProduct.moq || 1} pcs</strong></div>
                  <div><span style={{ color: 'var(--muted)' }}>Harga Dasar/pcs: </span><strong style={{ color: 'var(--accent)' }}>{fmtRp(activeProduct.hargaDasar || 0)}</strong></div>
                  <div><span style={{ color: 'var(--muted)' }}>Ongkir/pcs: </span><span>{fmtRp(Math.round((activeProduct.supplier?.ongkirKePratani || 0) / (activeProduct.moq || 1)))}</span></div>
                </div>
                {activeProduct.catatan && (
                  <div style={{ marginTop: '8px', fontSize: '11px', color: 'var(--text2)', padding: '6px 10px', background: 'var(--surface2)', borderRadius: '6px', whiteSpace: 'pre-line' }}>
                    {activeProduct.catatan}
                  </div>
                )}
              </div>

              {/* MOQ Tiers Table */}
              <div className="card" style={{ marginBottom: '12px', padding: '12px 14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <div style={{ fontSize: '10px', fontFamily: 'DM Mono', textTransform: 'uppercase', color: 'var(--muted)' }}>
                    📦 Harga per Tier Qty
                  </div>
                  <button className="btn btn-ghost btn-sm" onClick={handleOpenMoqModal}>
                    ✏️ Edit Tier
                  </button>
                </div>

                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border)', background: 'rgba(46,156,255,0.04)' }}>
                        <th style={{ padding: '6px 10px', textAlign: 'left', fontSize: '10px', fontFamily: 'DM Mono', textTransform: 'uppercase', color: 'var(--muted)', fontWeight: 500 }}>Min. Qty</th>
                        <th style={{ padding: '6px 10px', textAlign: 'right', fontSize: '10px', fontFamily: 'DM Mono', textTransform: 'uppercase', color: 'var(--muted)', fontWeight: 500 }}>Harga Dasar</th>
                        <th style={{ padding: '6px 10px', textAlign: 'right', fontSize: '10px', fontFamily: 'DM Mono', textTransform: 'uppercase', color: 'var(--muted)', fontWeight: 500 }}>HPP/pcs</th>
                        <th style={{ padding: '6px 10px', textAlign: 'right', fontSize: '10px', fontFamily: 'DM Mono', textTransform: 'uppercase', color: 'var(--muted)', fontWeight: 500 }}>Harga Jual</th>
                        <th style={{ padding: '6px 10px', textAlign: 'right', fontSize: '10px', fontFamily: 'DM Mono', textTransform: 'uppercase', color: 'var(--muted)', fontWeight: 500 }}>Total MOQ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allTiers.map((t, i) => {
                        const ongkirPerPcs = (activeProduct.supplier?.ongkirKePratani || 0) / t.qty;
                        const komponenTotal = (activeProduct.komponenBiaya || []).reduce((s, k) => {
                          return s + (k.per === 'order' ? (Number(k.nominal) || 0) / t.qty : (Number(k.nominal) || 0));
                        }, 0);
                        const tierHpp = (t.hargaDasar || 0) + ongkirPerPcs + komponenTotal;
                        const tierJual = t.hargaJual || Math.ceil(tierHpp / (1 - (activeProduct.marginRekomendasi || 35) / 100) / 100) * 100;
                        const isFirst = i === 0;

                        return (
                          <tr
                            key={i}
                            style={{
                              borderBottom: '1px solid var(--border)',
                              background: isFirst ? 'rgba(46,156,255,0.05)' : 'transparent'
                            }}
                          >
                            <td style={{ padding: '8px 10px', fontWeight: 600, color: isFirst ? 'var(--accent)' : 'var(--text)' }}>
                              {t.qty} pcs
                              {t.isBase && (
                                <span style={{ fontSize: '10px', background: 'rgba(46,156,255,0.15)', color: 'var(--accent)', padding: '1px 6px', borderRadius: '99px', marginLeft: '4px' }}>
                                  MOQ
                                </span>
                              )}
                            </td>
                            <td style={{ padding: '8px 10px', textAlign: 'right', fontFamily: 'DM Mono' }}>
                              {fmtRp(t.hargaDasar || 0)}
                            </td>
                            <td style={{ padding: '8px 10px', textAlign: 'right', fontFamily: 'DM Mono', color: '#4cc9a0' }}>
                              {fmtRp(Math.round(tierHpp))}
                            </td>
                            <td style={{ padding: '8px 10px', textAlign: 'right', fontFamily: 'DM Mono', color: 'var(--accent)', fontWeight: 600 }}>
                              {fmtRp(Math.round(tierJual))}
                            </td>
                            <td style={{ padding: '8px 10px', textAlign: 'right', fontFamily: 'DM Mono', color: 'var(--text2)' }}>
                              {fmtRp(Math.round(tierJual * t.qty))}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Komponen Biaya Card */}
              <div className="card" style={{ marginBottom: '12px', padding: '12px 14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <div style={{ fontSize: '10px', fontFamily: 'DM Mono', textTransform: 'uppercase', color: 'var(--muted)' }}>
                    📊 Komponen Biaya Tambahan
                  </div>
                  <button className="btn btn-ghost btn-sm" onClick={() => setIsKomponenModalOpen(true)}>
                    + Tambah Biaya
                  </button>
                </div>

                {(!activeProduct.komponenBiaya || activeProduct.komponenBiaya.length === 0) ? (
                  <div style={{ fontSize: '11px', color: 'var(--muted)', padding: '6px 0' }}>
                    Belum ada komponen biaya tambahan.
                  </div>
                ) : (
                  <div>
                    {activeProduct.komponenBiaya.map((k, i) => {
                      const perPcs = k.per === 'order' ? k.nominal / (activeProduct.moq || 1) : k.nominal;
                      return (
                        <div
                          key={i}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '7px 0',
                            borderBottom: '1px solid var(--border)'
                          }}
                        >
                          <div style={{ fontSize: '12px', color: 'var(--text)' }}>
                            {k.nama}{' '}
                            <span style={{ fontSize: '10px', color: 'var(--muted)' }}>
                              ({k.per === 'order' ? 'per order ÷ MOQ' : 'per pcs'})
                            </span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontFamily: 'DM Mono', fontSize: '12px', color: '#f5a623' }}>
                              {fmtRp(k.nominal)}{k.per === 'order' ? '/order' : '/pcs'}
                            </span>
                            <span style={{ fontFamily: 'DM Mono', fontSize: '11px', color: 'var(--muted)' }}>
                              = {fmtRp(Math.round(perPcs))}/pcs
                            </span>
                            <button
                              className="btn btn-danger btn-sm"
                              style={{ padding: '2px 6px', fontSize: '10px' }}
                              onClick={() => handleDeleteKomponen(i)}
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal Add / Edit Product */}
      {isProductModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsProductModalOpen(false)}>
          <div className="modal" style={{ maxWidth: '520px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">{editingProduct ? '✏️ Edit Produk' : '🛍️ Tambah Produk Baru'}</div>
              <button className="modal-close" onClick={() => setIsProductModalOpen(false)}>✕</button>
            </div>

            <form onSubmit={handleSaveProductSubmit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div className="form-group">
                  <div className="form-label">Nama Produk *</div>
                  <input
                    className="form-input"
                    required
                    placeholder="Contoh: T-Shirt Combed 24s Sablon Plastisol"
                    value={formProduct.nama || ''}
                    onChange={(e) => setFormProduct({ ...formProduct, nama: e.target.value })}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div className="form-group">
                    <div className="form-label">Kategori</div>
                    <select
                      className="form-select"
                      value={formProduct.kategori || 'Apparel'}
                      onChange={(e) => setFormProduct({ ...formProduct, kategori: e.target.value })}
                    >
                      {PRODUK_KATEGORI.map((k) => (
                        <option key={k} value={k}>{k}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <div className="form-label">MOQ (Min. Order)</div>
                    <input
                      className="form-input"
                      type="number"
                      min="1"
                      value={formProduct.moq || 1}
                      onChange={(e) => setFormProduct({ ...formProduct, moq: Number(e.target.value) || 1 })}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div className="form-group">
                    <div className="form-label">Harga Dasar / pcs (Rp)</div>
                    <input
                      className="form-input"
                      type="number"
                      placeholder="0"
                      value={formProduct.hargaDasar || ''}
                      onChange={(e) => setFormProduct({ ...formProduct, hargaDasar: Number(e.target.value) || 0 })}
                    />
                  </div>

                  <div className="form-group">
                    <div className="form-label">Rekomendasi Margin (%)</div>
                    <input
                      className="form-input"
                      type="number"
                      min="1"
                      max="99"
                      value={formProduct.marginRekomendasi || 35}
                      onChange={(e) => setFormProduct({ ...formProduct, marginRekomendasi: Number(e.target.value) || 35 })}
                    />
                  </div>
                </div>

                {/* Supplier Fields */}
                <div style={{ background: 'var(--surface2)', borderRadius: '8px', padding: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase' }}>
                    Informasi Supplier
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <div className="form-group">
                      <div className="form-label">Nama Supplier</div>
                      <input
                        className="form-input"
                        placeholder="Nama vendor / pabrik"
                        value={formProduct.supplier?.nama || ''}
                        onChange={(e) => setFormProduct({
                          ...formProduct,
                          supplier: { ...formProduct.supplier, nama: e.target.value }
                        })}
                      />
                    </div>
                    <div className="form-group">
                      <div className="form-label">Kontak / HP</div>
                      <input
                        className="form-input"
                        placeholder="08xx-xxxx"
                        value={formProduct.supplier?.kontak || ''}
                        onChange={(e) => setFormProduct({
                          ...formProduct,
                          supplier: { ...formProduct.supplier, kontak: e.target.value }
                        })}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <div className="form-group">
                      <div className="form-label">Kota / Alamat</div>
                      <input
                        className="form-input"
                        placeholder="Bandung, Purwokerto..."
                        value={formProduct.supplier?.alamat || ''}
                        onChange={(e) => setFormProduct({
                          ...formProduct,
                          supplier: { ...formProduct.supplier, alamat: e.target.value }
                        })}
                      />
                    </div>
                    <div className="form-group">
                      <div className="form-label">Ongkir ke Pratani (Rp)</div>
                      <input
                        className="form-input"
                        type="number"
                        placeholder="0"
                        value={formProduct.supplier?.ongkirKePratani || ''}
                        onChange={(e) => setFormProduct({
                          ...formProduct,
                          supplier: { ...formProduct.supplier, ongkirKePratani: Number(e.target.value) || 0 }
                        })}
                      />
                    </div>
                  </div>
                </div>

                <div className="form-group">
                  <div className="form-label">Catatan Spesifikasi</div>
                  <textarea
                    className="form-textarea"
                    rows={2}
                    placeholder="Bahan, gramasi, teknik sablon, packaging..."
                    value={formProduct.catatan || ''}
                    onChange={(e) => setFormProduct({ ...formProduct, catatan: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button type="button" className="btn btn-ghost" onClick={() => setIsProductModalOpen(false)}>
                  Batal
                </button>
                <button type="submit" className="btn btn-primary">
                  💾 Simpan Produk
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Edit MOQ Tiers */}
      {isMoqModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsMoqModalOpen(false)}>
          <div className="modal" style={{ maxWidth: '500px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">📦 Edit Tier MOQ — {activeProduct?.nama}</div>
              <button className="modal-close" onClick={() => setIsMoqModalOpen(false)}>✕</button>
            </div>

            <div className="modal-body">
              <div style={{ fontSize: '11px', color: 'var(--muted)', marginBottom: '10px' }}>
                Tier pertama (MOQ dasar {activeProduct?.moq} pcs) diatur di form produk utama. Tambahkan tier volume lebih besar di bawah:
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
                {editingTiers.map((t, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: '10px', color: 'var(--muted)' }}>Min Qty (pcs)</label>
                      <input
                        className="form-input"
                        type="number"
                        min="1"
                        value={t.qty}
                        onChange={(e) => {
                          const updated = [...editingTiers];
                          updated[idx].qty = Number(e.target.value) || 1;
                          setEditingTiers(updated);
                        }}
                      />
                    </div>
                    <div style={{ flex: 1.5 }}>
                      <label style={{ fontSize: '10px', color: 'var(--muted)' }}>Harga Dasar Vendor (Rp)</label>
                      <input
                        className="form-input"
                        type="number"
                        value={t.hargaDasar}
                        onChange={(e) => {
                          const updated = [...editingTiers];
                          updated[idx].hargaDasar = Number(e.target.value) || 0;
                          setEditingTiers(updated);
                        }}
                      />
                    </div>
                    <button
                      type="button"
                      className="btn btn-danger btn-sm"
                      style={{ marginTop: '16px' }}
                      onClick={() => handleRemoveTierRow(idx)}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>

              <button type="button" className="btn btn-ghost btn-sm" onClick={handleAddTierRow}>
                + Tambah Tier Volume
              </button>
            </div>

            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button type="button" className="btn btn-ghost" onClick={() => setIsMoqModalOpen(false)}>
                Batal
              </button>
              <button type="button" className="btn btn-primary" onClick={handleSaveMoqTiers}>
                💾 Simpan Tier
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Add Komponen Biaya */}
      {isKomponenModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsKomponenModalOpen(false)}>
          <div className="modal" style={{ maxWidth: '400px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">+ Komponen Biaya Tambahan</div>
              <button className="modal-close" onClick={() => setIsKomponenModalOpen(false)}>✕</button>
            </div>

            <form onSubmit={handleAddKomponen}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div className="form-group">
                  <div className="form-label">Nama Komponen *</div>
                  <input
                    className="form-input"
                    required
                    placeholder="Contoh: Hangtag, Plastik Klip, Bordir, dll"
                    value={komponenData.nama}
                    onChange={(e) => setKomponenData({ ...komponenData, nama: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <div className="form-label">Nominal (Rp)</div>
                  <input
                    className="form-input"
                    type="number"
                    required
                    placeholder="0"
                    value={komponenData.nominal || ''}
                    onChange={(e) => setKomponenData({ ...komponenData, nominal: Number(e.target.value) || 0 })}
                  />
                </div>

                <div className="form-group">
                  <div className="form-label">Dihitung per</div>
                  <select
                    className="form-select"
                    value={komponenData.per}
                    onChange={(e) => setKomponenData({ ...komponenData, per: e.target.value as 'pcs' | 'order' })}
                  >
                    <option value="order">Per Order (dibagi MOQ pcs)</option>
                    <option value="pcs">Per Unit Langsung (pcs)</option>
                  </select>
                </div>
              </div>

              <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button type="button" className="btn btn-ghost" onClick={() => setIsKomponenModalOpen(false)}>
                  Batal
                </button>
                <button type="submit" className="btn btn-primary">
                  💾 Tambahkan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Bulk Import JSON */}
      {isImportModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsImportModalOpen(false)}>
          <div className="modal" style={{ maxWidth: '580px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">📥 Bulk Import Produk (JSON)</div>
              <button className="modal-close" onClick={() => setIsImportModalOpen(false)}>✕</button>
            </div>

            <div className="modal-body">
              <div style={{ fontSize: '11px', color: 'var(--muted)', marginBottom: '8px' }}>
                Paste data array JSON dari <code>#DATA/produk.json</code> atau hasil export spreadsheet:
              </div>
              <textarea
                className="form-textarea"
                rows={10}
                style={{ fontFamily: 'DM Mono', fontSize: '11px' }}
                placeholder='[{"nama": "Kaos Polos", "kategori": "Apparel", "hargaDasar": 35000, "moq": 24}]'
                value={importJsonText}
                onChange={(e) => setImportJsonText(e.target.value)}
              />
            </div>

            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button type="button" className="btn btn-ghost" onClick={() => setIsImportModalOpen(false)}>
                Batal
              </button>
              <button type="button" className="btn btn-primary" onClick={handleBulkImportSubmit}>
                🚀 Import Data
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
