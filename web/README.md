# 🏛️ Pratani HQ - Modern Executive Operations & Management Console

Pratani HQ adalah dashboard komando eksekutif dan pusat data operasional multi-brand untuk **Pratani Creative Group** (Dikopi, Kolektiva, Evercraft, Imagineer Digital Creative, dan SNM Clothing Brand).

Aplikasi ini dibangun menggunakan arsitektur modern **Local-First**, berinteraksi langsung dengan disk fisik SSD via **File System Access API**, dan terintegrasi dengan **Google Cloud Firestore** untuk sinkronisasi kasir event secara realtime.

---

## 🚀 Fitur Utama

1. **Executive Overview Dashboard:**
   - Konsolidasi performa keuangan multi-brand (Omzet, HPP, Biaya Ops, Net Profit).
   - Live activity ledger & status kas terkini (Cash vs Rekening).
2. **Buku Kas Interaktif (Finance Module):**
   - Transaksi masuk, keluar, dan mutasi saldo dengan pencarian dan filter bulan instan.
   - Modal pencatatan transaksi yang langsung menulis ke `#DATA/keu.json` di disk lokal.
3. **Resep & Kalkulator HPP Real-time (Dikopi):**
   - Katalog 58 resep minuman & makanan Dikopi.
   - Perhitungan otomatis HPP per cup berdasarkan gramasi bahan dan harga beli terkini.
   - Margin kotor dan markup persentase.
4. **Kolektiva 7-Document Generator Engine (0-Drama LPJ):**
   - Generator otomatis 7 dokumen formal vendor organisasi kampus/komunitas:
     - 📑 **RAB** (Rencana Anggaran Biaya)
     - 📜 **SPK / MoU** (Perjanjian Kerjasama Resmi)
     - 🎨 **Design Approval Sheet** (Persetujuan Desain & Spesifikasi Cetak)
     - 🚚 **Surat Jalan / Delivery Order**
     - 🤝 **BAST** (Berita Acara Serah Terima)
     - 🧾 **Invoice** (Tagihan Resmi & Rekening Transfer)
     - 💵 **Kwitansi** (Tanda Terima Pembayaran Sah)
   - Dukungan cetak langsung (A4 layout) dan ekspor PDF.
5. **Content Plan Editorial Calendar:**
   - 151 entri jadwal posting media sosial (Instagram, TikTok, Facebook).
   - Hook, CTA, pilar konten, format badge, dan checklist selesai.
6. **Task Management (Operational):**
   - Lembar kerja proyek dengan indikator prioritas, status, dan PIC.
7. **Cloud Cashier Real-time Sync:**
   - Tarik transaksi kasir lapangan dari Firestore ke database lokal hanya dengan 1-klik tanpa memerlukan server perantara.

---

## 🛠️ Tech Stack & Standar Rekayasa

- **Framework:** React 19 + TypeScript + Vite 8
- **Styling:** Tailwind CSS 3.4 (Custom Obsidian & Deep Slate Anti-Generic Design System)
- **Icons:** Lucide React
- **Cloud Database:** Firebase Firestore (Cloud Sync)
- **Local Persistence:** File System Access API + IndexedDB Handle Persistence
- **Linter & Build Tools:** Oxlint, PostCSS, TypeScript 5.8

---

## ⚙️ Setup & Menjalankan Aplikasi

### 1. Prasyarat
- Node.js versi 18+ atau 20+
- Browser berbasis Chromium (Google Chrome, Microsoft Edge, Brave) untuk mendukung File System Access API.

### 2. Konfigurasi Environment
Salin template konfigurasi environment:
```bash
cp .env.example .env.local
```
Sesuaikan kredensial Firebase Firestore di `.env.local` jika menggunakan project Firebase berbeda.

### 3. Instalasi & Menjalankan Server
```bash
# Masuk ke folder web
cd web

# Menjalankan build & preview (port 4173)
npm start

# Atau jalankan development server dengan HMR
npm run dev
```

### 4. Menghubungkan ke Folder `#DATA`
1. Buka browser di `http://localhost:4173` (atau port yang terbuka).
2. Di pojok kanan atas Header, klik tombol **"Hubungkan Folder #DATA"**.
3. Pilih folder `#DATA` di dalam direktori `#01 PRATANI HQ`.
4. Berikan izin baca/tulis (*View and edit files*).
5. Handle folder akan disimpan di IndexedDB peramban sehingga lo tidak perlu menghubungkan ulang setiap kali me-refresh halaman!

---

## 🔒 Keamanan & Kebijakan Data
- **Zero Cloud Leak:** Data keuangan dan operasional utama tetap tersimpan 100% di disk SSD lokal (`#DATA/*.json`).
- **OWASP Compliance:** Sanitasi input pada modal transaksi dan validasi skema JSON otomatis.
- **Backward Compatible:** File legacy `PrataniHQ_v4.2.html` tetap utuh sebagai fallback darurat kapan pun dibutuhkan.
