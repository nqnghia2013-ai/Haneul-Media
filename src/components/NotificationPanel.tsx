import React from 'react';
import { motion } from 'motion/react';
import { X, Bell } from 'lucide-react';
import { useStore } from '../hooks/useStore';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { vi } from 'date-fns/locale';

interface NotificationPanelProps {
  onClose: () => void;
  key?: React.Key;
}

export function NotificationPanel({ onClose }: NotificationPanelProps) {
  const { notifications, markNotificationRead } = useStore();

  return (
    <motion.div 
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ type: "spring", bounce: 0, duration: 0.4 }}
      className="fixed inset-y-0 right-0 w-full md:w-96 bg-white border-l border-slate-200 shadow-2xl z-[60] flex flex-col"
    >
      <div className="flex items-center justify-between p-4 md:p-6 border-b border-slate-100 bg-slate-50/50">
        <h2 className="text-sm uppercase tracking-wider font-bold flex items-center gap-2 text-slate-800">
          <Bell size={18} className="text-blue-600" />
          Thông báo
        </h2>
        <button 
          onClick={onClose}
          className="p-2 text-slate-400 hover:text-slate-800 hover:bg-slate-200 rounded-xl transition-colors"
        >
          <X size={18} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto bg-slate-50">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4 border border-slate-200">
              <Bell size={24} className="text-slate-300" />
            </div>
            <p className="font-medium text-sm">Không có thông báo nào.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {notifications.map(n => (
              <div 
                key={n.id} 
                className={`p-5 transition-colors cursor-pointer hover:bg-slate-100 ${n.isRead ? 'opacity-70 bg-white' : 'bg-blue-50/50'}`}
                onClick={() => markNotificationRead(n.id)}
              >
                <div className="flex justify-between items-start mb-1">
                  <h4 className="font-serif font-bold text-slate-800">{n.title}</h4>
                  {!n.isRead && <span className="w-2.5 h-2.5 bg-blue-500 rounded-full flex-shrink-0 mt-1 shadow-sm"></span>}
                </div>
                <p className="text-sm text-slate-500 font-medium mb-2">{n.message}</p>
                <p className="text-[10px] text-slate-400 font-medium tracking-wide">
                  {n.createdAt ? formatDistanceToNow(parseISO(n.createdAt), { addSuffix: true, locale: vi }) : ''}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
