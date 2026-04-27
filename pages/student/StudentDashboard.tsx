
import React, { useEffect, useState } from 'react';
import { Briefcase, FileCheck, Calendar, Award, TrendingUp, Bell, ArrowRight } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { GlassCard } from '../../components/common/GlassCard';
import { api } from '../../services/api';
import { Announcement, ApplicationStatus, JobStatus } from '../../types';
import { realtime } from '../../services/realtime';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const data = [
  { name: 'Jan', applications: 4 },
  { name: 'Feb', applications: 7 },
  { name: 'Mar', applications: 12 },
  { name: 'Apr', applications: 9 },
  { name: 'May', applications: 18 },
  { name: 'Jun', applications: 15 },
];

export const StudentDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [stats, setStats] = useState({
    jobsAvailable: 0,
    applied: 0,
    interviews: 0,
    offers: 0,
    cgpa: 0
  });

  const fetchData = async () => {
    if (!user?.id) return;

    try {
      // Parallel fetch
      const [allJobs, applications, profile] = await Promise.all([
        api.jobs.getAll(),
        api.student.getApplications(user.id),
        api.student.getProfile(user.id)
      ]);

      const jobsAvailable = allJobs.filter(j => j.status === JobStatus.ONGOING || j.status === JobStatus.HIRING_PROCESS).length;
      const applied = applications.length;
      const interviews = applications.filter(a => a.status === ApplicationStatus.INTERVIEW).length;
      const offers = applications.filter(a => a.status === ApplicationStatus.SELECTED).length;

      setStats({
        jobsAvailable,
        applied,
        interviews,
        offers,
        cgpa: profile.academic?.cgpa || 0
      });

      const annData = await api.announcements.getAll();
      setAnnouncements(annData.slice(0, 3));
    } catch (error) {
      console.error("Failed to fetch dashboard data", error);
    }
  };

  useEffect(() => {
    fetchData();

    // REAL-TIME SYNC: Listen for new announcements from TPO
    const unsubCreate = realtime.subscribe('ANNOUNCEMENT_CREATED', () => fetchData());
    const unsubUpdate = realtime.subscribe('ANNOUNCEMENT_UPDATED', () => fetchData());
    const unsubDelete = realtime.subscribe('ANNOUNCEMENT_DELETED', () => fetchData());
    // Also listen for job/app changes
    const unsubJob = realtime.subscribe('JOB_CREATED', () => fetchData());

    return () => {
      unsubCreate();
      unsubUpdate();
      unsubDelete();
      unsubJob();
    };
  }, [user]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-24">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-8">
        <div>
          <h2 className="text-4xl font-black text-gray-900 tracking-tighter uppercase">Command Center</h2>
          <p className="text-gray-500 mt-1 font-medium uppercase tracking-widest text-[10px]">Real-time system pulse & trajectory tracking</p>
        </div>
        <div className="flex items-center space-x-2 bg-white/50 p-3 rounded-2xl glass border border-blue-100 px-6">
          <TrendingUp className="text-green-500" size={20} />
          <span className="text-xs font-bold text-gray-700 uppercase tracking-widest">CGPA: {stats.cgpa || 'N/A'}</span>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Jobs Available" value={stats.jobsAvailable.toString()} icon={<Briefcase size={22} />} color="blue" />
        <StatCard title="Applied" value={stats.applied.toString()} icon={<FileCheck size={22} />} color="indigo" />
        <StatCard title="Interviews" value={stats.interviews.toString()} icon={<Calendar size={22} />} color="orange" />
        <StatCard title="Offers" value={stats.offers.toString()} icon={<Award size={22} />} color="green" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <GlassCard className="lg:col-span-2 !p-8 border-none shadow-xl">
          <div className="flex items-center justify-between mb-10">
            <h3 className="text-xl font-black text-gray-900 uppercase tracking-tighter">Application Dynamics</h3>
            <select className="bg-transparent border-none text-[10px] font-black text-gray-400 uppercase tracking-widest focus:ring-0 cursor-pointer">
              <option>Last 6 months</option>
              <option>Last 12 months</option>
            </select>
          </div>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="colorApps" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }} />
                <Tooltip
                  contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)', padding: '16px' }}
                />
                <Area type="monotone" dataKey="applications" stroke="#3b82f6" strokeWidth={4} fillOpacity={1} fill="url(#colorApps)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        <GlassCard className="!p-8 border-none shadow-xl flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-black text-gray-900 uppercase tracking-tighter">Broadcast Feed</h3>
            <div className="w-2 h-2 bg-green-500 rounded-full animate-ping" title="Real-time Active"></div>
          </div>
          <div className="space-y-8 flex-1">
            {announcements.length > 0 ? announcements.map((ann) => (
              <div key={ann.id} className="flex gap-4 group cursor-pointer" onClick={() => navigate('/student/notifications')}>
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-lg group-hover:scale-110 transition-transform ${ann.isPinned ? 'bg-blue-600 text-white' : 'bg-gray-100 text-blue-600'
                  }`}>
                  <Bell size={20} />
                </div>
                <div className="flex-1 min-w-0 border-b border-gray-50 pb-6">
                  <div className="flex justify-between items-start mb-1">
                    <p className="text-xs font-black text-gray-900 uppercase tracking-tight truncate">{ann.title}</p>
                  </div>
                  <p className="text-[11px] text-gray-500 line-clamp-2 leading-relaxed">{ann.description}</p>
                </div>
              </div>
            )) : (
              <div className="flex flex-col items-center justify-center py-10">
                <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">No transmissions detected</p>
              </div>
            )}
          </div>
          <button
            onClick={() => navigate('/student/notifications')}
            className="w-full mt-8 py-4 bg-gray-50 text-[10px] font-black uppercase text-blue-600 hover:bg-blue-600 hover:text-white rounded-2xl transition-all tracking-widest flex items-center justify-center gap-2"
          >
            Access Full Archive <ArrowRight size={14} />
          </button>
        </GlassCard>
      </div>
    </div>
  );
};

const StatCard: React.FC<{
  title: string;
  value: string;
  icon: React.ReactNode;
  color: 'blue' | 'indigo' | 'orange' | 'green';
}> = ({ title, value, icon, color }) => {
  const styles = {
    blue: 'text-blue-600 bg-blue-50/50 border-blue-100',
    indigo: 'text-indigo-600 bg-indigo-50/50 border-indigo-100',
    orange: 'text-orange-600 bg-orange-50/50 border-orange-100',
    green: 'text-green-600 bg-green-50/50 border-green-100',
  };

  return (
    <GlassCard className="flex items-center space-x-5 border-none shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all !p-8">
      <div className={`p-4 rounded-[1.5rem] shadow-sm ${styles[color]} border shrink-0`}>
        {icon}
      </div>
      <div>
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">{title}</p>
        <p className="text-3xl font-black text-gray-900 tracking-tighter leading-none">{value}</p>
      </div>
    </GlassCard>
  );
};
