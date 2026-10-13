import React, { useState, useMemo } from 'react';
import type { 
  KeuData, 
  BrandId, 
  TransaksiItem, 
  ResepItem, 
  BahanItem, 
  HistoryEntry, 
  AsetItem 
} from '../../types';
import {
  DikopiPenjualanModal,
  DikopiPengeluaranModal,
  DikopiMutasiModal,
  DikopiCairShopeeModal,
  DikopiSuntikanModal,
  DikopiPriveModal,
  DikopiBeliAsetModal,
  DikopiDistribusiLabaModal,
  EditSaldoAwalModal,
  EditTransactionModal,
  TxnHistoryModal,
  PreviewNotaModal
} from './DikopiModals';
import {
  fmtRp,
  fmtTimestamp,
  getBulanLabel,
  getTxnClass,
  keuKatGroup,
  fmtInputDots,
  parseInputDots,
  getCurrentMonthKey,
  txnEffectiveDate
} from '../../lib/keuanganUtils';

interface BukuKasViewProps {
  keuData: KeuData;
  activeBrand: BrandId;
  onBrandChange: (brand: BrandId) => void;
  resepList?: ResepItem[];
  bahanList?: BahanItem[];
  historyList?: HistoryEntry[];
  onTriggerSync?: () => void;
  onPushCloud?: () => void;
  onAddTransaction?: () => void;
  onSaveTransaction: (trx: TransaksiItem, brand: BrandId, newAset?: AsetItem) => Promise<void>;
  onSaveBatchTransactions?: (trxs: TransaksiItem[], brand: BrandId) => Promise<void>;
  onUpdateTransaction: (trx: TransaksiItem, brand: BrandId) => Promise<void>;
  onDeleteTransaction: (trxId: string | number, brand: BrandId) => Promise<void>;
  onSaveSaldoAwal: (periode: string, cash: number, rek: number) => Promise<void>;
  onRestoreSnapshot?: (snapshot: TransaksiItem, brand: BrandId) => Promise<void>;
}

export const BukuKasView: React.FC<BukuKasViewProps> = ({
  keuData,
  activeBrand,
  onBrandChange,
  resepList = [],
  bahanList = [],
  historyList = [],
  onTriggerSync,
  onPushCloud,
  onAddTransaction,
  onSaveTransaction,
  onSaveBatchTransactions,
  onUpdateTransaction,
  onDeleteTransaction,
  onSaveSaldoAwal,
  onRestoreSnapshot
}) => {
  // Current month default: YYYY-MM
  const [currentMonthKey] = useState<string>(() => getCurrentMonthKey());

  const [selectedPeriode, setSelectedPeriode] = useState<string>(currentMonthKey);

  // Modal display states
  const [isPenjualanOpen, setIsPenjualanOpen] = useState(false);
  const [isPengeluaranHppOpen, setIsPengeluaranHppOpen] = useState(false);
  const [isPengeluaranOpsOpen, setIsPengeluaranOpsOpen] = useState(false);
  const [isMutasiOpen, setIsMutasiOpen] = useState(false);
  const [isCairShopeeOpen, setIsCairShopeeOpen] = useState(false);
  const [isSuntikanOpen, setIsSuntikanOpen] = useState(false);
  const [isPriveOpen, setIsPriveOpen] = useState(false);
  const [isBeliAsetOpen, setIsBeliAsetOpen] = useState(false);
  const [isBagiLabaOpen, setIsBagiLabaOpen] = useState(false);
  const [isEditSaldoOpen, setIsEditSaldoOpen] = useState(false);

  // Selected item for modals
  const [editingTxn, setEditingTxn] = useState<TransaksiItem | null>(null);
  const [historyTxn, setHistoryTxn] = useState<TransaksiItem | null>(null);
  const [previewTxn, setPreviewTxn] = useState<TransaksiItem | null>(null);

  // Quick Setup Saldo Awal state inside banner
  const [setupCashInput, setSetupCashInput] = useState('');
  const [setupRekInput, setSetupRekInput] = useState('');

  // Brand transactions list
  const rawList: TransaksiItem[] = useMemo(() => {
    if (activeBrand === 'dikopi') return keuData.dikopi || [];
    if (activeBrand === 'kolektiva') return keuData.kolektiva || [];
    if (activeBrand === 'imagineer') return keuData.imagineer || keuData.studio || [];
    return (keuData[activeBrand] as TransaksiItem[]) || [];
  }, [keuData, activeBrand]);

  // Available months
  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    months.add(currentMonthKey);
    rawList.forEach((t) => {
      const eff = txnEffectiveDate(t);
      if (eff && eff.length >= 7) {
        months.add(eff.substring(0, 7));
      }
    });
    return Array.from(months).sort().reverse();
  }, [rawList, currentMonthKey]);

  // Filtered transactions for selected month
  const monthTxns = useMemo(() => {
    return rawList.filter((t) => txnEffectiveDate(t).startsWith(selectedPeriode));
  }, [rawList, selectedPeriode]);

  // Meta Saldo Awal from keuData._meta
  const meta = (keuData._meta || {}) as Record<string, any>;
  const saldoCashAwal = Number(meta[`dikopi_cash_${selectedPeriode}`] || 0);
  const saldoRekAwal = Number(meta[`dikopi_rek_${selectedPeriode}`] || 0);
  const hasSetup = Boolean(
    saldoCashAwal || saldoRekAwal || meta[`dikopi_setup_${selectedPeriode}`]
  );

  // -------------------------------------------------------------
  // DIKOPI CALCULATIONS
  // -------------------------------------------------------------
  // Running totals across the month (chronological)
  const dikopiStats = useMemo(() => {
    const sortedChrono = [...monthTxns].sort((a, b) => {
      const da = txnEffectiveDate(a) + (a.created_at || '');
      const db = txnEffectiveDate(b) + (b.created_at || '');
      return da.localeCompare(db);
    });

    let cash = saldoCashAwal;
    let rek = saldoRekAwal;
    let shopee = 0;
    let gofood = 0;
    let tiktok = 0;

    sortedChrono.forEach((t) => {
      const n = Number(t.nominal) || 0;
      const src = t.sumber || 'cash';
      if (t.tipe === 'mutasi') {
        if (src === 'cash') {
          cash -= n;
          rek += n;
        } else if (src === 'rek2shopee') {
          rek -= n;
          shopee += n;
        } else if (src === 'shopee2rek') {
          shopee -= n;
          rek += n;
        } else if (src === 'gofood2rek') {
          gofood -= n;
          rek += n;
        } else if (src === 'tiktok2rek') {
          tiktok -= n;
          rek += n;
        } else {
          rek -= n;
          cash += n;
        }
      } else if (t.tipe === 'masuk') {
        if (src === 'cash') cash += n;
        else if (src === 'shopee') shopee += n;
        else if (src === 'gofood') gofood += n;
        else if (src === 'tiktok') tiktok += n;
        else rek += n;
      } else {
        // keluar
        if (src === 'cash') cash -= n;
        else if (src === 'shopee') shopee -= n;
        else if (src === 'gofood') gofood -= n;
        else if (src === 'tiktok') tiktok -= n;
        else rek -= n;
      }
    });

    const totalLiquid = cash + rek;
    const totalMarketplace = shopee + gofood + tiktok;
    const totalAsetIncShopee = totalLiquid + totalMarketplace;

    const nonMutasi = monthTxns.filter((t) => t.tipe !== 'mutasi');
    const totalPenjualan = nonMutasi
      .filter((t) => getTxnClass(t) === 'revenue')
      .reduce((s, t) => s + Number(t.nominal || 0), 0);
    const totalHPP = nonMutasi
      .filter((t) => getTxnClass(t) === 'hpp')
      .reduce((s, t) => s + Number(t.nominal || 0), 0);
    const totalOps = nonMutasi
      .filter((t) => getTxnClass(t) === 'operational')
      .reduce((s, t) => s + Number(t.nominal || 0), 0);
    const netProfit = totalPenjualan - totalHPP - totalOps;

    return {
      cash,
      rek,
      totalLiquid,
      shopee,
      gofood,
      tiktok,
      totalMarketplace,
      totalAsetIncShopee,
      totalPenjualan,
      totalHPP,
      totalOps,
      netProfit
    };
  }, [monthTxns, saldoCashAwal, saldoRekAwal]);

  // Group Dikopi transactions by date (descending)
  const dayGroups = useMemo(() => {
    const byDate: Record<string, TransaksiItem[]> = {};
    monthTxns.forEach((t) => {
      const d = txnEffectiveDate(t);
      if (!byDate[d]) byDate[d] = [];
      byDate[d].push(t);
    });

    const sortedDates = Object.keys(byDate).sort().reverse();
    return sortedDates.map((dateStr) => {
      const txns = byDate[dateStr].sort((a, b) => {
        const timeA = a.created_at || a.tanggal || '';
        const timeB = b.created_at || b.tanggal || '';
        return timeA.localeCompare(timeB);
      });

      const dPenjualan = txns
        .filter((t) => getTxnClass(t) === 'revenue')
        .reduce((s, t) => s + Number(t.nominal || 0), 0);
      const dHPP = txns
        .filter((t) => getTxnClass(t) === 'hpp')
        .reduce((s, t) => s + Number(t.nominal || 0), 0);
      const dOps = txns
        .filter((t) => getTxnClass(t) === 'operational')
        .reduce((s, t) => s + Number(t.nominal || 0), 0);
      const dMutasi = txns.filter((t) => t.tipe === 'mutasi');
      const dNet = dPenjualan - dHPP - dOps;

      let label = dateStr;
      if (dateStr) {
        const parts = dateStr.split('-');
        if (parts.length === 3) {
          const dObj = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
          label = dObj.toLocaleDateString('id-ID', {
            weekday: 'long',
            day: 'numeric',
            month: 'long'
          });
        }
      }

      return {
        dateStr,
        label,
        txns,
        dPenjualan,
        dHPP,
        dOps,
        dMutasiCount: dMutasi.length,
        dNet
      };
    });
  }, [monthTxns]);

  // -------------------------------------------------------------
  // STANDARD MODE (Kolektiva & Imagineer) CALCULATIONS
  // -------------------------------------------------------------
  const standardRows = useMemo(() => {
    if (activeBrand === 'dikopi') return [];
    const sorted = [...monthTxns].sort((a, b) => (a.tanggal || '').localeCompare(b.tanggal || ''));
    let runningSaldo = 0;
    return sorted.map((t, idx) => {
      const n = Number(t.nominal) || 0;
      const masuk = t.tipe === 'masuk' ? n : 0;
      const keluar = t.tipe === 'keluar' ? n : 0;
      runningSaldo += masuk - keluar;
      return {
        t,
        index: idx + 1,
        masuk,
        keluar,
        saldo: runningSaldo,
        catGroup: keuKatGroup(t.kategori || '')
      };
    });
  }, [monthTxns, activeBrand]);

  const standardSummary = useMemo(() => {
    let rev = 0;
    let hpp = 0;
    let exp = 0;
    standardRows.forEach(({ t }) => {
      const tc = getTxnClass(t);
      const n = Number(t.nominal) || 0;
      if (t.tipe === 'mutasi') return;
      if (tc === 'revenue') rev += n;
      else if (tc === 'hpp') hpp += n;
      else if (['capital_injection', 'owner_draw', 'profit_distribution', 'asset_purchase'].includes(tc)) {
        // excluded from operating profit
      } else {
        exp += n;
      }
    });
    return {
      revenue: rev,
      hpp,
      expense: exp,
      netProfit: rev - hpp - exp
    };
  }, [standardRows]);

  const handleSaveQuickSaldoAwal = async () => {
    const cash = parseInputDots(setupCashInput);
    const rek = parseInputDots(setupRekInput);
    await onSaveSaldoAwal(selectedPeriode, cash, rek);
  };

  const handleDelete = async (trx: TransaksiItem) => {
    const confirmMsg =
      activeBrand === 'dikopi'
        ? `Hapus transaksi "${trx.deskripsi}" (${fmtRp(trx.nominal)})? Data di aplikasi kasir Cloud juga akan otomatis terhapus.`
        : `Hapus transaksi "${trx.deskripsi}" (${fmtRp(trx.nominal)})?`;
    if (window.confirm(confirmMsg)) {
      await onDeleteTransaction(trx.id, activeBrand);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* ── TOPBAR: Brand Tabs + Month Selector ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div className="filter-row" style={{ marginBottom: 0 }}>
          {(['dikopi', 'kolektiva', 'imagineer'] as BrandId[]).map((b) => (
            <button
              key={b}
              onClick={() => onBrandChange(b)}
              className={`filter-btn ${activeBrand === b ? 'active' : ''}`}
            >
              {b === 'dikopi' ? '☕ Dikopi' : b === 'kolektiva' ? '🛍️ Kolektiva' : '🚀 Imagineer'}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <select
            className="form-select"
            value={selectedPeriode}
            onChange={(e) => setSelectedPeriode(e.target.value)}
            style={{ fontSize: '12px', padding: '6px 12px', width: 'auto' }}
          >
            {availableMonths.map((m) => (
              <option key={m} value={m}>
                {getBulanLabel(m)}
              </option>
            ))}
          </select>

          {activeBrand !== 'dikopi' && onAddTransaction && (
            <button className="btn btn-primary btn-sm" onClick={onAddTransaction}>
              + Transaksi
            </button>
          )}
        </div>
      </div>

      {/* ======================================================= */}
      {/* ── MODE KHUSUS: DIKOPI (MATCHING IMAGE 2 & 3) ──────── */}
      {/* ======================================================= */}
      {activeBrand === 'dikopi' ? (
        <>
          {/* Setup Saldo Awal Banner if !hasSetup */}
          {!hasSetup && (
            <div style={{ background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.3)', borderRadius: '12px', padding: '16px 20px', marginBottom: '4px' }}>
              <div style={{ fontWeight: 700, fontSize: '13.5px', marginBottom: '12px', color: 'var(--yellow)' }}>
                💵 Setup Saldo Awal {getBulanLabel(selectedPeriode)}
              </div>
              <div className="form-row" style={{ marginBottom: '12px' }}>
                <div className="form-group">
                  <label className="form-label">🪙 Cash di Laci (Rp)</label>
                  <input
                    className="form-input"
                    value={setupCashInput}
                    onChange={(e) => setSetupCashInput(fmtInputDots(e.target.value))}
                    placeholder="0"
                    style={{ fontFamily: 'DM Mono' }}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">🏦 Saldo Rekening (Rp)</label>
                  <input
                    className="form-input"
                    value={setupRekInput}
                    onChange={(e) => setSetupRekInput(fmtInputDots(e.target.value))}
                    placeholder="0"
                    style={{ fontFamily: 'DM Mono' }}
                  />
                </div>
              </div>
              <button className="btn btn-primary btn-sm" onClick={handleSaveQuickSaldoAwal}>
                Simpan Saldo Awal
              </button>
            </div>
          )}

          {/* Saldo Cards (5-Column Grid) */}
          <div className="grid-5" style={{ marginBottom: '4px' }}>
            {/* 1. Cash di Laci */}
            <div className="keu-card" style={{ borderColor: 'rgba(16, 185, 129, 0.3)' }}>
              <div className="keu-label">🪙 CASH DI LACI</div>
              <div
                className={`keu-val ${dikopiStats.cash >= 0 ? 'keu-green' : 'keu-red'}`}
                style={{ fontSize: '20px' }}
              >
                {fmtRp(dikopiStats.cash)}
              </div>
            </div>

            {/* 2. Saldo Rekening */}
            <div className="keu-card" style={{ borderColor: 'rgba(56, 189, 248, 0.3)' }}>
              <div className="keu-label">🏦 SALDO REKENING</div>
              <div
                className={`keu-val ${dikopiStats.rek >= 0 ? '' : 'keu-red'}`}
                style={{ fontSize: '20px', color: 'var(--accent)' }}
              >
                {fmtRp(dikopiStats.rek)}
              </div>
            </div>

            {/* 3. Total Aset Liquid */}
            <div
              className="keu-card"
              style={{
                border: `1.5px solid ${dikopiStats.totalLiquid >= 0 ? 'rgba(16, 185, 129, 0.45)' : 'rgba(244, 63, 94, 0.45)'}`,
                background: 'rgba(16, 185, 129, 0.03)'
              }}
            >
              <div className="keu-label">💰 TOTAL ASET LIQUID</div>
              <div
                className={`keu-val ${dikopiStats.totalLiquid >= 0 ? 'keu-green' : 'keu-red'}`}
                style={{ fontSize: '20px' }}
              >
                {fmtRp(dikopiStats.totalLiquid)}
              </div>
            </div>

            {/* 4. Marketplace Wallet Pending */}
            <div
              className="keu-card"
              style={{
                borderColor: 'rgba(245, 158, 11, 0.35)',
                background: 'rgba(245, 158, 11, 0.03)'
              }}
            >
              <div className="keu-label" style={{ color: 'var(--yellow)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span>🛒 MARKETPLACE ESCROW</span>
                <span style={{ fontSize: '9.5px', background: 'rgba(245, 158, 11, 0.2)', padding: '1px 6px', borderRadius: '99px' }}>
                  PENDING
                </span>
              </div>
              <div className="keu-val" style={{ fontSize: '20px', color: 'var(--yellow)' }}>
                {fmtRp(dikopiStats.totalMarketplace)}
              </div>
              <div style={{ fontSize: '9px', color: 'var(--muted)', marginTop: '3px', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                <span>Shopee: {fmtRp(dikopiStats.shopee)}</span>
                <span>GoFood: {fmtRp(dikopiStats.gofood)}</span>
                <span>TikTok: {fmtRp(dikopiStats.tiktok)}</span>
              </div>
            </div>

            {/* 5. Total Aset Inc. Marketplace */}
            <div
              className="keu-card"
              style={{
                borderColor: 'rgba(168, 85, 247, 0.35)',
                background: 'rgba(168, 85, 247, 0.03)'
              }}
            >
              <div className="keu-label" style={{ color: 'var(--purple)' }}>
                🏛️ TOTAL ASET (INC. MARKETPLACE)
              </div>
              <div className="keu-val" style={{ fontSize: '20px', color: 'var(--purple)' }}>
                {fmtRp(dikopiStats.totalAsetIncShopee)}
              </div>
            </div>
          </div>

          {/* Financial Performance Strip with integrated Saldo Awal */}
          <div
            className="keu-summary-strip"
            style={{
              marginTop: 0,
              marginBottom: '6px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '14px 22px'
            }}
          >
            <div style={{ display: 'flex', gap: '28px', alignItems: 'center', flexWrap: 'wrap' }}>
              <div className="keu-strip-item">
                <div className="keu-strip-label">☕ PENJUALAN</div>
                <div className="keu-strip-val keu-green" style={{ fontSize: '16px' }}>
                  {fmtRp(dikopiStats.totalPenjualan)}
                </div>
              </div>
              <div className="keu-strip-item">
                <div className="keu-strip-label">📦 TOTAL HPP</div>
                <div className="keu-strip-val" style={{ fontSize: '16px', color: 'var(--yellow)' }}>
                  −{fmtRp(dikopiStats.totalHPP)}
                </div>
              </div>
              <div className="keu-strip-item">
                <div className="keu-strip-label">💸 OPERASIONAL</div>
                <div className="keu-strip-val keu-red" style={{ fontSize: '16px' }}>
                  −{fmtRp(dikopiStats.totalOps)}
                </div>
              </div>
              <div className="keu-strip-item" style={{ borderLeft: '1px solid var(--border)', paddingLeft: '24px' }}>
                <div className="keu-strip-label">✨ NET PROFIT (ESTIMASI)</div>
                <div
                  className={`keu-strip-val ${dikopiStats.netProfit >= 0 ? 'keu-green' : 'keu-red'}`}
                  style={{ fontSize: '18px' }}
                >
                  {fmtRp(dikopiStats.netProfit)}
                </div>
              </div>
            </div>

            {hasSetup && (
              <div style={{ fontSize: '12px', color: 'var(--muted)', fontFamily: 'DM Mono', display: 'flex', alignItems: 'center', gap: '10px', background: 'var(--surface)', padding: '6px 14px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                <span>
                  Saldo awal: 🪙 Cash <strong>{fmtRp(saldoCashAwal)}</strong> · 🏦 Rek <strong>{fmtRp(saldoRekAwal)}</strong>
                </span>
                <button
                  className="btn btn-ghost btn-sm"
                  style={{ padding: '2px 8px', fontSize: '11px' }}
                  onClick={() => setIsEditSaldoOpen(true)}
                  title="Ubah Saldo Awal"
                >
                  ✏️ Ubah
                </button>
              </div>
            )}
          </div>

          {/* Quick Actions Toolbar (Grouped logically) */}
          <div className="keu-action-toolbar" style={{ marginBottom: '16px' }}>
            {/* Grup 1: Transaksi Harian */}
            <div className="keu-btn-group">
              <button
                className="btn btn-sm btn-action-penjualan"
                onClick={() => setIsPenjualanOpen(true)}
              >
                ☕ + Penjualan
              </button>
              <button
                className="btn btn-ghost btn-sm btn-action-hpp"
                onClick={() => setIsPengeluaranHppOpen(true)}
              >
                📦 + HPP
              </button>
              <button
                className="btn btn-ghost btn-sm btn-action-ops"
                onClick={() => setIsPengeluaranOpsOpen(true)}
              >
                💸 + Pengeluaran
              </button>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => setIsMutasiOpen(true)}
              >
                🔄 Mutasi Kas
              </button>
            </div>

            <div className="keu-toolbar-divider"></div>

            {/* Grup 2: Kas & Modal */}
            <div className="keu-btn-group">
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => setIsCairShopeeOpen(true)}
              >
                🛒 Cairkan Shopee
              </button>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => setIsSuntikanOpen(true)}
              >
                💉 Suntikan Modal
              </button>
            </div>

            <div className="keu-toolbar-divider"></div>

            {/* Grup 3: Ekuitas & Aset */}
            <div className="keu-btn-group">
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => setIsPriveOpen(true)}
                title="Mengurangi uang usaha, tidak mengurangi profit."
              >
                💸 Prive
              </button>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => setIsBeliAsetOpen(true)}
                title="Mengurangi uang usaha dan menambah aset, tidak mengurangi profit."
              >
                📦 Beli Aset
              </button>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => setIsBagiLabaOpen(true)}
                title="Pembagian keuntungan kepada pemilik."
              >
                💰 Bagi Laba
              </button>
            </div>

            <div className="keu-toolbar-divider"></div>

            {/* Grup 4: Cloud Sync */}
            <div className="keu-btn-group" style={{ marginLeft: 'auto' }}>
              {onTriggerSync && (
                <button
                  className="btn btn-ghost btn-sm btn-cloud-pull"
                  onClick={onTriggerSync}
                  title="Tarik Transaksi Kasir dari Cloud"
                >
                  📥 Tarik Kasir
                </button>
              )}
              {onPushCloud && (
                <button
                  className="btn btn-ghost btn-sm btn-cloud-push"
                  onClick={onPushCloud}
                  title="Push / Sync Rekonsiliasi ke Cloud"
                >
                  📤 Sync Cloud
                </button>
              )}
            </div>
          </div>

          {/* Daily Blocks (Grouped by Date) */}
          {dayGroups.length === 0 ? (
            <div className="empty">
              <div className="empty-icon">☕</div>
              Belum ada transaksi Dikopi di {getBulanLabel(selectedPeriode)}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {dayGroups.map((grp) => (
                <div
                  key={grp.dateStr}
                  style={{
                    background: 'var(--surface2)',
                    border: '1px solid var(--border)',
                    borderRadius: '10px',
                    overflow: 'hidden'
                  }}
                >
                  {/* Day Header */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      background: 'var(--surface3)',
                      borderBottom: '1px solid var(--border)',
                      flexWrap: 'wrap',
                      gap: '6px'
                    }}
                  >
                    <span style={{ fontWeight: 700, fontSize: '13px' }}>{grp.label}</span>
                    <div style={{ display: 'flex', gap: '10px', fontSize: '11px', fontFamily: 'DM Mono', flexWrap: 'wrap', alignItems: 'center' }}>
                      {grp.dPenjualan > 0 && (
                        <span style={{ color: '#4cc9a0' }}>+{fmtRp(grp.dPenjualan)}</span>
                      )}
                      {grp.dHPP > 0 && (
                        <span style={{ color: '#f5a623' }}>−{fmtRp(grp.dHPP)}</span>
                      )}
                      {grp.dOps > 0 && (
                        <span style={{ color: 'var(--red)' }}>−{fmtRp(grp.dOps)}</span>
                      )}
                      {grp.dMutasiCount > 0 && (
                        <span style={{ color: 'var(--accent)' }}>↔ mutasi</span>
                      )}
                      <span
                        style={{
                          color: grp.dNet >= 0 ? '#4cc9a0' : 'var(--red)',
                          fontWeight: 700,
                          borderLeft: '1px solid var(--border)',
                          paddingLeft: '10px'
                        }}
                      >
                        = {fmtRp(grp.dNet)}
                      </span>
                    </div>
                  </div>

                  {/* Day Rows */}
                  <div style={{ padding: '4px 14px' }}>
                    {grp.txns.map((t) => {
                      const n = Number(t.nominal) || 0;
                      const src = t.sumber || 'cash';
                      const srcIcon =
                        src === 'cash'
                          ? '🪙'
                          : src === 'shopee'
                          ? '🧡'
                          : src === 'gofood'
                          ? '🟢'
                          : src === 'tiktok'
                          ? '📱'
                          : '🏦';

                      // Handle Mutasi
                      if (t.tipe === 'mutasi') {
                        let badge = 'MUTASI';
                        let mutasiColor = 'var(--accent)';
                        let mutasiBg = 'rgba(77, 158, 247, 0.1)';
                        if (t.sumber === 'shopee2rek' || t.sumber === 'gofood2rek' || t.sumber === 'tiktok2rek') {
                          badge = 'CAIR';
                          mutasiColor = '#ff7900';
                          mutasiBg = 'rgba(255, 121, 0, 0.1)';
                        }
                        const arrow =
                          t.sumber === 'shopee2rek'
                            ? '🧡→🏦'
                            : t.sumber === 'gofood2rek'
                            ? '🟢→🏦'
                            : t.sumber === 'tiktok2rek'
                            ? '📱→🏦'
                            : t.sumber === 'rek2shopee'
                            ? '🏦→🧡'
                            : '🪙↔🏦';

                        return (
                          <div
                            key={t.id}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '10px',
                              padding: '8px 0',
                              borderBottom: '1px solid var(--border)'
                            }}
                          >
                            <span
                              style={{
                                fontSize: '9px',
                                padding: '2px 7px',
                                borderRadius: '99px',
                                background: mutasiBg,
                                color: mutasiColor,
                                fontFamily: 'DM Mono',
                                fontWeight: 700
                              }}
                            >
                              {badge}
                            </span>
                            <span style={{ fontSize: '12px', color: 'var(--text2)', flex: 1 }}>
                              {arrow} {t.deskripsi || 'Mutasi'}
                            </span>
                            <span
                              style={{
                                fontFamily: 'DM Mono',
                                fontSize: '12px',
                                color: mutasiColor,
                                whiteSpace: 'nowrap'
                              }}
                            >
                              ↔ {fmtRp(n)}
                            </span>
                            <div style={{ display: 'flex', gap: '2px' }}>
                              <button
                                className="tbl-action-btn tbl-del"
                                onClick={() => handleDelete(t)}
                                title="Hapus transaksi"
                              >
                                🗑️
                              </button>
                            </div>
                          </div>
                        );
                      }

                      // Regular Transactions
                      const tc = getTxnClass(t);
                      const isHPP = tc === 'hpp';
                      const isSuntikan = tc === 'capital_injection';
                      const isModal = t.kategori === 'Tambahan Modal';
                      const isPenjualan = tc === 'revenue';
                      const isShopee = (src === 'shopee' || t._channel === 'shopeefood') && t.tipe === 'masuk';
                      const isGofood = (src === 'gofood' || t._channel === 'gofood') && t.tipe === 'masuk';
                      const isTiktok = (src === 'tiktok' || t._channel === 'tiktokgo') && t.tipe === 'masuk';
                      const isPrive = tc === 'owner_draw';
                      const isLaba = tc === 'profit_distribution';
                      const isAset = tc === 'asset_purchase';

                      const color = isPrive
                        ? '#ff9f43'
                        : isLaba
                        ? '#c0392b'
                        : isAset
                        ? '#8b6fff'
                        : isSuntikan || isModal
                        ? '#8b6fff'
                        : isShopee
                        ? '#ee4d2d'
                        : isGofood
                        ? '#00aa13'
                        : isTiktok
                        ? '#00f2fe'
                        : isPenjualan
                        ? '#4cc9a0'
                        : isHPP
                        ? '#f5a623'
                        : 'var(--red)';

                      const badge = isPrive
                        ? 'PRIVE'
                        : isLaba
                        ? 'LABA'
                        : isAset
                        ? 'ASET'
                        : isSuntikan
                        ? 'DANA'
                        : isModal
                        ? 'MODAL'
                        : isShopee
                        ? 'SHOPEE'
                        : isGofood
                        ? 'GOFOOD'
                        : isTiktok
                        ? 'TIKTOK'
                        : isPenjualan
                        ? 'JUAL'
                        : isHPP
                        ? 'HPP'
                        : 'OPS';

                      const badgeBg = isPrive
                        ? 'rgba(255, 159, 67, 0.1)'
                        : isLaba
                        ? 'rgba(192, 57, 43, 0.1)'
                        : isAset || isSuntikan || isModal
                        ? 'rgba(139, 111, 255, 0.1)'
                        : isShopee
                        ? 'rgba(238, 77, 45, 0.12)'
                        : isGofood
                        ? 'rgba(0, 170, 19, 0.12)'
                        : isTiktok
                        ? 'rgba(0, 242, 254, 0.12)'
                        : isPenjualan
                        ? 'rgba(76, 201, 160, 0.1)'
                        : isHPP
                        ? 'rgba(245, 166, 35, 0.1)'
                        : 'rgba(212, 96, 58, 0.1)';

                      const prefix = t.tipe === 'masuk' ? '+' : '−';
                      const hasEdit = Boolean(t.updated_at);
                      const createdStr = fmtTimestamp(t.created_at);
                      const updatedStr = hasEdit ? fmtTimestamp(t.updated_at) : null;
                      const clockTitle = hasEdit
                        ? `Diinput: ${createdStr}\nTerakhir diedit: ${updatedStr}`
                        : `Diinput: ${createdStr}`;

                      const timeStr = t.created_at
                        ? new Date(t.created_at).toLocaleTimeString('id-ID', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })
                        : '';
                      const editTimeStr = hasEdit && t.updated_at
                        ? ` · ✏️ ${new Date(t.updated_at).toLocaleTimeString('id-ID', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}`
                        : '';

                      return (
                        <div
                          key={t.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            padding: '8px 0',
                            borderBottom: '1px solid var(--border)'
                          }}
                        >
                          {/* Badge Pill */}
                          <span
                            style={{
                              fontSize: '9px',
                              padding: '2px 7px',
                              borderRadius: '99px',
                              background: badgeBg,
                              color,
                              fontFamily: 'DM Mono',
                              fontWeight: 700
                            }}
                          >
                            {badge}
                          </span>

                          {/* Source Icon */}
                          <span style={{ fontSize: '11px' }}>{srcIcon}</span>

                          {/* Description & Metas */}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: '12.5px', color: 'var(--text2)', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                              <span>{t.deskripsi || t.kategori}</span>
                              {t._channel && (
                                <span
                                  style={{
                                    fontSize: '9px',
                                    padding: '1px 6px',
                                    borderRadius: '99px',
                                    background:
                                      t._channel === 'gofood'
                                        ? 'rgba(0, 170, 19, 0.15)'
                                        : t._channel === 'shopeefood'
                                        ? 'rgba(238, 77, 45, 0.15)'
                                        : t._channel === 'tiktokgo'
                                        ? 'rgba(0, 242, 254, 0.15)'
                                        : t._channel === 'cfd'
                                        ? 'rgba(245, 158, 11, 0.15)'
                                        : 'rgba(76, 201, 160, 0.15)',
                                    color:
                                      t._channel === 'gofood'
                                        ? '#00aa13'
                                        : t._channel === 'shopeefood'
                                        ? '#ee4d2d'
                                        : t._channel === 'tiktokgo'
                                        ? '#00f2fe'
                                        : t._channel === 'cfd'
                                        ? '#f59e0b'
                                        : '#4cc9a0',
                                    fontFamily: 'DM Mono',
                                    fontWeight: 700
                                  }}
                                >
                                  {t._channel.toUpperCase()}
                                </span>
                              )}
                              {t.nominalGross && t.adminFee ? (
                                <span style={{ fontSize: '9px', color: 'var(--muted)', fontFamily: 'DM Mono' }}>
                                  (Bruto {fmtRp(t.nominalGross)} · Fee −{fmtRp(t.adminFee)})
                                </span>
                              ) : null}
                              {t._source === 'kasir_event' && (
                                <span
                                  style={{
                                    fontSize: '9px',
                                    padding: '1px 5px',
                                    borderRadius: '99px',
                                    background: 'rgba(56, 189, 248, 0.12)',
                                    color: 'var(--accent)',
                                    fontFamily: 'DM Mono'
                                  }}
                                >
                                  Kasir Event
                                </span>
                              )}
                              {t.items && t.items.length > 0 && (
                                <span
                                  style={{
                                    fontSize: '9px',
                                    padding: '1px 5px',
                                    borderRadius: '99px',
                                    background: 'rgba(245, 158, 11, 0.12)',
                                    color: 'var(--yellow)',
                                    fontFamily: 'DM Mono'
                                  }}
                                >
                                  {t.items.length} item
                                </span>
                              )}
                              {hasEdit && (
                                <span
                                  style={{
                                    fontSize: '9px',
                                    padding: '1px 5px',
                                    borderRadius: '99px',
                                    background: 'rgba(255, 156, 0, 0.12)',
                                    color: '#ffb347',
                                    fontFamily: 'DM Mono'
                                  }}
                                >
                                  edited
                                </span>
                              )}
                            </div>
                            {timeStr && (
                              <div style={{ fontSize: '9.5px', color: 'var(--muted)', fontFamily: 'DM Mono', marginTop: '1px' }}>
                                {timeStr}
                                {editTimeStr}
                              </div>
                            )}
                          </div>

                          {/* Nominal */}
                          <span
                            style={{
                              fontFamily: 'DM Mono',
                              fontSize: '13px',
                              fontWeight: 700,
                              color,
                              whiteSpace: 'nowrap'
                            }}
                          >
                            {prefix}{fmtRp(n)}
                          </span>

                          {/* Actions */}
                          <div style={{ display: 'flex', gap: '2px', alignItems: 'center' }}>
                            {t.nota && (
                              <button
                                className="tbl-action-btn"
                                onClick={() => setPreviewTxn(t)}
                                title="Lihat Nota"
                              >
                                👁
                              </button>
                            )}
                            <button
                              className="tbl-action-btn"
                              style={{ color: hasEdit ? '#ffb347' : 'var(--muted)' }}
                              onClick={() => setHistoryTxn(t)}
                              title={clockTitle}
                            >
                              🕐
                            </button>
                            <button
                              className="tbl-action-btn tbl-edit"
                              onClick={() => setEditingTxn(t)}
                              title="Edit Transaksi"
                            >
                              ✏️
                            </button>
                            <button
                              className="tbl-action-btn tbl-del"
                              onClick={() => handleDelete(t)}
                              title="Hapus Transaksi"
                            >
                              🗑️
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        /* ======================================================= */
        /* ── MODE STANDAR (KOLEKTIVA, IMAGINEER) ─────────────── */
        /* ======================================================= */
        <>
          {standardRows.length === 0 ? (
            <div className="empty">
              <div className="empty-icon">📒</div>
              Belum ada transaksi di {getBulanLabel(selectedPeriode)}
              <br />
              {onAddTransaction && (
                <button
                  className="btn btn-primary btn-sm"
                  style={{ marginTop: '12px' }}
                  onClick={onAddTransaction}
                >
                  + Tambah Transaksi
                </button>
              )}
            </div>
          ) : (
            <>
              <div style={{ overflowX: 'auto', borderRadius: '10px', border: '1px solid var(--border)' }}>
                <table className="keu-buku-table" style={{ width: '100%' }}>
                  <thead>
                    <tr>
                      <th style={{ width: '30px' }}>No</th>
                      <th>Tanggal</th>
                      <th>Deskripsi</th>
                      <th>Kategori</th>
                      <th style={{ textAlign: 'right' }}>Masuk (Rp)</th>
                      <th style={{ textAlign: 'right' }}>Keluar (Rp)</th>
                      <th style={{ textAlign: 'right' }}>Saldo</th>
                      <th style={{ width: '80px', textAlign: 'center' }}>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {standardRows.map(({ t, index, masuk, keluar, saldo, catGroup }) => {
                      const hasEdit = Boolean(t.updated_at);
                      const createdStr = fmtTimestamp(t.created_at);
                      const updatedStr = hasEdit ? fmtTimestamp(t.updated_at) : null;
                      const clockTitle = hasEdit
                        ? `Diinput: ${createdStr}\nTerakhir diedit: ${updatedStr}`
                        : `Diinput: ${createdStr}`;

                      return (
                        <tr key={t.id}>
                          <td style={{ color: 'var(--muted)', fontFamily: 'DM Mono' }}>{index}</td>
                          <td style={{ fontFamily: 'DM Mono', fontSize: '11px', whiteSpace: 'nowrap' }}>
                            {t.tanggal}
                            {t.created_at && (
                              <div style={{ fontSize: '9px', color: 'var(--muted)', marginTop: '2px' }}>
                                {new Date(t.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                                {hasEdit && ' · ✏️ edited'}
                              </div>
                            )}
                          </td>
                          <td style={{ maxWidth: '240px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span>{t.deskripsi}</span>
                              {hasEdit && (
                                <span style={{ fontSize: '9px', padding: '1px 5px', borderRadius: '99px', background: 'rgba(255,156,0,0.12)', color: '#ffb347', fontFamily: 'DM Mono' }}>
                                  edited
                                </span>
                              )}
                            </div>
                          </td>
                          <td>
                            <span className={`keu-cat-pill keu-cat-${catGroup}`}>{t.kategori}</span>
                          </td>
                          <td className="keu-masuk" style={{ textAlign: 'right', fontFamily: 'DM Mono' }}>
                            {masuk ? fmtRp(masuk) : '—'}
                          </td>
                          <td className="keu-keluar" style={{ textAlign: 'right', fontFamily: 'DM Mono' }}>
                            {keluar ? fmtRp(keluar) : '—'}
                          </td>
                          <td
                            className={saldo >= 0 ? 'keu-saldo-pos' : 'keu-saldo-neg'}
                            style={{ textAlign: 'right', fontFamily: 'DM Mono', fontWeight: 700 }}
                          >
                            {fmtRp(saldo)}
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <div style={{ display: 'flex', gap: '2px', justifyContent: 'center' }}>
                              {t.nota && (
                                <button
                                  className="tbl-action-btn"
                                  onClick={() => setPreviewTxn(t)}
                                  title="Lihat Nota"
                                >
                                  👁
                                </button>
                              )}
                              <button
                                className="tbl-action-btn"
                                style={{ color: hasEdit ? '#ffb347' : 'var(--muted)' }}
                                onClick={() => setHistoryTxn(t)}
                                title={clockTitle}
                              >
                                🕐
                              </button>
                              <button
                                className="tbl-action-btn tbl-edit"
                                onClick={() => setEditingTxn(t)}
                                title="Edit Transaksi"
                              >
                                ✏️
                              </button>
                              <button
                                className="tbl-action-btn tbl-del"
                                onClick={() => handleDelete(t)}
                                title="Hapus Transaksi"
                              >
                                🗑️
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Standard Summary Strip */}
              <div className="keu-summary-strip">
                <div className="keu-strip-item">
                  <div className="keu-strip-label">Total Masuk</div>
                  <div className="keu-strip-val keu-green">{fmtRp(standardSummary.revenue)}</div>
                </div>
                <div className="keu-strip-item">
                  <div className="keu-strip-label">HPP</div>
                  <div className="keu-strip-val" style={{ color: '#f5a623' }}>{fmtRp(standardSummary.hpp)}</div>
                </div>
                <div className="keu-strip-item">
                  <div className="keu-strip-label">Expense</div>
                  <div className="keu-strip-val keu-red">{fmtRp(standardSummary.expense)}</div>
                </div>
                <div className="keu-strip-item">
                  <div className="keu-strip-label">Net Profit</div>
                  <div className={`keu-strip-val ${standardSummary.netProfit >= 0 ? 'keu-green' : 'keu-red'}`}>
                    {fmtRp(standardSummary.netProfit)}
                  </div>
                </div>
              </div>
            </>
          )}
        </>
      )}

      {/* ======================================================= */}
      {/* ── DIALOG MODALS ────────────────────────────────────── */}
      {/* ======================================================= */}
      {/* 1. Form Penjualan Dikopi */}
      {isPenjualanOpen && (
        <DikopiPenjualanModal
          onClose={() => setIsPenjualanOpen(false)}
          resepList={resepList}
          bahanList={bahanList}
          onSave={async (trx) => {
            await onSaveTransaction(trx, 'dikopi');
          }}
        />
      )}

      {/* 2. Form HPP Dikopi */}
      {isPengeluaranHppOpen && (
        <DikopiPengeluaranModal
          onClose={() => setIsPengeluaranHppOpen(false)}
          mode="hpp"
          onSave={async (trx) => {
            await onSaveTransaction(trx, 'dikopi');
          }}
        />
      )}

      {/* 3. Form Operasional Dikopi */}
      {isPengeluaranOpsOpen && (
        <DikopiPengeluaranModal
          onClose={() => setIsPengeluaranOpsOpen(false)}
          mode="ops"
          onSave={async (trx) => {
            await onSaveTransaction(trx, 'dikopi');
          }}
        />
      )}

      {/* 4. Form Mutasi Kas Dikopi */}
      {isMutasiOpen && (
        <DikopiMutasiModal
          onClose={() => setIsMutasiOpen(false)}
          onSave={async (trx) => {
            await onSaveTransaction(trx, 'dikopi');
          }}
        />
      )}

      {/* 5. Form Cairkan Shopee */}
      {isCairShopeeOpen && (
        <DikopiCairShopeeModal
          onClose={() => setIsCairShopeeOpen(false)}
          onSaveBatch={async (items) => {
            if (onSaveBatchTransactions) {
              await onSaveBatchTransactions(items, 'dikopi');
            } else {
              for (const it of items) {
                await onSaveTransaction(it, 'dikopi');
              }
            }
          }}
        />
      )}

      {/* 6. Form Suntikan Modal */}
      {isSuntikanOpen && (
        <DikopiSuntikanModal
          onClose={() => setIsSuntikanOpen(false)}
          onSave={async (trx) => {
            await onSaveTransaction(trx, 'dikopi');
          }}
        />
      )}

      {/* 7. Form Prive */}
      {isPriveOpen && (
        <DikopiPriveModal
          onClose={() => setIsPriveOpen(false)}
          onSave={async (trx) => {
            await onSaveTransaction(trx, 'dikopi');
          }}
        />
      )}

      {/* 8. Form Beli Aset */}
      {isBeliAsetOpen && (
        <DikopiBeliAsetModal
          onClose={() => setIsBeliAsetOpen(false)}
          onSave={async (trx, newAset) => {
            await onSaveTransaction(trx, 'dikopi', newAset);
          }}
        />
      )}

      {/* 9. Form Bagi Laba */}
      {isBagiLabaOpen && (
        <DikopiDistribusiLabaModal
          onClose={() => setIsBagiLabaOpen(false)}
          onSave={async (trx) => {
            await onSaveTransaction(trx, 'dikopi');
          }}
        />
      )}

      {/* 10. Edit Saldo Awal Modal */}
      {isEditSaldoOpen && (
        <EditSaldoAwalModal
          onClose={() => setIsEditSaldoOpen(false)}
          periode={selectedPeriode}
          initialCash={saldoCashAwal}
          initialRek={saldoRekAwal}
          onSave={async (cash, rek) => {
            await onSaveSaldoAwal(selectedPeriode, cash, rek);
          }}
        />
      )}

      {/* 11. Edit Transaction Modal */}
      {editingTxn && (
        <EditTransactionModal
          onClose={() => setEditingTxn(null)}
          brand={activeBrand}
          transaksi={editingTxn}
          onSave={async (updated) => {
            await onUpdateTransaction(updated, activeBrand);
          }}
        />
      )}

      {/* 12. History Modal */}
      {historyTxn && (
        <TxnHistoryModal
          onClose={() => setHistoryTxn(null)}
          brand={activeBrand}
          transaksi={historyTxn}
          historyList={historyList}
          onRestore={async (snapshot) => {
            if (onRestoreSnapshot) {
              await onRestoreSnapshot(snapshot, activeBrand);
            } else {
              await onUpdateTransaction(snapshot, activeBrand);
            }
          }}
        />
      )}

      {/* 13. Preview Nota Modal */}
      {previewTxn && (
        <PreviewNotaModal
          onClose={() => setPreviewTxn(null)}
          transaksi={previewTxn}
        />
      )}
    </div>
  );
};
