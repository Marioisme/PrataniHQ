import type { ResepItem, BahanItem, TransaksiItem } from '../types';

export interface InventoryItemStatus {
  bahan: BahanItem;
  stokAwal: number;
  restok: number; // total masuk dari pengeluaran / belanja bahan
  terpakai: number; // total keluar dari penjualan kasir
  sisaStok: number; // stokAwal + restok - terpakai
  persenSisa: number;
  status: 'aman' | 'menipis' | 'kritis';
  resepTerkaitCount: number;
  estimasiPorsiTersisa: number;
  rekomendasiBeli: number; // berapa unit kemasan harus dibeli
}

export interface InventorySummary {
  items: InventoryItemStatus[];
  kritisItems: InventoryItemStatus[];
  menipisItems: InventoryItemStatus[];
  totalBahanTerpakai: number;
  totalBahanRestok: number;
  estimasiNilaiStokSisa: number;
}

/**
 * Ekstraksi item penjualan dari transaksi keuangan (items array & parse deskripsi)
 */
export function extractSoldItems(transaksiList: TransaksiItem[]): Map<string, number> {
  const soldMap = new Map<string, number>();

  transaksiList.forEach((t) => {
    if (t.tipe !== 'masuk') return;

    // 1. Cek dari array items terstruktur
    if (t.items && Array.isArray(t.items) && t.items.length > 0) {
      t.items.forEach((it) => {
        const name = (it.nama || (it as any).name || '').trim();
        const qty = Number(it.qty) || 1;
        if (name) {
          const key = name.toLowerCase();
          soldMap.set(key, (soldMap.get(key) || 0) + qty);
        }
      });
      return;
    }

    // 2. Parse dari string deskripsi (e.g. "Penjualan [Kedai] - Kopi Susu (1x), Kentang Goreng (2x)")
    const desc = t.deskripsi || '';
    const regex = /([a-zA-Z0-9\s+\-.]+)\s*\(([0-9]+)x\)/g;
    let match;
    let foundInDesc = false;

    while ((match = regex.exec(desc)) !== null) {
      foundInDesc = true;
      let name = match[1].replace(/Penjualan\s*(\[[^\]]+\])?\s*[-–:]?\s*/i, '').trim();
      const qty = parseInt(match[2], 10) || 1;
      if (name) {
        const key = name.toLowerCase();
        soldMap.set(key, (soldMap.get(key) || 0) + qty);
      }
    }

    // 3. Fallback jika deskripsi adalah nama tunggal produk tanpa tanda (1x)
    if (!foundInDesc && desc.toLowerCase().includes('penjualan')) {
      const cleanName = desc.replace(/Penjualan\s*(\[[^\]]+\])?\s*[-–:]?\s*/i, '').trim().toLowerCase();
      if (cleanName && cleanName.length > 2) {
        soldMap.set(cleanName, (soldMap.get(cleanName) || 0) + 1);
      }
    }
  });

  return soldMap;
}

/**
 * Hitung total konsumsi gramasi/unit tiap bahan baku dari seluruh transaksi penjualan
 */
export function calculateIngredientUsage(
  resepList: ResepItem[],
  soldMap: Map<string, number>
): Map<string, number> {
  const usageMap = new Map<string, number>();

  // Map nama resep (lowercase) ke objek ResepItem
  const resepByName = new Map<string, ResepItem>();
  resepList.forEach((r) => {
    resepByName.set((r.nama || '').trim().toLowerCase(), r);
  });

  soldMap.forEach((qtySold, itemName) => {
    // Cari resep yang cocok (exact atau partial)
    let matchedResep = resepByName.get(itemName);
    if (!matchedResep) {
      for (const [rName, rObj] of resepByName.entries()) {
        if (rName.includes(itemName) || itemName.includes(rName)) {
          matchedResep = rObj;
          break;
        }
      }
    }

    if (matchedResep && matchedResep.ingredients) {
      matchedResep.ingredients.forEach((ing) => {
        const bahanKey = String(ing.bahanId);
        const totalUsed = (Number(ing.qty) || 0) * qtySold;
        usageMap.set(bahanKey, (usageMap.get(bahanKey) || 0) + totalUsed);
      });
    }
  });

  return usageMap;
}

/**
 * Ekstraksi item restok/pembelian bahan baku dari transaksi pengeluaran keuangan (tipe === 'keluar')
 */
export function extractRestockItems(
  transaksiList: TransaksiItem[],
  bahanList: BahanItem[]
): Map<string, { totalQty: number; countTxn: number }> {
  const restockMap = new Map<string, { totalQty: number; countTxn: number }>();
  const hppCategories = [
    'biji kopi',
    'susu',
    'sirup',
    'bahan baku',
    'es batu',
    'cup & lid',
    'lain-lain hpp',
    'hpp'
  ];

  const clean = (s: string) =>
    (s || '')
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

  // Create clean lookup names
  const bahanLookup = bahanList.map((b) => ({
    bahan: b,
    cleanName: clean(b.nama),
    noSpaceName: clean(b.nama).replace(/\s+/g, '')
  }));

  transaksiList.forEach((t) => {
    if (t.tipe !== 'keluar') return;

    const cat = (t.kategori || '').toLowerCase();
    const isHpp =
      t.transaction_class === 'hpp' ||
      hppCategories.some((c) => cat.includes(c));

    // 1. Cek dari array items terstruktur jika ada
    if (t.items && Array.isArray(t.items) && t.items.length > 0) {
      t.items.forEach((it) => {
        const itName = clean(it.nama || (it as any).name || '');
        if (!itName) return;
        const matched = bahanLookup.find(
          (bl) =>
            bl.cleanName === itName ||
            bl.cleanName.includes(itName) ||
            itName.includes(bl.cleanName)
        );
        if (matched) {
          const bId = String(matched.bahan.id);
          const qtyMultiplier = Number(it.qty) || 1;
          const addedQty = qtyMultiplier * (matched.bahan.qtyBeli || 1);
          const curr = restockMap.get(bId) || { totalQty: 0, countTxn: 0 };
          curr.totalQty += addedQty;
          curr.countTxn += 1;
          restockMap.set(bId, curr);
        }
      });
      return;
    }

    if (!isHpp) return;

    const rawDesc = clean(t.deskripsi || '');
    if (!rawDesc) return;
    const cleanDesc = rawDesc
      .replace(/^beli\s+/i, '')
      .replace(/^belanja\s+/i, '')
      .replace(/^reimburse\s+/i, '')
      .replace(/^bahan baku\s*[-–:]?\s*/i, '')
      .trim();
    const cleanNoSpace = cleanDesc.replace(/\s+/g, '');

    // 2. Coba matching nama bahan langsung
    let matched = bahanLookup.find(
      (bl) =>
        cleanDesc === bl.cleanName ||
        cleanDesc.includes(bl.cleanName) ||
        bl.cleanName.includes(cleanDesc) ||
        cleanNoSpace === bl.noSpaceName ||
        cleanNoSpace.includes(bl.noSpaceName) ||
        bl.noSpaceName.includes(cleanNoSpace)
    )?.bahan;

    // 3. Fallback pencocokan kata kunci umum di coffee shop
    if (!matched) {
      if (cleanDesc.includes('diamond') || cleanDesc.includes('susu')) {
        matched =
          bahanList.find((b) => clean(b.nama).includes('diamond')) ||
          bahanList.find((b) => clean(b.nama).includes('susu'));
      } else if (cleanDesc.includes('robusta')) {
        matched = bahanList.find((b) => clean(b.nama).includes('robusta'));
      } else if (cleanDesc.includes('arabika')) {
        matched = bahanList.find((b) => clean(b.nama).includes('arabika'));
      } else if (cleanDesc.includes('skm')) {
        matched = bahanList.find((b) => clean(b.nama).includes('skm'));
      } else if (cleanDesc.includes('matcha')) {
        matched = bahanList.find((b) => clean(b.nama).includes('matcha'));
      } else if (cleanDesc.includes('es batu')) {
        matched = bahanList.find((b) => clean(b.nama).includes('es batu'));
      } else if (cleanDesc.includes('cup')) {
        matched = bahanList.find((b) => clean(b.nama) === 'cup');
      } else if (cleanDesc.includes('blue band') || cleanDesc.includes('blueband')) {
        matched = bahanList.find((b) => clean(b.nama).includes('blue'));
      } else if (cleanDesc.includes('almond')) {
        matched = bahanList.find((b) => clean(b.nama).includes('almond'));
      } else if (cleanDesc.includes('butterscotch')) {
        matched = bahanList.find((b) => clean(b.nama).includes('butterscotch'));
      } else if (cleanDesc.includes('caramel')) {
        matched = bahanList.find((b) => clean(b.nama).includes('caramel'));
      } else if (cleanDesc.includes('kentang')) {
        matched = bahanList.find((b) => clean(b.nama).includes('kentang'));
      } else if (cleanDesc.includes('sosis')) {
        matched = bahanList.find((b) => clean(b.nama).includes('sosis'));
      } else if (cleanDesc.includes('nugget')) {
        matched = bahanList.find((b) => clean(b.nama).includes('nugget'));
      } else if (cleanDesc.includes('bakso') || cleanDesc.includes('baso')) {
        matched = bahanList.find((b) => clean(b.nama).includes('bakso'));
      } else if (cleanDesc.includes('sunbay') || cleanDesc.includes('evapor')) {
        matched = bahanList.find((b) => clean(b.nama).includes('evapor'));
      }
    }

    if (matched) {
      const bId = String(matched.id);
      let units = 1;

      // Cek apakah ada unit eksplisit dalam string (e.g. "2pcs", "2x", "2 unit")
      const qtyMatch = cleanDesc.match(/([0-9]+)\s*(?:pcs|x|pack|unit|dus|botol|kg|gr)/i);
      if (qtyMatch && Number(qtyMatch[1]) > 0) {
        units = Number(qtyMatch[1]);
      } else if (matched.hargaBeli > 0 && t.nominal > 0) {
        units = Math.max(1, Math.round(t.nominal / matched.hargaBeli));
      }

      const addedQty = units * (matched.qtyBeli || 1);
      const curr = restockMap.get(bId) || { totalQty: 0, countTxn: 0 };
      curr.totalQty += addedQty;
      curr.countTxn += 1;
      restockMap.set(bId, curr);
    }
  });

  return restockMap;
}

/**
 * Kalkulasi status persediaan & stok terkini bahan baku Dikopi
 */
export function computeInventorySummary(
  bahanList: BahanItem[],
  resepList: ResepItem[],
  transaksiList: TransaksiItem[]
): InventorySummary {
  const soldMap = extractSoldItems(transaksiList);
  const usageMap = calculateIngredientUsage(resepList, soldMap);
  const restockMap = extractRestockItems(transaksiList, bahanList);

  // Hitung jumlah resep yang menggunakan masing-masing bahan
  const resepUsageCount = new Map<string, { count: number; avgGram: number }>();
  resepList.forEach((r) => {
    (r.ingredients || []).forEach((ing) => {
      const key = String(ing.bahanId);
      const curr = resepUsageCount.get(key) || { count: 0, avgGram: 0 };
      curr.count += 1;
      curr.avgGram = (curr.avgGram + (Number(ing.qty) || 0)) / 2;
      resepUsageCount.set(key, curr);
    });
  });

  let totalBahanTerpakai = 0;
  let totalBahanRestok = 0;
  let estimasiNilaiStokSisa = 0;

  const items: InventoryItemStatus[] = bahanList.map((b) => {
    const bahanId = String(b.id);
    const terpakai = Math.round(usageMap.get(bahanId) || 0);
    const restockInfo = restockMap.get(bahanId) || { totalQty: 0, countTxn: 0 };
    const restok = Math.round(restockInfo.totalQty);

    totalBahanTerpakai += terpakai;
    totalBahanRestok += restok;

    // Stok awal:
    // 1. Jika pengguna telah menentukan stokAwal, gunakan stokAwal tersebut.
    // 2. Jika belum ditentukan: jika ada transaksi restok, stokAwal = 0. Jika belum ada restok sama sekali, gunakan 1 kemasan beli sebagai estimasi persediaan awal.
    const defaultAwal = restok > 0 ? 0 : (b.qtyBeli > 0 ? b.qtyBeli : 100);
    const stokAwal = b.stokAwal !== undefined && b.stokAwal >= 0 ? b.stokAwal : defaultAwal;

    const totalMasuk = stokAwal + restok;
    const sisaStok = Math.max(0, totalMasuk - terpakai);
    const persenSisa = totalMasuk > 0 ? Math.round((sisaStok / totalMasuk) * 100) : 0;

    const unitPrice = b.qtyBeli > 0 ? b.hargaBeli / b.qtyBeli : 0;
    estimasiNilaiStokSisa += sisaStok * unitPrice;

    // Tentukan status stok
    let status: 'aman' | 'menipis' | 'kritis' = 'aman';
    if (persenSisa <= 20 || sisaStok <= (b.qtyBeli * 0.4)) {
      status = 'kritis';
    } else if (persenSisa <= 45 || sisaStok <= b.qtyBeli) {
      status = 'menipis';
    }

    const rInfo = resepUsageCount.get(bahanId) || { count: 0, avgGram: 15 };
    const avgGramPerCup = rInfo.avgGram > 0 ? rInfo.avgGram : 15;
    const estimasiPorsiTersisa = avgGramPerCup > 0 ? Math.floor(sisaStok / avgGramPerCup) : 0;

    // Rekomendasi restock: berapa kemasan harus dibeli agar stok kembali aman
    const defisit = Math.max(0, totalMasuk - sisaStok);
    const rekomendasiBeli = b.qtyBeli > 0 ? Math.max(1, Math.ceil(defisit / b.qtyBeli)) : 1;

    return {
      bahan: b,
      stokAwal,
      restok,
      terpakai,
      sisaStok,
      persenSisa,
      status,
      resepTerkaitCount: rInfo.count,
      estimasiPorsiTersisa,
      rekomendasiBeli
    };
  });

  const kritisItems = items.filter((i) => i.status === 'kritis');
  const menipisItems = items.filter((i) => i.status === 'menipis');

  return {
    items,
    kritisItems,
    menipisItems,
    totalBahanTerpakai,
    totalBahanRestok,
    estimasiNilaiStokSisa: Math.round(estimasiNilaiStokSisa)
  };
}
