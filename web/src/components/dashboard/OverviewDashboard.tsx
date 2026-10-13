import React, { useState, useMemo } from 'react';
import { 
  Boxes,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  Circle,
  ExternalLink,
  FileText
} from 'lucide-react';
import type { 
  KeuData, 
  BrandId, 
  ResepItem, 
  BahanItem, 
  TodoContentItem, 
  TaskProject,
  TransaksiItem
} from '../../types';
import { computeInventorySummary } from '../../lib/inventoryEngine';

interface DashboardTxnItem extends TransaksiItem {
  brandTag?: string;
  brandPill?: string;
}

interface OverviewDashboardProps {
  keuData: KeuData;
  activeBrand: BrandId;
  onBrandChange?: (brand: BrandId) => void;
  resepList?: ResepItem[];
  bahanList?: BahanItem[];
  todosList?: TodoContentItem[];
  taskList?: TaskProject[];
  onToggleTodo?: (id: number | string) => void;
  onNavigateToKeuangan: (brand?: BrandId) => void;
  onNavigateToTodos?: () => void;
  onNavigateToTasks?: () => void;
  onNavigateToResep?: () => void;
}

export const OverviewDashboard: React.FC<OverviewDashboardProps> = ({
  keuData,
  activeBrand,
  onBrandChange,
  resepList = [],
  bahanList = [],
  todosList = [],
  taskList = [],
  onToggleTodo,
  onNavigateToKeuangan,
  onNavigateToTodos,
  onNavigateToTasks,
  onNavigateToResep
}) => {
  // Tanggal Hari Ini
  const [{ todayStr, dateFormatted }] = useState(() => {
    const todayObj = new Date();
    return {
      todayStr: todayObj.toISOString().split('T')[0],
      dateFormatted: todayObj.toLocaleDateString('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      })
    };
  });

  const fmtRp = (num: number) => {
    return 'Rp ' + Math.round(num || 0).toLocaleString('id-ID');
  };

  const isHolding = activeBrand === 'pratani';

  const brandInfo = useMemo(() => {
    switch (activeBrand) {
      case 'dikopi':
        return {
          label: 'Dikopi F&B',
          icon: '☕',
          color: 'var(--dikopi)',
          desc: 'Kedai Kopi, Event & CFD, Resep Menu HPP, dan Kasir Cloud'
        };
      case 'kolektiva':
        return {
          label: 'Kolektiva Apparel',
          icon: '🛍️',
          color: 'var(--kolektiva)',
          desc: 'Vendor Konveksi & Merchandise Komunitas, 7-Doc LPJ Formal'
        };
      case 'imagineer':
        return {
          label: 'Imagineer Creative',
          icon: '✨',
          color: 'var(--imagineer)',
          desc: 'Creative Agency, Client Deliverables, Branding & Production'
        };
      case 'pratani':
      default:
        return {
          label: 'Holding Konsolidasi',
          icon: '⚡',
          color: 'var(--accent)',
          desc: 'Ikhtisar Gabungan Multi-Brand Pratani Creative Group'
        };
    }
  }, [activeBrand]);

  // 1. Filter Transaksi Berdasarkan Brand Aktif
  const brandTxns: DashboardTxnItem[] = useMemo(() => {
    if (activeBrand === 'dikopi') {
      return (keuData.dikopi || []).map(t => ({ ...t, brandTag: 'Dikopi', brandPill: 'pill-dikopi' }));
    }
    if (activeBrand === 'kolektiva') {
      return (keuData.kolektiva || []).map(t => ({ ...t, brandTag: 'Kolektiva', brandPill: 'pill-kolektiva' }));
    }
    if (activeBrand === 'imagineer') {
      return (keuData.imagineer || keuData.studio || []).map(t => ({ ...t, brandTag: 'Imagineer', brandPill: 'pill-imagineer' }));
    }
    // Pratani / Holding (Semua Brand)
    return [
      ...(keuData.dikopi || []).map(t => ({ ...t, brandTag: 'Dikopi', brandPill: 'pill-dikopi' })),
      ...(keuData.kolektiva || []).map(t => ({ ...t, brandTag: 'Kolektiva', brandPill: 'pill-kolektiva' })),
      ...(keuData.imagineer || keuData.studio || []).map(t => ({ ...t, brandTag: 'Imagineer', brandPill: 'pill-imagineer' })),
    ].sort((a, b) => new Date(b.created_at || b.tanggal || 0).getTime() - new Date(a.created_at || a.tanggal || 0).getTime());
  }, [keuData, activeBrand]);

  // 2. Perhitungan Akumulasi & Harian untuk Brand Terpilih
  const financialStats = useMemo(() => {
    let totalMasuk = 0;
    let totalKeluar = 0;
    brandTxns.forEach((t) => {
      const nom = Number(t.nominal) || 0;
      if (t.tipe === 'masuk') totalMasuk += nom;
      else totalKeluar += nom;
    });

    const todayTxns = brandTxns.filter(t => t.tanggal === todayStr);
    let todayMasuk = 0;
    let todayKeluar = 0;
    todayTxns.forEach((t) => {
      const nom = Number(t.nominal) || 0;
      if (t.tipe === 'masuk') todayMasuk += nom;
      else todayKeluar += nom;
    });

    // Tanggal transaksi aktif terakhir untuk brand ini
    const latestTxnDate = brandTxns[0]?.tanggal || todayStr;
    const latestTxns = brandTxns.filter(t => t.tanggal === latestTxnDate);
    let latestDateMasuk = 0;
    let latestDateKeluar = 0;
    latestTxns.forEach((t) => {
      const nom = Number(t.nominal) || 0;
      if (t.tipe === 'masuk') latestDateMasuk += nom;
      else latestDateKeluar += nom;
    });

    return {
      totalMasuk,
      totalKeluar,
      totalSaldo: totalMasuk - totalKeluar,
      todayMasuk,
      todayKeluar,
      todayNet: todayMasuk - todayKeluar,
      todayCount: todayTxns.length,
      hasTodayTxns: todayTxns.length > 0,
      latestTxnDate,
      latestDateMasuk,
      latestDateKeluar,
      latestDateNet: latestDateMasuk - latestDateKeluar,
      latestCount: latestTxns.length
    };
  }, [brandTxns, todayStr]);

  // 3. Tren 7 Hari Terakhir untuk Brand Terpilih
  const last7DaysTrend = useMemo(() => {
    const days: Array<{ date: string; label: string; masuk: number; keluar: number }> = [];
    const baseDate = financialStats.hasTodayTxns ? new Date(todayStr) : new Date(financialStats.latestTxnDate || todayStr);

    for (let i = 6; i >= 0; i--) {
      const d = new Date(baseDate);
      d.setDate(d.getDate() - i);
      const dStr = d.toISOString().split('T')[0];
      const dayLabel = d.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric' });

      let masuk = 0;
      let keluar = 0;
      brandTxns.forEach((t) => {
        if (t.tanggal === dStr) {
          const nom = Number(t.nominal) || 0;
          if (t.tipe === 'masuk') masuk += nom;
          else keluar += nom;
        }
      });
      days.push({ date: dStr, label: dayLabel, masuk, keluar });
    }

    const maxNominal = Math.max(...days.map(d => Math.max(d.masuk, d.keluar)), 50000);
    return { days, maxNominal };
  }, [brandTxns, financialStats.hasTodayTxns, financialStats.latestTxnDate, todayStr]);

  // 4. Filter To-Do Tasks Berdasarkan Brand Aktif
  const filteredTasks = useMemo(() => {
    const allList: Array<{
      id: string | number;
      brand: string;
      task: string;
      detail: string;
      prioritas: string;
      deadline: string;
      pic: string;
      isUrgent: boolean;
    }> = [];

    taskList.forEach((proj) => {
      const pBrand = (proj.brand || '').toLowerCase();
      // Jika bukan holding, hanya ambil task yang brandnya cocok
      if (!isHolding && pBrand !== activeBrand.toLowerCase()) {
        return;
      }

      (proj.sheets || []).forEach((sheet) => {
        const cols = sheet.columns || [];
        const taskIdx = cols.findIndex(c => c.toUpperCase().includes('TASK') || c.toUpperCase().includes('JUDUL'));
        const detailIdx = cols.findIndex(c => c.toUpperCase().includes('DETAIL') || c.toUpperCase().includes('BRIEF'));
        const prioIdx = cols.findIndex(c => c.toUpperCase().includes('PRIORITAS'));
        const statusIdx = cols.findIndex(c => c.toUpperCase().includes('STATUS'));
        const deadlineIdx = cols.findIndex(c => c.toUpperCase().includes('DEADLINE'));
        const picIdx = cols.findIndex(c => c.toUpperCase().includes('PIC'));

        (sheet.rows || []).forEach((row, rIdx) => {
          const cells = row.cells || [];
          const statusText = statusIdx >= 0 ? (cells[statusIdx] || '') : (row._status || '');
          const isDone = statusText.toLowerCase().includes('done') || statusText.includes('✅') || row._status === 'done';

          if (!isDone) {
            const taskText = taskIdx >= 0 ? cells[taskIdx] : cells[2] || cells[1] || 'Task';
            const detailText = detailIdx >= 0 ? cells[detailIdx] : cells[3] || '';
            const prioText = prioIdx >= 0 ? cells[prioIdx] : '';
            const deadlineText = deadlineIdx >= 0 ? cells[deadlineIdx] : '';
            const picText = picIdx >= 0 ? cells[picIdx] : '';
            const isUrgent = prioText.toLowerCase().includes('urgent') || prioText.includes('🔴') || prioText.toLowerCase().includes('high');

            allList.push({
              id: `${proj.brand}-${sheet.name}-${rIdx}`,
              brand: pBrand,
              task: taskText,
              detail: detailText,
              prioritas: prioText || 'Normal',
              deadline: deadlineText || 'Segera',
              pic: picText || 'Team',
              isUrgent
            });
          }
        });
      });
    });

    // Jika holding: ambil merata dari setiap brand
    if (isHolding) {
      const byBrand: Record<string, typeof allList> = {};
      allList.forEach(t => {
        if (!byBrand[t.brand]) byBrand[t.brand] = [];
        byBrand[t.brand].push(t);
      });
      const mixed: typeof allList = [];
      Object.keys(byBrand).forEach(b => {
        mixed.push(...byBrand[b].slice(0, 2));
      });
      return mixed.slice(0, 5);
    }

    return allList.sort((a, b) => (b.isUrgent ? 1 : 0) - (a.isUrgent ? 1 : 0)).slice(0, 5);
  }, [taskList, activeBrand, isHolding]);

  // 5. Filter Content Plan Berdasarkan Brand Aktif
  const filteredContent = useMemo(() => {
    const pending = todosList.filter((t) => !t.done);

    if (!isHolding) {
      return pending
        .filter((t) => (t.brand || '').toLowerCase() === activeBrand.toLowerCase())
        .sort((a, b) => (a.tanggalPosting || '').localeCompare(b.tanggalPosting || ''))
        .slice(0, 4);
    }

    // Jika holding: ambil merata dari semua brand
    const byBrand: Record<string, typeof pending> = {};
    pending.forEach(c => {
      const b = (c.brand || 'dikopi').toLowerCase();
      if (!byBrand[b]) byBrand[b] = [];
      byBrand[b].push(c);
    });

    const mixed: typeof pending = [];
    Object.keys(byBrand).forEach(b => {
      mixed.push(...byBrand[b].slice(0, 2));
    });
    return mixed.slice(0, 5);
  }, [todosList, activeBrand, isHolding]);

  // 6. Smart Inventory Dikopi
  const dikopiInventory = useMemo(() => {
    if (bahanList.length === 0 || resepList.length === 0) return null;
    return computeInventorySummary(bahanList, resepList, keuData.dikopi || []);
  }, [bahanList, resepList, keuData.dikopi]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
      {/* ── TOP CONTROLLER: BRAND SWITCHER & GREETING ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '20px' }}>{brandInfo.icon}</span>
            <h2 style={{ fontFamily: 'Poppins', fontWeight: 700, fontSize: '20px', color: '#fff', letterSpacing: '-0.02em' }}>
              Dashboard {brandInfo.label}
            </h2>
            <span 
              className="pill" 
              style={{ 
                fontFamily: 'DM Mono', 
                fontSize: '10px', 
                borderColor: brandInfo.color, 
                color: brandInfo.color,
                background: 'rgba(255,255,255,0.04)' 
              }}
            >
              ACTIVE UNIT
            </span>
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text2)', marginTop: '2px' }}>
            {brandInfo.desc} • {dateFormatted}
          </p>
        </div>

        {/* Brand Tabs Switcher (Syncs with Sidebar) */}
        <div className="filter-row" style={{ marginBottom: 0 }}>
          <button
            onClick={() => onBrandChange?.('dikopi')}
            className={`filter-btn ${activeBrand === 'dikopi' ? 'active' : ''}`}
            style={{ 
              borderColor: activeBrand === 'dikopi' ? 'var(--dikopi)' : 'var(--border)',
              color: activeBrand === 'dikopi' ? 'var(--dikopi)' : 'var(--muted)'
            }}
          >
            ☕ Dikopi F&B
          </button>
          <button
            onClick={() => onBrandChange?.('kolektiva')}
            className={`filter-btn ${activeBrand === 'kolektiva' ? 'active' : ''}`}
            style={{ 
              borderColor: activeBrand === 'kolektiva' ? 'var(--kolektiva)' : 'var(--border)',
              color: activeBrand === 'kolektiva' ? 'var(--kolektiva)' : 'var(--muted)'
            }}
          >
            🛍️ Kolektiva
          </button>
          <button
            onClick={() => onBrandChange?.('imagineer')}
            className={`filter-btn ${activeBrand === 'imagineer' ? 'active' : ''}`}
            style={{ 
              borderColor: activeBrand === 'imagineer' ? 'var(--imagineer)' : 'var(--border)',
              color: activeBrand === 'imagineer' ? 'var(--imagineer)' : 'var(--muted)'
            }}
          >
            ✨ Imagineer
          </button>
          <button
            onClick={() => onBrandChange?.('pratani')}
            className={`filter-btn ${activeBrand === 'pratani' ? 'active' : ''}`}
            style={{ 
              borderColor: activeBrand === 'pratani' ? 'var(--accent)' : 'var(--border)',
              color: activeBrand === 'pratani' ? 'var(--accent)' : 'var(--muted)'
            }}
          >
            🌐 Semua (Holding)
          </button>
        </div>
      </div>

      {/* ── BLOK 1: DENYUT FINANSIAL BRAND TERPILIH ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        {/* Omzet Masuk */}
        <div className="brand-card" style={{ borderLeftColor: 'var(--green)' }}>
          <div className="brand-card-name" style={{ color: 'var(--green)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>
              {financialStats.hasTodayTxns ? 'OMZET HARI INI' : `OMZET (${isHolding ? 'HOLDING' : activeBrand.toUpperCase()})`}
            </span>
            <ArrowUpRight style={{ width: '14px', height: '14px' }} />
          </div>
          <div className="brand-card-num" style={{ fontSize: '24px', color: 'var(--green)' }}>
            {fmtRp(financialStats.hasTodayTxns ? financialStats.todayMasuk : financialStats.totalMasuk)}
          </div>
          <div className="brand-card-label">
            {financialStats.hasTodayTxns 
              ? `Akumulasi Total: ${fmtRp(financialStats.totalMasuk)}` 
              : `Akumulasi pemasukan unit ${brandInfo.label}`}
          </div>
        </div>

        {/* Pengeluaran / Beban */}
        <div className="brand-card" style={{ borderLeftColor: 'var(--red)' }}>
          <div className="brand-card-name" style={{ color: 'var(--red)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>
              {financialStats.hasTodayTxns ? 'PENGELUARAN HARI INI' : `PENGELUARAN (${isHolding ? 'HOLDING' : activeBrand.toUpperCase()})`}
            </span>
            <ArrowDownRight style={{ width: '14px', height: '14px' }} />
          </div>
          <div className="brand-card-num" style={{ fontSize: '24px', color: 'var(--red)' }}>
            {fmtRp(financialStats.hasTodayTxns ? financialStats.todayKeluar : financialStats.totalKeluar)}
          </div>
          <div className="brand-card-label">
            {financialStats.hasTodayTxns
              ? `Akumulasi Beban: ${fmtRp(financialStats.totalKeluar)}`
              : `Biaya belanja stok & operasional`}
          </div>
        </div>

        {/* Surplus / Saldo Kas */}
        <div className="brand-card" style={{ borderLeftColor: financialStats.totalSaldo >= 0 ? brandInfo.color : 'var(--red)' }}>
          <div className="brand-card-name" style={{ color: financialStats.totalSaldo >= 0 ? brandInfo.color : 'var(--red)' }}>
            {financialStats.hasTodayTxns ? 'SURPLUS HARI INI' : 'SALDO KAS NETTO'}
          </div>
          <div className="brand-card-num" style={{ fontSize: '24px', color: financialStats.totalSaldo >= 0 ? brandInfo.color : 'var(--red)' }}>
            {fmtRp(financialStats.hasTodayTxns ? financialStats.todayNet : financialStats.totalSaldo)}
          </div>
          <div className="brand-card-label">
            {financialStats.hasTodayTxns 
              ? `Saldo Kas Brand: ${fmtRp(financialStats.totalSaldo)}` 
              : `${brandTxns.length} transaksi tercatat di database`}
          </div>
        </div>

        {/* Mini Chart: Tren 7 Hari */}
        <div className="card" style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontFamily: 'DM Mono', fontSize: '10.5px', color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase' }}>
              📊 TREN KAS 7 HARI ({isHolding ? 'ALL' : activeBrand.toUpperCase()})
            </span>
            <span style={{ fontSize: '10px', color: 'var(--green)', fontFamily: 'DM Mono' }}>
              Hijau: Masuk • Merah: Keluar
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '8px', height: '56px', paddingTop: '6px' }}>
            {last7DaysTrend.days.map((d, idx) => {
              const masukHeight = Math.max(6, Math.round((d.masuk / last7DaysTrend.maxNominal) * 44));
              const keluarHeight = Math.max(4, Math.round((d.keluar / last7DaysTrend.maxNominal) * 44));

              return (
                <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', flex: 1 }} title={`${d.date}: Masuk ${fmtRp(d.masuk)} | Keluar ${fmtRp(d.keluar)}`}>
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: '2px', height: '44px' }}>
                    <div 
                      style={{ 
                        width: '7px', 
                        height: `${masukHeight}px`, 
                        background: d.masuk > 0 ? 'var(--green)' : 'rgba(255,255,255,0.06)', 
                        borderRadius: '2px',
                        transition: 'height 0.3s'
                      }} 
                    />
                    <div 
                      style={{ 
                        width: '7px', 
                        height: `${keluarHeight}px`, 
                        background: d.keluar > 0 ? 'var(--red)' : 'rgba(255,255,255,0.04)', 
                        borderRadius: '2px',
                        transition: 'height 0.3s'
                      }} 
                    />
                  </div>
                  <span style={{ fontSize: '9px', fontFamily: 'DM Mono', color: 'var(--muted)' }}>
                    {d.label.split(' ')[0]}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── BLOK 2: ACTION CENTER — APA YANG HARUS LU LAKUIN SEKARANG ── */}
      <div className="grid-2">
        {/* Kolom A: 🎯 Priority Tasks (Filtered to Active Brand) */}
        <div className="card">
          <div className="card-title">
            <span>🎯 Task Prioritas — {brandInfo.label}</span>
            {onNavigateToTasks && (
              <button 
                onClick={onNavigateToTasks}
                className="btn btn-ghost btn-sm"
                style={{ fontSize: '11px', padding: '3px 8px' }}
              >
                <span>Buka To-Do List</span>
                <ExternalLink style={{ width: '12px', height: '12px' }} />
              </button>
            )}
          </div>

          {filteredTasks.length === 0 ? (
            <div className="empty" style={{ padding: '24px 0' }}>
              <div className="empty-icon">🎉</div>
              Tidak ada task pending untuk unit {brandInfo.label}!<br />
              <span style={{ fontSize: '11px', color: 'var(--muted)' }}>Semua to-do di sheet sudah berstatus Done.</span>
            </div>
          ) : (
            <div className="item-list">
              {filteredTasks.map((t) => (
                <div 
                  key={t.id} 
                  className="item-row clickable"
                  onClick={onNavigateToTasks}
                  style={{ 
                    borderLeft: t.isUrgent ? '3px solid var(--red)' : '3px solid var(--border)',
                    cursor: 'pointer' 
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px' }}>
                      <span className={`pill ${t.brand === 'dikopi' ? 'pill-dikopi' : t.brand === 'kolektiva' ? 'pill-kolektiva' : 'pill-imagineer'}`} style={{ fontSize: '9.5px', padding: '1px 6px' }}>
                        {t.brand}
                      </span>
                      {t.isUrgent && (
                        <span className="pill" style={{ background: 'var(--red-dim)', color: 'var(--red)', fontSize: '9.5px', padding: '1px 6px', border: '1px solid rgba(244,63,94,0.3)' }}>
                          🔴 Urgent
                        </span>
                      )}
                      <span style={{ fontSize: '11px', color: 'var(--muted)', fontFamily: 'DM Mono' }}>
                        PIC: {t.pic} • {t.deadline}
                      </span>
                    </div>

                    <div className="item-text" style={{ fontSize: '13px', fontWeight: 600 }}>
                      {t.task}
                    </div>

                    {t.detail && (
                      <div className="item-sub" style={{ fontSize: '11.5px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {t.detail}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Kolom B: 📱 Content Radar (Filtered to Active Brand) */}
        <div className="card">
          <div className="card-title">
            <span>📱 Content Radar — {brandInfo.label}</span>
            {onNavigateToTodos && (
              <button 
                onClick={onNavigateToTodos}
                className="btn btn-ghost btn-sm"
                style={{ fontSize: '11px', padding: '3px 8px' }}
              >
                <span>Buka Content Plan</span>
                <ExternalLink style={{ width: '12px', height: '12px' }} />
              </button>
            )}
          </div>

          {filteredContent.length === 0 ? (
            <div className="empty" style={{ padding: '24px 0' }}>
              <div className="empty-icon">📅</div>
              Tidak ada konten pending untuk {brandInfo.label}!<br />
              <span style={{ fontSize: '11px', color: 'var(--muted)' }}>Semua konten bulan ini sudah diposting.</span>
            </div>
          ) : (
            <div className="item-list">
              {filteredContent.map((c) => {
                const isTodayPost = c.tanggalPosting === todayStr;

                return (
                  <div 
                    key={c.id} 
                    className="item-row"
                    style={{ 
                      borderLeft: isTodayPost ? '3px solid var(--accent)' : '3px solid var(--border)',
                      background: isTodayPost ? 'rgba(56, 189, 248, 0.05)' : 'var(--surface2)'
                    }}
                  >
                    <button
                      onClick={() => onToggleTodo && onToggleTodo(c.id)}
                      style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0, lineHeight: 1 }}
                      title="Klik untuk tandai sudah diposting"
                    >
                      {c.done ? (
                        <CheckCircle2 style={{ width: '18px', height: '18px', color: 'var(--green)' }} />
                      ) : (
                        <Circle style={{ width: '18px', height: '18px', color: 'var(--muted)' }} />
                      )}
                    </button>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px' }}>
                        <span className={`pill ${c.brand.toLowerCase() === 'dikopi' ? 'pill-dikopi' : c.brand.toLowerCase() === 'kolektiva' ? 'pill-kolektiva' : 'pill-imagineer'}`} style={{ fontSize: '9.5px', padding: '1px 6px' }}>
                          {c.brand}
                        </span>
                        {isTodayPost ? (
                          <span className="pill" style={{ background: 'rgba(56, 189, 248, 0.15)', color: 'var(--accent)', fontSize: '9.5px', padding: '1px 6px', border: '1px solid var(--border2)' }}>
                            ⚡ JADWAL HARI INI
                          </span>
                        ) : (
                          <span style={{ fontSize: '11px', fontFamily: 'DM Mono', color: 'var(--text2)' }}>
                            📅 {c.tanggalPosting}
                          </span>
                        )}
                        {c.format && (
                          <span className="pill" style={{ fontSize: '9.5px', background: 'var(--surface3)', color: 'var(--muted)' }}>
                            {c.format}
                          </span>
                        )}
                      </div>

                      <div className="item-text" style={{ fontSize: '13px', fontWeight: 600 }}>
                        {c.judul}
                      </div>

                      {c.hook && (
                        <div className="item-sub" style={{ fontSize: '11.5px', color: 'var(--yellow)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          Hook: {c.hook}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── BLOK 3: OPERATIONAL RADAR — CONTEXTUAL ALERTS PER BRAND ── */}
      {/* Jika Dikopi atau Holding: Tampilkan Smart Inventory */}
      {(activeBrand === 'dikopi' || isHolding) && dikopiInventory && dikopiInventory.kritisItems.length > 0 && (
        <div 
          className="card" 
          style={{ 
            borderColor: 'rgba(244, 63, 94, 0.4)', 
            background: 'linear-gradient(135deg, rgba(244, 63, 94, 0.08) 0%, rgba(18, 24, 39, 0.9) 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            padding: '16px 20px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ fontSize: '26px' }}>⚠️</div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontFamily: 'Poppins', fontWeight: 700, fontSize: '14px', color: 'var(--red)' }}>
                  Dikopi Smart Inventory Alert (Bahan Perlu Restock Segera)
                </span>
                <span className="pill" style={{ background: 'var(--red-dim)', color: 'var(--red)', border: '1px solid rgba(244,63,94,0.3)' }}>
                  {dikopiInventory.kritisItems.length} Bahan Kritis
                </span>
              </div>
              <p style={{ fontSize: '12.5px', color: 'var(--text2)', marginTop: '2px' }}>
                Stok menipis dari kasir: <strong style={{ color: '#fff' }}>{dikopiInventory.kritisItems.map(k => k.bahan.nama).slice(0, 4).join(', ')}</strong>{dikopiInventory.kritisItems.length > 4 ? ` dan ${dikopiInventory.kritisItems.length - 4} lainnya` : ''}.
              </p>
            </div>
          </div>
          {onNavigateToResep && (
            <button
              onClick={onNavigateToResep}
              className="btn btn-sm btn-ghost"
              style={{ color: 'var(--yellow)', borderColor: 'rgba(245, 158, 11, 0.3)', whiteSpace: 'nowrap' }}
            >
              <Boxes style={{ width: '14px', height: '14px' }} />
              <span>Buka Smart Stok</span>
            </button>
          )}
        </div>
      )}

      {/* Jika Kolektiva: Tampilkan Info Dokumen Formal LPJ */}
      {activeBrand === 'kolektiva' && (
        <div 
          className="card" 
          style={{ 
            borderColor: 'rgba(168, 85, 247, 0.3)', 
            background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.08) 0%, rgba(18, 24, 39, 0.9) 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            padding: '16px 20px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ fontSize: '26px' }}>📜</div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontFamily: 'Poppins', fontWeight: 700, fontSize: '14px', color: 'var(--kolektiva)' }}>
                  Kolektiva 7-Dokumen LPJ Engine Ready
                </span>
                <span className="pill pill-done">0-Drama Guarantee</span>
              </div>
              <p style={{ fontSize: '12.5px', color: 'var(--text2)', marginTop: '2px' }}>
                Siap cetak & render dokumen legal: RAB Penawaran, SPK MoU, Design Approval, Surat Jalan, BAST, Invoice & Kwitansi.
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigateToKeuangan('kolektiva')}
            className="btn btn-sm btn-ghost"
            style={{ color: 'var(--kolektiva)', borderColor: 'rgba(168, 85, 247, 0.4)', whiteSpace: 'nowrap' }}
          >
            <FileText style={{ width: '14px', height: '14px' }} />
            <span>Buka Kas Kolektiva</span>
          </button>
        </div>
      )}

      {/* ── BLOK 4: LOG MUTASI KAS TERKINI (BRAND TERPILIH) ── */}
      <div className="card" style={{ padding: '20px 22px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ 
              width: '32px', 
              height: '32px', 
              borderRadius: '8px', 
              background: 'rgba(56, 189, 248, 0.1)', 
              border: '1px solid var(--border)',
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              fontSize: '15px'
            }}>
              🧾
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontFamily: 'Poppins', fontWeight: 700, fontSize: '14.5px', color: '#fff' }}>
                  Mutasi Kas Terakhir — {brandInfo.label}
                </span>
                <span className="pill" style={{ fontFamily: 'DM Mono', fontSize: '9.5px', padding: '1px 7px' }}>
                  {brandTxns.length} Total
                </span>
              </div>
              <span style={{ fontSize: '11px', color: 'var(--muted)' }}>
                Arus kas masuk & beban operasional terverifikasi
              </span>
            </div>
          </div>

          <button 
            className="btn btn-ghost btn-sm"
            onClick={() => onNavigateToKeuangan(isHolding ? undefined : activeBrand)}
            style={{ fontSize: '11.5px', padding: '5px 12px', borderColor: 'var(--border)' }}
          >
            <span>Buka Buku Kas {brandInfo.label}</span>
            <ExternalLink style={{ width: '12px', height: '12px' }} />
          </button>
        </div>

        {brandTxns.length === 0 ? (
          <div className="empty" style={{ padding: '28px 0' }}>
            <div className="empty-icon">📁</div>
            Belum ada transaksi tercatat untuk {brandInfo.label}.<br />
            <span style={{ fontSize: '11px', color: 'var(--muted)' }}>
              Catat kas masuk atau belanja operasional melalui menu Buku Kas.
            </span>
          </div>
        ) : (
          <div style={{ 
            border: '1px solid var(--border)', 
            borderRadius: '10px', 
            overflow: 'hidden', 
            background: 'var(--surface2)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)' 
          }}>
            <table className="keu-buku-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: 'rgba(255, 255, 255, 0.03)' }}>
                  <th style={{ width: '105px', padding: '11px 14px' }}>TANGGAL</th>
                  <th style={{ width: '80px', padding: '11px 10px' }}>TIPE</th>
                  {isHolding && <th style={{ width: '95px', padding: '11px 10px' }}>UNIT</th>}
                  <th style={{ padding: '11px 14px' }}>DESKRIPSI TRANSAKSI</th>
                  <th style={{ width: '160px', padding: '11px 12px' }}>KATEGORI</th>
                  <th style={{ width: '110px', padding: '11px 12px' }}>SUMBER</th>
                  <th style={{ width: '145px', textAlign: 'right', padding: '11px 16px' }}>NOMINAL</th>
                </tr>
              </thead>
              <tbody>
                {brandTxns.slice(0, 8).map((t, idx) => {
                  const isMasuk = t.tipe === 'masuk';
                  const isMutasi = t.tipe === 'mutasi';
                  const kat = (t.kategori || '').toLowerCase();
                  
                  // Klasifikasi badge visual mirip v4.2
                  let badgeLabel = 'OPS';
                  let badgeColor = 'var(--red)';
                  let badgeBg = 'rgba(244, 63, 94, 0.12)';
                  let badgeBorder = 'rgba(244, 63, 94, 0.25)';

                  if (isMutasi) {
                    badgeLabel = 'MUTASI';
                    badgeColor = 'var(--accent)';
                    badgeBg = 'rgba(56, 189, 248, 0.12)';
                    badgeBorder = 'rgba(56, 189, 248, 0.25)';
                  } else if (isMasuk) {
                    badgeLabel = 'MASUK';
                    badgeColor = 'var(--green)';
                    badgeBg = 'rgba(16, 185, 129, 0.12)';
                    badgeBorder = 'rgba(16, 185, 129, 0.25)';
                  } else if (kat.includes('aset')) {
                    badgeLabel = 'ASET';
                    badgeColor = '#c084fc';
                    badgeBg = 'rgba(192, 132, 252, 0.12)';
                    badgeBorder = 'rgba(192, 132, 252, 0.25)';
                  } else if (kat.includes('gaji') || kat.includes('honor') || kat.includes('fee')) {
                    badgeLabel = 'GAJI';
                    badgeColor = '#fb7185';
                    badgeBg = 'rgba(251, 113, 133, 0.12)';
                    badgeBorder = 'rgba(251, 113, 133, 0.25)';
                  } else if (kat.includes('bahan') || kat.includes('susu') || kat.includes('kopi') || kat.includes('cup') || kat.includes('packaging')) {
                    badgeLabel = 'HPP';
                    badgeColor = '#fbbf24';
                    badgeBg = 'rgba(251, 191, 36, 0.12)';
                    badgeBorder = 'rgba(251, 191, 36, 0.25)';
                  }

                  return (
                    <tr 
                      key={idx}
                      style={{ 
                        transition: 'background 0.15s ease',
                        borderBottom: '1px solid var(--border)' 
                      }}
                    >
                      {/* Tanggal */}
                      <td style={{ 
                        fontFamily: 'DM Mono', 
                        color: 'var(--text2)', 
                        fontSize: '12px', 
                        whiteSpace: 'nowrap',
                        padding: '11px 14px' 
                      }}>
                        {t.tanggal}
                      </td>

                      {/* Tipe Badge */}
                      <td style={{ padding: '11px 10px' }}>
                        <span style={{ 
                          fontSize: '9.5px', 
                          fontWeight: 700, 
                          fontFamily: 'DM Mono', 
                          padding: '2px 7px', 
                          borderRadius: '99px',
                          background: badgeBg, 
                          color: badgeColor, 
                          border: `1px solid ${badgeBorder}`,
                          display: 'inline-block',
                          textAlign: 'center',
                          minWidth: '45px'
                        }}>
                          {badgeLabel}
                        </span>
                      </td>

                      {/* Unit Brand Tag jika di mode Holding */}
                      {isHolding && (
                        <td style={{ padding: '11px 10px' }}>
                          <span className={`pill ${t.brandPill}`} style={{ fontSize: '9.5px', padding: '1px 6px' }}>
                            {t.brandTag}
                          </span>
                        </td>
                      )}

                      {/* Deskripsi */}
                      <td style={{ padding: '11px 14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <span style={{ color: '#fff', fontWeight: 600, fontSize: '13px' }}>
                            {t.deskripsi}
                          </span>
                          {t._source === 'kasir_event' && (
                            <span className="pill" style={{ fontSize: '9px', padding: '1px 6px', background: 'rgba(56, 189, 248, 0.12)', color: 'var(--accent)', border: '1px solid rgba(56,189,248,0.25)' }}>
                              Kasir Event
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Kategori Pill */}
                      <td style={{ padding: '11px 12px' }}>
                        <span className="keu-cat-pill" style={{ 
                          fontSize: '11px', 
                          background: 'rgba(255,255,255,0.03)', 
                          borderColor: 'rgba(255,255,255,0.08)',
                          color: 'var(--text2)',
                          display: 'inline-block',
                          maxWidth: '150px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}>
                          {t.kategori || 'Umum'}
                        </span>
                      </td>

                      {/* Sumber Kas */}
                      <td style={{ padding: '11px 12px', fontSize: '12px', color: 'var(--text2)' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', background: 'rgba(255,255,255,0.02)', padding: '2px 8px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.05)' }}>
                          <span>{t.sumber === 'cash' ? '🪙' : t.sumber === 'shopee' ? '🛒' : '🏦'}</span>
                          <span style={{ textTransform: 'capitalize', fontWeight: 500 }}>
                            {t.sumber === 'cash' ? 'Cash' : t.sumber === 'shopee' ? 'Shopee' : 'Bank'}
                          </span>
                        </div>
                      </td>

                      {/* Nominal */}
                      <td style={{ 
                        textAlign: 'right', 
                        fontFamily: 'DM Mono', 
                        fontWeight: 700,
                        fontSize: '13px',
                        padding: '11px 16px',
                        whiteSpace: 'nowrap',
                        color: isMasuk ? 'var(--green)' : isMutasi ? 'var(--accent)' : 'var(--red)'
                      }}>
                        {isMasuk ? '+ ' : isMutasi ? '↔ ' : '− '}
                        {fmtRp(t.nominal)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
