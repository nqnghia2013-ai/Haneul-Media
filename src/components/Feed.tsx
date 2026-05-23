import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useStore } from '../hooks/useStore';
import { ContentCard } from './ContentCard';
import { ContentItem } from '../types';
import { cn } from '../lib/utils';
import { Filter, Search } from 'lucide-react';

interface FeedProps {
  onOpenDetails: (content: ContentItem) => void;
}

export function Feed({ onOpenDetails }: FeedProps) {
  const { contents } = useStore();
  const [filterType, setFilterType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredContents = contents.filter(c => {
    const matchesFilter = filterType === 'all' || 
                        (filterType === 'video' && c.type === 'video') || 
                        (filterType === 'news' && c.type === 'news') ||
                        (c.category === filterType);
    const matchesSearch = c.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          c.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const categories = ['all', 'video', 'news', 'Trường học', 'Lớp học', 'Sự kiện'];
  const categoryLabels: Record<string, string> = {
    'all': 'Tất cả',
    'video': 'Video',
    'news': 'Bài viết',
    'Trường học': 'Trường học',
    'Lớp học': 'Lớp học',
    'Sự kiện': 'Sự kiện'
  };

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto pb-24 md:pb-8">
      <div className="mb-8">
        <motion.h1 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl md:text-5xl font-serif font-bold text-slate-900 tracking-tight mb-3"
        >
          Tổ Truyền Thông Haneul
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="text-slate-500 font-medium text-lg"
        >
          Cập nhật những tin tức và video mới nhất từ nhà trường và các lớp.
        </motion.p>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex flex-col md:flex-row gap-4 mb-10"
      >
        <div className="relative flex-1 group">
          <Search size={22} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
          <input 
            type="text" 
            placeholder="Tìm kiếm nội dung, tiêu đề..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3.5 bg-white shadow-sm border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 text-slate-800 transition-all font-medium"
          />
        </div>
        
        <div className="flex items-center gap-2 overflow-x-auto pb-2 py-1 md:pb-0 scrollbar-hide">
          <Filter size={20} className="text-slate-400 flex-shrink-0 mr-2 hidden md:block" />
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setFilterType(cat)}
              className={cn(
                "whitespace-nowrap px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300",
                filterType === cat 
                  ? "bg-slate-900 text-white shadow-md shadow-slate-900/20" 
                  : "bg-white text-slate-500 border border-slate-200 hover:bg-slate-50 hover:text-slate-800 shadow-sm"
              )}
            >
              {categoryLabels[cat]}
            </button>
          ))}
        </div>
      </motion.div>

      <motion.div 
        variants={{
          hidden: { opacity: 0 },
          show: { opacity: 1, transition: { staggerChildren: 0.1 } }
        }}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
      >
        {filteredContents.map(c => (
          <motion.div key={c.id} variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}>
            <ContentCard content={c} onOpenDetails={onOpenDetails} />
          </motion.div>
        ))}
      </motion.div>
      
      {filteredContents.length === 0 && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-32 flex flex-col items-center justify-center bg-white rounded-3xl border border-slate-100 shadow-sm"
        >
          <div className="w-24 h-24 mb-6 relative">
            <div className="absolute inset-0 bg-blue-100 rounded-full animate-ping opacity-50"></div>
            <div className="relative bg-blue-50 rounded-full w-full h-full flex items-center justify-center border-4 border-white shadow-md">
              <span className="text-4xl block transform rotate-12">✨</span>
            </div>
          </div>
          <h3 className="text-2xl font-serif font-bold text-slate-800 mb-2">Chưa có nội dung nào</h3>
          <p className="text-slate-500 font-medium">Ban giám đốc chưa đăng tải thông báo hay video nào. Hãy quay lại sau nhé!</p>
        </motion.div>
      )}
    </div>
  );
}
