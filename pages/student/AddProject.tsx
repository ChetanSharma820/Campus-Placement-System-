
import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Upload, Github, Globe, Loader2, Image as ImageIcon } from 'lucide-react';
import { GlassCard } from '../../components/common/GlassCard';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export const AddProject: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    title: '',
    shortDescription: '',
    githubUrl: '',
    liveUrl: '',
    techStack: '',
    thumbnailUrl: ''
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    try {
      const url = await api.student.uploadFile(file);
      setFormData(prev => ({ ...prev, thumbnailUrl: url }));
    } catch (err) {
      alert('Upload failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    try {
      const profile = await api.student.getProfile(user.id);
      const newProject = {
        id: Math.random().toString(36).substr(2, 9),
        title: formData.title,
        shortDescription: formData.shortDescription,
        fullDescription: formData.shortDescription, // same for now
        githubUrl: formData.githubUrl,
        liveUrl: formData.liveUrl,
        techStack: formData.techStack.split(',').map(s => s.trim()),
        thumbnailUrl: formData.thumbnailUrl,
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0]
      };
      await api.student.updateProfile(user.id, {
        projects: [...profile.projects, newProject]
      });
      navigate('/student/profile');
    } catch (err) {
      alert('Failed to save project');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in slide-in-from-right-10 duration-500 pb-24">
      <button 
        onClick={() => navigate('/student/profile')}
        className="flex items-center gap-2 text-gray-500 hover:text-blue-600 font-bold transition-all group"
      >
        <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
        Cancel Submission
      </button>

      <GlassCard className="!p-10 border-none shadow-2xl">
        <div className="mb-10 border-b border-gray-100 pb-6">
          <h2 className="text-3xl font-black text-gray-900 tracking-tight">Launch New Innovation</h2>
          <p className="text-gray-500 mt-1">Showcase your engineering skills to recruiters.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Thumbnail Upload */}
          <div className="space-y-4">
            <label className="text-xs font-black uppercase text-gray-400 tracking-widest">Project Visual</label>
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="relative aspect-video rounded-[2rem] overflow-hidden cursor-pointer group bg-gray-100 border-4 border-dashed border-gray-200 hover:border-blue-300 transition-all flex flex-col items-center justify-center gap-4"
            >
              {formData.thumbnailUrl ? (
                <img src={formData.thumbnailUrl} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <div className="text-center p-10">
                  <div className="w-16 h-16 bg-white rounded-2xl shadow-xl flex items-center justify-center mx-auto mb-4 text-gray-300 group-hover:text-blue-500 transition-all">
                    <ImageIcon size={32} />
                  </div>
                  <p className="text-sm font-bold text-gray-400">Click to upload thumbnail</p>
                  <p className="text-[10px] text-gray-300 uppercase tracking-widest mt-2">Recommended: 1200x675px</p>
                </div>
              )}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Upload className="text-white" size={40} />
              </div>
            </div>
            <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} accept="image/*" />
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-black uppercase text-gray-400 tracking-widest ml-1">Project Title</label>
              <input 
                required
                className="w-full text-2xl font-black text-gray-900 tracking-tight bg-gray-50 border border-gray-100 rounded-2xl p-5 focus:border-blue-500 focus:bg-white transition-all outline-none"
                placeholder="E.g., Neural Network Optimizer"
                value={formData.title}
                onChange={e => setFormData({...formData, title: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center ml-1">
                <label className="text-xs font-black uppercase text-gray-400 tracking-widest">Description</label>
                <span className={`text-[10px] font-black ${formData.shortDescription.length > 300 ? 'text-red-500' : 'text-gray-300'}`}>
                  {formData.shortDescription.length} / 300
                </span>
              </div>
              <textarea 
                required
                maxLength={300}
                className="w-full bg-gray-50/50 border border-gray-100 rounded-2xl p-5 h-32 focus:border-blue-500 focus:bg-white transition-all outline-none font-medium"
                placeholder="Explain the problem you solved..."
                value={formData.shortDescription}
                onChange={e => setFormData({...formData, shortDescription: e.target.value})}
              ></textarea>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-black uppercase text-gray-400 tracking-widest ml-1">GitHub Link</label>
                <div className="relative flex items-center">
                  <Github className="absolute left-5 text-gray-400" size={18} />
                  <input 
                    className="w-full pl-14 pr-5 py-4 bg-gray-50/50 border border-gray-100 rounded-2xl focus:border-blue-500 transition-all outline-none font-bold"
                    placeholder="https://github.com/..."
                    value={formData.githubUrl}
                    onChange={e => setFormData({...formData, githubUrl: e.target.value})}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black uppercase text-gray-400 tracking-widest ml-1">Live URL (Optional)</label>
                <div className="relative flex items-center">
                  <Globe className="absolute left-5 text-gray-400" size={18} />
                  <input 
                    className="w-full pl-14 pr-5 py-4 bg-gray-50/50 border border-gray-100 rounded-2xl focus:border-blue-500 transition-all outline-none font-bold"
                    placeholder="https://..."
                    value={formData.liveUrl}
                    onChange={e => setFormData({...formData, liveUrl: e.target.value})}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black uppercase text-gray-400 tracking-widest ml-1">Tech Stack (Comma Separated)</label>
              <input 
                className="w-full bg-gray-50/50 border border-gray-100 rounded-2xl p-5 focus:border-blue-500 transition-all outline-none font-bold"
                placeholder="React, TypeScript, AWS, Node.js"
                value={formData.techStack}
                onChange={e => setFormData({...formData, techStack: e.target.value})}
              />
            </div>
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full py-5 bg-blue-600 text-white font-black rounded-3xl shadow-2xl shadow-blue-200 hover:bg-blue-700 hover:-translate-y-1 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" /> : <Save size={24} />}
            Finalize & Publish Project
          </button>
        </form>
      </GlassCard>
    </div>
  );
};
