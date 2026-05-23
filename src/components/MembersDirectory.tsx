import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useStore } from '../hooks/useStore';
import { Member } from '../types';
import { X, Mail, Link as LinkIcon, Instagram, Facebook } from 'lucide-react';

export function MembersDirectory() {
  const { members } = useStore();
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);

  const groupedMembers = {
    'Haneul Director': members.filter(m => m.role === 'Haneul Director'),
    'Assistant Director': members.filter(m => m.role === 'Assistant Director'),
    'Media Member': members.filter(m => m.role === 'Media Member'),
  };

  const roleLabels = {
    'Haneul Director': 'Trưởng Ban',
    'Assistant Director': 'Phó Ban',
    'Media Member': 'Thành Viên',
  };

  const hasMembers = members.length > 0;

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto pb-24 md:pb-8 relative">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 border-b border-slate-200 pb-6"
      >
        <h1 className="text-4xl md:text-5xl font-serif font-bold text-slate-900 tracking-tight mb-3">Thành viên Haneul Media</h1>
        <p className="text-slate-500 font-medium text-lg">Đội ngũ đứng sau những thước phim và bản tin của trường.</p>
      </motion.div>

      {!hasMembers ? (
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-32 flex flex-col items-center justify-center bg-white rounded-3xl border border-slate-100 shadow-sm"
        >
          <div className="w-24 h-24 mb-6 relative">
            <div className="absolute inset-0 bg-blue-100 rounded-full animate-ping opacity-50"></div>
            <div className="relative bg-blue-50 rounded-full w-full h-full flex items-center justify-center border-4 border-white shadow-md">
              <span className="text-4xl block transform -rotate-12">👨‍💻</span>
            </div>
          </div>
          <h3 className="text-2xl font-serif font-bold text-slate-800 mb-2">Chưa có thành viên nào</h3>
          <p className="text-slate-500 font-medium">Danh sách thành viên hiện đang trống.</p>
        </motion.div>
      ) : (
        <div className="space-y-12">
          {(Object.keys(groupedMembers) as Array<keyof typeof groupedMembers>).map((role, index) => {
            const roleMembers = groupedMembers[role];
            if (roleMembers.length === 0) return null;

            return (
              <motion.section 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                key={role}
              >
                <h2 className="text-sm uppercase tracking-[0.2em] font-bold mb-6 flex items-center gap-4 text-blue-600">
                  <span className="w-12 h-1 bg-blue-600/20 block rounded-full">
                    <span className="w-4 h-full bg-blue-600 block rounded-full"></span>
                  </span>
                  {roleLabels[role]} ({roleMembers.length})
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {roleMembers.map((member, mIndex) => (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: (index * 0.1) + (mIndex * 0.05) }}
                      key={member.id} 
                      onClick={() => setSelectedMember(member)}
                      className="cursor-pointer bg-white border text-center md:text-left border-slate-100 rounded-3xl overflow-hidden group hover:border-slate-200 hover:shadow-xl transition-all duration-300 flex flex-col md:flex-row shadow-sm"
                    >
                      <div className="w-full md:w-2/5 aspect-square overflow-hidden bg-slate-100">
                        <img 
                          src={member.imageUrl} 
                          alt={member.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                        />
                      </div>
                      <div className="p-5 flex-1 relative flex flex-col justify-center items-center md:items-start">
                        <div className="bg-slate-50 text-slate-500 text-[10px] uppercase tracking-wider font-bold px-2.5 py-1 rounded-md border border-slate-200 mb-3 group-hover:bg-blue-50 group-hover:text-blue-600 group-hover:border-blue-100 transition-colors">
                          {roleLabels[member.role] || member.role}
                        </div>
                        <h3 className="font-serif font-bold text-xl text-slate-800 mb-2">{member.name}</h3>
                        <p className="text-slate-500 text-sm font-medium leading-relaxed line-clamp-3">
                          {member.bio}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.section>
            )
          })}
        </div>
      )}

      <AnimatePresence>
        {selectedMember && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedMember(null)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm cursor-pointer"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative w-full max-w-2xl bg-white rounded-[2rem] shadow-2xl overflow-hidden"
            >
              <div className="flex flex-col md:flex-row max-h-[85vh] overflow-y-auto">
                <div className="w-full md:w-2/5 shrink-0 relative bg-slate-100 aspect-square md:aspect-auto h-64 md:h-auto">
                  <img 
                    src={selectedMember.imageUrl} 
                    alt={selectedMember.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-60 md:hidden"></div>
                </div>
                <div className="p-6 md:p-8 flex-1 flex flex-col justify-center">
                  <button 
                    onClick={() => setSelectedMember(null)}
                    className="absolute top-4 right-4 p-2 bg-slate-100/80 md:bg-slate-100 text-slate-500 hover:text-slate-800 hover:bg-slate-200 rounded-full transition-colors backdrop-blur-md"
                  >
                    <X size={20} />
                  </button>
                  
                  <div className="mb-4 hidden md:block">
                    <span className="bg-blue-50 text-blue-600 border border-blue-100 text-xs uppercase tracking-wider font-bold px-3 py-1.5 rounded-lg inline-block">
                      {roleLabels[selectedMember.role] || selectedMember.role}
                    </span>
                  </div>
                  <div className="mb-4 block md:hidden absolute top-4 left-4 z-10">
                    <span className="bg-blue-500 text-white border border-blue-400 text-xs uppercase tracking-wider font-bold px-3 py-1.5 rounded-lg inline-block shadow-sm">
                      {roleLabels[selectedMember.role] || selectedMember.role}
                    </span>
                  </div>
                  
                  <h2 className="text-3xl md:text-4xl font-serif font-bold text-slate-900 mb-4">{selectedMember.name}</h2>
                  
                  <div className="prose prose-slate prose-p:leading-relaxed text-slate-600 mb-8 max-w-none">
                    <p className="whitespace-pre-wrap">{selectedMember.bio}</p>
                  </div>
                  
                  <div className="mt-auto border-t border-slate-100 pt-6">
                    <h4 className="text-sm font-bold text-slate-900 mb-3 uppercase tracking-wider">Liên hệ & Mạng xã hội</h4>
                    <div className="flex flex-wrap gap-3">
                      <button className="flex items-center gap-2 px-4 py-2 bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 rounded-xl transition-colors font-medium text-sm border border-slate-200">
                        <Mail size={16} /> Liên hệ Email
                      </button>
                      <button className="flex items-center gap-2 px-4 py-2 bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 rounded-xl transition-colors font-medium text-sm border border-slate-200">
                        <LinkIcon size={16} /> Portfolio
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
