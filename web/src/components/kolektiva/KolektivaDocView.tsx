import React, { useState } from 'react';
import type { KolektivaProject, KolektivaOrderItem, KolektivaDocType } from '../../types';
import { 
  Printer, 
  Plus, 
  Trash2, 
  Layers, 
  RefreshCw 
} from 'lucide-react';

const sampleProject: KolektivaProject = {
  id: 'kol-2026-001',
  nomorSurat: '014/MKT.SPK/X/2026',
  tanggalSurat: '2026-10-01',
  deadline: '2026-10-15',
  klienNama: 'HMP PGSD Universitas Pendidikan Indonesia',
  klienInstansi: 'Fakultas Ilmu Pendidikan - UPI',
  klienPic: 'M. Rizky Ramadhan',
  klienJabatan: 'Ketua Pelaksana Seminar Nasional 2026',
  klienTelp: '0812-3456-7890',
  klienAlamat: 'Kampus Bumi Siliwangi, Jl. Dr. Setiabudhi No. 229, Bandung, Jawa Barat',
  klienEmail: 'hmppgsd.upi@gmail.com',
  items: [
    {
      id: 'item-1',
      nama: 'Kaos Panitia Custom Cotton Combed 24s',
      spesifikasi: 'Kain Cotton Combed 24s Reaktif (Warna Hitam Reaktif), Sablon Plastisol High Density 3 Warna Depan & Belakang',
      qty: 120,
      hargaSatuan: 65000,
      catatan: 'Size S: 20, M: 40, L: 40, XL: 20'
    },
    {
      id: 'item-2',
      nama: 'Lanyard Custom + ID Card Holder',
      spesifikasi: 'Lanyard Tissue 2cm Printing Full Color 2 Sisi + Stopper & Hook Besi + ID Card PVC 0.76mm Tebal',
      qty: 120,
      hargaSatuan: 15000,
      catatan: 'Termasuk tali dan plastik mika dove'
    },
    {
      id: 'item-3',
      nama: 'Tote Bag Seminar Blacu Premium',
      spesifikasi: 'Bahan Blacu Super Tebal 30x40cm, Sablon Rubber 2 Warna 1 Sisi, Jahitan Rapi Bartack',
      qty: 120,
      hargaSatuan: 18000,
      catatan: 'Paket seminar kit peserta'
    }
  ],
  dpPersen: 50,
  dpNominal: 5880000,
  statusPembayaran: 'dp_terbayar',
  metodePembayaran: 'Transfer Bank BCA',
  rekeningBank: 'BCA 123-456-7890 a.n Ananda Mario Fani Pratama',
  catatanKhusus: 'Garansi retur produksi 100% apabila terdapat cacat jahitan atau sablon luntur.',
  createdAt: '2026-10-01'
};

const vendorInfo = {
  brand: 'Kolektiva',
  legal: 'PT Pratani Kreatif Group',
  tagline: 'Konveksi & Merchandise Partner Komunitas',
  alamat: 'Jl. Pesantren No. 29, Ketanggungan, Brebes, Jawa Tengah 52263',
  alamatBranch: 'Jl. Gedong Jimat No. 03, Ketanggungan, Brebes 52263',
  telp: '+62 851-7210-7815',
  email: 'by.kolektiva@gmail.com',
  instagram: '@by.kolektiva',
  web: 'kolektiva.carrd.co',
  pic: 'Ananda Mario Fani Pratama',
  jabatanPic: 'Operational Director / Founder'
};

function formatRupiah(num: number): string {
  return 'Rp ' + Number(num || 0).toLocaleString('id-ID');
}

function terbilang(angka: number): string {
  const bilangan = [
    '', 'Satu', 'Dua', 'Tiga', 'Empat', 'Lima', 'Enam', 'Tujuh', 'Delapan', 'Sembilan', 'Sepuluh', 'Sebelas'
  ];
  const n = Math.floor(angka);
  if (n < 12) return bilangan[n];
  if (n < 20) return terbilang(n - 10) + ' Belas';
  if (n < 100) return terbilang(Math.floor(n / 10)) + ' Puluh ' + terbilang(n % 10);
  if (n < 200) return 'Seratus ' + terbilang(n - 100);
  if (n < 1000) return terbilang(Math.floor(n / 100)) + ' Ratus ' + terbilang(n % 100);
  if (n < 2000) return 'Seribu ' + terbilang(n - 1000);
  if (n < 1000000) return terbilang(Math.floor(n / 1000)) + ' Ribu ' + terbilang(n % 1000);
  if (n < 1000000000) return terbilang(Math.floor(n / 1000000)) + ' Juta ' + terbilang(n % 1000000);
  return terbilang(Math.floor(n / 1000000000)) + ' Miliar ' + terbilang(n % 1000000000);
}

export const KolektivaDocView: React.FC = () => {
  const [project, setProject] = useState<KolektivaProject>(sampleProject);
  const [activeDoc, setActiveDoc] = useState<KolektivaDocType>('rab');

  // Kalkulasi total
  const totalBiaya = project.items.reduce((sum, item) => sum + (item.qty * item.hargaSatuan), 0);
  const sisaPelunasan = Math.max(0, totalBiaya - project.dpNominal);

  const handleUpdateItem = (index: number, field: keyof KolektivaOrderItem, val: unknown) => {
    const updated = [...project.items];
    updated[index] = { ...updated[index], [field]: val };
    setProject({ ...project, items: updated });
  };

  const handleAddItem = () => {
    const newItem: KolektivaOrderItem = {
      id: 'item-' + Date.now(),
      nama: 'Item Baru',
      spesifikasi: 'Spesifikasi bahan & finishing',
      qty: 50,
      hargaSatuan: 50000
    };
    setProject({ ...project, items: [...project.items, newItem] });
  };

  const handleDeleteItem = (index: number) => {
    const updated = project.items.filter((_, i) => i !== index);
    setProject({ ...project, items: updated });
  };

  const handlePrint = () => {
    window.print();
  };

  const docTabs: Array<{ id: KolektivaDocType; label: string; icon: string }> = [
    { id: 'rab', label: '1. RAB / Penawaran', icon: '📑' },
    { id: 'spk', label: '2. SPK / MoU', icon: '📜' },
    { id: 'approval', label: '3. Design Approval', icon: '🎨' },
    { id: 'surat_jalan', label: '4. Surat Jalan', icon: '🚚' },
    { id: 'bast', label: '5. BAST Serah Terima', icon: '🤝' },
    { id: 'invoice', label: '6. Invoice Resmi', icon: '🧾' },
    { id: 'kwitansi', label: '7. Kwitansi Lunas/DP', icon: '💵' },
  ];

  return (
    <div className="space-y-6">
      {/* Header bar (Non-print) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/90 border border-slate-800 p-5 rounded-2xl print:hidden">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Kolektiva Engine
            </span>
            <span className="text-xs text-slate-400 font-mono">0-Drama LPJ Guarantee</span>
          </div>
          <h2 className="text-xl font-bold text-white mt-1">Generator 7 Dokumen Formal Vendor</h2>
          <p className="text-xs text-slate-400">
            Satu klik render dokumen legal standar universitas & organisasi: RAB, SPK, Desain, Surat Jalan, BAST, Invoice, Kwitansi.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setProject(sampleProject)}
            className="px-3 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition flex items-center gap-1.5"
            title="Reset ke contoh order HMP PGSD UPI"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Muat Contoh Order
          </button>
          <button
            onClick={handlePrint}
            className="px-4 py-2 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-xl transition flex items-center gap-2 shadow-lg shadow-emerald-500/20"
          >
            <Printer className="w-4 h-4" />
            Cetak / Simpan PDF
          </button>
        </div>
      </div>

      {/* Tabs Selector Dokumen (Non-print) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 print:hidden scrollbar-thin">
        {docTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveDoc(tab.id)}
            className={`px-3.5 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition flex items-center gap-2 border ${
              activeDoc === tab.id
                ? 'bg-slate-800 text-emerald-400 border-emerald-500/40 shadow-sm'
                : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border-slate-800/80 hover:bg-slate-850'
            }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Grid: Editor Panel (Left) & Document Paper Preview (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Editor Form Controls (Non-print, 4 cols) */}
        <div className="lg:col-span-4 bg-slate-900/80 border border-slate-800 p-5 rounded-2xl space-y-5 print:hidden">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-400" />
              Parameter Order
            </h3>
            <span className="text-[11px] font-mono text-emerald-400">
              {project.items.length} Barang
            </span>
          </div>

          {/* Metadata Order */}
          <div className="space-y-3 text-xs">
            <div>
              <label className="text-slate-400 block mb-1">Nomor Surat / SPK</label>
              <input
                type="text"
                value={project.nomorSurat}
                onChange={(e) => setProject({ ...project, nomorSurat: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-white font-mono"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-slate-400 block mb-1">Tanggal Surat</label>
                <input
                  type="date"
                  value={project.tanggalSurat}
                  onChange={(e) => setProject({ ...project, tanggalSurat: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Deadline / BAST</label>
                <input
                  type="date"
                  value={project.deadline}
                  onChange={(e) => setProject({ ...project, deadline: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white"
                />
              </div>
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Nama Organisasi / Klien</label>
              <input
                type="text"
                value={project.klienNama}
                onChange={(e) => setProject({ ...project, klienNama: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-slate-400 block mb-1">Nama PIC Klien</label>
                <input
                  type="text"
                  value={project.klienPic}
                  onChange={(e) => setProject({ ...project, klienPic: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-white"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Jabatan PIC</label>
                <input
                  type="text"
                  value={project.klienJabatan}
                  onChange={(e) => setProject({ ...project, klienJabatan: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-white"
                />
              </div>
            </div>

            <div>
              <label className="text-slate-400 block mb-1">No. Telp / WhatsApp</label>
              <input
                type="text"
                value={project.klienTelp}
                onChange={(e) => setProject({ ...project, klienTelp: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-white"
              />
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Alamat Klien</label>
              <textarea
                rows={2}
                value={project.klienAlamat}
                onChange={(e) => setProject({ ...project, klienAlamat: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-white"
              />
            </div>
          </div>

          {/* Rincian Barang Form */}
          <div className="space-y-3 pt-3 border-t border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300">Rincian Barang</span>
              <button
                onClick={handleAddItem}
                className="text-[11px] text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Tambah Item
              </button>
            </div>

            <div className="space-y-3 max-h-[280px] overflow-y-auto pr-1">
              {project.items.map((item, idx) => (
                <div key={item.id || idx} className="p-3 bg-slate-950/80 border border-slate-800/80 rounded-xl space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-200">Item #{idx + 1}</span>
                    <button
                      onClick={() => handleDeleteItem(idx)}
                      className="text-red-400 hover:text-red-300 p-1"
                      title="Hapus item"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <input
                    type="text"
                    placeholder="Nama Barang"
                    value={item.nama}
                    onChange={(e) => handleUpdateItem(idx, 'nama', e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1 text-white"
                  />
                  <textarea
                    rows={2}
                    placeholder="Spesifikasi & Bahan"
                    value={item.spesifikasi}
                    onChange={(e) => handleUpdateItem(idx, 'spesifikasi', e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1 text-white text-[11px]"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-[10px] text-slate-400">Qty (pcs)</span>
                      <input
                        type="number"
                        value={item.qty}
                        onChange={(e) => handleUpdateItem(idx, 'qty', Number(e.target.value))}
                        className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-white"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400">Harga Satuan (Rp)</span>
                      <input
                        type="number"
                        value={item.hargaSatuan}
                        onChange={(e) => handleUpdateItem(idx, 'hargaSatuan', Number(e.target.value))}
                        className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-white"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pembayaran Form */}
          <div className="space-y-3 pt-3 border-t border-slate-800 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Total Nilai Order:</span>
              <span className="font-bold text-white font-mono">{formatRupiah(totalBiaya)}</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-slate-400 block mb-1">DP Dibayarkan (Rp)</label>
                <input
                  type="number"
                  value={project.dpNominal}
                  onChange={(e) => setProject({ ...project, dpNominal: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white font-mono"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Status Bayar</label>
                <select
                  value={project.statusPembayaran}
                  onChange={(e) => setProject({ ...project, statusPembayaran: e.target.value as any })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-white"
                >
                  <option value="belum_bayar">Belum Bayar</option>
                  <option value="dp_terbayar">DP Terbayar</option>
                  <option value="lunas">Lunas (100%)</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Paper Document Preview (Right, 8 cols on screen, 100% on print) */}
        <div className="lg:col-span-8 bg-white text-slate-900 rounded-2xl shadow-2xl p-8 md:p-12 border border-slate-300 min-h-[900px] print:p-0 print:border-none print:shadow-none print:w-full print:m-0">
          
          {/* KOP SURAT FORMAL KOLEKTIVA */}
          <div className="border-b-2 border-slate-900 pb-4 mb-6 flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-black tracking-wider uppercase text-slate-900">KOLEKTIVA</h1>
              <p className="text-[11px] font-semibold tracking-wide text-slate-600 uppercase">
                {vendorInfo.legal} · {vendorInfo.tagline}
              </p>
              <p className="text-[10px] text-slate-500 mt-1 max-w-md">
                {vendorInfo.alamat}
              </p>
            </div>
            <div className="text-right text-[10px] text-slate-600 space-y-0.5">
              <p className="font-semibold text-slate-900">{vendorInfo.telp}</p>
              <p>{vendorInfo.email}</p>
              <p className="font-mono text-emerald-700">{vendorInfo.instagram} | {vendorInfo.web}</p>
            </div>
          </div>

          {/* DOKUMEN 1: RAB / PENAWARAN */}
          {activeDoc === 'rab' && (
            <div className="space-y-6">
              <div className="text-center space-y-1">
                <h2 className="text-lg font-bold uppercase tracking-wide text-slate-900 underline decoration-slate-400 underline-offset-4">
                  RENCANA ANGGARAN BIAYA (RAB) & PENAWARAN
                </h2>
                <p className="text-xs text-slate-600 font-mono">Nomor: {project.nomorSurat}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-lg border border-slate-200">
                <div>
                  <p className="text-slate-500">Klien / Lembaga:</p>
                  <p className="font-bold text-slate-900">{project.klienNama}</p>
                  <p className="text-slate-600">{project.klienInstansi}</p>
                  <p className="text-slate-600">{project.klienAlamat}</p>
                </div>
                <div className="text-right space-y-1">
                  <p className="text-slate-500">Tanggal Penawaran: <span className="font-bold text-slate-900">{project.tanggalSurat}</span></p>
                  <p className="text-slate-500">Target Serah Terima: <span className="font-bold text-slate-900">{project.deadline}</span></p>
                  <p className="text-slate-500">PIC Klien: <span className="font-bold text-slate-900">{project.klienPic}</span> ({project.klienTelp})</p>
                </div>
              </div>

              {/* Tabel RAB */}
              <table className="w-full text-xs border-collapse border border-slate-300">
                <thead>
                  <tr className="bg-slate-100 text-slate-800">
                    <th className="border border-slate-300 px-3 py-2 text-center w-10">No</th>
                    <th className="border border-slate-300 px-3 py-2 text-left">Deskripsi Produk & Spesifikasi</th>
                    <th className="border border-slate-300 px-3 py-2 text-center w-16">Qty</th>
                    <th className="border border-slate-300 px-3 py-2 text-right w-28">Harga Satuan</th>
                    <th className="border border-slate-300 px-3 py-2 text-right w-32">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {project.items.map((it, idx) => (
                    <tr key={it.id || idx}>
                      <td className="border border-slate-300 px-3 py-2.5 text-center font-mono">{idx + 1}</td>
                      <td className="border border-slate-300 px-3 py-2.5">
                        <div className="font-bold text-slate-900">{it.nama}</div>
                        <div className="text-slate-600 text-[11px] mt-0.5">{it.spesifikasi}</div>
                        {it.catatan && <div className="text-[10px] text-emerald-700 italic mt-0.5">{it.catatan}</div>}
                      </td>
                      <td className="border border-slate-300 px-3 py-2.5 text-center font-mono">{it.qty} pcs</td>
                      <td className="border border-slate-300 px-3 py-2.5 text-right font-mono">{formatRupiah(it.hargaSatuan)}</td>
                      <td className="border border-slate-300 px-3 py-2.5 text-right font-mono font-bold">{formatRupiah(it.qty * it.hargaSatuan)}</td>
                    </tr>
                  ))}
                  <tr className="bg-slate-50 font-bold">
                    <td colSpan={4} className="border border-slate-300 px-3 py-2.5 text-right uppercase">Total Anggaran</td>
                    <td className="border border-slate-300 px-3 py-2.5 text-right font-mono text-emerald-800">{formatRupiah(totalBiaya)}</td>
                  </tr>
                </tbody>
              </table>

              <div className="text-xs space-y-2 bg-slate-50 p-4 rounded-lg border border-slate-200">
                <p className="font-bold text-slate-900">Ketentuan Pembayaran & Order:</p>
                <ol className="list-decimal list-inside text-slate-700 space-y-1 text-[11px]">
                  <li>Pembayaran Uang Muka (DP) minimal 50% sebesar <strong>{formatRupiah(project.dpNominal)}</strong> saat SPK ditandatangani.</li>
                  <li>Pelunasan sebesar <strong>{formatRupiah(sisaPelunasan)}</strong> dibayarkan saat barang selesai dan siap diserahterimakan.</li>
                  <li>Pembayaran melalui transfer rekening: <strong>{project.rekeningBank}</strong>.</li>
                  <li>Waktu produksi terhitung sejak konfirmasi pembayaran DP dan persetujuan final lembar desain.</li>
                </ol>
              </div>

              {/* Tanda Tangan */}
              <div className="grid grid-cols-2 gap-8 pt-6 text-xs text-center">
                <div>
                  <p className="text-slate-500 mb-16">Disetujui Oleh (Klien),</p>
                  <p className="font-bold text-slate-900 underline">{project.klienPic}</p>
                  <p className="text-slate-600 text-[11px]">{project.klienJabatan}</p>
                </div>
                <div>
                  <p className="text-slate-500 mb-16">Hormat Kami (Vendor),</p>
                  <p className="font-bold text-slate-900 underline">{vendorInfo.pic}</p>
                  <p className="text-slate-600 text-[11px]">{vendorInfo.legal}</p>
                </div>
              </div>
            </div>
          )}

          {/* DOKUMEN 2: SPK / MOU KERJASAMA */}
          {activeDoc === 'spk' && (
            <div className="space-y-5 text-xs text-slate-800 leading-relaxed">
              <div className="text-center space-y-1">
                <h2 className="text-lg font-bold uppercase tracking-wide text-slate-900 underline decoration-slate-400 underline-offset-4">
                  SURAT PERNYATAAN KERJASAMA (SPK)
                </h2>
                <p className="text-xs text-slate-600 font-mono">Nomor: {project.nomorSurat}</p>
              </div>

              <p>
                Pada hari ini, tanggal <strong>{project.tanggalSurat}</strong>, dibuat dan disepakati perjanjian kerjasama pengadaan pakaian/merchandise antara pihak-pihak di bawah ini:
              </p>

              <div className="pl-4 space-y-2 border-l-2 border-slate-300">
                <p><strong>1. Pihak Pertama (Penyedia / Vendor):</strong></p>
                <p className="text-[11px]">
                  Nama Brand: <strong>{vendorInfo.brand} ({vendorInfo.legal})</strong><br />
                  Alamat: {vendorInfo.alamat}<br />
                  Penanggung Jawab: {vendorInfo.pic} ({vendorInfo.jabatanPic})
                </p>
                <p className="pt-2"><strong>2. Pihak Kedua (Pemesan / Klien):</strong></p>
                <p className="text-[11px]">
                  Nama Lembaga: <strong>{project.klienNama}</strong><br />
                  Alamat: {project.klienAlamat}<br />
                  Penanggung Jawab: {project.klienPic} ({project.klienJabatan})<br />
                  No. Kontak: {project.klienTelp}
                </p>
              </div>

              <div className="space-y-3 pt-2">
                <p className="font-bold text-slate-900">Pasal 1: Ruang Lingkup Pekerjaan</p>
                <p className="text-[11px]">
                  Pihak Pertama berkewajiban memproduksi dan menyediakan pesanan merchandise untuk Pihak Kedua berupa:
                  {project.items.map((it, idx) => (
                    <span key={idx} className="block pl-3 font-semibold text-slate-900">
                      • {it.nama} sebanyak {it.qty} pcs ({it.spesifikasi})
                    </span>
                  ))}
                </p>

                <p className="font-bold text-slate-900">Pasal 2: Nilai Kontrak dan Pembayaran</p>
                <p className="text-[11px]">
                  Total nilai pengadaan adalah <strong>{formatRupiah(totalBiaya)}</strong> ({terbilang(totalBiaya)} Rupiah).
                  Pihak Kedua membayarkan DP 50% sebesar <strong>{formatRupiah(project.dpNominal)}</strong> dan sisa pelunasan sebesar <strong>{formatRupiah(sisaPelunasan)}</strong> dibayarkan saat barang selesai diproduksi.
                </p>

                <p className="font-bold text-slate-900">Pasal 3: Waktu Pengerjaan & Jaminan Kualitas</p>
                <p className="text-[11px]">
                  Pihak Pertama menjamin proses produksi selesai maksimal pada <strong>{project.deadline}</strong>. Pihak Pertama memberikan garansi 100% perbaikan/ganti baru atas produk yang terbukti cacat jahitan, sablon rusak, atau tidak sesuai lembar persetujuan desain (Design Approval Sheet).
                </p>
              </div>

              {/* Tanda Tangan */}
              <div className="grid grid-cols-2 gap-8 pt-8 text-xs text-center">
                <div>
                  <p className="text-slate-500 mb-16">Pihak Kedua (Pemesan),</p>
                  <p className="font-bold text-slate-900 underline">{project.klienPic}</p>
                  <p className="text-slate-600 text-[11px]">{project.klienNama}</p>
                </div>
                <div>
                  <p className="text-slate-500 mb-16">Pihak Pertama (Vendor),</p>
                  <p className="font-bold text-slate-900 underline">{vendorInfo.pic}</p>
                  <p className="text-slate-600 text-[11px]">{vendorInfo.legal}</p>
                </div>
              </div>
            </div>
          )}

          {/* DOKUMEN 3: DESIGN APPROVAL SHEET */}
          {activeDoc === 'approval' && (
            <div className="space-y-6">
              <div className="text-center space-y-1">
                <h2 className="text-lg font-bold uppercase tracking-wide text-slate-900 underline decoration-slate-400 underline-offset-4">
                  DESIGN & SPECIFICATION APPROVAL SHEET
                </h2>
                <p className="text-xs text-slate-600 font-mono">Ref: {project.nomorSurat} · Tanggal: {project.tanggalSurat}</p>
              </div>

              <div className="bg-amber-50 border border-amber-200 p-3 rounded text-xs text-amber-800">
                <strong>Catatan Penting:</strong> Lembar ini merupakan bukti persetujuan final spesifikasi warna kain, jenis sablon/bordir, dan ukuran. Proses produksi massal hanya dimulai setelah lembar ini diverifikasi.
              </div>

              <div className="border border-slate-300 rounded-lg p-4 space-y-4">
                <h3 className="font-bold text-xs text-slate-900 uppercase border-b pb-2">Spesifikasi Produksi</h3>
                {project.items.map((it, idx) => (
                  <div key={idx} className="text-xs space-y-1 pb-3 border-b last:border-b-0 border-slate-200">
                    <p className="font-bold text-slate-900">Produk #{idx + 1}: {it.nama} ({it.qty} pcs)</p>
                    <p className="text-slate-600 text-[11px]"><strong>Detail Teknis:</strong> {it.spesifikasi}</p>
                    {it.catatan && <p className="text-slate-600 text-[11px]"><strong>Size Breakdown:</strong> {it.catatan}</p>}
                    <div className="flex gap-4 pt-1 text-[11px]">
                      <span className="flex items-center gap-1 text-emerald-700">☑ Desain Telah Di-ACC</span>
                      <span className="flex items-center gap-1 text-emerald-700">☑ Pantone / Warna Kain Sesuai</span>
                      <span className="flex items-center gap-1 text-emerald-700">☑ Posisi Logo Sesuai Mockup</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Tanda Tangan ACC */}
              <div className="grid grid-cols-2 gap-8 pt-8 text-xs text-center">
                <div>
                  <p className="text-slate-500 mb-16">Disetujui Oleh (Klien / PIC),</p>
                  <p className="font-bold text-slate-900 underline">{project.klienPic}</p>
                  <p className="text-slate-600 text-[11px]">{project.klienNama}</p>
                </div>
                <div>
                  <p className="text-slate-500 mb-16">Tim Teknis Produksi,</p>
                  <p className="font-bold text-slate-900 underline">{vendorInfo.pic}</p>
                  <p className="text-slate-600 text-[11px]">{vendorInfo.brand} Production Lead</p>
                </div>
              </div>
            </div>
          )}

          {/* DOKUMEN 4: SURAT JALAN */}
          {activeDoc === 'surat_jalan' && (
            <div className="space-y-6">
              <div className="text-center space-y-1">
                <h2 className="text-lg font-bold uppercase tracking-wide text-slate-900 underline decoration-slate-400 underline-offset-4">
                  SURAT JALAN / PENGIRIMAN BARANG
                </h2>
                <p className="text-xs text-slate-600 font-mono">No. SJ: SJ/{project.nomorSurat}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-lg border border-slate-200">
                <div>
                  <p className="text-slate-500">Tujuan Pengiriman:</p>
                  <p className="font-bold text-slate-900">{project.klienNama}</p>
                  <p className="text-slate-600">{project.klienAlamat}</p>
                  <p className="text-slate-600">Penerima: {project.klienPic} ({project.klienTelp})</p>
                </div>
                <div className="text-right space-y-1">
                  <p className="text-slate-500">Tanggal Pengiriman: <span className="font-bold text-slate-900">{project.deadline}</span></p>
                  <p className="text-slate-500">Ekspedisi / Kurir: <span className="font-bold text-slate-900">Kurir Kolektiva / Cargo</span></p>
                  <p className="text-slate-500">Total Koli / Box: <span className="font-bold text-slate-900">3 Box Kardus Segel</span></p>
                </div>
              </div>

              <table className="w-full text-xs border-collapse border border-slate-300">
                <thead>
                  <tr className="bg-slate-100 text-slate-800">
                    <th className="border border-slate-300 px-3 py-2 text-center w-12">No</th>
                    <th className="border border-slate-300 px-3 py-2 text-left">Nama Barang yang Dikirim</th>
                    <th className="border border-slate-300 px-3 py-2 text-center w-24">Jumlah</th>
                    <th className="border border-slate-300 px-3 py-2 text-left">Kondisi Kemasan</th>
                  </tr>
                </thead>
                <tbody>
                  {project.items.map((it, idx) => (
                    <tr key={idx}>
                      <td className="border border-slate-300 px-3 py-2 text-center font-mono">{idx + 1}</td>
                      <td className="border border-slate-300 px-3 py-2">
                        <span className="font-bold text-slate-900">{it.nama}</span>
                        <div className="text-[11px] text-slate-500">{it.spesifikasi}</div>
                      </td>
                      <td className="border border-slate-300 px-3 py-2 text-center font-mono font-bold">{it.qty} pcs</td>
                      <td className="border border-slate-300 px-3 py-2 text-emerald-700">Baik, Baru & Tersegel</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="grid grid-cols-3 gap-4 pt-10 text-xs text-center">
                <div>
                  <p className="text-slate-500 mb-16">Pengirim (Kolektiva),</p>
                  <p className="font-bold text-slate-900 underline">{vendorInfo.pic}</p>
                </div>
                <div>
                  <p className="text-slate-500 mb-16">Sopir / Kurir Ekspedisi,</p>
                  <p className="font-bold text-slate-900 underline">( .................................... )</p>
                </div>
                <div>
                  <p className="text-slate-500 mb-16">Diterima Oleh (Klien),</p>
                  <p className="font-bold text-slate-900 underline">{project.klienPic}</p>
                </div>
              </div>
            </div>
          )}

          {/* DOKUMEN 5: BAST (BERITA ACARA SERAH TERIMA) */}
          {activeDoc === 'bast' && (
            <div className="space-y-6 text-xs text-slate-800 leading-relaxed">
              <div className="text-center space-y-1">
                <h2 className="text-lg font-bold uppercase tracking-wide text-slate-900 underline decoration-slate-400 underline-offset-4">
                  BERITA ACARA SERAH TERIMA (BAST)
                </h2>
                <p className="text-xs text-slate-600 font-mono">Nomor: BAST/{project.nomorSurat}</p>
              </div>

              <p>
                Pada hari ini, tanggal <strong>{project.deadline}</strong>, kami yang bertanda tangan di bawah ini telah melaksanakan serah terima atas pekerjaan pengadaan barang merchandise sesuai kesepakatan:
              </p>

              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded border border-slate-200 text-xs">
                <div>
                  <p className="font-bold text-slate-900">Pihak Pertama (Penyedia):</p>
                  <p>{vendorInfo.brand} ({vendorInfo.legal})</p>
                  <p>PIC: {vendorInfo.pic}</p>
                </div>
                <div>
                  <p className="font-bold text-slate-900">Pihak Kedua (Pemesan):</p>
                  <p>{project.klienNama}</p>
                  <p>PIC: {project.klienPic} ({project.klienJabatan})</p>
                </div>
              </div>

              <p>Pihak Pertama telah menyerahkan kepada Pihak Kedua barang dengan rincian:</p>

              <table className="w-full text-xs border-collapse border border-slate-300">
                <thead>
                  <tr className="bg-slate-100">
                    <th className="border border-slate-300 px-3 py-2 text-center w-10">No</th>
                    <th className="border border-slate-300 px-3 py-2 text-left">Nama Barang</th>
                    <th className="border border-slate-300 px-3 py-2 text-center w-24">Jumlah</th>
                    <th className="border border-slate-300 px-3 py-2 text-left">Hasil Pemeriksaan</th>
                  </tr>
                </thead>
                <tbody>
                  {project.items.map((it, idx) => (
                    <tr key={idx}>
                      <td className="border border-slate-300 px-3 py-2 text-center font-mono">{idx + 1}</td>
                      <td className="border border-slate-300 px-3 py-2 font-medium">{it.nama}</td>
                      <td className="border border-slate-300 px-3 py-2 text-center font-mono font-bold">{it.qty} pcs</td>
                      <td className="border border-slate-300 px-3 py-2 text-emerald-700 font-semibold">100% Sesuai & Lengkap</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <p className="text-[11px] text-slate-600 italic">
                Dengan ditandatanganinya Berita Acara ini, maka Pihak Kedua menyatakan telah menerima seluruh barang dalam kondisi baik, jumlah yang sesuai, dan memenuhi standar spesifikasi. Berita Acara ini sah untuk lampiran Laporan Pertanggungjawaban (LPJ).
              </p>

              <div className="grid grid-cols-2 gap-8 pt-8 text-xs text-center">
                <div>
                  <p className="text-slate-500 mb-16">Pihak Kedua (Yang Menerima),</p>
                  <p className="font-bold text-slate-900 underline">{project.klienPic}</p>
                  <p className="text-slate-600 text-[11px]">{project.klienJabatan}</p>
                </div>
                <div>
                  <p className="text-slate-500 mb-16">Pihak Pertama (Yang Menyerahkan),</p>
                  <p className="font-bold text-slate-900 underline">{vendorInfo.pic}</p>
                  <p className="text-slate-600 text-[11px]">{vendorInfo.legal}</p>
                </div>
              </div>
            </div>
          )}

          {/* DOKUMEN 6: INVOICE RESMI */}
          {activeDoc === 'invoice' && (
            <div className="space-y-6">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">INVOICE</h2>
                  <p className="text-xs text-slate-600 font-mono mt-0.5">INV/{project.nomorSurat}</p>
                </div>
                <div className="text-right">
                  <span className={`px-3 py-1 rounded text-xs font-bold uppercase ${
                    project.statusPembayaran === 'lunas' 
                      ? 'bg-emerald-100 text-emerald-800' 
                      : 'bg-amber-100 text-amber-800'
                  }`}>
                    {project.statusPembayaran === 'lunas' ? 'LUNAS (PAID)' : 'TAGIHAN (PENDING)'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-lg border border-slate-200">
                <div>
                  <p className="text-slate-500 uppercase font-semibold text-[10px]">Ditagihkan Kepada:</p>
                  <p className="font-bold text-slate-900 mt-1">{project.klienNama}</p>
                  <p className="text-slate-600">{project.klienInstansi}</p>
                  <p className="text-slate-600">{project.klienAlamat}</p>
                  <p className="text-slate-600 mt-1">UP: {project.klienPic} ({project.klienTelp})</p>
                </div>
                <div className="text-right space-y-1">
                  <p className="text-slate-500">Tanggal Tagihan: <span className="font-bold text-slate-900">{project.tanggalSurat}</span></p>
                  <p className="text-slate-500">Jatuh Tempo: <span className="font-bold text-slate-900">{project.deadline}</span></p>
                </div>
              </div>

              <table className="w-full text-xs border-collapse border border-slate-300">
                <thead>
                  <tr className="bg-slate-100">
                    <th className="border border-slate-300 px-3 py-2 text-center w-10">No</th>
                    <th className="border border-slate-300 px-3 py-2 text-left">Uraian Pekerjaan / Item</th>
                    <th className="border border-slate-300 px-3 py-2 text-center w-16">Qty</th>
                    <th className="border border-slate-300 px-3 py-2 text-right w-28">Harga</th>
                    <th className="border border-slate-300 px-3 py-2 text-right w-32">Jumlah</th>
                  </tr>
                </thead>
                <tbody>
                  {project.items.map((it, idx) => (
                    <tr key={idx}>
                      <td className="border border-slate-300 px-3 py-2 text-center font-mono">{idx + 1}</td>
                      <td className="border border-slate-300 px-3 py-2">
                        <p className="font-bold text-slate-900">{it.nama}</p>
                        <p className="text-[11px] text-slate-500">{it.spesifikasi}</p>
                      </td>
                      <td className="border border-slate-300 px-3 py-2 text-center font-mono">{it.qty}</td>
                      <td className="border border-slate-300 px-3 py-2 text-right font-mono">{formatRupiah(it.hargaSatuan)}</td>
                      <td className="border border-slate-300 px-3 py-2 text-right font-mono font-bold">{formatRupiah(it.qty * it.hargaSatuan)}</td>
                    </tr>
                  ))}
                  <tr>
                    <td colSpan={4} className="border border-slate-300 px-3 py-2 text-right font-bold">Total Tagihan</td>
                    <td className="border border-slate-300 px-3 py-2 text-right font-mono font-bold text-slate-900">{formatRupiah(totalBiaya)}</td>
                  </tr>
                  <tr>
                    <td colSpan={4} className="border border-slate-300 px-3 py-2 text-right text-slate-600">DP Terbayar</td>
                    <td className="border border-slate-300 px-3 py-2 text-right font-mono text-emerald-700">−{formatRupiah(project.dpNominal)}</td>
                  </tr>
                  <tr className="bg-slate-100 font-bold">
                    <td colSpan={4} className="border border-slate-300 px-3 py-2 text-right uppercase">Sisa Tagihan Pelunasan</td>
                    <td className="border border-slate-300 px-3 py-2 text-right font-mono text-emerald-800 text-sm">{formatRupiah(sisaPelunasan)}</td>
                  </tr>
                </tbody>
              </table>

              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 text-xs space-y-1">
                <p className="font-bold text-slate-900">Rekening Pembayaran Resmi:</p>
                <p className="font-mono text-emerald-800 font-bold text-sm">{project.rekeningBank}</p>
                <p className="text-slate-500 text-[11px]">Konfirmasi bukti transfer ke WhatsApp: <strong>{vendorInfo.telp}</strong></p>
              </div>

              <div className="pt-6 text-right text-xs">
                <p className="text-slate-500 mb-16">Finance & Administration,</p>
                <p className="font-bold text-slate-900 underline">{vendorInfo.pic}</p>
                <p className="text-slate-600 text-[11px]">{vendorInfo.legal}</p>
              </div>
            </div>
          )}

          {/* DOKUMEN 7: KWITANSI PEMBAYARAN */}
          {activeDoc === 'kwitansi' && (
            <div className="space-y-6">
              <div className="flex justify-between items-start border-b pb-4">
                <div>
                  <h2 className="text-2xl font-black text-slate-900 tracking-wider">KWITANSI PEMBAYARAN</h2>
                  <p className="text-xs text-slate-600 font-mono mt-0.5">No. Kwitansi: KWT/{project.nomorSurat}</p>
                </div>
                <div className="text-right">
                  <div className="px-4 py-1.5 bg-emerald-600 text-white font-mono font-bold text-sm rounded shadow">
                    {formatRupiah(project.statusPembayaran === 'lunas' ? totalBiaya : project.dpNominal)}
                  </div>
                </div>
              </div>

              <div className="space-y-4 text-xs">
                <div className="grid grid-cols-12 gap-2 py-1.5 border-b border-slate-200">
                  <span className="col-span-3 text-slate-500 font-semibold">Telah Diterima Dari:</span>
                  <span className="col-span-9 font-bold text-slate-900">{project.klienNama} (an. {project.klienPic})</span>
                </div>

                <div className="grid grid-cols-12 gap-2 py-1.5 border-b border-slate-200">
                  <span className="col-span-3 text-slate-500 font-semibold">Sejumlah Uang:</span>
                  <span className="col-span-9 font-bold text-slate-900 italic bg-slate-50 p-2 rounded">
                    # {terbilang(project.statusPembayaran === 'lunas' ? totalBiaya : project.dpNominal)} Rupiah #
                  </span>
                </div>

                <div className="grid grid-cols-12 gap-2 py-1.5 border-b border-slate-200">
                  <span className="col-span-3 text-slate-500 font-semibold">Untuk Pembayaran:</span>
                  <span className="col-span-9 text-slate-800">
                    {project.statusPembayaran === 'lunas' ? 'Pelunasan 100%' : 'Uang Muka (DP 50%)'} atas pesanan pengadaan merchandise kegiatan {project.klienNama}, mencakup: {project.items.map(i => `${i.nama} (${i.qty} pcs)`).join(', ')}.
                  </span>
                </div>

                <div className="grid grid-cols-12 gap-2 py-1.5 border-b border-slate-200">
                  <span className="col-span-3 text-slate-500 font-semibold">Metode Pembayaran:</span>
                  <span className="col-span-9 font-mono text-emerald-800 font-semibold">
                    {project.metodePembayaran} ({project.rekeningBank})
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-8 pt-8 text-xs">
                <div className="border border-dashed border-slate-300 p-4 rounded text-center text-slate-400 flex flex-col items-center justify-center">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Materai / Cap Stempel</span>
                  <div className="w-20 h-14 border border-slate-200 my-2 rounded flex items-center justify-center text-[10px] text-slate-300">
                    MATERAI
                  </div>
                  <span className="text-[10px] text-slate-400">Lunas & Sah</span>
                </div>

                <div className="text-center">
                  <p className="text-slate-500 mb-16">Brebes, {project.tanggalSurat}</p>
                  <p className="font-bold text-slate-900 underline">{vendorInfo.pic}</p>
                  <p className="text-slate-600 text-[11px]">{vendorInfo.legal}</p>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
