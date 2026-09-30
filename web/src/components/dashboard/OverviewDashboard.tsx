import React from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Receipt, 
  Coffee, 
  ShoppingBag, 
  Sparkles,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import type { KeuData, BrandId } from '../../types';

interface OverviewDashboardProps {
  keuData: KeuData;
  activeBrand: BrandId;
  onNavigateToKeuangan: (brand?: BrandId) => void;
}

export const OverviewDashboard: React.FC<OverviewDashboardProps> = ({
  keuData,
  onNavigateToKeuangan
}) => {
  // Hitung agregasi per brand
  const calculateTotals = (txns: KeuData['dikopi']) => {
    let masuk = 0;
    let keluar = 0;
    let margin = 0;
    txns.forEach((t) => {
      const nom = Number(t.nominal) || 0;
      if (t.tipe === 'masuk') {
        masuk += nom;
        margin += t._margin !== undefined ? Number(t._margin) : nom;
      } else {
        keluar += nom;
      }
    });
    return { masuk, keluar, net: masuk - keluar, margin };
  };

  const dikopiStats = calculateTotals(keuData.dikopi || []);
  const kolektivaStats = calculateTotals(keuData.kolektiva || []);
  const imagineerStats = calculateTotals(keuData.imagineer || keuData.studio || []);

  const totalOmzet = dikopiStats.masuk + kolektivaStats.masuk + imagineerStats.masuk;
  const totalPengeluaran = dikopiStats.keluar + kolektivaStats.keluar + imagineerStats.keluar;
  const totalNet = totalOmzet - totalPengeluaran;

  const fmtRp = (num: number) => {
    return 'Rp ' + Math.round(num).toLocaleString('id-ID');
  };

  // Kumpulkan transaksi gabungan terkini
  const allTxns = [
    ...(keuData.dikopi || []).map((t) => ({ ...t, brandTag: 'Dikopi', brandColor: 'text-amber-400 bg-amber-500/10' })),
    ...(keuData.kolektiva || []).map((t) => ({ ...t, brandTag: 'Kolektiva', brandColor: 'text-purple-400 bg-purple-500/10' })),
    ...(keuData.imagineer || keuData.studio || []).map((t) => ({ ...t, brandTag: 'Imagineer', brandColor: 'text-rose-400 bg-rose-500/10' })),
  ].sort((a, b) => new Date(b.created_at || b.tanggal || 0).getTime() - new Date(a.created_at || a.tanggal || 0).getTime());

  const recentTxns = allTxns.slice(0, 8);

  return (
    <div className="space-y-6">
      {/* Top Welcome & KPI Summary */}
      <div>
        <h3 className="text-xl font-bold text-white tracking-tight">Financial Overview & Konsolidasi</h3>
        <p className="text-xs text-slate-400 mt-1">
          Ringkasan arus kas dan performa holding multi-brand Pratani Creative.
        </p>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Omzet */}
        <div className="glass-card p-5 rounded-2xl relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Omzet Konsolidasi</span>
            <div className="w-8 h-8 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black font-mono text-white tracking-tight">
              {fmtRp(totalOmzet)}
            </div>
            <div className="flex items-center gap-1.5 mt-2 text-[11px] text-sky-400 font-medium">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>Pemasukan bruto semua unit bisnis</span>
            </div>
          </div>
        </div>

        {/* Total Pengeluaran */}
        <div className="glass-card p-5 rounded-2xl relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Pengeluaran</span>
            <div className="w-8 h-8 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black font-mono text-white tracking-tight">
              {fmtRp(totalPengeluaran)}
            </div>
            <div className="flex items-center gap-1.5 mt-2 text-[11px] text-rose-400 font-medium">
              <ArrowDownRight className="w-3.5 h-3.5" />
              <span>Biaya operasional & belanja stok</span>
            </div>
          </div>
        </div>

        {/* Net Arus Kas */}
        <div className="glass-card p-5 rounded-2xl relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Net Arus Kas (Bersih)</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className={`text-2xl font-black font-mono tracking-tight ${totalNet >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {fmtRp(totalNet)}
            </div>
            <div className="flex items-center gap-1.5 mt-2 text-[11px] text-slate-400 font-medium">
              <span>Selisih pemasukan dan pengeluaran</span>
            </div>
          </div>
        </div>
      </div>

      {/* Brand Unit Cards Breakdown */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-xs font-mono uppercase font-bold text-slate-400 tracking-wider">
            Performa Finansial per Unit Brand
          </h4>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Dikopi Card */}
          <div 
            onClick={() => onNavigateToKeuangan('dikopi')}
            className="glass-card p-4 rounded-xl border border-white/5 hover:border-amber-500/30 cursor-pointer transition-all"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
                  <Coffee className="w-4 h-4" />
                </div>
                <span className="font-bold text-sm text-white">Dikopi F&B</span>
              </div>
              <span className="text-[10px] font-mono text-slate-400 bg-white/5 px-2 py-0.5 rounded">
                {(keuData.dikopi || []).length} transaksi
              </span>
            </div>
            <div className="space-y-1.5 font-mono text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Omzet:</span>
                <span className="text-white font-semibold">{fmtRp(dikopiStats.masuk)}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Belanja/Beban:</span>
                <span className="text-rose-400">{fmtRp(dikopiStats.keluar)}</span>
              </div>
              <div className="pt-2 border-t border-white/5 flex justify-between font-bold">
                <span className="text-slate-300">Surplus:</span>
                <span className={dikopiStats.net >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                  {fmtRp(dikopiStats.net)}
                </span>
              </div>
            </div>
          </div>

          {/* Kolektiva Card */}
          <div 
            onClick={() => onNavigateToKeuangan('kolektiva')}
            className="glass-card p-4 rounded-xl border border-white/5 hover:border-purple-500/30 cursor-pointer transition-all"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center">
                  <ShoppingBag className="w-4 h-4" />
                </div>
                <span className="font-bold text-sm text-white">Kolektiva Apparel</span>
              </div>
              <span className="text-[10px] font-mono text-slate-400 bg-white/5 px-2 py-0.5 rounded">
                {(keuData.kolektiva || []).length} transaksi
              </span>
            </div>
            <div className="space-y-1.5 font-mono text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Omzet:</span>
                <span className="text-white font-semibold">{fmtRp(kolektivaStats.masuk)}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Beban Produksi:</span>
                <span className="text-rose-400">{fmtRp(kolektivaStats.keluar)}</span>
              </div>
              <div className="pt-2 border-t border-white/5 flex justify-between font-bold">
                <span className="text-slate-300">Surplus:</span>
                <span className={kolektivaStats.net >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                  {fmtRp(kolektivaStats.net)}
                </span>
              </div>
            </div>
          </div>

          {/* Imagineer Card */}
          <div 
            onClick={() => onNavigateToKeuangan('imagineer')}
            className="glass-card p-4 rounded-xl border border-white/5 hover:border-rose-500/30 cursor-pointer transition-all"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
                <span className="font-bold text-sm text-white">Imagineer Creative</span>
              </div>
              <span className="text-[10px] font-mono text-slate-400 bg-white/5 px-2 py-0.5 rounded">
                {(keuData.imagineer || keuData.studio || []).length} transaksi
              </span>
            </div>
            <div className="space-y-1.5 font-mono text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Omzet:</span>
                <span className="text-white font-semibold">{fmtRp(imagineerStats.masuk)}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Pengeluaran:</span>
                <span className="text-rose-400">{fmtRp(imagineerStats.keluar)}</span>
              </div>
              <div className="pt-2 border-t border-white/5 flex justify-between font-bold">
                <span className="text-slate-300">Surplus:</span>
                <span className={imagineerStats.net >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                  {fmtRp(imagineerStats.net)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity Table */}
      <div className="glass-card rounded-2xl p-5 border border-white/5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Receipt className="w-4 h-4 text-sky-400" />
            <h4 className="text-sm font-bold text-white">Transaksi Terkini (Lintas Brand)</h4>
          </div>
          <button 
            onClick={() => onNavigateToKeuangan()}
            className="text-xs font-semibold text-sky-400 hover:text-sky-300 transition-colors"
          >
            Buka Buku Kas Lengkap →
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="text-slate-400 border-b border-white/5 text-[11px] font-mono">
                <th className="pb-2.5">TANGGAL</th>
                <th className="pb-2.5">BRAND</th>
                <th className="pb-2.5">DESKRIPSI</th>
                <th className="pb-2.5">KATEGORI</th>
                <th className="pb-2.5 text-right">NOMINAL</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-sans">
              {recentTxns.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500">
                    Belum ada transaksi yang tercatat. Hubungkan folder data untuk menampilkan.
                  </td>
                </tr>
              ) : (
                recentTxns.map((t, idx) => (
                  <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-2.5 font-mono text-slate-300">{t.tanggal}</td>
                    <td className="py-2.5">
                      <span className={`px-2 py-0.5 rounded font-mono text-[10px] font-semibold ${t.brandColor}`}>
                        {t.brandTag}
                      </span>
                    </td>
                    <td className="py-2.5 text-white font-medium max-w-xs truncate">{t.deskripsi}</td>
                    <td className="py-2.5 text-slate-400">{t.kategori}</td>
                    <td className={`py-2.5 text-right font-mono font-bold ${t.tipe === 'masuk' ? 'text-emerald-400' : 'text-rose-400'}`}>
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
