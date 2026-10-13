import React, { useState } from 'react';
import type { BrandId } from '../../types';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  activeBrand: BrandId;
  setActiveBrand: (brand: BrandId) => void;
  folderName?: string | null;
  onConnectFolder?: () => void;
  onRefreshData?: () => void;
  syncStatus?: string;
  onTriggerSync?: () => void;
  onPushCloud?: () => void;
  onPushResep?: () => void;
  trashCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  activeBrand,
  setActiveBrand,
  folderName,
  onConnectFolder,
  onRefreshData,
  onTriggerSync,
  onPushCloud,
  onPushResep,
  trashCount = 0
}) => {
  const brands: { id: BrandId; name: string; icon: string; color: string }[] = [
    { id: 'dikopi', name: 'Dikopi F&B', icon: '☕', color: 'var(--dikopi)' },
    { id: 'kolektiva', name: 'Kolektiva', icon: '🛍️', color: 'var(--kolektiva)' },
    { id: 'imagineer', name: 'Imagineer', icon: '✨', color: 'var(--imagineer)' },
  ];

  // Dropdown states
  const isKeuActive = [
    'keuangan',
    'keu_dashboard',
    'keu_buku',
    'keu_bulanan',
    'keu_tahunan',
    'keu_nota',
    'keu_hutang'
  ].includes(activeTab);

  const isGenDokActive = [
    'generator_dokumen',
    'gen_invoice',
    'gen_penawaran',
    'gen_rab',
    'gen_mou',
    'gen_bast',
    'gen_kwitansi',
    'kolektiva-docs'
  ].includes(activeTab);

  const [isKeuExpanded, setIsKeuExpanded] = useState<boolean | null>(null);
  const [isGenDokExpanded, setIsGenDokExpanded] = useState<boolean | null>(null);

  const isKeuOpen = isKeuExpanded !== null ? isKeuExpanded : isKeuActive;
  const isGenDokOpen = isGenDokExpanded !== null ? isGenDokExpanded : isGenDokActive;

  return (
    <aside className="sidebar">
      {/* Sidebar Logo */}
      <div className="sidebar-logo">
        <div className="wordmark">Pratani Creative</div>
        <div className="sub">HQ V4.2</div>
      </div>

      {/* Brand Unit Quick Selector */}
      <div style={{ padding: '10px 12px 6px' }}>
        <div className="nav-section-label" style={{ padding: '0 0 6px 4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Unit Brand</span>
          {activeBrand === 'pratani' && (
            <span style={{ fontSize: '9.5px', color: 'var(--accent)', fontFamily: 'DM Mono' }}>
              ● Holding
            </span>
          )}
        </div>

        <button
          onClick={() => setActiveBrand('pratani')}
          style={{
            width: '100%',
            marginBottom: '4px',
            padding: '5px 8px',
            borderRadius: '7px',
            fontSize: '11px',
            fontWeight: 600,
            fontFamily: 'inherit',
            cursor: 'pointer',
            border: activeBrand === 'pratani' ? '1px solid var(--accent)' : '1px solid var(--border)',
            background: activeBrand === 'pratani' ? 'var(--surface3)' : 'var(--surface2)',
            color: activeBrand === 'pratani' ? 'var(--accent)' : 'var(--muted)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            transition: 'all 0.15s ease'
          }}
          title="Semua Unit Brand (Holding Pratani Creative)"
        >
          <span style={{ fontSize: '12px' }}>🌐</span>
          <span>Semua (Holding)</span>
        </button>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px' }}>
          {brands.map((b) => (
            <button
              key={b.id}
              onClick={() => setActiveBrand(b.id)}
              style={{
                padding: '6px 4px',
                borderRadius: '7px',
                fontSize: '11px',
                fontWeight: 600,
                fontFamily: 'inherit',
                cursor: 'pointer',
                border: activeBrand === b.id ? `1px solid ${b.color}` : '1px solid var(--border)',
                background: activeBrand === b.id ? 'var(--surface3)' : 'var(--surface2)',
                color: activeBrand === b.id ? b.color : 'var(--muted)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '2px',
                transition: 'all 0.15s ease'
              }}
              title={b.name}
            >
              <span style={{ fontSize: '13px' }}>{b.icon}</span>
              <span style={{ textTransform: 'capitalize', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%' }}>
                {b.id}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Sidebar Navigation */}
      <div className="sidebar-nav">
        {/* OVERVIEW */}
        <div className="nav-section-label">OVERVIEW</div>
        <div
          className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
        >
          <span className="icon">⚡</span>
          <span>Dashboard</span>
        </div>

        {/* MANAJEMEN */}
        <div className="nav-section-label">MANAJEMEN</div>
        <div
          className={`nav-item ${activeTab === 'todos' ? 'active' : ''}`}
          onClick={() => setActiveTab('todos')}
        >
          <span className="icon">📅</span>
          <span>Content Plan</span>
        </div>

        <div
          className={`nav-item ${activeTab === 'todolist' || activeTab === 'tasks' ? 'active' : ''}`}
          onClick={() => setActiveTab('todolist')}
        >
          <span className="icon">✅</span>
          <span>To-Do List</span>
        </div>

        <div
          className={`nav-item ${activeTab === 'projects' ? 'active' : ''}`}
          onClick={() => setActiveTab('projects')}
        >
          <span className="icon">💼</span>
          <span>Projects</span>
        </div>

        <div
          className={`nav-item ${activeTab === 'dokumen' ? 'active' : ''}`}
          onClick={() => setActiveTab('dokumen')}
        >
          <span className="icon">📁</span>
          <span>Dokumen</span>
        </div>

        {/* Keuangan Dropdown */}
        <div
          className={`nav-item nav-dropdown-trigger ${isKeuActive ? 'active' : ''}`}
          onClick={() => setIsKeuExpanded(!isKeuOpen)}
          style={{ justifyContent: 'space-between' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="icon">💰</span>
            <span>Keuangan</span>
          </div>
          <span style={{ fontSize: '11px', color: 'var(--muted)', transition: 'transform 0.2s', transform: isKeuOpen ? 'rotate(0deg)' : 'rotate(-90deg)' }}>
            ▾
          </span>
        </div>
        {isKeuOpen && (
          <div className="nav-tree-sub" style={{ marginBottom: '4px' }}>
            <div
              className={`nav-subitem ${activeTab === 'keu_dashboard' ? 'active' : ''}`}
              onClick={() => setActiveTab('keu_dashboard')}
            >
              📊 Dashboard
            </div>
            <div
              className={`nav-subitem ${activeTab === 'keu_buku' || activeTab === 'keuangan' ? 'active' : ''}`}
              onClick={() => setActiveTab('keu_buku')}
            >
              📒 Buku Kas
            </div>
            <div
              className={`nav-subitem ${activeTab === 'keu_bulanan' ? 'active' : ''}`}
              onClick={() => setActiveTab('keu_bulanan')}
            >
              📅 Rekap Bulanan
            </div>
            <div
              className={`nav-subitem ${activeTab === 'keu_tahunan' ? 'active' : ''}`}
              onClick={() => setActiveTab('keu_tahunan')}
            >
              📆 Rekap Tahunan
            </div>
            <div
              className={`nav-subitem ${activeTab === 'keu_nota' ? 'active' : ''}`}
              onClick={() => setActiveTab('keu_nota')}
            >
              🗂️ Dokumen & Nota
            </div>
            <div
              className={`nav-subitem ${activeTab === 'keu_hutang' ? 'active' : ''}`}
              onClick={() => setActiveTab('keu_hutang')}
            >
              💳 Hutang & Cicilan
            </div>
          </div>
        )}

        <div
          className={`nav-item ${activeTab === 'kontak' ? 'active' : ''}`}
          onClick={() => setActiveTab('kontak')}
        >
          <span className="icon">👥</span>
          <span>Kontak</span>
        </div>

        <div
          className={`nav-item ${activeTab === 'hpp' ? 'active' : ''}`}
          onClick={() => setActiveTab('hpp')}
        >
          <span className="icon">🧮</span>
          <span>Kalkulator HPP</span>
        </div>

        {/* BRAND INTEL */}
        <div className="nav-section-label">BRAND INTEL</div>
        <div
          className={`nav-item ${activeTab === 'resep' ? 'active' : ''}`}
          onClick={() => setActiveTab('resep')}
        >
          <span className="icon">☕</span>
          <span>Resep Dikopi</span>
        </div>

        <div
          className={`nav-item ${activeTab === 'produk_kolektiva' ? 'active' : ''}`}
          onClick={() => setActiveTab('produk_kolektiva')}
        >
          <span className="icon">🛍️</span>
          <span>Produk Kolektiva</span>
        </div>

        {/* TOOLS */}
        <div className="nav-section-label">TOOLS</div>
        <div
          className={`nav-item nav-dropdown-trigger ${isGenDokActive ? 'active' : ''}`}
          onClick={() => setIsGenDokExpanded(!isGenDokOpen)}
          style={{ justifyContent: 'space-between' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="icon">📄</span>
            <span>Generator Dokumen</span>
          </div>
          <span style={{ fontSize: '11px', color: 'var(--muted)', transition: 'transform 0.2s', transform: isGenDokOpen ? 'rotate(0deg)' : 'rotate(-90deg)' }}>
            ▾
          </span>
        </div>
        {isGenDokOpen && (
          <div className="nav-tree-sub" style={{ marginBottom: '4px' }}>
            <div
              className={`nav-subitem ${activeTab === 'gen_invoice' ? 'active' : ''}`}
              onClick={() => setActiveTab('gen_invoice')}
            >
              🧾 Invoice
            </div>
            <div
              className={`nav-subitem ${activeTab === 'gen_penawaran' ? 'active' : ''}`}
              onClick={() => setActiveTab('gen_penawaran')}
            >
              📋 Surat Penawaran
            </div>
            <div
              className={`nav-subitem ${activeTab === 'gen_rab' ? 'active' : ''}`}
              onClick={() => setActiveTab('gen_rab')}
            >
              📊 RAB
            </div>
            <div
              className={`nav-subitem ${activeTab === 'gen_mou' ? 'active' : ''}`}
              onClick={() => setActiveTab('gen_mou')}
            >
              🤝 MoU
            </div>
            <div
              className={`nav-subitem ${activeTab === 'gen_bast' ? 'active' : ''}`}
              onClick={() => setActiveTab('gen_bast')}
            >
              ✅ BAST
            </div>
            <div
              className={`nav-subitem ${activeTab === 'gen_kwitansi' ? 'active' : ''}`}
              onClick={() => setActiveTab('gen_kwitansi')}
            >
              🧾 Kwitansi
            </div>
          </div>
        )}
      </div>

      {/* Sidebar Bottom (Sampah & Folder & Cloud Sync) */}
      <div className="sidebar-bottom">
        <div
          className={`sidebar-trash-row ${activeTab === 'sampah' ? 'active' : ''}`}
          onClick={() => setActiveTab('sampah')}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '13px' }}>🗑️</span>
            <span>Sampah</span>
          </div>
          {trashCount > 0 && (
            <span
              style={{
                background: 'var(--red)',
                color: '#fff',
                fontSize: '9.5px',
                padding: '1px 6px',
                borderRadius: '99px',
                fontFamily: "'DM Mono', monospace",
                fontWeight: 600
              }}
            >
              {trashCount}
            </span>
          )}
        </div>

        <div className="sidebar-folder">
          <div className="folder-header">
            <span className="folder-status">📂 DATA FOLDER</span>
            <span className="folder-path" id="folderPath" title={folderName || 'Belum dipilih'}>
              {folderName || 'Belum dipilih'}
            </span>
          </div>
          <div className="folder-btn-grid">
            <button
              className="folder-btn-mini"
              onClick={onConnectFolder}
              title="Pilih / Ganti Folder Data"
            >
              📁 {folderName ? 'Ganti' : 'Pilih'}
            </button>
            <button
              className="folder-btn-mini btn-refresh"
              onClick={onRefreshData}
              title="Refresh Data dari Disk"
            >
              🔄 Refresh
            </button>
          </div>
        </div>

        {/* Firebase Sync Card (Contextual Dikopi) */}
        {activeBrand === 'dikopi' && (
          <div className="fb-sync-card">
            <div className="fb-sync-header">
              <span>☁️ DIKOPI CLOUD SYNC</span>
              <span className="fb-sync-badge">ONLINE</span>
            </div>
            <div className="fb-sync-actions">
              <button
                className="fb-btn-action fb-btn-pull"
                onClick={onTriggerSync}
                title="Tarik Transaksi dari Kasir"
              >
                <span>📥</span> Tarik Transaksi Kasir
              </button>
              <div className="fb-btn-row" style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
                <button
                  className="fb-btn-action fb-btn-push"
                  style={{ flex: 1 }}
                  onClick={onPushCloud}
                  title="Push / Override ke Cloud"
                >
                  <span>📤</span> Push Data
                </button>
                <button
                  className="fb-btn-action fb-btn-recipe"
                  style={{ flex: 1 }}
                  onClick={onPushResep}
                  title="Push Resep Menu ke Cloud"
                >
                  <span>☕</span> Resep
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
