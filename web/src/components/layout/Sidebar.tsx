import React from 'react';
import { 
  LayoutDashboard, 
  Wallet, 
  CalendarDays, 
  CheckSquare, 
  UtensilsCrossed, 
  Coffee, 
  ShoppingBag, 
  Sparkles, 
  CloudSync
} from 'lucide-react';
import type { BrandId } from '../../types';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  activeBrand: BrandId;
  setActiveBrand: (brand: BrandId) => void;
  syncStatus?: string;
  onTriggerSync?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  activeBrand,
  setActiveBrand,
  onTriggerSync
}) => {
  const brands: { id: BrandId; name: string; icon: React.ReactNode; color: string }[] = [
    { id: 'dikopi', name: 'Dikopi F&B', icon: <Coffee className="w-3.5 h-3.5" />, color: 'text-amber-400' },
    { id: 'kolektiva', name: 'Kolektiva Apparel', icon: <ShoppingBag className="w-3.5 h-3.5" />, color: 'text-purple-400' },
    { id: 'imagineer', name: 'Imagineer Creative', icon: <Sparkles className="w-3.5 h-3.5" />, color: 'text-rose-400' },
  ];

  return (
    <aside className="w-64 bg-[#0d131f] border-r border-white/5 flex flex-col h-screen sticky top-0 select-none">
      {/* Brand Header */}
      <div className="p-5 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-400 to-sky-600 flex items-center justify-center font-black text-black text-lg shadow-glow">
            P
          </div>
          <div>
            <h1 className="font-extrabold text-sm tracking-tight text-white flex items-center gap-1.5">
              Pratani Creative
              <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20">HQ v5</span>
            </h1>
            <p className="text-[11px] text-slate-400">Enterprise Workspace</p>
          </div>
        </div>
      </div>

      {/* Brand Context Switcher */}
      <div className="px-3 pt-4 pb-2">
        <label className="text-[10px] uppercase font-mono font-semibold tracking-wider text-slate-500 px-2 block mb-1.5">
          Active Brand Unit
        </label>
        <div className="space-y-1">
          {brands.map((b) => (
            <button
              key={b.id}
              onClick={() => setActiveBrand(b.id)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeBrand === b.id
                  ? 'bg-white/10 text-white shadow-sm border border-white/10'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className={b.color}>{b.icon}</span>
                <span>{b.name}</span>
              </div>
              {activeBrand === b.id && (
                <div className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Navigation Sections */}
      <nav className="flex-1 px-3 py-3 space-y-6 overflow-y-auto">
        <div>
          <div className="text-[10px] uppercase font-mono font-semibold tracking-wider text-slate-500 px-2 mb-2">
            Ikhtisar
          </div>
          <div className="space-y-0.5">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                activeTab === 'dashboard'
                  ? 'bg-sky-500/15 text-sky-300 font-semibold border border-sky-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`}
            >
              <LayoutDashboard className="w-4 h-4 text-sky-400" />
              <span>Executive Dashboard</span>
            </button>
          </div>
        </div>

        <div>
          <div className="text-[10px] uppercase font-mono font-semibold tracking-wider text-slate-500 px-2 mb-2">
            Keuangan & Kas
          </div>
          <div className="space-y-0.5">
            <button
              onClick={() => setActiveTab('keuangan')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                activeTab === 'keuangan'
                  ? 'bg-sky-500/15 text-sky-300 font-semibold border border-sky-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`}
            >
              <Wallet className="w-4 h-4 text-emerald-400" />
              <span>Buku Kas & Transaksi</span>
            </button>
          </div>
        </div>

        <div>
          <div className="text-[10px] uppercase font-mono font-semibold tracking-wider text-slate-500 px-2 mb-2">
            Produktivitas & Konten
          </div>
          <div className="space-y-0.5">
            <button
              onClick={() => setActiveTab('todos')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                activeTab === 'todos'
                  ? 'bg-sky-500/15 text-sky-300 font-semibold border border-sky-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`}
            >
              <CalendarDays className="w-4 h-4 text-amber-400" />
              <span>Content Plan Calendar</span>
            </button>
            <button
              onClick={() => setActiveTab('tasks')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                activeTab === 'tasks'
                  ? 'bg-sky-500/15 text-sky-300 font-semibold border border-sky-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`}
            >
              <CheckSquare className="w-4 h-4 text-purple-400" />
              <span>To-Do List Kanban</span>
            </button>
          </div>
        </div>

        {activeBrand === 'dikopi' && (
          <div>
            <div className="text-[10px] uppercase font-mono font-semibold tracking-wider text-slate-500 px-2 mb-2">
              F&B Management
            </div>
            <div className="space-y-0.5">
              <button
                onClick={() => setActiveTab('resep')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  activeTab === 'resep'
                    ? 'bg-sky-500/15 text-sky-300 font-semibold border border-sky-500/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                }`}
              >
                <UtensilsCrossed className="w-4 h-4 text-amber-400" />
                <span>Resep Menu & HPP</span>
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* Cloud Kasir Sync Quick Panel */}
      <div className="p-3 m-3 rounded-xl bg-surface-2 border border-white/5">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            Cloud Kasir Sync
          </div>
          <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
            ONLINE
          </span>
        </div>
        <p className="text-[11px] text-slate-400 mb-2.5 leading-relaxed">
          Tarik data kasir event & sinkronkan margin secara instan.
        </p>
        <button
          onClick={onTriggerSync}
          className="w-full py-1.5 px-2.5 rounded-lg bg-white/5 hover:bg-white/10 active:scale-95 text-slate-200 text-xs font-medium border border-white/10 flex items-center justify-center gap-2 transition-all"
        >
          <CloudSync className="w-3.5 h-3.5 text-sky-400" />
          <span>Tarik Transaksi Kasir</span>
        </button>
      </div>
    </aside>
  );
};
