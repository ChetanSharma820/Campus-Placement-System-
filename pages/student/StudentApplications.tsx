
import React, { useEffect, useState, useMemo } from 'react';
import { Briefcase, Clock, CheckCircle, XCircle, ChevronRight, Loader2, ArrowUpRight, Search, Filter } from 'lucide-react';
import { Application, ApplicationStatus } from '../../types';
import { api } from '../../services/api';
import { realtime } from '../../services/realtime';
import { useAuth } from '../../context/AuthContext';
import { GlassCard } from '../../components/common/GlassCard';
import { useNavigate } from 'react-router-dom';

export const StudentApplications: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch applications from the centralized "database"
  useEffect(() => {
    if (!user) return;

    const fetchApps = async () => {
      try {
        const data = await api.student.getApplications(user.id);
        setApplications(data);
      } catch (err) {
        console.error("Failed to sync ledger:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchApps();

    // Real-time updates via Supabase
    const unsubUpdate = realtime.subscribe('APPLICATION_UPDATED', (payload: any) => {
      // We could optimize by updating just the changed item, but refetching is safer for consistency
      fetchApps();
    });

    return () => {
      unsubUpdate();
    };
  }, [user]);

  const filteredApplications = useMemo(() => {
    return applications.filter(app => {
      const company = (app.companyName || '').toLowerCase();
      const role = (app.role || '').toLowerCase();
      const status = (app.status || '').toLowerCase();
      const search = searchTerm.toLowerCase();
      
      return company.includes(search) || role.includes(search) || status.includes(search);
    });
  }, [applications, searchTerm]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.4em]">Synchronizing Active Transmissions...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-5xl mx-auto pb-24 px-4 md:px-0">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Transmission Ledger</h2>
          <p className="text-sm text-gray-500 mt-1 font-normal uppercase tracking-[0.2em]">Real-time Status Monitoring of Career Trajectories</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <div className="relative group flex-1 md:min-w-[320px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={18} />
            <input
              type="text"
              placeholder="Search by Company, Role, or Status..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 rounded-2xl glass border-none focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all text-sm font-normal text-gray-900 placeholder:text-gray-400 shadow-sm"
            />
          </div>
        </div>
      </header>

      {applications.length === 0 ? (
        <div className="text-center py-24 glass rounded-[3rem] border-2 border-dashed border-gray-200 animate-in zoom-in duration-500">
          <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-300 shadow-inner">
            <Search size={40} />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">No active applications found.</h3>
          <p className="text-gray-400 font-normal uppercase tracking-widest text-[10px] mb-8">Your transmission history is currently empty</p>
          <button
            onClick={() => navigate('/student/jobs', { state: { focusSearch: true } })}
            className="px-12 py-4 bg-blue-600 text-white font-bold rounded-2xl shadow-xl shadow-blue-100 text-xs tracking-[0.2em] uppercase hover:bg-blue-700 hover:-translate-y-1 transition-all"
          >
            Explore Jobs
          </button>
        </div>
      ) : filteredApplications.length === 0 ? (
        <div className="text-center py-20 glass rounded-[2rem] border-dashed border-2 border-gray-100">
          <p className="text-gray-400 font-normal uppercase tracking-widest text-xs">No records matching "{searchTerm}"</p>
        </div>
      ) : (
        <div className="flex flex-col space-y-4">
          {filteredApplications.map(app => (
            <GlassCard key={app.id} className="flex flex-col md:flex-row items-center gap-6 group hover:-translate-y-1 transition-all border border-white/40">
              <div className="w-14 h-14 md:w-16 md:h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shrink-0 border border-blue-100 shadow-sm group-hover:bg-blue-600 group-hover:text-white transition-all duration-500">
                <Briefcase size={24} />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-1">
                  <h3 className="text-lg font-bold text-gray-900 truncate tracking-tight">{app.role}</h3>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest px-2.5 py-1 bg-gray-50 rounded-lg border border-gray-100">
                      ID: {(app.id || '').slice(-6).toUpperCase()}
                    </span>
                  </div>
                </div>
                <p className="text-sm font-normal text-blue-600 mb-3">{app.companyName}</p>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5 text-[9px] font-bold text-gray-400 uppercase tracking-widest bg-white/50 px-3 py-1 rounded-full border border-white">
                    <Clock size={12} className="text-blue-500" />
                    <span>Applied {app.appliedDate || 'N/A'}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 w-full md:w-auto pt-4 md:pt-0 border-t md:border-t-0 border-white/20">
                <StatusBadge status={app.status} />
                <button
                  onClick={() => navigate(`/student/jobs`, { state: { highlightCompany: app.companyName } })}
                  className="p-4 bg-white/50 text-gray-400 rounded-2xl hover:text-blue-600 hover:bg-white transition-all shadow-sm shrink-0 border border-white group-hover:border-blue-100"
                  title="View Details"
                >
                  <ArrowUpRight size={20} />
                </button>
              </div>
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  );
};

const StatusBadge: React.FC<{ status: ApplicationStatus }> = ({ status }) => {
  const configs = {
    [ApplicationStatus.APPLIED]: { icon: <Clock size={14} />, color: 'text-gray-600 bg-gray-100 border-gray-200' },
    [ApplicationStatus.SHORTLISTED]: { icon: <CheckCircle size={14} />, color: 'text-blue-600 bg-blue-100 border-blue-200' },
    [ApplicationStatus.INTERVIEW]: { icon: <Clock size={14} />, color: 'text-orange-600 bg-orange-100 border-orange-200' },
    [ApplicationStatus.SELECTED]: { icon: <CheckCircle size={14} />, color: 'text-green-600 bg-green-100 border-green-200' },
    [ApplicationStatus.REJECTED]: { icon: <XCircle size={14} />, color: 'text-red-600 bg-red-100 border-red-200' }
  };

  const config = configs[status] || { icon: <Clock size={14} />, color: 'text-gray-600 bg-gray-50 border-gray-200' };

  return (
    <div className={`flex items-center gap-2.5 px-6 py-3 rounded-2xl border text-[11px] font-bold uppercase tracking-[0.1em] ${config.color} flex-1 md:flex-none justify-center shadow-sm`}>
      {config.icon}
      {status || 'Unknown'}
    </div>
  );
};
