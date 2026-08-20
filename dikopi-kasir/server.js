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
    console.log(`🔑 [FIREBASE ADMIN SDK] Inisialisasi Service Account berhasil dari (${path.basename(keyPath)})`);
  } else {
    console.warn(`⚠️ [FIREBASE ADMIN SDK] File key '${SERVICE_ACCOUNT_NAME}' belum ditemukan. Menggunakan REST API fallback.`);
  }
} catch (e) {
  console.warn("⚠️ [FIREBASE ADMIN SDK] Paket firebase-admin belum diinstall. Menggunakan REST API fallback.");
}

/**
 * Endpoint /api/sync-event
 * Menarik semua transaksi event yang belum disinkronkan dari Cloud,
 * menulisnya ke #DATA/keu.json di Pratani HQ, dan memperbarui status di Cloud DB.
 */
app.post('/api/sync-event', async (req, res) => {
  try {
    let itemsToSync = [];
    let isCloudFetch = false;

    // 1. Tarik data dari Firebase via Admin SDK (Privileged Access) atau REST API Fallback
    if (adminDb) {
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
          isCloudFetch = true;
        }
      } catch (adminErr) {
        console.error("⚠️ Error saat query via Firebase Admin SDK:", adminErr.message);
      }
    }

    // Fallback REST API jika Admin SDK belum mengembalikan data
    if (itemsToSync.length === 0 && !adminDb && FIREBASE_DB_URL) {
      try {
        const fetchRes = await fetch(`${FIREBASE_DB_URL}/event_transactions.json`);
        const cloudData = await fetchRes.json();
        if (cloudData) {
          Object.keys(cloudData).forEach(key => {
            const item = cloudData[key];
            if (!item.synced) {
              itemsToSync.push({ _cloudKey: key, ...item });
            }
          });
          isCloudFetch = true;
        }
      } catch (cloudErr) {
        console.warn("⚠️ Gagal mengambil data dari Firebase REST API:", cloudErr.message);
      }
    }

    // 2. Jika req.body menyediakan fallback transaksi (misal dari LocalStorage frontend)
    if (itemsToSync.length === 0 && req.body && Array.isArray(req.body.transactions)) {
      itemsToSync = req.body.transactions.filter(t => !t.synced);
    }

    if (itemsToSync.length === 0) {
      return res.json({
        success: true,
        syncedCount: 0,
        message: 'Tidak ada transaksi event baru yang perlu disinkronkan.'
      });
    }

    // 3. Pastikan file #DATA/keu.json tersedia
    const activeKeuPath = fs.existsSync(HQ_KEU_PATH) ? HQ_KEU_PATH : path.join(__dirname, '#DATA', 'keu.json');
    if (!fs.existsSync(activeKeuPath)) {
      return res.status(404).json({
        success: false,
        message: `File database #DATA/keu.json tidak ditemukan di path: ${activeKeuPath}`
      });
    }

    const rawKeu = fs.readFileSync(activeKeuPath, 'utf8');
    const keuData = rawKeu ? JSON.parse(rawKeu) : { kolektiva: [], dikopi: [], studio: [] };

    if (!keuData.dikopi) keuData.dikopi = [];

    // 4. Format & Append data transaksi event ke array 'dikopi'
    const nowIso = new Date().toISOString();
    const newRecords = itemsToSync.map(t => ({
      id: t.id || Date.now(),
      tanggal: t.tanggal || nowIso.split('T')[0],
      deskripsi: t.deskripsi || 'Penjualan Kasir Event',
      kategori: t.kategori || 'Penjualan Langsung',
      tipe: 'masuk',
      sumber: t.sumber || 'cash',
      nominal: Number(t.nominal) || 0,
      nota: null,
      nota_type: null,
      items: t.items || [],
      _source: 'kasir_event',
      created_at: t.created_at || nowIso
    }));

    keuData.dikopi.push(...newRecords);

    // 5. Tulis secara persisten ke #DATA/keu.json HQ
    fs.writeFileSync(activeKeuPath, JSON.stringify(keuData, null, 2), 'utf8');

    // 6. Tandai data di Cloud DB sebagai synced: true
    if (isCloudFetch) {
      await Promise.all(itemsToSync.map(async (item) => {
        if (item._cloudKey) {
          try {
            if (adminDb) {
              await adminDb.ref(`event_transactions/${item._cloudKey}`).update({
                synced: true,
                synced_at: nowIso
              });
            } else {
              await fetch(`${FIREBASE_DB_URL}/event_transactions/${item._cloudKey}.json`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ synced: true, synced_at: nowIso })
              });
            }
          } catch(patchErr) {
            console.error(`Gagal update synced flag untuk key ${item._cloudKey}:`, patchErr.message);
          }
        }
      }));
    }

    console.log(`✅ [SYNC EVENT SUCCESS] ${newRecords.length} transaksi event berhasil ditulis ke ${activeKeuPath}`);

    return res.json({
      success: true,
      syncedCount: newRecords.length,
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
