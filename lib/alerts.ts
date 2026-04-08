import { createServerClient } from './supabase';

export interface Alert {
  id: string;
  client_id: string;
  connector_slug: string;
  type: string;
  severity: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

/** Create a new system alert */
export async function createAlert(data: Omit<Alert, 'id' | 'is_read' | 'created_at'>) {
  const supabase = createServerClient();
  const { data: alert, error } = await supabase
    .from('alerts')
    .insert([data])
    .select()
    .single();

  if (error) throw error;
  return alert;
}

/** Get count of unread alerts for a client or all clients */
export async function getUnreadCount(clientId?: string) {
  const supabase = createServerClient();
  let query = supabase
    .from('alerts')
    .select('id', { count: 'exact', head: true })
    .eq('is_read', false);

  if (clientId) {
    query = query.eq('client_id', clientId);
  }

  const { count, error } = await query;
  if (error) throw error;
  return count || 0;
}

/** Mark all alerts as read for a specific client or all clients */
export async function markAllRead(clientId?: string) {
  const supabase = createServerClient();
  let query = supabase
    .from('alerts')
    .update({ is_read: true })
    .eq('is_read', false);

  if (clientId) {
    query = query.eq('client_id', clientId);
  }

  const { error } = await query;
  if (error) throw error;
}
