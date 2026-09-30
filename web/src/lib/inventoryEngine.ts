import type { ResepItem, BahanItem, TransaksiItem } from '../types';

export interface InventoryItemStatus {
  bahan: BahanItem;
  stokAwal: number;
  terpakai: number;
  sisaStok: number;
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
    const regex = /([a-zA-Z0-9\s\+\-\.]+)\s*\(([0-9]+)x\)/g;
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
 * Kalkulasi status persediaan & stok terkini bahan baku Dikopi
 */
export function computeInventorySummary(
  bahanList: BahanItem[],
  resepList: ResepItem[],
  transaksiList: TransaksiItem[]
): InventorySummary {
  const soldMap = extractSoldItems(transaksiList);
  const usageMap = calculateIngredientUsage(resepList, soldMap);

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
  let estimasiNilaiStokSisa = 0;

  const items: InventoryItemStatus[] = bahanList.map((b) => {
    const bahanId = String(b.id);
    const terpakai = Math.round(usageMap.get(bahanId) || 0);
    totalBahanTerpakai += terpakai;

    // Stok awal default: jika belum di-set, gunakan estimasi berbasis kemasan beli
    // Misalnya stok awal adalah 4x kapasitas beli
    const baseCapacity = b.qtyBeli > 0 ? b.qtyBeli * 4 : 100;
    const stokAwal = b.stokAwal !== undefined && b.stokAwal > 0 ? b.stokAwal : baseCapacity;
    const sisaStok = Math.max(0, stokAwal - terpakai);
    const persenSisa = stokAwal > 0 ? Math.round((sisaStok / stokAwal) * 100) : 0;

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

    // Rekomendasi restock: berapa kemasan harus dibeli agar stok kembali penuh
    const defisit = Math.max(0, stokAwal - sisaStok);
    const rekomendasiBeli = b.qtyBeli > 0 ? Math.ceil(defisit / b.qtyBeli) : 1;

    return {
      bahan: b,
      stokAwal,
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
    estimasiNilaiStokSisa: Math.round(estimasiNilaiStokSisa)
  };
}
