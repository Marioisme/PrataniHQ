// Format & Financial helper utilities for Pratani HQ Keuangan

export const DIKOPI_CUTOFF_HOUR = 5; // 05:00 AM cutoff for night cashier shifts

export const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

export function getBulanLabel(ym: string): string {
  if (!ym) return '-';
  const parts = ym.split('-');
  if (parts.length < 2) return ym;
  const monthIdx = parseInt(parts[1], 10) - 1;
  return `${MONTH_NAMES[monthIdx] || parts[1]} ${parts[0]}`;
}

export function getCurrentMonthKey(): string {
  const now = new Date();
  if (now.getHours() < DIKOPI_CUTOFF_HOUR) {
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    return yesterday.toISOString().substring(0, 7);
  }
  return now.toISOString().substring(0, 7);
}

export function txnEffectiveDate(t: { _source?: string; created_at?: string; updated_at?: string; tanggal?: string }): string {
  const isKasir = t._source === 'kasir' || t._source === 'kasir_event';
  if (isKasir && t.created_at && !t.updated_at) {
    const dt = new Date(t.created_at);
    return dt.getHours() < DIKOPI_CUTOFF_HOUR
      ? new Date(dt.getTime() - 86400000).toISOString().split('T')[0]
      : dt.toISOString().split('T')[0];
  }
  return t.tanggal || '';
}

export function fmtRp(num: number): string {
  return 'Rp ' + Math.round(num || 0).toLocaleString('id-ID');
}

export function fmtInputDots(val: string): string {
  const clean = val.replace(/\D/g, '');
  if (!clean) return '';
  return parseInt(clean, 10).toLocaleString('id-ID');
}

export function parseInputDots(val: string): number {
  return parseFloat(val.replace(/\./g, '')) || 0;
}

export function autoSlashDate(val: string): string {
  let v = val.replace(/\D/g, '');
  if (v.length > 8) v = v.slice(0, 8);
  if (v.length >= 4) {
    return v.slice(0, 2) + '/' + v.slice(2, 4) + '/' + v.slice(4);
  } else if (v.length >= 2) {
    return v.slice(0, 2) + '/' + v.slice(2);
  }
  return v;
}

export function toDisplayDate(iso: string): string {
  if (!iso) return '';
  const parts = iso.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return iso;
}

export function toStorageDate(dsp: string): string {
  if (!dsp) return '';
  if (dsp.includes('-')) return dsp;
  const parts = dsp.split('/');
  if (parts.length === 3) {
    return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
  }
  return dsp;
}

export function getTodayDisplay(): string {
  const now = new Date();
  if (now.getHours() < DIKOPI_CUTOFF_HOUR) {
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    return toDisplayDate(yesterday.toISOString().split('T')[0]);
  }
  return toDisplayDate(now.toISOString().split('T')[0]);
}

export function fmtTimestamp(iso?: string): string {
  if (!iso) return '-';
  const d = new Date(iso);
  const tgl = d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
  const jam = d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  return `${tgl}, ${jam}`;
}

export const DIKOPI_HPP_ITEMS = [
  'Biji Kopi',
  'Susu',
  'Gula',
  'Sirup',
  'Cup & Lid',
  'Sedotan',
  'Kantong Plastik',
  'Es Batu',
  'Lain-lain HPP'
];

export const DIKOPI_OPS_ITEMS = [
  'Gaji/Honorarium',
  'Listrik',
  'Gas',
  'Air',
  'Sewa',
  'Biaya Admin',
  'Iklan & Marketing',
  'Transportasi',
  'Lain-lain'
];

export const KEU_KATEGORI = {
  revenue: ['Pembayaran DP', 'Pelunasan Order', 'Penjualan Langsung', 'Pendapatan Lainnya'],
  capital: ['Suntikan Dana Owner', 'Tambahan Modal'],
  hpp: ['Biaya Produksi/Vendor', 'Bahan Baku', 'Packaging', 'Ongkir/Pengiriman'],
  expense: [
    'Biaya Admin & Dokumen',
    'Iklan & Marketing',
    'Software & Tools',
    'Gaji/Honorarium',
    'Utilitas (Listrik, Air)',
    'Sewa',
    'Biaya Admin Shopee',
    'Lain-lain'
  ],
  owner: ['Ambil Uang Pribadi', 'Distribusi Laba'],
  asset: ['Pembelian Aset']
};

export const KAT_CLASS: Record<string, string> = {
  'Pembayaran DP': 'revenue',
  'Pelunasan Order': 'revenue',
  'Penjualan Langsung': 'revenue',
  'Pendapatan Lainnya': 'revenue',
  'Suntikan Dana Owner': 'capital_injection',
  'Tambahan Modal': 'capital_injection',
  'Biaya Produksi/Vendor': 'hpp',
  'Bahan Baku': 'hpp',
  'Packaging': 'hpp',
  'Ongkir/Pengiriman': 'hpp',
  'Biaya Admin & Dokumen': 'operational',
  'Iklan & Marketing': 'operational',
  'Software & Tools': 'operational',
  'Gaji/Honorarium': 'operational',
  'Utilitas (Listrik, Air)': 'operational',
  'Sewa': 'operational',
  'Biaya Admin Shopee': 'operational',
  'Lain-lain': 'operational',
  'Ambil Uang Pribadi': 'owner_draw',
  'Distribusi Laba': 'profit_distribution',
  'Pembelian Aset': 'asset_purchase',
  'Mutasi': 'transfer'
};

DIKOPI_HPP_ITEMS.forEach((k) => {
  KAT_CLASS[k] = 'hpp';
});

export function getTxnClass(t: { transaction_class?: string; tipe?: string; kategori?: string }): string {
  if (t.transaction_class) return t.transaction_class;
  if (t.tipe === 'mutasi') return 'transfer';
  return KAT_CLASS[t.kategori || ''] || (t.tipe === 'masuk' ? 'revenue' : 'operational');
}

export function keuKatGroup(kat: string): string {
  if (KEU_KATEGORI.revenue.includes(kat)) return 'revenue';
  if (KEU_KATEGORI.hpp.includes(kat) || DIKOPI_HPP_ITEMS.includes(kat)) return 'hpp';
  if (KEU_KATEGORI.capital.includes(kat)) return 'capital';
  if (KEU_KATEGORI.owner.includes(kat)) return 'owner';
  if (KEU_KATEGORI.asset.includes(kat)) return 'asset';
  return 'expense';
}

export function keuCalc(txns: Array<{
  transaction_class?: string;
  tipe?: 'masuk' | 'keluar' | 'mutasi';
  kategori?: string;
  nominal: number;
  _hppTotal?: number;
}>) {
  let revenue = 0;
  let hpp = 0;
  let expense = 0;
  let capital = 0;
  let owner = 0;
  let asset = 0;

  txns.forEach((t) => {
    const cls = getTxnClass(t);
    const nom = Number(t.nominal || 0);
    if (cls === 'revenue') {
      revenue += nom;
      if (t._hppTotal) hpp += Number(t._hppTotal);
    } else if (cls === 'hpp') {
      hpp += nom;
    } else if (cls === 'operational' || cls === 'expense') {
      expense += nom;
    } else if (cls === 'capital_injection' || cls === 'capital') {
      capital += nom;
    } else if (cls === 'owner_draw' || cls === 'profit_distribution' || cls === 'owner') {
      owner += nom;
    } else if (cls === 'asset_purchase' || cls === 'asset') {
      asset += nom;
    }
  });

  const grossProfit = revenue - hpp;
  const netProfit = grossProfit - expense;
  return { revenue, hpp, expense, capital, owner, asset, grossProfit, netProfit };
}

