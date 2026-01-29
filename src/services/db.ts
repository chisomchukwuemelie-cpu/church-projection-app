
const DB_NAME = 'lumina_db';
const STORE_NAME = 'bible_cache';

const dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = (event) => {
        const db = (event.target as any).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
            db.createObjectStore(STORE_NAME);
        }
    };
    request.onsuccess = (event) => resolve((event.target as any).result);
    request.onerror = (event) => reject((event.target as any).error);
});

export const get = async (key: string) => {
    const db: any = await dbPromise;
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.get(key);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
};

export const set = async (key: string, val: any) => {
    const db: any = await dbPromise;
    return new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const req = store.put(val, key);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
    });
};

export const del = async (key: string) => {
    const db: any = await dbPromise;
    return new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const req = store.delete(key);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
    });
};

export const clear = async () => {
    const db: any = await dbPromise;
    return new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const req = store.clear();
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
    });
};
