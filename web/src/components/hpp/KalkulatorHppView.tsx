import React, { useState, useMemo } from 'react';
import type { BrandId, ProdukKolektivaItem } from '../../types';
import { fmtRp } from '../../lib/keuanganUtils';
import { BRAND_LABEL } from '../../lib/contentPlanUtils';

interface ExtraCostItem {
  id: number;
  label: string;
  value: number;
}

interface KalkulatorHppViewProps {
  activeBrand: BrandId;
  onBrandChange: (brand: BrandId) => void;
  produkList?: ProdukKolektivaItem[];
  selectedProdukId?: number | string | null;
  onClearSelectedProduk?: () => void;
  onSaveHppToProduk?: (produkId: number | string, hppData: { totalHpp: number; hargaDasar: number }) => Promise<void>;
}

const HPP_MARGINS: Record<string, Record<'kompetitif' | 'standar' | 'premium', { min: number; max: number }> | null> = {
  kolektiva: {
    kompetitif: { min: 20, max: 28 },
    standar: { min: 30, max: 40 },
    premium: { min: 45, max: 60 },
  },
  dikopi: {
    kompetitif: { min: 50, max: 60 },
    standar: { min: 65, max: 72 },
    premium: { min: 75, max: 80 },
  },
  imagineer: null,
  snm: null,
  pratani: null,
};

export const KalkulatorHppView: React.FC<KalkulatorHppViewProps> = ({
  activeBrand,
  onBrandChange,
  produkList = [],
  selectedProdukId = null,
  onClearSelectedProduk,
  onSaveHppToProduk
}) => {
  const [currentBrand, setCurrentBrand] = useState<BrandId>(
    activeBrand === 'pratani' ? 'kolektiva' : activeBrand
  );
  const [priceMode, setPriceMode] = useState<'margin' | 'markup'>('margin');

  // Biaya per unit
  const [bahan, setBahan] = useState<number>(0);
  const [kemasan, setKemasan] = useState<number>(0);
  const [extraUnit, setExtraUnit] = useState<ExtraCostItem[]>([]);

  // Biaya per projek
  const [ongkir, setOngkir] = useState<number>(0);
  const [desain, setDesain] = useState<number>(0);
  const [marketing, setMarketing] = useState<number>(0);
  const [cashback, setCashback] = useState<number>(0);
  const [extraProj, setExtraProj] = useState<ExtraCostItem[]>([]);

  // Parameter
  const [qty, setQty] = useState<number>(1);
  const [pajak, setPajak] = useState<number>(0);

  // Selected product banner
  const activeProduct = useMemo(() => {
    if (!selectedProdukId) return null;
    return produkList.find((p) => String(p.id) === String(selectedProdukId)) || null;
  }, [selectedProdukId, produkList]);

  // Calculations
  const totalExtraUnit = useMemo(() => {
    return extraUnit.reduce((sum, item) => sum + (Number(item.value) || 0), 0);
  }, [extraUnit]);

  const totalPerUnit = useMemo(() => {
    return (Number(bahan) || 0) + (Number(kemasan) || 0) + totalExtraUnit;
  }, [bahan, kemasan, totalExtraUnit]);

  const totalExtraProj = useMemo(() => {
    return extraProj.reduce((sum, item) => sum + (Number(item.value) || 0), 0);
  }, [extraProj]);

  const totalPerProj = useMemo(() => {
    return (
      (Number(ongkir) || 0) +
      (Number(desain) || 0) +
      (Number(marketing) || 0) +
      (Number(cashback) || 0) +
      totalExtraProj
    );
  }, [ongkir, desain, marketing, cashback, totalExtraProj]);

  const safeQty = Math.max(1, Number(qty) || 1);
  const projPerUnit = totalPerProj / safeQty;
  const hppPerUnit = totalPerUnit + projPerUnit;
  const totalModal = totalPerUnit * safeQty + totalPerProj;

  // Add / remove extra item
  const handleAddExtra = (type: 'unit' | 'proj') => {
    const newItem: ExtraCostItem = {
      id: Date.now() + Math.floor(Math.random() * 1000),
      label: '',
      value: 0
    };
    if (type === 'unit') {
      setExtraUnit([...extraUnit, newItem]);
    } else {
      setExtraProj([...extraProj, newItem]);
    }
  };

  const handleUpdateExtra = (type: 'unit' | 'proj', id: number, field: 'label' | 'value', val: any) => {
    if (type === 'unit') {
      setExtraUnit(extraUnit.map((e) => (e.id === id ? { ...e, [field]: val } : e)));
    } else {
      setExtraProj(extraProj.map((e) => (e.id === id ? { ...e, [field]: val } : e)));
    }
  };

  const handleRemoveExtra = (type: 'unit' | 'proj', id: number) => {
    if (type === 'unit') {
      setExtraUnit(extraUnit.filter((e) => e.id !== id));
    } else {
      setExtraProj(extraProj.filter((e) => e.id !== id));
    }
  };

  const handleReset = () => {
    setBahan(0);
    setKemasan(0);
    setExtraUnit([]);
    setOngkir(0);
    setDesain(0);
    setMarketing(0);
    setCashback(0);
    setExtraProj([]);
    setQty(1);
    setPajak(0);
  };

  // Price calculations
  const calculateHargaJual = (pct: number) => {
    const base = priceMode === 'margin'
      ? hppPerUnit / (1 - pct / 100)
      : hppPerUnit * (1 + pct / 100);
    return base * (1 + (Number(pajak) || 0) / 100);
  };

  const getActualMargin = (hj: number) => {
    const hjPreTax = hj / (1 + (Number(pajak) || 0) / 100);
    if (hjPreTax <= 0) return '0.0';
    return (((hjPreTax - hppPerUnit) / hjPreTax) * 100).toFixed(1);
  };

  const getActualMarkup = (hj: number) => {
    const hjPreTax = hj / (1 + (Number(pajak) || 0) / 100);
    if (hppPerUnit <= 0) return '0.0';
    return (((hjPreTax - hppPerUnit) / hppPerUnit) * 100).toFixed(1);
  };

  const margins = HPP_MARGINS[currentBrand];

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '40px' }}>
      {/* Banner if launched from Produk Kolektiva */}
      {activeProduct && (
        <div
          style={{
            background: 'linear-gradient(90deg, rgba(139,111,255,0.12), rgba(46,156,255,0.08))',
            border: '1px solid rgba(139,111,255,0.3)',
            borderRadius: '12px',
            padding: '12px 16px',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '8px'
          }}
        >
          <div>
            <div style={{ fontSize: '12px', color: '#8b6fff', fontWeight: 600, marginBottom: '2px' }}>
              📊 Menghitung HPP untuk produk Kolektiva
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text2)' }}>
              {activeProduct.nama} · MOQ {activeProduct.moq || 1} pcs · Harga dasar {fmtRp(activeProduct.hargaDasar || 0)}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn btn-ghost btn-sm" onClick={onClearSelectedProduk}>
              Batalkan
            </button>
            <button
              className="btn btn-primary btn-sm"
              style={{ background: '#8b6fff', borderColor: '#8b6fff' }}
              onClick={async () => {
                if (onSaveHppToProduk && activeProduct.id) {
                  await onSaveHppToProduk(activeProduct.id, {
                    totalHpp: Math.round(hppPerUnit),
                    hargaDasar: Math.round(totalPerUnit)
                  });
                }
              }}
            >
              💾 Simpan ke Produk
            </button>
          </div>
        </div>
      )}

      {/* Brand Tabs */}
      <div className="filter-row" style={{ marginBottom: '16px' }}>
        <button
          className={`filter-btn ${currentBrand === 'dikopi' ? 'active' : ''}`}
          onClick={() => {
            setCurrentBrand('dikopi');
            onBrandChange('dikopi');
          }}
        >
          ☕ Dikopi F&B
        </button>
        <button
          className={`filter-btn ${currentBrand === 'kolektiva' ? 'active' : ''}`}
          onClick={() => {
            setCurrentBrand('kolektiva');
            onBrandChange('kolektiva');
          }}
        >
          🛍️ Kolektiva
        </button>
        <button
          className={`filter-btn ${currentBrand === 'imagineer' ? 'active' : ''}`}
          onClick={() => {
            setCurrentBrand('imagineer');
            onBrandChange('imagineer');
          }}
        >
          ✨ Imagineer
        </button>
      </div>

      {/* Main 2-Column HPP Layout */}
      <div className="hpp-layout">
        {/* Left Column: Cost Inputs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Card 1: Biaya Per Produk (Unit Langsung) */}
          <div className="hpp-form-card">
            <div className="hpp-form-title">
              🧱 Biaya Per Produk
              <span style={{ fontSize: '10px', color: 'var(--muted)', fontWeight: 400, fontFamily: 'DM Mono' }}>
                {' '}— per 1 unit
              </span>
            </div>

            <div className="hpp-field">
              <label className="hpp-field-label">Bahan Baku Pokok</label>
              <input
                className="form-input hpp-field-input"
                type="number"
                placeholder="0"
                value={bahan || ''}
                onChange={(e) => setBahan(Number(e.target.value) || 0)}
              />
              <span className="hpp-field-unit">Rp</span>
              <span style={{ width: '18px' }}></span>
            </div>

            <div className="hpp-field">
              <label className="hpp-field-label">Kemasan</label>
              <input
                className="form-input hpp-field-input"
                type="number"
                placeholder="0"
                value={kemasan || ''}
                onChange={(e) => setKemasan(Number(e.target.value) || 0)}
              />
              <span className="hpp-field-unit">Rp</span>
              <span style={{ width: '18px' }}></span>
            </div>

            {/* Extras Unit */}
            {extraUnit.map((e) => (
              <div key={e.id} className="hpp-field">
                <input
                  className="form-input hpp-field-label"
                  placeholder="Nama biaya..."
                  style={{ flex: 1, fontSize: '12px' }}
                  value={e.label}
                  onChange={(evt) => handleUpdateExtra('unit', e.id, 'label', evt.target.value)}
                />
                <input
                  className="form-input hpp-field-input"
                  type="number"
                  placeholder="0"
                  value={e.value || ''}
                  onChange={(evt) => handleUpdateExtra('unit', e.id, 'value', Number(evt.target.value) || 0)}
                />
                <span className="hpp-field-unit">Rp</span>
                <button className="hpp-field-remove" onClick={() => handleRemoveExtra('unit', e.id)}>
                  ✕
                </button>
              </div>
            ))}

            <button className="hpp-field-add" onClick={() => handleAddExtra('unit')}>
              + Tambah Komponen Lain
            </button>
          </div>

          {/* Card 2: Biaya Per Projek (Dibagi Qty) */}
          <div className="hpp-form-card">
            <div className="hpp-form-title">
              📦 Biaya Per Projek
              <span style={{ fontSize: '10px', color: 'var(--muted)', fontWeight: 400, fontFamily: 'DM Mono' }}>
                {' '}— dibagi jumlah unit
              </span>
            </div>

            <div className="hpp-field">
              <label className="hpp-field-label">Ongkir</label>
              <input
                className="form-input hpp-field-input"
                type="number"
                placeholder="0"
                value={ongkir || ''}
                onChange={(e) => setOngkir(Number(e.target.value) || 0)}
              />
              <span className="hpp-field-unit">Rp</span>
              <span style={{ width: '18px' }}></span>
            </div>

            <div className="hpp-field">
              <label className="hpp-field-label">Desain</label>
              <input
                className="form-input hpp-field-input"
                type="number"
                placeholder="0"
                value={desain || ''}
                onChange={(e) => setDesain(Number(e.target.value) || 0)}
              />
              <span className="hpp-field-unit">Rp</span>
              <span style={{ width: '18px' }}></span>
            </div>

            <div className="hpp-field">
              <label className="hpp-field-label">Marketing</label>
              <input
                className="form-input hpp-field-input"
                type="number"
                placeholder="0"
                value={marketing || ''}
                onChange={(e) => setMarketing(Number(e.target.value) || 0)}
              />
              <span className="hpp-field-unit">Rp</span>
              <span style={{ width: '18px' }}></span>
            </div>

            <div className="hpp-field">
              <label className="hpp-field-label">Cashback</label>
              <input
                className="form-input hpp-field-input"
                type="number"
                placeholder="0"
                value={cashback || ''}
                onChange={(e) => setCashback(Number(e.target.value) || 0)}
              />
              <span className="hpp-field-unit">Rp</span>
              <span style={{ width: '18px' }}></span>
            </div>

            {/* Extras Proj */}
            {extraProj.map((e) => (
              <div key={e.id} className="hpp-field">
                <input
                  className="form-input hpp-field-label"
                  placeholder="Nama biaya..."
                  style={{ flex: 1, fontSize: '12px' }}
                  value={e.label}
                  onChange={(evt) => handleUpdateExtra('proj', e.id, 'label', evt.target.value)}
                />
                <input
                  className="form-input hpp-field-input"
                  type="number"
                  placeholder="0"
                  value={e.value || ''}
                  onChange={(evt) => handleUpdateExtra('proj', e.id, 'value', Number(evt.target.value) || 0)}
                />
                <span className="hpp-field-unit">Rp</span>
                <button className="hpp-field-remove" onClick={() => handleRemoveExtra('proj', e.id)}>
                  ✕
                </button>
              </div>
            ))}

            <button className="hpp-field-add" onClick={() => handleAddExtra('proj')}>
              + Tambah Komponen Lain
            </button>

            <div className="hpp-divider"></div>

            <div className="hpp-field">
              <label className="hpp-field-label" style={{ fontWeight: 600 }}>
                Jumlah Produksi
                <span style={{ fontSize: '10px', color: 'var(--muted)', fontWeight: 400 }}>
                  {' '}— untuk membagi biaya projek
                </span>
              </label>
              <input
                className="form-input hpp-field-input"
                type="number"
                min="1"
                placeholder="1"
                value={qty}
                onChange={(e) => setQty(Math.max(1, Number(e.target.value) || 1))}
              />
              <span className="hpp-field-unit">pcs</span>
              <span style={{ width: '18px' }}></span>
            </div>

            <div className="hpp-field">
              <label className="hpp-field-label" style={{ color: 'var(--muted)' }}>
                Pajak / PPN <span style={{ fontSize: '10px' }}>(opsional)</span>
              </label>
              <input
                className="form-input hpp-field-input"
                type="number"
                min="0"
                max="100"
                placeholder="0"
                value={pajak || ''}
                onChange={(e) => setPajak(Number(e.target.value) || 0)}
              />
              <span className="hpp-field-unit">%</span>
              <span style={{ width: '18px' }}></span>
            </div>
            <div className="hpp-tax-note">Pajak dihitung di atas harga jual</div>
          </div>

          {/* Modal Summary Strip */}
          <div style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: '12px', padding: '14px 18px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '12px' }}>
              <div>
                <div style={{ fontSize: '10px', fontFamily: 'DM Mono', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--muted)', marginBottom: '4px' }}>
                  Biaya/unit
                </div>
                <div style={{ fontSize: '13px', fontWeight: 600, fontFamily: 'DM Mono' }}>
                  {totalPerUnit > 0 ? fmtRp(Math.round(totalPerUnit)) : '—'}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '10px', fontFamily: 'DM Mono', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--muted)', marginBottom: '4px' }}>
                  Projek/unit
                </div>
                <div style={{ fontSize: '13px', fontWeight: 600, fontFamily: 'DM Mono' }}>
                  {projPerUnit > 0 ? `${fmtRp(Math.round(projPerUnit))} (÷${safeQty})` : '—'}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '10px', fontFamily: 'DM Mono', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--muted)', marginBottom: '4px' }}>
                  Total Modal
                </div>
                <div style={{ fontSize: '13px', fontWeight: 600, fontFamily: 'DM Mono' }}>
                  {safeQty > 1 ? fmtRp(Math.round(totalModal)) : '—'}
                </div>
              </div>
            </div>

            <div className="hpp-total-row" style={{ paddingTop: '8px', borderTop: '1px solid var(--border)' }}>
              <span className="hpp-total-label">💰 HPP per Unit</span>
              <span className="hpp-total-val">{fmtRp(Math.round(hppPerUnit))}</span>
            </div>

            <button className="btn btn-ghost btn-sm" style={{ width: '100%', marginTop: '10px' }} onClick={handleReset}>
              🔄 Reset Form
            </button>
          </div>
        </div>

        {/* Right Column: Recommendations */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ fontSize: '13px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
              🏷️ Rekomendasi Harga Jual
              <span style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: 400 }}>
                — {BRAND_LABEL[currentBrand] || currentBrand}
              </span>
            </div>

            {/* Mode Switcher */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '11px', color: 'var(--muted)' }}>Mode:</span>
              <div style={{ display: 'flex', border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden' }}>
                <button
                  onClick={() => setPriceMode('margin')}
                  style={{
                    padding: '5px 12px',
                    fontSize: '11px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                    fontFamily: 'inherit',
                    border: 'none',
                    background: priceMode === 'margin' ? 'var(--accent)' : 'none',
                    color: priceMode === 'margin' ? '#fff' : 'var(--muted)'
                  }}
                >
                  Margin
                </button>
                <button
                  onClick={() => setPriceMode('markup')}
                  style={{
                    padding: '5px 12px',
                    fontSize: '11px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                    fontFamily: 'inherit',
                    border: 'none',
                    background: priceMode === 'markup' ? 'var(--accent)' : 'none',
                    color: priceMode === 'markup' ? '#fff' : 'var(--muted)',
                    borderLeft: '1px solid var(--border)'
                  }}
                >
                  Markup
                </button>
              </div>
            </div>
          </div>

          {/* Explainer Pill */}
          <div
            style={{
              fontSize: '11px',
              color: 'var(--muted)',
              background: 'var(--surface2)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              padding: '8px 12px',
              marginBottom: '12px',
              lineHeight: 1.7
            }}
          >
            {priceMode === 'margin' ? (
              <>
                <strong style={{ color: 'var(--accent)' }}>Margin-based</strong> aktif —{' '}
                <span>Harga Jual = HPP ÷ (1 − margin%)</span>
                <br />
                <span style={{ fontSize: '10px' }}>
                  Contoh: HPP 10.000, margin 30% → Rp 14.286 (margin lebih besar dari markup yang sama)
                </span>
              </>
            ) : (
              <>
                <strong style={{ color: 'var(--accent)' }}>Markup-based</strong> aktif —{' '}
                <span>Harga Jual = HPP × (1 + markup%)</span>
                <br />
                <span style={{ fontSize: '10px' }}>
                  Contoh: HPP 10.000, markup 30% → Rp 13.000 (markup selalu lebih kecil dari margin yang sama)
                </span>
              </>
            )}
          </div>

          {/* Results Cards */}
          <div className="hpp-results">
            {!margins ? (
              <div className="hpp-no-margin">
                <div style={{ fontSize: '20px', marginBottom: '6px' }}>⚙️</div>
                Standar margin untuk <strong>{BRAND_LABEL[currentBrand]}</strong> belum diset.
                <br />
                <span style={{ fontSize: '11px' }}>Akan ditambahkan di update berikutnya.</span>
              </div>
            ) : hppPerUnit <= 0 ? (
              <div className="hpp-empty-result">
                <div style={{ fontSize: '28px', marginBottom: '8px' }}>🧮</div>
                Isi form modal untuk melihat rekomendasi harga
              </div>
            ) : (
              (['kompetitif', 'standar', 'premium'] as const).map((tier) => {
                const m = margins[tier];
                const hMin = calculateHargaJual(m.min);
                const hMax = calculateHargaJual(m.max);
                const hMid = calculateHargaJual((m.min + m.max) / 2);

                const renderPriceItem = (label: string, hj: number) => {
                  const profit = hj / (1 + (Number(pajak) || 0) / 100) - hppPerUnit;
                  const mPct = getActualMargin(hj);
                  const mkPct = getActualMarkup(hj);

                  return (
                    <div className="hpp-price-item">
                      <div className="hpp-price-sublabel">{label}</div>
                      <div className={`hpp-price-val ${tier}`}>{fmtRp(Math.round(hj))}</div>
                      <div className="hpp-price-margin" style={{ marginTop: '5px', lineHeight: 1.8 }}>
                        <span style={{ display: 'block', color: '#4cc9a0' }}>
                          +{fmtRp(Math.round(profit))}/unit
                        </span>
                        <span style={{ display: 'block', color: 'var(--accent)', fontSize: '10px' }}>
                          Margin {mPct}%
                        </span>
                        <span style={{ display: 'block', color: 'var(--muted)', fontSize: '10px' }}>
                          Markup {mkPct}%
                        </span>
                      </div>
                    </div>
                  );
                };

                return (
                  <div key={tier} className={`hpp-result-card ${tier}`}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '4px', flexWrap: 'wrap', gap: '6px' }}>
                      <div className={`hpp-card-tier ${tier}`}>
                        {tier.charAt(0).toUpperCase() + tier.slice(1)}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <span style={{ fontSize: '9px', fontFamily: 'DM Mono', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '2px 7px', borderRadius: '99px', background: 'rgba(77,158,247,0.12)', color: 'var(--accent)' }}>
                          {priceMode === 'margin' ? 'Margin-based' : 'Markup-based'}
                        </span>
                        {pajak > 0 && (
                          <span style={{ fontSize: '9px', fontFamily: 'DM Mono', color: 'var(--muted)' }}>
                            +PPN {pajak}%
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="hpp-card-range" style={{ marginBottom: '12px' }}>
                      Range {m.min}%–{m.max}% ·{' '}
                      <span style={{ color: 'var(--muted)', fontSize: '10px' }}>
                        {priceMode === 'margin' ? '% dihitung dari harga jual' : '% dihitung dari HPP'}
                      </span>
                    </div>

                    <div className="hpp-card-prices">
                      {renderPriceItem('Harga Min', hMin)}
                      {renderPriceItem('Harga Max', hMax)}
                      {renderPriceItem('Mid Point', hMid)}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
