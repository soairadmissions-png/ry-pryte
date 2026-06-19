import { Inquiry } from '../types';
import { CMSState, MediaAsset } from './cmsState';

// Since Supabase is removed completely, we bypass credentials setup and declare configured state
export const isSupabaseConfigured = true;

// Stub proxy client for backward compatibility in case raw supabase calls are imported anywhere
export const supabase = new Proxy({}, {
  get(target: any, prop: string): any {
    console.info(`[LOCAL DB ROUTER stub] Intercepted raw access to "${prop}"`);
    if (prop === 'auth') {
      return {
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
        getSession: () => Promise.resolve({ data: { session: null } })
      };
    }
    return () => ({
      from: () => ({
        select: () => ({
          eq: () => ({
            maybeSingle: () => Promise.resolve({ data: null, error: null }),
            single: () => Promise.resolve({ data: null, error: null })
          }),
          order: () => Promise.resolve({ data: [], error: null })
        }),
        upsert: () => Promise.resolve({ error: null }),
        insert: () => Promise.resolve({ error: null }),
        delete: () => ({
          eq: () => Promise.resolve({ error: null })
        })
      })
    });
  }
});

/**
 * Sync the core inquiries data to kbl.db (local SQLite)
 */
export async function syncInquiryToSupabase(inquiry: Inquiry): Promise<boolean> {
  try {
    const res = await fetch('/api/inquiries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(inquiry)
    });
    if (!res.ok) {
      console.error('[LOCAL DB SYNC INQUIRY ERROR]: Server responded with status', res.status);
      return false;
    }
    console.info(`[LOCAL DB SYNC SUCCESS]: Inquiry ${inquiry.id} securely saved to kbl.db.`);
    return true;
  } catch (err) {
    console.error('[LOCAL DB SYNC INQUIRY FATAL ERROR]:', err);
    return false;
  }
}

/**
 * Sync media assets to kbl.db (local SQLite)
 */
export async function syncMediaAssetToSupabase(asset: MediaAsset): Promise<boolean> {
  try {
    const res = await fetch('/api/media-assets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(asset)
    });
    if (!res.ok) {
      console.error('[LOCAL DB SYNC MEDIA ERROR]: Server responded with status', res.status);
      return false;
    }
    console.info(`[LOCAL DB SYNC SUCCESS]: Media Asset ${asset.id} securely saved to kbl.db.`);
    return true;
  } catch (err) {
    console.error('[LOCAL DB SYNC MEDIA FATAL ERROR]:', err);
    return false;
  }
}

/**
 * Remove media asset from kbl.db (local SQLite)
 */
export async function deleteMediaAssetFromSupabase(id: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/media-assets/${id}`, {
      method: 'DELETE'
    });
    if (!res.ok) {
      console.error('[LOCAL DB DELETE MEDIA ERROR]: Server responded with status', res.status);
      return false;
    }
    console.info(`[LOCAL DB SYNC SUCCESS]: Media Asset ${id} deleted from kbl.db.`);
    return true;
  } catch (err) {
    console.error('[LOCAL DB DELETE MEDIA FATAL ERROR]:', err);
    return false;
  }
}

/**
 * Fully sync CMS configuration state JSON to local SQLite (kbl.db)
 */
export async function syncCMSStateToSupabase(id: 'draft' | 'published', state: CMSState): Promise<boolean> {
  try {
    // Sanitize state of temporary or useless local file objects before transmitting
    const clone = JSON.parse(JSON.stringify(state));
    
    const res = await fetch(`/api/cms-state/${id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ state: clone })
    });
    if (!res.ok) {
      console.error(`[LOCAL DB SYNC CMS STATE ERROR (${id})]: Server responded with status`, res.status);
      return false;
    }
    console.info(`[LOCAL DB SYNC SUCCESS]: Saved entire ${id} website configuration state to kbl.db SQLite.`);
    return true;
  } catch (err) {
    console.error(`[LOCAL DB SYNC CMS STATE FATAL ERROR (${id})]:`, err);
    return false;
  }
}

/**
 * Fetch and load states directly from local SQLite (kbl.db)
 */
export async function loadCMSStateFromSupabase(id: 'draft' | 'published'): Promise<CMSState | null> {
  try {
    const res = await fetch(`/api/cms-state/${id}`);
    if (res.ok) {
      const payload = await res.json();
      if (payload && payload.data) {
        console.info(`[LOCAL DB LOAD SUCCESS]: Restored ${id} website configuration state from kbl.db SQLite.`);
        return payload.data as CMSState;
      }
    }
    return null;
  } catch (err) {
    console.error(`[LOCAL DB LOAD CMS STATE FATAL ERROR (${id})]:`, err);
    return null;
  }
}

/**
 * Load all inquiries saved in local SQLite (kbl.db)
 */
export async function loadInquiriesFromSupabase(): Promise<Inquiry[] | null> {
  try {
    const res = await fetch('/api/inquiries');
    if (res.ok) {
      const payload = await res.json();
      if (payload && payload.data) {
        console.info(`[LOCAL DB LOAD SUCCESS]: Loaded inquiries from kbl.db SQLite.`);
        return payload.data as Inquiry[];
      }
    }
    return null;
  } catch (err) {
    console.error('[LOCAL DB LOAD INQUIRIES FATAL ERROR]:', err);
    return null;
  }
}

/**
 * Execute a connection health check test for the local SQLite (kbl.db) store
 */
export async function testSupabaseConnection(): Promise<{ success: boolean; message: string; code?: string }> {
  try {
    const res = await fetch('/api/inquiries');
    if (res.ok) {
      return {
        success: true,
        code: 'ONLINE',
        message: 'Your kbl.db SQLite local database backend is online, active, and fully configured!'
      };
    }
    return {
      success: false,
      message: `Failed to communicate with local SQLite API server (status: ${res.status})`
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Failed to connect with local API: ${err.message || err}`
    };
  }
}
