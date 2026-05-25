import React, { useState } from 'react';
import { Bookmark, MessageCircle, PlayCircle, Share2, MoreVertical } from 'lucide-react';
import { formatDistanceToNowStrict, parseISO } from 'date-fns';
import { vi } from 'date-fns/locale';
import { ContentItem } from '../types';
import { useStore } from '../hooks/useStore';
import { cn } from '../lib/utils';

interface ContentCardProps {
  content: ContentItem;
  onOpenDetails: (content: ContentItem) => void;
}

export function ContentCard({ content, onOpenDetails }: ContentCardProps) {
  const { savedContentIds, toggleSaveContent, members } = useStore();
  const isSaved = savedContentIds.includes(content.id);
  const author = members.find(m => m.id === content.authorId);
  const authorName = content.authorName || author?.name || 'Ẩn danh';

  let displayStatus = content.status;
  if ((content.type === 'video' || content.type === 'live') && content.broadcastTime) {
    const broadcastDate = new Date(content.broadcastTime);
    const now = new Date();
    if (now < broadcastDate) {
      displayStatus = 'upcoming';
    } else if (content.status === 'upcoming') {
      displayStatus = 'live';
    }
  }

  return (
    <div className="bg-transparent flex flex-col h-full group">
      <div 
        className="relative aspect-video bg-slate-100 cursor-pointer overflow-hidden rounded-2xl md:rounded-3xl shadow-sm group-hover:shadow-md transition-shadow"
        onClick={() => onOpenDetails(content)}
      >
        <img 
          src={content.thumbnailUrl || undefined} 
          alt={content.title}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        {(content.type === 'video' || content.type === 'live') && (
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/10">
            <div className="w-14 h-14 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center transform group-hover:scale-110 transition-transform">
              <PlayCircle className="text-white w-8 h-8 ml-1" />
            </div>
          </div>
        )}
        <div className="absolute bottom-2 right-2 flex gap-1">
          {content.type === 'video' || content.type === 'live' ? (
             <span className="px-2 py-1 bg-black/80 backdrop-blur-md text-[10px] font-medium rounded text-white flex items-center gap-1">
               {content.type === 'live' ? 'Live' : 'Video'}
             </span>
          ) : (
            <span className="px-2 py-1 bg-blue-600/90 text-[10px] font-medium rounded text-white font-medium">
              Tin tức
            </span>
          )}
        </div>
        <div className="absolute top-2 left-2 flex gap-1">
          {displayStatus === 'upcoming' && (
            <span className="px-2 py-1 bg-amber-500/90 backdrop-blur-md text-[10px] font-bold rounded text-white shadow-sm">
              Sắp phát sóng
            </span>
          )}
          {displayStatus === 'live' && (
            <span className="px-2 py-1 bg-red-600/90 backdrop-blur-md text-[10px] font-bold rounded text-white shadow-sm flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span> LIVE
            </span>
          )}
        </div>
      </div>

      <div className="mt-3 flex gap-3 px-1">
        <div className="flex-shrink-0">
          <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-100 border border-slate-200">
            {content.authorImageUrl ? (
              <img src={content.authorImageUrl || undefined} alt={authorName} className="w-full h-full object-cover" />
            ) : author?.imageUrl ? (
              <img src={author.imageUrl || undefined} alt={author.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center font-bold text-sm text-slate-400 bg-slate-50">{authorName[0]}</div>
            )}
          </div>
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 
            className="font-bold text-base leading-tight line-clamp-2 cursor-pointer text-slate-900 group-hover:text-blue-600 transition-colors mb-1"
            onClick={() => onOpenDetails(content)}
          >
            {content.title}
          </h3>
          
          <div className="text-sm text-slate-500 font-medium">
            <p className="hover:text-slate-700 cursor-pointer truncate">{authorName}</p>
            <div className="flex items-center gap-1 text-[13px] mt-0.5">
              <span>{content.viewCount || 0} lượt xem</span>
              <span className="w-1 h-1 rounded-full bg-slate-400 inline-block mx-1"></span>
              <span>{content.createdAt ? formatDistanceToNowStrict(parseISO(content.createdAt), { addSuffix: true, locale: vi }) : ''}</span>
            </div>
          </div>
        </div>

        <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <button 
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition-colors"
            onClick={(e) => { e.stopPropagation(); toggleSaveContent(content.id); }}
          >
            <Bookmark size={20} className={isSaved ? "fill-slate-700 text-slate-700" : ""} />
          </button>
        </div>
      </div>
    </div>
  );
}
