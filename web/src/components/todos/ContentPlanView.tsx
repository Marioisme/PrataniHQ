import React, { useState, useMemo } from 'react';
import type { TodoContentItem, PilarItem, BrandId } from '../../types';
import {
  getHari,
  fmtTanggal,
  getPilarStyle,
  BRAND_LABEL,
  BRAND_ICONS
} from '../../lib/contentPlanUtils';
import { getBulanLabel } from '../../lib/keuanganUtils';
import {
  ContentDetailModal,
  AddEditContentModal,
  KelolaPilarModal,
  BulkImportTodosModal
} from './ContentPlanModals';

export interface ContentPlanViewProps {
  todos: TodoContentItem[];
  pilars: PilarItem[];
  activeBrand: BrandId;
  onBrandChange: (brand: BrandId) => void;
  onSaveTodo: (todo: TodoContentItem) => Promise<void>;
  onUpdateTodo: (todo: TodoContentItem) => Promise<void>;
  onDeleteTodo: (id: number | string) => Promise<void>;
  onToggleTodo: (id: number | string) => Promise<void>;
  onSetBoardStatus: (id: number | string, status: 'not_started' | 'in_progress' | 'done') => Promise<void>;
  onSavePilars: (pilars: PilarItem[]) => Promise<void>;
  onBulkImportTodos: (items: TodoContentItem[], mode: 'append' | 'replaceBrand', targetBrand?: string) => Promise<void>;
}

export const ContentPlanView: React.FC<ContentPlanViewProps> = ({
  todos,
  pilars,
  activeBrand,
  onBrandChange,
  onSaveTodo,
  onUpdateTodo,
  onDeleteTodo,
  onToggleTodo,
  onSetBoardStatus,
  onSavePilars,
  onBulkImportTodos
}) => {
  // View mode: 'table' or 'board'
  const [viewMode, setViewMode] = useState<'table' | 'board'>('table');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Accordion collapsed state per month/brand
  const [collapsedMonths, setCollapsedMonths] = useState<Record<string, boolean>>({});

  // Modal states
  const [selectedDetailItem, setSelectedDetailItem] = useState<TodoContentItem | null>(null);
  const [selectedEditItem, setSelectedEditItem] = useState<TodoContentItem | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addModalInitialBulan, setAddModalInitialBulan] = useState<string>('');
  const [isKelolaPilarOpen, setIsKelolaPilarOpen] = useState(false);
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);

  // Drag & drop state for Board view
  const [draggedId, setDraggedId] = useState<number | string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<string | null>(null);

  // Filter per brand aktif
  const brandTodos = useMemo(() => {
    return todos.filter((t) => (t.brand || '').toLowerCase() === activeBrand.toLowerCase());
  }, [todos, activeBrand]);

  // Current month key (YYYY-MM)
  const [currentMonthKey] = useState(() => new Date().toISOString().substring(0, 7));

  // Filter by search
  const searchedTodos = useMemo(() => {
    if (!searchTerm.trim()) return brandTodos;
    const q = searchTerm.toLowerCase();
    return brandTodos.filter((t) => {
      const matchJudul = (t.judul || '').toLowerCase().includes(q);
      const matchPilar = (t.pilar || '').toLowerCase().includes(q);
      const matchHook = (t.hook || '').toLowerCase().includes(q);
      const matchNotes = (t.notes || '').toLowerCase().includes(q);
      const matchFormat = (t.format || '').toLowerCase().includes(q);
      return matchJudul || matchPilar || matchHook || matchNotes || matchFormat;
    });
  }, [brandTodos, searchTerm]);

  // Grouped by month for Table View
  const { sortedMonths, byMonth } = useMemo(() => {
    const map: Record<string, TodoContentItem[]> = {};
    const sorted = [...searchedTodos].sort((a, b) => {
      return (a.tanggalPosting || '').localeCompare(b.tanggalPosting || '');
    });

    sorted.forEach((t) => {
      const key = t.bulan || (t.tanggalPosting ? t.tanggalPosting.substring(0, 7) : 'unset');
      if (!map[key]) map[key] = [];
      map[key].push(t);
    });

    // Ascending = oldest first, matching PrataniHQ_v4.2.html
    const months = Object.keys(map).sort((a, b) => a.localeCompare(b));
    return { sortedMonths: months, byMonth: map };
  }, [searchedTodos]);

  // Toggle month collapse
  const toggleMonth = (key: string) => {
    setCollapsedMonths((prev) => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // Helper status for board
  const getStatus = (t: TodoContentItem): 'not_started' | 'in_progress' | 'done' => {
    if (t.boardStatus === 'done' || t.done) return 'done';
    if (t.boardStatus === 'in_progress') return 'in_progress';
    return 'not_started';
  };

  // Board columns configuration
  const boardCols = [
    { key: 'not_started' as const, label: 'Not Started', dot: '#5a7a9a', cls: 'col-not-started' },
    { key: 'in_progress' as const, label: 'In Progress', dot: 'var(--accent)', cls: 'col-in-progress' },
    { key: 'done' as const, label: 'Done', dot: 'var(--green)', cls: 'col-done' }
  ];

  // Drag handlers
  const handleDragStart = (e: React.DragEvent, id: number | string) => {
    setDraggedId(id);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(id));
  };

  const handleDragEnd = () => {
    setDraggedId(null);
    setDragOverCol(null);
  };

  const handleDragOver = (e: React.DragEvent, colKey: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverCol !== colKey) setDragOverCol(colKey);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    const related = e.relatedTarget as Node | null;
    if (!e.currentTarget.contains(related)) {
      setDragOverCol(null);
    }
  };

  const handleDrop = async (e: React.DragEvent, colKey: 'not_started' | 'in_progress' | 'done') => {
    e.preventDefault();
    setDragOverCol(null);
    if (!draggedId) return;
    await onSetBoardStatus(draggedId, colKey);
    setDraggedId(null);
  };

  // Progress stats
  const totalBrandCount = brandTodos.length;
  const doneBrandCount = brandTodos.filter((t) => t.done).length;
  const progressPct = totalBrandCount > 0 ? Math.round((doneBrandCount / totalBrandCount) * 100) : 0;

  let rowCounter = 0; // global counter per brand view

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* ── TOPBAR: BRAND TABS & VIEW TOGGLE & ACTIONS ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
        {/* Brand Selector */}
        <div className="filter-row" style={{ marginBottom: 0 }}>
          {(['dikopi', 'kolektiva', 'imagineer'] as BrandId[]).map((b) => {
            const count = todos.filter((t) => (t.brand || '').toLowerCase() === b.toLowerCase()).length;
            return (
              <button
                key={b}
                onClick={() => onBrandChange(b)}
                className={`filter-btn ${activeBrand === b ? 'active' : ''}`}
                style={{ textTransform: 'capitalize', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <span>{BRAND_ICONS[b]} {BRAND_LABEL[b]}</span>
                <span style={{ fontSize: '10px', background: activeBrand === b ? 'rgba(255,255,255,0.2)' : 'var(--surface2)', padding: '1px 6px', borderRadius: '99px' }}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* View Toggle & Actions */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Search Box */}
          <input
            type="text"
            className="form-input"
            placeholder="🔍 Cari konten / pilar / hook..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '210px', padding: '6px 12px', fontSize: '12px' }}
          />

          {/* View Toggle */}
          <div className="view-toggle">
            <button
              type="button"
              className={`view-toggle-btn ${viewMode === 'table' ? 'active' : ''}`}
              onClick={() => setViewMode('table')}
            >
              ≡ Table
            </button>
            <button
              type="button"
              className={`view-toggle-btn ${viewMode === 'board' ? 'active' : ''}`}
              onClick={() => setViewMode('board')}
            >
              ⊞ Board
            </button>
          </div>

          {/* Kelola Pilar */}
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => setIsKelolaPilarOpen(true)}
            title="Kelola Konten Pilar & Warna"
          >
            🏷️ Kelola Pilar
          </button>

          {/* Bulk Import JSON */}
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => setIsBulkImportOpen(true)}
            style={{ borderColor: 'rgba(56, 189, 248, 0.3)', color: 'var(--accent)' }}
            title="Upload Bulk Data dari File JSON"
          >
            📥 Import JSON
          </button>

          {/* Tambah Konten */}
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => {
              setAddModalInitialBulan(currentMonthKey);
              setIsAddModalOpen(true);
            }}
          >
            + Konten
          </button>
        </div>
      </div>

      {/* ── EXECUTION PROGRESS STRIP ── */}
      <div className="card" style={{ padding: '12px 18px', marginBottom: '2px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '14px' }}>{BRAND_ICONS[activeBrand]}</span>
            <span style={{ fontWeight: 600, fontSize: '13px' }}>
              Eksekusi Konten — {BRAND_LABEL[activeBrand].toUpperCase()}
            </span>
          </div>
          <div style={{ fontFamily: 'DM Mono', fontSize: '12px', color: 'var(--muted)' }}>
            <strong style={{ color: 'var(--green)' }}>{doneBrandCount}</strong> dari {totalBrandCount} posted ({progressPct}%)
          </div>
        </div>
        <div className="progress-bar" style={{ height: '6px' }}>
          <div
            className="progress-fill"
            style={{
              width: `${progressPct}%`,
              background: progressPct === 100 ? 'var(--green)' : 'var(--accent)'
            }}
          />
        </div>
      </div>

      {/* ========================================================= */}
      {/* ── 1. TABLE VIEW (ACCORDION MONTH BLOCKS) ─────────────── */}
      {/* ========================================================= */}
      {viewMode === 'table' ? (
        <div>
          {sortedMonths.length === 0 ? (
            <div className="empty">
              <div className="empty-icon">📅</div>
              Belum ada konten planning untuk brand {BRAND_LABEL[activeBrand]}
            </div>
          ) : (
            sortedMonths.map((key) => {
              const items = byMonth[key];
              const doneCount = items.filter((t) => t.done).length;
              const allDone = doneCount === items.length && items.length > 0;
              const collapseKey = `${activeBrand}_${key}`;
              const isCollapsed = collapsedMonths[collapseKey] ?? (key !== currentMonthKey && allDone);
              const label = key === 'unset' ? 'Belum ada tanggal' : getBulanLabel(key);

              return (
                <div key={key} className="month-block">
                  {/* Month Header (Accordion Trigger) */}
                  <div
                    className={`month-header ${isCollapsed ? 'collapsed' : ''}`}
                    onClick={() => toggleMonth(collapseKey)}
                  >
                    <div className="month-header-left">
                      <span className="month-chevron">▾</span>
                      <span className="month-title">{label}</span>
                      <span className="month-count">{items.length} konten</span>
                      {doneCount > 0 && (
                        <span className="month-done-count">· {doneCount} done</span>
                      )}
                      {allDone && (
                        <span className="pill pill-done" style={{ fontSize: '10px' }}>
                          ✅ Selesai
                        </span>
                      )}
                    </div>

                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setAddModalInitialBulan(key !== 'unset' ? key : currentMonthKey);
                          setIsAddModalOpen(true);
                        }}
                      >
                        + Konten
                      </button>
                    </div>
                  </div>

                  {/* Month Table Body */}
                  {!isCollapsed && (
                    <div className="content-table-wrap">
                      <table className="content-table">
                        <thead>
                          <tr>
                            <th className="td-no">No</th>
                            <th className="td-tanggal">Tgl Posting</th>
                            <th className="td-hari">Hari</th>
                            <th className="td-pilar">Pilar</th>
                            <th className="td-brand">Brand</th>
                            <th className="td-format">Format</th>
                            <th className="td-judul">Judul / Tema</th>
                            <th className="td-hook">Caption Hook</th>
                            <th className="td-cta">CTA</th>
                            <th className="td-hashtag">Hashtag Bucket</th>
                            <th className="td-status">Status</th>
                            <th className="td-notes">Notes</th>
                          </tr>
                        </thead>
                        <tbody>
                          {items.map((t) => {
                            rowCounter++;
                            return (
                              <tr
                                key={t.id}
                                className={t.done ? 'row-done' : ''}
                                style={{ cursor: 'pointer' }}
                                onClick={() => setSelectedDetailItem(t)}
                              >
                                <td className="td-no">{rowCounter}</td>
                                <td className="td-tanggal">{fmtTanggal(t.tanggalPosting)}</td>
                                <td className="td-hari">{getHari(t.tanggalPosting)}</td>
                                <td className="td-pilar">
                                  <span
                                    className="pill-pilar"
                                    style={getPilarStyle(t.pilar, pilars)}
                                  >
                                    {t.pilar || '—'}
                                  </span>
                                </td>
                                <td className="td-brand">
                                  <span style={{ color: `var(--${t.brand})`, fontSize: '10.5px', fontWeight: 600 }}>
                                    {BRAND_LABEL[t.brand] || '—'}
                                  </span>
                                </td>
                                <td className="td-format">{t.format || '—'}</td>
                                <td className="td-judul">
                                  <strong style={{ color: t.done ? 'var(--text2)' : 'var(--text)' }}>
                                    {t.judul || '—'}
                                  </strong>
                                </td>
                                <td className="td-hook">{t.hook || '—'}</td>
                                <td className="td-cta">{t.cta || '—'}</td>
                                <td className="td-hashtag">{t.hashtag || '—'}</td>
                                <td className="td-status" onClick={(e) => e.stopPropagation()}>
                                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3px' }}>
                                    <div
                                      className={`tbl-check ${t.done ? 'done' : ''}`}
                                      onClick={() => onToggleTodo(t.id)}
                                      title={t.done ? 'Done (Klik untuk batal)' : 'Belum (Klik untuk selesai)'}
                                    >
                                      {t.done ? '✓' : ''}
                                    </div>
                                    <button
                                      type="button"
                                      className="tbl-action-btn tbl-edit"
                                      onClick={() => setSelectedEditItem(t)}
                                      title="Edit Konten"
                                    >
                                      ✏️
                                    </button>
                                    <button
                                      type="button"
                                      className="tbl-action-btn tbl-del"
                                      onClick={async () => {
                                        if (window.confirm('Hapus konten ini?')) {
                                          await onDeleteTodo(t.id);
                                        }
                                      }}
                                      title="Hapus Konten"
                                    >
                                      🗑️
                                    </button>
                                  </div>
                                </td>
                                <td className="td-notes">{t.notes || '—'}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })
          )}

          {/* Add New Content Global Button */}
          <button
            type="button"
            className="month-add-btn"
            onClick={() => {
              setAddModalInitialBulan(currentMonthKey);
              setIsAddModalOpen(true);
            }}
          >
            + Tambah Konten Baru
          </button>
        </div>
      ) : (
        /* ========================================================= */
        /* ── 2. BOARD VIEW (KANBAN WITH DRAG & DROP) ─────────────── */
        /* ========================================================= */
        <div className="board-wrap">
          {boardCols.map((col) => {
            const colItems = searchedTodos
              .filter((t) => getStatus(t) === col.key)
              .sort((a, b) => (a.tanggalPosting || '').localeCompare(b.tanggalPosting || ''));
            const isColumnOver = dragOverCol === col.key;

            return (
              <div key={col.key} className={`board-col ${col.cls}`}>
                {/* Column Header */}
                <div className="board-col-header">
                  <div className="board-col-dot" style={{ background: col.dot }} />
                  <div className="board-col-title">{col.label}</div>
                  <div className="board-col-count">{colItems.length}</div>
                </div>

                {/* Cards Container with Drag and Drop */}
                <div
                  className={`board-cards ${isColumnOver ? 'drag-over' : ''}`}
                  onDragOver={(e) => handleDragOver(e, col.key)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, col.key)}
                >
                  {colItems.map((t) => {
                    const status = getStatus(t);
                    const otherStatuses = boardCols.filter((c) => c.key !== status);
                    const isDraggingThis = draggedId === t.id;

                    return (
                      <div
                        key={t.id}
                        className={`board-card ${isDraggingThis ? 'dragging' : ''}`}
                        draggable
                        onDragStart={(e) => handleDragStart(e, t.id)}
                        onDragEnd={handleDragEnd}
                        onClick={() => setSelectedDetailItem(t)}
                      >
                        <div
                          className="board-card-brand"
                          style={{ color: `var(--${t.brand})` }}
                        >
                          {BRAND_LABEL[t.brand] || t.brand}
                        </div>
                        <div className="board-card-konsep">
                          {t.judul || 'Tanpa judul'}
                        </div>
                        <div className="board-card-meta">
                          {t.pilar && (
                            <span
                              className="pill-pilar"
                              style={{ ...getPilarStyle(t.pilar, pilars), fontSize: '10px', padding: '2px 8px', borderRadius: '99px' }}
                            >
                              {t.pilar}
                            </span>
                          )}
                          {t.tanggalPosting && (
                            <span className="board-card-date">
                              📅 {fmtTanggal(t.tanggalPosting)}
                            </span>
                          )}
                        </div>

                        {/* Quick Card Actions */}
                        <div
                          className="board-card-actions"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {otherStatuses.map((s) => (
                            <button
                              key={s.key}
                              type="button"
                              className="board-action-btn"
                              onClick={() => onSetBoardStatus(t.id, s.key)}
                              title={`Pindahkan ke ${s.label}`}
                            >
                              → {s.label}
                            </button>
                          ))}
                          <button
                            type="button"
                            className="board-action-btn"
                            onClick={() => setSelectedEditItem(t)}
                            title="Edit"
                            style={{ flex: '0 0 auto', padding: '4px 6px' }}
                          >
                            ✏️
                          </button>
                          <button
                            type="button"
                            className="board-action-btn danger"
                            onClick={async () => {
                              if (window.confirm('Hapus konten ini?')) {
                                await onDeleteTodo(t.id);
                              }
                            }}
                            title="Hapus"
                            style={{ flex: '0 0 auto', padding: '4px 6px' }}
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Add Card to this Column */}
                <button
                  type="button"
                  className="board-add-btn"
                  onClick={() => {
                    setAddModalInitialBulan(currentMonthKey);
                    setIsAddModalOpen(true);
                  }}
                >
                  + New page
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================= */}
      {/* ── MODALS ─────────────────────────────────────────────── */}
      {/* ========================================================= */}
      {/* Detail Modal */}
      {Boolean(selectedDetailItem) && (
        <ContentDetailModal
          isOpen={true}
          onClose={() => setSelectedDetailItem(null)}
          item={selectedDetailItem}
          pilars={pilars}
          onEdit={(item) => setSelectedEditItem(item)}
          onDelete={onDeleteTodo}
          onToggleDone={onToggleTodo}
        />
      )}

      {/* Add & Edit Modal */}
      {(isAddModalOpen || Boolean(selectedEditItem)) && (
        <AddEditContentModal
          isOpen={true}
          onClose={() => {
            setIsAddModalOpen(false);
            setSelectedEditItem(null);
          }}
          itemToEdit={selectedEditItem}
          initialBrand={activeBrand}
          initialBulan={addModalInitialBulan}
          pilars={pilars}
          onSave={async (todo) => {
            if (selectedEditItem) {
              await onUpdateTodo(todo);
            } else {
              await onSaveTodo(todo);
            }
          }}
        />
      )}

      {/* Kelola Pilar Modal */}
      {isKelolaPilarOpen && (
        <KelolaPilarModal
          isOpen={true}
          onClose={() => setIsKelolaPilarOpen(false)}
          pilars={pilars}
          onSavePilars={onSavePilars}
        />
      )}

      {/* Bulk Import JSON Modal */}
      {isBulkImportOpen && (
        <BulkImportTodosModal
          isOpen={true}
          onClose={() => setIsBulkImportOpen(false)}
          activeBrand={activeBrand}
          onImport={onBulkImportTodos}
        />
      )}
    </div>
  );
};
