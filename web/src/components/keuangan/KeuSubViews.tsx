import React, { useState, useMemo } from 'react';
import type { KeuData, AsetItem, HutangItem, BrandId } from '../../types';
import { fmtRp, autoSlashDate, toDisplayDate, toStorageDate, getBulanLabel, getTxnClass, keuCalc } from '../../lib/keuanganUtils';
import { fmtTanggal, BRAND_LABEL, BRAND_ICONS } from '../../lib/contentPlanUtils';

const KEU_BRANDS: BrandId[] = ['dikopi', 'kolektiva', 'imagineer'];
const KEU_BRAND_COLOR: Record<string, string> = {
  dikopi: 'var(--dikopi)',
  kolektiva: 'var(--kolektiva)',
  imagineer: 'var(--imagineer)'
};

// ============================================================
// 1. KEUANGAN DASHBOARD KONSOLIDASI (PT Pratani Kreatif Group)
// ============================================================
interface KeuDashboardViewProps {
  keuData: KeuData;
  asetList: AsetItem[];
}

export const KeuDashboardView: React.FC<KeuDashboardViewProps> = ({ keuData, asetList }) => {
  const [periodeType, setPeriodeType] = useState<'bulan' | 'tahun'>('bulan');
  const [currentMonthKey] = useState(() => new Date().toISOString().substring(0, 7));
  const [currentYearKey] = useState(() => String(new Date().getFullYear()));

  const brandData = useMemo(() => {
    return KEU_BRANDS.map((b) => {
      const list = keuData[b] || [];
      const filtered = list.filter((t) => {
        if (!t.tanggal) return false;
        return periodeType === 'bulan'
          ? t.tanggal.startsWith(currentMonthKey)
          : t.tanggal.startsWith(currentYearKey);
      });
      return {
        brand: b,
        ...keuCalc(filtered)
      };
    });
  }, [keuData, periodeType, currentMonthKey, currentYearKey]);

  // Konsolidasi PT Total
  const pt = useMemo(() => {
    const res = { revenue: 0, hpp: 0, expense: 0, capital: 0, owner: 0, asset: 0, grossProfit: 0, netProfit: 0 };
    brandData.forEach((d) => {
      res.revenue += d.revenue;
      res.hpp += d.hpp;
      res.expense += d.expense;
      res.capital += d.capital;
      res.owner += d.owner;
      res.asset += d.asset;
      res.grossProfit += d.grossProfit;
      res.netProfit += d.netProfit;
    });
    return res;
  }, [brandData]);

  const pph = Math.round(pt.revenue * 0.005);
  const maxRev = Math.max(...brandData.map((d) => d.revenue), 1);

  // Dikopi owner details
  const dikopiTxns = (keuData.dikopi || []).filter((t) => t.tanggal && t.tanggal.startsWith(currentMonthKey));
  const totalModal = dikopiTxns.filter((t) => getTxnClass(t) === 'capital_injection').reduce((s, t) => s + Number(t.nominal || 0), 0);
  const totalPrive = dikopiTxns.filter((t) => getTxnClass(t) === 'owner_draw').reduce((s, t) => s + Number(t.nominal || 0), 0);
  const totalDistrib = dikopiTxns.filter((t) => getTxnClass(t) === 'profit_distribution').reduce((s, t) => s + Number(t.nominal || 0), 0);
  const nilaiAset = asetList.reduce((s, a) => s + Number(a.nominal || 0), 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Top Filter */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>
          📊 Dashboard Keuangan Konsolidasi
        </div>
        <div className="filter-row" style={{ marginBottom: 0 }}>
          <button
            type="button"
            className={`filter-btn ${periodeType === 'bulan' ? 'active' : ''}`}
            onClick={() => setPeriodeType('bulan')}
          >
            Bulan Ini ({getBulanLabel(currentMonthKey)})
          </button>
          <button
            type="button"
            className={`filter-btn ${periodeType === 'tahun' ? 'active' : ''}`}
            onClick={() => setPeriodeType('tahun')}
          >
            Tahun {currentYearKey}
          </button>
        </div>
      </div>

      {/* PT Consolidated Card */}
      <div className="keu-pt-card">
        <div className="keu-pt-title">🏢 PT Pratani Kreatif Group — Konsolidasi</div>
        <div className="keu-summary-grid">
          <div className="keu-card">
            <div className="keu-label">Total Revenue</div>
            <div className="keu-val keu-green">{fmtRp(pt.revenue)}</div>
          </div>
          <div className="keu-card">
            <div className="keu-label">Total HPP</div>
            <div className="keu-val keu-muted">{fmtRp(pt.hpp)}</div>
          </div>
          <div className="keu-card">
            <div className="keu-label">Gross Profit</div>
            <div className={`keu-val ${pt.grossProfit >= 0 ? 'keu-green' : 'keu-red'}`}>
              {fmtRp(pt.grossProfit)}
            </div>
          </div>
          <div className="keu-card">
            <div className="keu-label">Total Expense</div>
            <div className="keu-val keu-red">{fmtRp(pt.expense)}</div>
          </div>
          <div className="keu-card">
            <div className="keu-label">Net Profit</div>
            <div className={`keu-val ${pt.netProfit >= 0 ? 'keu-green' : 'keu-red'}`}>
              {fmtRp(pt.netProfit)}
            </div>
          </div>
          <div className="keu-card">
            <div className="keu-label">Est. PPh (0.5%)</div>
            <div className="keu-val" style={{ color: '#f5a623' }}>
              {fmtRp(pph)}
            </div>
          </div>
        </div>
        <div className="keu-pph-note">
          ⚖️ Estimasi PPh Final berdasarkan PP 55/2022 — 0.5% dari total bruto revenue
        </div>
      </div>

      {/* Revenue per brand comparison bars */}
      <div className="card" style={{ padding: '16px' }}>
        <div style={{ fontSize: '11px', fontFamily: 'DM Mono', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '12px' }}>
          Distribusi Revenue per Brand
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {brandData.map((d) => (
            <div key={d.brand} className="keu-bar-item">
              <div className="keu-bar-label" style={{ color: KEU_BRAND_COLOR[d.brand], width: '80px', fontWeight: 600 }}>
                {BRAND_LABEL[d.brand]}
              </div>
              <div className="keu-bar-track" style={{ flex: 1, background: 'var(--surface2)', height: '10px', borderRadius: '99px', overflow: 'hidden' }}>
                <div
                  className="keu-bar-fill"
                  style={{
                    width: `${maxRev > 0 ? Math.round((d.revenue / maxRev) * 100) : 0}%`,
                    background: KEU_BRAND_COLOR[d.brand],
                    height: '100%',
                    borderRadius: '99px'
                  }}
                />
              </div>
              <div className="keu-bar-val" style={{ width: '120px', textAlign: 'right', fontFamily: 'DM Mono', fontSize: '12px' }}>
                {fmtRp(d.revenue)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Per Brand Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '14px' }}>
        {brandData.map((d) => (
          <div key={d.brand} className="keu-brand-section">
            <div className="keu-brand-header">
              <div className="keu-brand-name" style={{ color: KEU_BRAND_COLOR[d.brand] }}>
                {BRAND_ICONS[d.brand]} {BRAND_LABEL[d.brand]}
              </div>
              <span style={{ fontSize: '11.5px', fontFamily: 'DM Mono', color: d.netProfit >= 0 ? '#4cc9a0' : 'var(--red)', fontWeight: 600 }}>
                Net: {fmtRp(d.netProfit)}
              </span>
            </div>
            <div className="keu-summary-grid" style={{ padding: '12px 16px' }}>
              <div className="keu-card">
                <div className="keu-label">Revenue</div>
                <div className="keu-val keu-green" style={{ fontSize: '13px' }}>{fmtRp(d.revenue)}</div>
              </div>
              <div className="keu-card">
                <div className="keu-label">HPP</div>
                <div className="keu-val keu-muted" style={{ fontSize: '13px' }}>{fmtRp(d.hpp)}</div>
              </div>
              <div className="keu-card">
                <div className="keu-label">Gross Profit</div>
                <div className={`keu-val ${d.grossProfit >= 0 ? 'keu-green' : 'keu-red'}`} style={{ fontSize: '13px' }}>
                  {fmtRp(d.grossProfit)}
                </div>
              </div>
              <div className="keu-card">
                <div className="keu-label">Expense</div>
                <div className="keu-val keu-red" style={{ fontSize: '13px' }}>{fmtRp(d.expense)}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Owner & Aset Card (Dikopi) */}
      <div className="card" style={{ padding: '14px 16px' }}>
        <div style={{ fontSize: '11px', fontFamily: 'DM Mono', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '12px' }}>
          👤 Owner & Aset — Dikopi ({getBulanLabel(currentMonthKey)})
        </div>
        <div className="keu-summary-grid">
          <div className="keu-card" style={{ borderColor: 'rgba(139,111,255,0.3)' }}>
            <div className="keu-label">Modal Owner</div>
            <div className="keu-val" style={{ color: '#8b6fff', fontSize: '15px' }}>{fmtRp(totalModal)}</div>
          </div>
          <div className="keu-card" style={{ borderColor: 'rgba(255,159,67,0.3)' }}>
            <div className="keu-label">Prive Bulan Ini</div>
            <div className="keu-val" style={{ color: '#ff9f43', fontSize: '15px' }}>{fmtRp(totalPrive)}</div>
          </div>
          <div className="keu-card" style={{ borderColor: 'rgba(192,57,43,0.3)' }}>
            <div className="keu-label">Distribusi Laba</div>
            <div className="keu-val" style={{ color: '#e74c3c', fontSize: '15px' }}>{fmtRp(totalDistrib)}</div>
          </div>
          <div className="keu-card" style={{ borderColor: 'rgba(139,111,255,0.3)' }}>
            <div className="keu-label">Nilai Aset Aktif</div>
            <div className="keu-val" style={{ color: '#8b6fff', fontSize: '15px' }}>{fmtRp(nilaiAset)}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================
// 2. REKAP BULANAN
// ============================================================
interface KeuRekapBulananViewProps {
  keuData: KeuData;
}

export const KeuRekapBulananView: React.FC<KeuRekapBulananViewProps> = ({ keuData }) => {
  const [defaultMonthKey] = useState(() => new Date().toISOString().substring(0, 7));

  const allMonths = useMemo(() => {
    const set = new Set<string>();
    KEU_BRANDS.forEach((b) => {
      (keuData[b] || []).forEach((t) => {
        if (t.tanggal) set.add(t.tanggal.substring(0, 7));
      });
    });
    set.add(defaultMonthKey);
    return Array.from(set).sort().reverse();
  }, [keuData, defaultMonthKey]);

  const [selectedMonth, setSelectedMonth] = useState<string>(() => allMonths[0] || defaultMonthKey);

  const brandRows = useMemo(() => {
    return KEU_BRANDS.map((b) => {
      const txns = (keuData[b] || []).filter((t) => t.tanggal && t.tanggal.startsWith(selectedMonth));
      const c = keuCalc(txns);
      return { brand: b, ...c };
    });
  }, [keuData, selectedMonth]);

  const ptTotal = useMemo(() => {
    const res = { revenue: 0, hpp: 0, grossProfit: 0, expense: 0, netProfit: 0 };
    brandRows.forEach((r) => {
      res.revenue += r.revenue;
      res.hpp += r.hpp;
      res.grossProfit += r.grossProfit;
      res.expense += r.expense;
      res.netProfit += r.netProfit;
    });
    return res;
  }, [brandRows]);

  const pph = Math.round(ptTotal.revenue * 0.005);

  const handlePrintPDF = () => {
    window.print();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
        <select
          className="form-select"
          style={{ width: 'auto', fontSize: '13px', padding: '6px 12px' }}
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
        >
          {allMonths.map((m) => (
            <option key={m} value={m}>{getBulanLabel(m)}</option>
          ))}
        </select>

        <button type="button" className="btn btn-primary btn-sm" onClick={handlePrintPDF}>
          ⬇ Cetak / Download PDF
        </button>
      </div>

      <div style={{ overflowX: 'auto', borderRadius: '10px', border: '1px solid var(--border)' }}>
        <table className="keu-rekap-table">
          <thead>
            <tr>
              <th>Brand</th>
              <th>Revenue</th>
              <th>HPP</th>
              <th>Gross Profit</th>
              <th>Expense</th>
              <th>Net Profit</th>
            </tr>
          </thead>
          <tbody>
            {brandRows.map((r) => (
              <tr key={r.brand}>
                <td style={{ color: KEU_BRAND_COLOR[r.brand], fontWeight: 600 }}>{BRAND_LABEL[r.brand]}</td>
                <td>{fmtRp(r.revenue)}</td>
                <td>{fmtRp(r.hpp)}</td>
                <td className={r.grossProfit >= 0 ? 'keu-green' : 'keu-red'}>{fmtRp(r.grossProfit)}</td>
                <td>{fmtRp(r.expense)}</td>
                <td style={{ fontWeight: 700, color: r.netProfit >= 0 ? '#4cc9a0' : 'var(--red)' }}>
                  {fmtRp(r.netProfit)}
                </td>
              </tr>
            ))}
            <tr className="total-row">
              <td>🏢 PT Total</td>
              <td>{fmtRp(ptTotal.revenue)}</td>
              <td>{fmtRp(ptTotal.hpp)}</td>
              <td style={{ color: ptTotal.grossProfit >= 0 ? '#4cc9a0' : 'var(--red)' }}>{fmtRp(ptTotal.grossProfit)}</td>
              <td>{fmtRp(ptTotal.expense)}</td>
              <td style={{ color: ptTotal.netProfit >= 0 ? '#4cc9a0' : 'var(--red)' }}>{fmtRp(ptTotal.netProfit)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="keu-pph-note">
        ⚖️ Estimasi PPh Final (PP 55/2022): <strong>{fmtRp(pph)}</strong> — 0.5% × Revenue PT {fmtRp(ptTotal.revenue)}
      </div>
    </div>
  );
};

// ============================================================
// 3. REKAP TAHUNAN
// ============================================================
interface KeuRekapTahunanViewProps {
  keuData: KeuData;
}

export const KeuRekapTahunanView: React.FC<KeuRekapTahunanViewProps> = ({ keuData }) => {
  const [defaultYearKey] = useState(() => String(new Date().getFullYear()));

  const allYears = useMemo(() => {
    const set = new Set<string>();
    KEU_BRANDS.forEach((b) => {
      (keuData[b] || []).forEach((t) => {
        if (t.tanggal) set.add(t.tanggal.substring(0, 4));
      });
    });
    set.add(defaultYearKey);
    return Array.from(set).sort().reverse();
  }, [keuData, defaultYearKey]);

  const [selectedYear, setSelectedYear] = useState<string>(() => allYears[0] || defaultYearKey);

  const BULAN_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  const months = Array.from({ length: 12 }, (_, i) => `${selectedYear}-${String(i + 1).padStart(2, '0')}`);

  const ptYearly = useMemo(() => {
    const res = { revenue: 0, hpp: 0, grossProfit: 0, expense: 0, netProfit: 0 };
    KEU_BRANDS.forEach((b) => {
      const txns = (keuData[b] || []).filter((t) => t.tanggal && t.tanggal.startsWith(selectedYear));
      const c = keuCalc(txns);
      res.revenue += c.revenue;
      res.hpp += c.hpp;
      res.grossProfit += c.grossProfit;
      res.expense += c.expense;
      res.netProfit += c.netProfit;
    });
    return res;
  }, [keuData, selectedYear]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
        <select
          className="form-select"
          style={{ width: 'auto', fontSize: '13px', padding: '6px 12px' }}
          value={selectedYear}
          onChange={(e) => setSelectedYear(e.target.value)}
        >
          {allYears.map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>

        <button type="button" className="btn btn-primary btn-sm" onClick={() => window.print()}>
          ⬇ Cetak / Download PDF
        </button>
      </div>

      {KEU_BRANDS.map((b) => {
        const brandTxns = (keuData[b] || []).filter((t) => t.tanggal && t.tanggal.startsWith(selectedYear));
        const totals = keuCalc(brandTxns);

        return (
          <div key={b} style={{ marginBottom: '16px' }}>
            <div style={{ fontWeight: 700, color: KEU_BRAND_COLOR[b], marginBottom: '8px', fontSize: '14px' }}>
              {BRAND_LABEL[b]}
            </div>
            <div style={{ overflowX: 'auto', borderRadius: '10px', border: '1px solid var(--border)' }}>
              <table className="keu-rekap-table">
                <thead>
                  <tr>
                    <th>Bulan</th>
                    <th>Revenue</th>
                    <th>HPP</th>
                    <th>Gross Profit</th>
                    <th>Expense</th>
                    <th>Net Profit</th>
                  </tr>
                </thead>
                <tbody>
                  {months.map((m, idx) => {
                    const mTxns = brandTxns.filter((t) => t.tanggal && t.tanggal.startsWith(m));
                    const c = keuCalc(mTxns);
                    const hasData = c.revenue || c.hpp || c.expense;
                    if (!hasData) return null;
                    return (
                      <tr key={m}>
                        <td style={{ color: 'var(--muted)' }}>{BULAN_SHORT[idx]}</td>
                        <td>{c.revenue ? fmtRp(c.revenue) : '—'}</td>
                        <td>{c.hpp ? fmtRp(c.hpp) : '—'}</td>
                        <td style={{ color: c.grossProfit >= 0 ? '#4cc9a0' : 'var(--red)' }}>
                          {c.grossProfit ? fmtRp(c.grossProfit) : '—'}
                        </td>
                        <td>{c.expense ? fmtRp(c.expense) : '—'}</td>
                        <td style={{ fontWeight: 600, color: c.netProfit >= 0 ? '#4cc9a0' : 'var(--red)' }}>
                          {c.netProfit ? fmtRp(c.netProfit) : '—'}
                        </td>
                      </tr>
                    );
                  })}
                  <tr className="total-row">
                    <td>Total {selectedYear}</td>
                    <td>{fmtRp(totals.revenue)}</td>
                    <td>{fmtRp(totals.hpp)}</td>
                    <td style={{ color: totals.grossProfit >= 0 ? '#4cc9a0' : 'var(--red)' }}>{fmtRp(totals.grossProfit)}</td>
                    <td>{fmtRp(totals.expense)}</td>
                    <td style={{ color: totals.netProfit >= 0 ? '#4cc9a0' : 'var(--red)' }}>{fmtRp(totals.netProfit)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        );
      })}

      <div className="keu-pt-card">
        <div className="keu-pt-title">🏢 Konsolidasi PT — {selectedYear}</div>
        <div className="keu-summary-grid">
          <div className="keu-card"><div className="keu-label">Revenue</div><div className="keu-val keu-green">{fmtRp(ptYearly.revenue)}</div></div>
          <div className="keu-card"><div className="keu-label">HPP</div><div className="keu-val keu-muted">{fmtRp(ptYearly.hpp)}</div></div>
          <div className="keu-card"><div className="keu-label">Gross Profit</div><div className={`keu-val ${ptYearly.grossProfit >= 0 ? 'keu-green' : 'keu-red'}`}>{fmtRp(ptYearly.grossProfit)}</div></div>
          <div className="keu-card"><div className="keu-label">Expense</div><div className="keu-val keu-red">{fmtRp(ptYearly.expense)}</div></div>
          <div className="keu-card"><div className="keu-label">Net Profit</div><div className={`keu-val ${ptYearly.netProfit >= 0 ? 'keu-green' : 'keu-red'}`}>{fmtRp(ptYearly.netProfit)}</div></div>
          <div className="keu-card"><div className="keu-label">Est. PPh</div><div className="keu-val" style={{ color: '#f5a623' }}>{fmtRp(Math.round(ptYearly.revenue * 0.005))}</div></div>
        </div>
      </div>
    </div>
  );
};

// ============================================================
// 4. DOKUMEN & NOTA GALLERY
// ============================================================
interface KeuNotaGalleryViewProps {
  keuData: KeuData;
}

export const KeuNotaGalleryView: React.FC<KeuNotaGalleryViewProps> = ({ keuData }) => {
  const [selectedBrand, setSelectedBrand] = useState<string>('all');
  const [previewItem, setPreviewItem] = useState<any | null>(null);

  const allNotas = useMemo(() => {
    const list: any[] = [];
    KEU_BRANDS.forEach((b) => {
      (keuData[b] || []).filter((t) => t.nota).forEach((t) => {
        list.push({ ...t, brand: b });
      });
    });
    return list.sort((a, b) => (b.tanggal || '').localeCompare(a.tanggal || ''));
  }, [keuData]);

  const filteredNotas = useMemo(() => {
    if (selectedBrand === 'all') return allNotas;
    return allNotas.filter((t) => t.brand === selectedBrand);
  }, [allNotas, selectedBrand]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ fontSize: '13px', color: 'var(--muted)' }}>
          {filteredNotas.length} nota tersimpan
        </div>
        <div className="filter-row" style={{ marginBottom: 0 }}>
          <button
            type="button"
            className={`filter-btn ${selectedBrand === 'all' ? 'active' : ''}`}
            onClick={() => setSelectedBrand('all')}
          >
            Semua
          </button>
          {KEU_BRANDS.map((b) => (
            <button
              key={b}
              type="button"
              className={`filter-btn ${selectedBrand === b ? 'active' : ''}`}
              onClick={() => setSelectedBrand(b)}
            >
              {BRAND_LABEL[b]}
            </button>
          ))}
        </div>
      </div>

      {filteredNotas.length === 0 ? (
        <div className="empty">
          <div className="empty-icon">🗂️</div>
          Belum ada nota yang diupload.<br />
          <span style={{ fontSize: '12px' }}>Upload nota saat mencatat pengeluaran di Buku Kas.</span>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '14px' }}>
          {filteredNotas.map((t) => {
            const isImg = t.nota_type?.startsWith('image') || t.nota?.startsWith('data:image');
            return (
              <div
                key={t.id}
                className="keu-nota-card"
                onClick={() => setPreviewItem(t)}
                style={{ cursor: 'pointer', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: '10px', overflow: 'hidden' }}
              >
                {isImg ? (
                  <img src={t.nota} alt={t.deskripsi} style={{ width: '100%', height: '110px', objectFit: 'cover' }} />
                ) : (
                  <div style={{ height: '110px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '36px', background: 'var(--surface3)' }}>
                    📄
                  </div>
                )}
                <div style={{ padding: '10px' }}>
                  <div style={{ fontWeight: 600, fontSize: '12.5px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {t.deskripsi}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '2px' }}>
                    {BRAND_LABEL[t.brand]} · {fmtTanggal(t.tanggal)}
                  </div>
                  <div style={{ fontSize: '12px', fontWeight: 700, marginTop: '4px', color: t.tipe === 'masuk' ? '#4cc9a0' : 'var(--red)' }}>
                    {t.tipe === 'masuk' ? '+' : '−'}{fmtRp(t.nominal)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Preview Modal */}
      {previewItem && (
        <div className="modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) setPreviewItem(null); }}>
          <div className="modal" style={{ maxWidth: '600px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <div className="modal-title" style={{ marginBottom: 0 }}>🗂️ Preview Nota</div>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setPreviewItem(null)}>✕</button>
            </div>
            <div style={{ textAlign: 'center', marginBottom: '14px' }}>
              {previewItem.nota?.startsWith('data:image') || previewItem.nota_type?.startsWith('image') ? (
                <img src={previewItem.nota} alt="Nota" style={{ maxWidth: '100%', maxHeight: '400px', borderRadius: '8px' }} />
              ) : (
                <div style={{ padding: '24px', background: 'var(--surface2)', borderRadius: '8px' }}>
                  📄 File Dokumen Nota
                </div>
              )}
            </div>
            <div style={{ fontSize: '13px', lineHeight: 1.6 }}>
              <div><strong>Deskripsi:</strong> {previewItem.deskripsi}</div>
              <div><strong>Nominal:</strong> {fmtRp(previewItem.nominal)}</div>
              <div><strong>Tanggal:</strong> {fmtTanggal(previewItem.tanggal)}</div>
            </div>
            <div className="modal-actions" style={{ marginTop: '16px' }}>
              <button type="button" className="btn btn-ghost" onClick={() => setPreviewItem(null)}>Tutup</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================
// 5. HUTANG & CICILAN (AP AGING)
// ============================================================
interface KeuHutangViewProps {
  hutangList: HutangItem[];
  activeBrand: BrandId;
  onBrandChange: (b: BrandId) => void;
  onSaveHutang: (item: HutangItem) => Promise<void>;
  onUpdateHutang: (item: HutangItem) => Promise<void>;
  onDeleteHutang: (id: number | string) => Promise<void>;
}

export const KeuHutangView: React.FC<KeuHutangViewProps> = ({
  hutangList,
  activeBrand,
  onBrandChange,
  onSaveHutang,
  onUpdateHutang,
  onDeleteHutang
}) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [bayarItem, setBayarItem] = useState<HutangItem | null>(null);

  const brandList = useMemo(() => {
    return (hutangList || []).filter((h) => (h.brand || '').toLowerCase() === activeBrand.toLowerCase());
  }, [hutangList, activeBrand]);

  const hutangTotalBayar = (h: HutangItem) => (h.cicilan || []).reduce((s, c) => s + (c.nominal || 0), 0);
  const hutangSisa = (h: HutangItem) => Math.max(0, h.total - hutangTotalBayar(h));
  const hutangPct = (h: HutangItem) => h.total > 0 ? Math.min(100, Math.round((hutangTotalBayar(h) / h.total) * 100)) : 100;

  // Totals
  const totalHutang = brandList.reduce((s, h) => s + h.total, 0);
  const totalBayar = brandList.reduce((s, h) => s + hutangTotalBayar(h), 0);
  const totalSisa = brandList.reduce((s, h) => s + hutangSisa(h), 0);
  const totalAktif = brandList.filter((h) => hutangPct(h) < 100).length;
  const totalLunas = brandList.filter((h) => hutangPct(h) >= 100).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Topbar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
        <div className="filter-row" style={{ marginBottom: 0 }}>
          {KEU_BRANDS.map((b) => (
            <button
              key={b}
              type="button"
              className={`filter-btn ${activeBrand === b ? 'active' : ''}`}
              onClick={() => onBrandChange(b)}
            >
              {BRAND_LABEL[b]}
            </button>
          ))}
        </div>

        <button type="button" className="btn btn-primary btn-sm" onClick={() => setIsAddModalOpen(true)}>
          + Tambah Hutang
        </button>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px' }}>
        <div className="keu-card"><div className="keu-label">Total Hutang</div><div className="keu-val keu-red" style={{ fontSize: '14px' }}>{fmtRp(totalHutang)}</div></div>
        <div className="keu-card"><div className="keu-label">Total Dibayar</div><div className="keu-val keu-green" style={{ fontSize: '14px' }}>{fmtRp(totalBayar)}</div></div>
        <div className="keu-card"><div className="keu-label">Sisa Hutang</div><div className="keu-val" style={{ fontSize: '14px', color: '#ff9f43' }}>{fmtRp(totalSisa)}</div></div>
        <div className="keu-card"><div className="keu-label">Aktif</div><div className="keu-val" style={{ fontSize: '14px', color: 'var(--accent)' }}>{totalAktif}</div></div>
        <div className="keu-card"><div className="keu-label">Lunas</div><div className="keu-val keu-green" style={{ fontSize: '14px' }}>{totalLunas}</div></div>
      </div>

      {/* List Cards */}
      {brandList.length === 0 ? (
        <div className="empty">
          <div className="empty-icon">💳</div>
          Belum ada catatan hutang untuk {BRAND_LABEL[activeBrand]}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {brandList.map((h) => {
            const bayar = hutangTotalBayar(h);
            const sisa = hutangSisa(h);
            const pct = hutangPct(h);
            const isLunas = pct >= 100;

            return (
              <div key={h.id} className="card" style={{ padding: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
                  <div>
                    <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text)', marginRight: '8px' }}>
                      {h.nama}
                    </span>
                    <span style={{ fontSize: '12px', color: 'var(--muted)' }}>
                      Kepada: <strong>{h.kepada}</strong> · Tgl: {fmtTanggal(h.tanggal)}
                    </span>
                  </div>
                  <div>
                    {isLunas ? (
                      <span className="pill pill-done">✅ LUNAS</span>
                    ) : (
                      <span className="pill pill-pending">⏳ BELUM LUNAS</span>
                    )}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', margin: '12px 0' }}>
                  <div style={{ background: 'var(--surface2)', padding: '8px 12px', borderRadius: '8px' }}>
                    <div className="keu-label">Total Pinjaman</div>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text)' }}>{fmtRp(h.total)}</div>
                  </div>
                  <div style={{ background: 'var(--surface2)', padding: '8px 12px', borderRadius: '8px' }}>
                    <div className="keu-label">Sudah Dibayar ({pct}%)</div>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: '#4cc9a0' }}>{fmtRp(bayar)}</div>
                  </div>
                  <div style={{ background: 'var(--surface2)', padding: '8px 12px', borderRadius: '8px' }}>
                    <div className="keu-label">Sisa Hutang</div>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: isLunas ? '#4cc9a0' : '#ff9f43' }}>{fmtRp(sisa)}</div>
                  </div>
                </div>

                <div className="progress-bar" style={{ height: '6px', marginBottom: '12px' }}>
                  <div className="progress-fill" style={{ width: `${pct}%`, background: isLunas ? 'var(--green)' : 'var(--accent)' }} />
                </div>

                {/* Cicilan log */}
                {(h.cicilan || []).length > 0 && (
                  <div style={{ borderTop: '1px solid var(--border)', paddingTop: '10px', marginTop: '10px' }}>
                    <div style={{ fontSize: '11px', color: 'var(--muted)', fontFamily: 'DM Mono', marginBottom: '6px' }}>
                      Riwayat Pembayaran ({(h.cicilan || []).length} kali):
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {(h.cicilan || []).map((c) => (
                        <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text2)' }}>
                          <span>📅 {fmtTanggal(c.tanggal)} {c.ket ? `— ${c.ket}` : ''}</span>
                          <span style={{ fontWeight: 600, color: '#4cc9a0', fontFamily: 'DM Mono' }}>+{fmtRp(c.nominal)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '14px' }}>
                  {!isLunas && (
                    <button type="button" className="btn btn-primary btn-sm" onClick={() => setBayarItem(h)}>
                      💳 Bayar Cicilan
                    </button>
                  )}
                  <button
                    type="button"
                    className="btn btn-danger btn-sm"
                    onClick={async () => {
                      if (window.confirm('Hapus hutang ini?')) {
                        await onDeleteHutang(h.id);
                      }
                    }}
                  >
                    🗑️ Hapus
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Tambah Hutang */}
      {isAddModalOpen && (
        <AddHutangModal
          isOpen={true}
          onClose={() => setIsAddModalOpen(false)}
          activeBrand={activeBrand}
          onSave={onSaveHutang}
        />
      )}

      {/* Modal Bayar Cicilan */}
      {bayarItem && (
        <BayarCicilanModal
          isOpen={true}
          onClose={() => setBayarItem(null)}
          hutang={bayarItem}
          onUpdate={onUpdateHutang}
        />
      )}
    </div>
  );
};

// ── ADD HUTANG MODAL ──
const AddHutangModal: React.FC<{ isOpen: boolean; onClose: () => void; activeBrand: BrandId; onSave: (h: HutangItem) => Promise<void> }> = ({
  isOpen,
  onClose,
  activeBrand,
  onSave
}) => {
  const [nama, setNama] = useState('');
  const [kepada, setKepada] = useState('');
  const [total, setTotal] = useState('');
  const [tanggal, setTanggal] = useState(() => toDisplayDate(new Date().toISOString().split('T')[0]));
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nama.trim() || !total) return;

    setIsSubmitting(true);
    try {
      const h: HutangItem = {
        id: Date.now(),
        nama: nama.trim(),
        kepada: kepada.trim() || 'Pihak Luar',
        brand: activeBrand,
        total: parseFloat(total.replace(/\./g, '')) || 0,
        tanggal: toStorageDate(tanggal),
        cicilan: [],
        createdAt: new Date().toISOString()
      };
      await onSave(h);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal" style={{ maxWidth: '440px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <div className="modal-title" style={{ marginBottom: 0 }}>+ Catat Hutang Baru</div>
          <button type="button" className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div className="form-group">
            <label className="form-label">Nama / Keperluan Pinjaman *</label>
            <input className="form-input" value={nama} onChange={(e) => setNama(e.target.value)} placeholder="Misal: Beli Grinder, Renovasi..." required />
          </div>
          <div className="form-group">
            <label className="form-label">Kepada (Kreditor / Pemberi Pinjaman) *</label>
            <input className="form-input" value={kepada} onChange={(e) => setKepada(e.target.value)} placeholder="Nama kreditor..." required />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Total Hutang (Rp) *</label>
              <input
                className="form-input"
                value={total ? Number(total.replace(/\D/g, '')).toLocaleString('id-ID') : ''}
                onChange={(e) => setTotal(e.target.value.replace(/\D/g, ''))}
                placeholder="0"
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Tanggal</label>
              <input className="form-input" value={tanggal} onChange={(e) => setTanggal(autoSlashDate(e.target.value))} maxLength={10} />
            </div>
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

// ── BAYAR CICILAN MODAL ──
const BayarCicilanModal: React.FC<{ isOpen: boolean; onClose: () => void; hutang: HutangItem; onUpdate: (h: HutangItem) => Promise<void> }> = ({
  isOpen,
  onClose,
  hutang,
  onUpdate
}) => {
  const [nominal, setNominal] = useState('');
  const [tanggal, setTanggal] = useState(() => toDisplayDate(new Date().toISOString().split('T')[0]));
  const [ket, setKet] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nominal) return;

    setIsSubmitting(true);
    try {
      const c = {
        id: Date.now(),
        tanggal: toStorageDate(tanggal),
        nominal: parseFloat(nominal.replace(/\./g, '')) || 0,
        ket: ket.trim()
      };
      const updatedCicilan = [...(hutang.cicilan || []), c];
      await onUpdate({ ...hutang, cicilan: updatedCicilan });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal" style={{ maxWidth: '420px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <div className="modal-title" style={{ marginBottom: 0 }}>💳 Bayar Cicilan: {hutang.nama}</div>
          <button type="button" className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div className="form-group">
            <label className="form-label">Nominal Cicilan (Rp) *</label>
            <input
              className="form-input"
              value={nominal ? Number(nominal.replace(/\D/g, '')).toLocaleString('id-ID') : ''}
              onChange={(e) => setNominal(e.target.value.replace(/\D/g, ''))}
              placeholder="0"
              required
              autoFocus
            />
          </div>
          <div className="form-group">
            <label className="form-label">Tanggal Pembayaran</label>
            <input className="form-input" value={tanggal} onChange={(e) => setTanggal(autoSlashDate(e.target.value))} maxLength={10} />
          </div>
          <div className="form-group">
            <label className="form-label">Keterangan / Sumber Dana</label>
            <input className="form-input" value={ket} onChange={(e) => setKet(e.target.value)} placeholder="Misal: Hasil penjualan kasir, transfer..." />
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Batal</button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Menyimpan...' : '✅ Catat Pembayaran'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
