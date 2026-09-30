import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { OverviewDashboard } from './components/dashboard/OverviewDashboard';
import { BukuKasView } from './components/keuangan/BukuKasView';
import { ResepView } from './components/resep/ResepView';
import { ContentPlanView } from './components/todos/ContentPlanView';
import { TasksView } from './components/tasks/TasksView';
import { AddTransactionModal } from './components/keuangan/AddTransactionModal';
import type { 
  BrandId, 
  KeuData, 
  TodoContentItem, 
  ResepItem, 
  BahanItem, 
  TaskProject, 
  TransaksiItem 
} from './types';
import { 
  loadDirectoryHandle, 
  saveDirectoryHandle, 
  requestDirectoryPermission, 
  readJsonFromHandle,
  writeJsonToHandle
} from './lib/fileSystem';
import { Sparkles } from 'lucide-react';

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
  
  // All Database States
  const [keuData, setKeuData] = useState<KeuData>(initialKeuData);
  const [todosList, setTodosList] = useState<TodoContentItem[]>([]);
  const [resepList, setResepList] = useState<ResepItem[]>([]);
  const [bahanList, setBahanList] = useState<BahanItem[]>([]);
  const [taskList, setTaskList] = useState<TaskProject[]>([]);
  
  // UI States
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Muat SELURUH data JSON dari directory handle
  const loadAllData = async (handle: FileSystemDirectoryHandle) => {
    try {
      const [keu, todos, resep, bahan, tasks] = await Promise.all([
        readJsonFromHandle<KeuData>(handle, 'keu.json', initialKeuData),
        readJsonFromHandle<TodoContentItem[]>(handle, 'todos.json', []),
        readJsonFromHandle<ResepItem[]>(handle, 'resep.json', []),
        readJsonFromHandle<BahanItem[]>(handle, 'bahan.json', []),
        readJsonFromHandle<TaskProject[]>(handle, 'todolist.json', [])
      ]);

      setKeuData(keu);
      setTodosList(todos);
      setResepList(resep);
      setBahanList(bahan);
      setTaskList(tasks);

      showToast(`✅ Database aktif: ${resep.length} resep, ${todos.length} konten, ${bahan.length} bahan`);
    } catch (err) {
      console.error('Error saat load data:', err);
      showToast('⚠️ Gagal membaca data JSON dari folder');
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
          await loadAllData(savedHandle);
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
      await loadAllData(handle);
    } catch (err: unknown) {
      if (err instanceof Error && err.name !== 'AbortError') {
        showToast('❌ Gagal memilih folder');
      }
    }
  };

  const handleRefreshData = () => {
    if (dirHandle) {
      loadAllData(dirHandle);
    }
  };

  // Simpan Transaksi Baru ke SSD (#DATA/keu.json)
  const handleSaveTransaction = async (newTrx: TransaksiItem, targetBrand: BrandId) => {
    const updatedKeu = { ...keuData };
    if (!updatedKeu[targetBrand]) {
      updatedKeu[targetBrand] = [];
    }
    updatedKeu[targetBrand] = [newTrx, ...updatedKeu[targetBrand]];
    setKeuData(updatedKeu);

    if (dirHandle) {
      const success = await writeJsonToHandle(dirHandle, 'keu.json', updatedKeu);
      if (success) {
        showToast('✅ Transaksi berhasil dicatat dan disimpan ke keu.json');
      } else {
        showToast('⚠️ Gagal menulis perubahan ke disk SSD');
      }
    } else {
      showToast('⚠️ Transaksi disimpan di memori sementara. Hubungkan folder data agar tersimpan permanen.');
    }
  };

  // Toggle status konten plan dan simpan ke disk (#DATA/todos.json)
  const handleToggleTodo = async (id: number | string) => {
    const updatedTodos = todosList.map((t) => {
      if (t.id === id) {
        return { ...t, done: !t.done, boardStatus: (!t.done ? 'done' : 'todo') as TodoContentItem['boardStatus'] };
      }
      return t;
    });
    setTodosList(updatedTodos);

    if (dirHandle) {
      await writeJsonToHandle(dirHandle, 'todos.json', updatedTodos);
      showToast('✅ Status konten diperbarui di disk');
    }
  };

  // Trigger Cloud Kasir Sync
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
        if (dirHandle) loadAllData(dirHandle);
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
        return `Content Plan Calendar — ${activeBrand.toUpperCase()}`;
      case 'tasks':
        return `Operational Tasks — ${activeBrand.toUpperCase()}`;
      case 'resep':
        return 'Katalog Menu & Resep HPP (Dikopi)';
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

      {/* Add Transaction Modal */}
      <AddTransactionModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        activeBrand={activeBrand}
        onSave={handleSaveTransaction}
      />

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
          onOpenAddModal={() => setIsAddModalOpen(true)}
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
              onAddTransaction={() => setIsAddModalOpen(true)}
            />
          )}

          {activeTab === 'todos' && (
            <ContentPlanView
              todos={todosList}
              activeBrand={activeBrand}
              onBrandChange={setActiveBrand}
              onToggleTodo={handleToggleTodo}
            />
          )}

          {activeTab === 'tasks' && (
            <TasksView
              taskList={taskList}
              activeBrand={activeBrand}
              onBrandChange={setActiveBrand}
            />
          )}

          {activeTab === 'resep' && (
            <ResepView
              resepList={resepList}
              bahanList={bahanList}
            />
          )}
        </main>
      </div>
    </div>
  );
};

export default App;
