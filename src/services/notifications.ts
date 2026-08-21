import { supabase } from './supabase';

export interface AppNotification {
  id: string;
  targetNrp: string;
  title: string;
  message: string;
  createdAt: string | null;
  isRead: boolean;
  type?: string;
  data?: Record<string, any>;
  pushStatus?: 'pending' | 'sent' | 'failed';
}

const NOTIFICATIONS_TABLE = 'notifications';

export function subscribeNotifications(
  targetNrp: string,
  callback: (notifications: AppNotification[]) => void
) {
  if (!targetNrp || targetNrp === 'unknown') {
    callback([]);
    return () => {};
  }

  const normalizedNrp = targetNrp.trim().toLowerCase();

  const fetchNotifs = async () => {
    const { data, error } = await supabase
      .from(NOTIFICATIONS_TABLE)
      .select('*')
      .or(`target_nrp.eq.${normalizedNrp},target_nrp.eq.all,target_nrp.eq.ALL`)
      .order('created_at', { ascending: false });

    if (error || !data) {
      callback([]);
      return;
    }

    const notifications: AppNotification[] = data.map((item) => ({
      id: item.id,
      targetNrp: item.target_nrp,
      title: item.title || 'Notifikasi',
      message: item.message || '',
      createdAt: item.created_at,
      isRead: Boolean(item.is_read),
      type: item.type || undefined,
      data: item.data || undefined,
      pushStatus: item.push_status || undefined,
    }));

    callback(notifications);
  };

  fetchNotifs();

  const channel = supabase
    .channel(`notifs-sub-${normalizedNrp}-${Math.random()}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: NOTIFICATIONS_TABLE }, () => {
      fetchNotifs();
    })
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

export async function createNotification({
  targetNrp,
  title,
  message,
  type,
  data,
}: {
  targetNrp: string;
  title: string;
  message: string;
  type?: string;
  data?: Record<string, any>;
}) {
  if (!targetNrp || !title || !message) {
    throw new Error('targetNrp, title, dan message wajib diisi.');
  }

  const id = crypto.randomUUID();
  const normalizedTarget = targetNrp.trim().toLowerCase();

  const { error } = await supabase.from(NOTIFICATIONS_TABLE).insert({
    id,
    target_nrp: normalizedTarget,
    title,
    message,
    is_read: false,
    type: type || 'general',
    data: data || {},
    push_status: 'pending',
    created_at: new Date().toISOString(),
  });

  if (error) throw error;
  return id;
}

export async function markNotificationAsRead(notificationId: string) {
  await supabase
    .from(NOTIFICATIONS_TABLE)
    .update({ is_read: true })
    .eq('id', notificationId);
}

export async function markAllNotificationsAsRead(targetNrp: string) {
  if (!targetNrp) return;
  const normalizedNrp = targetNrp.trim().toLowerCase();

  await supabase
    .from(NOTIFICATIONS_TABLE)
    .update({ is_read: true })
    .or(`target_nrp.eq.${normalizedNrp},target_nrp.eq.all,target_nrp.eq.ALL`)
    .eq('is_read', false);
}

export async function updateNotificationPushStatus(
  notificationId: string,
  status: 'sent' | 'failed'
) {
  await supabase
    .from(NOTIFICATIONS_TABLE)
    .update({ push_status: status })
    .eq('id', notificationId);
}

export async function deleteNotification(notificationId: string) {
  await supabase
    .from(NOTIFICATIONS_TABLE)
    .delete()
    .eq('id', notificationId);
}