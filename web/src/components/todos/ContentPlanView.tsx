import React, { useState, useMemo } from 'react';
import { 
  CalendarDays, 
  CheckCircle2, 
  Circle, 
  Search, 
  Video, 
  Image, 
  Layers, 
  Hash
} from 'lucide-react';
import type { TodoContentItem, BrandId } from '../../types';

interface ContentPlanViewProps {
  todos: TodoContentItem[];
  activeBrand: BrandId;
  onBrandChange: (brand: BrandId) => void;
  onToggleTodo?: (id: number | string) => void;
}

export const ContentPlanView: React.FC<ContentPlanViewProps> = ({
  todos,
  activeBrand,
  onBrandChange,
  onToggleTodo
}) => {
  const [selectedBulan, setSelectedBulan] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'todo' | 'done'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Filter per brand aktif
  const brandTodos = useMemo(() => {
    return todos.filter((t) => (t.brand || '').toLowerCase() === activeBrand.toLowerCase());
  }, [todos, activeBrand]);

  // Daftar bulan yang tersedia
  const availableMonths = useMemo(() => {
    const set = new Set<string>();
    brandTodos.forEach((t) => {
      if (t.bulan) set.add(t.bulan);
    });
    return Array.from(set).sort().reverse();
  }, [brandTodos]);

  // Filtered list
  const filteredTodos = useMemo(() => {
    return brandTodos.filter((t) => {
      if (selectedBulan !== 'all' && t.bulan !== selectedBulan) return false;
      if (selectedStatus === 'done' && !t.done) return false;
      if (selectedStatus === 'todo' && t.done) return false;
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const jMatch = (t.judul || '').toLowerCase().includes(term);
        const pMatch = (t.pilar || '').toLowerCase().includes(term);
        const hMatch = (t.hook || '').toLowerCase().includes(term);
        if (!jMatch && !pMatch && !hMatch) return false;
      }
      return true;
    }).sort((a, b) => (a.tanggalPosting || '').localeCompare(b.tanggalPosting || ''));
  }, [brandTodos, selectedBulan, selectedStatus, searchTerm]);

  // Progress stats
  const totalCount = brandTodos.length;
  const doneCount = brandTodos.filter((t) => t.done).length;
  const progressPct = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

  const getFormatIcon = (format: string) => {
    const f = (format || '').toLowerCase();
    if (f.includes('video') || f.includes('reels') || f.includes('tiktok')) {
      return <Video className="w-3.5 h-3.5 text-rose-400" />;
    }
    if (f.includes('carousel')) {
      return <Layers className="w-3.5 h-3.5 text-purple-400" />;
    }
    return <Image className="w-3.5 h-3.5 text-sky-400" />;
  };

  const getPilarBadgeClass = (pilar: string) => {
    const p = (pilar || '').toLowerCase();
    if (p.includes('produk')) return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
    if (p.includes('edukasi') || p.includes('educational')) return 'bg-sky-500/10 text-sky-400 border-sky-500/20';
    if (p.includes('behind') || p.includes('suasana')) return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
    if (p.includes('inspirational') || p.includes('vibes')) return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
  };

  return (
    <div className="space-y-5">
      {/* Top Header & Brand Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-amber-400" />
            <span>Content Plan Calendar & Social Media Board</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Manajemen kalender editorial, pilar konten, copy hook & CTA brand {activeBrand.toUpperCase()}.
          </p>
        </div>

        {/* Brand Selector */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-surface border border-white/5">
          {(['dikopi', 'kolektiva', 'imagineer'] as BrandId[]).map((b) => (
            <button
              key={b}
              onClick={() => onBrandChange(b)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                activeBrand === b
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {b}
            </button>
          ))}
        </div>
      </div>

      {/* Progress Card */}
      <div className="glass-card p-4 rounded-xl border border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex-1">
          <div className="flex justify-between items-center text-xs font-semibold mb-1.5">
            <span className="text-slate-300">Eksekusi Konten {activeBrand.toUpperCase()}</span>
            <span className="font-mono text-emerald-400 font-bold">{doneCount} / {totalCount} Selesai ({progressPct}%)</span>
          </div>
          <div className="w-full h-2 rounded-full bg-white/5 overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-amber-500 to-emerald-400 rounded-full transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-card p-3 rounded-xl border border-white/5 flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari judul, pilar, atau hook..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-[#0a0e17] border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50"
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Status filter */}
          <div className="flex items-center rounded-lg bg-[#0a0e17] p-0.5 border border-white/10 text-xs">
            <button
              onClick={() => setSelectedStatus('all')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
                selectedStatus === 'all' ? 'bg-white/10 text-white font-bold' : 'text-slate-400'
              }`}
            >
              Semua
            </button>
            <button
              onClick={() => setSelectedStatus('todo')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
                selectedStatus === 'todo' ? 'bg-amber-500/20 text-amber-300 font-bold' : 'text-slate-400'
              }`}
            >
              Belum
            </button>
            <button
              onClick={() => setSelectedStatus('done')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
                selectedStatus === 'done' ? 'bg-emerald-500/20 text-emerald-300 font-bold' : 'text-slate-400'
              }`}
            >
              Selesai
            </button>
          </div>

          {/* Month selector */}
          <select
            value={selectedBulan}
            onChange={(e) => setSelectedBulan(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg bg-[#0a0e17] border border-white/10 text-[11px] font-mono text-slate-300 focus:outline-none"
          >
            <option value="all">Semua Bulan</option>
            {availableMonths.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTodos.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-500 glass-card rounded-2xl">
            Tidak ada rencana konten yang cocok dengan filter ini.
          </div>
        ) : (
          filteredTodos.map((item) => (
            <div
              key={item.id}
              className={`glass-card rounded-2xl p-5 border transition-all flex flex-col justify-between ${
                item.done ? 'border-emerald-500/20 bg-emerald-500/[0.02]' : 'border-white/5 hover:border-amber-500/30'
              }`}
            >
              <div>
                {/* Card Top: Date & Badges */}
                <div className="flex items-start justify-between gap-2 mb-2.5">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onToggleTodo && onToggleTodo(item.id)}
                      className="text-slate-400 hover:text-emerald-400 transition-colors"
                      title={item.done ? 'Tandai belum selesai' : 'Tandai sudah diposting'}
                    >
                      {item.done ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400 fill-emerald-400/20" />
                      ) : (
                        <Circle className="w-5 h-5 text-slate-600 hover:text-amber-400" />
                      )}
                    </button>
                    <span className="font-mono text-xs font-semibold text-slate-300">
                      {item.tanggalPosting}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono bg-white/5 text-slate-300 border border-white/10">
                      {getFormatIcon(item.format)}
                      <span>{item.format}</span>
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono border ${getPilarBadgeClass(item.pilar)}`}>
                      {item.pilar}
                    </span>
                  </div>
                </div>

                {/* Title */}
                <h4 className={`font-bold text-sm leading-snug mt-1 ${item.done ? 'line-through text-slate-400' : 'text-white'}`}>
                  {item.judul}
                </h4>

                {/* Hook & CTA */}
                {item.hook && (
                  <div className="mt-2.5 p-2 rounded-lg bg-white/[0.02] border border-white/5 text-[11px] text-slate-300">
                    <span className="font-semibold text-amber-400 block text-[10px] uppercase font-mono mb-0.5">Hook:</span>
                    {item.hook}
                  </div>
                )}

                {item.cta && (
                  <div className="mt-2 text-[11px] text-slate-400">
                    <span className="text-slate-500 font-semibold font-mono text-[10px] uppercase mr-1">CTA:</span>
                    {item.cta}
                  </div>
                )}
              </div>

              {/* Bottom: Notes & Hashtags */}
              <div className="mt-3 pt-3 border-t border-white/5 space-y-2">
                {item.hashtag && (
                  <div className="flex items-start gap-1.5 text-[10px] font-mono text-slate-500">
                    <Hash className="w-3 h-3 text-slate-500 shrink-0 mt-0.5" />
                    <span className="truncate">{item.hashtag}</span>
                  </div>
                )}
                {item.notes && (
                  <div className="text-[10px] text-slate-400 bg-surface-2 p-2 rounded-lg leading-relaxed max-h-20 overflow-y-auto">
                    {item.notes}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
