import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AppState, ContentItem, User, Comment, AppNotification, Member, BroadcastInfo } from '../types';
import { auth, db } from '../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, onSnapshot, query, setDoc, doc, updateDoc, arrayUnion } from 'firebase/firestore';

const initialState: AppState = {
  theme: 'light',
  currentUser: null,
  authLoaded: false,
  contents: [],
  members: [],
  schedules: [],
  notifications: [],
  savedContentIds: [],
};

interface StoreContextType extends AppState {
  toggleTheme: () => void;
  setCurrentUser: (user: User | null) => void;
  addComment: (contentId: string, comment: string) => void;
  toggleSaveContent: (contentId: string) => void;
  markNotificationRead: (id: string) => void;
  addNotification: (title: string, message: string) => void;
  addContent: (content: ContentItem) => Promise<void>;
  updateContent: (content: ContentItem) => Promise<void>;
  addMember: (member: Member) => Promise<void>;
  addSchedule: (schedule: BroadcastInfo) => Promise<void>;
  deleteContent: (id: string) => Promise<void>;
  deleteMember: (id: string) => Promise<void>;
  deleteSchedule: (id: string) => Promise<void>;
}

const playNotificationSound = () => {
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const playNote = (freq: number, startTime: number, duration: number) => {
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(freq, audioCtx.currentTime + startTime);
      
      gainNode.gain.setValueAtTime(0, audioCtx.currentTime + startTime);
      gainNode.gain.linearRampToValueAtTime(0.1, audioCtx.currentTime + startTime + 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + startTime + duration);
      
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      oscillator.start(audioCtx.currentTime + startTime);
      oscillator.stop(audioCtx.currentTime + startTime + duration);
    };
    
    playNote(523.25, 0, 0.2); // C5
    playNote(659.25, 0.15, 0.4); // E5
  } catch (e) {
    // Ignore audio errors
  }
};

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem('haneul_state_v2');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          ...initialState,
          theme: parsed.theme || 'light',
          savedContentIds: parsed.savedContentIds || [],
          notifications: parsed.notifications || []
        };
      } catch (e) {
        return initialState;
      }
    }
    return initialState;
  });

  useEffect(() => {
    localStorage.setItem('haneul_state_v2', JSON.stringify({
      theme: state.theme,
      savedContentIds: state.savedContentIds,
      notifications: state.notifications
    }));
    if (state.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    // Request notification permission if it hasn't been requested
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        // Option to request immediately or wait for user interaction. 
        // We will try requesting immediately, modern browsers may ignore if not interactive.
        Notification.requestPermission().catch(() => {});
      }
    }
  }, [state.theme, state.savedContentIds, state.notifications]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        let role = 'viewer';
        if (firebaseUser.email === 'nqnghia2013@gmail.com') {
          role = 'haneul_director'; // or admin
        }
        
        setState(prev => ({
          ...prev,
          authLoaded: true,
          currentUser: {
            id: firebaseUser.uid,
            name: firebaseUser.displayName || 'Người dùng',
            role: role,
            avatar: firebaseUser.photoURL || undefined
          }
        }));
      } else {
        setState(prev => ({ ...prev, authLoaded: true, currentUser: null, contents: [], members: [], schedules: [] }));
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!state.currentUser) return;
    
    let isInitialContentsLoad = true;
    
    const unsubscribeContents = onSnapshot(collection(db, 'contents'), (snapshot) => {
      const contentsData: ContentItem[] = [];
      snapshot.forEach(doc => contentsData.push({ id: doc.id, ...doc.data() } as ContentItem));
      // Sort by createdAt descending
      contentsData.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      if (!isInitialContentsLoad) {
        snapshot.docChanges().forEach(change => {
          if (change.type === 'added') {
            const data = change.doc.data();
            if (data.authorId !== state.currentUser?.id) {
              const title = 'Bài viết mới';
              const message = `"${data.title}" vừa được đăng tải!`;
              const newNotif: AppNotification = {
                id: Math.random().toString(36).substr(2, 9),
                title,
                message,
                isRead: false,
                createdAt: new Date().toISOString(),
              };
              setState(prev => ({ ...prev, notifications: [newNotif, ...prev.notifications] }));
              
              playNotificationSound();
              
              if (typeof window !== 'undefined' && 'Notification' in window) {
                if (Notification.permission === 'granted') {
                  new Notification(title, { body: message });
                } else if (Notification.permission !== 'denied') {
                  Notification.requestPermission().then(permission => {
                    if (permission === 'granted') {
                      new Notification(title, { body: message });
                    }
                  });
                }
              }
            }
          }
        });
      }
      isInitialContentsLoad = false;
      
      setState(prev => ({ ...prev, contents: contentsData }));
    }, (error) => {
      console.error("Error fetching contents: ", error);
    });

    const unsubscribeMembers = onSnapshot(collection(db, 'members'), (snapshot) => {
      const membersData: Member[] = [];
      snapshot.forEach(doc => membersData.push({ id: doc.id, ...doc.data() } as Member));
      setState(prev => ({ ...prev, members: membersData }));
    }, (error) => {
      console.error("Error fetching members: ", error);
    });

    const unsubscribeSchedules = onSnapshot(collection(db, 'schedules'), (snapshot) => {
      const schedulesData: BroadcastInfo[] = [];
      snapshot.forEach(doc => schedulesData.push({ id: doc.id, ...doc.data() } as BroadcastInfo));
      setState(prev => ({ ...prev, schedules: schedulesData }));
    }, (error) => {
      console.error("Error fetching schedules: ", error);
    });

    return () => {
      unsubscribeContents();
      unsubscribeMembers();
      unsubscribeSchedules();
    };
  }, [state.currentUser?.id]);

  const toggleTheme = () => {
    setState(prev => ({ ...prev, theme: prev.theme === 'light' ? 'dark' : 'light' }));
  };

  const setCurrentUser = (user: User | null) => {
    setState(prev => ({ ...prev, currentUser: user }));
  };

  const addComment = async (contentId: string, content: string) => {
    if (!state.currentUser) return;
    const newComment: Comment = {
      id: Math.random().toString(36).substr(2, 9),
      userId: state.currentUser.id,
      userName: state.currentUser.name,
      userAvatar: state.currentUser.avatar,
      content,
      createdAt: new Date().toISOString(),
    };

    // Optimistically update UI
    setState(prev => ({
      ...prev,
      contents: prev.contents.map(c => {
        if (c.id === contentId) {
          return { ...c, comments: [...(c.comments || []), newComment] };
        }
        return c;
      })
    }));

    try {
      const docRef = doc(db, 'contents', contentId);
      await updateDoc(docRef, {
        comments: arrayUnion(newComment)
      });
    } catch (error) {
      console.error("Error adding comment: ", error);
      alert("Không thể thêm bình luận. Vui lòng thử lại.");
    }
  };

  const deleteContent = async (id: string) => {
    try {
      const { deleteDoc } = await import('firebase/firestore');
      await deleteDoc(doc(db, 'contents', id));
    } catch (e) {
      console.error("Error deleting content: ", e);
      alert("Lỗi khi xóa nội dung");
    }
  };

  const deleteMember = async (id: string) => {
    try {
      const { deleteDoc } = await import('firebase/firestore');
      await deleteDoc(doc(db, 'members', id));
    } catch (e) {
      console.error("Error deleting member: ", e);
      alert("Lỗi khi xóa thành viên");
    }
  };

  const deleteSchedule = async (id: string) => {
    try {
      const { deleteDoc } = await import('firebase/firestore');
      await deleteDoc(doc(db, 'schedules', id));
    } catch (e) {
      console.error("Error deleting schedule: ", e);
      alert("Lỗi khi xóa lịch");
    }
  };

  const toggleSaveContent = (contentId: string) => {
    setState(prev => {
      const isSaved = prev.savedContentIds.includes(contentId);
      return {
        ...prev,
        savedContentIds: isSaved 
          ? prev.savedContentIds.filter(id => id !== contentId)
          : [...prev.savedContentIds, contentId]
      };
    });
  };

  const markNotificationRead = (id: string) => {
    setState(prev => ({
      ...prev,
      notifications: prev.notifications.map(n => n.id === id ? { ...n, isRead: true } : n)
    }));
  };

  const addNotification = (title: string, message: string) => {
    const newNotif: AppNotification = {
      id: Math.random().toString(36).substr(2, 9),
      title,
      message,
      isRead: false,
      createdAt: new Date().toISOString(),
    };
    setState(prev => ({ ...prev, notifications: [newNotif, ...prev.notifications] }));
    
    playNotificationSound();
    
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        new Notification(title, { body: message });
      } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then(permission => {
          if (permission === 'granted') {
            new Notification(title, { body: message });
          }
        });
      }
    }
  };

  const addContent = async (content: ContentItem) => {
    try {
      const cleanContent = Object.fromEntries(Object.entries(content).filter(([_, v]) => v !== undefined));
      await setDoc(doc(db, 'contents', content.id), cleanContent);
      /* Only local notification needed since others will get it via snapshot, but wait...
         Snapshot triggers locally too. We can trigger local notification when another added. */
      addNotification('Bài viết mới', `"${content.title}" vừa được đăng tải!`);
    } catch (e) {
      console.error("Error adding content: ", e);
      alert("Lỗi khi thêm nội dung");
    }
  };

  const updateContent = async (content: ContentItem) => {
    try {
      const cleanContent = Object.fromEntries(Object.entries(content).filter(([_, v]) => v !== undefined));
      await updateDoc(doc(db, 'contents', content.id), cleanContent);
    } catch (e) {
      console.error("Error updating content: ", e);
      alert("Lỗi khi cập nhật nội dung");
    }
  };

  const addMember = async (member: Member) => {
     try {
       await setDoc(doc(db, 'members', member.id), member);
     } catch (e) {
       console.error("Error adding member: ", e);
       alert("Lỗi khi thêm thành viên");
     }
  };

  const addSchedule = async (schedule: BroadcastInfo) => {
     try {
       await setDoc(doc(db, 'schedules', schedule.id), schedule);
     } catch (e) {
       console.error("Error adding schedule: ", e);
       alert("Lỗi khi thêm lịch phát sóng");
     }
  };

  return (
    <StoreContext.Provider value={{
      ...state,
      toggleTheme,
      setCurrentUser,
      addComment,
      toggleSaveContent,
      markNotificationRead,
      addNotification,
      addContent,
      updateContent,
      addMember,
      addSchedule,
      deleteContent,
      deleteMember,
      deleteSchedule
    }}>
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (context === undefined) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};
