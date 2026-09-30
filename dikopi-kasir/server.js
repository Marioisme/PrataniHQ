const express = require('express');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// ── STATIC FILES & ROUTING ──────────────────────────────────────
const publicPath = path.join(__dirname, 'public');
app.use(express.static(publicPath));
app.use('/public', express.static(publicPath));

// Route khusus untuk menyajikan dikopi-event.html
app.get(['/', '/dikopi-event', '/dikopi-event.html', '/event'], (req, res) => {
  const filePath = path.join(publicPath, 'dikopi-event.html');
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).send('❌ File public/dikopi-event.html tidak ditemukan di ' + filePath);
  }
});

// Path ke database lokal #01 PRATANI HQ
const HQ_KEU_PATH = path.join(__dirname, '..', '#DATA', 'keu.json');

// ── CONFIG FIREBASE ADMIN SDK & REST FALLBACK ──────────────────
const FIREBASE_DB_URL = process.env.FIREBASE_DB_URL || "https://aplikasi-kasir-dikopi-default-rtdb.firebaseio.com";
const SERVICE_ACCOUNT_NAME = 'aplikasi-kasir-dikopi-firebase-adminsdk-fbsvc-fe1a1c0f62.json';
const SERVICE_ACCOUNT_PATH = path.join(__dirname, SERVICE_ACCOUNT_NAME);

let adminDb = null;
let adminFirestore = null;

try {
  const admin = require('firebase-admin');
  let keyPath = fs.existsSync(SERVICE_ACCOUNT_PATH) ? SERVICE_ACCOUNT_PATH : null;

  // Auto-detect service account key jika nama file berbeda sedikit
  if (!keyPath) {
    const files = fs.readdirSync(__dirname);
    const keyFile = files.find(f => f.includes('firebase-adminsdk') && f.endsWith('.json'));
    if (keyFile) keyPath = path.join(__dirname, keyFile);
  }

  if (keyPath && fs.existsSync(keyPath)) {
    const serviceAccount = JSON.parse(fs.readFileSync(keyPath, 'utf8'));
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: FIREBASE_DB_URL
    });
    adminDb = admin.database();
    adminFirestore = admin.firestore();
    console.log(`🔑 [FIREBASE ADMIN SDK] Inisialisasi Service Account berhasil dari (${path.basename(keyPath)}) [Firestore & RTDB Ready]`);
  } else {
    console.warn(`⚠️ [FIREBASE ADMIN SDK] File key '${SERVICE_ACCOUNT_NAME}' belum ditemukan. Menggunakan REST API fallback.`);
  }
} catch (e) {
  console.warn("⚠️ [FIREBASE ADMIN SDK] Inisialisasi Firebase Admin terlewat/gagal: " + e.message + ". Menggunakan REST API fallback.");
}

/**
 * Endpoint /api/status
 * Memberikan informasi kesehatan server, target DB, dan status integrasi.
 */
app.get('/api/status', (req, res) => {
  const dbExists = fs.existsSync(HQ_KEU_PATH);
  let totalTrxCount = 0;
  if (dbExists) {
    try {
      const raw = fs.readFileSync(HQ_KEU_PATH, 'utf8');
      const parsed = JSON.parse(raw);
      totalTrxCount = (parsed.dikopi || []).length;
    } catch (e) { /* ignore parse error in status */ }
  }

  res.json({
    status: 'online',
    server: 'Dikopi POS Event Bridge Server',
    version: '4.2.0',
    hq_db_path: HQ_KEU_PATH,
    hq_db_exists: dbExists,
    total_dikopi_transactions: totalTrxCount,
    firebase_admin_sdk: !!adminFirestore ? 'firestore_active' : (!!adminDb ? 'rtdb_active' : 'inactive_rest_fallback'),
    timestamp: new Date().toISOString()
  });
});

/**
 * Endpoint /api/sync-event
 * Menarik semua transaksi event yang belum disinkronkan dari Cloud (Firestore & RTDB),
 * menerapkan filter idempotency (mencegah duplikasi),
 * menulisnya ke #DATA/keu.json di Pratani HQ, dan memperbarui status di Cloud DB.
 */
app.post('/api/sync-event', async (req, res) => {
  try {
    let itemsToSync = [];
    let isFirestoreFetch = false;
    let isRtdbFetch = false;

    // 1A. Prioritas Utama: Tarik data dari Firestore (dikopi_transaksi) via Admin SDK
    if (adminFirestore) {
      try {
        const snap = await adminFirestore.collection('dikopi_transaksi').get();
        snap.docs.forEach(doc => {
          const data = doc.data();
          if (!data.synced) {
            itemsToSync.push({ _docId: doc.id, ...data });
          }
        });
        if (itemsToSync.length > 0) isFirestoreFetch = true;
      } catch (fsErr) {
        console.error("⚠️ Error saat query Firestore via Admin SDK:", fsErr.message);
      }
    }

    // 1B. Fallback RTDB (event_transactions) via Admin SDK jika Firestore belum menghasilkan item
    if (itemsToSync.length === 0 && adminDb) {
      try {
        const snapshot = await adminDb.ref('event_transactions').once('value');
        const cloudData = snapshot.val();
        if (cloudData) {
          Object.keys(cloudData).forEach(key => {
            const item = cloudData[key];
            if (!item.synced) {
              itemsToSync.push({ _cloudKey: key, ...item });
            }
          });
          isRtdbFetch = true;
        }
      } catch (adminErr) {
        console.error("⚠️ Error saat query via Firebase RTDB Admin SDK:", adminErr.message);
      }
    }

    // 1C. Fallback REST API untuk RTDB jika Admin SDK tidak tersedia
    if (itemsToSync.length === 0 && !adminDb && !adminFirestore && FIREBASE_DB_URL) {
      try {
        const fetchRes = await fetch(`${FIREBASE_DB_URL}/event_transactions.json`);
        if (fetchRes.ok) {
          const cloudData = await fetchRes.json();
          if (cloudData) {
            Object.keys(cloudData).forEach(key => {
              const item = cloudData[key];
              if (!item.synced) {
                itemsToSync.push({ _cloudKey: key, ...item });
              }
            });
            isRtdbFetch = true;
          }
        }
      } catch (cloudErr) {
        console.warn("⚠️ Gagal mengambil data dari Firebase REST API:", cloudErr.message);
      }
    }

    // 1D. Fallback dari payload request (misal LocalStorage dari client)
    if (itemsToSync.length === 0 && req.body && Array.isArray(req.body.transactions)) {
      itemsToSync = req.body.transactions.filter(t => !t.synced);
    }

    if (itemsToSync.length === 0) {
      return res.json({
        success: true,
        syncedCount: 0,
        skippedDuplicates: 0,
        message: 'Tidak ada transaksi event baru yang perlu disinkronkan.'
      });
    }

    // 2. Pastikan file #DATA/keu.json HQ tersedia
    const activeKeuPath = fs.existsSync(HQ_KEU_PATH) ? HQ_KEU_PATH : path.join(__dirname, '..', '#DATA', 'keu.json');
    if (!fs.existsSync(activeKeuPath)) {
      return res.status(404).json({
        success: false,
        message: `File database #DATA/keu.json tidak ditemukan di path: ${activeKeuPath}`
      });
    }

    const rawKeu = fs.readFileSync(activeKeuPath, 'utf8');
    const keuData = rawKeu ? JSON.parse(rawKeu) : { kolektiva: [], dikopi: [], studio: [] };
    if (!keuData.dikopi) keuData.dikopi = [];

    // 3. IDEMPOTENCY CHECK (Cegah Duplikasi Transaksi)
    const existingIdSet = new Set(keuData.dikopi.map(t => String(t.id)));
    const uniqueItemsToSync = itemsToSync.filter(t => !existingIdSet.has(String(t.id)));
    const skippedDuplicates = itemsToSync.length - uniqueItemsToSync.length;

    if (uniqueItemsToSync.length === 0) {
      return res.json({
        success: true,
        syncedCount: 0,
        skippedDuplicates: skippedDuplicates,
        message: `Semua (${skippedDuplicates}) transaksi cloud sudah tercatat di HQ. Tidak ada transaksi baru.`
      });
    }

    // 4. Format & Standarisasi record transaksi
    const nowIso = new Date().toISOString();
    const newRecords = uniqueItemsToSync.map(t => ({
      id: t.id || Date.now(),
      tanggal: t.tanggal || nowIso.split('T')[0],
      deskripsi: t.deskripsi || 'Penjualan Kasir Event',
      kategori: t.kategori || 'Penjualan Langsung',
      tipe: t.tipe || 'masuk',
      sumber: t.sumber || 'cash',
      nominal: Number(t.nominal) || 0,
      _margin: t._margin !== undefined ? Number(t._margin) : (Number(t.nominal) || 0),
      _hppTotal: Number(t._hppTotal) || 0,
      nota: t.nota || null,
      nota_type: t.nota_type || null,
      items: Array.isArray(t.items) ? t.items : [],
      _source: t._source || 'kasir_event',
      created_at: t.created_at || nowIso
    }));

    keuData.dikopi.push(...newRecords);

    // Urutkan transaksi berdasarkan tanggal / created_at agar rapi
    keuData.dikopi.sort((a, b) => new Date(a.created_at || a.tanggal || 0) - new Date(b.created_at || b.tanggal || 0));

    // 5. Tulis secara persisten ke #DATA/keu.json HQ
    fs.writeFileSync(activeKeuPath, JSON.stringify(keuData, null, 2), 'utf8');

    // 6. Tandai data di Cloud DB sebagai synced: true
    if (isFirestoreFetch && adminFirestore) {
      const batch = adminFirestore.batch();
      uniqueItemsToSync.forEach(item => {
        if (item._docId) {
          const docRef = adminFirestore.collection('dikopi_transaksi').doc(item._docId);
          batch.update(docRef, { synced: true, synced_at: nowIso });
        }
      });
      await batch.commit();
    } else if (isRtdbFetch) {
      await Promise.all(uniqueItemsToSync.map(async (item) => {
        if (item._cloudKey) {
          try {
            if (adminDb) {
              await adminDb.ref(`event_transactions/${item._cloudKey}`).update({
                synced: true,
                synced_at: nowIso
              });
            } else {
              const patchRes = await fetch(`${FIREBASE_DB_URL}/event_transactions/${item._cloudKey}.json`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ synced: true, synced_at: nowIso })
              });
              if (!patchRes.ok) console.warn(`⚠️ Warning PATCH RTDB: ${patchRes.statusText}`);
            }
          } catch(patchErr) {
            console.error(`Gagal update synced flag untuk key ${item._cloudKey}:`, patchErr.message);
          }
        }
      }));
    }

    console.log(`✅ [SYNC EVENT SUCCESS] ${newRecords.length} transaksi baru ditulis ke ${activeKeuPath} (${skippedDuplicates} terlewati karena duplikat).`);

    return res.json({
      success: true,
      syncedCount: newRecords.length,
      skippedDuplicates: skippedDuplicates,
      message: `${newRecords.length} transaksi event berhasil disinkronkan ke #DATA/keu.json!`
    });

  } catch (error) {
    console.error("❌ Error pada /api/sync-event:", error);
    return res.status(500).json({
      success: false,
      message: 'Gagal melakukan sinkronisasi: ' + error.message
    });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 Dikopi POS Server berjalan di http://localhost:${PORT}`);
  console.log(`📂 Database HQ target: ${HQ_KEU_PATH}`);
});
