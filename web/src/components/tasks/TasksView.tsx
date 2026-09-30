import React, { useState, useMemo } from 'react';
import { CheckSquare, Search } from 'lucide-react';
import type { TaskProject, BrandId } from '../../types';

interface TasksViewProps {
  taskList: TaskProject[];
  activeBrand: BrandId;
  onBrandChange: (brand: BrandId) => void;
}

export const TasksView: React.FC<TasksViewProps> = ({
  taskList,
  activeBrand,
  onBrandChange
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  // Cari project yang cocok dengan brand aktif, atau project pertama
  const matchedProjects = useMemo(() => {
    return taskList.filter((p) => (p.brand || '').toLowerCase() === activeBrand.toLowerCase());
  }, [taskList, activeBrand]);

  const activeProject = matchedProjects.length > 0 ? matchedProjects[0] : (taskList[0] || null);

  const [activeSheetIdx, setActiveSheetIdx] = useState<number>(0);
  const currentSheet = activeProject?.sheets?.[activeSheetIdx] || activeProject?.sheets?.[0] || null;

  // Filter rows
  const filteredRows = useMemo(() => {
    if (!currentSheet) return [];
    return currentSheet.rows.filter((r) => {
      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase();
      return r.cells.some((cell) => (cell || '').toLowerCase().includes(term));
    });
  }, [currentSheet, searchTerm]);

  return (
    <div className="space-y-5">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-purple-400" />
            <span>Master To-Do List & Operational Task Sheet</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Manajemen daftar tugas, PIC, deadline, dan eksekusi operasional multi-brand.
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
                  ? 'bg-purple-500 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {b}
            </button>
          ))}
        </div>
      </div>

      {/* Sheets Tabs & Search */}
      <div className="glass-card p-3 rounded-xl border border-white/5 flex flex-wrap items-center justify-between gap-3">
        {/* Sheet Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {activeProject?.sheets?.map((s, idx) => (
            <button
              key={idx}
              onClick={() => setActiveSheetIdx(idx)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                activeSheetIdx === idx
                  ? 'bg-white/10 text-white font-bold border border-white/10'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {s.name} ({s.rows.length})
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative min-w-[200px]">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari task / brief..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-[#0a0e17] border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500/50"
          />
        </div>
      </div>

      {/* Task Table */}
      <div className="glass-card rounded-2xl overflow-hidden border border-white/5">
        {!currentSheet ? (
          <div className="py-12 text-center text-slate-500">
            Tidak ada lembar kerja to-do yang ditemukan untuk brand ini.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-slate-400 bg-white/[0.02] border-b border-white/5 text-[11px] font-mono">
                  {currentSheet.columns.map((col, i) => (
                    <th key={i} className="py-3 px-4 uppercase whitespace-nowrap">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-sans">
                {filteredRows.length === 0 ? (
                  <tr>
                    <td colSpan={currentSheet.columns.length} className="py-10 text-center text-slate-500">
                      Tidak ada tugas yang cocok dengan pencarian.
                    </td>
                  </tr>
                ) : (
                  filteredRows.map((r, rowIdx) => (
                    <tr key={r.id || rowIdx} className="hover:bg-white/[0.02] transition-colors">
                      {r.cells.map((cell, colIdx) => {
                        const colName = (currentSheet.columns[colIdx] || '').toUpperCase();
                        const isStatus = colName.includes('STATUS');
                        const isPrioritas = colName.includes('PRIORITAS');
                        const isCategory = colName.includes('KATEGORI');

                        return (
                          <td key={colIdx} className="py-3 px-4 text-slate-300">
                            {isStatus ? (
                              <span className={`px-2 py-0.5 rounded text-[10px] font-mono ${
                                cell.includes('Done') || cell.includes('✅')
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                  : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                              }`}>
                                {cell}
                              </span>
                            ) : isPrioritas ? (
                              <span className="font-mono text-[10px] text-rose-300">
                                {cell}
                              </span>
                            ) : isCategory ? (
                              <span className="px-1.5 py-0.5 rounded bg-white/5 text-slate-400 text-[10px] font-mono">
                                {cell}
                              </span>
                            ) : (
                              <span>{cell}</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
