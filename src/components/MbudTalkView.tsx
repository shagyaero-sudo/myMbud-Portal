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
  Image as ImageIcon,
  ImagePlus
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
// Impor helper upload Cloudinary eksisting
import { uploadImageToCloudinary } from '../services/cloudinary';

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

// Helper Format Sekat Tanggal
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

  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [recentChats, setRecentChats] = useState<RecentChatMeta[]>([]);
  const [unreadMap, setUnreadMap] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState<boolean>(true);

  const [searchHistory, setSearchHistory] = useState<string>('');
  const [selectedPartner, setSelectedPartner] = useState<UserProfile | null>(null);

  // Modal Mulai Chat Baru
  const [isNewChatModalOpen, setIsNewChatModalOpen] = useState<boolean>(false);
  const [searchNewUser, setSearchNewUser] = useState<string>('');

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState<string>('');
  const [isSending, setIsSending] = useState<boolean>(false);

  // State Gambar / Cloudinary Attachment
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [previewZoomImage, setPreviewZoomImage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatScrollContainerRef = useRef<HTMLDivElement>(null);
  const [viewportHeight, setViewportHeight] = useState<string>('100%');

  // Integrasi Browser Popstate (Gesture Swipe Back / Tombol Back HP)
  useEffect(() => {
    const handlePopState = () => {
      if (selectedPartner) {
        setSelectedPartner(null);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [selectedPartner]);

  // Handler Buka Chat dengan pencatatan Hash / State History
  const handleOpenPartnerChat = (user: UserProfile) => {
    setSelectedPartner(user);
    const cleanNrp = String(user.nrp || '').trim().toLowerCase();
    if (window.location.hash !== `#mbudtalk/chat/${cleanNrp}`) {
      window.history.pushState({ tab: 'mbudtalk', sub: 'chat', partner: cleanNrp }, '', `#mbudtalk/chat/${cleanNrp}`);
    }
  };

  // Handler Tombol Back di Header Room Chat
  const handleClosePartnerChat = () => {
    setSelectedPartner(null);
    if (window.location.hash.includes('/chat/')) {
      window.history.pushState({ tab: 'mbudtalk' }, '', '#mbudtalk');
    }
  };

  // Deteksi tinggi visual keyboard mobile
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

  const getUserDisplayName = (u?: UserProfile | null) => {
    if (!u) return 'Teman';
    return u.nickname || u.username || u.nrp || 'Teman';
  };

  const getUserAvatar = (u?: UserProfile | null) => u?.photo_url || u?.avatar_url || null;

  // Helper Auto-detect Clickable URLs di Pesan Chat
  const renderMessageTextWithLinks = (text: string, isMe: boolean) => {
    if (!text) return '';
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = text.split(urlRegex);

    return parts.map((part, index) => {
      if (part.match(urlRegex)) {
        return (
          <a
            key={index}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className={`underline font-semibold break-all transition-opacity ${
              isMe 
                ? 'text-white/95 hover:text-white underline-offset-2' 
                : 'text-blue-600 dark:text-blue-400 hover:opacity-80 underline-offset-2'
            }`}
          >
            {part}
          </a>
        );
      }
      return part;
    });
  };

  // 1. Fetch seluruh kontak dari mbudiary_users
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

          const rawHash = typeof window !== 'undefined' ? window.location.hash : '';
          const hashNrp = rawHash.startsWith('#mbudtalk/chat/') ? rawHash.replace('#mbudtalk/chat/', '').trim() : null;
          const initialTarget = targetNrp || hashNrp;

          if (initialTarget) {
            const found = others.find(
              (u: any) => String(u.nrp || '').trim().toLowerCase() === initialTarget.trim().toLowerCase()
            );
            if (found) setSelectedPartner(found);
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

  // 2. Subscribe ke Riwayat Chat (Recent Chats) & Unread Per Kontak
  useEffect(() => {
    if (!currentUserNrp) return;

    const unsubRecent = subscribeToRecentChats(currentUserNrp, (recentList) => {
      setRecentChats(recentList);
    });

    const unsubUnreads = subscribeToUserUnreads(currentUserNrp, (map) => {
      setUnreadMap(map);
    });

    return () => {
      unsubRecent();
      unsubUnreads();
    };
  }, [currentUserNrp]);

  // 3. Subscribe ke Room Percakapan Aktif
  useEffect(() => {
    if (!currentUserNrp || !selectedPartner?.nrp) return;

    clearUnreadNotification(currentUserNrp, selectedPartner.nrp);

    const unsubscribe = subscribeToChatRoom(
      currentUserNrp,
      selectedPartner.nrp,
      (incomingMessages) => {
        setMessages(incomingMessages);
      }
    );

    return () => unsubscribe();
  }, [currentUserNrp, selectedPartner]);

  // 4. Scroll ke bawah hanya dalam ruang pesan
  useEffect(() => {
    if (chatScrollContainerRef.current) {
      chatScrollContainerRef.current.scrollTop = chatScrollContainerRef.current.scrollHeight;
    }
  }, [messages, viewportHeight, imagePreviewUrl]);

  // Handler Pilih File Gambar
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
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handler Kirim Pesan & Upload Gambar
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!inputText.trim() && !selectedImageFile) || !selectedPartner?.nrp || isSending) return;

    const text = inputText.trim();
    setIsSending(true);

    try {
      let uploadedImageUrl: string | undefined = undefined;

      // Unggah gambar ke Cloudinary terlebih dahulu (jika ada lampiran gambar)
      if (selectedImageFile) {
        uploadedImageUrl = await uploadImageToCloudinary(selectedImageFile);
      }

      await sendChatMessage(
        currentUserNrp,
        selectedPartner.nrp,
        text,
        currentUserName,
        uploadedImageUrl
      );

      // Reset form input & preview
      setInputText('');
      handleClearSelectedImage();
    } catch (error) {
      console.error('Gagal mengirim pesan:', error);
      alert('Gagal mengirim pesan atau unggah gambar.');
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
      const username = (item.profile.username || '').toLowerCase();
      return name.includes(q) || username.includes(q) || item.lastMessage.toLowerCase().includes(q);
    });

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
      {/* ================= BILAH KIRI: RIWAYAT CHAT ================= */}
      <div
        className={`w-full lg:w-80 flex flex-col gap-2.5 h-full ${
          selectedPartner ? 'hidden lg:flex' : 'flex'
        }`}
      >
        {/* Top Header Pill */}
        <div className="flex items-center justify-between gap-3 p-2.5 px-4 rounded-3xl bg-white/60 dark:bg-zinc-900/50 backdrop-blur-xl border border-white/60 dark:border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.03)] dark:shadow-none shrink-0">
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onBack}
              className="p-1.5 rounded-2xl text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-white/40 dark:hover:bg-zinc-800/60 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-1.5">
              <h2 className="text-sm font-bold text-slate-800 dark:text-zinc-100 tracking-tight">
                mbudTalk
              </h2>
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
              #SayHi!
              </span>
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              setSearchNewUser('');
              setIsNewChatModalOpen(true);
            }}
            className="w-8 h-8 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 flex items-center justify-center cursor-pointer transition-all shrink-0"
            title="Mulai Chat Baru"
          >
            <MessageSquarePlus className="w-4 h-4" />
          </motion.button>
        </div>

        {/* Search Riwayat */}
        <div className="relative flex items-center shrink-0 w-full rounded-2xl bg-white/50 dark:bg-zinc-900/40 backdrop-blur-lg border border-white/50 dark:border-white/5 px-3 py-1.5 shadow-xs">
          <Search className="w-4 h-4 text-slate-400 dark:text-zinc-400 shrink-0 mr-2.5 pointer-events-none" />
          <input
            type="text"
            value={searchHistory}
            onChange={(e) => setSearchHistory(e.target.value)}
            placeholder="Cari obrolan..."
            className="w-full bg-transparent text-xs text-slate-800 dark:text-zinc-200 placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none"
          />
        </div>

        {/* Recent Chats Floating List */}
        <div className="flex-1 overflow-y-auto space-y-1.5 custom-scrollbar pr-0.5">
          {loading ? (
            <div className="flex flex-col items-center justify-center p-8 space-y-2 text-slate-400 dark:text-zinc-500">
              <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
              <span className="text-xs">Memuat obrolan...</span>
            </div>
          ) : populatedRecentChats.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center space-y-3 rounded-3xl bg-white/40 dark:bg-zinc-900/30 backdrop-blur-md border border-white/40 dark:border-white/5 text-slate-400 dark:text-zinc-500 my-auto">
              <div className="w-12 h-12 rounded-full bg-blue-50/60 dark:bg-blue-950/40 flex items-center justify-center text-blue-600 dark:text-blue-400">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div className="space-y-0.5">
                <p className="text-xs font-bold text-slate-800 dark:text-zinc-200">Belum ada obrolan</p>
                <p className="text-[11px] text-slate-400 dark:text-zinc-500 max-w-[180px] leading-relaxed">
                  Klik tombol pensil di atas untuk memulai chat baru.
                </p>
              </div>
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
                  onClick={() => handleOpenPartnerChat(item.profile)}
                  className={`relative flex items-center gap-3 p-3 rounded-3xl cursor-pointer transition-all backdrop-blur-md border ${
                    isSelected
                      ? 'bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-500/20'
                      : 'bg-white/50 dark:bg-zinc-900/40 border-white/50 dark:border-white/5 hover:bg-white/75 dark:hover:bg-zinc-800/60 text-slate-800 dark:text-zinc-200'
                  }`}
                >
                  <div className="relative w-10 h-10 rounded-2xl bg-slate-200 dark:bg-zinc-800 flex items-center justify-center overflow-hidden border border-white/40 dark:border-zinc-700/60 shrink-0 shadow-xs">
                    {avatar ? (
                      <img src={avatar} alt={displayName} className="w-full h-full object-cover" />
                    ) : (
                      <span className={`text-xs font-bold ${isSelected ? 'text-white' : 'text-slate-700 dark:text-zinc-200'}`}>
                        {displayName.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <p className={`text-xs font-bold truncate ${isSelected ? 'text-white' : item.isUnread ? 'text-slate-900 dark:text-white font-extrabold' : 'text-slate-800 dark:text-zinc-100'}`}>
                        {displayName}
                      </p>
                      <span className={`text-[10px] shrink-0 tabular-nums ${isSelected ? 'text-blue-100' : item.isUnread ? 'text-rose-500 font-bold' : 'text-slate-400 dark:text-zinc-500'}`}>
                        {new Date(item.lastTimestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2 mt-0.5">
                      <p className={`text-[11px] truncate flex-1 ${isSelected ? 'text-blue-100' : item.isUnread ? 'text-slate-900 dark:text-zinc-100 font-bold' : 'text-slate-500 dark:text-zinc-400'}`}>
                        {item.lastMessage}
                      </p>
                      {/* DOT UNREAD INDIKATOR CHAT BELUM DIBACA */}
                      {item.isUnread && !isSelected && (
                        <span className="flex h-2.5 w-2.5 shrink-0">
                          <span className="animate-ping absolute inline-flex h-2.5 w-2.5 rounded-full bg-rose-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500 shadow-xs"></span>
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      </div>

      {/* ================= BILAH KANAN: RUANG CHAT ================= */}
      <div
        className={`flex-1 flex flex-col gap-2.5 h-full overflow-hidden ${
          !selectedPartner ? 'hidden lg:flex' : 'flex'
        }`}
      >
        {selectedPartner ? (
          <>
            {/* Top Header Pill Partner */}
            <div className="flex items-center justify-between gap-3 p-2 px-4 rounded-3xl bg-white/60 dark:bg-zinc-900/50 backdrop-blur-xl border border-white/60 dark:border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.03)] dark:shadow-none shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <button
                  type="button"
                  onClick={handleClosePartnerChat}
                  className="lg:hidden p-1.5 rounded-2xl text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-white/40 dark:hover:bg-zinc-800"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>

                <div className="w-8 h-8 rounded-2xl bg-slate-200 dark:bg-zinc-800 flex items-center justify-center overflow-hidden border border-white/40 dark:border-zinc-700 shrink-0 shadow-xs">
                  {getUserAvatar(selectedPartner) ? (
                    <img src={getUserAvatar(selectedPartner)!} alt={getUserDisplayName(selectedPartner)} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xs font-bold text-slate-700 dark:text-zinc-200">
                      {getUserDisplayName(selectedPartner).charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>

                <div className="min-w-0">
                  <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-zinc-100 leading-tight truncate">
                    {getUserDisplayName(selectedPartner)}
                  </h3>
                  <p className="text-[10px] text-slate-400 dark:text-zinc-500 truncate">
                    @{selectedPartner.username || selectedPartner.nrp}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20 shrink-0">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span className="hidden sm:inline"></span>
              </div>
            </div>

            {/* Bubble Messages Stream Box */}
            <div 
              ref={chatScrollContainerRef}
              className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2.5 custom-scrollbar overscroll-contain rounded-3xl bg-white/30 dark:bg-zinc-900/25 backdrop-blur-md border border-white/40 dark:border-white/5"
            >
              {messages.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-center p-6 text-slate-400 dark:text-zinc-500 space-y-2 my-auto">
                  <div className="w-12 h-12 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                    <MessageSquare className="w-6 h-6" />
                  </div>
                  <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-zinc-200">
                    Mulai obrolan dengan {getUserDisplayName(selectedPartner)}
                  </p>
                  <p className="text-[11px] text-slate-400 dark:text-zinc-500 max-w-xs">
                    Kirim pesan instan dan ringan
                  </p>
                </div>
              ) : (
                messages.map((msg, idx) => {
                  const isMe = String(msg.senderNrp).trim().toLowerCase() === currentUserNrp;
                  const showDateDivider =
                    idx === 0 || isDifferentDay(messages[idx - 1].timestamp, msg.timestamp);

                  return (
                    <React.Fragment key={msg.id || idx}>
                      {showDateDivider && (
                        <div className="flex items-center justify-center my-2.5">
                          <span className="px-3 py-1 rounded-full text-[10px] font-semibold tracking-wide bg-white/60 dark:bg-zinc-800/60 backdrop-blur-md border border-white/50 dark:border-white/5 text-slate-500 dark:text-zinc-400 shadow-xs">
                            {formatChatDateDivider(msg.timestamp)}
                          </span>
                        </div>
                      )}

                      <motion.div
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                      >
                        <div
                          className={`max-w-[82%] sm:max-w-[70%] p-3 rounded-3xl text-xs sm:text-sm shadow-xs backdrop-blur-md ${
                            isMe
                              ? 'bg-blue-600 text-white rounded-br-xs shadow-blue-500/15'
                              : 'bg-white/80 dark:bg-zinc-800/80 text-slate-800 dark:text-zinc-100 rounded-bl-xs border border-white/60 dark:border-white/5'
                          }`}
                        >
                          {/* Gambar jika ada di pesan */}
                          {msg.imageUrl && (
                            <div className="mb-2 overflow-hidden rounded-2xl border border-black/10 dark:border-white/10">
                              <img
                                src={msg.imageUrl}
                                alt="Attachment"
                                onClick={() => setPreviewZoomImage(msg.imageUrl || null)}
                                className="w-full max-h-60 object-cover cursor-pointer hover:scale-105 transition-transform duration-200"
                                loading="lazy"
                              />
                            </div>
                          )}

                          {/* Teks Pesan */}
                          {msg.text && (
                            <p className="whitespace-pre-wrap break-words leading-relaxed px-1">
                              {renderMessageTextWithLinks(msg.text, isMe)}
                            </p>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400 dark:text-zinc-500 px-2 mt-1 tabular-nums">
                          {new Date(msg.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </motion.div>
                    </React.Fragment>
                  );
                })
              )}
            </div>

            {/* PREVIEW LAMPIRAN GAMBAR DILAMPIRKAN */}
            {imagePreviewUrl && (
              <div className="relative px-3 py-2 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border border-white/60 dark:border-white/10 rounded-2xl flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <img src={imagePreviewUrl} alt="Preview Upload" className="w-12 h-12 rounded-xl object-cover border border-slate-200 dark:border-zinc-700" />
                  <div>
                    <p className="text-xs font-bold text-slate-800 dark:text-zinc-100">Gambar SIAP DIKIRIM</p>
                    <p className="text-[10px] text-slate-400">Otomatis dikompres ke WebP / Cloudinary</p>
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

            {/* Sticky Bottom Floating Input Pill */}
            <form
              onSubmit={handleSendMessage}
              className="p-1.5 pl-3 rounded-3xl bg-white/70 dark:bg-zinc-900/60 backdrop-blur-xl border border-white/70 dark:border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none flex items-center gap-2 shrink-0"
            >
              {/* Hidden File Input */}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleSelectImageFile}
                accept="image/*"
                className="hidden"
              />

              {/* Tombol Lampiran Gambar */}
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
                onFocus={() => {
                  setTimeout(() => {
                    if (chatScrollContainerRef.current) {
                      chatScrollContainerRef.current.scrollTop = chatScrollContainerRef.current.scrollHeight;
                    }
                  }, 300);
                }}
                placeholder={isSending ? "Mengunggah gambar & mengirim..." : `Ketik pesan ke ${getUserDisplayName(selectedPartner)}...`}
                disabled={isSending}
                className="flex-1 bg-transparent text-xs sm:text-sm text-slate-900 dark:text-zinc-100 placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none disabled:opacity-50"
              />

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                type="submit"
                disabled={(!inputText.trim() && !selectedImageFile) || isSending}
                className="w-10 h-10 rounded-2xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white flex items-center justify-center shadow-md shadow-blue-500/25 transition-all shrink-0 cursor-pointer"
              >
                {isSending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4 stroke-[2.2] -rotate-12 translate-y-[-0.5px] -translate-x-[0.5px]" />
                )}
              </motion.button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 space-y-3 rounded-3xl bg-white/30 dark:bg-zinc-900/25 backdrop-blur-md border border-white/40 dark:border-white/5 text-slate-400 dark:text-zinc-500">
            <div className="w-14 h-14 rounded-3xl bg-white/50 dark:bg-zinc-800/50 border border-white/40 dark:border-white/10 flex items-center justify-center text-blue-600 dark:text-blue-400 shadow-xs">
              <MessageSquare className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm sm:text-base font-bold text-slate-800 dark:text-zinc-200">
              
              </h3>
              <p className="text-xs text-slate-400 dark:text-zinc-400 max-w-sm mx-auto leading-relaxed">
                Pilih obrolan dari daftar sebelah kiri atau mulai obrolan baru dengan temanmu.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ================= MODAL FULLVIEW / ZOOM GAMBAR ================= */}
      <AnimatePresence>
        {previewZoomImage && (
          <div className="fixed inset-0 z-[999999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="relative max-w-4xl max-h-[90vh]"
            >
              <button
                onClick={() => setPreviewZoomImage(null)}
                className="absolute -top-10 right-0 p-2 text-white/80 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
              <img src={previewZoomImage} alt="Full Zoom" className="max-w-full max-h-[85vh] rounded-2xl object-contain shadow-2xl" />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ================= MODAL MULAI CHAT BARU (PILIH TEMAN) ================= */}
      <AnimatePresence>
        {isNewChatModalOpen && (
          <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsNewChatModalOpen(false)}
              className="fixed inset-0 bg-slate-950/70 backdrop-blur-md transition-opacity"
            />

            <motion.div 
              initial={{ scale: 0.92, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0, y: 15 }}
              transition={{ type: 'spring', stiffness: 350, damping: 28 }}
              className="relative z-10 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-2xl border border-white/50 dark:border-white/10 text-slate-800 dark:text-zinc-100 rounded-3xl max-w-md w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-slate-200/50 dark:border-white/10 flex items-center justify-between shrink-0 bg-white/40 dark:bg-zinc-900/40">
                <h3 className="text-base font-bold text-slate-900 dark:text-zinc-100">
                  Mulai Chat Baru
                </h3>
                <button
                  onClick={() => setIsNewChatModalOpen(false)}
                  className="p-1.5 rounded-2xl text-slate-400 hover:text-slate-800 dark:hover:text-zinc-200 hover:bg-white/40 dark:hover:bg-zinc-800 transition-colors shrink-0 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Search Modal */}
              <div className="p-3 border-b border-slate-200/30 dark:border-white/5 shrink-0">
                <div className="relative flex items-center w-full rounded-2xl bg-white/60 dark:bg-zinc-800/60 border border-white/40 dark:border-white/10 px-3 py-2">
                  <Search className="w-4 h-4 text-slate-400 shrink-0 mr-2.5 pointer-events-none" />
                  <input
                    type="text"
                    value={searchNewUser}
                    onChange={(e) => setSearchNewUser(e.target.value)}
                    placeholder="Cari nickname, username, atau NRP..."
                    className="w-full bg-transparent text-xs text-slate-800 dark:text-zinc-200 placeholder-slate-400 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-3 space-y-1 custom-scrollbar">
                {filteredNewUsers.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-400">
                    Teman tidak ditemukan.
                  </div>
                ) : (
                  filteredNewUsers.map((user) => {
                    const displayName = getUserDisplayName(user);
                    const avatar = getUserAvatar(user);

                    return (
                      <motion.div
                        key={user.nrp}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          handleOpenPartnerChat(user);
                          setIsNewChatModalOpen(false);
                        }}
                        className="flex items-center gap-3 p-3 rounded-2xl cursor-pointer hover:bg-white/60 dark:hover:bg-zinc-800/60 transition-all border border-transparent hover:border-white/20 dark:hover:border-white/10"
                      >
                        <div className="w-10 h-10 rounded-2xl bg-slate-200 dark:bg-zinc-800 flex items-center justify-center overflow-hidden border border-white/40 dark:border-zinc-700 shrink-0 shadow-xs">
                          {avatar ? (
                            <img src={avatar} alt={displayName} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-xs font-bold text-slate-700 dark:text-zinc-200">
                              {displayName.charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-slate-800 dark:text-zinc-100 truncate">
                            {displayName}
                          </p>
                          <p className="text-[11px] text-slate-400 truncate">
                            @{user.username || user.nrp}
                          </p>
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};