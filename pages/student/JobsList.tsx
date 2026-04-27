
import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Search, MapPin, DollarSign, Calendar, Filter, Briefcase, Loader2, ArrowUpRight, Check, ChevronRight, X, ChevronDown, Zap, FileText } from 'lucide-react';
import { Job } from '../../types';
import { api } from '../../services/api';
import { GlassCard } from '../../components/common/GlassCard';
import { realtime } from '../../services/realtime';

interface CompanyGroup {
  companyName: string;
  logo: string;
  roles: Job[];
}

export const JobsList: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const filterMenuRef = useRef<HTMLDivElement>(null);
  
  const [jobs, setJobs] = useState<Job[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  
  const [activeDomain, setActiveDomain] = useState<string | null>(null);
  const [activeLocation, setActiveLocation] = useState<string | null>(null);
  
  const [selectedRoles, setSelectedRoles] = useState<Record<string, string>>({});

  const fetchJobs = async () => {
    const data = await api.jobs.getAll();
    setJobs(data);
    const initialSelection: Record<string, string> = {};
    data.forEach(job => {
      if (!initialSelection[job.companyName]) {
        initialSelection[job.companyName] = job.id;
      }
    });
    setSelectedRoles(initialSelection);
    setLoading(false);
  };

  useEffect(() => {
    fetchJobs();

    // REAL-TIME SYNC: Listen for newly published drives
    const unsubJob = realtime.subscribe('JOB_CREATED', (newJob: Job) => {
      setJobs(prev => [newJob, ...prev]);
      if (!selectedRoles[newJob.companyName]) {
        setSelectedRoles(prev => ({ ...prev, [newJob.companyName]: newJob.id }));
      }
    });

    const handleClickOutside = (event: MouseEvent) => {
      if (filterMenuRef.current && !filterMenuRef.current.contains(event.target as Node)) {
        setIsFilterOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      unsubJob();
    };
  }, []);

  const uniqueDomains = useMemo(() => Array.from(new Set(jobs.map(j => j.domain))), [jobs]);
  const uniqueLocations = useMemo(() => Array.from(new Set(jobs.map(j => j.location))), [jobs]);

  const companyGroups = useMemo(() => {
    const groups: Record<string, CompanyGroup> = {};
    
    const filtered = jobs.filter(job => {
      const matchesSearch = job.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          job.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          job.domain.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesDomain = activeDomain ? job.domain === activeDomain : true;
      const matchesLocation = activeLocation ? job.location === activeLocation : true;
      
      return matchesSearch && matchesDomain && matchesLocation;
    });

    filtered.forEach(job => {
      if (!groups[job.companyName]) {
        groups[job.companyName] = {
          companyName: job.companyName,
          logo: job.logo,
          roles: []
        };
      }
      groups[job.companyName].roles.push(job);
    });

    return Object.values(groups);
  }, [jobs, searchTerm, activeDomain, activeLocation]);

  const handleRoleChange = (companyName: string, jobId: string) => {
    setSelectedRoles(prev => ({ ...prev, [companyName]: jobId }));
  };

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500 max-w-5xl mx-auto pb-24 px-4 md:px-0">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-gray-900 tracking-tighter uppercase">Recruitment Matrix</h2>
          <p className="text-sm text-gray-500 mt-1 font-medium uppercase tracking-widest text-[10px]">Active Corporate Engagements</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto relative">
          <div className="relative group flex-1 md:min-w-[350px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={18} />
            <input 
              ref={searchInputRef}
              type="text"
              placeholder="Search Company, Role..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 rounded-2xl glass border-none focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all text-sm font-normal text-gray-900 shadow-sm"
            />
          </div>
          <button 
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className="flex items-center justify-center gap-2 px-6 py-3.5 glass rounded-2xl text-[10px] font-black uppercase tracking-widest border border-white hover:bg-white transition-all shadow-sm"
          >
            <Filter size={16} /> Filters
          </button>
        </div>
      </header>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 space-y-4">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
          <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.4em]">Accessing Opportunity Ledger...</p>
        </div>
      ) : (
        <div className="flex flex-col space-y-6">
          {companyGroups.length > 0 ? companyGroups.map(group => {
            const currentSelectedId = selectedRoles[group.companyName];
            const activeJob = group.roles.find(r => r.id === currentSelectedId) || group.roles[0];
            const isNew = activeJob.createdAt ? (Date.now() - new Date(activeJob.createdAt).getTime()) < 300000 : false;

            return (
              <GlassCard key={group.companyName} className="!p-0 border border-white/40 overflow-hidden group hover:shadow-2xl transition-all duration-500">
                <div className="flex flex-col lg:flex-row">
                  {/* Company Side */}
                  <div className="lg:w-1/3 p-6 md:p-8 bg-gray-50/50 border-b lg:border-b-0 lg:border-r border-white/30">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-16 h-16 rounded-2xl bg-white border border-gray-100 shadow-md p-2 shrink-0">
                        <img src={group.logo} alt={group.companyName} className="w-full h-full object-contain" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-xl font-black text-gray-900 truncate tracking-tight uppercase">{group.companyName}</h3>
                        <p className="text-[10px] text-blue-600 font-bold uppercase tracking-widest mt-1">Verified Partner</p>
                      </div>
                    </div>

                    <div className="space-y-2 mt-4">
                      {group.roles.map(role => (
                        <button
                          key={role.id}
                          onClick={() => handleRoleChange(group.companyName, role.id)}
                          className={`w-full flex items-center justify-between p-3 rounded-xl transition-all text-left ${
                            currentSelectedId === role.id ? 'bg-blue-600 text-white shadow-lg' : 'bg-white/40 text-gray-600 hover:bg-white/80'
                          }`}
                        >
                          <span className="text-xs font-bold truncate">{role.role}</span>
                          {currentSelectedId === role.id && <Check size={14} />}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Role Intel Side */}
                  <div className="flex-1 p-6 md:p-8 flex flex-col justify-between" key={activeJob.id}>
                    <div>
                      <div className="flex items-center justify-between gap-4 mb-6">
                        <div className="flex items-center gap-3">
                           <h4 className="text-xl md:text-3xl font-black text-gray-900 tracking-tighter uppercase">{activeJob.role}</h4>
                           {isNew && <span className="px-2 py-0.5 bg-blue-600 text-white text-[8px] font-black rounded flex items-center gap-1 animate-pulse"><Zap size={8} className="fill-current"/> NEW</span>}
                        </div>
                        <span className="px-3 py-1 bg-green-50 text-green-600 text-[10px] font-black uppercase tracking-widest rounded-full border border-green-100 whitespace-nowrap">
                           Accepting Dossiers
                        </span>
                      </div>

                      <p className="text-gray-600 text-sm leading-relaxed mb-8 font-normal line-clamp-3">
                        {activeJob.description}
                      </p>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8 border-t border-gray-100 pt-6">
                        <Stat label="Compensation" value={activeJob.package} />
                        <Stat label="Location" value={activeJob.location} />
                        <Stat label="Deadline" value={activeJob.deadline} highlight />
                        <Stat label="Academic Floor" value={`${activeJob.criteria.minCgpa} CGPA`} />
                      </div>

                      {activeJob.documents && activeJob.documents.length > 0 && (
                        <div className="mb-8 space-y-3">
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Drive Assets</p>
                          <div className="flex flex-wrap gap-3">
                            {activeJob.documents.map(doc => (
                              <a key={doc.id} href={doc.url} target="_blank" className="flex items-center gap-2 px-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-xs font-bold text-gray-700 hover:bg-white hover:border-blue-500 transition-all shadow-sm">
                                <FileText size={14} className="text-blue-500" /> {doc.title}
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <button 
                      onClick={() => navigate(`/student/jobs/${activeJob.id}/apply`)}
                      className="w-full py-5 bg-gray-900 text-white font-black rounded-2xl shadow-xl flex items-center justify-center gap-3 text-[11px] uppercase tracking-widest hover:bg-black transition-all group"
                    >
                      Initialize Application Protocol
                      <ArrowUpRight size={18} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                    </button>
                  </div>
                </div>
              </GlassCard>
            );
          }) : (
            <div className="text-center py-24 glass rounded-[3rem] border-dashed border-2 border-gray-200 text-gray-400 font-bold uppercase tracking-widest text-xs">No opportunities detected</div>
          )}
        </div>
      )}
    </div>
  );
};

const Stat: React.FC<{ label: string; value: string; highlight?: boolean }> = ({ label, value, highlight }) => (
  <div>
    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">{label}</p>
    <p className={`text-sm font-black uppercase ${highlight ? 'text-red-500' : 'text-gray-900'}`}>{value}</p>
  </div>
);
