import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  getDocs, 
  writeBatch, 
  doc, 
  setDoc,
  deleteDoc
} from 'firebase/firestore';
import type { TransaksiItem } from '../types';

export const FB_CONFIG = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyA0vR9gLFIG_dKE6T_0DhPc-vqYZBjsqc0",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "kasir-dikopi.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "kasir-dikopi",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "kasir-dikopi.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "801730874094",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:801730874094:web:6114dcdf24f1d65c6a81ff"
};

const app = getApps().length > 0 ? getApp() : initializeApp(FB_CONFIG);
export const firestore = getFirestore(app);

/**
 * Tarik seluruh transaksi dari Cloud Firestore (dikopi_transaksi)
 * dan gabungkan dengan transaksi lokal (mencegah duplikasi).
 */
export async function pullCloudTransactions(
  existingLocalTransactions: TransaksiItem[]
): Promise<{
  mergedList: TransaksiItem[];
  addedCount: number;
  message: string;
}> {
  const snap = await getDocs(collection(firestore, 'dikopi_transaksi'));
  const cloudTrx = snap.docs.map((d) => ({
    _docId: d.id,
    ...(d.data() as TransaksiItem)
  }));

  const existingIds = new Set(existingLocalTransactions.map((t) => String(t.id)));
  const newItems: TransaksiItem[] = [];
  const newDocIds: string[] = [];

  cloudTrx.forEach((t) => {
    if (!existingIds.has(String(t.id))) {
      newItems.push({
        id: t.id || Date.now(),
        tanggal: t.tanggal || new Date().toISOString().split('T')[0],
        tipe: t.tipe || 'masuk',
        deskripsi: t.deskripsi || 'Penjualan Kasir Event',
        kategori: t.kategori || 'Penjualan Langsung',
        nominal: Number(t.nominal) || 0,
        nominalGross: t.nominalGross !== undefined ? Number(t.nominalGross) : Number(t.nominal) || 0,
        adminFee: t.adminFee !== undefined ? Number(t.adminFee) : 0,
        _channel: t._channel || 'kedai',
        sumber: t.sumber || 'cash',
        _margin: t._margin !== undefined ? Number(t._margin) : Number(t.nominal) || 0,
        _hppTotal: Number(t._hppTotal) || 0,
        items: t.items || [],
        _source: t._source || 'kasir_event',
        created_at: t.created_at || new Date().toISOString(),
        synced: true
      });
      newDocIds.push(t._docId);
    }
  });

  if (newItems.length > 0) {
    // Gabungkan dan urutkan
    const mergedList = [...existingLocalTransactions, ...newItems].sort(
      (a, b) => new Date(a.created_at || a.tanggal || 0).getTime() - new Date(b.created_at || b.tanggal || 0).getTime()
    );

    // Tandai status synced di Firestore
    const BATCH_SIZE = 400;
    for (let i = 0; i < newDocIds.length; i += BATCH_SIZE) {
      const batch = writeBatch(firestore);
      newDocIds.slice(i, i + BATCH_SIZE).forEach((docId) => {
        const ref = doc(firestore, 'dikopi_transaksi', docId);
        batch.update(ref, {
          synced: true,
          synced_at: new Date().toISOString()
        });
      });
      await batch.commit();
    }

    return {
      mergedList,
      addedCount: newItems.length,
      message: `✅ Berhasil menarik ${newItems.length} transaksi baru dari Cloud Kasir!`
    };
  }

  return {
    mergedList: existingLocalTransactions,
    addedCount: 0,
    message: '✅ Semua transaksi Cloud Kasir sudah tercatat di HQ. Tidak ada transaksi baru.'
  };
}

/**
 * Push / Rekonsiliasi transaksi lokal ke Cloud (Master Authority)
 */
export async function pushTransactionsToCloud(
  localTransactions: TransaksiItem[]
): Promise<{
  deletedCount: number;
  updatedCount: number;
  message: string;
}> {
  const snap = await getDocs(collection(firestore, 'dikopi_transaksi'));
  const localIdSet = new Set(localTransactions.map((t) => String(t.id)));

  let deletedCount = 0;
  let updatedCount = 0;

  // 1. Hapus transaksi di Cloud yang sudah dihapus di HQ
  const toDeleteDocs = snap.docs.filter((d) => !localIdSet.has(String(d.id)));
  for (const d of toDeleteDocs) {
    await deleteDoc(doc(firestore, 'dikopi_transaksi', d.id));
    deletedCount++;
  }

  // 2. Update / Re-sync transaksi kasir lokal ke Cloud
  for (const t of localTransactions) {
    if (t._source === 'kasir_event' || t._source === 'kasir') {
      const ref = doc(firestore, 'dikopi_transaksi', String(t.id));
      await setDoc(ref, {
        id: t.id,
        tanggal: t.tanggal,
        tipe: t.tipe,
        deskripsi: t.deskripsi,
        kategori: t.kategori,
        sumber: t.sumber || 'cash',
        nominal: t.nominal,
        nominalGross: t.nominalGross !== undefined ? t.nominalGross : t.nominal,
        adminFee: t.adminFee !== undefined ? t.adminFee : 0,
        _channel: t._channel || 'kedai',
        _margin: t._margin !== undefined ? t._margin : t.nominal,
        _hppTotal: t._hppTotal || 0,
        items: t.items || [],
        synced: true,
        updated_at: new Date().toISOString(),
        _admin_synced: true
      }, { merge: true });
      updatedCount++;
    }
  }

  return {
    deletedCount,
    updatedCount,
    message: `✅ Sync selesai! ${updatedCount} diupdate, ${deletedCount} dihapus dari Cloud.`
  };
}

/**
 * Update single transaksi ke Cloud Firestore (Master Authority)
 */
export async function updateCloudTransaction(t: TransaksiItem): Promise<boolean> {
  try {
    const ref = doc(firestore, 'dikopi_transaksi', String(t.id));
    await setDoc(ref, {
      id: t.id,
      tanggal: t.tanggal,
      tipe: t.tipe,
      deskripsi: t.deskripsi,
      kategori: t.kategori,
      sumber: t.sumber || 'cash',
      nominal: t.nominal,
      nominalGross: t.nominalGross !== undefined ? t.nominalGross : t.nominal,
      adminFee: t.adminFee !== undefined ? t.adminFee : 0,
      _channel: t._channel || 'kedai',
      _margin: t._margin !== undefined ? t._margin : t.nominal,
      _hppTotal: t._hppTotal || 0,
      items: t.items || [],
      synced: true,
      updated_at: t.updated_at || new Date().toISOString(),
      _admin_updated: true
    }, { merge: true });
    return true;
  } catch (err) {
    console.error('Gagal update single transaksi ke Firestore:', err);
    return false;
  }
}

/**
 * Hapus single transaksi dari Cloud Firestore
 */
export async function deleteCloudTransaction(trxId: string | number): Promise<boolean> {
  try {
    const ref = doc(firestore, 'dikopi_transaksi', String(trxId));
    await deleteDoc(ref);
    return true;
  } catch (err) {
    console.error('Gagal hapus transaksi dari Firestore:', err);
    return false;
  }
}

/**
 * Push resep menu ke Cloud Firestore (dikopi_resep)
 */
export async function pushRecipesToCloud(resepList: any[]): Promise<number> {
  const BATCH_SIZE = 400;
  let pushed = 0;
  for (let i = 0; i < resepList.length; i += BATCH_SIZE) {
    const batch = writeBatch(firestore);
    resepList.slice(i, i + BATCH_SIZE).forEach((r) => {
      const ref = doc(firestore, 'dikopi_resep', String(r.id));
      batch.set(ref, {
        id: r.id,
        nama: r.nama || '',
        hargaJual: r.hargaJual || 0,
        hargaJualLarge: r.hargaJualLarge || null,
        kategori: r.kategori || '',
        channel: r.channel || 'kedai',
        hppSnapshot: r.hppSnapshot || 0,
        hppSnapshotLarge: r.hppSnapshotLarge || null,
        catatan: r.catatan || '',
        ingredients: r.ingredients || [],
        variants: r.variants || null,
        createdAt: r.createdAt || new Date().toISOString()
      }, { merge: true });
    });
    await batch.commit();
    pushed += Math.min(BATCH_SIZE, resepList.length - i);
  }
  return pushed;
}
