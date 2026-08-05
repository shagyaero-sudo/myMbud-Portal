import React, { useState, useEffect } from 'react';
import { MbudiaryPost, MbudiaryReply, UserProfile } from '../types';
import { 
  toggleLikePost, 
  getReplies, 
  addReply, 
  deletePost 
} from './lib/storage';
import { formatDateFormatted, formatTimeAgo, formatPostTimestamp } from './lib/utils';
import { 
  Heart, 
  MessageSquare, 
  Trash2, 
  Send, 
  CornerDownRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface PostCardProps {
  post: MbudiaryPost;
  currentUser: UserProfile;
  onPostUpdate?: () => void;
  onSelectPost?: (postId: string) => void;
  onSelectAuthor?: (authorUsername: string) => void;
  isDetailPage?: boolean;
}

export const PostCard: React.FC<PostCardProps> = ({ 
  post, 
  currentUser, 
  onPostUpdate,
  onSelectPost,
  onSelectAuthor,
  isDetailPage = false
}) => {
  const [replies, setReplies] = useState<MbudiaryReply[]>([]);
  const [isRepliesExpanded, setIsRepliesExpanded] = useState(isDetailPage);
  const [replyContent, setReplyContent] = useState('');
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);
  const [isLiked, setIsLiked] = useState<boolean>(false);
  const [likeCount, setLikeCount] = useState<number>(post.likes.length);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    setIsLiked(post.likes.includes(currentUser.nrp) || post.likes.includes(currentUser.nickname));
    setLikeCount(post.likes.length);
    setReplies(getReplies(post.id));
    if (isDetailPage) {
      setIsRepliesExpanded(true);
    }
  }, [post, currentUser, isDetailPage]);

  const handleLikeToggle = async () => {
    const updated = await toggleLikePost(post.id, currentUser.nrp);
    if (updated) {
      const hasLiked = updated.likes.includes(currentUser.nrp);
      setIsLiked(hasLiked);
      setLikeCount(updated.likes.length);
    }
  };

  const handleCommentClick = () => {
    if (onSelectPost && !isDetailPage) {
      onSelectPost(post.id);
    } else {
      setIsRepliesExpanded(prev => !prev);
    }
  };

  const handleAddReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyContent.trim() || isSubmittingReply) return;

    setIsSubmittingReply(true);
    try {
      await addReply(post.id, currentUser.nickname, currentUser.nrp, replyContent.trim(), currentUser.emoji || '😊');
      setReplyContent('');
      setReplies(getReplies(post.id));
      onPostUpdate?.();
    } catch (error) {
      console.error('[mbudiary] Gagal menambahkan komentar:', error);
    } finally {
      setIsSubmittingReply(false);
    }
  };

  const handleDeletePost = async () => {
    if (window.confirm('Apakah Anda yakin ingin menghapus postingan ini?')) {
      setIsDeleting(true);
      try {
        await deletePost(post.id);
        onPostUpdate?.();
      } catch (error) {
        console.error('[mbudiary] Gagal menghapus postingan:', error);
      } finally {
        setIsDeleting(false);
      }
    }
  };

  // Cek validasi hak hapus (Pemilik postingan ATAU Officer/Admin)
  const isAuthor = 
    post.authorUsername.toLowerCase() === currentUser.nickname.toLowerCase() ||
    post.authorUsername.toLowerCase() === currentUser.nrp.toLowerCase() ||
    post.authorName.toLowerCase() === currentUser.nickname.toLowerCase();
    
  const canDelete = isAuthor || currentUser.isOfficer;

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.25 }}
      className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-3xl p-4 sm:p-5 transition-all duration-200 shadow-sm"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div 
          onClick={() => onSelectAuthor?.(post.authorUsername)}
          className="flex items-center gap-3 cursor-pointer group/author"
          title={`Lihat profil ${post.authorName}`}
        >
          <span className="text-2xl shrink-0 group-hover/author:scale-110 transition-transform leading-none">
            {post.authorEmoji || '😊'}
          </span>

          <div>
            <div className="flex items-center flex-wrap gap-1.5">
              <span className="text-slate-900 dark:text-zinc-100 font-bold text-sm group-hover/author:text-indigo-600 dark:group-hover/author:text-indigo-400 transition-colors">
                {post.authorName}
              </span>
            </div>

            <div className="flex items-center gap-1.5 text-slate-400 dark:text-zinc-500 text-[10px] mt-0.5">
              <span title={formatDateFormatted(post.createdAt)}>
                {formatPostTimestamp(post.createdAt)}
              </span>
            </div>
          </div>
        </div>

        {canDelete && (
          <button
            onClick={handleDeletePost}
            disabled={isDeleting}
            className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-zinc-800 transition-colors"
            title="Hapus Postingan"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="text-sm text-slate-800 dark:text-zinc-200 leading-relaxed whitespace-pre-line mb-4 font-normal">
        {post.content}
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-zinc-800 text-xs">
        <div className="flex items-center gap-2 sm:gap-3">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={handleLikeToggle}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all text-xs ${
              isLiked 
                ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-500 font-bold border border-rose-200/80 dark:border-rose-900/50' 
                : 'text-slate-400 dark:text-zinc-500 hover:text-rose-500 hover:bg-rose-50/60 dark:hover:bg-zinc-800/80'
            }`}
          >
            <Heart 
              className={`w-4 h-4 transition-transform ${
                isLiked ? 'fill-rose-500 text-rose-500 scale-110' : ''
              }`} 
            />
            <span>{likeCount}</span>
          </motion.button>

          <button
            onClick={handleCommentClick}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all text-xs ${
              isRepliesExpanded && isDetailPage
                ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 font-bold border border-indigo-200/80 dark:border-indigo-900/50' 
                : 'text-slate-400 dark:text-zinc-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50/60 dark:hover:bg-zinc-800/80'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>{post.replyCount || replies.length}</span>
            <span className="hidden xs:inline">Komen</span>
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isRepliesExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="mt-3 pt-3 border-t border-slate-100 dark:border-zinc-800 space-y-3 overflow-hidden"
          >
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-700 dark:text-zinc-300 flex items-center gap-1.5">
                <CornerDownRight className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
                Komen & Balasan ({replies.length})
              </h4>
            </div>

            <div className="space-y-2.5">
              {replies.length === 0 ? (
                <div className="p-3 text-center rounded-2xl bg-slate-50 dark:bg-zinc-800/50 border border-slate-100 dark:border-zinc-800 text-xs text-slate-400 dark:text-zinc-500 italic">
                  Belum ada komen. Berikan tanggapan pertamamu!
                </div>
              ) : (
                replies.map(reply => (
                  <div 
                    key={reply.id} 
                    className="p-3 rounded-2xl bg-slate-50 dark:bg-zinc-800/50 border border-slate-100 dark:border-zinc-800 space-y-1"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <div 
                        onClick={() => onSelectAuthor?.(reply.authorUsername)}
                        className="flex items-center gap-2 cursor-pointer group/replyAuthor"
                        title={`Lihat profil ${reply.authorName}`}
                      >
                        <span className="text-base shrink-0 group-hover/replyAuthor:scale-110 transition-transform leading-none">
                          {reply.authorEmoji || '😊'}
                        </span>
                        <span className="text-slate-900 dark:text-zinc-100 font-bold group-hover/replyAuthor:text-indigo-600 dark:group-hover/replyAuthor:text-indigo-400 transition-colors">
                          {reply.authorName}
                        </span>
                      </div>
                      <span className="text-slate-400 dark:text-zinc-500 text-[10px]">
                        {formatTimeAgo(reply.createdAt)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 dark:text-zinc-300 leading-relaxed pl-7">
                      {reply.content}
                    </p>
                  </div>
                ))
              )}
            </div>

            <form onSubmit={handleAddReply} className="flex items-center gap-2 pt-1">
              <input
                type="text"
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder={`Tulis komen sebagai ${currentUser.nickname}...`}
                className="flex-1 px-3.5 py-2 rounded-2xl bg-slate-50 dark:bg-zinc-800 text-xs border border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-zinc-100 placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                type="submit"
                disabled={!replyContent.trim() || isSubmittingReply}
                className="px-4 py-2 rounded-2xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-100 dark:disabled:bg-zinc-800 text-white disabled:text-slate-400 text-xs font-semibold transition-all flex items-center gap-1 shadow-sm"
              >
                <Send className="w-3.5 h-3.5" />
                <span className="hidden xs:inline">Kirim</span>
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.article>
  );
};