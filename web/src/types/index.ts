export type BrandId = 'dikopi' | 'kolektiva' | 'imagineer' | 'evercraft' | 'snm' | 'pratani';

export interface TransaksiItem {
  id: string | number;
  tanggal: string;
  deskripsi: string;
  kategori: string;
  tipe: 'masuk' | 'keluar' | 'mutasi';
  sumber?: string;
  nominal: number;
  nominalGross?: number;
  adminFee?: number;
  _channel?: string;
  transaction_class?: string;
  _margin?: number;
  _hppTotal?: number;
  nota?: string | null;
  nota_type?: string | null;
  items?: Array<{
    id?: number | string;
    resepId?: number | string;
    nama?: string;
    name?: string;
    size?: string;
    qty?: number;
    hargaJual?: number;
    price?: number;
    hppSnapshot?: number;
    subtotal?: number;
  }>;
  _source?: 'kasir' | 'kasir_event' | 'manual' | 'import';
  created_at?: string;
  updated_at?: string;
  synced?: boolean;
}

export interface HistoryEntry {
  id: number | string;
  brand: string;
  txnId: number | string;
  editedAt: string;
  snapshot: TransaksiItem;
}

export interface AsetItem {
  id: number | string;
  nama: string;
  tanggal: string;
  nominal: number;
  sumber: string;
  keterangan?: string;
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

export interface PilarItem {
  nama: string;
  bg: string;
  color: string;
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
  boardStatus?: 'not_started' | 'in_progress' | 'done' | 'todo' | 'review';
}

export interface ResepIngredient {
  bahanId: number | string;
  qty: number;
}

export interface ComboItemEntry {
  resepId: number | string;
  qty: number;
}

export interface ResepGroupItem {
  key: string;
  label: string;
}

export interface ResepItem {
  id: number | string;
  nama: string;
  kategori?: string;
  channel?: string;
  hargaJual: number;
  hargaJualLarge?: number;
  hppSnapshot?: number;
  hppSnapshotLarge?: number;
  catatan?: string;
  ingredients: ResepIngredient[];
  createdAt?: string;
  isCombo?: boolean;
  comboItems?: ComboItemEntry[];
  komisiAfiliate?: number;
  variants?: Array<{
    size: 'regular' | 'large' | string;
    nama?: string;
    hargaJual: number;
    hppSnapshot?: number;
    ingredients?: ResepIngredient[];
  }>;
}

export interface BahanItem {
  id: number | string;
  nama: string;
  satuan: string;
  hargaBeli: number;
  qtyBeli: number;
  stokAwal?: number;
  stokTersedia?: number;
  stokMin?: number;
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

export type KolektivaDocType = 'rab' | 'spk' | 'approval' | 'surat_jalan' | 'bast' | 'invoice' | 'kwitansi';

export interface KolektivaOrderItem {
  id: string;
  nama: string;
  spesifikasi: string;
  qty: number;
  hargaSatuan: number;
  catatan?: string;
}

export interface KolektivaProject {
  id: string;
  nomorSurat: string;
  tanggalSurat: string;
  deadline: string;
  klienNama: string;
  klienInstansi: string;
  klienPic: string;
  klienJabatan: string;
  klienTelp: string;
  klienAlamat: string;
  klienEmail?: string;
  items: KolektivaOrderItem[];
  dpPersen: number;
  dpNominal: number;
  statusPembayaran: 'belum_bayar' | 'dp_terbayar' | 'lunas';
  metodePembayaran: string;
  rekeningBank: string;
  catatanKhusus?: string;
  createdAt: string;
}

export interface ProjectItem {
  id: number | string;
  brand: string;
  nama: string;
  contactPerson?: string;
  deskripsi?: string;
  nilaiProyek?: number;
  progress?: number;
  status: 'planning' | 'ongoing' | 'review' | 'done';
  tanggalMulai?: string;
  deadline?: string;
  files?: Array<{ name: string; url?: string; size?: number; ext?: string; stored?: string }>;
}

export interface FolderItem {
  id: number | string;
  name: string;
  parentId?: number | string | null;
  icon?: string;
  date?: string;
}

export interface DokumenFileItem {
  id: number | string;
  origName: string;
  folderId?: number | string | null;
  size?: number;
  ext?: string;
  date?: string;
  stored?: string;
  content?: string;
  type?: string;
}

export interface HutangCicilan {
  id: number | string;
  tanggal: string;
  nominal: number;
  ket?: string;
  catatan?: string;
}

export interface HutangItem {
  id: number | string;
  nama: string;
  total: number;
  kepada: string;
  brand: string;
  tanggal: string;
  keterangan?: string;
  jatuhTempo?: string;
  cicilan: HutangCicilan[];
  createdAt?: string;
}

export interface KontakItem {
  id: number | string;
  nama: string;
  peran?: string;
  brand?: string;
  hp?: string;
  email?: string;
  alamat?: string;
  catatan?: string;
}

export interface MoqTierItem {
  qty: number;
  hargaDasar: number;
  hargaJual?: number;
  isBase?: boolean;
}

export interface KomponenBiayaItem {
  id?: number | string;
  nama: string;
  nominal: number;
  per: 'pcs' | 'order';
}

export interface ProdukKolektivaItem {
  id: number | string;
  nama: string;
  kategori: string;
  moq: number;
  hargaDasar: number;
  marginRekomendasi?: number;
  hargaJual?: number | null;
  moqTiers?: MoqTierItem[];
  komponenBiaya?: KomponenBiayaItem[];
  supplier?: {
    nama?: string;
    kontak?: string;
    alamat?: string;
    ongkirKePratani?: number;
  };
  catatan?: string;
  createdAt?: string;
  hppSnapshot?: {
    totalHpp?: number;
    komponen?: any[];
  };
}

export interface TrashItem {
  id: number | string;
  originalTable: string;
  label: string;
  deletedAt: string;
  isFolder?: boolean;
  item: any;
}


