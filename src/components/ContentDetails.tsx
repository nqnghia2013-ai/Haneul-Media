import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Send, Bookmark } from 'lucide-react';
import { format, parseISO, formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { ContentItem } from '../types';
import { useStore } from '../hooks/useStore';
import { cn } from '../lib/utils';

interface ContentDetailsProps {
  content: ContentItem;
  onBack: () => void;
}

export function ContentDetails({ content: propContent, onBack }: ContentDetailsProps) {
  const { savedContentIds, toggleSaveContent, addComment, currentUser, members, contents } = useStore();
  const content = contents.find(c => c.id === propContent.id) || propContent;
  const [commentText, setCommentText] = useState('');
  
  const isSaved = savedContentIds.includes(content.id);
  const author = members.find(m => m.id === content.authorId);
  const authorName = content.authorName || author?.name || 'Ẩn danh';

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (commentText.trim()) {
      addComment(content.id, commentText);
      setCommentText('');
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="bg-slate-50 min-h-screen pb-20 md:pb-0"
    >
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-xl border-b border-slate-200 p-4 flex items-center justify-between shadow-sm">
        <button 
          onClick={onBack}
          className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors flex items-center gap-2 group"
        >
          <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm font-bold hidden sm:block">Quay lại</span>
        </button>
        <div className="flex gap-2">
           <button 
            className={cn(
              "p-2 rounded-xl transition-all duration-300 flex items-center gap-2 px-4 border text-[10px] uppercase tracking-wider font-bold shadow-sm",
              isSaved 
                ? "text-yellow-600 bg-yellow-50 border-yellow-200" 
                : "text-slate-500 hover:text-slate-800 bg-white border-slate-200 hover:bg-slate-50"
            )}
            onClick={() => toggleSaveContent(content.id)}
          >
            <Bookmark size={18} className={isSaved ? "fill-yellow-500 text-yellow-500 scale-110 transition-transform" : "transition-transform"} />
            <span className="hidden sm:inline">{isSaved ? 'Đã lưu' : 'Lưu bài viết'}</span>
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 md:p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          {content.type === 'video' && content.videoUrl && (
            <div className="w-full aspect-video bg-slate-900 rounded-3xl overflow-hidden mb-8 shadow-xl">
              {(() => {
                const getYoutubeEmbedUrl = (url: string) => {
                  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
                  const match = url.match(regExp);
                  return (match && match[2].length === 11) ? `https://www.youtube.com/embed/${match[2]}` : null;
                };
                const getDriveEmbedUrl = (url: string) => {
                  const regExp = /\/file\/d\/([a-zA-Z0-9_-]+)/;
                  const match = url.match(regExp);
                  return match ? `https://drive.google.com/file/d/${match[1]}/preview` : null;
                };
                
                const youtubeEmbedUrl = getYoutubeEmbedUrl(content.videoUrl);
                const driveEmbedUrl = getDriveEmbedUrl(content.videoUrl);
                
                if (youtubeEmbedUrl || driveEmbedUrl) {
                  return (
                    <iframe
                      src={youtubeEmbedUrl || driveEmbedUrl}
                      title={content.title}
                      className="w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  );
                }
                
                return (
                  <video 
                    controls 
                    src={content.videoUrl} 
                    poster={content.thumbnailUrl}
                    className="w-full h-full"
                  />
                );
              })()}
            </div>
          )}

          {content.type === 'news' && (
            <div className="w-full aspect-video rounded-3xl overflow-hidden mb-8 shadow-md">
              <img 
                src={content.thumbnailUrl} 
                alt={content.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex gap-3 mb-6 items-center">
            <span className="px-3 py-1 bg-white border border-slate-200 text-[10px] uppercase tracking-wider font-bold rounded-lg shadow-sm text-slate-600">
              {content.category}
            </span>
            {content.status === 'upcoming' && (
              <span className="px-3 py-1 bg-amber-50 border border-amber-200 text-[10px] uppercase tracking-wider font-bold rounded-lg shadow-sm text-amber-700">
                Sắp phát sóng
              </span>
            )}
            {content.status === 'live' && (
              <span className="px-3 py-1 bg-red-50 border border-red-200 text-[10px] uppercase tracking-wider font-bold rounded-lg shadow-sm text-red-600 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse"></span> TRỰC TIẾP
              </span>
            )}
          </div>

          <h1 className="text-3xl md:text-5xl font-serif font-bold text-slate-900 mb-6 leading-tight">{content.title}</h1>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4 border-y border-slate-200 mb-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full overflow-hidden bg-slate-100 border border-slate-200 shadow-sm">
                 {author?.imageUrl ? (
                   <img src={author.imageUrl} alt={author.name} className="w-full h-full object-cover" />
                 ) : (
                   <div className="w-full h-full flex items-center justify-center font-bold text-slate-500 bg-slate-50">{authorName[0]}</div>
                 )}
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800 mb-0.5">{authorName}</p>
                <p className="text-[10px] text-slate-500 font-medium tracking-wide">
                  {content.createdAt ? format(parseISO(content.createdAt), 'dd MMMM, yyyy - HH:mm', { locale: vi }) : ''}
                </p>
              </div>
            </div>
          </div>

          <div className="prose max-w-none mb-16">
            {content.type === 'news' ? (
              <p className="whitespace-pre-wrap text-lg font-medium text-slate-700 leading-relaxed">{content.content}</p>
            ) : (
              <p className="text-lg font-medium text-slate-700 leading-relaxed">{content.description}</p>
            )}
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="border-t border-slate-200 pt-10"
        >
          <h3 className="text-xl font-serif font-bold text-slate-900 mb-8 border-l-4 border-blue-500 pl-4">Bình luận ({(content.comments || []).length})</h3>
          
          <div className="space-y-6 mb-10">
            {(content.comments || []).map(comment => (
              <div key={comment.id} className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-slate-200 text-slate-600 border border-slate-300 flex items-center justify-center font-bold flex-shrink-0 shadow-sm overflow-hidden">
                  {comment.userAvatar ? (
                    <img src={comment.userAvatar} alt={comment.userName} className="w-full h-full object-cover" />
                  ) : (
                    comment.userName[0]
                  )}
                </div>
                <div className="bg-white p-4 rounded-2xl rounded-tl-none border border-slate-100 shadow-sm flex-1">
                  <div className="flex items-baseline gap-3 mb-1">
                    <span className="text-sm font-bold text-slate-800">{comment.userName}</span>
                    <span className="text-[10px] text-slate-400 font-medium tracking-wide">
                      {comment.createdAt ? formatDistanceToNow(parseISO(comment.createdAt), { addSuffix: true, locale: vi }) : ''}
                    </span>
                  </div>
                  <p className="text-slate-600 text-sm font-medium">{comment.content}</p>
                </div>
              </div>
            ))}
            {(content.comments || []).length === 0 && (
              <div className="text-center py-10 bg-white rounded-3xl border border-slate-100 border-dashed">
                <p className="text-slate-500 text-sm font-medium">Chưa có bình luận nào. Hãy là người đầu tiên!</p>
              </div>
            )}
          </div>

          {currentUser ? (
            <form onSubmit={handleAddComment} className="flex gap-4 items-start">
              <div className="w-10 h-10 rounded-full bg-blue-100 border border-blue-200 text-blue-700 flex items-center justify-center font-bold flex-shrink-0 shadow-sm overflow-hidden">
                 {currentUser.avatar ? (
                   <img src={currentUser.avatar} alt={currentUser.name} className="w-full h-full object-cover" />
                 ) : (
                   currentUser.name[0]
                 )}
              </div>
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Thêm bình luận..."
                  className="w-full pl-5 pr-14 py-4 rounded-2xl bg-white border border-slate-200 shadow-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all text-sm text-slate-800 font-medium"
                />
                <button 
                  type="submit"
                  disabled={!commentText.trim()}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-blue-600 text-white disabled:bg-slate-100 disabled:text-slate-400 rounded-xl transition-all shadow-sm hover:bg-blue-700 hover:shadow-md"
                >
                  <Send size={18} />
                </button>
              </div>
            </form>
          ) : (
            <div className="p-6 bg-slate-50 border border-slate-200 rounded-3xl text-center">
              <p className="text-slate-500 text-sm font-medium">Vui lòng đăng nhập để bình luận.</p>
            </div>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
}
