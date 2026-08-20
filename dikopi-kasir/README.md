# Dikopi Event Mode POS - Realtime Cloud Sync & Local HQ Sync

Sistem Kasir Event Dikopi dengan integrasi Realtime Cloud Database (Firebase) dan sinkronisasi 1-click ke database utama **Pratani HQ** (`#DATA/keu.json`).

## 📁 Struktur File
- `public/dikopi-event.html`: Interface kasir event (Web POS) dengan Real-time Stream transaksi.
- `server.js`: Server POS (Express Node.js) yang memproses endpoint `/api/sync-event`.

---

## ⚙️ Panduan Setup Kredensial Firebase

1. Buka [Firebase Console](https://console.firebase.google.com/) dan buat project baru (atau gunakan project yang ada).
2. Buat **Realtime Database** di mode Test / Read-Write.
3. Di **Project Settings > General > Your Apps**, pilih Web App (`</>`) dan salin objek `firebaseConfig`.
4. Buka file `public/dikopi-event.html`, lalu ganti objek `firebaseConfig` dengan kredensial Anda:

```js
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "dikopi-pos.firebaseapp.com",
  databaseURL: "https://dikopi-pos-default-rtdb.firebaseio.com",
  projectId: "dikopi-pos",
  storageBucket: "dikopi-pos.appspot.com",
  messagingSenderId: "1234567890",
  appId: "1:1234567890:web:abcdef..."
};
```

5. Di `server.js`, set variabel environment `FIREBASE_DB_URL` (atau isi default nilai `FIREBASE_DB_URL`):
```js
const FIREBASE_DB_URL = "https://dikopi-pos-default-rtdb.firebaseio.com";
```

---

## 🚀 Cara Menggunakan Fitur

1. **Jalankan POS Server**:
   ```bash
   cd dikopi-kasir
   node server.js
   ```
2. **Penggunaan saat Event (Di Luar Kedai / Mobile & Tablet)**:
   - Buka `http://localhost:3000/dikopi-event.html` (atau URL publik yang dihosting).
   - Setiap transaksi yang di-submit akan langsung ter-push ke Cloud Database.
   - Semua device (Kasir & Manager) yang membuka halaman ini akan melihat transaksi baru secara real-time tanpa perlu refresh!

3. **Sinkronisasi Kembali ke Local HQ**:
   - Setelah selesai event atau saat kembali terhubung ke jaringan kedai, tekan tombol **"🔄 Sinkronkan ke HQ"**.
   - Server Node.js akan menarik transaksi yang belum disinkronkan dari Cloud, menuliskannya ke `#DATA/keu.json` di bawah objek `dikopi` dengan penanda `_source: "kasir_event"`, dan menandai status `synced: true` di Cloud Database agar tidak terduplikasi.
   - Buka **Pratani HQ** (`PrataniHQ_v4.2.html`) -> Klik **🔄 Refresh Data**, transaksi event otomatis masuk ke laporan keuangan dan perhitungan margin & bonus barista!
