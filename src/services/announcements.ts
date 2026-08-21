import { supabase } from './supabase';
import { Announcement } from '../types';

const TABLE_NAME = 'announcements';

export const subscribeAnnouncements = (
  callback: (announcements: Announcement[]) => void
) => {
  const fetchAnnouncements = async () => {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('*')
      .order('pinned', { ascending: false })
      .order('date', { ascending: false });

    if (error) {
      console.error('Error fetching announcements from Supabase:', error);
      return;
    }

    if (data) {
      const list: Announcement[] = data.map((item) => ({
        id: item.id,
        title: item.title || '',
        content: item.content || '',
        date: item.date || new Date().toISOString().split('T')[0],
        category: item.category || 'Penting',
        author: item.author || 'Pengurus Kelas',
        pinned: Boolean(item.pinned),
      }));

      callback(list);
    }
  };

  fetchAnnouncements();

  const channelId = `announcements-${Math.random().toString(36).substring(2, 9)}`;
  const channel = supabase
    .channel(channelId)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: TABLE_NAME },
      () => {
        fetchAnnouncements();
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};

export const addAnnouncement = async (
  announcement: Omit<Announcement, 'id' | 'date'>
) => {
  const todayStr = new Date().toISOString().split('T')[0];
  const newId = crypto.randomUUID();

  const { error } = await supabase.from(TABLE_NAME).insert({
    id: newId,
    title: announcement.title,
    content: announcement.content,
    category: announcement.category || 'Penting',
    author: announcement.author || 'Pengurus Kelas',
    pinned: Boolean(announcement.pinned),
    date: todayStr,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  if (error) throw error;
  return newId;
};

export const updateAnnouncement = async (
  id: string,
  updatedData: Partial<Omit<Announcement, 'id'>>
) => {
  const { error } = await supabase
    .from(TABLE_NAME)
    .update({ ...updatedData, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) throw error;
};

export const deleteAnnouncement = async (id: string) => {
  const { error } = await supabase
    .from(TABLE_NAME)
    .delete()
    .eq('id', id);

  if (error) throw error;
};