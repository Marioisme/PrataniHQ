import React, { useState, useMemo } from 'react';
import type {
  ResepItem,
  BahanItem,
  TransaksiItem,
  ResepGroupItem,
  ResepIngredient
} from '../../types';
import { computeInventorySummary } from '../../lib/inventoryEngine';
import {
  fmtRp,
  bahanHargaPerSatuan,
  hitungHPPResep,
  resepHasWarning,
  marketplaceMarginBadge,
  formatNumericInput,
  parseNumericInput,
  RESEP_GROUPS_DEFAULT,
  DEFAULT_CHANNELS,
  CHANNEL_LABEL_DEFAULT,
  DEFAULT_TIKTOK_ADMIN_RATE,
  hitungChannelNet
} from './resepUtils';
import {
  AddEditResepModal,
  AddEditComboModal,
  AddComboItemModal,
  CopyResepModal,
  AddIngredientModal,
  EditIngredientModal,
  AddEditBahanModal,
  QuickRestockModal,
  ManageChannelsModal,
  ManageKategoriModal
} from './ResepModals';

interface ResepViewProps {
  resepList: ResepItem[];
  bahanList: BahanItem[];
  transaksiList?: TransaksiItem[];
  keuMeta?: Record<string, any>;
  onSaveResep: (resep: ResepItem) => Promise<void> | void;
  onUpdateResep: (resep: ResepItem) => Promise<void> | void;
  onDeleteResep: (id: number | string) => Promise<void> | void;
  onReorderResep: (newResepList: ResepItem[]) => Promise<void> | void;
  onSaveBahan: (bahan: BahanItem) => Promise<void> | void;
  onUpdateBahan: (bahan: BahanItem) => Promise<void> | void;
  onDeleteBahan: (id: number | string) => Promise<void> | void;
  onSaveResepGroups: (groups: ResepGroupItem[]) => Promise<void> | void;
  onSaveChannels: (channels: string[], labels: Record<string, string>) => Promise<void> | void;
  onPushResepCloud: () => Promise<void> | void;
  onSaveTransaction?: (trx: TransaksiItem) => Promise<void> | void;
  showToast?: (msg: string) => void;
}

// ── DETAIL CARD SUBCOMPONENT (KEY-BASED FRESH STATE) ──
interface ActiveResepDetailCardProps {
  activeResep: ResepItem;
  resepList: ResepItem[];
  bahanMap: Map<string, BahanItem>;
  onUpdateResep: (r: ResepItem) => void;
  onDeleteResep: (id: number | string) => void;
  onEditResep: (r: ResepItem) => void;
  onEditCombo: (r: ResepItem) => void;
  onAddComboItem: (r: ResepItem) => void;
  onCopyResep: (r: ResepItem) => void;
  onAddIngredient: (r: ResepItem) => void;
  onEditIngredient: (resep: ResepItem, ing: ResepIngredient) => void;
  onRemoveIngredient: (resep: ResepItem, bahanId: number | string) => void;
  onRemoveComboItem: (combo: ResepItem, resepId: number | string) => void;
  showToast?: (msg: string) => void;
}

const ActiveResepDetailCard: React.FC<ActiveResepDetailCardProps> = ({
  activeResep,
  resepList,
  bahanMap,
  onUpdateResep,
  onDeleteResep,
  onEditResep,
  onEditCombo,
  onAddComboItem,
  onCopyResep,
  onAddIngredient,
  onEditIngredient,
  onRemoveIngredient,
  onRemoveComboItem,
  showToast
}) => {
  const [quickHargaJual, setQuickHargaJual] = useState<string>(
    activeResep.hargaJual ? activeResep.hargaJual.toLocaleString('id-ID') : ''
  );
  const [quickHargaJualLarge, setQuickHargaJualLarge] = useState<string>(
    activeResep.hargaJualLarge ? activeResep.hargaJualLarge.toLocaleString('id-ID') : ''
  );
  const [quickKomisiAfiliate, setQuickKomisiAfiliate] = useState<string>(
    activeResep.komisiAfiliate !== undefined ? String(activeResep.komisiAfiliate) : '0'
  );

  const handleSaveQuickHargaJual = () => {
    const newHarga = parseNumericInput(quickHargaJual);
    const newHargaLarge = parseNumericInput(quickHargaJualLarge) || undefined;
    const currentHpp = hitungHPPResep(activeResep, resepList, bahanMap);
    const currentHppLarge = activeResep.hppSnapshotLarge || (currentHpp > 0 ? currentHpp + 1200 : undefined);
    const updated: ResepItem = {
      ...activeResep,
      hargaJual: newHarga,
      hargaJualLarge: newHargaLarge,
      hppSnapshot: currentHpp,
      hppSnapshotLarge: currentHppLarge
    };
    onUpdateResep(updated);
    if (showToast) showToast('✅ Harga jual Regular & Large diperbarui!');
  };

  const handleSaveQuickKomisiAfiliate = () => {
    let rate = parseFloat(quickKomisiAfiliate.replace(',', '.')) || 0;
    if (rate < 0) rate = 0;
    if (rate > 100) rate = 100;
    const updated: ResepItem = {
      ...activeResep,
      komisiAfiliate: rate
    };
    onUpdateResep(updated);
    if (showToast) showToast('✅ Komisi afiliate disimpan!');
  };

  if (activeResep.isCombo) {
    const hpp = hitungHPPResep(activeResep, resepList, bahanMap);
    const hasWarn = resepHasWarning(activeResep, resepList, bahanMap);
    const hargaJual = activeResep.hargaJual || 0;
    const margin = hargaJual ? Math.round(((hargaJual - hpp) / hargaJual) * 100) : 0;

    return (
      <div className="card">
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '14px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                fontSize: '11px',
                padding: '2px 8px',
                borderRadius: '99px',
                background: 'rgba(255,121,0,0.12)',
                color: '#ff7900',
                fontFamily: 'DM Mono',
                fontWeight: 700
              }}
            >
              COMBO
            </span>
            <div style={{ fontSize: '16px', fontWeight: 700 }}>{activeResep.nama}</div>
          </div>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button className="btn btn-ghost btn-sm" onClick={() => onEditCombo(activeResep)}>
              ✏️ Edit
            </button>
            <button className="btn btn-ghost btn-sm" onClick={() => onAddComboItem(activeResep)}>
              + Menu
            </button>
            <button
              className="btn btn-danger btn-sm"
              onClick={() => {
                if (confirm(`Hapus bundle "${activeResep.nama}"?`)) {
                  onDeleteResep(activeResep.id);
                }
              }}
            >
              🗑️
            </button>
          </div>
        </div>

        {hasWarn && (
          <div className="resep-warning" style={{ marginBottom: '12px' }}>
            <span>⚠️</span>
            <div>
              HPP member berubah — total HPP sekarang <strong>{fmtRp(hpp)}</strong> (snapshot:{' '}
              {fmtRp(activeResep.hppSnapshot || 0)}). Cek harga jual!
            </div>
          </div>
        )}

        <div className="strategy-section-title">📦 Isi Bundle</div>
        <div style={{ marginBottom: '10px' }}>
          {!activeResep.comboItems || activeResep.comboItems.length === 0 ? (
            <div style={{ color: 'var(--muted)', fontSize: '12px', padding: '8px 0' }}>
              Belum ada menu — klik + Menu
            </div>
          ) : (
            activeResep.comboItems.map((ci) => {
              const member = resepList.find((x) => String(x.id) === String(ci.resepId));
              if (!member) {
                return (
                  <div
                    key={ci.resepId}
                    style={{
                      color: 'var(--muted)',
                      fontSize: '12px',
                      padding: '6px 0'
                    }}
                  >
                    ⚠️ Resep #{ci.resepId} tidak ditemukan (mungkin dihapus)
                  </div>
                );
              }
              const mHpp = hitungHPPResep(member, resepList, bahanMap);
              return (
                <div key={ci.resepId} className="ingredient-row">
                  <div className="ing-nama">🎯 {member.nama}</div>
                  <div className="ing-qty" style={{ color: 'var(--accent)' }}>
                    ×{ci.qty || 1}
                  </div>
                  <div className="ing-hpp" style={{ color: 'var(--muted)' }}>
                    HPP {fmtRp(mHpp)}/pcs
                  </div>
                  <div
                    style={{
                      fontFamily: 'DM Mono',
                      fontSize: '12px',
                      color: '#4cc9a0',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {fmtRp(mHpp * (ci.qty || 1))}
                  </div>
                  <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                    <button
                      className="tbl-action-btn tbl-del"
                      onClick={() => onRemoveComboItem(activeResep, ci.resepId)}
                      title="Hapus dari bundle"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* HPP CUP BOX (BUNDLE) */}
        <div className="hpp-cup-box">
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr',
              gap: '12px',
              marginBottom: '12px'
            }}
          >
            <div>
              <div
                style={{
                  fontSize: '10px',
                  fontFamily: 'DM Mono',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  color: 'var(--muted)',
                  marginBottom: '4px'
                }}
              >
                HPP Bundle
              </div>
              <div
                style={{
                  fontSize: '22px',
                  fontWeight: 800,
                  fontFamily: 'DM Mono',
                  color: '#4cc9a0'
                }}
              >
                {fmtRp(hpp)}
              </div>
            </div>
            <div>
              <div
                style={{
                  fontSize: '10px',
                  fontFamily: 'DM Mono',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  color: 'var(--muted)',
                  marginBottom: '4px'
                }}
              >
                Harga Jual
              </div>
              <div
                style={{
                  fontSize: '22px',
                  fontWeight: 800,
                  fontFamily: 'DM Mono',
                  color: 'var(--accent)'
                }}
              >
                {hargaJual ? fmtRp(hargaJual) : '—'}
              </div>
            </div>
            <div>
              <div
                style={{
                  fontSize: '10px',
                  fontFamily: 'DM Mono',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  color: 'var(--muted)',
                  marginBottom: '4px'
                }}
              >
                Margin
              </div>
              <div
                style={{
                  fontSize: '22px',
                  fontWeight: 800,
                  fontFamily: 'DM Mono',
                  color: margin >= 50 ? '#4cc9a0' : margin >= 30 ? '#f5a623' : 'var(--red)'
                }}
              >
                {hargaJual ? margin + '%' : '—'}
              </div>
            </div>
          </div>

          <div
            style={{
              fontSize: '11px',
              color: 'var(--muted)',
              fontFamily: 'DM Mono'
            }}
          >
            HPP normal total: {fmtRp(hpp)} · Diskon implied:{' '}
            {hargaJual && hpp ? fmtRp(hpp - hargaJual) : '—'}
          </div>

          <div style={{ marginTop: '12px' }}>
            <div style={{ fontSize: '11px', color: 'var(--muted)', marginBottom: '6px' }}>
              Update harga bundle:
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                className="form-input"
                type="text"
                inputMode="numeric"
                value={quickHargaJual}
                onChange={(e) => setQuickHargaJual(formatNumericInput(e.target.value))}
                placeholder="0"
                style={{ flex: 1, fontSize: '13px' }}
              />
              <button className="btn btn-primary btn-sm" onClick={handleSaveQuickHargaJual}>
                Simpan
              </button>
            </div>
          </div>
        </div>

        {activeResep.catatan && (
          <div
            style={{
              fontSize: '12px',
              color: 'var(--muted)',
              marginTop: '10px',
              padding: '8px 12px',
              background: 'rgba(46,156,255,0.04)',
              borderRadius: '8px'
            }}
          >
            {activeResep.catatan}
          </div>
        )}
      </div>
    );
  }

  // ── DETAIL: NORMAL RESEP ──
  const hpp = hitungHPPResep(activeResep, resepList, bahanMap);
  const isDrink = activeResep.kategori !== 'Snack' && activeResep.kategori !== 'Makanan';
  const hppLarge = activeResep.hppSnapshotLarge || (isDrink && hpp > 0 ? hpp + 1200 : hpp);
  const hargaLarge = activeResep.hargaJualLarge || (isDrink && activeResep.hargaJual ? activeResep.hargaJual + 3000 : 0);

  const ch = (activeResep.channel || '').toLowerCase();
  const isShopee = ch === 'shopeefood' || ch === 'marketplace';
  const isGofood = ch === 'gofood';
  const isTiktokGo = ch === 'tiktokgo';
  const isMarketplace = isShopee || isGofood;

  const { net: netUntukMargin, adminFee, afiliateFee, rate: komisiRate } = hitungChannelNet(
    activeResep.hargaJual || 0,
    ch,
    Number(activeResep.komisiAfiliate) || 0
  );
  const komisiRp = adminFee;
  const netSetelahKomisi = netUntukMargin;

  // Varian Large channel net & margin
  const { net: netLarge, adminFee: adminFeeLarge, afiliateFee: afiliateFeeLarge } = hitungChannelNet(
    hargaLarge,
    ch,
    Number(activeResep.komisiAfiliate) || 0
  );
  const marginLarge = hargaLarge > 0 ? Math.round(((netLarge - hppLarge) / hargaLarge) * 100) : 0;
  const profitCupLarge = netLarge - hppLarge;
  const mpBadgeLarge = (isMarketplace || isTiktokGo) && hargaLarge > 0 ? marketplaceMarginBadge(marginLarge) : null;

  const tiktokAdminRate = isTiktokGo ? DEFAULT_TIKTOK_ADMIN_RATE : 0;
  const tiktokAfiliateRate = isTiktokGo ? Number(activeResep.komisiAfiliate) || 0 : 0;
  const tiktokAdminRp = adminFee;
  const tiktokAfiliateRp = afiliateFee;
  const tiktokNet = netUntukMargin;

  const margin = activeResep.hargaJual
    ? Math.round(((netUntukMargin - hpp) / activeResep.hargaJual) * 100)
    : 0;
  const markup =
    activeResep.hargaJual && hpp
      ? Math.round(((activeResep.hargaJual - hpp) / hpp) * 100)
      : 0;
  const profitCup = netUntukMargin - hpp;
  const mpBadge = isMarketplace || isTiktokGo ? marketplaceMarginBadge(margin) : null;
  const hasWarn = resepHasWarning(activeResep, resepList, bahanMap);

  return (
    <div className="card">
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '14px'
        }}
      >
        <div style={{ fontSize: '16px', fontWeight: 700 }}>{activeResep.nama}</div>
        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => onCopyResep(activeResep)}
            title="Salin ke channel lain"
          >
            📋 Salin
          </button>
          <button className="btn btn-ghost btn-sm" onClick={() => onEditResep(activeResep)}>
            ✏️ Edit
          </button>
          <button className="btn btn-ghost btn-sm" onClick={() => onAddIngredient(activeResep)}>
            + Bahan
          </button>
          <button
            className="btn btn-danger btn-sm"
            onClick={() => {
              if (confirm(`Hapus resep "${activeResep.nama}"?`)) {
                onDeleteResep(activeResep.id);
              }
            }}
          >
            🗑️
          </button>
        </div>
      </div>

      {hasWarn && (
        <div className="resep-warning" style={{ marginBottom: '12px' }}>
          <span>⚠️</span>
          <div>
            Harga bahan baku berubah — HPP sekarang <strong>{fmtRp(hpp)}</strong> (snapshot:{' '}
            {fmtRp(activeResep.hppSnapshot || 0)}). Cek harga jual!
          </div>
        </div>
      )}

      <div className="strategy-section-title">🧪 Komposisi per Cup</div>
      <div style={{ marginBottom: '10px' }}>
        {!activeResep.ingredients || activeResep.ingredients.length === 0 ? (
          <div style={{ color: 'var(--muted)', fontSize: '12px', padding: '8px 0' }}>
            Belum ada bahan — klik + Bahan
          </div>
        ) : (
          activeResep.ingredients.map((ing) => {
            const b = bahanMap.get(String(ing.bahanId));
            if (!b) return null;
            const hps = bahanHargaPerSatuan(b);
            const subtotal = Math.round(hps * ing.qty);

            return (
              <div key={ing.bahanId} className="ingredient-row">
                <div className="ing-nama">{b.nama}</div>
                <div className="ing-qty">
                  {ing.qty} {b.satuan}
                </div>
                <div className="ing-hpp">
                  {fmtRp(Math.round(hps))}/{b.satuan}
                </div>
                <div
                  style={{
                    fontFamily: 'DM Mono',
                    fontSize: '12px',
                    color: '#4cc9a0',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {fmtRp(subtotal)}
                </div>
                <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                  <button
                    className="tbl-action-btn tbl-edit"
                    onClick={() => onEditIngredient(activeResep, ing)}
                    title="Edit kuantitas atau ganti bahan"
                  >
                    ✏️
                  </button>
                  <button
                    className="tbl-action-btn tbl-del"
                    onClick={() => onRemoveIngredient(activeResep, ing.bahanId)}
                    title="Hapus bahan dari menu"
                  >
                    ✕
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* HPP CUP BOX (NORMAL RESEP) */}
      <div className="hpp-cup-box">
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: isTiktokGo
              ? 'repeat(auto-fit, minmax(110px, 1fr))'
              : isMarketplace
              ? 'repeat(auto-fit, minmax(120px, 1fr))'
              : '1fr 1fr 1fr',
            gap: '12px',
            marginBottom: '12px'
          }}
        >
          <div>
            <div
              style={{
                fontSize: '10px',
                fontFamily: 'DM Mono',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                color: 'var(--muted)',
                marginBottom: '4px'
              }}
            >
              HPP/cup
            </div>
            <div
              style={{
                fontSize: '22px',
                fontWeight: 800,
                fontFamily: 'DM Mono',
                color: '#4cc9a0'
              }}
            >
              {fmtRp(hpp)}
            </div>
          </div>

          <div>
            <div
              style={{
                fontSize: '10px',
                fontFamily: 'DM Mono',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                color: 'var(--muted)',
                marginBottom: '4px'
              }}
            >
              Harga Jual
            </div>
            <div
              style={{
                fontSize: '22px',
                fontWeight: 800,
                fontFamily: 'DM Mono',
                color: 'var(--accent)'
              }}
            >
              {activeResep.hargaJual ? fmtRp(activeResep.hargaJual) : '—'}
            </div>
          </div>

          {isMarketplace && (
            <>
              <div>
                <div
                  style={{
                    fontSize: '10px',
                    fontFamily: 'DM Mono',
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    color: 'var(--muted)',
                    marginBottom: '4px'
                  }}
                >
                  Komisi ({komisiRate}%)
                </div>
                <div
                  style={{
                    fontSize: '22px',
                    fontWeight: 800,
                    fontFamily: 'DM Mono',
                    color: 'var(--red)'
                  }}
                >
                  {activeResep.hargaJual ? '−' + fmtRp(komisiRp) : '—'}
                </div>
              </div>
              <div>
                <div
                  style={{
                    fontSize: '10px',
                    fontFamily: 'DM Mono',
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    color: 'var(--muted)',
                    marginBottom: '4px'
                  }}
                >
                  Net Stlh Komisi
                </div>
                <div
                  style={{
                    fontSize: '22px',
                    fontWeight: 800,
                    fontFamily: 'DM Mono',
                    color: 'var(--text)'
                  }}
                >
                  {activeResep.hargaJual ? fmtRp(netSetelahKomisi) : '—'}
                </div>
              </div>
            </>
          )}

          {isTiktokGo && (
            <>
              <div>
                <div
                  style={{
                    fontSize: '10px',
                    fontFamily: 'DM Mono',
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    color: 'var(--muted)',
                    marginBottom: '4px'
                  }}
                >
                  Admin TT ({tiktokAdminRate}%)
                </div>
                <div
                  style={{
                    fontSize: '22px',
                    fontWeight: 800,
                    fontFamily: 'DM Mono',
                    color: 'var(--red)'
                  }}
                >
                  {activeResep.hargaJual ? '−' + fmtRp(tiktokAdminRp) : '—'}
                </div>
              </div>
              <div>
                <div
                  style={{
                    fontSize: '10px',
                    fontFamily: 'DM Mono',
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    color: 'var(--muted)',
                    marginBottom: '4px'
                  }}
                >
                  Afiliate ({tiktokAfiliateRate}%)
                </div>
                <div
                  style={{
                    fontSize: '22px',
                    fontWeight: 800,
                    fontFamily: 'DM Mono',
                    color: 'var(--red)'
                  }}
                >
                  {activeResep.hargaJual ? '−' + fmtRp(tiktokAfiliateRp) : '—'}
                </div>
              </div>
              <div>
                <div
                  style={{
                    fontSize: '10px',
                    fontFamily: 'DM Mono',
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    color: 'var(--muted)',
                    marginBottom: '4px'
                  }}
                >
                  Net Bersih
                </div>
                <div
                  style={{
                    fontSize: '22px',
                    fontWeight: 800,
                    fontFamily: 'DM Mono',
                    color: 'var(--text)'
                  }}
                >
                  {activeResep.hargaJual ? fmtRp(tiktokNet) : '—'}
                </div>
              </div>
            </>
          )}

          <div>
            <div
              style={{
                fontSize: '10px',
                fontFamily: 'DM Mono',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                color: 'var(--muted)',
                marginBottom: '4px'
              }}
            >
              Margin
            </div>
            <div
              style={{
                fontSize: '22px',
                fontWeight: 800,
                fontFamily: 'DM Mono',
                color:
                  isMarketplace || isTiktokGo
                    ? mpBadge
                      ? mpBadge.color
                      : 'var(--red)'
                    : margin >= 50
                    ? '#4cc9a0'
                    : margin >= 30
                    ? '#f5a623'
                    : 'var(--red)'
              }}
            >
              {activeResep.hargaJual ? margin + '%' : '—'}
            </div>
            {(isMarketplace || isTiktokGo) && activeResep.hargaJual > 0 && mpBadge && (
              <div
                style={{
                  display: 'inline-block',
                  marginTop: '4px',
                  fontSize: '9px',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: '99px',
                  background: mpBadge.bg,
                  color: mpBadge.color
                }}
              >
                {mpBadge.label}
              </div>
            )}
          </div>
        </div>

        <div
          style={{
            fontSize: '11px',
            color: 'var(--muted)',
            fontFamily: 'DM Mono'
          }}
        >
          Markup: {activeResep.hargaJual ? markup + '%' : '—'} · Profit/cup:{' '}
          {activeResep.hargaJual ? fmtRp(profitCup) : '—'}
          {isMarketplace && (
            <span style={{ color: 'var(--muted)', opacity: 0.7 }}>
              {' '}(setelah komisi {komisiRate}%)
            </span>
          )}
          {isTiktokGo && (
            <span style={{ color: 'var(--muted)', opacity: 0.7 }}>
              {' '}(setelah admin {tiktokAdminRate}% + afiliate {tiktokAfiliateRate}%)
            </span>
          )}
        </div>

        {/* LARGE VARIANT METRICS (JIKA MINUMAN ATAU SUDAH DISET) */}
        {(isDrink || !!activeResep.hargaJualLarge) && (
          <div style={{ marginTop: '16px', paddingTop: '14px', borderTop: '1px dashed var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                🥤 Varian Large (Cup Besar)
              </span>
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: isTiktokGo
                  ? 'repeat(auto-fit, minmax(105px, 1fr))'
                  : isMarketplace
                  ? 'repeat(auto-fit, minmax(115px, 1fr))'
                  : '1fr 1fr 1fr',
                gap: '12px',
                marginBottom: '10px'
              }}
            >
              <div>
                <div style={{ fontSize: '10px', fontFamily: 'DM Mono', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--muted)', marginBottom: '4px' }}>
                  HPP/cup (L)
                </div>
                <div style={{ fontSize: '20px', fontWeight: 800, fontFamily: 'DM Mono', color: '#4cc9a0' }}>
                  {fmtRp(hppLarge)}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '10px', fontFamily: 'DM Mono', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--muted)', marginBottom: '4px' }}>
                  Harga Jual (L)
                </div>
                <div style={{ fontSize: '20px', fontWeight: 800, fontFamily: 'DM Mono', color: 'var(--accent)' }}>
                  {hargaLarge ? fmtRp(hargaLarge) : '—'}
                </div>
              </div>
              {isMarketplace && (
                <>
                  <div>
                    <div style={{ fontSize: '10px', fontFamily: 'DM Mono', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--muted)', marginBottom: '4px' }}>
                      Komisi ({komisiRate}%)
                    </div>
                    <div style={{ fontSize: '20px', fontWeight: 800, fontFamily: 'DM Mono', color: 'var(--red)' }}>
                      {hargaLarge ? '−' + fmtRp(adminFeeLarge) : '—'}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '10px', fontFamily: 'DM Mono', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--muted)', marginBottom: '4px' }}>
                      Net Stlh Komisi
                    </div>
                    <div style={{ fontSize: '20px', fontWeight: 800, fontFamily: 'DM Mono', color: 'var(--text)' }}>
                      {hargaLarge ? fmtRp(netLarge) : '—'}
                    </div>
                  </div>
                </>
              )}
              {isTiktokGo && (
                <>
                  <div>
                    <div style={{ fontSize: '10px', fontFamily: 'DM Mono', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--muted)', marginBottom: '4px' }}>
                      Admin TT ({tiktokAdminRate}%)
                    </div>
                    <div style={{ fontSize: '20px', fontWeight: 800, fontFamily: 'DM Mono', color: 'var(--red)' }}>
                      {hargaLarge ? '−' + fmtRp(adminFeeLarge) : '—'}
                    </div>
                  </div>
                  {tiktokAfiliateRate > 0 && (
                    <div>
                      <div style={{ fontSize: '10px', fontFamily: 'DM Mono', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--muted)', marginBottom: '4px' }}>
                        Afiliate ({tiktokAfiliateRate}%)
                      </div>
                      <div style={{ fontSize: '20px', fontWeight: 800, fontFamily: 'DM Mono', color: 'var(--red)' }}>
                        {hargaLarge ? '−' + fmtRp(afiliateFeeLarge) : '—'}
                      </div>
                    </div>
                  )}
                  <div>
                    <div style={{ fontSize: '10px', fontFamily: 'DM Mono', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--muted)', marginBottom: '4px' }}>
                      Net Bersih (L)
                    </div>
                    <div style={{ fontSize: '20px', fontWeight: 800, fontFamily: 'DM Mono', color: 'var(--text)' }}>
                      {hargaLarge ? fmtRp(netLarge) : '—'}
                    </div>
                  </div>
                </>
              )}
              <div>
                <div style={{ fontSize: '10px', fontFamily: 'DM Mono', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--muted)', marginBottom: '4px' }}>
                  Margin (L)
                </div>
                <div
                  style={{
                    fontSize: '20px',
                    fontWeight: 800,
                    fontFamily: 'DM Mono',
                    color:
                      isMarketplace || isTiktokGo
                        ? mpBadgeLarge
                          ? mpBadgeLarge.color
                          : 'var(--red)'
                        : marginLarge >= 50
                        ? '#4cc9a0'
                        : marginLarge >= 30
                        ? '#f5a623'
                        : 'var(--red)'
                  }}
                >
                  {hargaLarge ? marginLarge + '%' : '—'}
                </div>
              </div>
            </div>
            <div style={{ fontSize: '11px', color: 'var(--muted)', fontFamily: 'DM Mono' }}>
              Profit/cup (L): {hargaLarge ? fmtRp(profitCupLarge) : '—'}
            </div>
          </div>
        )}

        {isTiktokGo && (
          <div style={{ marginTop: '14px', paddingTop: '10px', borderTop: '1px solid var(--border)' }}>
            <div
              style={{
                fontSize: '11px',
                color: 'var(--muted)',
                marginBottom: '6px'
              }}
            >
              Update komisi afiliate (%) — nego per kreator/campaign:
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                className="form-input"
                type="text"
                inputMode="decimal"
                value={quickKomisiAfiliate}
                onChange={(e) => setQuickKomisiAfiliate(e.target.value)}
                placeholder="0"
                style={{ flex: 1, fontSize: '13px' }}
              />
              <button
                className="btn btn-primary btn-sm"
                onClick={handleSaveQuickKomisiAfiliate}
              >
                Simpan
              </button>
            </div>
          </div>
        )}

        <div style={{ marginTop: '14px', paddingTop: '10px', borderTop: '1px solid var(--border)' }}>
          <div style={{ fontSize: '11px', color: 'var(--muted)', marginBottom: '6px' }}>
            Update harga jual (Regular & Large):
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: isDrink ? '1fr 1fr auto' : '1fr auto', gap: '8px' }}>
            <div>
              <div style={{ fontSize: '10px', color: 'var(--text2)', marginBottom: '2px' }}>Harga Regular</div>
              <input
                className="form-input"
                type="text"
                inputMode="numeric"
                value={quickHargaJual}
                onChange={(e) => setQuickHargaJual(formatNumericInput(e.target.value))}
                placeholder="0"
                style={{ width: '100%', fontSize: '13px' }}
              />
            </div>
            {isDrink && (
              <div>
                <div style={{ fontSize: '10px', color: 'var(--accent)', marginBottom: '2px' }}>Harga Large</div>
                <input
                  className="form-input"
                  type="text"
                  inputMode="numeric"
                  value={quickHargaJualLarge}
                  onChange={(e) => setQuickHargaJualLarge(formatNumericInput(e.target.value))}
                  placeholder="0"
                  style={{ width: '100%', fontSize: '13px' }}
                />
              </div>
            )}
            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <button
                className="btn btn-primary btn-sm"
                onClick={handleSaveQuickHargaJual}
                style={{ height: '36px' }}
              >
                Simpan
              </button>
            </div>
          </div>
        </div>
      </div>

      {activeResep.catatan && (
        <div
          style={{
            fontSize: '12px',
            color: 'var(--muted)',
            marginTop: '10px',
            padding: '8px 12px',
            background: 'rgba(46,156,255,0.04)',
            borderRadius: '8px'
          }}
        >
          {activeResep.catatan}
        </div>
      )}
    </div>
  );
};

// ── MAIN RESEP VIEW COMPONENT ──
export const ResepView: React.FC<ResepViewProps> = ({
  resepList,
  bahanList,
  transaksiList = [],
  keuMeta = {},
  onSaveResep,
  onUpdateResep,
  onDeleteResep,
  onReorderResep,
  onSaveBahan,
  onUpdateBahan,
  onDeleteBahan,
  onSaveResepGroups,
  onSaveChannels,
  onPushResepCloud,
  onSaveTransaction,
  showToast
}) => {
  // Navigation & filter states
  const [activeSubTab, setActiveSubTab] = useState<'resep' | 'inventory' | 'bahan'>('resep');
  const [activeChannel, setActiveChannel] = useState<string>('kedai');
  const [activeResepId, setActiveResepId] = useState<number | string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedInventoryStatus, setSelectedInventoryStatus] = useState<string>('all');

  // Drag and Drop states
  const [draggedResepId, setDraggedResepId] = useState<number | string | null>(null);
  const [dragOverTargetId, setDragOverTargetId] = useState<number | string | null>(null);

  // Modals visibility states
  const [isAddResepOpen, setIsAddResepOpen] = useState(false);
  const [editingResep, setEditingResep] = useState<ResepItem | null>(null);
  const [isAddComboOpen, setIsAddComboOpen] = useState(false);
  const [editingCombo, setEditingCombo] = useState<ResepItem | null>(null);
  const [comboForAddItem, setComboForAddItem] = useState<ResepItem | null>(null);
  const [resepToCopy, setResepToCopy] = useState<ResepItem | null>(null);
  const [resepToAddIng, setResepToAddIng] = useState<ResepItem | null>(null);
  const [editingIngData, setEditingIngData] = useState<{
    resep: ResepItem;
    ingredient: ResepIngredient;
  } | null>(null);
  const [isAddBahanOpen, setIsAddBahanOpen] = useState(false);
  const [editingBahan, setEditingBahan] = useState<BahanItem | null>(null);
  const [restockBahan, setRestockBahan] = useState<BahanItem | null>(null);
  const [isManageChannelsOpen, setIsManageChannelsOpen] = useState(false);
  const [isManageKategoriOpen, setIsManageKategoriOpen] = useState(false);

  const handleSaveRestock = async (
    bahan: BahanItem,
    addedQty: number,
    createExpenseTrx: boolean,
    nominal: number
  ) => {
    if (createExpenseTrx && onSaveTransaction) {
      const newTrx: TransaksiItem = {
        id: Date.now(),
        tanggal: new Date().toISOString().split('T')[0],
        tipe: 'keluar',
        kategori: 'Bahan Baku',
        deskripsi: `Bahan Baku - ${bahan.nama}`,
        nominal,
        transaction_class: 'hpp',
        sumber: 'cash',
        created_at: new Date().toISOString()
      };
      await onSaveTransaction(newTrx);
    } else {
      const currentStokAwal = bahan.stokAwal !== undefined ? bahan.stokAwal : 0;
      const updatedBahan: BahanItem = {
        ...bahan,
        stokAwal: currentStokAwal + addedQty,
        updatedAt: new Date().toISOString()
      };
      await onUpdateBahan(updatedBahan);
    }
    if (showToast) {
      showToast(`✅ Berhasil restok +${addedQty.toLocaleString('id-ID')} ${bahan.satuan} ${bahan.nama}!`);
    }
  };

  // Channels setup
  const channelLabels: Record<string, string> = useMemo(() => {
    return {
      ...CHANNEL_LABEL_DEFAULT,
      ...(keuMeta?.channelLabels || {})
    };
  }, [keuMeta?.channelLabels]);

  const channels: string[] = useMemo(() => {
    const custom: string[] = keuMeta?.dikopiChannels || [];
    return Array.from(new Set([...DEFAULT_CHANNELS, ...custom]));
  }, [keuMeta?.dikopiChannels]);

  const getChannelLabel = (ch: string) => {
    if (channelLabels[ch]) return channelLabels[ch];
    return '🏷️ ' + ch.charAt(0).toUpperCase() + ch.slice(1);
  };

  // Categories setup
  const resepGroups: ResepGroupItem[] = useMemo(() => {
    const stored = keuMeta?.resepGroups;
    if (stored && Array.isArray(stored) && stored.length > 0) {
      const existingKeys = new Set(stored.map((g) => g.key.toLowerCase()));
      const merged = [...stored];
      RESEP_GROUPS_DEFAULT.forEach((def) => {
        if (!existingKeys.has(def.key.toLowerCase())) {
          merged.push(def);
        }
      });
      return merged;
    }
    return RESEP_GROUPS_DEFAULT;
  }, [keuMeta?.resepGroups]);

  // Map bahan untuk lookup O(1)
  const bahanMap = useMemo(() => {
    const map = new Map<string, BahanItem>();
    bahanList.forEach((b) => map.set(String(b.id), b));
    return map;
  }, [bahanList]);

  // Resep di channel aktif
  const channelResep = useMemo(() => {
    return resepList.filter((r) => {
      const ch = (r.channel || 'kedai').toLowerCase();
      if (activeChannel === 'shopeefood') {
        return ch === 'shopeefood' || ch === 'marketplace';
      }
      return ch === activeChannel;
    });
  }, [resepList, activeChannel]);

  // Resep yang sedang aktif dipilih
  const activeResep = useMemo(() => {
    if (channelResep.length === 0) return null;
    if (activeResepId) {
      const match = channelResep.find((r) => String(r.id) === String(activeResepId));
      if (match) return match;
    }
    return channelResep[0];
  }, [channelResep, activeResepId]);

  // Warnings pada channel aktif
  const channelWarnings = useMemo(() => {
    return channelResep.filter((r) => resepHasWarning(r, resepList, bahanMap));
  }, [channelResep, resepList, bahanMap]);

  // Resep terfilter oleh search
  const searchedChannelResep = useMemo(() => {
    if (!searchTerm.trim()) return channelResep;
    const term = searchTerm.toLowerCase();
    return channelResep.filter(
      (r) =>
        (r.nama || '').toLowerCase().includes(term) ||
        (r.kategori || '').toLowerCase().includes(term)
    );
  }, [channelResep, searchTerm]);

  // Pengelompokan resep berdasarkan resepGroups
  const groupedResep = useMemo(() => {
    const knownKeys = new Set(resepGroups.map((g) => g.key.toLowerCase()));
    const groups = resepGroups
      .map((g) => ({
        ...g,
        items: searchedChannelResep.filter((r) => {
          const k = (r.kategori || 'Coffee').toLowerCase();
          return k === g.key.toLowerCase();
        })
      }))
      .filter((g) => g.items.length > 0);

    const otherItems = searchedChannelResep.filter((r) => {
      const k = (r.kategori || 'Coffee').toLowerCase();
      return !knownKeys.has(k);
    });
    if (otherItems.length > 0) {
      groups.push({
        key: 'Lainnya',
        label: '🍽️ Lainnya',
        items: otherItems
      });
    }

    return groups;
  }, [resepGroups, searchedChannelResep]);

  // Smart Inventory calculation
  const inventorySummary = useMemo(() => {
    return computeInventorySummary(bahanList, resepList, transaksiList);
  }, [bahanList, resepList, transaksiList]);

  // ── INGREDIENTS / COMBO ITEM ACTIONS ──
  const handleAddIngredient = (bahanId: number | string, qty: number) => {
    if (!resepToAddIng) return;
    const ingredients = [...(resepToAddIng.ingredients || []), { bahanId, qty }];
    const updated: ResepItem = {
      ...resepToAddIng,
      ingredients,
      hppSnapshot: hitungHPPResep({ ...resepToAddIng, ingredients }, resepList, bahanMap)
    };
    onUpdateResep(updated);
    if (showToast) showToast('✅ Bahan berhasil ditambahkan ke menu!');
  };

  const handleSaveEditIngredient = (
    oldBahanId: number | string,
    newBahanId: number | string,
    qty: number
  ) => {
    if (!editingIngData) return;
    const { resep } = editingIngData;
    let newIngredients = [...(resep.ingredients || [])];

    if (String(oldBahanId) !== String(newBahanId)) {
      const existingIdx = newIngredients.findIndex((i) => String(i.bahanId) === String(newBahanId));
      if (existingIdx >= 0) {
        newIngredients[existingIdx].qty = qty;
        newIngredients = newIngredients.filter((i) => String(i.bahanId) !== String(oldBahanId));
      } else {
        const ing = newIngredients.find((i) => String(i.bahanId) === String(oldBahanId));
        if (ing) {
          ing.bahanId = newBahanId;
          ing.qty = qty;
        }
      }
    } else {
      const ing = newIngredients.find((i) => String(i.bahanId) === String(oldBahanId));
      if (ing) ing.qty = qty;
    }

    const updated: ResepItem = {
      ...resep,
      ingredients: newIngredients,
      hppSnapshot: hitungHPPResep({ ...resep, ingredients: newIngredients }, resepList, bahanMap)
    };
    onUpdateResep(updated);
    if (showToast) showToast('✅ Komposisi bahan berhasil diperbarui!');
  };

  const handleRemoveIngredient = (resep: ResepItem, bahanId: number | string) => {
    const newIngredients = (resep.ingredients || []).filter(
      (i) => String(i.bahanId) !== String(bahanId)
    );
    const updated: ResepItem = {
      ...resep,
      ingredients: newIngredients,
      hppSnapshot: hitungHPPResep({ ...resep, ingredients: newIngredients }, resepList, bahanMap)
    };
    onUpdateResep(updated);
    if (showToast) showToast('Bahan dihapus dari menu');
  };

  const handleAddComboItem = (
    comboId: number | string,
    resepId: number | string,
    qty: number
  ) => {
    const combo = resepList.find((r) => String(r.id) === String(comboId));
    if (!combo) return;
    const comboItems = [...(combo.comboItems || [])];
    const existing = comboItems.find((ci) => String(ci.resepId) === String(resepId));
    if (existing) {
      existing.qty += qty;
    } else {
      comboItems.push({ resepId, qty });
    }

    const updated: ResepItem = {
      ...combo,
      comboItems,
      hppSnapshot: hitungHPPResep({ ...combo, comboItems }, resepList, bahanMap)
    };
    onUpdateResep(updated);
    if (showToast) showToast('✅ Menu berhasil ditambahkan ke bundle!');
  };

  const handleRemoveComboItem = (combo: ResepItem, resepId: number | string) => {
    const comboItems = (combo.comboItems || []).filter((ci) => String(ci.resepId) !== String(resepId));
    const updated: ResepItem = {
      ...combo,
      comboItems,
      hppSnapshot: hitungHPPResep({ ...combo, comboItems }, resepList, bahanMap)
    };
    onUpdateResep(updated);
    if (showToast) showToast('Item dihapus dari bundle');
  };

  const handleCopyResepToChannel = (targetChannel: string, newHarga: number) => {
    if (!resepToCopy) return;
    const copy: ResepItem = {
      ...JSON.parse(JSON.stringify(resepToCopy)),
      id: Date.now(),
      channel: targetChannel,
      hargaJual: newHarga,
      createdAt: new Date().toISOString()
    };
    copy.hppSnapshot = hitungHPPResep(copy, resepList, bahanMap);
    onSaveResep(copy);
    setActiveChannel(targetChannel);
    setActiveResepId(copy.id);
    if (showToast) showToast(`✅ Resep disalin ke ${getChannelLabel(targetChannel)}!`);
  };

  // ── DELETE BAHAN VALIDATION ──
  const handleDeleteBahanWithCheck = (id: number | string) => {
    const usedIn = resepList.filter((r) =>
      r.ingredients?.some((i) => String(i.bahanId) === String(id))
    );
    if (usedIn.length > 0) {
      alert(`⚠️ Bahan ini sedang digunakan di ${usedIn.length} resep. Hapus dari resep terlebih dahulu.`);
      return;
    }
    if (confirm('Yakin ingin menghapus bahan baku ini?')) {
      onDeleteBahan(id);
    }
  };

  // ── DRAG AND DROP HANDLERS (Cloned from PrataniHQ_v4.2.html) ──
  const handleDragStart = (e: React.DragEvent, id: number | string) => {
    setDraggedResepId(id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, targetId: number | string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (targetId !== draggedResepId) {
      setDragOverTargetId(targetId);
    }
  };

  const handleDragLeave = () => {
    setDragOverTargetId(null);
  };

  const handleDrop = (e: React.DragEvent, targetId: number | string, targetGrupKey: string) => {
    e.preventDefault();
    setDragOverTargetId(null);
    if (!draggedResepId || draggedResepId === targetId) {
      setDraggedResepId(null);
      return;
    }

    const srcIdx = resepList.findIndex((r) => String(r.id) === String(draggedResepId));
    const tgtIdx = resepList.findIndex((r) => String(r.id) === String(targetId));
    if (srcIdx === -1 || tgtIdx === -1) {
      setDraggedResepId(null);
      return;
    }

    const copyList = [...resepList];
    const [moved] = copyList.splice(srcIdx, 1);
    moved.kategori = targetGrupKey;
    const newTgtIdx = copyList.findIndex((r) => String(r.id) === String(targetId));
    copyList.splice(newTgtIdx, 0, moved);

    setDraggedResepId(null);
    onReorderResep(copyList);
    if (showToast) showToast('✅ Urutan resep berhasil diperbarui');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* ── Sub-tab Switcher ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div className="filter-row" style={{ marginBottom: 0 }}>
          <button
            onClick={() => setActiveSubTab('resep')}
            className={`filter-btn ${activeSubTab === 'resep' ? 'active' : ''}`}
          >
            ☕ Resep Menu ({resepList.length})
          </button>

          <button
            onClick={() => setActiveSubTab('inventory')}
            className={`filter-btn ${activeSubTab === 'inventory' ? 'active' : ''}`}
          >
            📦 Smart Stok
            {inventorySummary.kritisItems.length > 0 && (
              <span
                className="pill"
                style={{
                  marginLeft: '6px',
                  background: 'var(--red)',
                  color: '#fff',
                  fontSize: '9px',
                  padding: '1px 5px'
                }}
              >
                {inventorySummary.kritisItems.length} Kritis
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveSubTab('bahan')}
            className={`filter-btn ${activeSubTab === 'bahan' ? 'active' : ''}`}
          >
            🏷️ Master Bahan ({bahanList.length})
          </button>
        </div>

        {activeSubTab === 'inventory' && (
          <select
            value={selectedInventoryStatus}
            onChange={(e) => setSelectedInventoryStatus(e.target.value)}
            className="form-select"
            style={{ fontSize: '12px', padding: '6px 12px', width: 'auto' }}
          >
            <option value="all">Semua Status Stok</option>
            <option value="kritis">🔴 Kritis (Restock Urgent)</option>
            <option value="menipis">🟡 Menipis</option>
            <option value="aman">🟢 Aman</option>
          </select>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════════
          SUBTAB 1: RESEP MENU (CLONE FROM PrataniHQ_v4.2.html)
      ══════════════════════════════════════════════════════════════ */}
      {activeSubTab === 'resep' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Warning Banner */}
          {channelWarnings.length > 0 && (
            <div className="resep-warning">
              <span style={{ fontSize: '16px' }}>⚠️</span>
              <div>
                <strong>{channelWarnings.length} resep</strong> di channel ini perlu dicek — ada perubahan
                harga bahan baku yang memengaruhi HPP:{' '}
                {channelWarnings.map((r) => r.nama).join(', ')}. Cek apakah harga jual masih aman.
              </div>
            </div>
          )}

          {/* Channel Tabs & Action Bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <div className="filter-row" style={{ marginBottom: 0, flex: 1 }}>
              {channels.map((ch) => (
                <button
                  key={ch}
                  className={`filter-btn ${ch === activeChannel ? 'active' : ''}`}
                  style={ch === activeChannel ? {} : { borderColor: 'var(--border)' }}
                  onClick={() => {
                    setActiveChannel(ch);
                    setActiveResepId(null);
                  }}
                >
                  {getChannelLabel(ch)}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                className="btn btn-ghost btn-sm"
                style={{ whiteSpace: 'nowrap' }}
                onClick={() => setIsManageChannelsOpen(true)}
              >
                ⚙️ Kelola Channel
              </button>
              <button
                className="btn btn-primary btn-sm"
                style={{ whiteSpace: 'nowrap' }}
                onClick={onPushResepCloud}
                title="Sinkronkan resep menu ke Cloud Firestore agar kasir online terupdate"
              >
                ☁️ Push Resep ke Cloud
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="card" style={{ padding: '10px 14px' }}>
            <input
              type="text"
              placeholder="Cari resep menu di channel ini..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-input"
              style={{ padding: '6px 12px', fontSize: '12.5px' }}
            />
          </div>

          {/* MASTER-DETAIL 2-COLUMN LAYOUT (.resep-layout) */}
          <div className="resep-layout">
            {/* ── LEFT COLUMN: LIST RESEP ── */}
            <div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '10px'
                }}
              >
                <div
                  style={{
                    fontSize: '11px',
                    fontFamily: 'DM Mono',
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    color: 'var(--muted)'
                  }}
                >
                  Menu Resep ({channelResep.length})
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => setIsManageKategoriOpen(true)}
                    title="Kelola Kategori"
                  >
                    ⚙️
                  </button>
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => setIsAddComboOpen(true)}
                    title="Buat Bundle / Combo"
                  >
                    🎁 Combo
                  </button>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => setIsAddResepOpen(true)}
                  >
                    + Resep
                  </button>
                </div>
              </div>

              {groupedResep.length === 0 ? (
                <div
                  style={{
                    fontSize: '12px',
                    color: 'var(--muted)',
                    textAlign: 'center',
                    padding: '30px 0'
                  }}
                >
                  Belum ada resep di channel {getChannelLabel(activeChannel)}.
                </div>
              ) : (
                groupedResep.map((g) => (
                  <div key={g.key} style={{ marginBottom: '16px' }}>
                    <div
                      style={{
                        fontSize: '10.5px',
                        fontFamily: 'DM Mono',
                        textTransform: 'uppercase',
                        letterSpacing: '0.1em',
                        color: 'var(--muted)',
                        padding: '4px 0 6px',
                        borderBottom: '1px solid var(--border)',
                        marginBottom: '8px'
                      }}
                    >
                      {g.label}
                    </div>

                    {g.items.map((r) => {
                      const hpp = hitungHPPResep(r, resepList, bahanMap);
                      const hasWarn = resepHasWarning(r, resepList, bahanMap);
                      const isSelected = activeResep && String(r.id) === String(activeResep.id);
                      const isDropTarget = dragOverTargetId === r.id;

                      return (
                        <div
                          key={r.id}
                          className={`resep-card ${isSelected ? 'active' : ''}`}
                          draggable
                          onDragStart={(e) => handleDragStart(e, r.id)}
                          onDragOver={(e) => handleDragOver(e, r.id)}
                          onDragLeave={handleDragLeave}
                          onDrop={(e) => handleDrop(e, r.id, g.key)}
                          onClick={() => setActiveResepId(r.id)}
                          style={{
                            cursor: 'grab',
                            userSelect: 'none',
                            borderTop: isDropTarget ? '2px solid var(--accent)' : undefined,
                            opacity: draggedResepId === r.id ? 0.4 : 1
                          }}
                        >
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: '6px'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{ color: 'var(--muted)', fontSize: '11px' }}>⠿</span>
                              <div className="resep-nama">
                                {r.isCombo && (
                                  <span
                                    style={{
                                      fontSize: '9px',
                                      padding: '1px 5px',
                                      borderRadius: '99px',
                                      background: 'rgba(255,121,0,0.15)',
                                      color: '#ff7900',
                                      fontWeight: 700,
                                      marginRight: '4px'
                                    }}
                                  >
                                    COMBO
                                  </span>
                                )}
                                {r.nama} {hasWarn && '⚠️'}
                              </div>
                            </div>
                          </div>

                          <div className="resep-meta">
                            <span style={{ color: '#4cc9a0' }}>HPP {fmtRp(hpp)}</span>
                            {r.hargaJual > 0 && (
                              <span style={{ color: 'var(--accent)' }}>
                                Jual {fmtRp(r.hargaJual)}
                                {r.hargaJualLarge ? ` · L: ${fmtRp(r.hargaJualLarge)}` : ''}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))
              )}
            </div>

            {/* ── RIGHT COLUMN: DETAIL RESEP + HARGA BAHAN BAKU ── */}
            <div>
              {/* DETAIL CARD */}
              <div style={{ marginBottom: '16px' }}>
                {!activeResep ? (
                  <div className="card empty">
                    <div className="empty-icon">☕</div>
                    Pilih atau buat resep di sebelah kiri.
                  </div>
                ) : (
                  <ActiveResepDetailCard
                    key={String(activeResep.id)}
                    activeResep={activeResep}
                    resepList={resepList}
                    bahanMap={bahanMap}
                    onUpdateResep={onUpdateResep}
                    onDeleteResep={onDeleteResep}
                    onEditResep={(r) => setEditingResep(r)}
                    onEditCombo={(r) => setEditingCombo(r)}
                    onAddComboItem={(r) => setComboForAddItem(r)}
                    onCopyResep={(r) => setResepToCopy(r)}
                    onAddIngredient={(r) => setResepToAddIng(r)}
                    onEditIngredient={(r, ing) => setEditingIngData({ resep: r, ingredient: ing })}
                    onRemoveIngredient={handleRemoveIngredient}
                    onRemoveComboItem={handleRemoveComboItem}
                    showToast={showToast}
                  />
                )}
              </div>

              {/* CARD: TABEL HARGA BAHAN BAKU (STACKED UNDER DETAIL, AS IN PrataniHQ_v4.2.html) */}
              <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '14px 16px',
                    borderBottom: '1px solid var(--border)'
                  }}
                >
                  <div
                    style={{
                      fontSize: '11px',
                      fontFamily: 'DM Mono',
                      textTransform: 'uppercase',
                      letterSpacing: '0.1em',
                      color: 'var(--muted)'
                    }}
                  >
                    📦 Harga Bahan Baku ({bahanList.length})
                  </div>
                  <button className="btn btn-ghost btn-sm" onClick={() => setIsAddBahanOpen(true)}>
                    + Bahan
                  </button>
                </div>

                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border)', background: 'rgba(46,156,255,0.04)' }}>
                        <th
                          style={{
                            padding: '8px 12px',
                            fontSize: '10px',
                            fontFamily: 'DM Mono',
                            textTransform: 'uppercase',
                            letterSpacing: '0.08em',
                            color: 'var(--muted)',
                            textAlign: 'left'
                          }}
                        >
                          Nama Bahan
                        </th>
                        <th
                          style={{
                            padding: '8px 12px',
                            fontSize: '10px',
                            fontFamily: 'DM Mono',
                            textTransform: 'uppercase',
                            letterSpacing: '0.08em',
                            color: 'var(--muted)',
                            textAlign: 'left'
                          }}
                        >
                          Harga Beli
                        </th>
                        <th
                          style={{
                            padding: '8px 12px',
                            fontSize: '10px',
                            fontFamily: 'DM Mono',
                            textTransform: 'uppercase',
                            letterSpacing: '0.08em',
                            color: 'var(--muted)',
                            textAlign: 'center'
                          }}
                        >
                          Qty Beli
                        </th>
                        <th
                          style={{
                            padding: '8px 12px',
                            fontSize: '10px',
                            fontFamily: 'DM Mono',
                            textTransform: 'uppercase',
                            letterSpacing: '0.08em',
                            color: 'var(--muted)',
                            textAlign: 'right'
                          }}
                        >
                          Harga/Satuan
                        </th>
                        <th
                          style={{
                            padding: '8px 12px',
                            fontSize: '10px',
                            fontFamily: 'DM Mono',
                            textTransform: 'uppercase',
                            letterSpacing: '0.08em',
                            color: 'var(--muted)',
                            textAlign: 'right'
                          }}
                        >
                          Aksi
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {bahanList.length === 0 ? (
                        <tr>
                          <td
                            colSpan={5}
                            style={{
                              textAlign: 'center',
                              padding: '20px',
                              color: 'var(--muted)',
                              fontSize: '12px'
                            }}
                          >
                            Belum ada bahan baku terdaftar
                          </td>
                        </tr>
                      ) : (
                        bahanList.map((b) => {
                          const hps = bahanHargaPerSatuan(b);
                          return (
                            <tr key={b.id} style={{ borderBottom: '1px solid var(--border)' }}>
                              <td style={{ padding: '9px 12px', color: 'var(--text)', fontWeight: 500 }}>
                                {b.nama}
                              </td>
                              <td
                                style={{
                                  padding: '9px 12px',
                                  color: 'var(--text2)',
                                  fontFamily: 'DM Mono',
                                  fontSize: '12px'
                                }}
                              >
                                {fmtRp(b.hargaBeli)}
                              </td>
                              <td
                                style={{
                                  padding: '9px 12px',
                                  color: 'var(--text2)',
                                  fontFamily: 'DM Mono',
                                  fontSize: '12px',
                                  textAlign: 'center'
                                }}
                              >
                                {b.qtyBeli} {b.satuan}
                              </td>
                              <td
                                style={{
                                  padding: '9px 12px',
                                  fontFamily: 'DM Mono',
                                  fontSize: '12px',
                                  fontWeight: 600,
                                  color: '#4cc9a0',
                                  textAlign: 'right'
                                }}
                              >
                                {fmtRp(Math.round(hps))}/{b.satuan}
                              </td>
                              <td style={{ padding: '9px 12px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                                <button
                                  className="tbl-action-btn tbl-edit"
                                  onClick={() => setEditingBahan(b)}
                                  title="Edit Bahan"
                                >
                                  ✏️
                                </button>
                                <button
                                  className="tbl-action-btn tbl-del"
                                  onClick={() => handleDeleteBahanWithCheck(b.id)}
                                  title="Hapus Bahan"
                                >
                                  🗑️
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          SUBTAB 2: SMART INVENTORY STOK TERKINI
      ══════════════════════════════════════════════════════════════ */}
      {activeSubTab === 'inventory' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Inventory KPI Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            <div className="brand-card" style={{ borderLeftColor: 'var(--accent)' }}>
              <div className="brand-card-name" style={{ color: 'var(--accent)' }}>TOTAL BAHAN BAKU</div>
              <div className="brand-card-num" style={{ fontSize: '24px' }}>{bahanList.length}</div>
              <div className="brand-card-label">Item bahan terdaftar</div>
            </div>

            <div className="brand-card" style={{ borderLeftColor: '#4cc9a0' }}>
              <div className="brand-card-name" style={{ color: '#4cc9a0' }}>TOTAL RESTOK MASUK</div>
              <div className="brand-card-num" style={{ fontSize: '24px', color: '#4cc9a0' }}>
                +{inventorySummary.totalBahanRestok.toLocaleString('id-ID')}
              </div>
              <div className="brand-card-label">Total belanja bahan dari pengeluaran</div>
            </div>

            <div className="brand-card" style={{ borderLeftColor: 'var(--red)' }}>
              <div className="brand-card-name" style={{ color: 'var(--red)' }}>STOK KRITIS</div>
              <div className="brand-card-num" style={{ fontSize: '24px', color: 'var(--red)' }}>
                {inventorySummary.kritisItems.length}
              </div>
              <div className="brand-card-label">Bahan butuh restock segera</div>
            </div>

            <div className="brand-card" style={{ borderLeftColor: 'var(--green)' }}>
              <div className="brand-card-name" style={{ color: 'var(--green)' }}>ESTIMASI NILAI FISIK</div>
              <div className="brand-card-num" style={{ fontSize: '24px', color: 'var(--green)' }}>
                {fmtRp(inventorySummary.estimasiNilaiStokSisa)}
              </div>
              <div className="brand-card-label">Total valuasi inventaris fisik</div>
            </div>
          </div>

          {/* Table: Smart Stock Details */}
          <div className="card">
            <div className="card-title">
              <span>📦 Rincian Smart Stok Bahan Baku Dikopi</span>
              <span>{inventorySummary.items.length} bahan</span>
            </div>

            <div className="table-wrap">
              <table style={{ width: '100%', textAlign: 'left' }}>
                <thead>
                  <tr>
                    <th>NAMA BAHAN</th>
                    <th style={{ textAlign: 'center' }}>RESEP</th>
                    <th style={{ textAlign: 'right' }}>STOK AWAL</th>
                    <th style={{ textAlign: 'right' }}>+ RESTOK (BELANJA)</th>
                    <th style={{ textAlign: 'right' }}>− TERPAKAI (KASIR)</th>
                    <th style={{ textAlign: 'right' }}>= SISA STOK</th>
                    <th style={{ textAlign: 'center' }}>STATUS</th>
                    <th style={{ textAlign: 'right' }}>REKOMENDASI BELI</th>
                    <th style={{ textAlign: 'center' }}>AKSI</th>
                  </tr>
                </thead>
                <tbody>
                  {inventorySummary.items.length === 0 ? (
                    <tr>
                      <td colSpan={9} style={{ textAlign: 'center', padding: '36px', color: 'var(--muted)' }}>
                        Tidak ada data inventaris.
                      </td>
                    </tr>
                  ) : (
                    inventorySummary.items
                      .filter((item) => {
                        if (selectedInventoryStatus !== 'all' && item.status !== selectedInventoryStatus)
                          return false;
                        if (searchTerm) {
                          const term = searchTerm.toLowerCase();
                          return (
                            (item.bahan.nama || '').toLowerCase().includes(term) ||
                            (item.bahan.satuan || '').toLowerCase().includes(term)
                          );
                        }
                        return true;
                      })
                      .map((item) => {
                        const isKritis = item.status === 'kritis';
                        const isMenipis = item.status === 'menipis';

                        return (
                          <tr key={item.bahan.id}>
                            <td>
                              <span style={{ fontWeight: 600, color: '#fff', display: 'block' }}>
                                {item.bahan.nama}
                              </span>
                              <span style={{ fontSize: '11px', color: 'var(--muted)', fontFamily: 'DM Mono' }}>
                                Beli: {item.bahan.qtyBeli} {item.bahan.satuan} ({fmtRp(item.bahan.hargaBeli)})
                              </span>
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              <span
                                className="pill"
                                style={{
                                  background: 'var(--surface2)',
                                  color: 'var(--text2)',
                                  border: '1px solid var(--border)'
                                }}
                              >
                                {item.resepTerkaitCount} menu
                              </span>
                            </td>
                            <td style={{ textAlign: 'right', fontFamily: 'DM Mono', color: 'var(--text2)' }}>
                              {item.stokAwal.toLocaleString('id-ID')} {item.bahan.satuan}
                            </td>
                            <td
                              style={{
                                textAlign: 'right',
                                fontFamily: 'DM Mono',
                                color: '#4cc9a0',
                                fontWeight: 600
                              }}
                            >
                              +{item.restok.toLocaleString('id-ID')} {item.bahan.satuan}
                            </td>
                            <td
                              style={{
                                textAlign: 'right',
                                fontFamily: 'DM Mono',
                                color: 'var(--yellow)',
                                fontWeight: 600
                              }}
                            >
                              −{item.terpakai.toLocaleString('id-ID')} {item.bahan.satuan}
                            </td>
                            <td
                              style={{
                                textAlign: 'right',
                                fontFamily: 'DM Mono',
                                fontWeight: 700,
                                color: '#fff'
                              }}
                            >
                              {item.sisaStok.toLocaleString('id-ID')} {item.bahan.satuan}
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              {isKritis ? (
                                <span
                                  className="pill"
                                  style={{
                                    background: 'var(--red-dim)',
                                    color: 'var(--red)',
                                    border: '1px solid rgba(244,63,94,0.3)'
                                  }}
                                >
                                  🔴 Kritis
                                </span>
                              ) : isMenipis ? (
                                <span
                                  className="pill"
                                  style={{
                                    background: 'var(--yellow-dim)',
                                    color: 'var(--yellow)',
                                    border: '1px solid rgba(245,158,11,0.3)'
                                  }}
                                >
                                  🟡 Menipis
                                </span>
                              ) : (
                                <span className="pill pill-done">🟢 Aman</span>
                              )}
                            </td>
                            <td style={{ textAlign: 'right', fontFamily: 'DM Mono', fontSize: '12px' }}>
                              {isKritis || isMenipis ? (
                                <span style={{ color: 'var(--yellow)', fontWeight: 600 }}>
                                  +{item.rekomendasiBeli} unit (
                                  {item.rekomendasiBeli * item.bahan.qtyBeli} {item.bahan.satuan})
                                </span>
                              ) : (
                                <span style={{ color: 'var(--muted)' }}>Stok Cukup</span>
                              )}
                            </td>
                            <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                              <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                                <button
                                  className="btn btn-ghost btn-sm"
                                  style={{ color: '#4cc9a0', borderColor: 'rgba(76,201,160,0.3)' }}
                                  onClick={() => setRestockBahan(item.bahan)}
                                  title="Tambah / Restok Bahan"
                                >
                                  + Restok
                                </button>
                                <button
                                  className="tbl-action-btn tbl-edit"
                                  onClick={() => setEditingBahan(item.bahan)}
                                  title="Edit Bahan / Set Stok Awal"
                                >
                                  ✏️
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          SUBTAB 3: MASTER BAHAN BAKU (FULL PAGE TABLE VIEW)
      ══════════════════════════════════════════════════════════════ */}
      {activeSubTab === 'bahan' && (
        <div className="card">
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '16px'
            }}
          >
            <div className="card-title" style={{ margin: 0 }}>
              <span>🏷️ Master Bahan Baku Dikopi</span>
              <span>{bahanList.length} item terdaftar</span>
            </div>
            <button className="btn btn-primary btn-sm" onClick={() => setIsAddBahanOpen(true)}>
              + Tambah Bahan Baku
            </button>
          </div>

          <div style={{ marginBottom: '14px' }}>
            <input
              type="text"
              placeholder="Cari master bahan baku..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-input"
              style={{ padding: '7px 12px', fontSize: '12.5px' }}
            />
          </div>

          <div className="table-wrap">
            <table style={{ width: '100%', textAlign: 'left' }}>
              <thead>
                <tr>
                  <th>NAMA BAHAN</th>
                  <th>SATUAN</th>
                  <th style={{ textAlign: 'right' }}>HARGA BELI</th>
                  <th style={{ textAlign: 'right' }}>VOLUME / ISI</th>
                  <th style={{ textAlign: 'right' }}>HARGA PER UNIT</th>
                  <th style={{ textAlign: 'right' }}>AKSI</th>
                </tr>
              </thead>
              <tbody>
                {bahanList.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '36px', color: 'var(--muted)' }}>
                      Belum ada bahan baku.
                    </td>
                  </tr>
                ) : (
                  bahanList
                    .filter((b) => {
                      if (!searchTerm.trim()) return true;
                      const term = searchTerm.toLowerCase();
                      return (
                        (b.nama || '').toLowerCase().includes(term) ||
                        (b.satuan || '').toLowerCase().includes(term)
                      );
                    })
                    .map((b) => {
                      const pricePerUnit =
                        b.qtyBeli > 0 ? Math.round(b.hargaBeli / b.qtyBeli) : 0;
                      return (
                        <tr key={b.id}>
                          <td style={{ color: '#fff', fontWeight: 600 }}>{b.nama}</td>
                          <td style={{ fontFamily: 'DM Mono', color: 'var(--muted)' }}>{b.satuan}</td>
                          <td
                            style={{
                              textAlign: 'right',
                              fontFamily: 'DM Mono',
                              color: 'var(--red)',
                              fontWeight: 600
                            }}
                          >
                            {fmtRp(b.hargaBeli)}
                          </td>
                          <td
                            style={{
                              textAlign: 'right',
                              fontFamily: 'DM Mono',
                              color: 'var(--text2)'
                            }}
                          >
                            {b.qtyBeli.toLocaleString('id-ID')} {b.satuan}
                          </td>
                          <td
                            style={{
                              textAlign: 'right',
                              fontFamily: 'DM Mono',
                              color: 'var(--green)',
                              fontWeight: 700
                            }}
                          >
                            {fmtRp(pricePerUnit)} / {b.satuan}
                          </td>
                          <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                            <button
                              className="tbl-action-btn tbl-edit"
                              onClick={() => setEditingBahan(b)}
                              title="Edit Bahan"
                            >
                              ✏️
                            </button>
                            <button
                              className="tbl-action-btn tbl-del"
                              onClick={() => handleDeleteBahanWithCheck(b.id)}
                              title="Hapus Bahan"
                            >
                              🗑️
                            </button>
                          </td>
                        </tr>
                      );
                    })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          MODAL DIALOGS
      ══════════════════════════════════════════════════════════════ */}
      {/* 1. Add / Edit Resep Modal */}
      {(isAddResepOpen || Boolean(editingResep)) && (
        <AddEditResepModal
          key={editingResep ? `edit-resep-${editingResep.id}` : 'add-resep'}
          isOpen={true}
          onClose={() => {
            setIsAddResepOpen(false);
            setEditingResep(null);
          }}
          initialData={editingResep}
          groups={resepGroups}
          channels={channels}
          getChannelLabel={getChannelLabel}
          activeChannel={activeChannel}
          onSave={(saved) => {
            if (editingResep) {
              onUpdateResep(saved);
            } else {
              onSaveResep(saved);
              setActiveResepId(saved.id);
            }
          }}
        />
      )}

      {/* 2. Add / Edit Combo Modal */}
      {(isAddComboOpen || Boolean(editingCombo)) && (
        <AddEditComboModal
          key={editingCombo ? `edit-combo-${editingCombo.id}` : 'add-combo'}
          isOpen={true}
          onClose={() => {
            setIsAddComboOpen(false);
            setEditingCombo(null);
          }}
          initialData={editingCombo}
          groups={resepGroups}
          channels={channels}
          getChannelLabel={getChannelLabel}
          activeChannel={activeChannel}
          resepList={resepList}
          bahanMap={bahanMap}
          onSave={(saved) => {
            if (editingCombo) {
              onUpdateResep(saved);
            } else {
              onSaveResep(saved);
              setActiveResepId(saved.id);
            }
          }}
        />
      )}

      {/* 3. Add Combo Item Modal */}
      {comboForAddItem && (
        <AddComboItemModal
          key={`add-item-${comboForAddItem.id}`}
          isOpen={Boolean(comboForAddItem)}
          onClose={() => setComboForAddItem(null)}
          combo={comboForAddItem}
          resepList={resepList}
          bahanMap={bahanMap}
          getChannelLabel={getChannelLabel}
          onSave={handleAddComboItem}
        />
      )}

      {/* 4. Copy Resep Modal */}
      {resepToCopy && (
        <CopyResepModal
          key={`copy-${resepToCopy.id}`}
          isOpen={Boolean(resepToCopy)}
          onClose={() => setResepToCopy(null)}
          resep={resepToCopy}
          channels={channels}
          getChannelLabel={getChannelLabel}
          onSave={handleCopyResepToChannel}
        />
      )}

      {/* 5. Add Ingredient Modal */}
      {resepToAddIng && (
        <AddIngredientModal
          key={`add-ing-${resepToAddIng.id}`}
          isOpen={Boolean(resepToAddIng)}
          onClose={() => setResepToAddIng(null)}
          resep={resepToAddIng}
          bahanList={bahanList}
          onSave={handleAddIngredient}
        />
      )}

      {/* 6. Edit Ingredient Modal */}
      {editingIngData && (
        <EditIngredientModal
          key={`edit-ing-${editingIngData.resep.id}-${editingIngData.ingredient.bahanId}`}
          isOpen={Boolean(editingIngData)}
          onClose={() => setEditingIngData(null)}
          resep={editingIngData.resep}
          ingredient={editingIngData.ingredient}
          bahanList={bahanList}
          onSave={handleSaveEditIngredient}
          onDelete={(bId) => handleRemoveIngredient(editingIngData.resep, bId)}
        />
      )}

      {/* 7. Add / Edit Bahan Modal */}
      {(isAddBahanOpen || Boolean(editingBahan)) && (
        <AddEditBahanModal
          key={editingBahan ? `edit-bahan-${editingBahan.id}` : 'add-bahan'}
          isOpen={true}
          onClose={() => {
            setIsAddBahanOpen(false);
            setEditingBahan(null);
          }}
          initialData={editingBahan}
          onSave={(b) => {
            if (editingBahan) {
              onUpdateBahan(b);
            } else {
              onSaveBahan(b);
            }
          }}
        />
      )}

      {/* 8. Manage Channels Modal */}
      {isManageChannelsOpen && (
        <ManageChannelsModal
          key="manage-channels"
          isOpen={isManageChannelsOpen}
          onClose={() => setIsManageChannelsOpen(false)}
          channels={channels}
          channelLabels={channelLabels}
          getChannelLabel={getChannelLabel}
          onSaveChannels={onSaveChannels}
        />
      )}

      {/* 9. Manage Kategori Modal */}
      {isManageKategoriOpen && (
        <ManageKategoriModal
          key="manage-kategori"
          isOpen={isManageKategoriOpen}
          onClose={() => setIsManageKategoriOpen(false)}
          groups={resepGroups}
          resepList={resepList}
          onSaveGroups={onSaveResepGroups}
        />
      )}

      {/* 10. Quick Restock Modal */}
      {Boolean(restockBahan) && (
        <QuickRestockModal
          key={`quick-restock-${restockBahan?.id}`}
          isOpen={Boolean(restockBahan)}
          onClose={() => setRestockBahan(null)}
          bahan={restockBahan}
          onSaveRestock={handleSaveRestock}
        />
      )}
    </div>
  );
};
