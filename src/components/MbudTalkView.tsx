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
  X
} from 'lucide-react';
import { supabase } from '../services/supabase';
import { 
  subscribeToChatRoom, 
  sendChatMessage, 
  clearUnreadNotification, 
  subscribeToRecentChats,
  ChatMessage,
  RecentChatMeta
} from '../services/firebaseChat';

interface UserProfile {
  nrp: string;
  name?: string;
  full_name?: string;
  username?: string;
  photo_url?: string;
  avatar_url?: string;
}

interface MbudTalkViewProps {
  onBack: () => void;
  targetNrp?: string | null;
}

export const MbudTalkView: React.FC<MbudTalkViewProps> = ({ onBack, targetNrp }) => {
  const currentUserNrp = typeof window !== 'undefined' ? (localStorage.getItem('mymbud_user_nrp') || '').trim().toLowerCase() : '';

  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [recentChats, setRecentChats] = useState<RecentChatMeta[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const [searchHistory, setSearchHistory] = useState<string>('');
  const [selectedPartner, setSelectedPartner] = useState<UserProfile | null>(null);

  // Modal Mulai Chat Baru
  const [isNewChatModalOpen, setIsNewChatModalOpen] = useState<boolean>(false);
  const [searchNewUser, setSearchNewUser] = useState<string>('');

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState<string>('');
  const [isSending, setIsSending] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const getUserDisplayName = (u?: UserProfile | null) => u?.name || u?.full_name || u?.username || u?.nrp || 'Teman';
  const getUserAvatar = (u?: UserProfile | null) => u?.photo_url || u?.avatar_url || null;

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

          if (targetNrp) {
            const found = others.find(
              (u: any) => String(u.nrp || '').trim().toLowerCase() === targetNrp.trim().toLowerCase()
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

  // 2. Subscribe ke Riwayat Chat (Recent Chats)
  useEffect(() => {
    if (!currentUserNrp) return;

    const unsubscribe = subscribeToRecentChats(currentUserNrp, (recentList) => {
      setRecentChats(recentList);
    });

    return () => unsubscribe();
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

  // 4. Auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !selectedPartner?.nrp || isSending) return;

    const text = inputText.trim();
    setInputText('');
    setIsSending(true);

    try {
      await sendChatMessage(currentUserNrp, selectedPartner.nrp, text);
    } catch (error) {
      console.error('Gagal mengirim pesan:', error);
      alert('Gagal mengirim pesan.');
    } finally {
      setIsSending(false);
    }
  };

  // Gabungkan data recent chats dengan profil user Supabase
  const populatedRecentChats = recentChats
    .map((item) => {
      const userProfile = allUsers.find(
        (u) => String(u.nrp).trim().toLowerCase() === item.partnerNrp.toLowerCase()
      );
      return {
        ...item,
        profile: userProfile || { nrp: item.partnerNrp, name: item.partnerNrp },
      };
    })
    .filter((item) => {
      const q = searchHistory.toLowerCase();
      const name = getUserDisplayName(item.profile).toLowerCase();
      const username = (item.profile.username || '').toLowerCase();
      return name.includes(q) || username.includes(q) || item.lastMessage.toLowerCase().includes(q);
    });

  // Filter user untuk Modal Pesan Baru
  const filteredNewUsers = allUsers.filter((u) => {
    const q = searchNewUser.toLowerCase();
    const name = getUserDisplayName(u).toLowerCase();
    const username = (u.username || '').toLowerCase();
    const nrp = String(u.nrp || '').toLowerCase();
    return name.includes(q) || username.includes(q) || nrp.includes(q);
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col h-[calc(100vh-6rem)] sm:h-[calc(100vh-7rem)] w-full max-w-5xl mx-auto rounded-3xl bg-white/70 dark:bg-zinc-900/60 backdrop-blur-xl border border-white/60 dark:border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none overflow-hidden relative"
    >
      <div className="flex flex-1 overflow-hidden">
        
        {/* ================= BILAH KIRI: RIWAYAT CHAT ================= */}
        <div
          className={`w-full md:w-80 flex flex-col border-r border-slate-200/50 dark:border-white/5 bg-white/40 dark:bg-zinc-900/40 ${
            selectedPartner ? 'hidden md:flex' : 'flex'
          }`}
        >
          {/* Header mbudTalk & Tombol Mulai Chat Baru */}
          <div className="p-4 border-b border-slate-200/50 dark:border-white/5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={onBack}
                className="p-2 rounded-2xl text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-zinc-100 flex items-center gap-1.5">
                  <span>mbudTalk</span>
                  <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-900/50">
                    v1.0
                  </span>
                </h2>
              </div>
            </div>

            {/* Tombol Pesan Baru (New Chat) */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                setSearchNewUser('');
                setIsNewChatModalOpen(true);
              }}
              className="p-2.5 rounded-2xl bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-500/20 transition-all cursor-pointer flex items-center justify-center"
              title="Mulai Chat Baru"
            >
              <MessageSquarePlus className="w-4 h-4" />
            </motion.button>
          </div>

          {/* Search Riwayat */}
          {recentChats.length > 0 && (
            <div className="p-3 border-b border-slate-200/30 dark:border-white/5">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 dark:text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchHistory}
                  onChange={(e) => setSearchHistory(e.target.value)}
                  placeholder="Cari dalam obrolan..."
                  className="w-full pl-9 pr-4 py-2 rounded-2xl bg-slate-100/70 dark:bg-zinc-800/60 border border-slate-200/40 dark:border-white/5 text-xs text-slate-800 dark:text-zinc-200 placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
              </div>
            </div>
          )}

          {/* List Riwayat Chat */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
            {loading ? (
              <div className="flex flex-col items-center justify-center p-8 space-y-2 text-slate-400 dark:text-zinc-500">
                <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                <span className="text-xs">Memuat obrolan...</span>
              </div>
            ) : populatedRecentChats.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 text-center space-y-3 text-slate-400 dark:text-zinc-500 my-auto">
                <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-zinc-800/60 flex items-center justify-center text-slate-400">
                  <MessageSquare className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-bold text-slate-700 dark:text-zinc-300">Belum ada obrolan</p>
                  <p className="text-[11px] text-slate-400 dark:text-zinc-500 max-w-[200px]">
                    Klik tombol pensil di atas untuk memulai obrolan baru.
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
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedPartner(item.profile)}
                    className={`flex items-center gap-3 p-3 rounded-2xl cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                        : 'hover:bg-slate-100/80 dark:hover:bg-zinc-800/60 text-slate-800 dark:text-zinc-200'
                    }`}
                  >
                    <div className="w-11 h-11 rounded-full bg-slate-200 dark:bg-zinc-800 flex items-center justify-center overflow-hidden border border-slate-200/60 dark:border-zinc-700/60 shrink-0">
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
                        <p className={`text-xs font-bold truncate ${isSelected ? 'text-white' : 'text-slate-800 dark:text-zinc-100'}`}>
                          {displayName}
                        </p>
                        <span className={`text-[10px] shrink-0 tabular-nums ${isSelected ? 'text-blue-100' : 'text-slate-400 dark:text-zinc-500'}`}>
                          {new Date(item.lastTimestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className={`text-[11px] truncate mt-0.5 ${isSelected ? 'text-blue-100' : 'text-slate-500 dark:text-zinc-400'}`}>
                        {item.lastMessage}
                      </p>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        </div>

        {/* ================= BILAH KANAN: RUANG PERCAKAPAN ================= */}
        <div
          className={`flex-1 flex flex-col bg-white/20 dark:bg-zinc-950/20 ${
            !selectedPartner ? 'hidden md:flex' : 'flex'
          }`}
        >
          {selectedPartner ? (
            <>
              {/* Header Active Chat */}
              <div className="p-3.5 px-4 sm:px-6 border-b border-slate-200/50 dark:border-white/5 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-md flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedPartner(null)}
                    className="md:hidden p-1.5 rounded-xl text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>

                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-slate-200 dark:bg-zinc-800 flex items-center justify-center overflow-hidden border border-slate-200/60 dark:border-zinc-700/60 shrink-0">
                    {getUserAvatar(selectedPartner) ? (
                      <img src={getUserAvatar(selectedPartner)!} alt={getUserDisplayName(selectedPartner)} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xs sm:text-sm font-bold text-slate-700 dark:text-zinc-200">
                        {getUserDisplayName(selectedPartner).charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>

                  <div>
                    <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-zinc-100 leading-tight">
                      {getUserDisplayName(selectedPartner)}
                    </h3>
                    <p className="text-[10px] sm:text-[11px] text-slate-400 dark:text-zinc-500">
                      @{selectedPartner.username || selectedPartner.nrp}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 bg-emerald-50/80 dark:bg-emerald-950/50 px-2.5 py-1 rounded-full border border-emerald-200/60 dark:border-emerald-900/50">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span className="font-semibold hidden sm:inline">mbudTalk Direct</span>
                </div>
              </div>

              {/* Chat Stream Body */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3 custom-scrollbar">
                {messages.length === 0 ? (
                  <div className="flex h-full flex-col items-center justify-center text-center p-6 text-slate-400 dark:text-zinc-500 space-y-2">
                    <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                      <MessageSquare className="w-6 h-6" />
                    </div>
                    <p className="text-xs sm:text-sm font-bold text-slate-700 dark:text-zinc-300">
                      Mulai obrolan dengan {getUserDisplayName(selectedPartner).split(' ')[0]}
                    </p>
                    <p className="text-[11px] text-slate-400 dark:text-zinc-500 max-w-xs">
                      Kirim pesan langsung secara instan
                    </p>
                  </div>
                ) : (
                  messages.map((msg, idx) => {
                    const isMe = String(msg.senderNrp).trim().toLowerCase() === currentUserNrp;
                    return (
                      <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        key={msg.id || idx}
                        className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                      >
                        <div
                          className={`max-w-[80%] sm:max-w-[70%] px-4 py-2.5 rounded-2xl text-xs sm:text-sm shadow-xs ${
                            isMe
                              ? 'bg-blue-600 text-white rounded-tr-xs'
                              : 'bg-white dark:bg-zinc-800 text-slate-800 dark:text-zinc-100 rounded-tl-xs border border-slate-200/50 dark:border-white/5'
                          }`}
                        >
                          <p className="whitespace-pre-wrap break-words leading-relaxed">{msg.text}</p>
                        </div>
                        <span className="text-[10px] text-slate-400 dark:text-zinc-500 px-1 mt-1 tabular-nums">
                          {new Date(msg.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </motion.div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input Bar */}
              <form
                onSubmit={handleSendMessage}
                className="p-3 sm:p-4 border-t border-slate-200/50 dark:border-white/5 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-md flex items-center gap-2"
              >
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={`Kirim pesan ke ${getUserDisplayName(selectedPartner).split(' ')[0]}...`}
                  className="flex-1 px-4 py-3 rounded-2xl bg-white dark:bg-zinc-800/80 border border-slate-200/80 dark:border-zinc-700/80 text-xs sm:text-sm text-slate-900 dark:text-zinc-100 placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="submit"
                  disabled={!inputText.trim() || isSending}
                  className="w-11 h-11 rounded-2xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white flex items-center justify-center shadow-md shadow-blue-500/25 transition-all shrink-0 cursor-pointer"
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
            <div className="flex h-full flex-col items-center justify-center text-center p-8 space-y-3 text-slate-400 dark:text-zinc-500">
              <div className="w-14 h-14 rounded-3xl bg-slate-100 dark:bg-zinc-800/60 border border-slate-200/50 dark:border-white/5 flex items-center justify-center text-blue-600 dark:text-blue-400 shadow-xs">
                <MessageSquare className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm sm:text-base font-bold text-slate-800 dark:text-zinc-200">
                
                </h3>
                <p className="text-xs text-slate-500 dark:text-zinc-400 max-w-sm mx-auto">
                  Pilih salah satu obrolan dari daftar sebelah kiri, atau buat chat baru dengan temanmu.
                </p>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* ================= MODAL MULAI CHAT BARU (PILIH TEMAN) ================= */}
      <AnimatePresence>
        {isNewChatModalOpen && (
          <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsNewChatModalOpen(false)}
              className="fixed inset-0 bg-slate-950/75 backdrop-blur-md transition-opacity"
            />

            <motion.div 
              initial={{ scale: 0.92, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0, y: 15 }}
              transition={{ type: 'spring', stiffness: 350, damping: 28 }}
              className="relative z-10 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border border-white/40 dark:border-white/10 text-slate-800 dark:text-zinc-100 rounded-3xl max-w-md w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden"
            >
              {/* Modal Header */}
              <div className="px-6 py-4 border-b border-slate-200/50 dark:border-white/10 flex items-center justify-between shrink-0 bg-white/50 dark:bg-zinc-900/50">
                <h3 className="text-base font-bold text-slate-900 dark:text-zinc-100">
                  Mulai Chat Baru
                </h3>
                <button
                  onClick={() => setIsNewChatModalOpen(false)}
                  className="p-1.5 rounded-2xl text-slate-400 hover:text-slate-800 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors shrink-0 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Search Input */}
              <div className="p-4 border-b border-slate-200/30 dark:border-white/5">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 dark:text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchNewUser}
                    onChange={(e) => setSearchNewUser(e.target.value)}
                    placeholder="Cari nama, username, atau NRP teman..."
                    className="w-full pl-9 pr-4 py-2.5 rounded-2xl bg-slate-100/70 dark:bg-zinc-800/60 border border-slate-200/40 dark:border-white/5 text-xs text-slate-800 dark:text-zinc-200 placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                </div>
              </div>

              {/* Modal User Contacts Stream */}
              <div className="flex-1 overflow-y-auto p-3 space-y-1 custom-scrollbar">
                {filteredNewUsers.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-400 dark:text-zinc-500">
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
                          setSelectedPartner(user);
                          setIsNewChatModalOpen(false);
                        }}
                        className="flex items-center gap-3 p-3 rounded-2xl cursor-pointer hover:bg-slate-100/80 dark:hover:bg-zinc-800/60 transition-all border border-transparent hover:border-slate-200/50 dark:hover:border-white/5"
                      >
                        <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-zinc-800 flex items-center justify-center overflow-hidden border border-slate-200/60 dark:border-zinc-700/60 shrink-0">
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
                          <p className="text-[11px] text-slate-400 dark:text-zinc-500 truncate">
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
    </motion.div>
  );
};