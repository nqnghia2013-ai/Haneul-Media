import React from 'react';
import { motion } from 'motion/react';
import { useStore } from '../hooks/useStore';
import { ContentCard } from './ContentCard';
import { ContentItem } from '../types';

interface SavedContentsProps {
  onOpenDetails: (content: ContentItem) => void;
}

export function SavedContents({ onOpenDetails }: SavedContentsProps) {
  const { contents, savedContentIds } = useStore();
  
  const savedContents = contents.filter(c => savedContentIds.includes(c.id));

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto pb-24 md:pb-8">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 border-b border-slate-200 pb-6 flex items-center justify-between"
      >
        <div>
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-slate-900 tracking-tight mb-3">Nội dung đã lưu</h1>
          <p className="text-slate-500 font-medium text-lg">Xem lại bài viết và video yêu thích của bạn.</p>
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
        {savedContents.map(c => (
          <motion.div key={c.id} variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}>
            <ContentCard content={c} onOpenDetails={onOpenDetails} />
          </motion.div>
        ))}
      </motion.div>

      {savedContents.length === 0 && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-32 flex flex-col items-center justify-center bg-white rounded-3xl border border-slate-100 shadow-sm"
        >
          <div className="w-24 h-24 mb-6 relative">
            <div className="absolute inset-0 bg-yellow-100 rounded-full animate-ping opacity-50"></div>
            <div className="relative bg-yellow-50 rounded-full w-full h-full flex items-center justify-center border-4 border-white shadow-md">
              <span className="text-4xl block transform -rotate-12">🔖</span>
            </div>
          </div>
          <h3 className="text-2xl font-serif font-bold text-slate-800 mb-2">Chưa có nội dung đã lưu</h3>
          <p className="text-slate-500 font-medium max-w-md mx-auto">Nhấn biểu tượng Lưu trên bất kỳ bài viết hoặc video nào để đọc lại sau.</p>
        </motion.div>
      )}
    </div>
  );
}
