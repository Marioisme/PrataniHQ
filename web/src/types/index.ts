export type BrandId = 'dikopi' | 'kolektiva' | 'imagineer' | 'evercraft' | 'snm' | 'pratani';

export interface BrandConfig {
  id: BrandId;
  name: string;
  tag: string;
  color: string;
  badgeBg: string;
  badgeText: string;
  icon: string;
}

export interface TransaksiItem {
  id: string | number;
  tanggal: string;
  deskripsi: string;
  kategori: string;
  tipe: 'masuk' | 'keluar';
  sumber?: string;
  nominal: number;
  _margin?: number;
  _hppTotal?: number;
  nota?: string | null;
  nota_type?: string | null;
  items?: Array<{
    id?: number | string;
    nama?: string;
    qty?: number;
    hargaJual?: number;
    hppSnapshot?: number;
  }>;
  _source?: 'kasir' | 'kasir_event' | 'manual' | 'import';
  created_at?: string;
  synced?: boolean;
}

export interface KeuData {
  dikopi: TransaksiItem[];
  kolektiva: TransaksiItem[];
  imagineer?: TransaksiItem[];
  evercraft?: TransaksiItem[];
  snm?: TransaksiItem[];
  studio?: TransaksiItem[];
  _meta?: Record<string, unknown>;
}

export interface TodoContentItem {
  id: number | string;
  brand: string;
  bulan: string;
  tanggalPosting: string;
  pilar: string;
  format: string;
  judul: string;
  hook?: string;
  cta?: string;
  hashtag?: string;
  notes?: string;
  done: boolean;
  boardStatus: 'todo' | 'in_progress' | 'review' | 'done';
}

export interface ResepItem {
  id: number | string;
  nama: string;
  kategori: string;
  channel?: string;
  hargaJual: number;
  hppSnapshot?: number;
  catatan?: string;
  ingredients?: Array<{
    bahanId: number | string;
    nama: string;
    qty: number;
    unit: string;
    subtotal: number;
  }>;
}

export interface BahanItem {
  id: number | string;
  nama: string;
  kategori: string;
  hargaBeli: number;
  isiBersih: number;
  unit: string;
  hargaPerUnit: number;
  supplier?: string;
  stok?: number;
}
