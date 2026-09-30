import React, { useState, useMemo } from 'react';
import { 
  UtensilsCrossed, 
  Package, 
  Search, 
  ChevronRight, 
  Layers
} from 'lucide-react';
import type { ResepItem, BahanItem } from '../../types';

interface ResepViewProps {
  resepList: ResepItem[];
  bahanList: BahanItem[];
  onAddResep?: () => void;
  onAddBahan?: () => void;
}

export const ResepView: React.FC<ResepViewProps> = ({
  resepList,
  bahanList
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'resep' | 'bahan'>('resep');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedKategori, setSelectedKategori] = useState<string>('all');
  const [expandedResepId, setExpandedResepId] = useState<string | number | null>(null);

  // Map bahan untuk lookup cepat by ID
  const bahanMap = useMemo(() => {
    const map = new Map<string, BahanItem>();
    bahanList.forEach((b) => map.set(String(b.id), b));
    return map;
  }, [bahanList]);

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
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        return (b.nama || '').toLowerCase().includes(term);
      }
      return true;
    });
  }, [bahanList, searchTerm]);

  const fmtRp = (n: number) => 'Rp ' + Math.round(n).toLocaleString('id-ID');

  return (
    <div className="space-y-5">
      {/* Top Header & Tab Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <UtensilsCrossed className="w-5 h-5 text-amber-400" />
            <span>Katalog Resep & Manajemen Bahan Baku Dikopi</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Kalkulasi otomatis HPP, margin keuntungan produk, dan manajemen stok bahan.
          </p>
        </div>

        {/* Sub-tab Switcher */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-surface border border-white/5">
          <button
            onClick={() => setActiveSubTab('resep')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeSubTab === 'resep'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Resep Menu ({resepList.length})</span>
          </button>
          <button
            onClick={() => setActiveSubTab('bahan')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeSubTab === 'bahan'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>Bahan Baku ({bahanList.length})</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-card p-3 rounded-xl border border-white/5 flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={activeSubTab === 'resep' ? 'Cari resep menu...' : 'Cari bahan baku...'}
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
      </div>

      {/* Content: Resep View */}
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
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          {r.kategori || 'Minuman'}
                        </span>
                        <h4 className="font-bold text-sm text-white mt-1.5 leading-snug">{r.nama}</h4>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-mono font-black text-emerald-400">
                          {fmtRp(r.hargaJual)}
                        </div>
                        <div className="text-[10px] font-mono text-slate-500">Harga Jual</div>
                      </div>
                    </div>

                    {/* Margin & HPP Stats */}
                    <div className="grid grid-cols-2 gap-2 my-3 p-2.5 rounded-xl bg-surface-2 border border-white/5 text-xs font-mono">
                      <div>
                        <span className="text-slate-400 text-[10px] block">HPP Pokok</span>
                        <span className="font-bold text-rose-400">{fmtRp(cost.hpp)}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-slate-400 text-[10px] block">Margin Bersih</span>
                        <span className="font-bold text-sky-400">
                          {fmtRp(cost.marginRp)} ({cost.marginPct}%)
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Expand Ingredients Button */}
                  <div>
                    <button
                      onClick={() => setExpandedResepId(isExpanded ? null : r.id)}
                      className="w-full mt-2 pt-2 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-400 hover:text-amber-400 transition-colors"
                    >
                      <span>Komposisi: {r.ingredients?.length || 0} bahan</span>
                      <ChevronRight className={`w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                    </button>

                    {/* Ingredients List Drawer */}
                    {isExpanded && (
                      <div className="mt-3 pt-2 space-y-1.5 border-t border-white/5 text-xs">
                        {cost.ingredients.map((ing, i) => (
                          <div key={i} className="flex justify-between items-center text-slate-300 text-[11px]">
                            <span>
                              {ing.nama} <span className="text-slate-500">({ing.qty} {ing.satuan})</span>
                            </span>
                            <span className="font-mono text-slate-400">{fmtRp(ing.subtotal)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Content: Bahan Baku Table */}
      {activeSubTab === 'bahan' && (
        <div className="glass-card rounded-2xl overflow-hidden border border-white/5">
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
