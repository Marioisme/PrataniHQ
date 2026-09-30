export type BrandId = 'dikopi' | 'kolektiva' | 'imagineer' | 'evercraft' | 'snm' | 'pratani';

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
  pratani?: TransaksiItem[];
  _meta?: Record<string, unknown>;
  [key: string]: TransaksiItem[] | Record<string, unknown> | undefined;
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
  boardStatus?: 'todo' | 'in_progress' | 'review' | 'done';
}

export interface ResepIngredient {
  bahanId: number | string;
  qty: number;
}

export interface ResepItem {
  id: number | string;
  nama: string;
  kategori?: string;
  channel?: string;
  hargaJual: number;
  hppSnapshot?: number;
  catatan?: string;
  ingredients: ResepIngredient[];
  createdAt?: string;
}

export interface BahanItem {
  id: number | string;
  nama: string;
  satuan: string;
  hargaBeli: number;
  qtyBeli: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface TaskSheetRow {
  id: number | string;
  cells: string[];
  _status?: string | null;
}

export interface TaskSheet {
  name: string;
  columns: string[];
  rows: TaskSheetRow[];
}

export interface TaskProject {
  title: string;
  brand: string;
  sheets: TaskSheet[];
}
