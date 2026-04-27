
import React, { useEffect, useState } from 'react';
import { Building2, Plus, Search, Edit3, Trash2, Globe, ExternalLink, Loader2, X, Check } from 'lucide-react';
import { api } from '../../services/api';
import { GlassCard } from '../../components/common/GlassCard';

export const TpoCompanies: React.FC = () => {
  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    domain: '',
    logo: ''
  });

  const fetchCompanies = async () => {
    try {
      const data = await api.companies.getAll();
      setCompanies(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  const filteredCompanies = companies.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.domain?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingId) {
        await api.companies.update(editingId, formData);
      } else {
        await api.companies.create(formData);
      }
      await fetchCompanies();
      setShowModal(false);
      setFormData({ name: '', domain: '', logo: '' });
      setEditingId(null);
    } catch (err) {
      alert('Failed to save company');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (c: any) => {
    setFormData({ name: c.name, domain: c.domain || '', logo: c.logo || '' });
    setEditingId(c.id);
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Delete this company? This may affect existing job records.')) {
      await api.companies.delete(id);
      await fetchCompanies();
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Loading Partner Index...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-24 w-full">
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-gray-100 pb-8">
        <div className="min-w-0">
          <h2 className="text-3xl font-black text-gray-900 tracking-tighter uppercase leading-none truncate">Partner Network</h2>
          <p className="text-xs text-gray-500 font-medium uppercase tracking-widest mt-2">Manage hiring partner profiles and identities</p>
        </div>
        <button 
          onClick={() => { setEditingId(null); setFormData({ name: '', domain: '', logo: '' }); setShowModal(true); }}
          className="flex items-center justify-center gap-3 px-10 py-4 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl shadow-blue-100 hover:bg-blue-700 transition-all"
        >
          <Plus size={20} /> Add Partner
        </button>
      </header>

      <div className="relative group w-full">
        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={20} />
        <input 
          type="text" 
          placeholder="Search corporate entities..." 
          className="w-full pl-16 pr-6 py-6 rounded-[2rem] glass border-none focus:ring-8 focus:ring-blue-100 outline-none transition-all font-bold text-gray-900 shadow-xl text-sm"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8 w-full">
        {filteredCompanies.map(company => (
          <GlassCard key={company.id} className="flex flex-col !p-0 border border-white/40 group overflow-hidden hover:shadow-3xl transition-all duration-500 w-full relative">
            <div className="p-8 flex flex-col items-center text-center space-y-4">
              <div className="w-24 h-24 bg-white rounded-3xl p-4 border border-gray-100 shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                <img src={company.logo || `https://ui-avatars.com/api/?name=${company.name}&background=random`} alt={company.name} className="w-full h-full object-contain" />
              </div>
              <div>
                <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight truncate">{company.name}</h3>
                <div className="flex items-center justify-center gap-2 text-blue-500 mt-2 font-bold text-[10px] uppercase tracking-widest">
                  <Globe size={12} /> {company.domain || 'Internal Partner'}
                </div>
              </div>
            </div>

            <div className="px-8 pb-8 flex gap-3">
              <button onClick={() => handleEdit(company)} className="flex-1 py-3 bg-gray-50 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest border border-transparent hover:border-blue-100">
                <Edit3 size={14} /> Edit
              </button>
              <button onClick={() => handleDelete(company.id)} className="p-3 bg-gray-50 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all border border-transparent hover:border-red-100">
                <Trash2 size={16} />
              </button>
            </div>
          </GlassCard>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-md z-[100] flex items-center justify-center p-6">
          <GlassCard className="w-full max-w-lg !p-12 shadow-[0_50px_100px_rgba(0,0,0,0.2)] animate-in zoom-in-95 duration-300">
            <div className="flex justify-between items-center mb-12 border-b border-gray-100 pb-8">
              <div>
                <h3 className="text-3xl font-black text-gray-900 uppercase tracking-tighter leading-none">{editingId ? 'Edit Profile' : 'New Partner'}</h3>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-2">Corporate Identity Configuration</p>
              </div>
              <button onClick={() => setShowModal(false)} className="p-3 hover:bg-gray-100 rounded-2xl text-gray-400 hover:text-gray-900 transition-all"><X size={28} /></button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-2">Legal Entity Name</label>
                <input required className="w-full bg-gray-50/50 border border-gray-100 rounded-2xl p-5 text-gray-900 font-black focus:ring-8 focus:ring-blue-100 transition-all outline-none" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. Google India" />
              </div>
              
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-2">Primary Domain</label>
                <input className="w-full bg-gray-50/50 border border-gray-100 rounded-2xl p-5 text-gray-900 font-bold focus:ring-8 focus:ring-blue-100 transition-all outline-none" value={formData.domain} onChange={e => setFormData({...formData, domain: e.target.value})} placeholder="google.com" />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-2">Brand Identity (Logo URL)</label>
                <input className="w-full bg-gray-50/50 border border-gray-100 rounded-2xl p-5 text-gray-900 font-medium focus:ring-8 focus:ring-blue-100 transition-all outline-none" value={formData.logo} onChange={e => setFormData({...formData, logo: e.target.value})} placeholder="https://..." />
                <p className="text-[9px] text-gray-400 mt-2 ml-2 italic">Recommended: Square PNG with transparent background</p>
              </div>

              <div className="flex gap-4 pt-6">
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)} 
                  className="flex-1 py-6 bg-gray-100 text-gray-500 rounded-[2rem] font-black text-[11px] uppercase tracking-widest hover:bg-gray-200 transition-all"
                >
                  Discard
                </button>
                <button 
                  type="submit" 
                  disabled={saving}
                  className="flex-[2] py-6 bg-gray-900 text-white rounded-[2rem] font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-black transition-all shadow-2xl shadow-gray-200 disabled:opacity-50"
                >
                  {saving ? <Loader2 className="animate-spin" size={22}/> : <Check size={22}/>}
                  {editingId ? 'Apply Revision' : 'Initialize Partner'}
                </button>
              </div>
            </form>
          </GlassCard>
        </div>
      )}
    </div>
  );
};
