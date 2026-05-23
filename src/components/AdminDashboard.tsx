import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Download, FileText, FileSpreadsheet, Plus, AlertCircle, Users, Calendar as CalendarIcon, X, Trash2, Edit2 } from 'lucide-react';
import { useStore } from '../hooks/useStore';
import { ContentItem } from '../types';
import { compressImage } from '../lib/utils';

export function AdminDashboard() {
  const { currentUser, contents, members, schedules, addContent, updateContent, addMember, addSchedule, deleteContent, deleteMember, deleteSchedule } = useStore();
  const [exportStatus, setExportStatus] = useState<string | null>(null);
  
  const [showContentModal, setShowContentModal] = useState(false);
  const [editingContentId, setEditingContentId] = useState<string | null>(null);
  const [contentForm, setContentForm] = useState({ 
    title: '', description: '', content: '', type: 'news', category: 'Tin Tức', 
    authorId: currentUser?.id || '', authorName: '', thumbnailUrl: '', videoUrl: '', status: 'published' as 'published' | 'upcoming' | 'live' 
  });
  
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [memberForm, setMemberForm] = useState({ name: '', role: '', bio: '', imageUrl: '' });

  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleForm, setScheduleForm] = useState({ title: '', date: '', duration: '', status: 'Sắp tới', type: 'Live', description: '' });

  const [deleteConfirm, setDeleteConfirm] = useState<{ type: 'content' | 'member' | 'schedule', id: string, name: string } | null>(null);

  const performDelete = () => {
    if (!deleteConfirm) return;
    if (deleteConfirm.type === 'content') deleteContent(deleteConfirm.id);
    if (deleteConfirm.type === 'member') deleteMember(deleteConfirm.id);
    if (deleteConfirm.type === 'schedule') deleteSchedule(deleteConfirm.id);
    setDeleteConfirm(null);
  };

  const openEditContent = (c: ContentItem) => {
    setEditingContentId(c.id);
    setContentForm({
      title: c.title,
      description: c.description,
      content: c.content || '',
      type: c.type,
      category: c.category as any,
      authorId: c.authorId,
      authorName: c.authorName || '',
      thumbnailUrl: c.thumbnailUrl,
      videoUrl: c.videoUrl || '',
      status: c.status || 'published'
    });
    setShowContentModal(true);
  };

  if (currentUser?.role !== 'haneul_director' && currentUser?.role !== 'assistant_director') {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center px-4">
        <AlertCircle size={48} className="text-red-500 mb-4" />
        <h2 className="text-2xl font-serif text-slate-800 mb-2">Truy cập bị từ chối</h2>
        <p className="text-slate-500 text-sm font-medium">Bạn không có quyền truy cập vào khu vực quản trị.</p>
      </div>
    );
  }

  const exportCSV = () => {
    try {
      const headers = ['ID', 'Title', 'Type', 'Category', 'Author', 'Created At'];
      const rows = contents.map(c => [
        c.id, 
        `"${c.title.replace(/"/g, '""')}"`, 
        c.type, 
        c.category, 
        members.find(m => m.id === c.authorId)?.name || c.authorId,
        c.createdAt
      ]);
      
      const csvContent = "data:text/csv;charset=utf-8,\uFEFF" 
        + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
        
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `haneul_report_${new Date().getTime()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setExportStatus('Đã xuất file CSV thành công!');
      setTimeout(() => setExportStatus(null), 3000);
    } catch (e) {
      setExportStatus('Lỗi khi xuất file CSV.');
    }
  };

  const exportPDF = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const html = `
      <html>
        <head>
          <title>Haneul Media Report</title>
          <style>
            body { font-family: sans-serif; padding: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
          </style>
        </head>
        <body>
          <h2>Báo Cáo Nội Dung - Haneul Media</h2>
          <p>Ngày xuất: ${new Date().toLocaleDateString('vi-VN')}</p>
          <table>
            <thead>
              <tr>
                <th>Tiêu đề</th>
                <th>Loại</th>
                <th>Chuyên mục</th>
                <th>Ngày đăng</th>
                <th>Bình luận</th>
              </tr>
            </thead>
            <tbody>
              ${contents.map(c => `
                <tr>
                  <td>${c.title}</td>
                  <td>${c.type}</td>
                  <td>${c.category}</td>
                  <td>${new Date(c.createdAt).toLocaleDateString('vi-VN')}</td>
                  <td>${c.comments.length}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <script>
            window.onload = () => { window.print(); };
          </script>
        </body>
      </html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
  };

  const handleCreateContent = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingContentId) {
      const existing = contents.find(c => c.id === editingContentId);
      if (existing) {
        updateContent({
          ...existing,
          ...contentForm,
          type: contentForm.type as 'video' | 'news',
        });
      }
    } else {
      const newContent: ContentItem = {
        id: Math.random().toString(36).substr(2, 9),
        ...contentForm,
        type: contentForm.type as 'video' | 'news',
        viewCount: 0,
        createdAt: new Date().toISOString(),
        comments: []
      };
      addContent(newContent);
    }
    setShowContentModal(false);
    setEditingContentId(null);
    setContentForm({ 
      title: '', description: '', content: '', type: 'news', category: 'Tin Tức', 
      authorId: currentUser?.id || '', authorName: '', thumbnailUrl: '', videoUrl: '', status: 'published' 
    });
  };

  const handleCreateMember = (e: React.FormEvent) => {
    e.preventDefault();
    addMember({
      id: Math.random().toString(36).substr(2, 9),
      ...memberForm
    });
    setShowMemberModal(false);
    setMemberForm({ name: '', role: '', bio: '', imageUrl: '' });
  };

  const handleCreateSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    addSchedule({
      id: Math.random().toString(36).substr(2, 9),
      title: scheduleForm.title,
      date: scheduleForm.date,
      duration: scheduleForm.duration,
      status: scheduleForm.status as 'Sắp tới' | 'Trực tiếp' | 'Đã phát',
      type: scheduleForm.type,
      description: scheduleForm.description,
      members: [currentUser?.id || '']
    });
    setShowScheduleModal(false);
    setScheduleForm({ title: '', date: '', duration: '', status: 'Sắp tới', type: 'Live', description: '' });
  };

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto pb-24 md:pb-8">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 border-b border-slate-200 pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-serif font-bold text-slate-900 mb-2">Bảng Quản Trị</h1>
          <p className="text-slate-500 font-medium text-sm">Xin chào, {currentUser?.name} <span className="opacity-70">({currentUser?.role})</span></p>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
         <motion.div 
           initial={{ opacity: 0, x: -20 }}
           animate={{ opacity: 1, x: 0 }}
           transition={{ delay: 0.1 }}
           className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm"
         >
           <h3 className="font-serif font-bold text-xl mb-2 flex items-center gap-2 text-slate-800">
             <Download size={22} className="text-blue-500" /> Xuất Báo Cáo
           </h3>
           <p className="text-sm font-medium text-slate-500 mb-6">Trích xuất dữ liệu bài viết và video để quản lý.</p>
           
           <div className="flex gap-3">
             <button 
                onClick={exportCSV}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors font-bold text-sm text-slate-700 shadow-sm"
              >
               <FileSpreadsheet size={18} /> CSV
             </button>
             <button 
                onClick={exportPDF}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 rounded-xl transition-colors font-bold text-sm shadow-sm"
              >
               <FileText size={18} /> PDF
             </button>
           </div>
           {exportStatus && <p className="text-sm font-medium text-emerald-600 mt-4">{exportStatus}</p>}
         </motion.div>

         <motion.div 
           initial={{ opacity: 0, x: 20 }}
           animate={{ opacity: 1, x: 0 }}
           transition={{ delay: 0.2 }}
           className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col justify-between"
         >
           <div>
             <h3 className="font-serif font-bold text-xl mb-2 flex items-center gap-2 text-slate-800">
               <Plus size={22} className="text-purple-500" /> Cập Nhật Hệ Thống
             </h3>
             <p className="text-sm font-medium text-slate-500 mb-6">Đăng tải nội dung, thành viên, và lịch phát sóng.</p>
           </div>
           <div className="flex flex-col gap-2">
             <button onClick={() => setShowContentModal(true)} className="w-full flex items-center justify-center gap-2 py-2 bg-slate-900 hover:bg-slate-800 rounded-xl transition-colors font-bold text-sm text-white shadow-md">
               <Plus size={16} /> Tạo nội dung
             </button>
             <div className="flex gap-2">
               <button onClick={() => setShowMemberModal(true)} className="flex-1 flex items-center justify-center gap-2 py-2 bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 rounded-xl transition-colors font-bold text-sm shadow-sm">
                 <Users size={16} /> Thêm TV
               </button>
               <button onClick={() => setShowScheduleModal(true)} className="flex-1 flex items-center justify-center gap-2 py-2 bg-orange-50 text-orange-700 border border-orange-200 hover:bg-orange-100 rounded-xl transition-colors font-bold text-sm shadow-sm">
                 <CalendarIcon size={16} /> Lịch diễn
               </button>
             </div>
           </div>
         </motion.div>
      </div>
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm"
      >
        <div className="p-5 md:p-6 border-b border-slate-100 bg-slate-50/50">
          <h3 className="font-bold text-slate-800 text-lg">Quản lý nội dung ({contents.length})</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left whitespace-nowrap">
            <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 text-xs uppercase tracking-wider font-bold">
              <tr>
                <th className="px-5 py-4">Tiêu đề</th>
                <th className="px-5 py-4">Loại</th>
                <th className="px-5 py-4">Bình luận</th>
                <th className="px-5 py-4">Ngày đăng</th>
                <th className="px-5 py-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm font-medium text-slate-700">
              {contents.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-slate-500">
                    Chưa có nội dung nào
                  </td>
                </tr>
              ) : contents.map(c => (
                <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-4 truncate max-w-[150px] md:max-w-[250px] text-slate-900">{c.title}</td>
                  <td className="px-5 py-4">
                    <span className={`px-2.5 py-1 rounded-md text-[10px] uppercase tracking-wider font-bold ${c.type === 'video' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
                      {c.type}
                    </span>
                  </td>
                  <td className="px-5 py-4">{(c.comments || []).length}</td>
                  <td className="px-5 py-4 text-slate-500">
                    {c.createdAt ? new Date(c.createdAt).toLocaleDateString('vi-VN') : ''}
                  </td>
                  <td className="px-5 py-4 text-right flex justify-end gap-2">
                    <button onClick={() => openEditContent(c)} className="text-blue-500 hover:text-blue-700 p-2 rounded-lg hover:bg-blue-50 transition-colors">
                      <Edit2 size={16} />
                    </button>
                    <button onClick={() => setDeleteConfirm({ type: 'content', id: c.id, name: c.title })} className="text-red-500 hover:text-red-700 p-2 rounded-lg hover:bg-red-50 transition-colors">
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm"
        >
          <div className="p-5 md:p-6 border-b border-slate-100 bg-slate-50/50">
            <h3 className="font-bold text-slate-800 text-lg">Quản lý thành viên ({members.length})</h3>
          </div>
          <div className="overflow-x-auto max-h-[300px] overflow-y-auto">
            <table className="w-full text-left whitespace-nowrap">
              <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 text-xs uppercase tracking-wider font-bold sticky top-0">
                <tr>
                  <th className="px-5 py-4">Tên</th>
                  <th className="px-5 py-4">Vai trò</th>
                  <th className="px-5 py-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm font-medium text-slate-700">
                {members.length === 0 ? (
                  <tr><td colSpan={3} className="px-5 py-8 text-center text-slate-500">Chưa có thành viên</td></tr>
                ) : members.map(m => (
                  <tr key={m.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3 truncate max-w-[150px] text-slate-900 flex items-center gap-2">
                       {m.imageUrl ? <img src={m.imageUrl} alt="" className="w-6 h-6 rounded-full object-cover" /> : null}
                       {m.name}
                    </td>
                    <td className="px-5 py-3 text-slate-500">{m.role}</td>
                    <td className="px-5 py-3 text-right">
                      <button onClick={() => setDeleteConfirm({ type: 'member', id: m.id, name: m.name })} className="text-red-500 hover:text-red-700 p-1.5 rounded-lg hover:bg-red-50 transition-colors">
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm"
        >
          <div className="p-5 md:p-6 border-b border-slate-100 bg-slate-50/50">
            <h3 className="font-bold text-slate-800 text-lg">Quản lý lịch diễn ({schedules.length})</h3>
          </div>
          <div className="overflow-x-auto max-h-[300px] overflow-y-auto">
            <table className="w-full text-left whitespace-nowrap">
              <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 text-xs uppercase tracking-wider font-bold sticky top-0">
                <tr>
                  <th className="px-5 py-4">Sự kiện</th>
                  <th className="px-5 py-4">Ngày</th>
                  <th className="px-5 py-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm font-medium text-slate-700">
                {schedules.length === 0 ? (
                  <tr><td colSpan={3} className="px-5 py-8 text-center text-slate-500">Chưa có lịch diễn</td></tr>
                ) : schedules.map(s => (
                  <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3 truncate max-w-[150px] text-slate-900">{s.title}</td>
                    <td className="px-5 py-3 text-slate-500">{new Date(s.date).toLocaleDateString('vi-VN')}</td>
                    <td className="px-5 py-3 text-right">
                      <button onClick={() => setDeleteConfirm({ type: 'schedule', id: s.id, name: s.title })} className="text-red-500 hover:text-red-700 p-1.5 rounded-lg hover:bg-red-50 transition-colors">
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showContentModal && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl">
              <div className="flex items-center justify-between p-6 border-b border-slate-100">
                <h2 className="text-xl font-bold font-serif text-slate-800">{editingContentId ? 'Chỉnh sửa nội dung' : 'Tạo nội dung mới'}</h2>
                <button onClick={() => setShowContentModal(false)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl"><X size={20}/></button>
              </div>
              <div className="p-6 overflow-y-auto flex-1">
                <form id="contentForm" onSubmit={handleCreateContent} className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Tiêu đề</label>
                    <input required type="text" className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500" value={contentForm.title} onChange={e => setContentForm({...contentForm, title: e.target.value})} />
                  </div>
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <label className="block text-sm font-bold text-slate-700 mb-1">Loại</label>
                      <select className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500" value={contentForm.type} onChange={e => setContentForm({...contentForm, type: e.target.value})}>
                        <option value="news">Tin tức</option>
                        <option value="video">Video</option>
                      </select>
                    </div>
                    <div className="flex-1">
                      <label className="block text-sm font-bold text-slate-700 mb-1">Trạng thái</label>
                      <select className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500" value={contentForm.status} onChange={e => setContentForm({...contentForm, status: e.target.value as any})}>
                        <option value="published">Đã phát sóng</option>
                        <option value="upcoming">Chưa phát sóng</option>
                        <option value="live">Đang trực tiếp (Live)</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <label className="block text-sm font-bold text-slate-700 mb-1">Chuyên mục</label>
                      <input required type="text" className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500" value={contentForm.category} onChange={e => setContentForm({...contentForm, category: e.target.value})} />
                    </div>
                    <div className="flex-1">
                      <label className="block text-sm font-bold text-slate-700 mb-1">Người đăng</label>
                      <input type="text" placeholder="Tên để hiển thị" className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500" value={contentForm.authorName} onChange={e => setContentForm({...contentForm, authorName: e.target.value})} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Ảnh bìa</label>
                    <div className="flex flex-col gap-2">
                       <input type="url" placeholder="Hoặc nhập URL ảnh" className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 mb-2" value={contentForm.thumbnailUrl} onChange={e => setContentForm({...contentForm, thumbnailUrl: e.target.value})} />
                       <input 
                         type="file" 
                         accept="image/*" 
                         className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer" 
                         onChange={async (e) => {
                           const file = e.target.files?.[0];
                           if (file) {
                             try {
                               const compressedBase64 = await compressImage(file, 0.7);
                               setContentForm({...contentForm, thumbnailUrl: compressedBase64});
                             } catch (error) {
                               console.error("Compression failed", error);
                             }
                           }
                         }} 
                       />
                       {contentForm.thumbnailUrl && (
                         <div className="mt-2 aspect-video w-32 bg-slate-100 rounded-lg overflow-hidden border border-slate-200">
                           <img src={contentForm.thumbnailUrl} className="w-full h-full object-cover" alt="Preview" />
                         </div>
                       )}
                    </div>
                  </div>
                  {contentForm.type === 'video' && (
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1">URL Video</label>
                      <input required={contentForm.status === 'published'} type="url" className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500" value={contentForm.videoUrl} onChange={e => setContentForm({...contentForm, videoUrl: e.target.value})} />
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Mô tả ngắn</label>
                    <textarea required className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 h-20" value={contentForm.description} onChange={e => setContentForm({...contentForm, description: e.target.value})} />
                  </div>
                  {contentForm.type === 'news' && (
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1">Nội dung chi tiết</label>
                      <textarea required={contentForm.status === 'published'} className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 h-32" value={contentForm.content} onChange={e => setContentForm({...contentForm, content: e.target.value})} />
                    </div>
                  )}
                </form>
              </div>
              <div className="p-6 border-t border-slate-100 bg-slate-50 rounded-b-3xl flex justify-end gap-3">
                <button onClick={() => { setShowContentModal(false); setEditingContentId(null); }} className="px-4 py-2 font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50">Hủy</button>
                <button type="submit" form="contentForm" className="px-6 py-2 font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 shadow-sm">{editingContentId ? 'Lưu thay đổi' : 'Đăng ngay'}</button>
              </div>
            </motion.div>
          </div>
        )}

        {showMemberModal && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white rounded-3xl w-full max-w-md shadow-2xl">
              <div className="flex items-center justify-between p-6 border-b border-slate-100">
                <h2 className="text-xl font-bold font-serif text-slate-800">Thêm thành viên</h2>
                <button onClick={() => setShowMemberModal(false)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl"><X size={20}/></button>
              </div>
              <div className="p-6">
                <form id="memberForm" onSubmit={handleCreateMember} className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Tên</label>
                    <input required type="text" className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500" value={memberForm.name} onChange={e => setMemberForm({...memberForm, name: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Vai trò</label>
                    <input required type="text" className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500" value={memberForm.role} onChange={e => setMemberForm({...memberForm, role: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Ảnh Avatar (File hoặc URL)</label>
                    <div className="flex flex-col gap-2">
                       <input type="url" placeholder="URL ảnh (nếu có)" className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500" value={memberForm.imageUrl} onChange={e => setMemberForm({...memberForm, imageUrl: e.target.value})} />
                       <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-slate-500">Hoặc tải lên từ máy:</span>
                          <input type="file" accept="image/*" className="text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100" onChange={async (e) => {
                             const file = e.target.files?.[0];
                             if (file) {
                                try {
                                  const compressedBase64 = await compressImage(file, 0.5);
                                  setMemberForm({...memberForm, imageUrl: compressedBase64});
                                } catch(error) {
                                  console.error("Image compression error", error);
                                }
                             }
                          }} />
                       </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Mô tả giới thiệu (Bio)</label>
                    <textarea required className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 h-20" value={memberForm.bio} onChange={e => setMemberForm({...memberForm, bio: e.target.value})} />
                  </div>
                </form>
              </div>
              <div className="p-6 border-t border-slate-100 bg-slate-50 rounded-b-3xl flex justify-end gap-3">
                <button onClick={() => setShowMemberModal(false)} className="px-4 py-2 font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50">Hủy</button>
                <button type="submit" form="memberForm" className="px-6 py-2 font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 shadow-sm">Thêm TV</button>
              </div>
            </motion.div>
          </div>
        )}

        {showScheduleModal && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white rounded-3xl w-full max-w-md shadow-2xl">
              <div className="flex items-center justify-between p-6 border-b border-slate-100">
                <h2 className="text-xl font-bold font-serif text-slate-800">Thêm lịch phát sóng</h2>
                <button onClick={() => setShowScheduleModal(false)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl"><X size={20}/></button>
              </div>
              <div className="p-6">
                <form id="scheduleForm" onSubmit={handleCreateSchedule} className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Tên lịch trình</label>
                    <input required type="text" className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500" value={scheduleForm.title} onChange={e => setScheduleForm({...scheduleForm, title: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Thời gian phát sóng</label>
                    <input required type="datetime-local" className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500" value={scheduleForm.date} onChange={e => setScheduleForm({...scheduleForm, date: e.target.value})} />
                  </div>
                  <div className="flex gap-4">
                     <div className="flex-1">
                      <label className="block text-sm font-bold text-slate-700 mb-1">Loại</label>
                      <input required type="text" className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500" value={scheduleForm.type} onChange={e => setScheduleForm({...scheduleForm, type: e.target.value})} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Thời lượng (VD: 2 giờ)</label>
                    <input required type="text" className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500" value={scheduleForm.duration} onChange={e => setScheduleForm({...scheduleForm, duration: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Mô tả (Tùy chọn)</label>
                    <textarea className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 h-20" value={scheduleForm.description} onChange={e => setScheduleForm({...scheduleForm, description: e.target.value})} />
                  </div>
                </form>
              </div>
              <div className="p-6 border-t border-slate-100 bg-slate-50 rounded-b-3xl flex justify-end gap-3">
                <button onClick={() => setShowScheduleModal(false)} className="px-4 py-2 font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50">Hủy</button>
                <button type="submit" form="scheduleForm" className="px-6 py-2 font-bold text-white bg-orange-600 rounded-xl hover:bg-orange-700 shadow-sm">Lên lịch</button>
              </div>
            </motion.div>
          </div>
        )}

        {deleteConfirm && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden">
              <div className="p-6">
                 <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-red-600 mb-4">
                    <AlertCircle size={24} className="stroke-[2.5]" />
                 </div>
                 <h2 className="text-xl font-bold font-serif text-slate-900 mb-2">Xác nhận xóa</h2>
                 <p className="text-slate-600 mb-6">Bạn có chắc chắn muốn xóa <span className="font-bold">"{deleteConfirm.name}"</span> không? Hành động này không thể hoàn tác.</p>
                 <div className="flex gap-3">
                    <button onClick={() => setDeleteConfirm(null)} className="flex-1 px-4 py-2.5 font-bold text-slate-700 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors">Hủy</button>
                    <button onClick={performDelete} className="flex-1 px-4 py-2.5 font-bold text-white bg-red-600 rounded-xl hover:bg-red-700 shadow-sm shadow-red-600/20 transition-colors">Xóa</button>
                 </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}

