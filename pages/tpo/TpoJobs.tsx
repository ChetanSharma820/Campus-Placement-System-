
import React, { useEffect, useState, useMemo } from 'react';
import { Briefcase, Plus, Search, FileDown, Edit3, Trash2, Mail, Phone, MapPin, User, ChevronRight, X, Check, Loader2, Filter, AlertCircle, Clock } from 'lucide-react';
import { Job, JobStatus } from '../../types';
import { api } from '../../services/api';
import { GlassCard } from '../../components/common/GlassCard';
import { realtime } from '../../services/realtime';

export const TpoJobs: React.FC = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'active' | 'archive'>('active');
  const [auditJob, setAuditJob] = useState<Job | null>(null);
  const [auditData, setAuditData] = useState<any[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);

  const [formData, setFormData] = useState({
    companyName: '',
    hrName: '',
    contact: '',
    email: '',
    address: '',
    roles: [] as string[],
    newRole: '',
    status: JobStatus.HIRING_PROCESS
  });

  const fetchJobs = async () => {
    const data = await api.jobs.getAll();
    setJobs(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchJobs();
    const unsubCreate = realtime.subscribe('JOB_CREATED', fetchJobs);
    const unsubUpdate = realtime.subscribe('JOB_UPDATED', fetchJobs);
    const unsubDelete = realtime.subscribe('JOB_DELETED', fetchJobs);
    return () => {
      unsubCreate(); unsubUpdate(); unsubDelete();
    };
  }, []);

  const filteredJobs = useMemo(() => {
    return jobs.filter(j => {
      const matchesSearch = j.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            j.hrName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            j.email?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const isPast = new Date(j.deadline || '') < new Date();
      if (activeTab === 'active') return matchesSearch && !isPast && j.status !== 'cancelled';
      return matchesSearch && (isPast || j.status === 'cancelled');
    });
  }, [jobs, searchTerm, activeTab]);

  const resetForm = () => {
    setFormData({
      companyName: '',
      hrName: '',
      contact: '',
      email: '',
      address: '',
      roles: [],
      newRole: '',
      status: JobStatus.HIRING_PROCESS
    });
    setEditingId(null);
  };

  const handleEdit = (job: Job) => {
    setFormData({
      companyName: job.companyName,
      hrName: job.hrName || '',
      contact: job.contact || '',
      email: job.email || '',
      address: job.address || '',
      roles: job.roles || [job.role],
      newRole: '',
      status: job.status || JobStatus.HIRING_PROCESS
    });
    setEditingId(job.id);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingId) {
        await api.jobs.update(editingId, {
          companyName: formData.companyName,
          hrName: formData.hrName,
          contact: formData.contact,
          email: formData.email,
          address: formData.address,
          roles: formData.roles,
          status: formData.status
        });
      } else {
        await api.jobs.create({
          companyName: formData.companyName,
          role: formData.roles[0] || 'TBD',
          roles: formData.roles,
          domain: 'TBD',
          package: 'As per Industry Standards',
          location: 'TBD',
          deadline: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
          logo: `https://ui-avatars.com/api/?name=${formData.companyName}&background=random`,
          description: 'Added by TPO Admin',
          fullDescription: 'Corporate visit record.',
          criteria: { minCgpa: 0, backlogs: 0, allowedBranches: ['All'] },
          hrName: formData.hrName,
          contact: formData.contact,
          email: formData.email,
          address: formData.address,
          status: formData.status
        });
      }
      setShowModal(false);
      resetForm();
    } catch (err) {
      alert('Action failed');
    } finally {
      setSaving(false);
    }
  };

  const handleAddRole = () => {
    if (formData.newRole && !formData.roles.includes(formData.newRole)) {
      setFormData({ ...formData, roles: [...formData.roles, formData.newRole], newRole: '' });
    }
  };

  const removeRole = (role: string) => {
    setFormData({ ...formData, roles: formData.roles.filter(r => r !== role) });
  };

  const exportToExcel = () => {
    const headers = ["Company Name", "HR Name", "Contact", "Email", "Address", "Roles", "Status"];
    const rows = jobs.map(j => [
      j.companyName,
      j.hrName || '',
      j.contact || '',
      j.email || '',
      j.address || '',
      (j.roles || [j.role]).join('; '),
      j.status || JobStatus.HIRING_PROCESS
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(e => e.map(val => `"${val}"`).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `Corporate_Leads_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  const handleAudit = async (job: Job) => {
    setAuditJob(job);
    setAuditLoading(true);
    try {
      const data = await api.jobs.getApplicationsByJob(job.id);
      setAuditData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setAuditLoading(false);
    }
  };

  const getStatusColor = (status: JobStatus) => {
    switch (status) {
      case JobStatus.HIRING_PROCESS: return 'text-blue-600 bg-blue-50 border-blue-100';
      case JobStatus.ONGOING: return 'text-green-600 bg-green-50 border-green-100';
      case JobStatus.CANCELLED: return 'text-red-600 bg-red-50 border-red-100';
      case JobStatus.ON_HOLD: return 'text-orange-600 bg-orange-50 border-orange-100';
      case JobStatus.NOT_COMING: return 'text-gray-600 bg-gray-50 border-gray-100';
      default: return 'text-gray-600 bg-gray-50 border-gray-100';
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Compiling Corporate Pipeline...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-24 w-full">
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-gray-100 pb-8">
        <div className="min-w-0">
          <h2 className="text-3xl font-black text-gray-900 tracking-tighter uppercase leading-none truncate">Corporate Pipeline</h2>
          <p className="text-xs text-gray-500 font-medium uppercase tracking-widest mt-2">Manage company relations and visit schedules</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 shrink-0">
          <button 
            onClick={exportToExcel}
            className="flex items-center justify-center gap-3 px-8 py-4 bg-white border border-gray-100 text-gray-600 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg hover:shadow-xl transition-all"
          >
            <FileDown size={20} /> Export Leads
          </button>
          <button 
            onClick={() => { resetForm(); setShowModal(true); }}
            className="flex items-center justify-center gap-3 px-10 py-4 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl shadow-blue-100 hover:bg-blue-700 transition-all"
          >
            <Plus size={20} /> Register Visit
          </button>
        </div>
      </header>

      <div className="flex flex-col md:flex-row gap-6 items-center">
        <div className="relative group flex-1 w-full">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={20} />
          <input 
            type="text" 
            placeholder="Search drives, companies, or HRs..." 
            className="w-full pl-16 pr-6 py-6 rounded-[2rem] glass border-none focus:ring-8 focus:ring-blue-100 outline-none transition-all font-bold text-gray-900 shadow-xl text-sm"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex bg-gray-100/50 p-2 rounded-[2rem] border border-gray-100 shrink-0 shadow-inner">
          <button 
            onClick={() => setActiveTab('active')}
            className={`px-8 py-4 rounded-3xl font-black text-[10px] uppercase tracking-widest transition-all ${activeTab === 'active' ? 'bg-white text-blue-600 shadow-xl' : 'text-gray-400 hover:text-gray-600'}`}
          >
            Active Drives
          </button>
          <button 
            onClick={() => setActiveTab('archive')}
            className={`px-8 py-4 rounded-3xl font-black text-[10px] uppercase tracking-widest transition-all ${activeTab === 'archive' ? 'bg-white text-blue-600 shadow-xl' : 'text-gray-400 hover:text-gray-600'}`}
          >
            Drive Archive
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 w-full">
        {filteredJobs.length > 0 ? filteredJobs.map(job => (
          <GlassCard key={job.id} className="flex flex-col !p-0 border border-white/40 group overflow-hidden hover:shadow-3xl transition-all duration-500 w-full">
            <div className="p-8 border-b border-gray-100 bg-white/30 flex justify-between items-start gap-4">
               <div className="flex items-center gap-4 min-w-0">
                  <div className="w-16 h-16 bg-white rounded-2xl p-2 border border-gray-100 shadow-sm flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <img src={job.logo} alt={job.companyName} className="w-full h-full object-contain" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight truncate">{job.companyName}</h3>
                    <div className={`mt-2 inline-flex px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border shadow-sm whitespace-nowrap ${getStatusColor(job.status || JobStatus.HIRING_PROCESS)}`}>
                      {job.status || JobStatus.HIRING_PROCESS}
                    </div>
                  </div>
               </div>
               <button onClick={() => handleEdit(job)} className="p-3 bg-white border border-gray-100 rounded-xl text-gray-400 hover:text-blue-600 transition-all shadow-sm shrink-0"><Edit3 size={18}/></button>
            </div>
            
            <div className="p-8 space-y-6 flex-1 min-w-0">
               <div className="space-y-4">
                  <div className="flex items-center gap-3 text-xs min-w-0">
                    <div className="p-2 bg-blue-50 text-blue-500 rounded-lg shrink-0"><User size={16} /></div>
                    <span className="font-black text-gray-700 truncate">{job.hrName || 'Not Assigned'}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs min-w-0">
                    <div className="p-2 bg-blue-50 text-blue-500 rounded-lg shrink-0"><Mail size={16} /></div>
                    <span className="font-medium text-gray-500 truncate">{job.email || 'No email provided'}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs min-w-0">
                    <div className="p-2 bg-blue-50 text-blue-500 rounded-lg shrink-0"><Phone size={16} /></div>
                    <span className="font-medium text-gray-500 whitespace-nowrap">{job.contact || 'No contact string'}</span>
                  </div>
                  <div className="flex items-start gap-3 text-xs min-w-0">
                    <div className="p-2 bg-blue-50 text-blue-500 rounded-lg shrink-0 mt-0.5"><MapPin size={16} /></div>
                    <span className="font-medium text-gray-500 line-clamp-2 leading-relaxed">{job.address || 'Address unlisted'}</span>
                  </div>
               </div>

               <div className="pt-8 border-t border-gray-100 min-w-0">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4 ml-1">Engagement Targets</p>
                  <div className="flex flex-wrap gap-2">
                    {(job.roles || [job.role]).map(r => (
                      <span key={r} className="px-4 py-2 bg-gray-50 text-gray-600 text-[10px] font-bold uppercase rounded-xl border border-gray-100 shadow-sm group-hover:bg-white group-hover:border-blue-200 transition-colors">{r}</span>
                    ))}
                  </div>
               </div>
            </div>

            <button 
              onClick={() => handleAudit(job)}
              className="w-full py-5 bg-gray-50 text-[10px] font-black uppercase text-blue-600 hover:bg-blue-600 hover:text-white transition-all flex items-center justify-center gap-2 group-hover:bg-blue-600 group-hover:text-white tracking-[0.2em] border-t border-gray-100"
            >
               Audit Full Record <ChevronRight size={14} />
            </button>
          </GlassCard>
        )) : (
          <div className="col-span-full py-32 text-center glass rounded-[3rem] border-2 border-dashed border-gray-100 text-gray-300 font-black uppercase tracking-[0.4em] text-sm">Transmission Buffer Empty</div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-md z-[100] flex items-center justify-center p-6">
          <GlassCard className="w-full max-w-2xl !p-12 shadow-[0_50px_100px_rgba(0,0,0,0.2)] animate-in zoom-in-95 duration-300 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-12 border-b border-gray-100 pb-8">
              <div>
                <h3 className="text-3xl font-black text-gray-900 uppercase tracking-tighter leading-none">{editingId ? 'Edit Manifest' : 'Corporate Visit'}</h3>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-2">Pipeline Entry Management</p>
              </div>
              <button onClick={() => setShowModal(false)} className="p-3 hover:bg-gray-100 rounded-2xl text-gray-400 hover:text-gray-900 transition-all"><X size={28} /></button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-2">Corporate Identity</label>
                  <input required className="w-full bg-gray-50/50 border border-gray-100 rounded-2xl p-5 text-gray-900 font-black focus:ring-8 focus:ring-blue-100 transition-all outline-none" value={formData.companyName} onChange={e => setFormData({...formData, companyName: e.target.value})} placeholder="Company Legal Name" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-2">Lead Contact (HR)</label>
                  <input required className="w-full bg-gray-50/50 border border-gray-100 rounded-2xl p-5 text-gray-900 font-bold focus:ring-8 focus:ring-blue-100 transition-all outline-none" value={formData.hrName} onChange={e => setFormData({...formData, hrName: e.target.value})} placeholder="Full HR Name" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-2">Communication String</label>
                  <input required className="w-full bg-gray-50/50 border border-gray-100 rounded-2xl p-5 text-gray-900 font-bold focus:ring-8 focus:ring-blue-100 transition-all outline-none" value={formData.contact} onChange={e => setFormData({...formData, contact: e.target.value})} placeholder="Phone / Terminal" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-2">Secure Email</label>
                  <input required className="w-full bg-gray-50/50 border border-gray-100 rounded-2xl p-5 text-gray-900 font-bold focus:ring-8 focus:ring-blue-100 transition-all outline-none" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="hr@corp.com" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-2">HQ / Regional Address</label>
                <textarea className="w-full bg-gray-50/50 border border-gray-100 rounded-2xl p-5 h-28 text-gray-900 font-medium focus:ring-8 focus:ring-blue-100 transition-all outline-none" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} placeholder="Complete geographical location..." />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-2">Recruitment Pulse</label>
                <select className="w-full bg-gray-50/50 border border-gray-100 rounded-2xl p-5 text-gray-900 font-black focus:ring-8 focus:ring-blue-100 transition-all outline-none cursor-pointer" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as JobStatus})}>
                  {Object.values(JobStatus).map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div className="space-y-6">
                <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-2">Active Roles Pipeline</label>
                <div className="flex gap-4">
                   <input className="flex-1 bg-gray-50/50 border border-gray-100 rounded-2xl px-6 py-4 text-sm font-black focus:bg-white transition-all outline-none" placeholder="Enter Role (e.g. Architect)" value={formData.newRole} onChange={e => setFormData({...formData, newRole: e.target.value})} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddRole())} />
                   <button type="button" onClick={handleAddRole} className="p-4 bg-blue-600 text-white rounded-2xl shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all shrink-0"><Plus size={24}/></button>
                </div>
                <div className="flex flex-wrap gap-3 p-6 bg-gray-50/50 rounded-[2rem] border border-gray-100 shadow-inner min-h-[80px]">
                  {formData.roles.length > 0 ? formData.roles.map(r => (
                    <span key={r} className="flex items-center gap-3 px-5 py-3 bg-white text-blue-600 border border-blue-100 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm animate-in zoom-in duration-300">
                      {r} <button type="button" onClick={() => removeRole(r)} className="p-1 hover:bg-red-50 hover:text-red-500 rounded-lg transition-colors"><X size={14}/></button>
                    </span>
                  )) : (
                    <p className="m-auto text-[10px] font-black uppercase text-gray-300 tracking-[0.2em]">Add targeting roles</p>
                  )}
                </div>
              </div>

              <div className="flex gap-4 pt-6">
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)} 
                  className="flex-1 py-6 bg-gray-100 text-gray-500 rounded-[2rem] font-black text-[11px] uppercase tracking-widest hover:bg-gray-200 transition-all"
                >
                  Discard Changes
                </button>
                <button 
                  type="submit" 
                  disabled={saving}
                  className="flex-[2] py-6 bg-gray-900 text-white rounded-[2rem] font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-black transition-all shadow-2xl shadow-gray-200 disabled:opacity-50"
                >
                  {saving ? <Loader2 className="animate-spin" size={22}/> : <Check size={22}/>}
                  {editingId ? 'Commit Record Revisions' : 'Initialize Registration'}
                </button>
              </div>
            </form>
          </GlassCard>
        </div>
      )}

      {auditJob && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-md z-[100] flex items-center justify-center p-6">
          <GlassCard className="w-full max-w-4xl !p-12 shadow-[0_50px_100px_rgba(0,0,0,0.2)] animate-in zoom-in-95 duration-300 max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex justify-between items-center mb-10 shrink-0">
              <div>
                <h3 className="text-3xl font-black text-gray-900 uppercase tracking-tighter leading-none">Drive Audit</h3>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-2">{auditJob.companyName} • Application Ledger</p>
              </div>
              <button onClick={() => setAuditJob(null)} className="p-3 hover:bg-gray-100 rounded-2xl text-gray-400 hover:text-gray-900 transition-all"><X size={28} /></button>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
              {auditLoading ? (
                <div className="py-20 flex flex-col items-center">
                  <Loader2 className="animate-spin text-blue-600 mb-6" size={48} />
                  <p className="text-xs font-black uppercase text-gray-400 tracking-[0.4em]">Deciphering Vectors...</p>
                </div>
              ) : auditData.length > 0 ? (
                <table className="w-full text-left">
                  <thead className="sticky top-0 bg-white z-10 border-b border-gray-100">
                    <tr>
                      <th className="pb-6 text-[10px] font-black uppercase tracking-widest text-gray-400">Applicant Identity</th>
                      <th className="pb-6 text-[10px] font-black uppercase tracking-widest text-gray-400">Target Role</th>
                      <th className="pb-6 text-[10px] font-black uppercase tracking-widest text-gray-400 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {auditData.map(app => (
                      <tr key={app.id} className="group hover:bg-gray-50/50 transition-colors">
                        <td className="py-6">
                           <p className="text-sm font-black text-gray-900 uppercase tracking-tight">{app.studentName}</p>
                           <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1"># {app.studentRollNo} • SEC {app.studentSection}</p>
                        </td>
                        <td className="py-6">
                           <p className="text-xs font-bold text-gray-600 uppercase">{app.role}</p>
                        </td>
                        <td className="py-6 text-center">
                           <span className={`inline-flex px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${
                             app.status === 'Selected' ? 'text-green-600 bg-green-50 border-green-100' :
                             app.status === 'Rejected' ? 'text-red-600 bg-red-50 border-red-100' :
                             'text-blue-600 bg-blue-50 border-blue-100'
                           }`}>
                             {app.status}
                           </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="py-32 text-center text-gray-300 font-black uppercase tracking-[0.4em] text-xs">No transmission entries found for this drive</div>
              )}
            </div>
            
            <div className="mt-10 pt-8 border-t border-gray-100 flex justify-end shrink-0">
               <button 
                onClick={() => setAuditJob(null)}
                className="px-12 py-5 bg-gray-900 text-white rounded-[2rem] font-black text-[11px] uppercase tracking-widest hover:bg-black transition-all shadow-xl shadow-gray-200"
               >
                 Close Audit
               </button>
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  );
};
