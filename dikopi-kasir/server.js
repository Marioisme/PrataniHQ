const express = require('express');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Path ke database lokal #01 PRATANI HQ
const HQ_KEU_PATH = path.join(__dirname, '..', '#DATA', 'keu.json');

// ── CONFIG FIREBASE ADMIN / REST ENDPOINT ──────────────────────
// Ganti dengan URL Realtime Database Anda (atau gunakan Firebase Admin SDK):
const FIREBASE_DB_URL = process.env.FIREBASE_DB_URL || "https://YOUR_PROJECT_ID-default-rtdb.firebaseio.com";

/**
 * Endpoint /api/sync-event
 * Menarik semua transaksi event yang belum disinkronkan dari Cloud,
 * menulisnya ke #DATA/keu.json di Pratani HQ, dan memperbarui status di Cloud DB.
 */
app.post('/api/sync-event', async (req, res) => {
  try {
    let itemsToSync = [];
    let isCloudFetch = false;

    // 1. Coba tarik transaksi dari Firebase Realtime DB via REST API
    if (FIREBASE_DB_URL && !FIREBASE_DB_URL.includes("YOUR_PROJECT_ID")) {
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
    if (!fs.existsSync(HQ_KEU_PATH)) {
      // jika dipanggil dari subfolder atau folder terpisah, coba fallback path lokal
      const fallbackPath = path.join(__dirname, '#DATA', 'keu.json');
      if (!fs.existsSync(fallbackPath)) {
        return res.status(404).json({
          success: false,
          message: `File database #DATA/keu.json tidak ditemukan di path: ${HQ_KEU_PATH}`
        });
      }
    }

    const activeKeuPath = fs.existsSync(HQ_KEU_PATH) ? HQ_KEU_PATH : path.join(__dirname, '#DATA', 'keu.json');
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
    if (isCloudFetch && FIREBASE_DB_URL) {
      await Promise.all(itemsToSync.map(async (item) => {
        if (item._cloudKey) {
          try {
            await fetch(`${FIREBASE_DB_URL}/event_transactions/${item._cloudKey}.json`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                synced: true,
                synced_at: nowIso
              })
            });
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
