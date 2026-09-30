// File System Access API & IndexedDB handle persistence for Pratani HQ

const IDB_NAME = 'pratani_hq_v2';
const IDB_STORE = 'handles';

function openIdb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_NAME, 1);
    req.onupgradeneeded = () => {
      req.result.createObjectStore(IDB_STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function saveDirectoryHandle(handle: FileSystemDirectoryHandle): Promise<void> {
  const db = await openIdb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, 'readwrite');
    tx.objectStore(IDB_STORE).put(handle, 'data_folder');
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function loadDirectoryHandle(): Promise<FileSystemDirectoryHandle | null> {
  try {
    const db = await openIdb();
    return new Promise((resolve) => {
      const tx = db.transaction(IDB_STORE, 'readonly');
      const req = tx.objectStore(IDB_STORE).get('data_folder');
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

interface ExtendedDirectoryHandle extends FileSystemDirectoryHandle {
  queryPermission?: (options: { mode: string }) => Promise<PermissionState>;
  requestPermission?: (options: { mode: string }) => Promise<PermissionState>;
}



export async function requestDirectoryPermission(
  handle: FileSystemDirectoryHandle
): Promise<boolean> {
  try {
    const ext = handle as ExtendedDirectoryHandle;
    if (ext.queryPermission && (await ext.queryPermission({ mode: 'readwrite' })) === 'granted') {
      return true;
    }
    if (ext.requestPermission) {
      return (await ext.requestPermission({ mode: 'readwrite' })) === 'granted';
    }
    return true;
  } catch {
    return false;
  }
}

export async function readJsonFromHandle<T>(
  dirHandle: FileSystemDirectoryHandle,
  fileName: string,
  fallback: T
): Promise<T> {
  try {
    const fileHandle = await dirHandle.getFileHandle(fileName, { create: false });
    const file = await fileHandle.getFile();
    const text = await file.text();
    return text ? (JSON.parse(text) as T) : fallback;
  } catch {
    return fallback;
  }
}

export async function writeJsonToHandle<T>(
  dirHandle: FileSystemDirectoryHandle,
  fileName: string,
  data: T
): Promise<boolean> {
  try {
    const fileHandle = await dirHandle.getFileHandle(fileName, { create: true });
    const writable = await fileHandle.createWritable();
    await writable.write(JSON.stringify(data, null, 2));
    await writable.close();
    return true;
  } catch (err) {
    console.error(`Gagal menulis file ${fileName}:`, err);
    return false;
  }
}
