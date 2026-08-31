import { supabase } from './supabase';

export interface MbudTalkGroup {
  id: string;
  name: string;
  avatar_url: string;
  created_by: string;
  created_at: string;
  last_message?: string;
  last_message_at?: string;
  has_unread?: boolean;
}

export interface GroupMessage {
  id: string;
  group_id: string;
  sender_nrp: string;
  sender_name: string;
  content: string;
  reply_to_id?: string;
  reply_to_sender?: string;
  reply_to_text?: string;
  created_at: string;
}

// 1. Buat Grup Baru
export const createGroup = async (
  name: string,
  createdByNrp: string,
  memberNrps: string[],
  avatarUrl: string = ''
) => {
  const { data: group, error: groupErr } = await supabase
    .from('mbudtalk_groups')
    .insert([{ name, created_by: createdByNrp, avatar_url: avatarUrl }])
    .select()
    .single();

  if (groupErr) throw groupErr;

  const allMembers = Array.from(new Set([createdByNrp, ...memberNrps]));
  const memberData = allMembers.map((nrp) => ({
    group_id: group.id,
    user_nrp: nrp,
    role: nrp === createdByNrp ? 'admin' : 'member',
  }));

  const { error: memberErr } = await supabase
    .from('mbudtalk_group_members')
    .insert(memberData);

  if (memberErr) throw memberErr;
  return group;
};

// 2. Ambil Daftar Grup User (Termasuk Status Unread)
export const getUserGroups = async (userNrp: string): Promise<MbudTalkGroup[]> => {
  const { data: memberRows, error: memberErr } = await supabase
    .from('mbudtalk_group_members')
    .select('group_id, last_read_at')
    .eq('user_nrp', userNrp);

  if (memberErr || !memberRows.length) return [];

  const groupIds = memberRows.map((m) => m.group_id);

  const { data: groups, error: groupErr } = await supabase
    .from('mbudtalk_groups')
    .select('*')
    .in('id', groupIds);

  if (groupErr) return [];

  const formattedGroups = await Promise.all(
    groups.map(async (group) => {
      const memberInfo = memberRows.find((m) => m.group_id === group.id);
      const lastReadAt = memberInfo?.last_read_at ? new Date(memberInfo.last_read_at).getTime() : 0;

      const { data: lastMsg } = await supabase
        .from('mbudtalk_group_messages')
        .select('content, created_at')
        .eq('group_id', group.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      const lastMsgTime = lastMsg ? new Date(lastMsg.created_at).getTime() : 0;

      return {
        ...group,
        last_message: lastMsg ? lastMsg.content : 'Grup dibuat',
        last_message_at: lastMsg ? lastMsg.created_at : group.created_at,
        has_unread: lastMsgTime > lastReadAt,
      };
    })
  );

  return formattedGroups.sort(
    (a, b) => new Date(b.last_message_at || 0).getTime() - new Date(a.last_message_at || 0).getTime()
  );
};

// 3. Update Profil Grup (Nama & Foto PP)
export const updateGroupProfile = async (
  groupId: string,
  name: string,
  avatarUrl: string
) => {
  const { data, error } = await supabase
    .from('mbudtalk_groups')
    .update({ name, avatar_url: avatarUrl })
    .eq('id', groupId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

// 4. Kirim Pesan Grup (Dukungan Reply)
export const sendGroupMessage = async (
  groupId: string,
  senderNrp: string,
  senderName: string,
  content: string,
  replyTo?: { id: string; sender: string; text: string }
) => {
  const payload: any = {
    group_id: groupId,
    sender_nrp: senderNrp,
    sender_name: senderName,
    content,
  };

  if (replyTo) {
    payload.reply_to_id = replyTo.id;
    payload.reply_to_sender = replyTo.sender;
    payload.reply_to_text = replyTo.text;
  }

  const { data, error } = await supabase
    .from('mbudtalk_group_messages')
    .insert([payload])
    .select()
    .single();

  if (error) throw error;
  return data;
};

// 5. Update Status Read (Tandai Grup Dibaca)
export const markGroupAsRead = async (groupId: string, userNrp: string) => {
  await supabase
    .from('mbudtalk_group_members')
    .update({ last_read_at: new Date().toISOString() })
    .eq('group_id', groupId)
    .eq('user_nrp', userNrp);
};

// 6. Tambah Anggota Baru ke Grup Eksisting
export const addGroupMembers = async (groupId: string, newMemberNrps: string[]) => {
  if (!newMemberNrps.length) return;

  const memberData = newMemberNrps.map((nrp) => ({
    group_id: groupId,
    user_nrp: nrp,
    role: 'member',
  }));

  const { error } = await supabase
    .from('mbudtalk_group_members')
    .insert(memberData);

  if (error) throw error;
};

// 7. Ambil Daftar Anggota Grup Eksisting
export const getGroupMembers = async (groupId: string) => {
  const { data, error } = await supabase
    .from('mbudtalk_group_members')
    .select('user_nrp, role')
    .eq('group_id', groupId);

  if (error) return [];
  return data;
};