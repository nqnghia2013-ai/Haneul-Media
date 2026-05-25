import React, { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { StoreProvider, useStore } from './hooks/useStore';
import { Navigation } from './components/Navigation';
import { Feed } from './components/Feed';
import { ContentDetails } from './components/ContentDetails';
import { MembersDirectory } from './components/MembersDirectory';
import { ScheduleBoard } from './components/ScheduleBoard';
import { AdminDashboard } from './components/AdminDashboard';
import { SavedContents } from './components/SavedContents';
import { NotificationPanel } from './components/NotificationPanel';
import { ContentItem } from './types';

function LoadingView() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-screen bg-slate-50">
      <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
    </div>
  );
}

function LoginView() {
  const { setCurrentUser } = useStore();
  return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-screen bg-slate-50 text-slate-800 p-4">
       <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full text-center border border-slate-100">
         <div className="w-20 h-20 mx-auto rounded-full overflow-hidden shadow-sm border border-slate-200 mb-6 flex items-center justify-center p-1 bg-white">
            <img src="/logo.png" alt="Haneul Media Logo" className="w-full h-full object-cover rounded-full" onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="%233b82f6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="2.5" ry="2.5"/><path d="M15.54 11.48L10 8.5A1 1 0 0 0 8.5 9.38v5.24a1 1 0 0 0 1.5.88l5.54-2.98a1 1 0 0 0 0-1.76z"/></svg>';
            }} />
         </div>
         <h1 className="text-3xl font-serif font-bold text-slate-900 tracking-tight mb-2">Haneul Media</h1>
         <p className="text-slate-500 font-medium mb-8">Vui lòng đăng nhập để tiếp tục sử dụng ứng dụng.</p>
         
         <button
            onClick={async () => {
              const { signInWithGoogle } = await import('./lib/firebase');
              signInWithGoogle();
            }}
            className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-md shadow-blue-600/20 active:scale-[0.98]"
         >
           <svg className="w-5 h-5 bg-white rounded-full p-1" viewBox="0 0 24 24" fill="currentColor">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
           </svg>
           Đăng nhập với Google
         </button>

         <button
            onClick={() => {
              setCurrentUser({
                id: 'guest_' + Math.random().toString(36).substring(2, 9),
                name: 'Khách',
                role: 'viewer'
              });
            }}
            className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-slate-100 text-slate-700/80 rounded-xl font-bold hover:bg-slate-200 hover:text-slate-900 transition-all active:scale-[0.98] mt-3 border border-slate-200/50"
         >
           Đăng nhập ẩn danh (Chỉ xem)
         </button>
       </div>
    </div>
  );
}

function AppContent() {
  const [currentView, setCurrentView] = useState('feed');
  const [activeContentId, setActiveContentId] = useState<string | null>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('contentId') || params.get('liveId') || null;
  });
  const [showNotifications, setShowNotifications] = useState(false);
  const { notifications, currentUser, authLoaded, contents } = useStore();
  
  if (!authLoaded) {
    return <LoadingView />;
  }

  if (!currentUser) {
    return <LoginView />;
  }
  
  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleOpenDetails = (content: ContentItem) => {
    setActiveContentId(content.id);
  };

  const renderView = () => {
    if (activeContentId) {
      const activeContent = contents.find(c => c.id === activeContentId);
      if (activeContent) {
        return <ContentDetails content={activeContent} onBack={() => setActiveContentId(null)} />;
      }
    }

    switch (currentView) {
      case 'feed': return <Feed onOpenDetails={handleOpenDetails} />;
      case 'schedule': return <ScheduleBoard />;
      case 'members': return <MembersDirectory />;
      case 'saved': return <SavedContents onOpenDetails={handleOpenDetails} />;
      case 'admin': return <AdminDashboard />;
      default: return <Feed onOpenDetails={handleOpenDetails} />;
    }
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-slate-50 text-slate-900 transition-colors duration-200 font-sans selection:bg-blue-200 selection:text-blue-900">
      <Navigation 
        currentView={activeContentId ? '' : currentView} 
        onChangeView={(v) => {
          setCurrentView(v);
          setActiveContentId(null);
        }} 
        onToggleNotifications={() => setShowNotifications(true)}
        unreadCount={unreadCount}
      />
      
      <main className="flex-1 w-full max-w-full overflow-x-hidden md:h-screen md:overflow-y-auto relative pt-16 md:pt-0 pb-20 md:pb-0">
        <header className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white/80 backdrop-blur-xl border-b border-slate-200 z-40 flex items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full overflow-hidden shadow-sm border border-slate-200 bg-white p-0.5">
              <img src="/logo.png" alt="Haneul Media" className="w-full h-full object-cover rounded-full" onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="%233b82f6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="2.5" ry="2.5"/><path d="M15.54 11.48L10 8.5A1 1 0 0 0 8.5 9.38v5.24a1 1 0 0 0 1.5.88l5.54-2.98a1 1 0 0 0 0-1.76z"/></svg>';
              }} />
            </div>
            <h1 className="text-lg font-serif font-bold text-slate-800 tracking-tight">Haneul</h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowNotifications(true)}
              className="p-2 text-slate-500 hover:bg-slate-100 rounded-full relative"
            >
              <svg className="w-5 h-5 stroke-[2]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>
              {unreadCount > 0 && (
                <span className="absolute right-1 top-1 bg-red-500 text-white text-[9px] font-bold px-1 rounded-full">{unreadCount}</span>
              )}
            </button>
            <button
              onClick={async () => {
                const { logout } = await import('./lib/firebase');
                logout();
              }}
              className="w-8 h-8 rounded-full overflow-hidden border border-slate-200"
            >
              {currentUser?.avatar ? (
                <img src={currentUser?.avatar} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-slate-100 text-sm font-bold flex items-center justify-center">{currentUser?.name[0]}</div>
              )}
            </button>
          </div>
        </header>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeContentId ? `details-${activeContentId}` : currentView}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="min-h-full"
          >
            {renderView()}
          </motion.div>
        </AnimatePresence>
      </main>

      {showNotifications && (
        <AnimatePresence>
          <motion.div 
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50"
            onClick={() => setShowNotifications(false)}
          />
          <NotificationPanel key="panel" onClose={() => setShowNotifications(false)} />
        </AnimatePresence>
      )}
    </div>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <AppContent />
    </StoreProvider>
  );
}
