import React, { useState } from 'react';
import { X, Plus } from 'lucide-react';
import type { BrandId, TransaksiItem } from '../../types';

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeBrand: BrandId;
  onSave: (transaksi: TransaksiItem, brand: BrandId) => Promise<void>;
}

export const AddTransactionModal: React.FC<AddTransactionModalProps> = ({
  isOpen,
  onClose,
  activeBrand: initialBrand,
  onSave
}) => {
  const today = new Date().toISOString().split('T')[0];

  const [tanggal, setTanggal] = useState(today);
  const [tipe, setTipe] = useState<'masuk' | 'keluar'>('masuk');
  const [brand, setBrand] = useState<BrandId>(initialBrand);
  const [nominal, setNominal] = useState<string>('');
  const [kategori, setKategori] = useState<string>('Penjualan Langsung');
  const [sumber, setSumber] = useState<string>('cash');
  const [deskripsi, setDeskripsi] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanNominal = parseFloat(nominal.replace(/[^0-9]/g, '')) || 0;
    if (cleanNominal <= 0) {
      alert('Masukkan nominal transaksi yang valid');
      return;
    }
    if (!deskripsi.trim()) {
      alert('Masukkan deskripsi transaksi');
      return;
    }

    setIsSubmitting(true);
    try {
      const newTrx: TransaksiItem = {
        id: Date.now(),
        tanggal,
        tipe,
        nominal: cleanNominal,
        kategori,
        sumber,
        deskripsi: deskripsi.trim(),
        _margin: tipe === 'masuk' ? cleanNominal : 0,
        _source: 'manual',
        created_at: new Date().toISOString()
      };

      await onSave(newTrx, brand);
      onClose();
      // Reset form
      setNominal('');
      setDeskripsi('');
    } catch (err) {
      console.error(err);
      alert('Gagal menyimpan transaksi');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNominalChange = (val: string) => {
    const raw = val.replace(/[^0-9]/g, '');
    if (!raw) {
      setNominal('');
      return;
    }
    const num = parseInt(raw, 10);
    setNominal('Rp ' + num.toLocaleString('id-ID'));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg glass-card rounded-2xl border border-white/10 p-6 shadow-2xl relative">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center font-bold">
              <Plus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">Catat Transaksi Baru</h3>
              <p className="text-[11px] text-slate-400">Tambahkan pencatatan kas masuk atau keluar</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Tipe Transaksi (Masuk / Keluar) */}
          <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-[#0a0e17] border border-white/5">
            <button
              type="button"
              onClick={() => {
                setTipe('masuk');
                setKategori('Penjualan Langsung');
              }}
              className={`py-2 rounded-lg font-bold text-xs transition-all ${
                tipe === 'masuk'
                  ? 'bg-emerald-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              + Pemasukan (Kas Masuk)
            </button>
            <button
              type="button"
              onClick={() => {
                setTipe('keluar');
                setKategori('Belanja Bahan Baku');
              }}
              className={`py-2 rounded-lg font-bold text-xs transition-all ${
                tipe === 'keluar'
                  ? 'bg-rose-500 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              - Pengeluaran (Beban/Biaya)
            </button>
          </div>

          {/* Row: Brand & Tanggal */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-mono text-slate-400 uppercase font-semibold block mb-1">
                Unit Bisnis / Brand
              </label>
              <select
                value={brand}
                onChange={(e) => setBrand(e.target.value as BrandId)}
                className="w-full px-3 py-2 rounded-lg bg-[#0a0e17] border border-white/10 text-xs text-white focus:outline-none focus:border-sky-500/50"
              >
                <option value="dikopi">☕ Dikopi F&B</option>
                <option value="kolektiva">🛍️ Kolektiva Apparel</option>
                <option value="imagineer">🚀 Imagineer Creative</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-mono text-slate-400 uppercase font-semibold block mb-1">
                Tanggal
              </label>
              <input
                type="date"
                value={tanggal}
                onChange={(e) => setTanggal(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#0a0e17] border border-white/10 text-xs font-mono text-white focus:outline-none focus:border-sky-500/50"
              />
            </div>
          </div>

          {/* Nominal */}
          <div>
            <label className="text-[11px] font-mono text-slate-400 uppercase font-semibold block mb-1">
              Nominal Transaksi (Rp)
            </label>
            <input
              type="text"
              placeholder="Rp 0"
              value={nominal}
              onChange={(e) => handleNominalChange(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-[#0a0e17] border border-white/10 text-base font-mono font-bold text-white placeholder-slate-600 focus:outline-none focus:border-sky-500/50"
            />
          </div>

          {/* Deskripsi */}
          <div>
            <label className="text-[11px] font-mono text-slate-400 uppercase font-semibold block mb-1">
              Keterangan / Deskripsi
            </label>
            <input
              type="text"
              placeholder="Contoh: Penjualan 20 cup kopi atau Belanja Susu Diamond"
              value={deskripsi}
              onChange={(e) => setDeskripsi(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-[#0a0e17] border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500/50"
            />
          </div>

          {/* Row: Kategori & Sumber Dana */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-mono text-slate-400 uppercase font-semibold block mb-1">
                Kategori
              </label>
              <select
                value={kategori}
                onChange={(e) => setKategori(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#0a0e17] border border-white/10 text-xs text-white focus:outline-none focus:border-sky-500/50"
              >
                {tipe === 'masuk' ? (
                  <>
                    <option value="Penjualan Langsung">Penjualan Langsung</option>
                    <option value="Penjualan Event">Penjualan Event</option>
                    <option value="Online / Ojek Online">Online / Ojol</option>
                    <option value="Pendapatan Jasa">Pendapatan Jasa</option>
                    <option value="Lain-lain">Lain-lain</option>
                  </>
                ) : (
                  <>
                    <option value="Belanja Bahan Baku">Belanja Bahan Baku</option>
                    <option value="Operasional & Listrik">Operasional & Listrik</option>
                    <option value="Gaji / Fee Barista">Gaji / Fee Barista</option>
                    <option value="Sewa & Maintenance">Sewa & Maintenance</option>
                    <option value="Marketing & Promosi">Marketing & Promosi</option>
                    <option value="Pengeluaran Lain">Pengeluaran Lain</option>
                  </>
                )}
              </select>
            </div>

            <div>
              <label className="text-[11px] font-mono text-slate-400 uppercase font-semibold block mb-1">
                Metode / Sumber Dana
              </label>
              <select
                value={sumber}
                onChange={(e) => setSumber(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#0a0e17] border border-white/10 text-xs text-white focus:outline-none focus:border-sky-500/50"
              >
                <option value="cash">Tunai / Cash</option>
                <option value="qris">QRIS</option>
                <option value="bca">BCA Transfer</option>
                <option value="mandiri">Mandiri Transfer</option>
                <option value="shopeepay">ShopeePay</option>
              </select>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-white/5 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-400 hover:text-white transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs shadow-glow transition-all active:scale-95 disabled:opacity-50"
            >
              {isSubmitting ? 'Menyimpan...' : 'Simpan Transaksi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
