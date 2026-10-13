import type { ProdukKolektivaItem } from '../types';

export const PRODUK_KATEGORI = [
  'Apparel',
  'Merch',
  'Stationary',
  'Lanyard & ID Card',
  'Plakat & Award',
  'Goodie Bag',
  'Lainnya'
];

export function hitungHPPProduk(p: ProdukKolektivaItem): number {
  const dasar = Number(p.hargaDasar) || 0;
  const ongkir = (Number(p.supplier?.ongkirKePratani) || 0) / (Number(p.moq) || 1);
  const komponen = (p.komponenBiaya || []).reduce((s, k) => {
    return s + (k.per === 'order' ? (Number(k.nominal) || 0) / (Number(p.moq) || 1) : (Number(k.nominal) || 0));
  }, 0);
  return dasar + ongkir + komponen;
}

export function hitungHargaJualProduk(p: ProdukKolektivaItem): number {
  if (p.hargaJual && p.hargaJual > 0) return p.hargaJual;
  const hpp = hitungHPPProduk(p);
  const margin = Number(p.marginRekomendasi) || 35;
  if (margin >= 100) return hpp * 2;
  return Math.ceil(hpp / (1 - margin / 100) / 100) * 100;
}
