import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { OverviewDashboard } from './components/dashboard/OverviewDashboard';
import { BukuKasView } from './components/keuangan/BukuKasView';
import type { BrandId, KeuData } from './types';
import { 
  loadDirectoryHandle, 
  saveDirectoryHandle, 
  requestDirectoryPermission, 
  readJsonFromHandle 
} from './lib/fileSystem';
import { Sparkles, CalendarDays, CheckSquare, UtensilsCrossed } from 'lucide-react';

const initialKeuData: KeuData = {
  dikopi: [],
  kolektiva: [],
  imagineer: [],
  studio: [],
};

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [activeBrand, setActiveBrand] = useState<BrandId>('dikopi');
  const [dirHandle, setDirHandle] = useState<FileSystemDirectoryHandle | null>(null);
  const [folderName, setFolderName] = useState<string | null>(null);
  const [keuData, setKeuData] = useState<KeuData>(initialKeuData);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Muat data dari directory handle
  const loadData = async (handle: FileSystemDirectoryHandle) => {
    try {
      const keu = await readJsonFromHandle<KeuData>(handle, 'keu.json', initialKeuData);
      setKeuData(keu);
      showToast('✅ Data berhasil dimuat dari SSD');
    } catch (err) {
      console.error('Error saat load JSON:', err);
      showToast('⚠️ Gagal membaca data JSON');
    }
  };

  // Inisialisasi: Periksa handle tersimpan di IndexedDB
  useEffect(() => {
    const initFolder = async () => {
      const savedHandle = await loadDirectoryHandle();
      if (savedHandle) {
        const hasPermission = await requestDirectoryPermission(savedHandle);
        if (hasPermission) {
          setDirHandle(savedHandle);
          setFolderName(savedHandle.name);
          await loadData(savedHandle);
        }
      }
    };
    initFolder();
  }, []);

  // Hubungkan folder #DATA via File System Access API
  const handleConnectFolder = async () => {
    try {
      const pickerWindow = window as unknown as {
        showDirectoryPicker?: (options?: { mode?: string }) => Promise<FileSystemDirectoryHandle>;
      };
      if (!pickerWindow.showDirectoryPicker) {
        showToast('Browser ini tidak mendukung File System Access API');
        return;
      }
      const handle = await pickerWindow.showDirectoryPicker({ mode: 'readwrite' });
      setDirHandle(handle);
      setFolderName(handle.name);
      await saveDirectoryHandle(handle);
      await loadData(handle);
    } catch (err: unknown) {
      if (err instanceof Error && err.name !== 'AbortError') {
        showToast('❌ Gagal memilih folder');
      }
    }
  };

  const handleRefreshData = () => {
    if (dirHandle) {
      loadData(dirHandle);
    }
  };

  const handleTriggerSync = async () => {
    showToast('🔄 Menghubungi POS kasir bridge server...');
    try {
      const res = await fetch('http://localhost:3000/api/sync-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (res.ok) {
        const data = await res.json();
        showToast(data.message || '✅ Sinkronisasi kasir berhasil!');
        if (dirHandle) loadData(dirHandle);
      } else {
        showToast('⚠️ Gagal terhubung ke kasir server (port 3000)');
      }
    } catch {
      showToast('⚠️ POS Server offline di localhost:3000. Nyalakan dengan "npm start" di dikopi-kasir.');
    }
  };

  const getPageTitle = () => {
    switch (activeTab) {
      case 'dashboard':
        return 'Executive Overview Dashboard';
      case 'keuangan':
        return `Buku Kas — ${activeBrand.toUpperCase()}`;
      case 'todos':
        return 'Content Plan Calendar';
      case 'tasks':
        return 'Task & Project Board';
      case 'resep':
        return 'Katalog Menu & Resep HPP';
      default:
        return 'Pratani Creative HQ';
    }
  };

  return (
    <div className="flex min-h-screen bg-[#0a0e17] text-slate-100">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 px-4 py-2.5 rounded-xl bg-surface-2 border border-white/10 text-xs font-semibold text-white shadow-2xl flex items-center gap-2 animate-bounce">
          <Sparkles className="w-4 h-4 text-sky-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        activeBrand={activeBrand}
        setActiveBrand={setActiveBrand}
        onTriggerSync={handleTriggerSync}
      />

      {/* Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          title={getPageTitle()}
          folderName={folderName}
          onConnectFolder={handleConnectFolder}
          onRefreshData={handleRefreshData}
          onOpenAddModal={() => showToast('Form tambah transaksi')}
        />

        <main className="flex-1 p-6 max-w-7xl w-full mx-auto">
          {activeTab === 'dashboard' && (
            <OverviewDashboard
              keuData={keuData}
              activeBrand={activeBrand}
              onNavigateToKeuangan={(brand) => {
                if (brand) setActiveBrand(brand);
                setActiveTab('keuangan');
              }}
            />
          )}

          {activeTab === 'keuangan' && (
            <BukuKasView
              keuData={keuData}
              activeBrand={activeBrand}
              onBrandChange={setActiveBrand}
              onTriggerSync={handleTriggerSync}
            />
          )}

          {activeTab === 'todos' && (
            <div className="glass-card p-8 rounded-2xl border border-white/5 text-center">
              <CalendarDays className="w-10 h-10 text-amber-400 mx-auto mb-3" />
              <h4 className="text-base font-bold text-white">Content Plan Calendar</h4>
              <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
                Jadwal posting dan pilar konten untuk {activeBrand.toUpperCase()} siap dimigrasikan ke komponen modern.
              </p>
            </div>
          )}

          {activeTab === 'tasks' && (
            <div className="glass-card p-8 rounded-2xl border border-white/5 text-center">
              <CheckSquare className="w-10 h-10 text-purple-400 mx-auto mb-3" />
              <h4 className="text-base font-bold text-white">To-Do List Kanban Board</h4>
              <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
                Manajemen backlog dan task operasional multi-brand Pratani.
              </p>
            </div>
          )}

          {activeTab === 'resep' && (
            <div className="glass-card p-8 rounded-2xl border border-white/5 text-center">
              <UtensilsCrossed className="w-10 h-10 text-amber-400 mx-auto mb-3" />
              <h4 className="text-base font-bold text-white">Katalog Resep & Margin F&B</h4>
              <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
                Manajemen bahan baku, takaran gramasi, dan kalkulasi HPP otomatis Dikopi.
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default App;
