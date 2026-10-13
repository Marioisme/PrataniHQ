import React, { useState, useMemo } from 'react';
import type { BrandId } from '../../types';
import { BRAND_LABEL, BRAND_ICONS } from '../../lib/contentPlanUtils';

export interface TodolistSheetRow {
  id: number;
  cells: string[];
  _status?: 'done' | 'pending' | 'proses' | 'batal' | null;
}

export interface TodolistSheet {
  name?: string;
  title?: string;
  columns: string[];
  statusCol: number;
  rows: TodolistSheetRow[];
}

export interface TodolistSet {
  id: number;
  title: string;
  brand: string;
  uploadedAt: string;
  archived: boolean;
  sheets: TodolistSheet[];
}

interface TasksViewProps {
  taskList: any[];
  activeBrand: BrandId;
  onBrandChange: (brand: BrandId) => void;
  onSaveTaskList: (list: any[]) => Promise<void>;
}

export const TasksView: React.FC<TasksViewProps> = ({
  taskList,
  activeBrand,
  onBrandChange,
  onSaveTaskList
}) => {
  const [activeSheetIdx, setActiveSheetIdx] = useState<number>(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDlMenuOpen, setIsDlMenuOpen] = useState(false);
  const [todayStr] = useState(() => new Date().toISOString().split('T')[0]);

  // Normalize taskList items to TodolistSet structure
  const allSets = useMemo<TodolistSet[]>(() => {
    return (taskList || []).map((t, idx) => {
      const sheets = (t.sheets || []).map((sh: any) => {
        const cols = sh.columns || [];
        let statusCol = sh.statusCol;
        if (typeof statusCol !== 'number') {
          statusCol = cols.findIndex((c: string) => (c || '').toLowerCase().includes('status'));
        }
        return {
          name: sh.name || sh.title || `Sheet ${idx + 1}`,
          title: sh.title || sh.name || `Sheet ${idx + 1}`,
          columns: cols,
          statusCol,
          rows: (sh.rows || []).map((r: any, rIdx: number) => ({
            id: r.id || rIdx + 1,
            cells: Array.isArray(r.cells) ? r.cells : (Array.isArray(r) ? r : []),
            _status: r._status || null
          }))
        };
      });

      return {
        id: t.id || idx + 1,
        title: t.title || 'Master To-Do',
        brand: (t.brand || activeBrand).toLowerCase(),
        uploadedAt: t.uploadedAt || todayStr,
        archived: Boolean(t.archived),
        sheets
      };
    });
  }, [taskList, activeBrand, todayStr]);

  const activeSets = useMemo(() => {
    return allSets.filter((s) => s.brand === activeBrand.toLowerCase() && !s.archived);
  }, [allSets, activeBrand]);

  const archivedSets = useMemo(() => {
    return allSets.filter((s) => s.brand === activeBrand.toLowerCase() && s.archived);
  }, [allSets, activeBrand]);

  const activeSet = activeSets[0] || null;
  const currentSheet = activeSet?.sheets?.[activeSheetIdx] || activeSet?.sheets?.[0] || null;

  // Status helper
  const tdlParseStatus = (str: string): 'done' | 'pending' | 'proses' | 'batal' => {
    const s = (str || '').toLowerCase();
    if (s.includes('done') || s.includes('selesai') || s.includes('✓')) return 'done';
    if (s.includes('proses') || s.includes('progress') || s.includes('ongoing')) return 'proses';
    if (s.includes('batal') || s.includes('cancel') || s.includes('drop')) return 'batal';
    return 'pending';
  };

  const getRowStatus = (row: TodolistSheetRow, statusCol: number): 'done' | 'pending' | 'proses' | 'batal' => {
    if (row._status) return row._status;
    if (statusCol >= 0 && row.cells[statusCol]) {
      return tdlParseStatus(row.cells[statusCol]);
    }
    return 'pending';
  };

  const cycleStatus = async (setId: number, sheetIdx: number, rowId: number) => {
    const updated = allSets.map((s) => {
      if (s.id === setId) {
        const nextSheets = s.sheets.map((sh, sIdx) => {
          if (sIdx === sheetIdx) {
            const nextRows = sh.rows.map((r) => {
              if (r.id === rowId) {
                const cur = getRowStatus(r, sh.statusCol);
                const nextMap: Record<string, 'done' | 'pending' | 'proses' | 'batal'> = {
                  pending: 'proses',
                  proses: 'done',
                  done: 'batal',
                  batal: 'pending'
                };
                const next = nextMap[cur] || 'pending';
                return { ...r, _status: next };
              }
              return r;
            });
            return { ...sh, rows: nextRows };
          }
          return sh;
        });
        return { ...s, sheets: nextSheets };
      }
      return s;
    });
    await onSaveTaskList(updated);
  };

  const handleArchive = async (setId: number) => {
    const updated = allSets.map((s) => (s.id === setId ? { ...s, archived: true } : s));
    await onSaveTaskList(updated);
  };

  const handleUnarchive = async (setId: number) => {
    const updated = allSets.map((s) => (s.id === setId ? { ...s, archived: false } : s));
    await onSaveTaskList(updated);
  };

  const handleDeleteSet = async (setId: number) => {
    if (window.confirm('Hapus seluruh To-Do set ini?')) {
      const updated = allSets.filter((s) => s.id !== setId);
      await onSaveTaskList(updated);
    }
  };

  const handleUploadJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const text = evt.target?.result as string;
        const parsed = JSON.parse(text);

        let newSet: TodolistSet;
        if (parsed.sheets && Array.isArray(parsed.sheets)) {
          newSet = {
            id: Date.now(),
            title: parsed.title || file.name.replace('.json', ''),
            brand: activeBrand,
            uploadedAt: new Date().toISOString().split('T')[0],
            archived: false,
            sheets: parsed.sheets.map((s: any, idx: number) => {
              const cols = s.columns || [];
              const statusCol = cols.findIndex((c: string) => (c || '').toLowerCase().includes('status'));
              return {
                name: s.name || s.title || `Sheet ${idx + 1}`,
                title: s.title || s.name || `Sheet ${idx + 1}`,
                columns: cols,
                statusCol,
                rows: (s.rows || []).map((r: any, rIdx: number) => ({
                  id: r.id || rIdx + 1,
                  cells: Array.isArray(r.cells) ? r.cells : (Array.isArray(r) ? r : []),
                  _status: null
                }))
              };
            })
          };
        } else {
          alert('Format JSON harus memiliki properti "sheets" berupa array.');
          return;
        }

        const existingWithoutActive = allSets.filter((s) => !(s.brand === activeBrand && !s.archived));
        const updated = [...existingWithoutActive, newSet];
        await onSaveTaskList(updated);
        setActiveSheetIdx(0);
      } catch (err: any) {
        alert('Gagal membaca file JSON: ' + err.message);
      }
    };
    reader.readAsText(file);
  };

  // Download export
  const handleDownload = (format: 'json' | 'md') => {
    if (!activeSet) return;
    let dataStr = '';
    let fileName = '';

    if (format === 'json') {
      dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(activeSet, null, 2));
      fileName = `${activeSet.title.replace(/\s+/g, '_')}.json`;
    } else {
      let md = `# ${activeSet.title} (${activeSet.brand.toUpperCase()})\n\n`;
      activeSet.sheets.forEach((sh) => {
        md += `## ${sh.name}\n\n`;
        md += `| ${sh.columns.join(' | ')} |\n`;
        md += `| ${sh.columns.map(() => '---').join(' | ')} |\n`;
        sh.rows.forEach((r) => {
          md += `| ${r.cells.join(' | ')} |\n`;
        });
        md += '\n';
      });
      dataStr = 'data:text/markdown;charset=utf-8,' + encodeURIComponent(md);
      fileName = `${activeSet.title.replace(/\s+/g, '_')}.md`;
    }

    const a = document.createElement('a');
    a.href = dataStr;
    a.download = fileName;
    a.click();
    setIsDlMenuOpen(false);
  };

  // Progress metrics
  const totalTasks = useMemo(() => {
    if (!activeSet) return 0;
    return activeSet.sheets.reduce((acc, sh) => acc + sh.rows.length, 0);
  }, [activeSet]);

  const doneTasks = useMemo(() => {
    if (!activeSet) return 0;
    return activeSet.sheets.reduce((acc, sh) => {
      const cnt = sh.rows.filter((r) => getRowStatus(r, sh.statusCol) === 'done').length;
      return acc + cnt;
    }, 0);
  }, [activeSet]);

  const overallPct = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;
  const allDone = totalTasks > 0 && doneTasks === totalTasks;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* ── TOPBAR: BRAND TABS ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
        <div className="filter-row" style={{ marginBottom: 0 }}>
          {(['dikopi', 'kolektiva', 'imagineer'] as BrandId[]).map((b) => (
            <button
              key={b}
              onClick={() => {
                onBrandChange(b);
                setActiveSheetIdx(0);
              }}
              className={`filter-btn ${activeBrand === b ? 'active' : ''}`}
              style={{ textTransform: 'capitalize' }}
            >
              {BRAND_ICONS[b]} {BRAND_LABEL[b]}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <input
            type="text"
            className="form-input"
            placeholder="🔍 Cari task / PIC / kategori..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '220px', padding: '6px 12px', fontSize: '12px' }}
          />

          <label className="btn btn-primary btn-sm" style={{ cursor: 'pointer', margin: 0 }}>
            📋 Upload To-Do JSON
            <input type="file" accept=".json" onChange={handleUploadJSON} style={{ display: 'none' }} />
          </label>
        </div>
      </div>

      {/* ── ACTIVE SET ── */}
      {activeSet ? (
        <div style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
          {/* Active Set Header */}
          <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '180px' }}>
              <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text)' }}>
                {activeSet.title}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--muted)', fontFamily: 'DM Mono', marginTop: '2px' }}>
                Upload: {activeSet.uploadedAt} · {totalTasks} total task
              </div>
            </div>

            <div style={{ fontFamily: 'DM Mono', fontSize: '12px', color: allDone ? '#4cc9a0' : 'var(--muted)', fontWeight: 600 }}>
              {doneTasks}/{totalTasks} ({overallPct}%)
            </div>
            <div className="tdl-progress-bar" style={{ width: '90px' }}>
              <div className="tdl-progress-fill" style={{ width: `${overallPct}%`, background: allDone ? 'var(--green)' : 'var(--accent)' }} />
            </div>

            {/* Download Dropdown */}
            <div style={{ position: 'relative' }}>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => setIsDlMenuOpen(!isDlMenuOpen)}
                title="Download To-Do"
              >
                ⬇️
              </button>
              {isDlMenuOpen && (
                <div
                  style={{
                    position: 'absolute',
                    right: 0,
                    top: '110%',
                    background: 'var(--surface2)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    minWidth: '130px',
                    zIndex: 99,
                    boxShadow: '0 4px 16px rgba(0,0,0,.3)'
                  }}
                >
                  <div
                    style={{ padding: '8px 12px', fontSize: '12px', cursor: 'pointer', borderBottom: '1px solid var(--border)' }}
                    onClick={() => handleDownload('json')}
                  >
                    📦 JSON
                  </div>
                  <div
                    style={{ padding: '8px 12px', fontSize: '12px', cursor: 'pointer' }}
                    onClick={() => handleDownload('md')}
                  >
                    📝 Markdown
                  </div>
                </div>
              )}
            </div>

            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => handleDeleteSet(activeSet.id)}
              title="Hapus"
            >
              🗑️
            </button>
          </div>

          {/* Archive Banner if 100% done */}
          {allDone && (
            <div className="tdl-archive-banner" style={{ display: 'flex' }}>
              <span style={{ fontSize: '24px' }}>🎉</span>
              <div style={{ flex: 1 }}>
                <div className="tdl-archive-text">Semua task selesai!</div>
                <div className="tdl-archive-sub">Arsipkan to-do ini dan upload yang baru</div>
              </div>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => handleArchive(activeSet.id)}
              >
                📦 Arsipkan
              </button>
            </div>
          )}

          {/* Sheet Tabs */}
          <div className="tdl-sheet-tabs">
            {activeSet.sheets.map((s, idx) => {
              const sDone = s.rows.filter((r) => getRowStatus(r, s.statusCol) === 'done').length;
              const sTotal = s.rows.length;
              return (
                <div
                  key={idx}
                  className={`tdl-sheet-tab ${idx === activeSheetIdx ? 'active' : ''}`}
                  onClick={() => setActiveSheetIdx(idx)}
                >
                  {s.title || s.name} ({sDone}/{sTotal})
                </div>
              );
            })}
          </div>

          {/* Sheet Table */}
          <div style={{ padding: '14px 18px' }}>
            {currentSheet && (
              <div className="tdl-table-wrap">
                <table className="tdl-table">
                  <thead>
                    <tr>
                      {currentSheet.columns.map((c, cIdx) => (
                        <th key={cIdx} style={cIdx === currentSheet.statusCol ? { width: '120px' } : undefined}>
                          {c}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {currentSheet.rows
                      .filter((r) => {
                        if (!searchTerm.trim()) return true;
                        const q = searchTerm.toLowerCase();
                        return r.cells.some((cell) => (cell || '').toLowerCase().includes(q));
                      })
                      .map((row) => {
                        return (
                          <tr key={row.id}>
                            {currentSheet.columns.map((col, cIdx) => {
                              const val = row.cells[cIdx] || '';
                              if (cIdx === currentSheet.statusCol) {
                                const st = getRowStatus(row, currentSheet.statusCol);
                                const labelMap = {
                                  done: '✅ Done',
                                  pending: '⏳ Pending',
                                  proses: '🔄 Proses',
                                  batal: '✕ Batal'
                                };
                                return (
                                  <td key={cIdx} style={{ width: '120px' }}>
                                    <button
                                      type="button"
                                      className={`tdl-status-btn ${st}`}
                                      onClick={() => cycleStatus(activeSet.id, activeSheetIdx, row.id)}
                                      title="Klik untuk ubah status"
                                    >
                                      {labelMap[st]}
                                    </button>
                                  </td>
                                );
                              }

                              const colLower = (col || '').toLowerCase();
                              if (colLower.includes('prioritas') || colLower.includes('priority')) {
                                const prioClass = val.toLowerCase().includes('urgent') ? 'prio-urgent' : val.toLowerCase().includes('high') ? 'prio-high' : 'prio-med';
                                return (
                                  <td key={cIdx}>
                                    <span className={`tdl-prio ${prioClass}`}>{val}</span>
                                  </td>
                                );
                              }
                              if (colLower === '#' || colLower === 'no') {
                                return (
                                  <td key={cIdx} className="tdl-num">
                                    {val}
                                  </td>
                                );
                              }
                              return <td key={cIdx}>{val}</td>;
                            })}
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Upload Zone when no active set */
        <label className="tdl-upload-zone" style={{ cursor: 'pointer' }}>
          <div className="tdl-upload-zone-icon">📋</div>
          <div className="tdl-upload-zone-text">
            Upload To-Do JSON untuk <strong>{BRAND_LABEL[activeBrand]}</strong>
          </div>
          <div className="tdl-upload-zone-sub">
            Format JSON hasil convert dari Excel · Klik untuk pilih file
          </div>
          <input type="file" accept=".json" onChange={handleUploadJSON} style={{ display: 'none' }} />
        </label>
      )}

      {/* ── ARCHIVED SETS ── */}
      {archivedSets.length > 0 && (
        <div style={{ marginTop: '20px' }}>
          <div className="strategy-section-title">📦 Arsip To-Do</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px' }}>
            {archivedSets.map((s) => {
              const total = s.sheets.reduce((acc, sh) => acc + sh.rows.length, 0);
              return (
                <div key={s.id} className="tdl-archived-item">
                  <span style={{ fontSize: '20px' }}>📦</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: '13px' }}>{s.title}</div>
                    <div style={{ fontSize: '11px', color: 'var(--muted)', fontFamily: 'DM Mono' }}>
                      {total} task · Selesai
                    </div>
                  </div>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => handleUnarchive(s.id)}
                    title="Buka kembali dari arsip"
                  >
                    ↩️ Pulihkan
                  </button>
                  <button
                    type="button"
                    className="btn btn-danger btn-sm"
                    onClick={() => handleDeleteSet(s.id)}
                    title="Hapus permanen"
                  >
                    🗑️
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
