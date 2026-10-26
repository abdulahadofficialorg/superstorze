import { supabase, SUPABASE_PROJECT_ID, SUPABASE_URL, SUPABASE_ANON_KEY } from '../lib/supabase';

export interface TopUpRequirementPayload {
  orderId?: string;
  productId: string;
  productName: string;
  packageName?: string;
  price?: number;
  customFields: Record<string, string>;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  customerNotes?: string;
  paymentMethod?: string;
  transactionId?: string;
  status?: string;
}

export interface SavedTopUpRequirementRow {
  id?: string;
  created_at?: string;
  order_id?: string | null;
  product_id?: string;
  product_name?: string;
  package_name?: string;
  price?: number;
  player_id?: string;
  server_zone_id?: string;
  in_game_name?: string;
  custom_fields?: Record<string, string>;
  customer_name?: string;
  customer_phone?: string;
  customer_email?: string;
  customer_notes?: string;
  payment_method?: string;
  transaction_id?: string;
  status?: string;
}

const LOCAL_STORAGE_QUEUE_KEY = 'ssbd_supabase_pending_queue';
export const POSSIBLE_TABLE_NAMES = [
  'top_up_requirements',
  'topup_requirements',
  'top_up_orders',
  'topup_orders',
  'orders',
  'requirements',
  'topups',
];

/**
 * Extract common game fields (Player ID, Zone ID, Character Name)
 * from customFields object so they can be saved into dedicated columns if available.
 */
function extractCustomHelpers(fields: Record<string, string> = {}) {
  let playerId = '';
  let serverZoneId = '';
  let inGameName = '';

  for (const [key, rawVal] of Object.entries(fields)) {
    const val = String(rawVal || '').trim();
    if (!val) continue;
    const lower = key.toLowerCase();

    if (!playerId && (lower.includes('player') || lower.includes('uid') || lower.includes('user id') || lower.includes('id'))) {
      playerId = val;
    } else if (!serverZoneId && (lower.includes('zone') || lower.includes('server'))) {
      serverZoneId = val;
    } else if (!inGameName && (lower.includes('name') || lower.includes('nick') || lower.includes('character') || lower.includes('account'))) {
      inGameName = val;
    }
  }

  return { playerId, serverZoneId, inGameName };
}

/**
 * Save top up requirements data to Supabase table.
 * - Tries known table names ('top_up_requirements', 'topup_requirements', etc.).
 * - If a specific column does not exist on the user's table, it automatically prunes
 *   that column and retries, making it compatible with any schema.
 * - If the table is not created yet, safely queues in localStorage and logs instructions.
 */
export async function saveTopUpRequirementToSupabase(
  payload: TopUpRequirementPayload
): Promise<{ success: boolean; error?: string; tableUsed?: string; queued?: boolean; data?: any }> {
  const { playerId, serverZoneId, inGameName } = extractCustomHelpers(payload.customFields);

  const initialRow: Record<string, any> = {
    order_id: payload.orderId || null,
    product_id: payload.productId,
    product_name: payload.productName,
    package_name: payload.packageName || 'Standard',
    price: payload.price !== undefined ? Number(payload.price) : 0,
    player_id: playerId || null,
    server_zone_id: serverZoneId || null,
    in_game_name: inGameName || null,
    custom_fields: payload.customFields || {},
    customer_name: payload.customerName || 'Customer',
    customer_phone: payload.customerPhone || '',
    customer_email: payload.customerEmail || '',
    customer_notes: payload.customerNotes || '',
    payment_method: payload.paymentMethod || 'SSBD Wallet',
    transaction_id: payload.transactionId || '',
    status: payload.status || 'requirements_filled',
    created_at: new Date().toISOString(),
  };

  try {
    for (const tableName of POSSIBLE_TABLE_NAMES) {
      let candidateRow = { ...initialRow };
      let attempt = 0;
      let insertedData: any = null;
      let lastErr: any = null;

      // Try insert, handling missing columns dynamically (up to 6 pruned columns)
      while (attempt < 6) {
        attempt++;
        const { data, error } = await supabase.from(tableName).insert([candidateRow]).select();

        if (!error) {
          insertedData = data;
          break;
        }

        lastErr = error;

        // If error is code 42703 (column does not exist), remove that column and retry
        if (error.code === '42703' || error.message.toLowerCase().includes('column')) {
          const match = error.message.match(/column "([^"]+)"/i);
          if (match && match[1] && candidateRow[match[1]] !== undefined) {
            console.warn(`[Supabase] Column "${match[1]}" not in table "${tableName}", pruning and retrying...`);
            delete candidateRow[match[1]];
            continue;
          }
        }

        // Break if table doesn't exist or other fatal error
        break;
      }

      if (insertedData) {
        console.log(`[Supabase] Successfully saved top-up requirement to "${tableName}":`, insertedData);
        // Drain any pending queue entries in background
        drainQueue(tableName).catch(() => {});
        return { success: true, tableUsed: tableName, data: insertedData };
      }

      // If error is not a "table does not exist" error, log it
      if (lastErr && lastErr.code !== 'PGRST205' && !lastErr.message.includes('Could not find the table')) {
        console.warn(`[Supabase] Notice on table "${tableName}":`, lastErr.message);
      }
    }

    // If none of the tables exist in Supabase schema cache yet:
    console.warn(
      `[Supabase] No target table found yet in Supabase project (${SUPABASE_PROJECT_ID}). Queuing submission locally.`
    );
    queueFailedSubmission(initialRow);
    return {
      success: false,
      error: "Table 'top_up_requirements' not created in Supabase yet. Data safely queued locally.",
      queued: true,
    };
  } catch (err: any) {
    console.error('[Supabase] Unexpected error saving top-up requirement:', err);
    queueFailedSubmission(initialRow);
    return { success: false, error: err?.message || 'Unknown error', queued: true };
  }
}

/**
 * Queue data in localStorage if Supabase table is pending creation
 */
function queueFailedSubmission(data: any) {
  try {
    const existing = JSON.parse(localStorage.getItem(LOCAL_STORAGE_QUEUE_KEY) || '[]');
    existing.push({ ...data, queuedAt: new Date().toISOString() });
    localStorage.setItem(LOCAL_STORAGE_QUEUE_KEY, JSON.stringify(existing.slice(-100)));
  } catch {
    // Ignore storage issues
  }
}

/**
 * Fetch top-up requirements saved in Supabase (most recent first)
 */
export async function fetchTopUpRequirementsFromSupabase(
  limit: number = 50
): Promise<{ success: boolean; data: SavedTopUpRequirementRow[]; tableUsed?: string; error?: string }> {
  try {
    for (const tableName of POSSIBLE_TABLE_NAMES) {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (!error && Array.isArray(data)) {
        return { success: true, data, tableUsed: tableName };
      }
    }
    return { success: false, data: [], error: "Table 'top_up_requirements' is not created in Supabase yet." };
  } catch (err: any) {
    return { success: false, data: [], error: err.message };
  }
}

/**
 * Attempt to send queued items once table is available
 */
export async function drainQueue(tableName?: string): Promise<{ synced: number; error?: string }> {
  try {
    const queue = JSON.parse(localStorage.getItem(LOCAL_STORAGE_QUEUE_KEY) || '[]');
    if (!queue || queue.length === 0) return { synced: 0 };

    const targetTable = tableName || (await checkSupabaseTableStatus()).activeTable;
    if (!targetTable) {
      return { synced: 0, error: 'No active Supabase table found to sync queue.' };
    }

    const itemsToDrain = [...queue];
    const cleaned = itemsToDrain.map(({ queuedAt, ...rest }) => rest);

    const { error } = await supabase.from(targetTable).insert(cleaned);
    if (!error) {
      localStorage.removeItem(LOCAL_STORAGE_QUEUE_KEY);
      console.log(`[Supabase] Successfully synced ${itemsToDrain.length} queued submissions to '${targetTable}'`);
      return { synced: itemsToDrain.length };
    }
    return { synced: 0, error: error.message };
  } catch (err: any) {
    console.warn('[Supabase] Could not drain queue:', err);
    return { synced: 0, error: err.message };
  }
}

/**
 * Get current queued local items count
 */
export function getLocalQueue(): any[] {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_STORAGE_QUEUE_KEY) || '[]');
  } catch {
    return [];
  }
}

/**
 * Check if the table exists and is accessible
 */
export async function checkSupabaseTableStatus(): Promise<{
  connected: boolean;
  tableExists: boolean;
  activeTable?: string;
  error?: string;
  projectId: string;
}> {
  try {
    for (const tableName of POSSIBLE_TABLE_NAMES) {
      const { error } = await supabase.from(tableName).select('id').limit(1);
      if (!error) {
        return { connected: true, tableExists: true, activeTable: tableName, projectId: SUPABASE_PROJECT_ID };
      }
    }
    return {
      connected: true,
      tableExists: false,
      error: "Table 'top_up_requirements' is not created in Supabase yet.",
      projectId: SUPABASE_PROJECT_ID,
    };
  } catch (err: any) {
    return {
      connected: false,
      tableExists: false,
      error: err.message,
      projectId: SUPABASE_PROJECT_ID,
    };
  }
}

export { SUPABASE_PROJECT_ID, SUPABASE_URL, SUPABASE_ANON_KEY };

export const SUPABASE_SETUP_SQL = `-- ========================================================
-- Run this in your Supabase SQL Editor (Project: ${SUPABASE_PROJECT_ID})
-- Dashboard -> SQL Editor -> New Query -> Paste & Click Run
-- ========================================================

CREATE TABLE IF NOT EXISTS public.top_up_requirements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  order_id TEXT,
  product_id TEXT,
  product_name TEXT,
  package_name TEXT,
  price NUMERIC,
  player_id TEXT,
  server_zone_id TEXT,
  in_game_name TEXT,
  custom_fields JSONB DEFAULT '{}'::jsonb,
  customer_name TEXT,
  customer_phone TEXT,
  customer_email TEXT,
  customer_notes TEXT,
  payment_method TEXT DEFAULT 'SSBD Wallet',
  transaction_id TEXT,
  status TEXT DEFAULT 'requirements_filled'
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.top_up_requirements ENABLE ROW LEVEL SECURITY;

-- Allow anon & authenticated users to INSERT submissions
CREATE POLICY "Allow public insert to top_up_requirements"
ON public.top_up_requirements
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Allow anon & authenticated users to SELECT submissions
CREATE POLICY "Allow public select on top_up_requirements"
ON public.top_up_requirements
FOR SELECT
TO anon, authenticated
USING (true);

-- Index for fast queries
CREATE INDEX IF NOT EXISTS idx_top_up_req_created ON public.top_up_requirements(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_top_up_req_order_id ON public.top_up_requirements(order_id);
CREATE INDEX IF NOT EXISTS idx_top_up_req_player_id ON public.top_up_requirements(player_id);
`;
