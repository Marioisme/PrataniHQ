import React, { useState, useMemo } from 'react';
import { Search, CloudSync } from 'lucide-react';
import type { KeuData, BrandId, TransaksiItem } from '../../types';

interface BukuKasViewProps {
  keuData: KeuData;
  activeBrand: BrandId;
  onBrandChange: (brand: BrandId) => void;
  onTriggerSync?: () => void;
  onAddTransaction?: () => void;
}

export const BukuKasView: React.FC<BukuKasViewProps> = ({
  keuData,
  activeBrand,
  onBrandChange,
  onTriggerSync
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'masuk' | 'keluar'>('all');
  const [filterMonth, setFilterMonth] = useState<string>('all');

  // Ambil transaksi sesuai brand aktif
  const currentList: TransaksiItem[] = useMemo(() => {
    if (activeBrand === 'dikopi') return keuData.dikopi || [];
    if (activeBrand === 'kolektiva') return keuData.kolektiva || [];
    if (activeBrand === 'imagineer') return keuData.imagineer || keuData.studio || [];
    return [];
  }, [keuData, activeBrand]);

  // List bulan unik untuk dropdown
  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    currentList.forEach((t) => {
      if (t.tanggal) {
        months.add(t.tanggal.substring(0, 7)); // YYYY-MM
      }
    });
    return Array.from(months).sort().reverse();
  }, [currentList]);

  // Filter list
  const filteredList = useMemo(() => {
    return currentList.filter((t) => {
      // Type filter
      if (filterType !== 'all' && t.tipe !== filterType) return false;
      // Month filter
      if (filterMonth !== 'all' && (!t.tanggal || !t.tanggal.startsWith(filterMonth))) return false;
      // Search term
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const descMatch = (t.deskripsi || '').toLowerCase().includes(term);
        const catMatch = (t.kategori || '').toLowerCase().includes(term);
        if (!descMatch && !catMatch) return false;
      }
      return true;
    }).sort((a, b) => new Date(b.created_at || b.tanggal || 0).getTime() - new Date(a.created_at || a.tanggal || 0).getTime());
  }, [currentList, filterType, filterMonth, searchTerm]);

  // Hitung total filtered
  const stats = useMemo(() => {
    let masuk = 0;
    let keluar = 0;
    let margin = 0;
    filteredList.forEach((t) => {
      const nom = Number(t.nominal) || 0;
      if (t.tipe === 'masuk') {
        masuk += nom;
        margin += t._margin !== undefined ? Number(t._margin) : nom;
      } else {
        keluar += nom;
      }
    });
    return { masuk, keluar, net: masuk - keluar, margin };
  }, [filteredList]);

  const fmtRp = (num: number) => 'Rp ' + Math.round(num).toLocaleString('id-ID');

  return (
    <div className="space-y-5">
      {/* Top Header & Brand Selector Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-white tracking-tight">Buku Kas & Jurnal Keuangan</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Buku besar transaksi kas, margin produk, dan mutasi arus kas.
          </p>
        </div>

        {/* Brand Selector Buttons */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-surface border border-white/5">
          {(['dikopi', 'kolektiva', 'imagineer'] as BrandId[]).map((b) => (
            <button
              key={b}
              onClick={() => onBrandChange(b)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                activeBrand === b
                  ? 'bg-sky-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {b}
            </button>
          ))}
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="glass-card p-4 rounded-xl border border-white/5">
          <div className="text-[11px] font-mono text-slate-400 uppercase font-semibold">Total Pemasukan</div>
          <div className="text-xl font-mono font-black text-emerald-400 mt-1">{fmtRp(stats.masuk)}</div>
        </div>
        <div className="glass-card p-4 rounded-xl border border-white/5">
          <div className="text-[11px] font-mono text-slate-400 uppercase font-semibold">Total Pengeluaran</div>
          <div className="text-xl font-mono font-black text-rose-400 mt-1">{fmtRp(stats.keluar)}</div>
        </div>
        <div className="glass-card p-4 rounded-xl border border-white/5">
          <div className="text-[11px] font-mono text-slate-400 uppercase font-semibold">Surplus / Arus Kas Bersih</div>
          <div className={`text-xl font-mono font-black mt-1 ${stats.net >= 0 ? 'text-sky-400' : 'text-rose-400'}`}>
            {fmtRp(stats.net)}
          </div>
        </div>
      </div>

      {/* Filters & Actions Bar */}
      <div className="glass-card p-3 rounded-xl border border-white/5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-[240px]">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari transaksi berdasarkan deskripsi atau kategori..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-[#0a0e17] border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500/50"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Filter Type */}
          <div className="flex items-center rounded-lg bg-[#0a0e17] p-0.5 border border-white/10 text-xs">
            <button
              onClick={() => setFilterType('all')}
              className={`px-2.5 py-1 rounded-md font-medium text-[11px] transition-colors ${
                filterType === 'all' ? 'bg-white/10 text-white font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Semua
            </button>
            <button
              onClick={() => setFilterType('masuk')}
              className={`px-2.5 py-1 rounded-md font-medium text-[11px] transition-colors ${
                filterType === 'masuk' ? 'bg-emerald-500/20 text-emerald-300 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Pemasukan
            </button>
            <button
              onClick={() => setFilterType('keluar')}
              className={`px-2.5 py-1 rounded-md font-medium text-[11px] transition-colors ${
                filterType === 'keluar' ? 'bg-rose-500/20 text-rose-300 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Pengeluaran
            </button>
          </div>

          {/* Month Dropdown */}
          <select
            value={filterMonth}
            onChange={(e) => setFilterMonth(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg bg-[#0a0e17] border border-white/10 text-[11px] font-mono text-slate-300 focus:outline-none"
          >
            <option value="all">Semua Bulan</option>
            {availableMonths.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>

          {/* Sync Trigger button for Dikopi */}
          {activeBrand === 'dikopi' && onTriggerSync && (
            <button
              onClick={onTriggerSync}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-300 text-xs font-medium transition-all"
            >
              <CloudSync className="w-3.5 h-3.5 text-emerald-400" />
              <span>Sync Cloud</span>
            </button>
          )}
        </div>
      </div>

      {/* Ledger Table */}
      <div className="glass-card rounded-2xl overflow-hidden border border-white/5">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="text-slate-400 bg-white/[0.02] border-b border-white/5 text-[11px] font-mono">
                <th className="py-3 px-4">TANGGAL</th>
                <th className="py-3 px-4">DESKRIPSI</th>
                <th className="py-3 px-4">KATEGORI</th>
                <th className="py-3 px-4">SUMBER</th>
                <th className="py-3 px-4 text-right">NOMINAL</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-sans">
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-slate-500">
                    Tidak ada transaksi yang cocok dengan filter.
                  </td>
                </tr>
              ) : (
                filteredList.map((t, idx) => (
                  <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 px-4 font-mono text-slate-300 whitespace-nowrap">
                      {t.tanggal}
                    </td>
                    <td className="py-3 px-4 text-white font-medium">
                      <div className="flex items-center gap-2">
                        <span>{t.deskripsi}</span>
                        {t._source === 'kasir_event' && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-sky-500/10 text-sky-400 border border-sky-500/20">
                            Kasir Event
                          </span>
                        )}
                        {t.items && t.items.length > 0 && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            {t.items.length} item
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-400">
                      <span className="px-2 py-0.5 rounded bg-white/5 text-slate-300 text-[10px]">
                        {t.kategori || 'Umum'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-400 capitalize">
                      {t.sumber || 'cash'}
                    </td>
                    <td className={`py-3 px-4 text-right font-mono font-bold whitespace-nowrap ${
                      t.tipe === 'masuk' ? 'text-emerald-400' : 'text-rose-400'
                    }`}>
                      {t.tipe === 'masuk' ? '+' : '-'} {fmtRp(t.nominal)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
