import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { OverviewDashboard } from './components/dashboard/OverviewDashboard';
import { BukuKasView } from './components/keuangan/BukuKasView';
import { ResepView } from './components/resep/ResepView';
import { ContentPlanView } from './components/todos/ContentPlanView';
import { TasksView } from './components/tasks/TasksView';
import { ProjectsView } from './components/projects/ProjectsView';
import { DokumenView } from './components/dokumen/DokumenView';
import { 
  KeuDashboardView, 
  KeuRekapBulananView, 
  KeuRekapTahunanView, 
  KeuNotaGalleryView, 
  KeuHutangView 
} from './components/keuangan/KeuSubViews';
import { KontakView } from './components/kontak/KontakView';
import { KalkulatorHppView } from './components/hpp/KalkulatorHppView';
import { ProdukKolektivaView } from './components/kolektiva/ProdukKolektivaView';
import { GeneratorDokumenView, type GenDocType } from './components/tools/GeneratorDokumenView';
import { SampahView } from './components/trash/SampahView';
import { KolektivaDocView } from './components/kolektiva/KolektivaDocView';
import { AddTransactionModal } from './components/keuangan/AddTransactionModal';
import type { 
  BrandId, 
  KeuData, 
  TodoContentItem, 
  PilarItem,
  ResepItem, 
  BahanItem, 
  ResepGroupItem,
  TaskProject, 
  TransaksiItem,
  AsetItem,
  HistoryEntry,
  ProjectItem,
  FolderItem,
  DokumenFileItem,
  HutangItem,
  KontakItem,
  ProdukKolektivaItem,
  TrashItem
} from './types';
import { DEFAULT_PILARS } from './lib/contentPlanUtils';
import { 
  loadDirectoryHandle, 
  saveDirectoryHandle, 
  requestDirectoryPermission, 
  readJsonFromHandle,
  writeJsonToHandle
} from './lib/fileSystem';
import { 
  pullCloudTransactions, 
  pushTransactionsToCloud,
  updateCloudTransaction,
  deleteCloudTransaction,
  pushRecipesToCloud
} from './lib/firebase';
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
  const [pilarsList, setPilarsList] = useState<PilarItem[]>(DEFAULT_PILARS);
  const [resepList, setResepList] = useState<ResepItem[]>([]);
  const [bahanList, setBahanList] = useState<BahanItem[]>([]);
  const [taskList, setTaskList] = useState<TaskProject[]>([]);
  const [asetList, setAsetList] = useState<AsetItem[]>([]);
  const [historyList, setHistoryList] = useState<HistoryEntry[]>([]);
  const [projectsList, setProjectsList] = useState<ProjectItem[]>([]);
  const [foldersList, setFoldersList] = useState<FolderItem[]>([]);
  const [dokumenList, setDokumenList] = useState<DokumenFileItem[]>([]);
  const [hutangList, setHutangList] = useState<HutangItem[]>([]);
  const [kontakList, setKontakList] = useState<KontakItem[]>([]);
  const [produkList, setProdukList] = useState<ProdukKolektivaItem[]>([]);
  const [trashList, setTrashList] = useState<TrashItem[]>([]);
  
  // Cross-view bridge states
  const [selectedProdukForHpp, setSelectedProdukForHpp] = useState<number | string | null>(null);

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
      const [
        keu, 
        todos, 
        pilars, 
        resep, 
        bahan, 
        tasks, 
        aset, 
        history,
        projects,
        folders,
        dokumen,
        hutang,
        kontak,
        produk,
        trash
      ] = await Promise.all([
        readJsonFromHandle<KeuData>(handle, 'keu.json', initialKeuData),
        readJsonFromHandle<TodoContentItem[]>(handle, 'todos.json', []),
        readJsonFromHandle<PilarItem[]>(handle, 'pilars.json', DEFAULT_PILARS),
        readJsonFromHandle<ResepItem[]>(handle, 'resep.json', []),
        readJsonFromHandle<BahanItem[]>(handle, 'bahan.json', []),
        readJsonFromHandle<TaskProject[]>(handle, 'todolist.json', []),
        readJsonFromHandle<AsetItem[]>(handle, 'aset.json', []),
        readJsonFromHandle<HistoryEntry[]>(handle, 'history.json', []),
        readJsonFromHandle<ProjectItem[]>(handle, 'projects.json', []),
        readJsonFromHandle<FolderItem[]>(handle, 'folders.json', []),
        readJsonFromHandle<DokumenFileItem[]>(handle, 'dokumen.json', []),
        readJsonFromHandle<HutangItem[]>(handle, 'hutang.json', []),
        readJsonFromHandle<KontakItem[]>(handle, 'kontak.json', []),
        readJsonFromHandle<ProdukKolektivaItem[]>(handle, 'produk.json', []),
        readJsonFromHandle<TrashItem[]>(handle, 'trash.json', [])
      ]);

      setKeuData(keu);
      setTodosList(todos);
      setPilarsList(pilars && pilars.length ? pilars : DEFAULT_PILARS);
      setResepList(resep);
      setBahanList(bahan);
      setTaskList(tasks);
      setAsetList(aset);
      setHistoryList(history);
      setProjectsList(projects);
      setFoldersList(folders);
      setDokumenList(dokumen);
      setHutangList(hutang);
      setKontakList(kontak);
      setProdukList(produk);
      setTrashList(trash);

      showToast(`✅ Database aktif: ${resep.length} resep, ${todos.length} konten, ${produk.length} produk, ${projects.length} proyek`);
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

  // ── KEUANGAN TRANSAKSI HANDLERS ──
  const handleSaveTransaction = async (
    newTrx: TransaksiItem, 
    targetBrand: BrandId, 
    newAset?: AsetItem
  ) => {
    const updatedKeu = { ...keuData };
    if (!updatedKeu[targetBrand]) {
      updatedKeu[targetBrand] = [];
    }
    updatedKeu[targetBrand] = [newTrx, ...updatedKeu[targetBrand]];
    setKeuData(updatedKeu);

    let updatedAsetList = asetList;
    if (newAset) {
      updatedAsetList = [newAset, ...asetList];
      setAsetList(updatedAsetList);
    }

    if (dirHandle) {
      await writeJsonToHandle(dirHandle, 'keu.json', updatedKeu);
      if (newAset) {
        await writeJsonToHandle(dirHandle, 'aset.json', updatedAsetList);
      }
      showToast('✅ Transaksi berhasil dicatat dan disimpan ke disk');
    } else {
      showToast('⚠️ Transaksi disimpan di memori sementara.');
    }
  };

  const handleSaveBatchTransactions = async (
    trxs: TransaksiItem[], 
    targetBrand: BrandId
  ) => {
    const updatedKeu = { ...keuData };
    if (!updatedKeu[targetBrand]) {
      updatedKeu[targetBrand] = [];
    }
    updatedKeu[targetBrand] = [...trxs, ...updatedKeu[targetBrand]];
    setKeuData(updatedKeu);

    if (dirHandle) {
      await writeJsonToHandle(dirHandle, 'keu.json', updatedKeu);
      showToast(`✅ ${trxs.length} transaksi berhasil dicatat ke disk!`);
    } else {
      showToast('⚠️ Transaksi disimpan sementara di memori.');
    }
  };

  const handleUpdateTransaction = async (
    updatedTrx: TransaksiItem, 
    targetBrand: BrandId
  ) => {
    const currentList = (keuData[targetBrand] as TransaksiItem[]) || [];
    const oldTrx = currentList.find((x) => String(x.id) === String(updatedTrx.id));

    let updatedHistory = historyList;
    if (oldTrx) {
      const snapEntry: HistoryEntry = {
        id: Date.now(),
        brand: targetBrand,
        txnId: updatedTrx.id,
        editedAt: new Date().toISOString(),
        snapshot: JSON.parse(JSON.stringify(oldTrx))
      };
      updatedHistory = [snapEntry, ...historyList];
      setHistoryList(updatedHistory);
    }

    const updatedList = currentList.map((t) =>
      String(t.id) === String(updatedTrx.id) ? updatedTrx : t
    );
    const updatedKeu = { ...keuData, [targetBrand]: updatedList };
    setKeuData(updatedKeu);

    if (dirHandle) {
      await writeJsonToHandle(dirHandle, 'keu.json', updatedKeu);
      if (oldTrx) {
        await writeJsonToHandle(dirHandle, 'history.json', updatedHistory);
      }
    }

    if (targetBrand === 'dikopi') {
      await updateCloudTransaction(updatedTrx);
    }

    showToast('✅ Transaksi diperbarui (Lokal & Cloud)!');
  };

  const handleDeleteTransaction = async (
    trxId: string | number, 
    targetBrand: BrandId
  ) => {
    const currentList = (keuData[targetBrand] as TransaksiItem[]) || [];
    const updatedList = currentList.filter((t) => String(t.id) !== String(trxId));
    const updatedKeu = { ...keuData, [targetBrand]: updatedList };
    setKeuData(updatedKeu);

    if (dirHandle) {
      await writeJsonToHandle(dirHandle, 'keu.json', updatedKeu);
    }

    if (targetBrand === 'dikopi') {
      await deleteCloudTransaction(trxId);
    }

    showToast('✅ Transaksi berhasil dihapus (Lokal & Cloud)!');
  };

  const handleSaveSaldoAwal = async (
    periode: string, 
    cash: number, 
    rek: number
  ) => {
    const currentMeta = { ...(keuData._meta || {}) } as Record<string, any>;
    currentMeta[`dikopi_cash_${periode}`] = cash;
    currentMeta[`dikopi_rek_${periode}`] = rek;
    currentMeta[`dikopi_setup_${periode}`] = true;

    const updatedKeu: KeuData = {
      ...keuData,
      _meta: currentMeta
    };
    setKeuData(updatedKeu);

    if (dirHandle) {
      await writeJsonToHandle(dirHandle, 'keu.json', updatedKeu);
      showToast('✅ Saldo awal berhasil disimpan ke keu.json');
    }
  };

  const handleRestoreSnapshot = async (
    snapshot: TransaksiItem, 
    targetBrand: BrandId
  ) => {
    await handleUpdateTransaction(snapshot, targetBrand);
    showToast('✅ Versi transaksi berhasil dipulihkan (Restore)!');
  };

  // ── CONTENT PLAN HANDLERS ──
  const handleSaveTodo = async (newTodo: TodoContentItem) => {
    const updatedTodos = [newTodo, ...todosList];
    setTodosList(updatedTodos);
    if (dirHandle) {
      await writeJsonToHandle(dirHandle, 'todos.json', updatedTodos);
      showToast('✅ Konten planning berhasil ditambahkan!');
    }
  };

  const handleUpdateTodo = async (updatedTodo: TodoContentItem) => {
    const updatedTodos = todosList.map((t) => (t.id === updatedTodo.id ? updatedTodo : t));
    setTodosList(updatedTodos);
    if (dirHandle) {
      await writeJsonToHandle(dirHandle, 'todos.json', updatedTodos);
      showToast('✅ Konten planning berhasil diperbarui!');
    }
  };

  const handleDeleteTodo = async (id: number | string) => {
    const itemToDelete = todosList.find((t) => t.id === id);
    const updatedTodos = todosList.filter((t) => t.id !== id);
    setTodosList(updatedTodos);

    if (itemToDelete) {
      const trashItem: TrashItem = {
        id: Date.now(),
        originalTable: 'todos',
        label: itemToDelete.judul,
        deletedAt: new Date().toISOString(),
        item: itemToDelete
      };
      const updatedTrash = [trashItem, ...trashList];
      setTrashList(updatedTrash);
      if (dirHandle) {
        await writeJsonToHandle(dirHandle, 'trash.json', updatedTrash);
      }
    }

    if (dirHandle) {
      await writeJsonToHandle(dirHandle, 'todos.json', updatedTodos);
      showToast('🗑️ Konten planning dipindahkan ke sampah');
    }
  };

  const handleToggleTodo = async (id: number | string) => {
    const updatedTodos = todosList.map((t) => {
      if (t.id === id) {
        const nextDone = !t.done;
        return {
          ...t,
          done: nextDone,
          boardStatus: (nextDone ? 'done' : 'not_started') as TodoContentItem['boardStatus']
        };
      }
      return t;
    });
    setTodosList(updatedTodos);

    if (dirHandle) {
      await writeJsonToHandle(dirHandle, 'todos.json', updatedTodos);
      showToast('✅ Status konten diperbarui di disk');
    }
  };

  const handleSetBoardStatus = async (
    id: number | string,
    status: 'not_started' | 'in_progress' | 'done'
  ) => {
    const updatedTodos = todosList.map((t) => {
      if (t.id === id) {
        return {
          ...t,
          boardStatus: status,
          done: status === 'done'
        };
      }
      return t;
    });
    setTodosList(updatedTodos);

    if (dirHandle) {
      await writeJsonToHandle(dirHandle, 'todos.json', updatedTodos);
      showToast(`✅ Status konten diubah ke ${status === 'done' ? 'Done' : status === 'in_progress' ? 'In Progress' : 'Not Started'}`);
    }
  };

  const handleSavePilars = async (newPilars: PilarItem[]) => {
    setPilarsList(newPilars);
    if (dirHandle) {
      await writeJsonToHandle(dirHandle, 'pilars.json', newPilars);
      showToast('✅ Konten pilar berhasil disimpan ke pilars.json');
    }
  };

  const handleBulkImportTodos = async (
    importedItems: TodoContentItem[],
    mode: 'append' | 'replaceBrand',
    targetBrand?: string
  ) => {
    let updatedTodos: TodoContentItem[];
    if (mode === 'replaceBrand' && targetBrand) {
      const otherBrandTodos = todosList.filter((t) => t.brand !== targetBrand);
      updatedTodos = [...otherBrandTodos, ...importedItems];
    } else {
      const existingIds = new Set(todosList.map((t) => String(t.id)));
      const sanitized = importedItems.map((item, idx) => {
        let safeId = item.id;
        if (!safeId || existingIds.has(String(safeId))) {
          safeId = Date.now() + idx;
        }
        return { ...item, id: safeId };
      });
      updatedTodos = [...todosList, ...sanitized];
    }
    setTodosList(updatedTodos);

    if (dirHandle) {
      await writeJsonToHandle(dirHandle, 'todos.json', updatedTodos);
      showToast(`✅ ${importedItems.length} konten berhasil diimport ke todos.json!`);
    }
  };

  // ── TASKS / TODOLIST HANDLER ──
  const handleSaveTaskList = async (updatedList: TaskProject[]) => {
    setTaskList(updatedList);
    if (dirHandle) {
      await writeJsonToHandle(dirHandle, 'todolist.json', updatedList);
      showToast('✅ To-Do List berhasil disimpan ke disk');
    }
  };

  // ── PROJECTS HANDLERS ──
  const handleSaveProject = async (p: ProjectItem) => {
    const updated = [p, ...projectsList];
    setProjectsList(updated);
    if (dirHandle) {
      await writeJsonToHandle(dirHandle, 'projects.json', updated);
      showToast('✅ Proyek baru berhasil ditambahkan');
    }
  };

  const handleUpdateProject = async (p: ProjectItem) => {
    const updated = projectsList.map((item) => (item.id === p.id ? p : item));
    setProjectsList(updated);
    if (dirHandle) {
      await writeJsonToHandle(dirHandle, 'projects.json', updated);
      showToast('✅ Proyek berhasil diperbarui');
    }
  };

  const handleDeleteProject = async (id: number | string) => {
    const itemToDelete = projectsList.find((p) => p.id === id);
    const updated = projectsList.filter((p) => p.id !== id);
    setProjectsList(updated);

    if (itemToDelete) {
      const trashItem: TrashItem = {
        id: Date.now(),
        originalTable: 'projects',
        label: itemToDelete.nama,
        deletedAt: new Date().toISOString(),
        item: itemToDelete
      };
      const updatedTrash = [trashItem, ...trashList];
      setTrashList(updatedTrash);
      if (dirHandle) {
        await writeJsonToHandle(dirHandle, 'trash.json', updatedTrash);
      }
    }

    if (dirHandle) {
      await writeJsonToHandle(dirHandle, 'projects.json', updated);
      showToast('🗑️ Proyek dipindahkan ke sampah');
    }
  };

  // ── DOKUMEN & FOLDERS HANDLERS ──
  const handleSaveFolder = async (f: FolderItem) => {
    const updated = [f, ...foldersList];
    setFoldersList(updated);
    if (dirHandle) {
      await writeJsonToHandle(dirHandle, 'folders.json', updated);
      showToast('📁 Folder baru berhasil dibuat');
    }
  };

  const handleUpdateFolder = async (f: FolderItem) => {
    const updated = foldersList.map((item) => (item.id === f.id ? f : item));
    setFoldersList(updated);
    if (dirHandle) {
      await writeJsonToHandle(dirHandle, 'folders.json', updated);
      showToast('📁 Folder berhasil diperbarui');
    }
  };

  const handleDeleteFolder = async (id: number | string) => {
    const itemToDelete = foldersList.find((f) => f.id === id);
    const updated = foldersList.filter((f) => f.id !== id);
    setFoldersList(updated);

    if (itemToDelete) {
      const trashItem: TrashItem = {
        id: Date.now(),
        originalTable: 'folder_tree',
        label: itemToDelete.name,
        isFolder: true,
        deletedAt: new Date().toISOString(),
        item: itemToDelete
      };
      const updatedTrash = [trashItem, ...trashList];
      setTrashList(updatedTrash);
      if (dirHandle) {
        await writeJsonToHandle(dirHandle, 'trash.json', updatedTrash);
      }
    }

    if (dirHandle) {
      await writeJsonToHandle(dirHandle, 'folders.json', updated);
      showToast('🗑️ Folder dipindahkan ke sampah');
    }
  };

  const handleSaveFile = async (f: DokumenFileItem) => {
    const updated = [f, ...dokumenList];
    setDokumenList(updated);
    if (dirHandle) {
      await writeJsonToHandle(dirHandle, 'dokumen.json', updated);
      showToast('📄 File berhasil diunggah dan dicatat');
    }
  };

  const handleDeleteFile = async (id: number | string) => {
    const itemToDelete = dokumenList.find((f) => f.id === id);
    const updated = dokumenList.filter((f) => f.id !== id);
    setDokumenList(updated);

    if (itemToDelete) {
      const trashItem: TrashItem = {
        id: Date.now(),
        originalTable: 'dokumen',
        label: itemToDelete.origName,
        deletedAt: new Date().toISOString(),
        item: itemToDelete
      };
      const updatedTrash = [trashItem, ...trashList];
      setTrashList(updatedTrash);
      if (dirHandle) {
        await writeJsonToHandle(dirHandle, 'trash.json', updatedTrash);
      }
    }

    if (dirHandle) {
      await writeJsonToHandle(dirHandle, 'dokumen.json', updated);
      showToast('🗑️ File dipindahkan ke sampah');
    }
  };

  // ── HUTANG HANDLERS ──
  const handleSaveHutang = async (h: HutangItem) => {
    const updated = [h, ...hutangList];
    setHutangList(updated);
    if (dirHandle) {
      await writeJsonToHandle(dirHandle, 'hutang.json', updated);
      showToast('💳 Catatan hutang berhasil disimpan');
    }
  };

  const handleUpdateHutang = async (h: HutangItem) => {
    const updated = hutangList.map((item) => (item.id === h.id ? h : item));
    setHutangList(updated);
    if (dirHandle) {
      await writeJsonToHandle(dirHandle, 'hutang.json', updated);
      showToast('💳 Data hutang & cicilan diperbarui');
    }
  };

  const handleDeleteHutang = async (id: number | string) => {
    const updated = hutangList.filter((h) => h.id !== id);
    setHutangList(updated);
    if (dirHandle) {
      await writeJsonToHandle(dirHandle, 'hutang.json', updated);
      showToast('🗑️ Data hutang berhasil dihapus');
    }
  };

  // ── KONTAK HANDLERS ──
  const handleSaveKontak = async (k: KontakItem) => {
    const updated = [k, ...kontakList];
    setKontakList(updated);
    if (dirHandle) {
      await writeJsonToHandle(dirHandle, 'kontak.json', updated);
      showToast('👥 Kontak baru berhasil ditambahkan');
    }
  };

  const handleUpdateKontak = async (k: KontakItem) => {
    const updated = kontakList.map((item) => (item.id === k.id ? k : item));
    setKontakList(updated);
    if (dirHandle) {
      await writeJsonToHandle(dirHandle, 'kontak.json', updated);
      showToast('👥 Kontak berhasil diperbarui');
    }
  };

  const handleDeleteKontak = async (id: number | string) => {
    const itemToDelete = kontakList.find((k) => k.id === id);
    const updated = kontakList.filter((k) => k.id !== id);
    setKontakList(updated);

    if (itemToDelete) {
      const trashItem: TrashItem = {
        id: Date.now(),
        originalTable: 'kontak',
        label: itemToDelete.nama,
        deletedAt: new Date().toISOString(),
        item: itemToDelete
      };
      const updatedTrash = [trashItem, ...trashList];
      setTrashList(updatedTrash);
      if (dirHandle) {
        await writeJsonToHandle(dirHandle, 'trash.json', updatedTrash);
      }
    }

    if (dirHandle) {
      await writeJsonToHandle(dirHandle, 'kontak.json', updated);
      showToast('🗑️ Kontak dipindahkan ke sampah');
    }
  };

  // ── PRODUK KOLEKTIVA HANDLERS ──
  const handleSaveProduk = async (p: ProdukKolektivaItem) => {
    const updated = [p, ...produkList];
    setProdukList(updated);
    if (dirHandle) {
      await writeJsonToHandle(dirHandle, 'produk.json', updated);
      showToast('🛍️ Produk berhasil ditambahkan');
    }
  };

  const handleUpdateProduk = async (p: ProdukKolektivaItem) => {
    const updated = produkList.map((item) => (item.id === p.id ? p : item));
    setProdukList(updated);
    if (dirHandle) {
      await writeJsonToHandle(dirHandle, 'produk.json', updated);
      showToast('🛍️ Produk berhasil diperbarui');
    }
  };

  const handleDeleteProduk = async (id: number | string) => {
    const itemToDelete = produkList.find((p) => p.id === id);
    const updated = produkList.filter((p) => p.id !== id);
    setProdukList(updated);

    if (itemToDelete) {
      const trashItem: TrashItem = {
        id: Date.now(),
        originalTable: 'orders',
        label: itemToDelete.nama,
        deletedAt: new Date().toISOString(),
        item: itemToDelete
      };
      const updatedTrash = [trashItem, ...trashList];
      setTrashList(updatedTrash);
      if (dirHandle) {
        await writeJsonToHandle(dirHandle, 'trash.json', updatedTrash);
      }
    }

    if (dirHandle) {
      await writeJsonToHandle(dirHandle, 'produk.json', updated);
      showToast('🗑️ Produk dipindahkan ke sampah');
    }
  };

  const handleBulkImportProduk = async (items: ProdukKolektivaItem[]) => {
    const updated = [...produkList, ...items];
    setProdukList(updated);
    if (dirHandle) {
      await writeJsonToHandle(dirHandle, 'produk.json', updated);
      showToast(`✅ ${items.length} produk berhasil diimport`);
    }
  };

  const handleSaveHppToProduk = async (
    produkId: number | string, 
    hppData: { totalHpp: number; hargaDasar: number }
  ) => {
    const updated = produkList.map((p) => {
      if (p.id === produkId) {
        return {
          ...p,
          hargaDasar: hppData.hargaDasar,
          hppSnapshot: { totalHpp: hppData.totalHpp, komponen: [] }
        };
      }
      return p;
    });
    setProdukList(updated);
    if (dirHandle) {
      await writeJsonToHandle(dirHandle, 'produk.json', updated);
      showToast('✅ Snapshot HPP berhasil disimpan ke produk');
    }
  };

  // ── RESEP & BAHAN HANDLERS ──
  const handleSaveResep = async (newResep: ResepItem) => {
    const updated = [newResep, ...resepList];
    setResepList(updated);
    if (dirHandle) {
      await writeJsonToHandle(dirHandle, 'resep.json', updated);
      showToast('✅ Resep baru berhasil disimpan ke disk');
    }
  };

  const handleUpdateResep = async (updatedResep: ResepItem) => {
    const updated = resepList.map((r) => (String(r.id) === String(updatedResep.id) ? updatedResep : r));
    setResepList(updated);
    if (dirHandle) {
      await writeJsonToHandle(dirHandle, 'resep.json', updated);
      showToast('✅ Resep berhasil diperbarui');
    }
  };

  const handleDeleteResep = async (id: number | string) => {
    const itemToDelete = resepList.find((r) => String(r.id) === String(id));
    const updated = resepList.filter((r) => String(r.id) !== String(id));
    setResepList(updated);

    if (itemToDelete) {
      const trashItem: TrashItem = {
        id: Date.now(),
        originalTable: 'resep',
        label: itemToDelete.nama,
        deletedAt: new Date().toISOString(),
        item: itemToDelete
      };
      const updatedTrash = [trashItem, ...trashList];
      setTrashList(updatedTrash);
      if (dirHandle) {
        await writeJsonToHandle(dirHandle, 'trash.json', updatedTrash);
      }
    }

    if (dirHandle) {
      await writeJsonToHandle(dirHandle, 'resep.json', updated);
      showToast('🗑️ Resep dipindahkan ke sampah');
    }
  };

  const handleReorderResep = async (newResepList: ResepItem[]) => {
    setResepList(newResepList);
    if (dirHandle) {
      await writeJsonToHandle(dirHandle, 'resep.json', newResepList);
    }
  };

  const handleSaveBahan = async (newBahan: BahanItem) => {
    const updated = [...bahanList, newBahan];
    setBahanList(updated);
    if (dirHandle) {
      await writeJsonToHandle(dirHandle, 'bahan.json', updated);
      showToast('✅ Bahan baku berhasil ditambahkan');
    }
  };

  const handleUpdateBahan = async (updatedBahan: BahanItem) => {
    const updated = bahanList.map((b) => (String(b.id) === String(updatedBahan.id) ? updatedBahan : b));
    setBahanList(updated);
    if (dirHandle) {
      await writeJsonToHandle(dirHandle, 'bahan.json', updated);
      showToast('✅ Bahan baku berhasil diperbarui');
    }
  };

  const handleDeleteBahan = async (id: number | string) => {
    const updated = bahanList.filter((b) => String(b.id) !== String(id));
    setBahanList(updated);
    if (dirHandle) {
      await writeJsonToHandle(dirHandle, 'bahan.json', updated);
      showToast('🗑️ Bahan baku berhasil dihapus');
    }
  };

  const handleSaveResepGroups = async (groups: ResepGroupItem[]) => {
    const updatedMeta = { ...(keuData._meta || {}), resepGroups: groups };
    const updatedKeu = { ...keuData, _meta: updatedMeta };
    setKeuData(updatedKeu);
    if (dirHandle) {
      await writeJsonToHandle(dirHandle, 'keu.json', updatedKeu);
      showToast('✅ Kategori resep berhasil diperbarui');
    }
  };

  const handleSaveChannels = async (channels: string[], labels: Record<string, string>) => {
    const updatedMeta = {
      ...(keuData._meta || {}),
      dikopiChannels: channels,
      channelLabels: labels
    };
    const updatedKeu = { ...keuData, _meta: updatedMeta };
    setKeuData(updatedKeu);
    if (dirHandle) {
      await writeJsonToHandle(dirHandle, 'keu.json', updatedKeu);
      showToast('✅ Channel menu berhasil diperbarui');
    }
  };

  const handlePushResepCloud = async () => {
    if (!resepList || resepList.length === 0) {
      showToast('⚠️ Data resep kosong');
      return;
    }
    showToast(`⏳ Menyinkronkan ${resepList.length} menu resep ke Cloud Kasir...`);
    try {
      const pushed = await pushRecipesToCloud(resepList);
      showToast(`✅ ${pushed} menu resep berhasil dipush ke Cloud (Kasir Online)!`);
    } catch (err) {
      console.error('Error saat push resep:', err);
      showToast('❌ Gagal push resep: ' + (err instanceof Error ? err.message : 'Error'));
    }
  };

  // ── TRASH RECOVERY HANDLERS ──
  const handleRestoreTrashItem = async (trashId: number | string) => {
    const trashEntry = trashList.find((t) => t.id === trashId);
    if (!trashEntry) return;

    const remainingTrash = trashList.filter((t) => t.id !== trashId);
    setTrashList(remainingTrash);

    // Restore to appropriate state
    if (trashEntry.originalTable === 'todos' && trashEntry.item) {
      const updated = [trashEntry.item, ...todosList];
      setTodosList(updated);
      if (dirHandle) await writeJsonToHandle(dirHandle, 'todos.json', updated);
    } else if (trashEntry.originalTable === 'projects' && trashEntry.item) {
      const updated = [trashEntry.item, ...projectsList];
      setProjectsList(updated);
      if (dirHandle) await writeJsonToHandle(dirHandle, 'projects.json', updated);
    } else if (trashEntry.originalTable === 'kontak' && trashEntry.item) {
      const updated = [trashEntry.item, ...kontakList];
      setKontakList(updated);
      if (dirHandle) await writeJsonToHandle(dirHandle, 'kontak.json', updated);
    } else if (trashEntry.originalTable === 'dokumen' && trashEntry.item) {
      const updated = [trashEntry.item, ...dokumenList];
      setDokumenList(updated);
      if (dirHandle) await writeJsonToHandle(dirHandle, 'dokumen.json', updated);
    } else if (trashEntry.originalTable === 'folder_tree' && trashEntry.item) {
      const updated = [trashEntry.item, ...foldersList];
      setFoldersList(updated);
      if (dirHandle) await writeJsonToHandle(dirHandle, 'folders.json', updated);
    } else if (trashEntry.originalTable === 'orders' && trashEntry.item) {
      const updated = [trashEntry.item, ...produkList];
      setProdukList(updated);
      if (dirHandle) await writeJsonToHandle(dirHandle, 'produk.json', updated);
    } else if (trashEntry.originalTable === 'resep' && trashEntry.item) {
      const updated = [trashEntry.item, ...resepList];
      setResepList(updated);
      if (dirHandle) await writeJsonToHandle(dirHandle, 'resep.json', updated);
    }

    if (dirHandle) {
      await writeJsonToHandle(dirHandle, 'trash.json', remainingTrash);
    }
    showToast(`↩️ "${trashEntry.label}" berhasil dipulihkan`);
  };

  const handlePermanentDeleteTrashItem = async (trashId: number | string) => {
    const remainingTrash = trashList.filter((t) => t.id !== trashId);
    setTrashList(remainingTrash);
    if (dirHandle) {
      await writeJsonToHandle(dirHandle, 'trash.json', remainingTrash);
    }
    showToast('💀 Item telah dihapus permanen');
  };

  const handleRestoreAllTrash = async () => {
    for (const entry of trashList) {
      if (entry.originalTable === 'todos' && entry.item) {
        todosList.push(entry.item);
      } else if (entry.originalTable === 'projects' && entry.item) {
        projectsList.push(entry.item);
      } else if (entry.originalTable === 'kontak' && entry.item) {
        kontakList.push(entry.item);
      } else if (entry.originalTable === 'dokumen' && entry.item) {
        dokumenList.push(entry.item);
      } else if (entry.originalTable === 'folder_tree' && entry.item) {
        foldersList.push(entry.item);
      } else if (entry.originalTable === 'orders' && entry.item) {
        produkList.push(entry.item);
      } else if (entry.originalTable === 'resep' && entry.item) {
        resepList.push(entry.item);
      }
    }
    setTrashList([]);
    if (dirHandle) {
      await writeJsonToHandle(dirHandle, 'trash.json', []);
      await writeJsonToHandle(dirHandle, 'todos.json', todosList);
      await writeJsonToHandle(dirHandle, 'projects.json', projectsList);
      await writeJsonToHandle(dirHandle, 'kontak.json', kontakList);
      await writeJsonToHandle(dirHandle, 'dokumen.json', dokumenList);
      await writeJsonToHandle(dirHandle, 'folders.json', foldersList);
      await writeJsonToHandle(dirHandle, 'produk.json', produkList);
      await writeJsonToHandle(dirHandle, 'resep.json', resepList);
    }
    showToast('↩️ Semua item di sampah berhasil dipulihkan');
  };

  const handleEmptyTrash = async () => {
    setTrashList([]);
    if (dirHandle) {
      await writeJsonToHandle(dirHandle, 'trash.json', []);
    }
    showToast('🗑️ Kotak sampah telah dikosongkan');
  };

  // ── CLOUD SYNC HANDLERS ──
  const handleTriggerSync = async () => {
    showToast('⏳ Mengambil transaksi kasir dari Cloud Firestore...');
    try {
      const currentDikopi = keuData.dikopi || [];
      const result = await pullCloudTransactions(currentDikopi);
      
      if (result.addedCount > 0) {
        const updatedKeu = { ...keuData, dikopi: result.mergedList };
        setKeuData(updatedKeu);
        if (dirHandle) {
          await writeJsonToHandle(dirHandle, 'keu.json', updatedKeu);
        }
      }
      showToast(result.message);
    } catch (err: unknown) {
      console.warn('Direct Firebase sync failed, trying local bridge fallback:', err);
      try {
        const res = await fetch('http://localhost:3000/api/sync-event', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });
        if (res.ok) {
          const data = await res.json();
          showToast(data.message || '✅ Sinkronisasi kasir berhasil via Local Bridge!');
          if (dirHandle) loadAllData(dirHandle);
          return;
        }
      } catch {
        // ignore fallback error
      }
      showToast('❌ Gagal sinkronisasi cloud: ' + (err instanceof Error ? err.message : 'Periksa koneksi internet'));
    }
  };

  const handlePushCloud = async () => {
    showToast('⏳ Menyinkronkan seluruh transaksi ke Cloud (Master Authority)...');
    try {
      const res = await pushTransactionsToCloud(keuData.dikopi || []);
      showToast(res.message);
    } catch (err) {
      console.error('Error saat push ke cloud:', err);
      showToast('❌ Gagal push ke cloud: ' + (err instanceof Error ? err.message : 'Error'));
    }
  };

  const getPageTitle = () => {
    switch (activeTab) {
      case 'dashboard':
        return 'Executive Overview Dashboard';
      case 'keuangan':
      case 'keu_buku':
        return `Buku Kas Harian — ${activeBrand.toUpperCase()}`;
      case 'keu_dashboard':
        return 'Konsolidasi Keuangan — PT Pratani Kreatif Group';
      case 'keu_bulanan':
        return 'Rekap Laba Rugi Bulanan';
      case 'keu_tahunan':
        return 'Rekap Tahunan Konsolidasi (12 Bulan)';
      case 'keu_nota':
        return 'Galeri Dokumen & Arsip Nota';
      case 'keu_hutang':
        return 'Monitoring Hutang & Cicilan';
      case 'todos':
        return `Content Plan Calendar — ${activeBrand.toUpperCase()}`;
      case 'todolist':
      case 'tasks':
        return `Operational Tasks — ${activeBrand.toUpperCase()}`;
      case 'projects':
        return `Manajemen Proyek — ${activeBrand.toUpperCase()}`;
      case 'dokumen':
        return 'File Manager & Dokumen';
      case 'kontak':
        return 'Direktori Kontak & Stakeholder';
      case 'hpp':
        return 'Kalkulator HPP & Rekomendasi Harga Jual';
      case 'resep':
        return 'Katalog Menu & Resep HPP (Dikopi)';
      case 'produk_kolektiva':
        return 'Katalog Produk Kolektiva & MOQ Tier';
      case 'gen_invoice':
        return 'Generator Invoice Tagihan';
      case 'gen_penawaran':
        return 'Generator Surat Penawaran';
      case 'gen_rab':
        return 'Generator Rincian Anggaran Biaya (RAB)';
      case 'gen_mou':
        return 'Generator Surat Perjanjian (MoU)';
      case 'gen_bast':
        return 'Generator Berita Acara Serah Terima (BAST)';
      case 'gen_kwitansi':
        return 'Generator Kwitansi Pembayaran';
      case 'sampah':
        return 'Recycle Bin & Pemulihan File';
      default:
        return 'Pratani Creative HQ';
    }
  };

  return (
    <div style={{ display: 'flex', width: '100vw', height: '100vh', overflow: 'hidden' }}>
      {/* Toast Notification */}
      {toastMessage && (
        <div className="toast success">
          <Sparkles className="w-4 h-4 text-sky-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Add Transaction Modal */}
      <AddTransactionModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        activeBrand={activeBrand}
        bahanList={bahanList}
        onSave={handleSaveTransaction}
        onUpdateBahan={handleUpdateBahan}
      />

      {/* Main Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        activeBrand={activeBrand}
        setActiveBrand={setActiveBrand}
        folderName={folderName}
        onConnectFolder={handleConnectFolder}
        onRefreshData={handleRefreshData}
        onTriggerSync={handleTriggerSync}
        onPushCloud={handlePushCloud}
        onPushResep={handlePushResepCloud}
        trashCount={trashList.length}
      />

      {/* Content Area */}
      <div className="main">
        <Header
          title={getPageTitle()}
          folderName={folderName}
          onConnectFolder={handleConnectFolder}
          onRefreshData={handleRefreshData}
          onOpenAddModal={() => setIsAddModalOpen(true)}
        />

        <main className="content">
          {activeTab === 'dashboard' && (
            <OverviewDashboard
              keuData={keuData}
              activeBrand={activeBrand}
              onBrandChange={setActiveBrand}
              resepList={resepList}
              bahanList={bahanList}
              todosList={todosList}
              taskList={taskList}
              onToggleTodo={handleToggleTodo}
              onNavigateToKeuangan={(brand) => {
                if (brand) setActiveBrand(brand);
                setActiveTab('keu_buku');
              }}
              onNavigateToTodos={() => setActiveTab('todos')}
              onNavigateToTasks={() => setActiveTab('todolist')}
              onNavigateToResep={() => setActiveTab('resep')}
            />
          )}

          {/* Buku Kas */}
          {(activeTab === 'keuangan' || activeTab === 'keu_buku') && (
            <BukuKasView
              keuData={keuData}
              activeBrand={activeBrand}
              onBrandChange={setActiveBrand}
              resepList={resepList}
              bahanList={bahanList}
              historyList={historyList}
              onTriggerSync={handleTriggerSync}
              onPushCloud={handlePushCloud}
              onAddTransaction={() => setIsAddModalOpen(true)}
              onSaveTransaction={handleSaveTransaction}
              onSaveBatchTransactions={handleSaveBatchTransactions}
              onUpdateTransaction={handleUpdateTransaction}
              onDeleteTransaction={handleDeleteTransaction}
              onSaveSaldoAwal={handleSaveSaldoAwal}
              onRestoreSnapshot={handleRestoreSnapshot}
            />
          )}

          {/* Subviews Keuangan */}
          {activeTab === 'keu_dashboard' && (
            <KeuDashboardView keuData={keuData} asetList={asetList} />
          )}

          {activeTab === 'keu_bulanan' && (
            <KeuRekapBulananView keuData={keuData} />
          )}

          {activeTab === 'keu_tahunan' && (
            <KeuRekapTahunanView keuData={keuData} />
          )}

          {activeTab === 'keu_nota' && (
            <KeuNotaGalleryView keuData={keuData} />
          )}

          {activeTab === 'keu_hutang' && (
            <KeuHutangView
              hutangList={hutangList}
              activeBrand={activeBrand}
              onBrandChange={setActiveBrand}
              onSaveHutang={handleSaveHutang}
              onUpdateHutang={handleUpdateHutang}
              onDeleteHutang={handleDeleteHutang}
            />
          )}

          {/* Content Plan */}
          {activeTab === 'todos' && (
            <ContentPlanView
              todos={todosList}
              pilars={pilarsList}
              activeBrand={activeBrand}
              onBrandChange={setActiveBrand}
              onSaveTodo={handleSaveTodo}
              onUpdateTodo={handleUpdateTodo}
              onDeleteTodo={handleDeleteTodo}
              onToggleTodo={handleToggleTodo}
              onSetBoardStatus={handleSetBoardStatus}
              onSavePilars={handleSavePilars}
              onBulkImportTodos={handleBulkImportTodos}
            />
          )}

          {/* To-Do List */}
          {(activeTab === 'tasks' || activeTab === 'todolist') && (
            <TasksView
              taskList={taskList}
              activeBrand={activeBrand}
              onBrandChange={setActiveBrand}
              onSaveTaskList={handleSaveTaskList}
            />
          )}

          {/* Projects */}
          {activeTab === 'projects' && (
            <ProjectsView
              projects={projectsList}
              activeBrand={activeBrand}
              onBrandChange={setActiveBrand}
              onSaveProject={handleSaveProject}
              onUpdateProject={handleUpdateProject}
              onDeleteProject={handleDeleteProject}
            />
          )}

          {/* Dokumen File Manager */}
          {activeTab === 'dokumen' && (
            <DokumenView
              folders={foldersList}
              dokumen={dokumenList}
              onSaveFolder={handleSaveFolder}
              onUpdateFolder={handleUpdateFolder}
              onDeleteFolder={handleDeleteFolder}
              onSaveFile={handleSaveFile}
              onDeleteFile={handleDeleteFile}
            />
          )}

          {/* Kontak Directory */}
          {activeTab === 'kontak' && (
            <KontakView
              kontakList={kontakList}
              activeBrand={activeBrand}
              onBrandChange={setActiveBrand}
              onSaveKontak={handleSaveKontak}
              onUpdateKontak={handleUpdateKontak}
              onDeleteKontak={handleDeleteKontak}
            />
          )}

          {/* Kalkulator HPP */}
          {activeTab === 'hpp' && (
            <KalkulatorHppView
              activeBrand={activeBrand}
              onBrandChange={setActiveBrand}
              produkList={produkList}
              selectedProdukId={selectedProdukForHpp}
              onClearSelectedProduk={() => setSelectedProdukForHpp(null)}
              onSaveHppToProduk={handleSaveHppToProduk}
            />
          )}

          {/* Resep Dikopi */}
          {activeTab === 'resep' && (
            <ResepView
              resepList={resepList}
              bahanList={bahanList}
              transaksiList={keuData.dikopi || []}
              keuMeta={keuData._meta}
              onSaveResep={handleSaveResep}
              onUpdateResep={handleUpdateResep}
              onDeleteResep={handleDeleteResep}
              onReorderResep={handleReorderResep}
              onSaveBahan={handleSaveBahan}
              onUpdateBahan={handleUpdateBahan}
              onDeleteBahan={handleDeleteBahan}
              onSaveResepGroups={handleSaveResepGroups}
              onSaveChannels={handleSaveChannels}
              onPushResepCloud={handlePushResepCloud}
              onSaveTransaction={(trx) => handleSaveTransaction(trx, 'dikopi')}
              showToast={showToast}
            />
          )}

          {/* Produk Kolektiva */}
          {activeTab === 'produk_kolektiva' && (
            <ProdukKolektivaView
              produkList={produkList}
              onSaveProduk={handleSaveProduk}
              onUpdateProduk={handleUpdateProduk}
              onDeleteProduk={handleDeleteProduk}
              onLaunchHpp={(pId) => {
                setSelectedProdukForHpp(pId);
                setActiveTab('hpp');
              }}
              onBulkImportProduk={handleBulkImportProduk}
            />
          )}

          {/* Generator Dokumen */}
          {[
            'gen_invoice',
            'gen_penawaran',
            'gen_rab',
            'gen_mou',
            'gen_bast',
            'gen_kwitansi',
            'generator_dokumen'
          ].includes(activeTab) && (
            <GeneratorDokumenView
              key={activeTab}
              initialType={(activeTab === 'generator_dokumen' ? 'gen_invoice' : activeTab) as GenDocType}
              kontakList={kontakList}
            />
          )}

          {/* Sampah */}
          {activeTab === 'sampah' && (
            <SampahView
              trashList={trashList}
              onRestoreItem={handleRestoreTrashItem}
              onPermanentDeleteItem={handlePermanentDeleteTrashItem}
              onRestoreAll={handleRestoreAllTrash}
              onEmptyTrash={handleEmptyTrash}
            />
          )}

          {activeTab === 'kolektiva-docs' && (
            <KolektivaDocView />
          )}
        </main>
      </div>
    </div>
  );
};

export default App;
