import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, 
  Send, 
  MessageSquare, 
  Search, 
  Loader2, 
  MessageSquarePlus, 
  X,
  ImagePlus,
  Users,
  Plus,
  Edit3,
  Check,
  Camera
} from 'lucide-react';
import { supabase } from '../services/supabase';
import { 
  subscribeToChatRoom, 
  sendChatMessage, 
  clearUnreadNotification, 
  subscribeToRecentChats,
  subscribeToUserUnreads,
  RecentChatMeta
} from '../services/firebaseChat';
import {
  createGroup,
  getUserGroups,
  updateGroupProfile,
  sendGroupMessage,
  markGroupAsRead,
  MbudTalkGroup
} from '../services/mbudtalkGroupService';
import { uploadImageToCloudinary } from './mbudiary/lib/cloudinary';

interface UserProfile {
  nrp: string;
  nickname?: string;
  username?: string;
  photo_url?: string;
  avatar_url?: string;
}

interface MbudTalkViewProps {
  onBack: () => void;
  targetNrp?: string | null;
}

interface ReplyState {
  id: string;
  sender: string;
  text: string;
}

interface CombinedChatItem {
  id: string;
  type: 'dm' | 'group';
  name: string;
  avatar?: string | null;
  lastMessage: string;
  lastTimestamp: number;
  isUnread: boolean;
  rawProfile?: UserProfile;
  rawGroup?: MbudTalkGroup;
}

const formatChatDateDivider = (timestamp: number): string => {
  const date = new Date(timestamp);
  const now = new Date();

  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday =
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear();

  if (isToday) return 'Hari Ini';
  if (isYesterday) return 'Kemarin';

  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 7) {
    return date.toLocaleDateString('id-ID', { weekday: 'long' });
  }

  return date.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
};

const isDifferentDay = (ts1: number, ts2: number): boolean => {
  const d1 = new Date(ts1);
  const d2 = new Date(ts2);
  return (
    d1.getDate() !== d2.getDate() ||
    d1.getMonth() !== d2.getMonth() ||
    d1.getFullYear() !== d2.getFullYear()
  );
};

export const MbudTalkView: React.FC<MbudTalkViewProps> = ({ onBack, targetNrp }) => {
  const currentUserNrp = typeof window !== 'undefined' ? (localStorage.getItem('mymbud_user_nrp') || '').trim().toLowerCase() : '';
  const currentUserName = typeof window !== 'undefined' ? localStorage.getItem('mymbud_user_name') || 'Teman' : 'Teman';

  const [activeChat, setActiveChat] = useState<{ type: 'dm' | 'group'; data: UserProfile | MbudTalkGroup } | null>(null);

  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [recentChats, setRecentChats] = useState<RecentChatMeta[]>([]);
  const [groupList, setGroupList] = useState<MbudTalkGroup[]>([]);
  const [unreadMap, setUnreadMap] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState<boolean>(true);

  const [searchQuery, setSearchQuery] = useState<string>('');

  const [isNewChatModalOpen, setIsNewChatModalOpen] = useState<boolean>(false);
  const [isCreateGroupModalOpen, setIsCreateGroupModalOpen] = useState<boolean>(false);
  const [isEditGroupModalOpen, setIsEditGroupModalOpen] = useState<boolean>(false);

  const [searchNewUser, setSearchNewUser] = useState<string>('');
  const [newGroupName, setNewGroupName] = useState<string>('');
  const [selectedGroupMembers, setSelectedGroupMembers] = useState<string[]>([]);
  const [editGroupName, setEditGroupName] = useState<string>('');
  const [editGroupAvatarFile, setEditGroupAvatarFile] = useState<File | null>(null);
  const [editGroupAvatarPreview, setEditGroupAvatarPreview] = useState<string>('');

  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState<string>('');
  const [isSending, setIsSending] = useState<boolean>(false);
  const [replyTo, setReplyTo] = useState<ReplyState | null>(null);

  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [previewZoomImage, setPreviewZoomImage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const groupAvatarInputRef = useRef<HTMLInputElement>(null);
  const chatScrollContainerRef = useRef<HTMLDivElement>(null);
  const [viewportHeight, setViewportHeight] = useState<string>('100%');

  const getUserDisplayName = (u?: UserProfile | null) => u?.nickname || u?.username || u?.nrp || 'Teman';
  const getUserAvatar = (u?: UserProfile | null) => u?.photo_url || u?.avatar_url || null;

  const fetchGroups = async () => {
    if (!currentUserNrp) return;
    try {
      const groups = await getUserGroups(currentUserNrp);
      setGroupList(groups);
    } catch (err) {
      console.error('Gagal mengambil grup:', err);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, [currentUserNrp]);

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase.from('mbudiary_users').select('*');
        if (!error && data) {
          const others = data.filter(
            (u: any) => String(u.nrp || '').trim().toLowerCase() !== currentUserNrp
          );
          setAllUsers(others);

          if (targetNrp) {
            const found = others.find(
              (u: any) => String(u.nrp || '').trim().toLowerCase() === targetNrp.trim().toLowerCase()
            );
            if (found) setActiveChat({ type: 'dm', data: found });
          }
        }
      } catch (err) {
        console.error('Gagal memuat kontak:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, [currentUserNrp, targetNrp]);

  useEffect(() => {
    if (!currentUserNrp) return;
    const unsubRecent = subscribeToRecentChats(currentUserNrp, setRecentChats);
    const unsubUnreads = subscribeToUserUnreads(currentUserNrp, setUnreadMap);
    return () => {
      unsubRecent();
      unsubUnreads();
    };
  }, [currentUserNrp]);

  useEffect(() => {
    if (!currentUserNrp || !activeChat || activeChat.type !== 'dm') return;
    const partner = activeChat.data as UserProfile;
    clearUnreadNotification(currentUserNrp, partner.nrp);

    const unsubscribe = subscribeToChatRoom(
      currentUserNrp,
      partner.nrp,
      (incomingMessages) => {
        setMessages(incomingMessages);
      }
    );
    return () => unsubscribe();
  }, [currentUserNrp, activeChat]);

  useEffect(() => {
    if (!activeChat || activeChat.type !== 'group') return;
    const group = activeChat.data as MbudTalkGroup;

    markGroupAsRead(group.id, currentUserNrp).then(fetchGroups);

    const fetchGroupMessages = async () => {
      const { data } = await supabase
        .from('mbudtalk_group_messages')
        .select('*')
        .eq('group_id', group.id)
        .order('created_at', { ascending: true });

      if (data) {
        setMessages(
          data.map((m) => ({
            id: m.id,
            senderNrp: m.sender_nrp,
            senderName: m.sender_name,
            text: m.content,
            replyTo: m.reply_to_id ? { id: m.reply_to_id, sender: m.reply_to_sender, text: m.reply_to_text } : undefined,
            timestamp: new Date(m.created_at).getTime(),
          }))
        );
      }
    };

    fetchGroupMessages();

    const channel = supabase
      .channel(`group-messages-${group.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'mbudtalk_group_messages', filter: `group_id=eq.${group.id}` },
        (payload) => {
          const m = payload.new;
          const newMsg = {
            id: m.id,
            senderNrp: m.sender_nrp,
            senderName: m.sender_name,
            text: m.content,
            replyTo: m.reply_to_id ? { id: m.reply_to_id, sender: m.reply_to_sender, text: m.reply_to_text } : undefined,
            timestamp: new Date(m.created_at).getTime(),
          };
          setMessages((prev) => [...prev, newMsg]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeChat]);

  useEffect(() => {
    if (chatScrollContainerRef.current) {
      chatScrollContainerRef.current.scrollTop = chatScrollContainerRef.current.scrollHeight;
    }
  }, [messages, imagePreviewUrl, replyTo]);

  useEffect(() => {
    const handleViewportChange = () => {
      if (typeof window !== 'undefined' && window.visualViewport) {
        const activeHeight = window.visualViewport.height - (window.innerWidth < 1024 ? 68 : 0);
        setViewportHeight(`${activeHeight}px`);
      }
    };

    if (typeof window !== 'undefined' && window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleViewportChange);
      window.visualViewport.addEventListener('scroll', handleViewportChange);
      handleViewportChange();
    }

    return () => {
      if (typeof window !== 'undefined' && window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleViewportChange);
        window.visualViewport.removeEventListener('scroll', handleViewportChange);
      }
    };
  }, []);

  const handleSelectImageFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImageFile(file);
      setImagePreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleClearSelectedImage = () => {
    setSelectedImageFile(null);
    setImagePreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!inputText.trim() && !selectedImageFile) || isSending || !activeChat) return;

    const text = inputText.trim();
    setIsSending(true);

    try {
      let uploadedImageUrl: string | undefined = undefined;
      if (selectedImageFile) {
        uploadedImageUrl = await uploadImageToCloudinary(selectedImageFile);
      }

      if (activeChat.type === 'dm') {
        const partner = activeChat.data as UserProfile;
        await sendChatMessage(
          currentUserNrp,
          partner.nrp,
          text,
          currentUserName,
          uploadedImageUrl,
          replyTo ? { id: replyTo.id, sender: replyTo.sender, text: replyTo.text } : undefined
        );
      } else {
        const group = activeChat.data as MbudTalkGroup;
        await sendGroupMessage(
          group.id,
          currentUserNrp,
          currentUserName,
          text || (uploadedImageUrl ? '[Gambar]' : ''),
          replyTo ? { id: replyTo.id, sender: replyTo.sender, text: replyTo.text } : undefined
        );
      }

      setInputText('');
      handleClearSelectedImage();
      setReplyTo(null);
    } catch (error) {
      console.error('Gagal mengirim pesan:', error);
      alert('Gagal mengirim pesan.');
    } finally {
      setIsSending(false);
    }
  };

  const handleCreateGroupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;

    try {
      setIsSending(true);
      const newGroup = await createGroup(
        newGroupName.trim(),
        currentUserNrp,
        selectedGroupMembers
      );
      setNewGroupName('');
      setSelectedGroupMembers([]);
      setIsCreateGroupModalOpen(false);
      await fetchGroups();
      setActiveChat({ type: 'group', data: newGroup });
    } catch (err) {
      console.error('Gagal membuat grup:', err);
      alert('Gagal membuat grup.');
    } finally {
      setIsSending(false);
    }
  };

  const handleUpdateGroupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeChat || activeChat.type !== 'group' || !editGroupName.trim()) return;
    const group = activeChat.data as MbudTalkGroup;

    try {
      setIsSending(true);
      let avatarUrl = group.avatar_url;

      if (editGroupAvatarFile) {
        avatarUrl = await uploadImageToCloudinary(editGroupAvatarFile);
      }

      const updated = await updateGroupProfile(group.id, editGroupName.trim(), avatarUrl);
      setActiveChat({ type: 'group', data: updated });
      await fetchGroups();
      setIsEditGroupModalOpen(false);
    } catch (err) {
      console.error('Gagal memperbarui grup:', err);
      alert('Gagal memperbarui info grup.');
    } finally {
      setIsSending(false);
    }
  };

  const combinedChatList: CombinedChatItem[] = [
    ...recentChats.map((item) => {
      const userProfile = allUsers.find(
        (u) => String(u.nrp).trim().toLowerCase() === item.partnerNrp.toLowerCase()
      );
      return {
        id: `dm_${item.partnerNrp}`,
        type: 'dm' as const,
        name: getUserDisplayName(userProfile),
        avatar: getUserAvatar(userProfile),
        lastMessage: item.lastMessage,
        lastTimestamp: item.lastTimestamp,
        isUnread: Boolean(unreadMap[item.partnerNrp.toLowerCase()]),
        rawProfile: userProfile || { nrp: item.partnerNrp, nickname: item.partnerNrp },
      };
    }),
    ...groupList.map((g) => ({
      id: `group_${g.id}`,
      type: 'group' as const,
      name: g.name,
      avatar: g.avatar_url,
      lastMessage: g.last_message || 'Grup dibuat',
      lastTimestamp: new Date(g.last_message_at || g.created_at).getTime(),
      isUnread: Boolean(g.has_unread),
      rawGroup: g,
    })),
  ].sort((a, b) => b.lastTimestamp - a.lastTimestamp);

  const filteredCombinedList = combinedChatList.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredNewUsers = allUsers.filter((u) => {
    const q = searchNewUser.toLowerCase();
    const nickname = (u.nickname || '').toLowerCase();
    const username = (u.username || '').toLowerCase();
    const nrp = String(u.nrp || '').toLowerCase();
    return nickname.includes(q) || username.includes(q) || nrp.includes(q);
  });

  return (
    <div
      style={{ height: viewportHeight }}
      className="fixed inset-x-0 bottom-0 top-[68px] z-30 px-3 pb-2 pt-1 lg:static lg:h-[calc(100vh-10.5rem)] lg:max-h-[660px] lg:px-0 lg:py-0 w-full max-w-5xl mx-auto flex flex-col lg:flex-row gap-3 overflow-hidden select-none"
    >
      {/* BILAH KIRI: DAFTAR OBROLAN */}
      <div
        className={`w-full lg:w-80 flex flex-col gap-2.5 h-full ${
          activeChat ? 'hidden lg:flex' : 'flex'
        }`}
      >
        <div className="flex items-center justify-between gap-3 p-2.5 px-4 rounded-3xl bg-white/60 dark:bg-zinc-900/50 backdrop-blur-xl border border-white/60 dark:border-white/10 shadow-xs shrink-0">
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onBack}
              className="p-1.5 rounded-2xl text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-white/40 dark:hover:bg-zinc-800/60 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h2 className="text-sm font-bold text-slate-800 dark:text-zinc-100 tracking-tight">
              mbudTalk
            </h2>
          </div>

          {/* TOMBOL BIRU INTEGRASI UNTUK PEMBUATAN CHAT/GRUP */}
          <button
            onClick={() => setIsNewChatModalOpen(true)}
            className="w-8 h-8 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 flex items-center justify-center cursor-pointer transition-all shrink-0"
            title="Mulai Chat atau Buat Grup Baru"
          >
            <MessageSquarePlus className="w-4 h-4" />
          </button>
        </div>

        <div className="relative flex items-center shrink-0 w-full rounded-2xl bg-white/50 dark:bg-zinc-900/40 backdrop-blur-lg border border-white/50 dark:border-white/5 px-3 py-1.5 shadow-xs">
          <Search className="w-4 h-4 text-slate-400 dark:text-zinc-400 shrink-0 mr-2.5 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari pesan atau grup..."
            className="w-full bg-transparent text-xs text-slate-800 dark:text-zinc-200 placeholder-slate-400 focus:outline-none"
          />
        </div>

        <div className="flex-1 overflow-y-auto space-y-1.5 custom-scrollbar pr-0.5">
          {loading ? (
            <div className="flex flex-col items-center justify-center p-8 space-y-2 text-slate-400">
              <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
              <span className="text-xs">Memuat obrolan...</span>
            </div>
          ) : filteredCombinedList.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center space-y-3 rounded-3xl bg-white/40 dark:bg-zinc-900/30 backdrop-blur-md border border-white/40 dark:border-white/5 text-slate-400 my-auto">
              <MessageSquare className="w-6 h-6 text-blue-500" />
              <p className="text-xs font-bold text-slate-800 dark:text-zinc-200">Belum ada obrolan</p>
            </div>
          ) : (
            filteredCombinedList.map((item) => {
              const isSelected =
                (activeChat?.type === 'dm' && activeChat.data && (activeChat.data as UserProfile).nrp === item.rawProfile?.nrp) ||
                (activeChat?.type === 'group' && activeChat.data && (activeChat.data as MbudTalkGroup).id === item.rawGroup?.id);

              return (
                <motion.div
                  key={item.id}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    if (item.type === 'dm' && item.rawProfile) {
                      setActiveChat({ type: 'dm', data: item.rawProfile });
                    } else if (item.type === 'group' && item.rawGroup) {
                      setActiveChat({ type: 'group', data: item.rawGroup });
                    }
                  }}
                  className={`flex items-center gap-3 p-3 rounded-3xl cursor-pointer transition-all backdrop-blur-md border ${
                    isSelected
                      ? 'bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-500/20'
                      : 'bg-white/50 dark:bg-zinc-900/40 border-white/50 dark:border-white/5 hover:bg-white/75 dark:hover:bg-zinc-800/60 text-slate-800 dark:text-zinc-200'
                  }`}
                >
                  <div className="relative w-10 h-10 rounded-2xl bg-slate-200 dark:bg-zinc-800 flex items-center justify-center overflow-hidden border border-white/40 shrink-0 shadow-xs">
                    {item.avatar ? (
                      <img src={item.avatar} alt={item.name} className="w-full h-full object-cover" />
                    ) : item.type === 'group' ? (
                      <Users className={`w-5 h-5 ${isSelected ? 'text-white' : 'text-blue-600 dark:text-blue-400'}`} />
                    ) : (
                      <span className={`text-xs font-bold ${isSelected ? 'text-white' : 'text-slate-700 dark:text-zinc-200'}`}>
                        {item.name.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <p className={`text-xs font-bold truncate ${isSelected ? 'text-white' : 'text-slate-800 dark:text-zinc-100'}`}>
                        {item.name}
                      </p>
                      <span className={`text-[10px] shrink-0 ${isSelected ? 'text-blue-100' : 'text-slate-400'}`}>
                        {new Date(item.lastTimestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2 mt-0.5">
                      <p className={`text-[11px] truncate flex-1 ${isSelected ? 'text-blue-100' : 'text-slate-500 dark:text-zinc-400'}`}>
                        {item.lastMessage}
                      </p>
                      {item.isUnread && !isSelected && (
                        <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse shrink-0" />
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      </div>

      {/* BILAH KANAN: RUANG CHAT AKTIF */}
      <div
        className={`flex-1 flex flex-col gap-2.5 h-full overflow-hidden ${
          !activeChat ? 'hidden lg:flex' : 'flex'
        }`}
      >
        {activeChat ? (
          <>
            <div className="flex items-center justify-between gap-3 p-2 px-4 rounded-3xl bg-white/60 dark:bg-zinc-900/50 backdrop-blur-xl border border-white/60 dark:border-white/10 shadow-xs shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <button
                  type="button"
                  onClick={() => setActiveChat(null)}
                  className="lg:hidden p-1.5 rounded-2xl text-slate-400 hover:text-slate-800 dark:hover:text-white"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>

                <div className="w-8 h-8 rounded-2xl bg-slate-200 dark:bg-zinc-800 flex items-center justify-center overflow-hidden border border-white/40 shrink-0">
                  {activeChat.type === 'dm' ? (
                    getUserAvatar(activeChat.data as UserProfile) ? (
                      <img src={getUserAvatar(activeChat.data as UserProfile)!} alt={getUserDisplayName(activeChat.data as UserProfile)} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xs font-bold text-slate-700 dark:text-zinc-200">
                        {getUserDisplayName(activeChat.data as UserProfile).charAt(0).toUpperCase()}
                      </span>
                    )
                  ) : (
                    (activeChat.data as MbudTalkGroup).avatar_url ? (
                      <img src={(activeChat.data as MbudTalkGroup).avatar_url} alt={(activeChat.data as MbudTalkGroup).name} className="w-full h-full object-cover" />
                    ) : (
                      <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    )
                  )}
                </div>

                <div className="min-w-0">
                  <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-zinc-100 leading-tight truncate">
                    {activeChat.type === 'dm' ? getUserDisplayName(activeChat.data as UserProfile) : (activeChat.data as MbudTalkGroup).name}
                  </h3>
                  <p className="text-[10px] text-slate-400 truncate">
                    {activeChat.type === 'dm' ? `@${(activeChat.data as UserProfile).username || (activeChat.data as UserProfile).nrp}` : 'Grup Obrolan'}
                  </p>
                </div>
              </div>

              {activeChat.type === 'group' && (
                <button
                  onClick={() => {
                    const g = activeChat.data as MbudTalkGroup;
                    setEditGroupName(g.name);
                    setEditGroupAvatarPreview(g.avatar_url);
                    setIsEditGroupModalOpen(true);
                  }}
                  className="p-2 rounded-2xl text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-white/40 dark:hover:bg-zinc-800 transition-colors"
                  title="Edit Info Grup"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* MESSAGES STREAM BOX */}
            <div 
              ref={chatScrollContainerRef}
              className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2.5 custom-scrollbar rounded-3xl bg-white/30 dark:bg-zinc-900/25 backdrop-blur-md border border-white/40 dark:border-white/5"
            >
              {messages.map((msg, idx) => {
                const isMe = String(msg.senderNrp).trim().toLowerCase() === currentUserNrp;
                const showDateDivider = idx === 0 || isDifferentDay(messages[idx - 1].timestamp, msg.timestamp);
                
                // Cari nickname jika pengirim adalah orang lain di DM
                let senderDisplayName = msg.senderName;
                if (!senderDisplayName || senderDisplayName === msg.senderNrp) {
                  if (activeChat.type === 'dm') {
                    senderDisplayName = getUserDisplayName(activeChat.data as UserProfile);
                  } else {
                    const foundUser = allUsers.find(u => u.nrp.toLowerCase() === String(msg.senderNrp).toLowerCase());
                    senderDisplayName = foundUser ? getUserDisplayName(foundUser) : msg.senderNrp;
                  }
                }

                return (
                  <React.Fragment key={msg.id || idx}>
                    {showDateDivider && (
                      <div className="flex items-center justify-center my-2.5">
                        <span className="px-3 py-1 rounded-full text-[10px] font-semibold bg-white/60 dark:bg-zinc-800/60 border border-white/50 dark:border-white/5 text-slate-500">
                          {formatChatDateDivider(msg.timestamp)}
                        </span>
                      </div>
                    )}

                    <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                      <div
                        onClick={() => {
                          setReplyTo({
                            id: msg.id || String(idx),
                            sender: senderDisplayName,
                            text: msg.text || (msg.imageUrl ? '[Gambar]' : ''),
                          });
                        }}
                        className={`max-w-[82%] sm:max-w-[70%] p-3 rounded-3xl text-xs sm:text-sm shadow-xs backdrop-blur-md cursor-pointer hover:opacity-95 transition-all ${
                          isMe
                            ? 'bg-blue-600 text-white rounded-br-xs'
                            : 'bg-white/80 dark:bg-zinc-800/80 text-slate-800 dark:text-zinc-100 rounded-bl-xs border border-white/60 dark:border-white/5'
                        }`}
                        title="Klik untuk membalas pesan ini"
                      >
                        {activeChat.type === 'group' && !isMe && (
                          <p className="text-[10px] font-bold text-blue-500 dark:text-blue-400 mb-1">
                            {senderDisplayName}
                          </p>
                        )}

                        {/* BOX BALASAN PESAN DI DALAM BUBBLE */}
                        {msg.replyTo && (
                          <div className={`p-2 mb-2 rounded-xl text-[11px] border-l-4 ${isMe ? 'bg-blue-700/50 border-white text-white/90' : 'bg-slate-100 dark:bg-zinc-700 border-blue-500 text-slate-700 dark:text-zinc-200'}`}>
                            <p className="font-bold">Membalas {msg.replyTo.sender}</p>
                            <p className="truncate opacity-80">{msg.replyTo.text}</p>
                          </div>
                        )}

                        {msg.imageUrl && (
                          <div className="mb-2 overflow-hidden rounded-2xl border border-black/10 dark:border-white/10">
                            <img
                              src={msg.imageUrl}
                              alt="Attachment"
                              onClick={(e) => {
                                e.stopPropagation();
                                setPreviewZoomImage(msg.imageUrl);
                              }}
                              className="w-full max-h-60 object-cover hover:scale-105 transition-transform"
                            />
                          </div>
                        )}

                        {msg.text && (
                          <p className="whitespace-pre-wrap break-words leading-relaxed">{msg.text}</p>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 px-2 mt-1">
                        {new Date(msg.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </React.Fragment>
                );
              })}
            </div>

            {imagePreviewUrl && (
              <div className="relative px-3 py-2 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border border-white/60 dark:border-white/10 rounded-2xl flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <img src={imagePreviewUrl} alt="Preview Upload" className="w-12 h-12 rounded-xl object-cover border border-slate-200 dark:border-zinc-700" />
                  <div>
                    <p className="text-xs font-bold text-slate-800 dark:text-zinc-100">Siap Dikirim!</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleClearSelectedImage}
                  className="p-1 rounded-full bg-slate-200 dark:bg-zinc-800 hover:bg-rose-500 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* PREVIEW BAR REPLIES INPUT */}
            {replyTo && (
              <div className="px-3 py-2 bg-blue-50/80 dark:bg-blue-950/40 border-l-4 border-blue-600 rounded-xl flex items-center justify-between text-xs shrink-0">
                <div className="min-w-0 pr-2">
                  <p className="font-bold text-blue-600 dark:text-blue-400">Membalas {replyTo.sender}</p>
                  <p className="truncate text-slate-600 dark:text-zinc-300">{replyTo.text}</p>
                </div>
                <button onClick={() => setReplyTo(null)} className="p-1 text-slate-400 hover:text-slate-600">
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            <form
              onSubmit={handleSendMessage}
              className="p-1.5 pl-3 rounded-3xl bg-white/70 dark:bg-zinc-900/60 backdrop-blur-xl border border-white/70 dark:border-white/10 shadow-xs flex items-center gap-2 shrink-0"
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleSelectImageFile}
                accept="image/*"
                className="hidden"
              />

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isSending}
                className="p-2 rounded-2xl text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-white/60 dark:hover:bg-zinc-800 transition-colors shrink-0 disabled:opacity-50 cursor-pointer"
                title="Pilih Gambar"
              >
                <ImagePlus className="w-5 h-5" />
              </button>

              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Ketik pesan..."
                disabled={isSending}
                className="flex-1 bg-transparent text-xs sm:text-sm text-slate-900 dark:text-zinc-100 focus:outline-none"
              />

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                type="submit"
                disabled={(!inputText.trim() && !selectedImageFile) || isSending}
                className="w-10 h-10 rounded-2xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white flex items-center justify-center shadow-md shadow-blue-500/25 transition-all shrink-0 cursor-pointer"
              >
                {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 -rotate-12" />}
              </motion.button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 space-y-3 rounded-3xl bg-white/30 dark:bg-zinc-900/25 backdrop-blur-md border border-white/40 dark:border-white/5 text-slate-400">
            <MessageSquare className="w-8 h-8 text-blue-500" />
            <p className="text-xs">Pilih obrolan dari daftar sebelah kiri.</p>
          </div>
        )}
      </div>

      <AnimatePresence>
        {previewZoomImage && (
          <div className="fixed inset-0 z-[999999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }} className="relative max-w-4xl max-h-[90vh]">
              <button onClick={() => setPreviewZoomImage(null)} className="absolute -top-10 right-0 p-2 text-white">
                <X className="w-6 h-6" />
              </button>
              <img src={previewZoomImage} alt="Zoom" className="max-w-full max-h-[85vh] rounded-2xl object-contain" />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isEditGroupModalOpen && activeChat?.type === 'group' && (
          <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsEditGroupModalOpen(false)} className="fixed inset-0 bg-slate-950/70 backdrop-blur-md" />
            <motion.div initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.92, opacity: 0 }} className="relative z-10 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-2xl border border-white/50 dark:border-white/10 text-slate-800 dark:text-zinc-100 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-base font-bold">Edit Info Grup</h3>
                <button onClick={() => setIsEditGroupModalOpen(false)}><X className="w-5 h-5 text-slate-400" /></button>
              </div>

              <form onSubmit={handleUpdateGroupSubmit} className="space-y-4">
                <div className="flex flex-col items-center gap-2">
                  <div className="relative w-20 h-20 rounded-full bg-slate-200 dark:bg-zinc-800 flex items-center justify-center overflow-hidden border-2 border-blue-500">
                    {editGroupAvatarPreview ? (
                      <img src={editGroupAvatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <Users className="w-8 h-8 text-slate-400" />
                    )}
                    <button
                      type="button"
                      onClick={() => groupAvatarInputRef.current?.click()}
                      className="absolute inset-0 bg-black/40 flex items-center justify-center text-white opacity-0 hover:opacity-100 transition-opacity"
                    >
                      <Camera className="w-6 h-6" />
                    </button>
                  </div>
                  <input
                    type="file"
                    ref={groupAvatarInputRef}
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setEditGroupAvatarFile(file);
                        setEditGroupAvatarPreview(URL.createObjectURL(file));
                      }
                    }}
                  />
                  <span className="text-[11px] text-slate-400">Klik foto untuk mengganti</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1">Nama Grup</label>
                  <input
                    type="text"
                    value={editGroupName}
                    onChange={(e) => setEditGroupName(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-2xl bg-slate-100 dark:bg-zinc-800 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSending}
                  className="w-full py-2.5 rounded-2xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 transition-all shadow-md shadow-blue-500/20"
                >
                  {isSending ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Simpan Perubahan'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL INTEGRASI LENGKAP: MULAI CHAT BARU / BUAT GRUP */}
      <AnimatePresence>
        {isNewChatModalOpen && (
          <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsNewChatModalOpen(false)} className="fixed inset-0 bg-slate-950/70 backdrop-blur-md" />
            <motion.div initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.92, opacity: 0 }} className="relative z-10 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-2xl border border-white/50 dark:border-white/10 text-slate-800 dark:text-zinc-100 rounded-3xl max-w-md w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200/50 dark:border-white/10 flex items-center justify-between shrink-0">
                <h3 className="text-base font-bold">Mulai Chat Baru</h3>
                <button onClick={() => setIsNewChatModalOpen(false)}><X className="w-5 h-5 text-slate-400" /></button>
              </div>

              {/* ACTION ROW: TOMBOL KUSTOM BUAT GRUP BARU DI DALAM MODAL */}
              <div className="p-3 border-b border-slate-200/40 dark:border-white/10 shrink-0 space-y-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsNewChatModalOpen(false);
                    setIsCreateGroupModalOpen(true);
                  }}
                  className="w-full p-3 rounded-2xl bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 dark:hover:bg-blue-900/60 border border-blue-200/60 dark:border-blue-900/40 text-blue-600 dark:text-blue-400 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs"
                >
                  <Users className="w-4 h-4" />
                  <span>+ Buat Grup Obrolan Baru</span>
                </button>

                <div className="relative flex items-center w-full rounded-2xl bg-white/60 dark:bg-zinc-800/60 border border-white/40 dark:border-white/10 px-3 py-2">
                  <Search className="w-4 h-4 text-slate-400 mr-2.5" />
                  <input
                    type="text"
                    value={searchNewUser}
                    onChange={(e) => setSearchNewUser(e.target.value)}
                    placeholder="Cari nama atau username teman..."
                    className="w-full bg-transparent text-xs text-slate-800 dark:text-zinc-200 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-3 space-y-1 custom-scrollbar">
                {filteredNewUsers.map((user) => {
                  const displayName = getUserDisplayName(user);
                  const avatar = getUserAvatar(user);

                  return (
                    <div
                      key={user.nrp}
                      onClick={() => {
                        setActiveChat({ type: 'dm', data: user });
                        setIsNewChatModalOpen(false);
                      }}
                      className="flex items-center gap-3 p-3 rounded-2xl cursor-pointer hover:bg-white/60 dark:hover:bg-zinc-800/60 transition-all"
                    >
                      <div className="w-10 h-10 rounded-2xl bg-slate-200 dark:bg-zinc-800 flex items-center justify-center overflow-hidden border border-white/40 shrink-0">
                        {avatar ? <img src={avatar} alt={displayName} className="w-full h-full object-cover" /> : <span className="text-xs font-bold">{displayName.charAt(0).toUpperCase()}</span>}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold truncate">{displayName}</p>
                        <p className="text-[11px] text-slate-400 truncate">@{user.username || user.nrp}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isCreateGroupModalOpen && (
          <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsCreateGroupModalOpen(false)} className="fixed inset-0 bg-slate-950/70 backdrop-blur-md" />
            <motion.div initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.92, opacity: 0 }} className="relative z-10 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-2xl border border-white/50 dark:border-white/10 text-slate-800 dark:text-zinc-100 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
              <div className="flex justify-between items-center border-b border-slate-200/40 dark:border-white/10 pb-3">
                <h3 className="text-base font-bold">Buat Grup Obrolan Baru</h3>
                <button onClick={() => setIsCreateGroupModalOpen(false)}><X className="w-5 h-5 text-slate-400" /></button>
              </div>

              <form onSubmit={handleCreateGroupSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold mb-1.5">Nama Grup</label>
                  <input
                    type="text"
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    placeholder="Misal: Kelompok 3 Basdat"
                    className="w-full px-4 py-3 rounded-2xl bg-slate-100 dark:bg-zinc-800 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1.5">Pilih Anggota Grup</label>
                  <div className="max-h-56 overflow-y-auto space-y-1.5 custom-scrollbar pr-1">
                    {allUsers.map((u) => {
                      const isSelected = selectedGroupMembers.includes(u.nrp);
                      const displayName = getUserDisplayName(u);
                      const avatar = getUserAvatar(u);

                      return (
                        <div
                          key={u.nrp}
                          onClick={() => {
                            setSelectedGroupMembers((prev) =>
                              isSelected ? prev.filter((id) => id !== u.nrp) : [...prev, u.nrp]
                            );
                          }}
                          className={`flex items-center justify-between p-2.5 rounded-2xl cursor-pointer transition-all border ${
                            isSelected
                              ? 'bg-blue-50/80 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800/60'
                              : 'bg-slate-50/60 dark:bg-zinc-800/40 border-transparent hover:bg-slate-100 dark:hover:bg-zinc-800'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-8 h-8 rounded-xl bg-slate-200 dark:bg-zinc-700 flex items-center justify-center overflow-hidden shrink-0">
                              {avatar ? (
                                <img src={avatar} alt={displayName} className="w-full h-full object-cover" />
                              ) : (
                                <span className="text-xs font-bold">{displayName.charAt(0).toUpperCase()}</span>
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-bold truncate">{displayName}</p>
                              <p className="text-[10px] text-slate-400 truncate">@{u.username || u.nrp}</p>
                            </div>
                          </div>

                          <div className={`w-5 h-5 rounded-lg flex items-center justify-center border ${isSelected ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300 dark:border-zinc-700'}`}>
                            {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSending || !newGroupName.trim()}
                  className="w-full py-3 rounded-2xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 disabled:opacity-50 transition-all shadow-md shadow-blue-500/20"
                >
                  {isSending ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Terbitkan Grup'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};