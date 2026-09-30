import React, { useState, useEffect } from 'react';
import { FolderOpen, Plus, RefreshCw, CheckCircle2 } from 'lucide-react';

interface HeaderProps {
  title: string;
  folderName: string | null;
  onConnectFolder: () => void;
  onRefreshData?: () => void;
  onOpenAddModal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  folderName,
  onConnectFolder,
  onRefreshData,
  onOpenAddModal
}) => {
  const [currentDateTime, setCurrentDateTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const dateStr = now.toLocaleDateString('id-ID', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
      const timeStr = now.toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit'
      });
      setCurrentDateTime(`${dateStr} • ${timeStr}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="h-16 border-b border-white/5 bg-[#0a0e17]/80 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-30">
      <div>
        <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
          {title}
        </h2>
      </div>

      <div className="flex items-center gap-3">
        {/* Date and Time badge */}
        <div className="hidden md:flex items-center px-3 py-1.5 rounded-lg bg-surface border border-white/5 text-xs font-mono text-slate-300">
          {currentDateTime}
        </div>

        {/* Folder Data Connection Status */}
        {folderName ? (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span className="font-mono">{folderName}</span>
            {onRefreshData && (
              <button 
                onClick={onRefreshData} 
                title="Muat ulang data dari SSD"
                className="hover:rotate-180 transition-transform duration-300 ml-1 text-emerald-400"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        ) : (
          <button
            onClick={onConnectFolder}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/25 text-amber-300 text-xs font-semibold transition-all active:scale-95"
          >
            <FolderOpen className="w-3.5 h-3.5 text-amber-400" />
            <span>Hubungkan Folder #DATA</span>
          </button>
        )}

        {/* Quick Action Button */}
        {onOpenAddModal && (
          <button
            onClick={onOpenAddModal}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs shadow-glow transition-all active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Catat Transaksi</span>
          </button>
        )}
      </div>
    </header>
  );
};
