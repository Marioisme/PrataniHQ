import type { ResepItem, BahanItem, ResepGroupItem } from '../../types';

export const RESEP_GROUPS_DEFAULT: ResepGroupItem[] = [
  { key: 'Coffee', label: '☕ Coffee' },
  { key: 'Kopi Pelajar', label: '🎓 Kopi Pelajar' },
  { key: 'Non Coffee', label: '🥤 Non Coffee' },
  { key: 'Manual Brew', label: '🫗 Manual Brew' },
  { key: 'Tisane', label: '🫖 Tisane' },
  { key: 'Snack', label: '🍪 Snack' },
  { key: 'Makanan', label: '🍜 Makanan' },
];

export const DEFAULT_CHANNELS = ['kedai', 'cfd', 'shopeefood', 'gofood', 'tiktokgo'];

export const CHANNEL_LABEL_DEFAULT: Record<string, string> = {
  kedai: '☕ Kedai',
  cfd: '🏃 CFD',
  shopeefood: '🧡 ShopeeFood',
  gofood: '🟢 GoFood',
  tiktokgo: '🎵 TikTokGo',
  marketplace: '🧡 ShopeeFood', // alias kompatibilitas
};

export const DEFAULT_SHOPEE_COMMISSION_RATE = 20; // 20% dari Harga Jual
export const DEFAULT_GOFOOD_COMMISSION_RATE = 20; // 20% dari Harga Jual
export const DEFAULT_MARKETPLACE_COMMISSION_RATE = 20; // 20% dari Harga Jual
export const DEFAULT_TIKTOK_ADMIN_RATE = 12; // 12% dari Harga Jual

export function getChannelAdminFeeRate(channel: string): number {
  const ch = (channel || '').toLowerCase();
  if (ch === 'shopeefood' || ch === 'marketplace') return DEFAULT_SHOPEE_COMMISSION_RATE;
  if (ch === 'gofood') return DEFAULT_GOFOOD_COMMISSION_RATE;
  if (ch === 'tiktokgo') return DEFAULT_TIKTOK_ADMIN_RATE;
  return 0; // kedai & cfd
}

export function hitungChannelNet(
  hargaJual: number,
  channel: string,
  komisiAfiliate: number = 0
): { net: number; adminFee: number; afiliateFee: number; rate: number } {
  const rate = getChannelAdminFeeRate(channel);
  const adminFee = Math.round(hargaJual * (rate / 100));
  const afiliateFee = channel === 'tiktokgo' && komisiAfiliate > 0 ? Math.round(hargaJual * (komisiAfiliate / 100)) : 0;
  const net = hargaJual - adminFee - afiliateFee;
  return { net, adminFee, afiliateFee, rate };
}

export const BAHAN_DEFAULT = [
  { nama: 'Robusta', satuan: 'gram', hargaBeli: 90000, qtyBeli: 1000 },
  { nama: 'Arabika', satuan: 'gram', hargaBeli: 120000, qtyBeli: 1000 },
  { nama: 'Susu UHT', satuan: 'ml', hargaBeli: 18000, qtyBeli: 1000 },
  { nama: 'Susu Diamond', satuan: 'ml', hargaBeli: 22000, qtyBeli: 1000 },
  { nama: 'Simple Syrup', satuan: 'ml', hargaBeli: 15000, qtyBeli: 500 },
  { nama: 'Gula Pasir', satuan: 'gram', hargaBeli: 16000, qtyBeli: 1000 },
  { nama: 'Es Batu', satuan: 'gram', hargaBeli: 3000, qtyBeli: 1000 },
  { nama: 'Cup 16oz', satuan: 'pcs', hargaBeli: 35000, qtyBeli: 50 },
  { nama: 'Cup 22oz', satuan: 'pcs', hargaBeli: 45000, qtyBeli: 50 },
  { nama: 'Lid', satuan: 'pcs', hargaBeli: 20000, qtyBeli: 100 },
  { nama: 'Sedotan', satuan: 'pcs', hargaBeli: 10000, qtyBeli: 100 },
  { nama: 'Kantong Plastik', satuan: 'pcs', hargaBeli: 15000, qtyBeli: 100 },
];

export function fmtRp(num: number): string {
  return 'Rp ' + Math.round(num || 0).toLocaleString('id-ID');
}

export function bahanHargaPerSatuan(b: BahanItem): number {
  return b.qtyBeli > 0 ? b.hargaBeli / b.qtyBeli : 0;
}

/**
 * Hitung HPP Resep / Combo secara rekursif
 */
export function hitungHPPResep(
  resep: ResepItem,
  resepList: ResepItem[],
  bahanMap: Map<string, BahanItem>
): number {
  // Combo: jumlahkan HPP dari seluruh member resep × qty
  if (resep.isCombo && resep.comboItems?.length) {
    return resep.comboItems.reduce((sum, ci) => {
      const member = resepList.find((r) => String(r.id) === String(ci.resepId));
      if (!member) return sum;
      return sum + hitungHPPResep(member, resepList, bahanMap) * (ci.qty || 1);
    }, 0);
  }

  // Normal: hitung dari komposisi ingredients
  let total = 0;
  (resep.ingredients || []).forEach((ing) => {
    const b = bahanMap.get(String(ing.bahanId));
    if (!b || !b.qtyBeli) return;
    const hps = bahanHargaPerSatuan(b);
    total += hps * (ing.qty || 0);
  });
  return Math.round(total);
}

/**
 * Periksa apakah ada harga bahan baku yang berubah (threshold Rp 50)
 */
export function resepHasWarning(
  resep: ResepItem,
  resepList: ResepItem[],
  bahanMap: Map<string, BahanItem>
): boolean {
  if (!resep.hppSnapshot) return false;
  const currentHPP = hitungHPPResep(resep, resepList, bahanMap);
  return Math.abs(currentHPP - resep.hppSnapshot) > 50;
}

export function marketplaceMarginBadge(margin: number): {
  color: string;
  bg: string;
  label: string;
} {
  if (margin >= 50) return { color: '#4cc9a0', bg: 'rgba(76,201,160,0.14)', label: 'Sehat' };
  if (margin >= 45) return { color: '#d4e157', bg: 'rgba(212,225,87,0.14)', label: 'Deket Target' };
  if (margin >= 35) return { color: '#ff9f43', bg: 'rgba(255,159,67,0.14)', label: 'Perlu Naik' };
  return { color: 'var(--red)', bg: 'rgba(255,71,87,0.14)', label: 'Kritis' };
}

export function formatNumericInput(val: string): string {
  const clean = val.replace(/\D/g, '');
  if (!clean) return '';
  return Number(clean).toLocaleString('id-ID');
}

export function parseNumericInput(val: string): number {
  return parseFloat((val || '0').replace(/\./g, '')) || 0;
}
