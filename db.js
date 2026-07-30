// DB Logic: IndexedDB + Supabase Sync

// We assume Supabase is loaded globally via CDN in HTML:
// <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>

const SUPABASE_URL = 'https://qoyinmxkiaysytgbdopy.supabase.co'; 
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFveWlubXhraWF5c3l0Z2Jkb3B5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUzNTcyODgsImV4cCI6MjEwMDkzMzI4OH0.PUxrg5xxkT201oCRC-Sdx9IYTy_ja3M5DkDAX3nehyI';
let supabase = null;
if (window.supabase) {
  supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

// IndexedDB Wrapper
const DB_NAME = 'giochi-bans-db';
const DB_VERSION = 1;

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains('giochi')) {
        db.createObjectStore('giochi', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('bans')) {
        db.createObjectStore('bans', { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function getLocalData(table) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(table, 'readonly');
    const store = tx.objectStore(table);
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
}

export async function saveLocalData(table, dataArray) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(table, 'readwrite');
    const store = tx.objectStore(table);
    // Clear and put all (for simplicity on full sync)
    store.clear().onsuccess = () => {
      dataArray.forEach(item => store.put(item));
    };
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function syncData(table) {
  if (!navigator.onLine || !supabase) return await getLocalData(table);
  try {
    const fetchPromise = supabase.from(table).select('*').order('nome');
    const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 3000));
    
    const result = await Promise.race([fetchPromise, timeoutPromise]);
    if (result.error) throw result.error;
    await saveLocalData(table, result.data);
    return result.data;
  } catch (err) {
    console.error(`Sync error for ${table}:`, err);
    return await getLocalData(table);
  }
}

export function subscribeToChanges(table, callback) {
  if (!supabase) return;
  supabase
    .channel(`${table}_changes`)
    .on('postgres_changes', { event: '*', schema: 'public', table: table }, async payload => {
      // Background sync on change
      const newData = await syncData(table);
      callback(newData);
    })
    .subscribe();
}

// Auth Utils
export async function login(email, password) {
  if(!supabase) return {error: {message: 'Supabase not initialized'}};
  return await supabase.auth.signInWithPassword({ email, password });
}

export async function logout() {
  if(!supabase) return;
  return await supabase.auth.signOut();
}

export async function getSession() {
  if(!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data.session;
}

export async function adminUpsert(table, record) {
  if(!supabase) return {error: {message: 'Supabase not initialized'}};
  if (record.id) {
    // Update
    record.updated_at = new Date().toISOString();
    return await supabase.from(table).update(record).eq('id', record.id);
  } else {
    // Insert
    return await supabase.from(table).insert([record]);
  }
}

export async function adminDelete(table, id) {
  if(!supabase) return {error: {message: 'Supabase not initialized'}};
  return await supabase.from(table).delete().eq('id', id);
}
