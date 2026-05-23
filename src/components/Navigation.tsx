import React from 'react';
import { motion } from 'motion/react';
import { Home, Calendar, Users, Bookmark, Settings, Bell, LogIn, LogOut } from 'lucide-react';
import { useStore } from '../hooks/useStore';
import { cn } from '../lib/utils';
import { signInWithGoogle, logout } from '../lib/firebase';

interface NavigationProps {
  currentView: string;
  onChangeView: (view: string) => void;
  onToggleNotifications: () => void;
  unreadCount: number;
}

export function Navigation({ currentView, onChangeView, onToggleNotifications, unreadCount }: NavigationProps) {
  const { theme, toggleTheme, currentUser } = useStore();

  const navItems = [
    { id: 'feed', label: 'Bảng tin', icon: Home },
    { id: 'schedule', label: 'Lịch phát sóng', icon: Calendar },
    { id: 'members', label: 'Thành viên', icon: Users },
    { id: 'saved', label: 'Đã lưu', icon: Bookmark },
  ];

  if (currentUser?.role === 'haneul_director' || currentUser?.role === 'assistant_director') {
    navItems.push({ id: 'admin', label: 'Quản trị', icon: Settings });
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-t border-slate-200/60 shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.05)] md:relative md:border-t-0 md:border-r md:border-slate-200 md:shadow-none md:w-64 md:h-screen md:flex md:flex-col md:bg-white/50">
      <div className="hidden md:flex items-center gap-3 p-6 mb-4">
        <div className="w-12 h-12 rounded-full overflow-hidden shadow-sm border border-slate-200 bg-white p-1">
          <img src="/logo.png" alt="Haneul Media Logo" className="w-full h-full object-cover" onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="%233b82f6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="2.5" ry="2.5"/><path d="M15.54 11.48L10 8.5A1 1 0 0 0 8.5 9.38v5.24a1 1 0 0 0 1.5.88l5.54-2.98a1 1 0 0 0 0-1.76z"/></svg>';
          }} />
        </div>
        <h1 className="text-xl font-serif font-bold text-slate-800 tracking-tight">Haneul<span className="font-light text-blue-600">Media</span></h1>
      </div>

      <div className="flex md:flex-col justify-around md:justify-start flex-1 p-2 md:p-4 gap-2">
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onChangeView(item.id)}
              className={cn(
                "flex flex-col md:flex-row items-center gap-1 md:gap-3 p-2 md:px-4 md:py-3.5 rounded-2xl md:rounded-xl transition-all duration-300 relative group",
                isActive 
                  ? "text-blue-600 md:bg-blue-50/50" 
                  : "text-slate-400 hover:text-slate-700 md:hover:bg-slate-100"
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 bg-blue-50/80 rounded-2xl md:rounded-xl -z-10 hidden md:block"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              <Icon size={22} className={cn("transition-transform duration-300", isActive ? "stroke-[2.5] scale-110" : "stroke-[2] group-hover:scale-110")} />
              <span className="text-[10px] md:text-sm font-semibold tracking-wide">{item.label}</span>
            </button>
          )
        })}
      </div>

      <div className="hidden md:flex flex-col p-4 gap-2 mt-auto mb-4 border-t border-slate-200">
        <button
          onClick={onToggleNotifications}
          className="flex items-center gap-3 px-4 py-3.5 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors relative group"
        >
          <Bell size={22} className="stroke-[2] group-hover:scale-110 transition-transform" />
          <span className="text-sm font-semibold tracking-wide">Thông báo</span>
          {unreadCount > 0 && (
            <motion.span 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute right-4 top-3 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-lg shadow-red-500/40"
            >
              {unreadCount}
            </motion.span>
          )}
        </button>

        {currentUser ? (
          <div className="flex flex-col gap-1 border-t border-slate-200 pt-3 mt-1">
            <div className="flex items-center gap-3 px-3 py-2 rounded-xl mb-1">
              <div className="w-10 h-10 rounded-full bg-slate-100 overflow-hidden flex items-center justify-center font-bold text-slate-500 border border-slate-200">
                {currentUser.avatar ? <img src={currentUser.avatar} alt="Avatar" className="w-full h-full object-cover" /> : currentUser.name[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-800 truncate">{currentUser.name}</p>
                <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400 truncate">{currentUser.role.replace('_', ' ')}</p>
              </div>
            </div>
            <button
              onClick={logout}
              className="flex items-center gap-3 px-4 py-3.5 rounded-xl text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors relative group"
            >
              <LogOut size={22} className="stroke-[2] group-hover:scale-110 transition-transform" />
              <span className="text-sm font-semibold tracking-wide flex-1 text-left">Đăng xuất</span>
            </button>
          </div>
        ) : (
          <button
            onClick={signInWithGoogle}
            className="flex items-center gap-3 px-4 py-3.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-colors relative group shadow-sm hover:shadow-md mt-1"
          >
            <LogIn size={22} className="stroke-[2] group-hover:scale-110 transition-transform" />
            <span className="text-sm font-semibold tracking-wide flex-1 text-left">Đăng nhập</span>
          </button>
        )}
      </div>
    </nav>
  );
}
