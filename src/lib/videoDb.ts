// Persistent IndexedDB Store for video files to prevent them from becoming empty/revoked on page reload in AI Studio
const DB_NAME = 'gather-videos-db';
const STORE_NAME = 'videos';

export interface SavedVideo {
  id: string; // The URL/id key, e.g., 'local-video://vid-1'
  blob: Blob;
  name: string;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    
    request.onsuccess = () => {
      resolve(request.result);
    };
    
    request.onerror = () => {
      reject(request.error);
    };
  });
}

// Save a select video file to IndexedDB
export async function saveVideoToIndexedDB(id: string, file: Blob, name: string): Promise<string> {
  const db = await openDB();
  const storageId = id.startsWith('local-video://') ? id : `local-video://${id}`;
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    
    const record: SavedVideo = {
      id: storageId,
      blob: file,
      name
    };
    
    const request = store.put(record);
    
    request.onsuccess = () => {
      resolve(storageId);
    };
    
    request.onerror = () => {
      reject(request.error);
    };
  });
}

// Retrieve a video file as a Blob
export async function getVideoBlobFromIndexedDB(id: string): Promise<Blob | null> {
  try {
    const db = await openDB();
    const storageId = id.startsWith('local-video://') ? id : `local-video://${id}`;
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(storageId);
      
      request.onsuccess = () => {
        if (request.result) {
          resolve(request.result.blob);
        } else {
          resolve(null);
        }
      };
      
      request.onerror = () => {
        reject(request.error);
      };
    });
  } catch (err) {
    console.error("Failed to query IndexedDB for " + id, err);
    return null;
  }
}

// In-memory active blob: Url cache to prevent multiple object url generations
const activeObjectUrlCache = new Map<string, string>();

export async function getLiveVideoUrl(id: string): Promise<string> {
  if (!id) return '';
  
  // If it's a standard web URL, return it directly
  if (!id.startsWith('local-video://')) {
    return id;
  }
  
  // Check the active in-memory cache
  if (activeObjectUrlCache.has(id)) {
    return activeObjectUrlCache.get(id)!;
  }
  
  const blob = await getVideoBlobFromIndexedDB(id);
  if (blob) {
    const liveUrl = URL.createObjectURL(blob);
    // Cache the created URL
    activeObjectUrlCache.set(id, liveUrl);
    return liveUrl;
  }
  
  return '';
}

// Clears the active cache on demand
export function revokeStoredUrls() {
  for (const url of activeObjectUrlCache.values()) {
    try {
      URL.revokeObjectURL(url);
    } catch (e) {}
  }
  activeObjectUrlCache.clear();
}
