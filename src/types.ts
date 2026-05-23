export type Role = 'viewer' | 'media_member' | 'assistant_director' | 'haneul_director';

export interface User {
  id: string;
  name: string;
  role: Role;
  avatar?: string;
}

export interface Member {
  id: string;
  name: string;
  role: 'Haneul Director' | 'Assistant Director' | 'Media Member';
  bio: string;
  imageUrl: string;
}

export interface Comment {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  content: string;
  createdAt: string;
}

export interface ContentItem {
  id: string;
  title: string;
  description: string;
  type: 'news' | 'video';
  category: 'Trường học' | 'Lớp học' | 'Giải trí' | 'Sự kiện' | 'Phỏng vấn';
  thumbnailUrl: string;
  videoUrl?: string; // If type is video
  content?: string; // If type is news
  authorId: string;
  authorName?: string; // Custom author name when posting
  status?: 'published' | 'upcoming' | 'live'; // Status of the content
  createdAt: string;
  comments: Comment[];
  isSaved?: boolean; // For offline viewing
}

export interface BroadcastInfo {
  id: string;
  videoId?: string;
  title: string;
  airDate?: string; // ISO string
  date?: string;
  duration?: string;
  status?: string;
  type?: string;
  description?: string;
  members?: string[];
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  link?: string;
}

export interface AppState {
  theme: 'light' | 'dark';
  currentUser: User | null;
  authLoaded: boolean;
  contents: ContentItem[];
  members: Member[];
  schedules: BroadcastInfo[];
  notifications: AppNotification[];
  savedContentIds: string[];
}
