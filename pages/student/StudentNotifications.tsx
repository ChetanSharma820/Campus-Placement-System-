
import React, { useEffect, useState } from 'react';
import { Bell, Briefcase, Calendar, Award, Megaphone, Zap, Pin, Loader2, ArrowLeft, RefreshCw, XCircle } from 'lucide-react';
import { Announcement, AnnouncementType } from '../../types';
import { api } from '../../services/api';
import { realtime } from '../../services/realtime';
import { useNavigate } from 'react-router-dom';
import { GlassCard } from '../../components/common/GlassCard';

export const StudentNotifications: React.FC = () => {
  const navigate = useNavigate();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAnnouncements = async () => {
    const data = await api.announcements.getAll();
    setAnnouncements(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchAnnouncements();

    const unsubCreate = realtime.subscribe('ANNOUNCEMENT_CREATED', (newAnn: Announcement) => {
      setAnnouncements(prev => [newAnn, ...prev].sort((a, b) => (a.isPinned === b.isPinned ? 0 : a.isPinned ? -1 : 1)));
    });
    
    const unsubUpdate = realtime.subscribe('ANNOUNCEMENT_UPDATED', () => fetchAnnouncements());
    const unsubDelete = realtime.subscribe('ANNOUNCEMENT_DELETED', (id) => {
      setAnnouncements(prev => prev.filter(a => a.id !== id));
    });

    return () => {
      unsubCreate();
      unsubUpdate();
      unsubDelete();
    };
  }, []);

  const getTypeStyle = (type: AnnouncementType) => {
    switch (type) {
      case 'job': return 'bg-blue-600 text-white';
      case 'placement': return 'bg-green-600 text-white';
      case 'drive': return 'bg-indigo-600 text-white';
      case 'company': return 'bg-orange-600 text-white';
      default: return 'bg-slate-800 text-white';
    }
  };

  const getTypeIcon = (type: AnnouncementType) => {
    switch (type) {
      case 'job': return <Briefcase size={22} />;
      case 'placement': return <Award size={22} />;
      case 'drive': return <Zap size={22} />;
      case 'company': return <Megaphone size={22} />;
      default: return <Bell size={22} />;
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
        <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Accessing Secure Feed...</p>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-500 max-w-5xl mx-auto pb-24">
      <header className="flex flex-col gap-4 border-b border-gray-100 pb-10">
        <button 
          onClick={() => navigate('/student/dashboard')}
          className="flex items-center gap-2 text-gray-500 hover:text-blue-600 font-black text-[10px] transition-all group uppercase tracking-widest"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          Command Center
        </button>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-4xl font-black text-gray-900 tracking-tighter uppercase">Broadcast Archive</h2>
            <p className="text-sm text-gray-500 font-medium uppercase tracking-widest mt-1">Real-time synchronized placement intelligence</p>
          </div>
          <div className="hidden md:flex items-center gap-2 px-6 py-3 bg-green-50 text-green-600 rounded-full border border-green-100 text-[9px] font-black uppercase tracking-widest">
            <RefreshCw size={14} className="animate-spin-slow" /> System Synchronized
          </div>
        </div>
      </header>

      <div className="flex flex-col space-y-6">
        {announcements.length > 0 ? announcements.map(ann => (
          <GlassCard key={ann.id} className={`flex flex-col md:flex-row gap-8 !p-10 border border-white/40 hover:shadow-2xl transition-all relative overflow-hidden ${ann.isPinned ? 'ring-2 ring-blue-500/30' : ''}`}>
            {ann.isPinned && (
              <div className="absolute top-0 right-0 p-8 text-blue-100 opacity-20 pointer-events-none">
                 <Pin size={80} className="rotate-12" />
              </div>
            )}
            
            <div className={`w-16 h-16 md:w-20 md:h-20 rounded-[2rem] flex items-center justify-center shrink-0 shadow-2xl ${getTypeStyle(ann.type)}`}>
              {getTypeIcon(ann.type)}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-4 mb-4 flex-wrap">
                <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.15em] border border-white/20 ${getTypeStyle(ann.type)} shadow-md`}>
                  {ann.type}
                </span>
                {ann.isPinned && (
                  <span className="flex items-center gap-2 text-blue-600 text-[10px] font-black uppercase tracking-widest bg-blue-50 px-4 py-1.5 rounded-full border border-blue-100">
                    <Pin size={12} className="fill-current" /> High Priority
                  </span>
                )}
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-auto">
                  {new Date(ann.date).toLocaleDateString()} at {new Date(ann.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <h3 className="text-xl md:text-2xl font-black text-gray-900 uppercase tracking-tight mb-3 leading-tight">{ann.title}</h3>
              <p className="text-base text-gray-600 font-normal leading-relaxed">{ann.description}</p>
            </div>
          </GlassCard>
        )) : (
          <div className="text-center py-32 glass rounded-[3rem] border-2 border-dashed border-gray-100">
             <Bell size={64} className="mx-auto text-gray-100 mb-8" />
             <p className="text-gray-400 font-black uppercase tracking-[0.2em] text-sm">No transmissions detected on current frequency</p>
          </div>
        )}
      </div>
    </div>
  );
};
