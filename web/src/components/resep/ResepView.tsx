import React, { useState, useMemo } from 'react';
import { 
  UtensilsCrossed, 
  Package, 
  Search, 
  ChevronRight, 
  Layers,
  AlertTriangle,
  Boxes,
  TrendingDown
} from 'lucide-react';
import type { ResepItem, BahanItem, TransaksiItem } from '../../types';
import { computeInventorySummary } from '../../lib/inventoryEngine';

interface ResepViewProps {
  resepList: ResepItem[];
  bahanList: BahanItem[];
  transaksiList?: TransaksiItem[];
  onAddResep?: () => void;
  onAddBahan?: () => void;
}

export const ResepView: React.FC<ResepViewProps> = ({
  resepList,
  bahanList,
  transaksiList = []
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'resep' | 'bahan' | 'inventory'>('resep');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedKategori, setSelectedKategori] = useState<string>('all');
  const [selectedInventoryStatus, setSelectedInventoryStatus] = useState<string>('all');
  const [expandedResepId, setExpandedResepId] = useState<string | number | null>(null);

  // Map bahan untuk lookup cepat by ID
  const bahanMap = useMemo(() => {
    const map = new Map<string, BahanItem>();
    bahanList.forEach((b) => map.set(String(b.id), b));
    return map;
  }, [bahanList]);

  // Hitung Smart Inventory Summary
  const inventorySummary = useMemo(() => {
    return computeInventorySummary(bahanList, resepList, transaksiList);
  }, [bahanList, resepList, transaksiList]);

  // Kalkulasi HPP akurat per resep
  const getRecipeCost = (resep: ResepItem) => {
    let totalHpp = 0;
    const ingredientDetails: Array<{
      nama: string;
      qty: number;
      satuan: string;
      subtotal: number;
    }> = [];

    (resep.ingredients || []).forEach((ing) => {
      const b = bahanMap.get(String(ing.bahanId));
      if (b && b.qtyBeli > 0) {
        const costPerUnit = b.hargaBeli / b.qtyBeli;
        const subtotal = Math.round(costPerUnit * ing.qty);
        totalHpp += subtotal;
        ingredientDetails.push({
          nama: b.nama,
          qty: ing.qty,
          satuan: b.satuan,
          subtotal
        });
      } else {
        ingredientDetails.push({
          nama: `Bahan #${ing.bahanId}`,
          qty: ing.qty,
          satuan: 'unit',
          subtotal: 0
        });
      }
    });

    const finalHpp = totalHpp > 0 ? totalHpp : (resep.hppSnapshot || 0);
    const hargaJual = resep.hargaJual || 0;
    const marginRp = hargaJual - finalHpp;
    const marginPct = hargaJual > 0 ? Math.round((marginRp / hargaJual) * 100) : 0;

    return {
      hpp: finalHpp,
      marginRp,
      marginPct,
      ingredients: ingredientDetails
    };
  };

  // Kategori unik
  const kategoriList = useMemo(() => {
    const set = new Set<string>();
    resepList.forEach((r) => {
      if (r.kategori) set.add(r.kategori);
    });
    return Array.from(set).sort();
  }, [resepList]);

  // Filter resep
  const filteredResep = useMemo(() => {
    return resepList.filter((r) => {
      if (selectedKategori !== 'all' && r.kategori !== selectedKategori) return false;
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const namaMatch = (r.nama || '').toLowerCase().includes(term);
        const katMatch = (r.kategori || '').toLowerCase().includes(term);
        if (!namaMatch && !katMatch) return false;
      }
      return true;
    });
  }, [resepList, selectedKategori, searchTerm]);

  // Filter bahan
  const filteredBahan = useMemo(() => {
    return bahanList.filter((b) => {
      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase();
      return (
        (b.nama || '').toLowerCase().includes(term) ||
        (b.satuan || '').toLowerCase().includes(term)
      );
    });
  }, [bahanList, searchTerm]);

  // Filter Smart Inventory items
  const filteredInventory = useMemo(() => {
    return inventorySummary.items.filter((item) => {
      if (selectedInventoryStatus !== 'all' && item.status !== selectedInventoryStatus) return false;
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        return (
          (item.bahan.nama || '').toLowerCase().includes(term) ||
          (item.bahan.satuan || '').toLowerCase().includes(term)
        );
      }
      return true;
    });
  }, [inventorySummary.items, selectedInventoryStatus, searchTerm]);

  const fmtRp = (num: number) => {
    return 'Rp ' + Math.round(num).toLocaleString('id-ID');
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <UtensilsCrossed className="w-5 h-5 text-amber-400" />
            <span>Katalog Resep & Smart Inventory Dikopi</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Kalkulasi otomatis HPP, margin keuntungan produk, dan auto-deduct persediaan bahan baku dari kasir.
          </p>
        </div>

        {/* Sub-tab Switcher */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-surface border border-white/5 overflow-x-auto">
          <button
            onClick={() => setActiveSubTab('resep')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
              activeSubTab === 'resep'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Resep Menu ({resepList.length})</span>
          </button>
          
          <button
            onClick={() => setActiveSubTab('inventory')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
              activeSubTab === 'inventory'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Boxes className="w-3.5 h-3.5" />
            <span>Smart Stok</span>
            {inventorySummary.kritisItems.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-rose-500 text-white font-bold animate-pulse">
                {inventorySummary.kritisItems.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveSubTab('bahan')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
              activeSubTab === 'bahan'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>Master Bahan ({bahanList.length})</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-card p-3 rounded-xl border border-white/5 flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={
              activeSubTab === 'resep'
                ? 'Cari resep menu...'
                : activeSubTab === 'inventory'
                ? 'Cari stok bahan terkini...'
                : 'Cari master bahan baku...'
            }
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-[#0a0e17] border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50"
          />
        </div>

        {activeSubTab === 'resep' && (
          <div className="flex items-center gap-2">
            <select
              value={selectedKategori}
              onChange={(e) => setSelectedKategori(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg bg-[#0a0e17] border border-white/10 text-xs font-medium text-slate-300 focus:outline-none"
            >
              <option value="all">Semua Kategori</option>
              {kategoriList.map((kat) => (
                <option key={kat} value={kat}>{kat}</option>
              ))}
            </select>
          </div>
        )}

        {activeSubTab === 'inventory' && (
          <div className="flex items-center gap-2">
            <select
              value={selectedInventoryStatus}
              onChange={(e) => setSelectedInventoryStatus(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg bg-[#0a0e17] border border-white/10 text-xs font-medium text-slate-300 focus:outline-none"
            >
              <option value="all">Semua Status Stok</option>
              <option value="kritis">🔴 Kritis (Restock Urgent)</option>
              <option value="menipis">🟡 Menipis</option>
              <option value="aman">🟢 Aman</option>
            </select>
          </div>
        )}
      </div>

      {/* SUBTAB 1: SMART INVENTORY STOK TERKINI */}
      {activeSubTab === 'inventory' && (
        <div className="space-y-5">
          {/* Inventory KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="glass-card p-4 rounded-xl border border-white/5">
              <span className="text-[11px] text-slate-400 font-mono block">TOTAL BAHAN BAKU</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-bold text-white font-mono">{bahanList.length}</span>
                <span className="text-xs text-slate-400">item terdaftar</span>
              </div>
            </div>

            <div className="glass-card p-4 rounded-xl border border-rose-500/20 bg-rose-500/5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-rose-300 font-mono">STOK KRITIS (PERLU RESTOCK)</span>
                <AlertTriangle className="w-4 h-4 text-rose-400" />
              </div>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-bold text-rose-400 font-mono">
                  {inventorySummary.kritisItems.length}
                </span>
                <span className="text-xs text-rose-300/70">bahan butuh restock</span>
              </div>
            </div>

            <div className="glass-card p-4 rounded-xl border border-amber-500/20 bg-amber-500/5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-amber-300 font-mono">STOK MENIPIS</span>
                <TrendingDown className="w-4 h-4 text-amber-400" />
              </div>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-bold text-amber-400 font-mono">
                  {inventorySummary.menipisItems.length}
                </span>
                <span className="text-xs text-amber-300/70">mendekati batas aman</span>
              </div>
            </div>

            <div className="glass-card p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5">
              <span className="text-[11px] text-emerald-300 font-mono block">ESTIMASI NILAI STOK FISIK</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-bold text-emerald-400 font-mono">
                  {fmtRp(inventorySummary.estimasiNilaiStokSisa)}
                </span>
              </div>
            </div>
          </div>

          {/* Critical Restock Alert Banner */}
          {inventorySummary.kritisItems.length > 0 && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
              <div className="text-xs space-y-1">
                <p className="font-bold text-rose-200">
                  Perhatian Barista & Store Manager: Terdapat {inventorySummary.kritisItems.length} bahan baku dengan stok kritis!
                </p>
                <p className="text-rose-300/80">
                  Bahan: {inventorySummary.kritisItems.map((k) => `${k.bahan.nama} (sisa ${k.sisaStok} ${k.bahan.satuan})`).join(', ')}. Disarankan segera melakukan restock pembelian bahan baku.
                </p>
              </div>
            </div>
          )}

          {/* Table: Smart Stock Details */}
          <div className="glass-card rounded-2xl border border-white/5 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-slate-400 bg-white/[0.02] border-b border-white/5 text-[11px] font-mono">
                    <th className="py-3 px-4">NAMA BAHAN</th>
                    <th className="py-3 px-4 text-center">RESEP TERKAIT</th>
                    <th className="py-3 px-4 text-right">STOK AWAL</th>
                    <th className="py-3 px-4 text-right">TERPAKAI (KASIR)</th>
                    <th className="py-3 px-4 text-right">SISA STOK</th>
                    <th className="py-3 px-4 w-36">KAPASITAS</th>
                    <th className="py-3 px-4 text-center">STATUS</th>
                    <th className="py-3 px-4 text-right">REKOMENDASI BELI</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 font-sans">
                  {filteredInventory.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-10 text-center text-slate-500">
                        Tidak ada bahan yang cocok dengan filter.
                      </td>
                    </tr>
                  ) : (
                    filteredInventory.map((item) => {
                      const isKritis = item.status === 'kritis';
                      const isMenipis = item.status === 'menipis';

                      return (
                        <tr key={item.bahan.id} className="hover:bg-white/[0.02] transition-colors">
                          <td className="py-3 px-4">
                            <span className="font-semibold text-white block">{item.bahan.nama}</span>
                            <span className="text-[10px] text-slate-500 font-mono">Kemasan beli: {item.bahan.qtyBeli} {item.bahan.satuan} ({fmtRp(item.bahan.hargaBeli)})</span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className="font-mono text-xs px-2 py-0.5 rounded bg-white/5 text-slate-300">
                              {item.resepTerkaitCount} menu
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right font-mono text-slate-400">
                            {item.stokAwal.toLocaleString('id-ID')} {item.bahan.satuan}
                          </td>
                          <td className="py-3 px-4 text-right font-mono text-amber-400 font-semibold">
                            −{item.terpakai.toLocaleString('id-ID')} {item.bahan.satuan}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-white">
                            {item.sisaStok.toLocaleString('id-ID')} {item.bahan.satuan}
                          </td>
                          <td className="py-3 px-4">
                            <div className="space-y-1">
                              <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                                <div 
                                  className={`h-full rounded-full transition-all ${
                                    isKritis ? 'bg-rose-500' : isMenipis ? 'bg-amber-400' : 'bg-emerald-400'
                                  }`}
                                  style={{ width: `${Math.min(100, Math.max(0, item.persenSisa))}%` }}
                                />
                              </div>
                              <span className="text-[10px] text-slate-400 font-mono block text-right">
                                {item.persenSisa}%
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-center">
                            {isKritis ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                                🔴 Kritis
                              </span>
                            ) : isMenipis ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                                🟡 Menipis
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                🟢 Aman
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right font-mono text-xs">
                            {isKritis || isMenipis ? (
                              <span className="text-amber-300 font-semibold">
                                +{item.rekomendasiBeli} kemasan ({item.rekomendasiBeli * item.bahan.qtyBeli} {item.bahan.satuan})
                              </span>
                            ) : (
                              <span className="text-slate-500">Stok Cukup</span>
                            )}
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

      {/* SUBTAB 2: RESEP VIEW */}
      {activeSubTab === 'resep' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredResep.length === 0 ? (
            <div className="col-span-full py-12 text-center text-slate-500 glass-card rounded-2xl">
              Tidak ada resep yang cocok dengan kriteria pencarian.
            </div>
          ) : (
            filteredResep.map((r) => {
              const cost = getRecipeCost(r);
              const isExpanded = expandedResepId === r.id;

              return (
                <div
                  key={r.id}
                  className="glass-card rounded-2xl p-5 border border-white/5 hover:border-amber-500/30 transition-all flex flex-col justify-between"
                >
                  <div>
                    {/* Header Card */}
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div>
                        <h4 className="font-bold text-base text-white tracking-tight leading-snug">
                          {r.nama}
                        </h4>
                        <div className="flex items-center gap-2 mt-1">
                          {r.kategori && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-white/5 text-slate-300 border border-white/10">
                              {r.kategori}
                            </span>
                          )}
                          <span className="text-[11px] text-slate-400">
                            {r.ingredients?.length || 0} bahan
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-extrabold text-white font-mono block">
                          {fmtRp(r.hargaJual)}
                        </span>
                        <span className="text-[10px] text-emerald-400 font-mono font-semibold">
                          +{cost.marginPct}% margin
                        </span>
                      </div>
                    </div>

                    {/* Breakdown Cost Strip */}
                    <div className="p-2.5 rounded-xl bg-surface border border-white/5 flex items-center justify-between text-xs font-mono mb-3">
                      <div>
                        <span className="text-[10px] text-slate-500 block">HPP / PORSI</span>
                        <span className="text-amber-400 font-bold">{fmtRp(cost.hpp)}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-500 block">PROFIT KOTOR</span>
                        <span className="text-emerald-400 font-bold">+{fmtRp(cost.marginRp)}</span>
                      </div>
                    </div>

                    {/* Rincian Komposisi Bahan Dropdown */}
                    {isExpanded && (
                      <div className="space-y-2 pt-2 border-t border-white/5 text-xs animate-fadeIn">
                        <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block mb-1">
                          Komposisi Gramasi / Takaran:
                        </span>
                        {cost.ingredients.map((ing, idx) => (
                          <div key={idx} className="flex items-center justify-between text-slate-300 py-1 border-b border-white/[0.03] text-[11px]">
                            <span>{ing.nama}</span>
                            <div className="flex items-center gap-3 font-mono">
                              <span className="text-slate-400">{ing.qty} {ing.satuan}</span>
                              <span className="text-slate-200 font-medium">{fmtRp(ing.subtotal)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Toggle button */}
                  <button
                    onClick={() => setExpandedResepId(isExpanded ? null : r.id)}
                    className="w-full mt-3 pt-2.5 border-t border-white/5 text-slate-400 hover:text-white text-[11px] font-medium flex items-center justify-center gap-1 transition-colors"
                  >
                    <span>{isExpanded ? 'Tutup Rincian' : 'Lihat Bahan & Gramasi'}</span>
                    <ChevronRight className={`w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                  </button>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* SUBTAB 3: MASTER BAHAN BAKU */}
      {activeSubTab === 'bahan' && (
        <div className="glass-card rounded-2xl border border-white/5 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-slate-400 bg-white/[0.02] border-b border-white/5 text-[11px] font-mono">
                  <th className="py-3 px-4">NAMA BAHAN</th>
                  <th className="py-3 px-4">SATUAN DASAR</th>
                  <th className="py-3 px-4 text-right">HARGA BELI</th>
                  <th className="py-3 px-4 text-right">VOLUME / ISI</th>
                  <th className="py-3 px-4 text-right">HARGA PER UNIT</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-sans">
                {filteredBahan.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-10 text-center text-slate-500">
                      Tidak ada bahan baku yang cocok.
                    </td>
                  </tr>
                ) : (
                  filteredBahan.map((b) => {
                    const pricePerUnit = b.qtyBeli > 0 ? Math.round(b.hargaBeli / b.qtyBeli) : 0;
                    return (
                      <tr key={b.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-3 px-4 text-white font-medium">{b.nama}</td>
                        <td className="py-3 px-4 font-mono text-slate-400">{b.satuan}</td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-rose-400">
                          {fmtRp(b.hargaBeli)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-slate-300">
                          {b.qtyBeli.toLocaleString('id-ID')} {b.satuan}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-semibold text-emerald-400">
                          {fmtRp(pricePerUnit)} / {b.satuan}
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
    </div>
  );
};
