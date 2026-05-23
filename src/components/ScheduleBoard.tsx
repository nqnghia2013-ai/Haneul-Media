import React from 'react';
import { motion } from 'motion/react';
import { Calendar as CalendarIcon, Clock, PlayCircle } from 'lucide-react';
import { format, parseISO, isBefore } from 'date-fns';
import { vi } from 'date-fns/locale';
import { useStore } from '../hooks/useStore';

export function ScheduleBoard() {
  const { schedules } = useStore();
  const now = new Date();

  const sortedSchedules = [...schedules].sort((a, b) => {
    const dateA = a.airDate || a.date || '';
    const dateB = b.airDate || b.date || '';
    return new Date(dateA).getTime() - new Date(dateB).getTime();
  });

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto pb-24 md:pb-8">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 border-b border-slate-200 pb-6"
      >
        <h1 className="text-4xl md:text-5xl font-serif font-bold text-slate-900 tracking-tight mb-3">Lịch phát sóng</h1>
        <p className="text-slate-500 font-medium text-lg">Đừng bỏ lỡ các video và sự kiện mới nhất từ Haneul Media.</p>
      </motion.div>

      <div className="space-y-4">
        {sortedSchedules.map((schedule, idx) => {
          const dateStr = schedule.airDate || schedule.date;
          if (!dateStr) return null;
          
          let parsedDate;
          try {
            parsedDate = parseISO(dateStr);
          } catch (e) {
            return null; // Invalid date
          }
          
          const getDurationMs = (duration: string) => {
            if (!duration) return 2 * 3600000; // default 2 hours
            const match = duration.match(/(\d+[\.,]?\d*)/);
            const num = match ? parseFloat(match[1].replace(',', '.')) : 2;
            const isMins = duration.toLowerCase().includes('phút') || duration.toLowerCase().includes('min');
            return num * (isMins ? 60000 : 3600000);
          };

          const durationMs = getDurationMs(schedule.duration);
          const endTime = new Date(parsedDate.getTime() + durationMs);
          
          let dynamicStatus = 'Sắp tới';
          let statusStyle = 'bg-blue-50 text-blue-600 border-blue-100 shadow-sm';
          let isPast = false;
          let isLive = false;

          if (isBefore(now, parsedDate)) {
            dynamicStatus = 'Sắp tới';
            statusStyle = 'bg-blue-50 text-blue-600 border-blue-100 shadow-sm';
          } else if (isBefore(now, endTime)) {
            dynamicStatus = 'Trực tiếp (LIVE)';
            statusStyle = 'bg-red-50 text-red-600 border-red-200 shadow-sm animate-pulse';
            isLive = true;
          } else {
            dynamicStatus = 'Đã phát sóng';
            statusStyle = 'bg-slate-100 text-slate-500 border-slate-200';
            isPast = true;
          }
          
          return (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              key={schedule.id}
              className={`p-6 rounded-3xl border transition-all duration-300 ${
                isPast 
                  ? 'bg-slate-50 border-slate-100 opacity-80 backdrop-blur-sm' 
                  : 'bg-white border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 relative overflow-hidden'
              }`}
            >
              {!isPast && (
                <div className={`absolute left-0 top-0 bottom-0 w-2 ${isLive ? 'bg-red-500' : 'bg-gradient-to-b from-blue-500 to-indigo-500'}`}></div>
              )}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex-1">
                   <div className="flex items-center gap-3 mb-3">
                     <span className={`text-[10px] uppercase tracking-wider font-bold px-2.5 py-1 rounded-md border inline-block ${statusStyle}`}>
                       {isLive && <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-600 mr-1.5 align-middle mb-0.5"></span>}
                       {dynamicStatus}
                     </span>
                   </div>
                   <h3 className={`font-serif text-xl font-bold mb-1 line-clamp-2 ${isPast ? 'text-slate-500' : 'text-slate-800'}`}>
                     {schedule.title}
                   </h3>
                </div>
                
                <div className="flex flex-col gap-2 min-w-[200px]">
                  <div className="flex items-center gap-2 text-sm text-slate-500 font-medium tracking-wide">
                    <CalendarIcon size={18} className={!isPast ? "text-blue-500" : ""} />
                    <span>{format(parsedDate, 'EEEE, dd MMMM yyyy', { locale: vi })}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-500 font-medium tracking-wide">
                    <Clock size={18} className={!isPast ? "text-indigo-500" : ""} />
                    <span>{format(parsedDate, 'HH:mm', { locale: vi })}</span>
                  </div>
                  {isPast && (
                    <button className="mt-3 flex items-center justify-center gap-2 w-full py-2.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 transition-colors shadow-sm">
                      <PlayCircle size={18} className="text-slate-500" /> Xem lại
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          )
        })}
        {sortedSchedules.length === 0 && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-32 flex flex-col items-center justify-center bg-white rounded-3xl border border-slate-100 shadow-sm"
          >
            <div className="w-24 h-24 mb-6 relative">
              <div className="absolute inset-0 bg-blue-100 rounded-full animate-ping opacity-50"></div>
              <div className="relative bg-blue-50 rounded-full w-full h-full flex items-center justify-center border-4 border-white shadow-md">
                <span className="text-4xl block transform rotate-12">🗓️</span>
              </div>
            </div>
            <h3 className="text-2xl font-serif font-bold text-slate-800 mb-2">Chưa có lịch phát sóng</h3>
            <p className="text-slate-500 font-medium">Ban giám đốc chưa lên lịch phát sóng nào. Hãy quay lại sau nhé!</p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
