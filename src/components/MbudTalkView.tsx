import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, 
  Send, 
  MessageSquare, 
  Search, 
  Loader2, 
  ShieldCheck, 
  MessageSquarePlus, 
  X,
  ImagePlus,
  Users,
  Plus,
  Edit3,
  CornerUpLeft,
  CheckCircle2,
  Camera
} from 'lucide-react';
import { supabase } from '../services/supabase';
import { 
  subscribeToChatRoom, 
  sendChatMessage, 
  clearUnreadNotification, 
  subscribeToRecentChats,
  subscribeToUserUnreads,
  ChatMessage,
  RecentChatMeta
} from '../services/firebaseChat';
import {
  createGroup,
  getUserGroups,
  updateGroupProfile,
  sendGroupMessage,
  markGroupAsRead,
  MbudTalkGroup,
  GroupMessage
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

  const [activeTab, setActiveTab] = useState<'dm' | 'groups'>('dm');

  // Data State
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [recentChats, setRecentChats] = useState<RecentChatMeta[]>([]);
  const [groupList, setGroupList] = useState<MbudTalkGroup[]>([]);
  const [unreadMap, setUnreadMap] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState<boolean>(true);

  const [searchHistory, setSearchHistory] = useState<string>('');
  const [selectedPartner, setSelectedPartner] = useState<UserProfile | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<MbudTalkGroup | null>(null);

  // Modals
  const [isNewChatModalOpen, setIsNewChatModalOpen] = useState<boolean>(false);
  const [isCreateGroupModalOpen, setIsCreateGroupModalOpen] = useState<boolean>(false);
  const [isEditGroupModalOpen, setIsEditGroupModalOpen] = useState<boolean>(false);

  // Modal Form Inputs
  const [searchNewUser, setSearchNewUser] = useState<string>('');
  const [newGroupName, setNewGroupName] = useState<string>('');
  const [selectedGroupMembers, setSelectedGroupMembers] = useState<string[]>([]);
  const [editGroupName, setEditGroupName] = useState<string>('');
  const [editGroupAvatarFile, setEditGroupAvatarFile] = useState<File | null>(null);
  const [editGroupAvatarPreview, setEditGroupAvatarPreview] = useState<string>('');

  // Messages & Reply State
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState<string>('');
  const [isSending, setIsSending] = useState<boolean>(false);
  const [replyTo, setReplyTo] = useState<ReplyState | null>(null);

  // Attachments
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [previewZoomImage, setPreviewZoomImage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const groupAvatarInputRef = useRef<HTMLInputElement>(null);
  const chatScrollContainerRef = useRef<HTMLDivElement>(null);
  const [viewportHeight, setViewportHeight] = useState<string>('100%');

  // Load Groups
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

  // Fetch Users
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
        }
      } catch (err) {
        console.error('Gagal memuat kontak:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, [currentUserNrp]);

  // Subscribe DM & Unreads
  useEffect(() => {
    if (!currentUserNrp) return;
    const unsubRecent = subscribeToRecentChats(currentUserNrp, setRecentChats);
    const unsubUnreads = subscribeToUserUnreads(currentUserNrp, setUnreadMap);
    return () => {
      unsubRecent();
      unsubUnreads();
    };
  }, [currentUserNrp]);

  // Subscribe Direct Messages
  useEffect(() => {
    if (!currentUserNrp || !selectedPartner?.nrp || activeTab !== 'dm') return;
    clearUnreadNotification(currentUserNrp, selectedPartner.nrp);

    const unsubscribe = subscribeToChatRoom(
      currentUserNrp,
      selectedPartner.nrp,
      (incomingMessages) => {
        setMessages(incomingMessages);
      }
    );
    return () => unsubscribe();
  }, [currentUserNrp, selectedPartner, activeTab]);

  // Load & Realtime Group Messages
  useEffect(() => {
    if (!selectedGroup || activeTab !== 'groups') return;

    markGroupAsRead(selectedGroup.id, currentUserNrp).then(fetchGroups);

    const fetchGroupMessages = async () => {
      const { data } = await supabase
        .from('mbudtalk_group_messages')
        .select('*')
        .eq('group_id', selectedGroup.id)
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
      .channel(`group-messages-${selectedGroup.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'mbudtalk_group_messages', filter: `group_id=eq.${selectedGroup.id}` },
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
  }, [selectedGroup, activeTab]);

  // Scroll to Bottom
  useEffect(() => {
    if (chatScrollContainerRef.current) {
      chatScrollContainerRef.current.scrollTop = chatScrollContainerRef.current.scrollHeight;
    }
  }, [messages, imagePreviewUrl, replyTo]);

  // Viewport Adjustment for Mobile
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

  const getUserDisplayName = (u?: UserProfile | null) => u?.nickname || u?.username || u?.nrp || 'Teman';
  const getUserAvatar = (u?: UserProfile | null) => u?.photo_url || u?.avatar_url || null;

  // Handle Send Message (DM & Group)
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!inputText.trim() && !selectedImageFile) || isSending) return;

    const text = inputText.trim();
    setIsSending(true);

    try {
      let uploadedImageUrl: string | undefined = undefined;
      if (selectedImageFile) {
        uploadedImageUrl = await uploadImageToCloudinary(selectedImageFile);
      }

      if (activeTab === 'dm' && selectedPartner) {
        await sendChatMessage(
          currentUserNrp,
          selectedPartner.nrp,
          text,
          currentUserName,
          uploadedImageUrl
        );
      } else if (activeTab === 'groups' && selectedGroup) {
        await sendGroupMessage(
          selectedGroup.id,
          currentUserNrp,
          currentUserName,
          text || (uploadedImageUrl ? '[Gambar]' : ''),
          replyTo ? { id: replyTo.id, sender: replyTo.sender, text: replyTo.text } : undefined
        );
      }

      setInputText('');
      setSelectedImageFile(null);
      setImagePreviewUrl(null);
      setReplyTo(null);
    } catch (error) {
      console.error('Gagal mengirim pesan:', error);
      alert('Gagal mengirim pesan.');
    } finally {
      setIsSending(false);
    }
  };

  // Handle Create Group
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
      setSelectedGroup(newGroup);
    } catch (err) {
      console.error('Gagal membuat grup:', err);
      alert('Gagal membuat grup.');
    } finally {
      setIsSending(false);
    }
  };

  // Handle Update Group Profile (Edit PP & Nama)
  const handleUpdateGroupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGroup || !editGroupName.trim()) return;

    try {
      setIsSending(true);
      let avatarUrl = selectedGroup.avatar_url;

      if (editGroupAvatarFile) {
        avatarUrl = await uploadImageToCloudinary(editGroupAvatarFile);
      }

      const updated = await updateGroupProfile(selectedGroup.id, editGroupName.trim(), avatarUrl);
      setSelectedGroup(updated);
      await fetchGroups();
      setIsEditGroupModalOpen(false);
    } catch (err) {
      console.error('Gagal memperbarui grup:', err);
      alert('Gagal memperbarui info grup.');
    } finally {
      setIsSending(false);
    }
  };

  const populatedRecentChats = recentChats
    .map((item) => {
      const userProfile = allUsers.find(
        (u) => String(u.nrp).trim().toLowerCase() === item.partnerNrp.toLowerCase()
      );
      const isUnread = Boolean(unreadMap[item.partnerNrp.toLowerCase()]);
      return {
        ...item,
        isUnread,
        profile: userProfile || { nrp: item.partnerNrp, nickname: item.partnerNrp },
      };
    })
    .filter((item) => {
      const q = searchHistory.toLowerCase();
      const name = getUserDisplayName(item.profile).toLowerCase();
      return name.includes(q) || item.lastMessage.toLowerCase().includes(q);
    });

  return (
    <div
      style={{ height: viewportHeight }}
      className="fixed inset-x-0 bottom-0 top-[68px] z-30 px-3 pb-2 pt-1 lg:static lg:h-[calc(100vh-10.5rem)] lg:max-h-[660px] lg:px-0 lg:py-0 w-full max-w-5xl mx-auto flex flex-col lg:flex-row gap-3 overflow-hidden select-none"
    >
      {/* BILAH KIRI: LIST CHAT & GRUP */}
      <div
        className={`w-full lg:w-80 flex flex-col gap-2.5 h-full ${
          selectedPartner || selectedGroup ? 'hidden lg:flex' : 'flex'
        }`}
      >
        {/* Top Header */}
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

          <div className="flex items-center gap-1">
            {activeTab === 'dm' ? (
              <button
                onClick={() => setIsNewChatModalOpen(true)}
                className="w-8 h-8 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 flex items-center justify-center cursor-pointer transition-all shrink-0"
                title="Mulai Chat Baru"
              >
                <MessageSquarePlus className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={() => setIsCreateGroupModalOpen(true)}
                className="w-8 h-8 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 flex items-center justify-center cursor-pointer transition-all shrink-0"
                title="Buat Grup Baru"
              >
                <Plus className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* TAB SWITCHER: DM VS GROUPS */}
        <div className="grid grid-cols-2 p-1 bg-white/50 dark:bg-zinc-900/40 backdrop-blur-lg border border-white/50 dark:border-white/5 rounded-2xl gap-1 shrink-0">
          <button
            onClick={() => {
              setActiveTab('dm');
              setSelectedGroup(null);
            }}
            className={`py-1.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'dm'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Pesan (DM)</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('groups');
              setSelectedPartner(null);
            }}
            className={`py-1.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'groups'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Grup</span>
          </button>
        </div>

        {/* SEARCH BAR */}
        <div className="relative flex items-center shrink-0 w-full rounded-2xl bg-white/50 dark:bg-zinc-900/40 backdrop-blur-lg border border-white/50 dark:border-white/5 px-3 py-1.5 shadow-xs">
          <Search className="w-4 h-4 text-slate-400 dark:text-zinc-400 shrink-0 mr-2.5 pointer-events-none" />
          <input
            type="text"
            value={searchHistory}
            onChange={(e) => setSearchHistory(e.target.value)}
            placeholder={activeTab === 'dm' ? "Cari obrolan..." : "Cari grup..."}
            className="w-full bg-transparent text-xs text-slate-800 dark:text-zinc-200 placeholder-slate-400 focus:outline-none"
          />
        </div>

        {/* LIST DM ATAU GRUP */}
        <div className="flex-1 overflow-y-auto space-y-1.5 custom-scrollbar pr-0.5">
          {activeTab === 'dm' ? (
            populatedRecentChats.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 text-center space-y-2 rounded-3xl bg-white/40 dark:bg-zinc-900/30 backdrop-blur-md border border-white/40 dark:border-white/5 text-slate-400 dark:text-zinc-500 my-auto">
                <MessageSquare className="w-6 h-6 text-blue-500" />
                <p className="text-xs font-bold text-slate-800 dark:text-zinc-200">Belum ada obrolan</p>
              </div>
            ) : (
              populatedRecentChats.map((item) => {
                const isSelected = selectedPartner?.nrp === item.partnerNrp;
                const displayName = getUserDisplayName(item.profile);
                const avatar = getUserAvatar(item.profile);

                return (
                  <motion.div
                    key={item.partnerNrp}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setSelectedPartner(item.profile);
                      setSelectedGroup(null);
                    }}
                    className={`flex items-center gap-3 p-3 rounded-3xl cursor-pointer transition-all backdrop-blur-md border ${
                      isSelected
                        ? 'bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-500/20'
                        : 'bg-white/50 dark:bg-zinc-900/40 border-white/50 dark:border-white/5 hover:bg-white/75 dark:hover:bg-zinc-800/60 text-slate-800 dark:text-zinc-200'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-2xl bg-slate-200 dark:bg-zinc-800 flex items-center justify-center overflow-hidden border border-white/40 shrink-0">
                      {avatar ? (
                        <img src={avatar} alt={displayName} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-xs font-bold text-slate-700 dark:text-zinc-200">
                          {displayName.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <p className={`text-xs font-bold truncate ${isSelected ? 'text-white' : 'text-slate-800 dark:text-zinc-100'}`}>
                          {displayName}
                        </p>
                        <span className={`text-[10px] shrink-0 ${isSelected ? 'text-blue-100' : 'text-slate-400'}`}>
                          {new Date(item.lastTimestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className={`text-[11px] truncate ${isSelected ? 'text-blue-100' : 'text-slate-500 dark:text-zinc-400'}`}>
                        {item.lastMessage}
                      </p>
                    </div>
                  </motion.div>
                );
              })
            )
          ) : (
            groupList.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 text-center space-y-2 rounded-3xl bg-white/40 dark:bg-zinc-900/30 backdrop-blur-md border border-white/40 dark:border-white/5 text-slate-400 my-auto">
                <Users className="w-6 h-6 text-blue-500" />
                <p className="text-xs font-bold text-slate-800 dark:text-zinc-200">Belum ada grup</p>
              </div>
            ) : (
              groupList.map((g) => {
                const isSelected = selectedGroup?.id === g.id;
                return (
                  <motion.div
                    key={g.id}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setSelectedGroup(g);
                      setSelectedPartner(null);
                    }}
                    className={`flex items-center gap-3 p-3 rounded-3xl cursor-pointer transition-all backdrop-blur-md border ${
                      isSelected
                        ? 'bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-500/20'
                        : 'bg-white/50 dark:bg-zinc-900/40 border-white/50 dark:border-white/5 hover:bg-white/75 dark:hover:bg-zinc-800/60 text-slate-800 dark:text-zinc-200'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-2xl bg-blue-100 dark:bg-zinc-800 flex items-center justify-center overflow-hidden border border-white/40 shrink-0">
                      {g.avatar_url ? (
                        <img src={g.avatar_url} alt={g.name} className="w-full h-full object-cover" />
                      ) : (
                        <Users className={`w-5 h-5 ${isSelected ? 'text-white' : 'text-blue-600 dark:text-blue-400'}`} />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <p className={`text-xs font-bold truncate ${isSelected ? 'text-white' : 'text-slate-800 dark:text-zinc-100'}`}>
                          {g.name}
                        </p>
                        {g.has_unread && !isSelected && (
                          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
                        )}
                      </div>
                      <p className={`text-[11px] truncate ${isSelected ? 'text-blue-100' : 'text-slate-500 dark:text-zinc-400'}`}>
                        {g.last_message}
                      </p>
                    </div>
                  </motion.div>
                );
              })
            )
          )}
        </div>
      </div>

      {/* BILAH KANAN: RUANG CHAT */}
      <div
        className={`flex-1 flex flex-col gap-2.5 h-full overflow-hidden ${
          !selectedPartner && !selectedGroup ? 'hidden lg:flex' : 'flex'
        }`}
      >
        {selectedPartner || selectedGroup ? (
          <>
            {/* Header Chat */}
            <div className="flex items-center justify-between gap-3 p-2 px-4 rounded-3xl bg-white/60 dark:bg-zinc-900/50 backdrop-blur-xl border border-white/60 dark:border-white/10 shadow-xs shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedPartner(null);
                    setSelectedGroup(null);
                  }}
                  className="lg:hidden p-1.5 rounded-2xl text-slate-400 hover:text-slate-800 dark:hover:text-white"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>

                <div className="w-8 h-8 rounded-2xl bg-slate-200 dark:bg-zinc-800 flex items-center justify-center overflow-hidden border border-white/40 shrink-0">
                  {activeTab === 'dm' ? (
                    getUserAvatar(selectedPartner) ? (
                      <img src={getUserAvatar(selectedPartner)!} alt={getUserDisplayName(selectedPartner)} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xs font-bold text-slate-700 dark:text-zinc-200">
                        {getUserDisplayName(selectedPartner).charAt(0).toUpperCase()}
                      </span>
                    )
                  ) : (
                    selectedGroup?.avatar_url ? (
                      <img src={selectedGroup.avatar_url} alt={selectedGroup.name} className="w-full h-full object-cover" />
                    ) : (
                      <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    )
                  )}
                </div>

                <div className="min-w-0">
                  <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-zinc-100 leading-tight truncate">
                    {activeTab === 'dm' ? getUserDisplayName(selectedPartner) : selectedGroup?.name}
                  </h3>
                  <p className="text-[10px] text-slate-400 truncate">
                    {activeTab === 'dm' ? `@${selectedPartner?.username || selectedPartner?.nrp}` : 'Grup Obrolan'}
                  </p>
                </div>
              </div>

              {/* Edit Group Info Button */}
              {activeTab === 'groups' && selectedGroup && (
                <button
                  onClick={() => {
                    setEditGroupName(selectedGroup.name);
                    setEditGroupAvatarPreview(selectedGroup.avatar_url);
                    setIsEditGroupModalOpen(true);
                  }}
                  className="p-2 rounded-2xl text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-white/40 dark:hover:bg-zinc-800 transition-colors"
                  title="Edit Info Grup"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Messages Container with Swipe-to-Reply */}
            <div 
              ref={chatScrollContainerRef}
              className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2.5 custom-scrollbar rounded-3xl bg-white/30 dark:bg-zinc-900/25 backdrop-blur-md border border-white/40 dark:border-white/5"
            >
              {messages.map((msg, idx) => {
                const isMe = String(msg.senderNrp).trim().toLowerCase() === currentUserNrp;
                const showDateDivider = idx === 0 || isDifferentDay(messages[idx - 1].timestamp, msg.timestamp);

                return (
                  <React.Fragment key={msg.id || idx}>
                    {showDateDivider && (
                      <div className="flex items-center justify-center my-2.5">
                        <span className="px-3 py-1 rounded-full text-[10px] font-semibold bg-white/60 dark:bg-zinc-800/60 border border-white/50 dark:border-white/5 text-slate-500">
                          {formatChatDateDivider(msg.timestamp)}
                        </span>
                      </div>
                    )}

                    <motion.div
                      drag="x"
                      dragConstraints={{ left: 0, right: 80 }}
                      onDragEnd={(_, info) => {
                        if (info.offset.x > 50) {
                          setReplyTo({
                            id: msg.id || String(idx),
                            sender: msg.senderName || msg.senderNrp,
                            text: msg.text,
                          });
                        }
                      }}
                      className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                    >
                      <div
                        className={`max-w-[82%] sm:max-w-[70%] p-3 rounded-3xl text-xs sm:text-sm shadow-xs backdrop-blur-md ${
                          isMe
                            ? 'bg-blue-600 text-white rounded-br-xs'
                            : 'bg-white/80 dark:bg-zinc-800/80 text-slate-800 dark:text-zinc-100 rounded-bl-xs border border-white/60 dark:border-white/5'
                        }`}
                      >
                        {/* Pengirim (khusus grup) */}
                        {activeTab === 'groups' && !isMe && (
                          <p className="text-[10px] font-bold text-blue-500 dark:text-blue-400 mb-1">
                            {msg.senderName}
                          </p>
                        )}

                        {/* Balasan/Reply Box */}
                        {msg.replyTo && (
                          <div className={`p-2 mb-2 rounded-xl text-[11px] border-l-4 ${isMe ? 'bg-blue-700/50 border-white text-white/90' : 'bg-slate-100 dark:bg-zinc-700 border-blue-500 text-slate-700 dark:text-zinc-200'}`}>
                            <p className="font-bold">{msg.replyTo.sender}</p>
                            <p className="truncate opacity-80">{msg.replyTo.text}</p>
                          </div>
                        )}

                        {/* Teks Pesan */}
                        <p className="whitespace-pre-wrap break-words leading-relaxed">{msg.text}</p>
                      </div>
                      <span className="text-[10px] text-slate-400 px-2 mt-1">
                        {new Date(msg.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </motion.div>
                  </React.Fragment>
                );
              })}
            </div>

            {/* Reply Preview Bar */}
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

            {/* Input Form */}
            <form
              onSubmit={handleSendMessage}
              className="p-1.5 pl-3 rounded-3xl bg-white/70 dark:bg-zinc-900/60 backdrop-blur-xl border border-white/70 dark:border-white/10 shadow-xs flex items-center gap-2 shrink-0"
            >
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
                disabled={!inputText.trim() || isSending}
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

      {/* MODAL EDIT GRUP (GANTI NAMA & PP) */}
      <AnimatePresence>
        {isEditGroupModalOpen && selectedGroup && (
          <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsEditGroupModalOpen(false)} className="fixed inset-0 bg-slate-950/70 backdrop-blur-md" />
            <motion.div initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.92, opacity: 0 }} className="relative z-10 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-2xl border border-white/50 dark:border-white/10 text-slate-800 dark:text-zinc-100 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-base font-bold">Edit Info Grup</h3>
                <button onClick={() => setIsEditGroupModalOpen(false)}><X className="w-5 h-5 text-slate-400" /></button>
              </div>

              <form onSubmit={handleUpdateGroupSubmit} className="space-y-4">
                {/* Upload PP Grup */}
                <div className="flex flex-col items-center gap-2">
                  <div className="relative w-20 h-20 rounded-full bg-slate-200 dark:bg-zinc-800 flex items-center justify-center overflow-hidden border-2 border-blue-500">
                    {editGroupAvatarPreview ? (
                      <img src={editGroupAvatarPreview} alt="Group Avatar" className="w-full h-full object-cover" />
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
                  <span className="text-[11px] text-slate-400">Klik untuk mengganti foto grup</span>
                </div>

                {/* Input Nama Grup */}
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

      {/* MODAL BUAT GRUP BARU */}
      <AnimatePresence>
        {isCreateGroupModalOpen && (
          <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsCreateGroupModalOpen(false)} className="fixed inset-0 bg-slate-950/70 backdrop-blur-md" />
            <motion.div initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.92, opacity: 0 }} className="relative z-10 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-2xl border border-white/50 dark:border-white/10 text-slate-800 dark:text-zinc-100 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-base font-bold">Buat Grup Obrolan</h3>
                <button onClick={() => setIsCreateGroupModalOpen(false)}><X className="w-5 h-5 text-slate-400" /></button>
              </div>

              <form onSubmit={handleCreateGroupSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold mb-1">Nama Grup</label>
                  <input
                    type="text"
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    placeholder="Misal: Kelompok 3 Basdat"
                    className="w-full px-4 py-2.5 rounded-2xl bg-slate-100 dark:bg-zinc-800 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1">Pilih Anggota</label>
                  <div className="max-h-40 overflow-y-auto space-y-1 custom-scrollbar">
                    {allUsers.map((u) => {
                      const isSelected = selectedGroupMembers.includes(u.nrp);
                      return (
                        <div
                          key={u.nrp}
                          onClick={() => {
                            setSelectedGroupMembers((prev) =>
                              isSelected ? prev.filter((id) => id !== u.nrp) : [...prev, u.nrp]
                            );
                          }}
                          className={`flex items-center justify-between p-2 rounded-xl text-xs cursor-pointer ${isSelected ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-600' : 'hover:bg-slate-100 dark:hover:bg-zinc-800'}`}
                        >
                          <span>{getUserDisplayName(u)}</span>
                          {isSelected && <CheckCircle2 className="w-4 h-4 text-blue-600" />}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSending}
                  className="w-full py-2.5 rounded-2xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 transition-all shadow-md shadow-blue-500/20"
                >
                  {isSending ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Terbit Grup'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};