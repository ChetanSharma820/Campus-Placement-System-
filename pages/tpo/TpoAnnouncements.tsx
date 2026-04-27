
import React, { useEffect, useState, useRef } from 'react';
import { Bell, Plus, Pin, Trash2, Edit3, Loader2, Check, Megaphone, Calendar, X, Briefcase, Award, Zap, FileText, Upload, ChevronRight, Save, Globe } from 'lucide-react';
import { api } from '../../services/api';
import { Announcement, AnnouncementType, DriveType, DriveDocument } from '../../types';
import { GlassCard } from '../../components/common/GlassCard';

type ModalStep = 'selection' | 'form';

export const TpoAnnouncements: React.FC = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalStep, setModalStep] = useState<ModalStep>('selection');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState<any>({
    title: '',
    description: '',
    type: 'general' as AnnouncementType,
    isPinned: false,
    companyName: '',
    driveType: 'On Campus' as DriveType,
    role: '',
    customRole: '',
    eligibility: '',
    documents: [] as DriveDocument[]
  });

  const [docFormData, setDocFormData] = useState({ title: '', file: null as File | null });
  const docInputRef = useRef<HTMLInputElement>(null);

  const fetchAnnouncements = async () => {
    const data = await api.announcements.getAll();
    setAnnouncements(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      type: 'general',
      isPinned: false,
      companyName: '',
      driveType: 'On Campus',
      role: '',
      customRole: '',
      eligibility: '',
      documents: []
    });
    setEditingId(null);
    setModalStep('selection');
  };

  const handleTypeSelect = (type: AnnouncementType) => {
    setFormData({ ...formData, type });
    setModalStep('form');
  };

  const handleAddDocument = async () => {
    if (!docFormData.file || !docFormData.title) return;
    const url = await api.student.uploadFile(docFormData.file);
    const newDoc: DriveDocument = {
      id: Math.random().toString(36).substr(2, 9),
      title: docFormData.title,
      url,
      fileName: docFormData.file.name
    };
    setFormData({ ...formData, documents: [...formData.documents, newDoc] });
    setDocFormData({ title: '', file: null });
  };

  const handleAction = async (isDraft: boolean) => {
    setSaving(true);
    try {
      const payload: Omit<Announcement, 'id' | 'date'> = {
        title: formData.title,
        description: formData.description,
        type: formData.type,
        isPinned: formData.isPinned,
        isDraft,
        author: 'TPO Admin',
        metadata: formData.type === 'drive' ? {
          companyName: formData.companyName,
          driveType: formData.driveType,
          role: formData.role === 'Custom' ? formData.customRole : formData.role,
          eligibility: formData.eligibility,
          documents: formData.documents
        } : undefined
      };

      if (editingId) {
        await api.announcements.update(editingId, payload);
      } else {
        await api.announcements.create(payload);
      }
      setShowModal(false);
      resetForm();
      fetchAnnouncements();
    } catch (err) {
      alert('Broadcast failure');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (ann: Announcement) => {
    setFormData({
      title: ann.title,
      description: ann.description,
      type: ann.type,
      isPinned: ann.isPinned,
      companyName: ann.metadata?.companyName || '',
      driveType: ann.metadata?.driveType || 'On Campus',
      role: ann.metadata?.role || '',
      eligibility: ann.metadata?.eligibility || '',
      documents: ann.metadata?.documents || []
    });
    setEditingId(ann.id);
    setModalStep('form');
    setShowModal(true);
  };

  const getTypeIcon = (type: AnnouncementType) => {
    switch (type) {
      case 'job': return <Briefcase size={16} />;
      case 'placement': return <Award size={16} />;
      case 'drive': return <Zap size={16} />;
      case 'company': return <Megaphone size={16} />;
      default: return <Bell size={16} />;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-24">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-gray-900 tracking-tighter uppercase">Announcement Hub</h2>
          <p className="text-sm text-gray-500 font-medium uppercase tracking-widest mt-1">Cross-panel communication center</p>
        </div>
        <button 
          onClick={() => { resetForm(); setShowModal(true); }}
          className="flex items-center justify-center gap-3 px-8 py-4 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all"
        >
          <Plus size={18} /> New Broadcast
        </button>
      </header>

      <div className="flex flex-col space-y-4">
        {announcements.length > 0 ? announcements.map(ann => (
          <GlassCard key={ann.id} className={`flex flex-col md:flex-row gap-6 border border-white/40 ${ann.isPinned ? 'ring-2 ring-blue-500/20 bg-blue-50/10' : ''}`}>
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-lg ${
              ann.isPinned ? 'bg-blue-600 text-white' : 'bg-white text-blue-600 border border-gray-100'
            }`}>
              {getTypeIcon(ann.type)}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-1">
                <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight truncate">{ann.title}</h3>
                {ann.isPinned && <Pin size={14} className="text-blue-600 fill-current" />}
                {ann.isDraft && <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-[8px] font-black uppercase tracking-widest rounded-md">Draft</span>}
              </div>
              <p className="text-sm text-gray-600 line-clamp-2 mb-3">{ann.description}</p>
              <div className="flex items-center gap-4 text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                <div className="flex items-center gap-1.5 bg-gray-50 px-3 py-1 rounded-full border border-gray-100">
                  <Calendar size={12} />
                  {new Date(ann.date).toLocaleDateString()}
                </div>
                <div className="flex items-center gap-1.5 bg-blue-50 text-blue-600 px-3 py-1 rounded-full border border-blue-100 uppercase">
                  {ann.type}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-4 md:pt-0 border-t md:border-t-0 border-gray-100">
              <button onClick={() => handleEdit(ann)} className="p-3 bg-white text-gray-400 border border-gray-100 rounded-xl hover:text-blue-600 transition-all shadow-sm"><Edit3 size={18} /></button>
              <button onClick={() => api.announcements.delete(ann.id).then(fetchAnnouncements)} className="p-3 bg-white text-gray-400 border border-gray-100 rounded-xl hover:text-red-600 transition-all shadow-sm"><Trash2 size={18} /></button>
            </div>
          </GlassCard>
        )) : (
          <div className="py-24 text-center glass rounded-[3rem] border-2 border-dashed border-gray-200 text-gray-400 font-bold uppercase tracking-widest text-xs">Buffer Empty</div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <GlassCard className="w-full max-w-2xl !p-0 shadow-2xl overflow-hidden animate-in zoom-in duration-300">
            {/* Header */}
            <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-white/50">
              <div className="flex items-center gap-3">
                {modalStep === 'form' && (
                  <button onClick={() => setModalStep('selection')} className="p-2 hover:bg-gray-100 rounded-lg text-gray-400"><X size={20} className="rotate-45" /></button>
                )}
                <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tighter">
                  {modalStep === 'selection' ? 'Select Transmission Type' : `New ${formData.type} Broadcast`}
                </h3>
              </div>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-900"><X size={24} /></button>
            </div>

            <div className="p-8 max-h-[80vh] overflow-y-auto">
              {modalStep === 'selection' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <TypeSelectionCard 
                    icon={<Zap size={24} />} 
                    title="New Recruitment Drive" 
                    desc="Publish full hiring event with JD and Eligibility" 
                    onClick={() => handleTypeSelect('drive')}
                  />
                  <TypeSelectionCard 
                    icon={<Megaphone size={24} />} 
                    title="Drive Update" 
                    desc="Broadcast changes to existing schedules" 
                    onClick={() => handleTypeSelect('company')}
                  />
                  <TypeSelectionCard 
                    icon={<Award size={24} />} 
                    title="Placement Success" 
                    desc="Celebrate student placement achievements" 
                    onClick={() => handleTypeSelect('placement')}
                  />
                  <TypeSelectionCard 
                    icon={<Bell size={24} />} 
                    title="General Announcement" 
                    desc="Standard campus notifications" 
                    onClick={() => handleTypeSelect('general')}
                  />
                </div>
              ) : (
                <form className="space-y-8">
                  {/* Common Fields */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Title</label>
                    <input required className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 text-gray-900 font-bold focus:border-blue-500 outline-none transition-all" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="Broadcast Subject Line" />
                  </div>

                  {formData.type === 'drive' && (
                    <>
                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Company Name</label>
                          <input required className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 text-gray-900 font-bold focus:border-blue-500 outline-none transition-all" value={formData.companyName} onChange={e => setFormData({...formData, companyName: e.target.value})} placeholder="Enterprise Name" />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Drive Category</label>
                          <select className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 text-gray-900 font-bold outline-none" value={formData.driveType} onChange={e => setFormData({...formData, driveType: e.target.value as DriveType})}>
                            <option>On Campus</option>
                            <option>Off Campus</option>
                            <option>Pool Drive</option>
                          </select>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Hiring Role</label>
                        <select className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 text-gray-900 font-bold outline-none" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})}>
                          <option value="">Select Role</option>
                          <option>Software Engineer</option>
                          <option>Data Analyst</option>
                          <option>Product Manager</option>
                          <option value="Custom">Custom Role (Specify below)</option>
                        </select>
                        {formData.role === 'Custom' && (
                          <input className="w-full mt-2 bg-gray-50 border border-gray-100 rounded-2xl p-4 text-gray-900 font-bold animate-in slide-in-from-top-2" placeholder="Enter Custom Role Title" value={formData.customRole} onChange={e => setFormData({...formData, customRole: e.target.value})} />
                        )}
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Eligibility Criteria</label>
                        <input className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 text-gray-900 font-bold" value={formData.eligibility} onChange={e => setFormData({...formData, eligibility: e.target.value})} placeholder="E.g., 7.5 CGPA, No Backlogs, CS/IT only" />
                      </div>

                      {/* Document Section */}
                      <div className="space-y-4">
                        <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Drive Dossier (JD/Docs)</label>
                        <div className="p-6 border-2 border-dashed border-gray-100 rounded-[2rem] bg-gray-50/50 space-y-4">
                           <div className="flex gap-4">
                              <input className="flex-1 bg-white border border-gray-100 rounded-xl px-4 py-3 text-sm" placeholder="Document Title (e.g. Job Description)" value={docFormData.title} onChange={e => setDocFormData({...docFormData, title: e.target.value})} />
                              <button type="button" onClick={() => docInputRef.current?.click()} className="px-4 bg-white border border-gray-100 rounded-xl flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-blue-600">
                                <Upload size={16} /> {docFormData.file ? 'File Attached' : 'Attach PDF'}
                              </button>
                              <input type="file" ref={docInputRef} className="hidden" accept=".pdf" onChange={e => setDocFormData({...docFormData, file: e.target.files?.[0] || null})} />
                              <button type="button" onClick={handleAddDocument} className="p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-100"><Plus size={20} /></button>
                           </div>
                           <div className="space-y-2">
                             {formData.documents.map((doc: DriveDocument) => (
                               <div key={doc.id} className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-xl">
                                  <div className="flex items-center gap-3">
                                    <FileText size={18} className="text-blue-500" />
                                    <span className="text-xs font-bold uppercase tracking-tight text-gray-700">{doc.title}</span>
                                    <span className="text-[10px] text-gray-400 font-normal">({doc.fileName})</span>
                                  </div>
                                  <button type="button" onClick={() => setFormData({...formData, documents: formData.documents.filter((d: any) => d.id !== doc.id)})} className="text-red-400 hover:text-red-600"><Trash2 size={16} /></button>
                               </div>
                             ))}
                           </div>
                        </div>
                      </div>
                    </>
                  )}

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Body Description</label>
                    <textarea required className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 h-32 text-gray-900 outline-none" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Details regarding the broadcast..." />
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-100">
                    <button type="button" onClick={() => handleAction(true)} disabled={saving} className="flex-1 py-5 bg-gray-100 text-gray-600 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-gray-200 transition-all">
                      <Save size={18} /> Save as Draft
                    </button>
                    <button type="button" onClick={() => handleAction(false)} disabled={saving} className="flex-[2] py-5 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all">
                      {saving ? <Loader2 className="animate-spin" /> : <Megaphone size={18} />}
                      {formData.type === 'drive' ? 'Publish Global Drive' : 'Broadcast Update'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  );
};

const TypeSelectionCard: React.FC<{ icon: React.ReactNode; title: string; desc: string; onClick: () => void }> = ({ icon, title, desc, onClick }) => (
  <button onClick={onClick} className="text-left p-6 bg-white/50 border border-gray-100 rounded-3xl hover:border-blue-500 hover:shadow-2xl transition-all group active:scale-[0.98]">
     <div className="w-14 h-14 bg-gray-50 text-gray-400 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
       {icon}
     </div>
     <h4 className="text-sm font-black text-gray-900 uppercase tracking-tight mb-2">{title}</h4>
     <p className="text-xs text-gray-500 font-normal leading-relaxed">{desc}</p>
  </button>
);
