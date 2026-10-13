import React, { useState, useMemo } from 'react';
import { fmtRp } from '../../lib/keuanganUtils';
import type { KontakItem } from '../../types';

export type GenDocType = 'gen_invoice' | 'gen_penawaran' | 'gen_rab' | 'gen_mou' | 'gen_bast' | 'gen_kwitansi';

interface GeneratorDokumenViewProps {
  initialType?: GenDocType;
  kontakList?: KontakItem[];
}

export const GeneratorDokumenView: React.FC<GeneratorDokumenViewProps> = ({
  initialType = 'gen_invoice',
  kontakList = []
}) => {
  const [docType, setDocType] = useState<GenDocType>(initialType);

  // ==========================================
  // 1. INVOICE STATE
  // ==========================================
  const [invData, setInvData] = useState({
    to: 'Aditya Uki Nugroho',
    custId: 'PPKH-25',
    toAddr: 'Jl. Kampus No. 12, Purwokerto',
    invNo: 'INV-PRATANI-PKPH-015-X-2026',
    date: '12 Mei 2026',
    pengirim: 'Mario',
    jabatan: 'Marketing Manager',
    ketentuan: 'Sebelum Tempo',
    tempo: '31 Oktober 2026',
    paid: 0,
    items: [
      { qty: 100, produk: 'T-Shirt Cotton Combed 24s', harga: 65000 },
      { qty: 100, produk: 'Totebag Kanvas Sablon 2 Sisi', harga: 25000 }
    ]
  });

  // ==========================================
  // 2. SURAT PENAWARAN STATE
  // ==========================================
  const [quoData, setQuoData] = useState({
    nomor: '001/KLV.QUO/2026',
    tanggal: '12/05/2026',
    perihal: 'Surat Penawaran Pengadaan Merchandise',
    lampiran: '1 Berkas',
    namaAcara: 'MANDUBES CAMPUS EXPO 2026',
    kepadaLabel: 'Panitia Pelaksana',
    instansi: 'Universitas Jenderal Soedirman',
    bodyText: 'Melalui kesempatan ini kami dari Kolektiva bermaksud mengajukan kerjasama dalam pengadaan merchandise dan konveksi. Detail rincian penawaran terlampir.',
    penutupText: 'Demikian penawaran kerjasama ini kami sampaikan. Besar harapan kami untuk dapat berkolaborasi menyukseskan kegiatan ini.',
    picNama: 'Mario Pratama',
    picJabatan: 'Account Executive Kolektiva',
    items: [
      { nama: 'T-Shirt Event Combed 30s', spesifikasi: 'Sablon Rubber 2 Titik A3', qty: 150, harga: 60000 },
      { nama: 'ID Card PVC + Lanyard Tissue', spesifikasi: 'Printing 2 Sisi + Stopper', qty: 150, harga: 12000 }
    ]
  });

  // ==========================================
  // 3. KWITANSI STATE
  // ==========================================
  const [kwtData, setKwtData] = useState({
    nomor: 'KWT-KLV-001-I-2026',
    tanggal: '12/05/2026',
    customerId: 'MCE-2026',
    namaPenerima: 'Dian Rosilawati',
    divisiPenerima: 'Co Danus',
    instansiPenerima: 'Panitia Pelaksana MCE 2026',
    terbilang: 'Sembilan Juta Rupiah',
    untukPembayaran: 'Pembayaran DP 50% Pengadaan T-Shirt Event MCE 2026',
    metode: 'Transfer Bank Mandiri',
    penerimaNama: 'Mario Pratama',
    items: [
      { termin: '1', deskripsi: 'Pembayaran DP 50% T-Shirt Event', nominal: 9000000, diskon: 0 }
    ]
  });

  // ==========================================
  // 4. MOU (PROOF OF AGREEMENT) STATE
  // ==========================================
  const [mouData, setMouData] = useState({
    nomor: 'AGR-KLV-MCE-001-2026',
    tanggal: '12/05/2026',
    judulProduk: 'TSHIRT MERCHANDISE MANDUBES CAMPUS EXPO 2026',
    namaP2: 'Dian Rosilawati',
    jabatanP2: 'Co. Danus',
    genderP2: 'Perempuan',
    alamatP2: 'Purwokerto Barat',
    namaOrg: 'Panitia Pelaksana Mandubes Campus Expo 2026',
    dpNominal: 4500000,
    dpPersen: 50,
    rekening: 'Bank Mandiri: 1390-0192-38491 a.n PT Pratani Kreatif Group',
    varian: [
      { varian: 'T-Shirt Combed 24s Hitam', harga: 65000, qty: 100, subtotal: 6500000 }
    ]
  });

  // ==========================================
  // 5. BAST (BERITA ACARA SERAH TERIMA) STATE
  // ==========================================
  const [bastData, setBastData] = useState({
    noOrder: 'KLV/2026/001',
    tglST: '12/05/2026',
    tglOrder: '01/05/2026',
    tglProduksi: '10/05/2026',
    metodeKirim: 'Kurir Internal Pratani',
    pihak1Nama: 'Mario Pratama',
    pihak1Jabatan: 'Operational Lead Kolektiva',
    pihak2Nama: 'Dian Rosilawati',
    pihak2Jabatan: 'Ketua Panitia MCE 2026',
    pihak2Instansi: 'Mandubes Campus Expo 2026',
    items: [
      { nama: 'T-Shirt Combed 24s', qty: 100, unit: 'Pcs', status: 'Lengkap & Sesuai' }
    ]
  });

  // ==========================================
  // 6. RAB STATE
  // ==========================================
  const [rabData, setRabData] = useState({
    proyek: 'Pengadaan Seragam & Goodie Bag Angkatan 2026',
    instansi: 'Fakultas Teknik UNSOED',
    tanggal: '12/05/2026',
    items: [
      { kategori: 'Produksi', deskripsi: 'Polo Shirt Lacoste Pique CVC', qty: 200, unit: 'pcs', unitCost: 85000 },
      { kategori: 'Packaging', deskripsi: 'Plastik Sablon & Thank You Card', qty: 200, unit: 'pcs', unitCost: 3500 },
      { kategori: 'Logistik', deskripsi: 'Pengiriman Kargo Ekspedisi', qty: 1, unit: 'lot', unitCost: 150000 }
    ]
  });

  // Client Auto-pull from Kontak
  const handleSelectKontak = (k: KontakItem) => {
    if (docType === 'gen_invoice') {
      setInvData({
        ...invData,
        to: k.nama,
        toAddr: k.alamat || invData.toAddr
      });
    } else if (docType === 'gen_penawaran') {
      setQuoData({
        ...quoData,
        namaAcara: k.nama,
        instansi: k.peran || quoData.instansi
      });
    } else if (docType === 'gen_kwitansi') {
      setKwtData({
        ...kwtData,
        namaPenerima: k.nama,
        divisiPenerima: k.peran || kwtData.divisiPenerima
      });
    } else if (docType === 'gen_mou') {
      setMouData({
        ...mouData,
        namaP2: k.nama,
        jabatanP2: k.peran || mouData.jabatanP2,
        alamatP2: k.alamat || mouData.alamatP2
      });
    } else if (docType === 'gen_bast') {
      setBastData({
        ...bastData,
        pihak2Nama: k.nama,
        pihak2Jabatan: k.peran || bastData.pihak2Jabatan
      });
    }
  };

  // ==========================================
  // HTML BUILDERS
  // ==========================================
  const invGrandTotal = useMemo(() => {
    return invData.items.reduce((s, it) => s + (Number(it.qty) || 0) * (Number(it.harga) || 0), 0);
  }, [invData.items]);

  const invBalanceDue = invGrandTotal - (Number(invData.paid) || 0);

  const previewHTML = useMemo(() => {
    if (docType === 'gen_invoice') {
      const itemRows = invData.items.map((it) => {
        const t = (Number(it.qty) || 0) * (Number(it.harga) || 0);
        return `
          <tr style="border-bottom:1px solid #eee">
            <td style="padding:10px 12px;font-size:12px">${Number(it.qty || 0).toFixed(0)}</td>
            <td style="padding:10px 12px;font-size:12px;font-weight:600">${it.produk || '—'}</td>
            <td style="padding:10px 12px;font-size:12px;text-align:right">${fmtRp(it.harga || 0)}</td>
            <td style="padding:10px 12px;font-size:12px;text-align:right;font-weight:700">${fmtRp(t)}</td>
          </tr>`;
      }).join('');

      return `<!DOCTYPE html><html><head><meta charset="UTF-8">
      <style>
        body { font-family: 'Open Sans', Arial, sans-serif; background: #fff; color: #333; margin: 0; padding: 30px; font-size: 13px; }
        .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #1E2D4E; padding-bottom: 16px; margin-bottom: 20px; }
        .brand-name { font-size: 22px; font-weight: 800; color: #1E2D4E; letter-spacing: -0.02em; }
        .brand-sub { font-size: 11px; color: #C4623A; font-weight: 600; margin-top: 2px; }
        .inv-badge { font-size: 28px; font-weight: 800; color: #1E2D4E; letter-spacing: 0.05em; }
        .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 24px; font-size: 12px; }
        .meta-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 14px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        th { background: #1E2D4E; color: #fff; padding: 8px 12px; font-size: 11px; text-transform: uppercase; font-weight: 700; text-align: left; }
        .total-box { margin-left: auto; width: 280px; font-size: 12px; }
        .total-row { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #e2e8f0; }
      </style>
      </head><body>
        <div class="header">
          <div>
            <div class="brand-name">PRATANI CREATIVE</div>
            <div class="brand-sub">PT PRATANI KREATIF GROUP — INVOICE TAGIHAN</div>
          </div>
          <div style="text-align:right">
            <div class="inv-badge">INVOICE</div>
            <div style="font-size:11px;color:#64748b;font-family:monospace;margin-top:2px">${invData.invNo}</div>
          </div>
        </div>

        <div class="meta-grid">
          <div class="meta-box">
            <div style="font-weight:700;color:#1E2D4E;margin-bottom:4px;font-size:11px;text-transform:uppercase">Tagihan Kepada:</div>
            <div style="font-weight:700;font-size:14px">${invData.to}</div>
            <div style="color:#64748b;margin-top:2px">${invData.toAddr}</div>
            <div style="color:#64748b;font-size:11px;margin-top:4px">Customer ID: ${invData.custId}</div>
          </div>
          <div class="meta-box">
            <div style="font-weight:700;color:#1E2D4E;margin-bottom:4px;font-size:11px;text-transform:uppercase">Informasi Tagihan:</div>
            <div><strong>Tanggal:</strong> ${invData.date}</div>
            <div><strong>Jatuh Tempo:</strong> ${invData.tempo}</div>
            <div><strong>Ketentuan:</strong> ${invData.ketentuan}</div>
            <div><strong>PIC Pengirim:</strong> ${invData.pengirim} (${invData.jabatan})</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="width:70px">Qty</th>
              <th>Deskripsi Produk</th>
              <th style="width:110px;text-align:right">Harga Satuan</th>
              <th style="width:120px;text-align:right">Subtotal</th>
            </tr>
          </thead>
          <tbody>${itemRows}</tbody>
        </table>

        <div class="total-box">
          <div class="total-row"><span>Grand Total:</span><strong style="color:#1E2D4E">${fmtRp(invGrandTotal)}</strong></div>
          <div class="total-row"><span>Amount Paid (DP):</span><span style="color:#4cc9a0">${fmtRp(invData.paid)}</span></div>
          <div class="total-row" style="border-top:2px solid #1E2D4E;padding-top:8px">
            <span style="font-weight:700">Sisa Tagihan (Due):</span>
            <strong style="color:#C4623A;font-size:14px">${fmtRp(invBalanceDue)}</strong>
          </div>
        </div>

        <div style="margin-top:40px;padding:12px;background:#f8fafc;border-left:3px solid #1E2D4E;font-size:11px;color:#64748b">
          Pembayaran ditransfer ke rekening resmi: <strong>Bank Mandiri 1390-0192-38491</strong> a.n <strong>PT Pratani Kreatif Group</strong>.
        </div>
      </body></html>`;
    }

    if (docType === 'gen_kwitansi') {
      const rows = kwtData.items.map((it) => {
        const net = (Number(it.nominal) || 0) * (1 - (Number(it.diskon) || 0) / 100);
        return `
          <tr style="border-bottom:1px solid #eee">
            <td style="padding:10px 12px;text-align:center">${it.termin}</td>
            <td style="padding:10px 12px;font-weight:600">${it.deskripsi}</td>
            <td style="padding:10px 12px;text-align:right">${fmtRp(it.nominal)}</td>
            <td style="padding:10px 12px;text-align:right;font-weight:700;color:#1E2D4E">${fmtRp(net)}</td>
          </tr>`;
      }).join('');

      return `<!DOCTYPE html><html><head><meta charset="UTF-8">
      <style>
        body { font-family: 'Open Sans', Arial, sans-serif; background: #fff; color: #333; margin: 0; padding: 30px; font-size: 13px; }
        .kwt-box { border: 2px solid #1E2D4E; padding: 24px; border-radius: 12px; }
        .header { display: flex; justify-content: space-between; border-bottom: 2px solid #1E2D4E; padding-bottom: 14px; margin-bottom: 16px; }
        table { width: 100%; border-collapse: collapse; margin: 16px 0; }
        th { background: #1E2D4E; color: #fff; padding: 8px 12px; font-size: 11px; text-transform: uppercase; }
      </style>
      </head><body>
        <div class="kwt-box">
          <div class="header">
            <div>
              <div style="font-size:20px;font-weight:800;color:#1E2D4E">KOLEKTIVA — MERCH & CONVECTION</div>
              <div style="font-size:11px;color:#C4623A">PT PRATANI KREATIF GROUP</div>
            </div>
            <div style="text-align:right">
              <div style="font-size:24px;font-weight:800;color:#1E2D4E">KWITANSI RESMI</div>
              <div style="font-size:11px;color:#64748b;font-family:monospace">No: ${kwtData.nomor}</div>
            </div>
          </div>

          <div style="display:grid;grid-template-columns:140px 1fr;gap:8px 12px;font-size:12px;margin-bottom:16px">
            <div><strong>Telah diterima dari:</strong></div><div>${kwtData.namaPenerima} (${kwtData.divisiPenerima} · ${kwtData.instansiPenerima})</div>
            <div><strong>Uang sejumlah:</strong></div><div style="font-style:italic;background:#f8fafc;padding:4px 8px;border-radius:4px;border:1px solid #e2e8f0;font-weight:600">${kwtData.terbilang}</div>
            <div><strong>Untuk keperluan:</strong></div><div>${kwtData.untukPembayaran}</div>
            <div><strong>Metode Bayar:</strong></div><div>${kwtData.metode} · Tanggal ${kwtData.tanggal}</div>
          </div>

          <table>
            <thead>
              <tr><th style="width:50px">Termin</th><th>Deskripsi Transaksi</th><th style="text-align:right">Nominal</th><th style="text-align:right">Total Dibayar</th></tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>

          <div style="display:flex;justify-content:space-between;align-items:flex-end;margin-top:30px">
            <div style="font-size:11px;color:#64748b">
              Validasi Otomatis Kolektiva Finance System<br>
              ID Client: ${kwtData.customerId}
            </div>
            <div style="text-align:center;width:180px">
              <div style="font-size:11px;color:#64748b;margin-bottom:50px">Penerima Kuasa,</div>
              <div style="font-weight:700;border-top:1px solid #333;padding-top:4px">${kwtData.penerimaNama}</div>
            </div>
          </div>
        </div>
      </body></html>`;
    }

    if (docType === 'gen_penawaran') {
      const rows = quoData.items.map((it, idx) => `
        <tr style="border-bottom:1px solid #eee">
          <td style="padding:8px 10px;text-align:center">${idx + 1}</td>
          <td style="padding:8px 10px;font-weight:600">${it.nama}</td>
          <td style="padding:8px 10px;color:#64748b">${it.spesifikasi}</td>
          <td style="padding:8px 10px;text-align:center">${it.qty} pcs</td>
          <td style="padding:8px 10px;text-align:right">${fmtRp(it.harga)}</td>
          <td style="padding:8px 10px;text-align:right;font-weight:700">${fmtRp(it.qty * it.harga)}</td>
        </tr>`).join('');

      return `<!DOCTYPE html><html><head><meta charset="UTF-8">
      <style>
        body { font-family: 'Open Sans', Arial, sans-serif; background: #fff; color: #333; margin: 0; padding: 30px; font-size: 12.5px; }
        .header { display: flex; justify-content: space-between; border-bottom: 2px solid #1E2D4E; padding-bottom: 14px; margin-bottom: 20px; }
        table { width: 100%; border-collapse: collapse; margin: 16px 0; }
        th { background: #1E2D4E; color: #fff; padding: 8px 10px; font-size: 11px; text-transform: uppercase; }
      </style>
      </head><body>
        <div class="header">
          <div>
            <div style="font-size:20px;font-weight:800;color:#1E2D4E">KOLEKTIVA</div>
            <div style="font-size:11px;color:#C4623A">Merchandise & Creative Production</div>
          </div>
          <div style="text-align:right;font-size:11.5px">
            <div><strong>No Surat:</strong> ${quoData.nomor}</div>
            <div><strong>Tanggal:</strong> ${quoData.tanggal}</div>
            <div><strong>Hal:</strong> ${quoData.perihal}</div>
          </div>
        </div>

        <div style="margin-bottom:16px">
          <div>Kepada Yth.</div>
          <div style="font-weight:700;font-size:14px">${quoData.kepadaLabel} ${quoData.namaAcara}</div>
          <div style="color:#64748b">${quoData.instansi}</div>
        </div>

        <div style="line-height:1.7;margin-bottom:16px">${quoData.bodyText}</div>

        <table>
          <thead>
            <tr><th style="width:40px">No</th><th>Item</th><th>Spesifikasi</th><th style="width:70px">Qty</th><th style="width:100px;text-align:right">Harga</th><th style="width:110px;text-align:right">Subtotal</th></tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>

        <div style="line-height:1.7;margin:20px 0">${quoData.penutupText}</div>

        <div style="margin-top:40px;text-align:right;padding-right:30px">
          <div style="font-size:11px;color:#64748b;margin-bottom:50px">Hormat kami,</div>
          <div style="font-weight:700">${quoData.picNama}</div>
          <div style="font-size:11px;color:#64748b">${quoData.picJabatan}</div>
        </div>
      </body></html>`;
    }

    if (docType === 'gen_bast') {
      const rows = bastData.items.map((it, idx) => `
        <tr style="border-bottom:1px solid #eee">
          <td style="padding:8px 10px;text-align:center">${idx + 1}</td>
          <td style="padding:8px 10px;font-weight:600">${it.nama}</td>
          <td style="padding:8px 10px;text-align:center">${it.qty} ${it.unit}</td>
          <td style="padding:8px 10px;color:#4cc9a0;font-weight:600">${it.status}</td>
        </tr>`).join('');

      return `<!DOCTYPE html><html><head><meta charset="UTF-8">
      <style>
        body { font-family: 'Open Sans', Arial, sans-serif; background: #fff; color: #333; margin: 0; padding: 30px; font-size: 12px; }
        .header { text-align: center; border-bottom: 2px solid #1E2D4E; padding-bottom: 12px; margin-bottom: 20px; }
        table { width: 100%; border-collapse: collapse; margin: 16px 0; }
        th { background: #1E2D4E; color: #fff; padding: 7px 10px; font-size: 11px; text-transform: uppercase; }
      </style>
      </head><body>
        <div class="header">
          <div style="font-size:18px;font-weight:800;color:#1E2D4E">BERITA ACARA SERAH TERIMA BARANG (BAST)</div>
          <div style="font-size:11px;color:#64748b;font-family:monospace;margin-top:2px">Nomor Order: ${bastData.noOrder} · Tanggal: ${bastData.tglST}</div>
        </div>

        <p style="line-height:1.7;margin-bottom:14px">
          Pada hari ini, tanggal <strong>${bastData.tglST}</strong>, telah dilakukan serah terima hasil pekerjaan dan pengadaan barang pesanan antara:
        </p>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;background:#f8fafc;padding:12px;border-radius:8px;border:1px solid #e2e8f0;margin-bottom:16px">
          <div>
            <div style="font-weight:700;color:#1E2D4E;margin-bottom:4px">PIHAK PERTAMA (Yang Menyerahkan):</div>
            <div><strong>${bastData.pihak1Nama}</strong></div>
            <div style="color:#64748b">${bastData.pihak1Jabatan}</div>
          </div>
          <div>
            <div style="font-weight:700;color:#1E2D4E;margin-bottom:4px">PIHAK KEDUA (Yang Menerima):</div>
            <div><strong>${bastData.pihak2Nama}</strong></div>
            <div style="color:#64748b">${bastData.pihak2Jabatan} — ${bastData.pihak2Instansi}</div>
          </div>
        </div>

        <table>
          <thead>
            <tr><th style="width:40px">No</th><th>Deskripsi Barang / Hasil Produksi</th><th style="width:90px">Jumlah</th><th>Kondisi & Status</th></tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>

        <p style="line-height:1.7;margin-top:14px">
          Pihak Kedua telah memeriksa dan menerima barang di atas dalam keadaan baik, lengkap, dan sesuai pesanan.
        </p>

        <div style="display:grid;grid-template-columns:1fr 1fr;margin-top:40px;text-align:center">
          <div>
            <div style="font-size:11px;color:#64748b;margin-bottom:50px">PIHAK PERTAMA,</div>
            <div style="font-weight:700">${bastData.pihak1Nama}</div>
          </div>
          <div>
            <div style="font-size:11px;color:#64748b;margin-bottom:50px">PIHAK KEDUA,</div>
            <div style="font-weight:700">${bastData.pihak2Nama}</div>
          </div>
        </div>
      </body></html>`;
    }

    if (docType === 'gen_mou') {
      return `<!DOCTYPE html><html><head><meta charset="UTF-8">
      <style>
        body { font-family: 'Open Sans', Arial, sans-serif; background: #fff; color: #333; margin: 0; padding: 30px; font-size: 12px; line-height: 1.8; }
        .header { text-align: center; border-bottom: 2px solid #1E2D4E; padding-bottom: 12px; margin-bottom: 20px; }
      </style>
      </head><body>
        <div class="header">
          <div style="font-size:18px;font-weight:800;color:#1E2D4E">SURAT PERJANJIAN KERJASAMA (MoU)</div>
          <div style="font-size:11px;color:#64748b">No: ${mouData.nomor} · Tanggal: ${mouData.tanggal}</div>
        </div>
        <p>Pada hari ini <strong>${mouData.tanggal}</strong>, telah disepakati perjanjian kerjasama pengadaan untuk <strong>${mouData.judulProduk}</strong> antara Kolektiva dan Pihak Pemesan <strong>${mouData.namaP2}</strong> (${mouData.jabatanP2} di ${mouData.namaOrg}).</p>
        <p>Ketentuan Pembayaran: DP ${mouData.dpPersen}% (${fmtRp(mouData.dpNominal)}) ditransfer ke ${mouData.rekening}.</p>
      </body></html>`;
    }

    // gen_rab
    const rows = rabData.items.map((it, idx) => `
      <tr style="border-bottom:1px solid #eee">
        <td style="padding:8px 10px;text-align:center">${idx + 1}</td>
        <td style="padding:8px 10px;font-weight:600">${it.kategori}</td>
        <td style="padding:8px 10px">${it.deskripsi}</td>
        <td style="padding:8px 10px;text-align:center">${it.qty} ${it.unit}</td>
        <td style="padding:8px 10px;text-align:right">${fmtRp(it.unitCost)}</td>
        <td style="padding:8px 10px;text-align:right;font-weight:700">${fmtRp(it.qty * it.unitCost)}</td>
      </tr>`).join('');

    const rabTotal = rabData.items.reduce((s, it) => s + it.qty * it.unitCost, 0);

    return `<!DOCTYPE html><html><head><meta charset="UTF-8">
    <style>
      body { font-family: 'Open Sans', Arial, sans-serif; background: #fff; color: #333; margin: 0; padding: 30px; font-size: 12px; }
      .header { display: flex; justify-content: space-between; border-bottom: 2px solid #1E2D4E; padding-bottom: 12px; margin-bottom: 16px; }
      table { width: 100%; border-collapse: collapse; margin: 16px 0; }
      th { background: #1E2D4E; color: #fff; padding: 7px 10px; font-size: 11px; text-transform: uppercase; }
    </style>
    </head><body>
      <div class="header">
        <div>
          <div style="font-size:18px;font-weight:800;color:#1E2D4E">RINCIAN ANGGARAN BIAYA (RAB)</div>
          <div style="font-size:12px;color:#C4623A;font-weight:600">${rabData.proyek}</div>
        </div>
        <div style="text-align:right">
          <div>Instansi: <strong>${rabData.instansi}</strong></div>
          <div style="color:#64748b">Tanggal: ${rabData.tanggal}</div>
        </div>
      </div>

      <table>
        <thead>
          <tr><th style="width:40px">No</th><th>Kategori</th><th>Deskripsi Kebutuhan</th><th style="width:80px">Volume</th><th style="width:110px;text-align:right">Harga Satuan</th><th style="width:120px;text-align:right">Total</th></tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>

      <div style="text-align:right;margin-top:16px;font-size:14px;font-weight:700;color:#1E2D4E">
        Total RAB: ${fmtRp(rabTotal)}
      </div>
    </body></html>`;
  }, [docType, invData, invGrandTotal, invBalanceDue, quoData, kwtData, bastData, mouData, rabData]);

  const handlePrint = () => {
    const w = window.open('', '_blank');
    if (w) {
      w.document.write(previewHTML);
      w.document.close();
      setTimeout(() => w.print(), 600);
    }
  };

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', paddingBottom: '40px' }}>
      {/* Type Switcher Tabs */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <div style={{ fontSize: '11px', fontFamily: 'DM Mono', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            🛠️ Generator Dokumen Resmi Pratani & Kolektiva
          </div>
          <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text)' }}>
            Buat Dokumen & Ekspor PDF
          </div>
        </div>

        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          <button
            className={`filter-btn ${docType === 'gen_invoice' ? 'active' : ''}`}
            onClick={() => setDocType('gen_invoice')}
          >
            🧾 Invoice
          </button>
          <button
            className={`filter-btn ${docType === 'gen_penawaran' ? 'active' : ''}`}
            onClick={() => setDocType('gen_penawaran')}
          >
            📋 Surat Penawaran
          </button>
          <button
            className={`filter-btn ${docType === 'gen_rab' ? 'active' : ''}`}
            onClick={() => setDocType('gen_rab')}
          >
            📊 RAB
          </button>
          <button
            className={`filter-btn ${docType === 'gen_mou' ? 'active' : ''}`}
            onClick={() => setDocType('gen_mou')}
          >
            🤝 MoU
          </button>
          <button
            className={`filter-btn ${docType === 'gen_bast' ? 'active' : ''}`}
            onClick={() => setDocType('gen_bast')}
          >
            ✅ BAST
          </button>
          <button
            className={`filter-btn ${docType === 'gen_kwitansi' ? 'active' : ''}`}
            onClick={() => setDocType('gen_kwitansi')}
          >
            🧾 Kwitansi
          </button>
        </div>
      </div>

      {/* Main 2-Column Layout: Form on Left, Live Preview on Right */}
      <div className="inv-layout">
        {/* LEFT COLUMN: FORM */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Quick Pull from Kontak */}
          {kontakList && kontakList.length > 0 && (
            <div style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: '10px', padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '11px', color: 'var(--muted)' }}>👥 Auto-pull Data Client dari Kontak:</span>
              <select
                className="form-select"
                style={{ fontSize: '11px', padding: '4px 8px', maxWidth: '240px' }}
                onChange={(e) => {
                  const k = kontakList.find((x) => String(x.id) === e.target.value);
                  if (k) handleSelectKontak(k);
                }}
                defaultValue=""
              >
                <option value="" disabled>Pilih kontak...</option>
                {kontakList.map((k) => (
                  <option key={k.id} value={k.id}>{k.nama} ({k.peran || 'Umum'})</option>
                ))}
              </select>
            </div>
          )}

          {/* Form Content by Doc Type */}
          {docType === 'gen_invoice' && (
            <>
              <div className="inv-form-card">
                <div className="inv-form-title">📋 Data Tagihan Client</div>
                <div className="form-row">
                  <div className="form-group" style={{ flex: 2 }}>
                    <div className="form-label">To (Client / Organisasi) *</div>
                    <input
                      className="form-input"
                      value={invData.to}
                      onChange={(e) => setInvData({ ...invData, to: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <div className="form-label">Customer ID</div>
                    <input
                      className="form-input"
                      value={invData.custId}
                      onChange={(e) => setInvData({ ...invData, custId: e.target.value })}
                    />
                  </div>
                </div>
                <div className="form-group">
                  <div className="form-label">Alamat Client</div>
                  <textarea
                    className="form-textarea"
                    rows={2}
                    value={invData.toAddr}
                    onChange={(e) => setInvData({ ...invData, toAddr: e.target.value })}
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <div className="form-label">Nomor Invoice</div>
                    <input
                      className="form-input"
                      value={invData.invNo}
                      onChange={(e) => setInvData({ ...invData, invNo: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <div className="form-label">Tanggal</div>
                    <input
                      className="form-input"
                      value={invData.date}
                      onChange={(e) => setInvData({ ...invData, date: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="inv-form-card">
                <div className="inv-form-title">👤 Informasi Pengirim & Ketentuan</div>
                <div className="form-row">
                  <div className="form-group">
                    <div className="form-label">Nama Pengirim</div>
                    <input
                      className="form-input"
                      value={invData.pengirim}
                      onChange={(e) => setInvData({ ...invData, pengirim: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <div className="form-label">Jabatan</div>
                    <input
                      className="form-input"
                      value={invData.jabatan}
                      onChange={(e) => setInvData({ ...invData, jabatan: e.target.value })}
                    />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <div className="form-label">Ketentuan</div>
                    <input
                      className="form-input"
                      value={invData.ketentuan}
                      onChange={(e) => setInvData({ ...invData, ketentuan: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <div className="form-label">Jatuh Tempo</div>
                    <input
                      className="form-input"
                      value={invData.tempo}
                      onChange={(e) => setInvData({ ...invData, tempo: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="inv-form-card">
                <div className="inv-form-title">📦 Item Produk & Jasa</div>
                <div style={{ overflowX: 'auto' }}>
                  <table className="inv-items-table">
                    <thead>
                      <tr>
                        <th style={{ width: '60px' }}>Jumlah</th>
                        <th>Produk</th>
                        <th style={{ width: '120px', textAlign: 'right' }}>Harga (Rp)</th>
                        <th style={{ width: '120px', textAlign: 'right' }}>Total</th>
                        <th style={{ width: '24px' }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {invData.items.map((it, idx) => (
                        <tr key={idx}>
                          <td>
                            <input
                              className="form-input"
                              type="number"
                              style={{ width: '60px', padding: '4px' }}
                              value={it.qty}
                              onChange={(e) => {
                                const updated = [...invData.items];
                                updated[idx].qty = Number(e.target.value) || 0;
                                setInvData({ ...invData, items: updated });
                              }}
                            />
                          </td>
                          <td>
                            <input
                              className="form-input"
                              style={{ padding: '4px' }}
                              value={it.produk}
                              onChange={(e) => {
                                const updated = [...invData.items];
                                updated[idx].produk = e.target.value;
                                setInvData({ ...invData, items: updated });
                              }}
                            />
                          </td>
                          <td>
                            <input
                              className="form-input"
                              type="number"
                              style={{ textAlign: 'right', padding: '4px' }}
                              value={it.harga}
                              onChange={(e) => {
                                const updated = [...invData.items];
                                updated[idx].harga = Number(e.target.value) || 0;
                                setInvData({ ...invData, items: updated });
                              }}
                            />
                          </td>
                          <td style={{ textAlign: 'right', fontFamily: 'DM Mono', fontSize: '12px' }}>
                            {fmtRp(it.qty * it.harga)}
                          </td>
                          <td>
                            <button
                              className="btn btn-danger btn-sm"
                              style={{ padding: '2px 5px', fontSize: '10px' }}
                              onClick={() => {
                                setInvData({
                                  ...invData,
                                  items: invData.items.filter((_, i) => i !== idx)
                                });
                              }}
                            >
                              ✕
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <button
                  className="hpp-field-add"
                  style={{ marginTop: '6px' }}
                  onClick={() => {
                    setInvData({
                      ...invData,
                      items: [...invData.items, { qty: 1, produk: '', harga: 0 }]
                    });
                  }}
                >
                  + Tambah Item
                </button>
              </div>

              <div className="inv-form-card">
                <div className="inv-form-title">💰 Status Pembayaran</div>
                <div className="form-row">
                  <div className="form-group">
                    <div className="form-label">Amount Paid / DP (Rp)</div>
                    <input
                      className="form-input"
                      type="number"
                      value={invData.paid}
                      onChange={(e) => setInvData({ ...invData, paid: Number(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="form-group">
                    <div className="form-label">Grand Total</div>
                    <div style={{ fontSize: '16px', fontWeight: 700, fontFamily: 'DM Mono', color: '#4cc9a0', paddingTop: '6px' }}>
                      {fmtRp(invGrandTotal)}
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {docType === 'gen_penawaran' && (
            <div className="inv-form-card">
              <div className="inv-form-title">📋 Data Surat Penawaran</div>
              <div className="form-row">
                <div className="form-group">
                  <div className="form-label">Nomor Surat</div>
                  <input
                    className="form-input"
                    value={quoData.nomor}
                    onChange={(e) => setQuoData({ ...quoData, nomor: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <div className="form-label">Tanggal</div>
                  <input
                    className="form-input"
                    value={quoData.tanggal}
                    onChange={(e) => setQuoData({ ...quoData, tanggal: e.target.value })}
                  />
                </div>
              </div>
              <div className="form-group">
                <div className="form-label">Nama Acara / Organisasi Calon Klien</div>
                <input
                  className="form-input"
                  value={quoData.namaAcara}
                  onChange={(e) => setQuoData({ ...quoData, namaAcara: e.target.value })}
                />
              </div>
              <div className="form-group">
                <div className="form-label">Paragraf Pembuka</div>
                <textarea
                  className="form-textarea"
                  rows={3}
                  value={quoData.bodyText}
                  onChange={(e) => setQuoData({ ...quoData, bodyText: e.target.value })}
                />
              </div>
            </div>
          )}

          {docType === 'gen_kwitansi' && (
            <div className="inv-form-card">
              <div className="inv-form-title">🧾 Header & Penerima Kwitansi</div>
              <div className="form-row">
                <div className="form-group">
                  <div className="form-label">Nomor Kwitansi</div>
                  <input
                    className="form-input"
                    value={kwtData.nomor}
                    onChange={(e) => setKwtData({ ...kwtData, nomor: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <div className="form-label">Tanggal</div>
                  <input
                    className="form-input"
                    value={kwtData.tanggal}
                    onChange={(e) => setKwtData({ ...kwtData, tanggal: e.target.value })}
                  />
                </div>
              </div>
              <div className="form-group">
                <div className="form-label">Nama Pembayar / Penerima Kwitansi</div>
                <input
                  className="form-input"
                  value={kwtData.namaPenerima}
                  onChange={(e) => setKwtData({ ...kwtData, namaPenerima: e.target.value })}
                />
              </div>
              <div className="form-group">
                <div className="form-label">Untuk Keperluan</div>
                <input
                  className="form-input"
                  value={kwtData.untukPembayaran}
                  onChange={(e) => setKwtData({ ...kwtData, untukPembayaran: e.target.value })}
                />
              </div>
            </div>
          )}

          {docType === 'gen_mou' && (
            <div className="inv-form-card">
              <div className="inv-form-title">🤝 Parameter Perjanjian (MoU)</div>
              <div className="form-row">
                <div className="form-group">
                  <div className="form-label">Nomor Perjanjian</div>
                  <input
                    className="form-input"
                    value={mouData.nomor}
                    onChange={(e) => setMouData({ ...mouData, nomor: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <div className="form-label">Judul Proyek / Order</div>
                  <input
                    className="form-input"
                    value={mouData.judulProduk}
                    onChange={(e) => setMouData({ ...mouData, judulProduk: e.target.value })}
                  />
                </div>
              </div>
              <div className="form-group">
                <div className="form-label">Nama PIC Pihak Kedua</div>
                <input
                  className="form-input"
                  value={mouData.namaP2}
                  onChange={(e) => setMouData({ ...mouData, namaP2: e.target.value })}
                />
              </div>
            </div>
          )}

          {docType === 'gen_bast' && (
            <div className="inv-form-card">
              <div className="inv-form-title">✅ Parameter BAST</div>
              <div className="form-row">
                <div className="form-group">
                  <div className="form-label">No. Order / SPK</div>
                  <input
                    className="form-input"
                    value={bastData.noOrder}
                    onChange={(e) => setBastData({ ...bastData, noOrder: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <div className="form-label">Tanggal Serah Terima</div>
                  <input
                    className="form-input"
                    value={bastData.tglST}
                    onChange={(e) => setBastData({ ...bastData, tglST: e.target.value })}
                  />
                </div>
              </div>
              <div className="form-group">
                <div className="form-label">Nama PIC Pihak Kedua (Penerima)</div>
                <input
                  className="form-input"
                  value={bastData.pihak2Nama}
                  onChange={(e) => setBastData({ ...bastData, pihak2Nama: e.target.value })}
                />
              </div>
            </div>
          )}

          {docType === 'gen_rab' && (
            <div className="inv-form-card">
              <div className="inv-form-title">📊 Rincian Anggaran Biaya (RAB)</div>
              <div className="form-group">
                <div className="form-label">Nama Proyek / Pengadaan</div>
                <input
                  className="form-input"
                  value={rabData.proyek}
                  onChange={(e) => setRabData({ ...rabData, proyek: e.target.value })}
                />
              </div>
              <div className="form-group">
                <div className="form-label">Nama Instansi / Klien</div>
                <input
                  className="form-input"
                  value={rabData.instansi}
                  onChange={(e) => setRabData({ ...rabData, instansi: e.target.value })}
                />
              </div>
            </div>
          )}

          {/* Action Button: Print & Download PDF */}
          <button
            className="btn btn-primary"
            style={{ width: '100%', padding: '12px', fontSize: '13px', fontWeight: 600 }}
            onClick={handlePrint}
          >
            🖨️ Cetak / Download PDF Resmi
          </button>
        </div>

        {/* RIGHT COLUMN: LIVE IFRAME PREVIEW */}
        <div className="inv-preview-wrap">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <div style={{ fontSize: '11px', fontFamily: 'DM Mono', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--muted)' }}>
              Live Document Preview (A4)
            </div>
            <button className="btn btn-ghost btn-sm" style={{ fontSize: '11px' }} onClick={handlePrint}>
              ⬇️ Download PDF
            </button>
          </div>

          <div style={{ border: '1px solid var(--border)', borderRadius: '10px', overflow: 'hidden', background: '#fff', boxShadow: '0 4px 16px rgba(0,0,0,0.1)' }}>
            <iframe
              srcDoc={previewHTML}
              style={{ width: '100%', height: '700px', border: 'none', background: '#fff' }}
              title="Document Preview"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
