
import React, { useState, useEffect, useRef } from 'react';
import {
  User as UserIcon, Mail, Phone, MapPin, Globe, Github, Linkedin, ExternalLink,
  Briefcase, Award, Plus, Trash2, Edit3, Save, X, FileText, Camera,
  Loader2, Upload, Eye, CheckCircle, ArrowUpRight, Hash, ShieldCheck,
  ArrowLeft, Info, Terminal, Zap, Cpu
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { realtime } from '../../services/realtime';
import { StudentProfile as IProfile, Project, Experience, Certification } from '../../types';
import { GlassCard } from '../../components/common/GlassCard';
import { useNavigate } from 'react-router-dom';

export const StudentProfile: React.FC = () => {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const [profile, setProfile] = useState<IProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingMode, setEditingMode] = useState<'header' | 'institutional' | 'academic' | 'skills' | null>(null);
  const [isHoveringBanner, setIsHoveringBanner] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [formData, setFormData] = useState<any>({});
  const [newSkill, setNewSkill] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const resumeInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      api.student.getProfile(user.id).then(data => {
        setProfile(data);
        setLoading(false);
      });

      // Subscribe to real-time profile updates
      const unsubscribe = realtime.subscribe('PROFILE_UPDATED', (data: any) => {
        if (data.userId === user.id) {
          setProfile(data.profile);
        }
      });

      return unsubscribe;
    }
  }, [user]);

  const enterEditMode = (mode: 'header' | 'institutional' | 'academic' | 'skills') => {
    if (!profile) return;
    setEditingMode(mode);
    if (mode === 'header') {
      setFormData({
        name: user?.name || '',
        bio: profile.bio || '',
        github: profile.socialLinks.github || '',
        linkedin: profile.socialLinks.linkedin || '',
        portfolio: profile.socialLinks.portfolio || ''
      });
    } else if (mode === 'institutional') {
      setFormData({
        gender: profile.gender || '',
        branch: profile.academic.branch || '',
        phone: profile.phone || '',
        city: profile.city || '',
        state: profile.state || '',
        address: profile.address || '',
        pincode: profile.pincode || ''
      });
    } else if (mode === 'academic') {
      setFormData({
        cgpa: profile.academic.cgpa,
        tenthPercentage: profile.academic.tenthPercentage,
        twelfthPercentage: profile.academic.twelfthPercentage,
        activeBacklogs: profile.academic.activeBacklogs,
        totalBacklogs: profile.academic.totalBacklogs,
        semesterWiseCgpa: { ...profile.academic.semesterWiseCgpa }
      });
    } else if (mode === 'skills') {
      setFormData({
        skills: [...profile.skills]
      });
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSaveHeader = async () => {
    if (!user || !profile) return;
    setSaving(true);
    setSaveMessage(null);
    try {
      const updatedProfile = await api.student.updateProfile(user.id, {
        bio: formData.bio,
        socialLinks: {
          github: formData.github?.trim() || '',
          linkedin: formData.linkedin?.trim() || '',
          portfolio: formData.portfolio?.trim() || ''
        }
      });
      updateUser({ name: formData.name });
      setProfile(updatedProfile);
      setEditingMode(null);
      setSaveMessage({ type: 'success', text: 'Profile updated successfully!' });
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (err) {
      setSaveMessage({ type: 'error', text: 'Failed to save profile. Please try again.' });
      console.error('Save error:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveInstitutional = async () => {
    if (!user || !profile) return;
    setSaving(true);
    setSaveMessage(null);
    try {
      const result = await api.student.updateProfile(user.id, {
        gender: formData.gender,
        phone: formData.phone,
        city: formData.city,
        state: formData.state,
        address: formData.address,
        pincode: formData.pincode,
        academic: {
          ...profile.academic,
          branch: formData.branch
        }
      });
      setProfile(result);
      setEditingMode(null);
      setSaveMessage({ type: 'success', text: 'Institutional info saved!' });
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (err) {
      setSaveMessage({ type: 'error', text: 'Failed to save. Please try again.' });
      console.error('Save error:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAcademic = async () => {
    if (!user || !profile) return;
    setSaving(true);
    setSaveMessage(null);
    try {
      const sems = Object.values(formData.semesterWiseCgpa).filter(v => v !== null && v !== undefined && v !== '') as number[];
      const calculatedCgpa = sems.length > 0
        ? parseFloat((sems.reduce((a, b) => a + b, 0) / sems.length).toFixed(2))
        : formData.cgpa;

      const result = await api.student.updateProfile(user.id, {
        academic: {
          ...profile.academic,
          cgpa: calculatedCgpa,
          tenthPercentage: formData.tenthPercentage,
          twelfthPercentage: formData.twelfthPercentage,
          activeBacklogs: formData.activeBacklogs,
          totalBacklogs: formData.totalBacklogs,
          semesterWiseCgpa: formData.semesterWiseCgpa
        }
      });
      setProfile(result);
      setEditingMode(null);
      setSaveMessage({ type: 'success', text: 'Academic records updated!' });
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (err) {
      setSaveMessage({ type: 'error', text: 'Failed to save. Please try again.' });
      console.error('Save error:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSkills = async () => {
    if (!user || !profile) return;
    setSaving(true);
    setSaveMessage(null);
    try {
      const result = await api.student.updateProfile(user.id, {
        skills: formData.skills
      });
      setProfile(result);
      setEditingMode(null);
      setSaveMessage({ type: 'success', text: 'Skills updated!' });
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (err) {
      setSaveMessage({ type: 'error', text: 'Failed to save. Please try again.' });
      console.error('Save error:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    if (!user || !profile || !window.confirm('Are you sure you want to remove this project?')) return;
    setSaving(true);
    try {
      const result = await api.student.updateProfile(user.id, {
        projects: profile.projects.filter(p => p.id !== projectId)
      });
      setProfile(result);
    } catch (err) {
      alert('Failed to delete project');
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'banner' | 'resume') => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSaving(true);
    try {
      const url = await api.student.uploadFile(file);
      if (type === 'avatar') {
        updateUser({ avatar: url });
      } else {
        const result = await api.student.updateProfile(user!.id,
          type === 'banner' ? { bannerUrl: url } : { resumeUrl: url }
        );
        setProfile(result);
      }
    } catch (err) {
      alert('Upload failed.');
    } finally {
      setSaving(false);
    }
  };

  const addSkill = () => {
    if (newSkill.trim() && !formData.skills.includes(newSkill.trim())) {
      setFormData({ ...formData, skills: [...formData.skills, newSkill.trim()] });
      setNewSkill('');
    }
  };

  const removeSkill = (skill: string) => {
    setFormData({ ...formData, skills: formData.skills.filter((s: string) => s !== skill) });
  };

  if (loading || !profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] space-y-4">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
        <p className="text-gray-500 font-medium uppercase text-[10px] tracking-widest">Accessing Student Vault...</p>
      </div>
    );
  }

  if (editingMode) {
    return (
      <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in slide-in-from-right-10 duration-500 pb-24 pt-16 lg:pt-0">
        <button
          onClick={() => setEditingMode(null)}
          className="flex items-center gap-2 text-gray-500 hover:text-blue-600 font-semibold text-sm transition-all group"
        >
          <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
          Cancel Updates
        </button>

        <GlassCard className="!p-6 md:!p-8 border-none shadow-xl">
          <div className="flex items-center gap-3 mb-8 border-b border-gray-100 pb-4">
            <div className="w-8 h-8 md:w-10 md:h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center shrink-0">
              <Edit3 size={16} />
            </div>
            <div>
              <h2 className="text-lg md:text-xl font-bold text-gray-900 tracking-tight">
                {editingMode === 'header' ? 'Identity Management' : editingMode === 'institutional' ? 'Institutional Context' : editingMode === 'academic' ? 'Academic Verification' : 'Skills Ecosystem'}
              </h2>
              <p className="text-xs text-gray-500 font-normal">Please ensure accuracy for system validation.</p>
            </div>
          </div>

          <div className="space-y-4 md:space-y-6">
            {editingMode === 'header' ? (
              <>
                <EditField label="Full Name" value={formData.name} onChange={(v) => setFormData({ ...formData, name: v })} />
                <div className="space-y-1">
                  <label className="text-[10px] font-normal uppercase text-gray-400 tracking-widest">Professional Summary</label>
                  <textarea
                    className="w-full bg-gray-50/50 border border-gray-100 rounded-xl p-3 md:p-4 text-gray-900 focus:border-blue-500 focus:bg-white transition-all h-28 outline-none font-normal text-sm"
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <EditField icon={<Github size={16} />} label="GitHub" value={formData.github} onChange={(v) => setFormData({ ...formData, github: v })} />
                  <EditField icon={<Linkedin size={16} />} label="LinkedIn" value={formData.linkedin} onChange={(v) => setFormData({ ...formData, linkedin: v })} />
                  <div className="md:col-span-2">
                    <EditField icon={<Globe size={16} />} label="Portfolio" value={formData.portfolio} onChange={(v) => setFormData({ ...formData, portfolio: v })} />
                  </div>
                </div>
              </>
            ) : editingMode === 'institutional' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <EditField label="Gender" value={formData.gender} onChange={(v) => setFormData({ ...formData, gender: v })} />
                <EditField label="Department" value={formData.branch} onChange={(v) => setFormData({ ...formData, branch: v })} />
                <EditField label="Phone" value={formData.phone} onChange={(v) => setFormData({ ...formData, phone: v })} />
                <EditField label="City" value={formData.city} onChange={(v) => setFormData({ ...formData, city: v })} />
                <EditField label="State" value={formData.state} onChange={(v) => setFormData({ ...formData, state: v })} />
                <EditField label="Pincode" value={formData.pincode} onChange={(v) => setFormData({ ...formData, pincode: v })} />
                <div className="md:col-span-2 space-y-1">
                  <label className="text-[10px] font-normal uppercase text-gray-400 tracking-widest">Residential Address</label>
                  <textarea
                    className="w-full bg-gray-50/50 border border-gray-100 rounded-xl p-3 h-20 focus:border-blue-500 transition-all outline-none font-normal text-sm"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  />
                </div>
              </div>
            ) : editingMode === 'academic' ? (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                  <EditField label="10th Marks (%)" value={formData.tenthPercentage} onChange={(v) => setFormData({ ...formData, tenthPercentage: parseFloat(v) })} />
                  <EditField label="12th Marks (%)" value={formData.twelfthPercentage} onChange={(v) => setFormData({ ...formData, twelfthPercentage: parseFloat(v) })} />
                  <EditField label="Active Backlogs" value={formData.activeBacklogs} onChange={(v) => setFormData({ ...formData, activeBacklogs: parseInt(v) || 0 })} />
                  <EditField label="History of Backlogs" value={formData.totalBacklogs} onChange={(v) => setFormData({ ...formData, totalBacklogs: parseInt(v) || 0 })} />
                </div>

                <div className="space-y-3">
                  <div className="flex flex-col md:flex-row justify-between md:items-end border-b border-gray-100 pb-1 gap-1">
                    <label className="text-[10px] font-bold uppercase text-gray-400 tracking-widest">Semester Performance Matrix</label>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => (
                      <div key={sem} className="bg-gray-50 p-2 rounded-xl border border-gray-100 space-y-1">
                        <label className="text-[9px] font-normal text-gray-400 uppercase">Sem {sem}</label>
                        <input
                          type="number" step="0.01" max="10"
                          className="w-full bg-white border border-gray-200 rounded-lg p-2 font-normal text-sm outline-none focus:border-blue-500 transition-all"
                          value={formData.semesterWiseCgpa[sem] || ''}
                          onChange={(e) => setFormData({
                            ...formData,
                            semesterWiseCgpa: { ...formData.semesterWiseCgpa, [sem]: e.target.value === '' ? '' : parseFloat(e.target.value) }
                          })}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex gap-2">
                  <input
                    className="flex-1 bg-gray-50/50 border border-gray-100 rounded-xl py-3 px-4 text-gray-900 font-normal focus:border-blue-500 outline-none text-sm"
                    placeholder="E.g. Docker, Python, Figma..."
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addSkill()}
                  />
                  <button onClick={addSkill} className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold text-sm shadow-md hover:bg-blue-700 transition-all">Add</button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.skills.map((skill: string) => (
                    <div key={skill} className="bg-white border border-blue-100 text-blue-600 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm">
                      {skill}
                      <button onClick={() => removeSkill(skill)} className="hover:text-red-500"><X size={14} /></button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-6 flex flex-col md:flex-row gap-3">
              <button onClick={() => setEditingMode(null)} className="order-2 md:order-1 flex-1 py-3 bg-gray-100 text-gray-600 font-normal rounded-xl hover:bg-gray-200 transition-all text-sm">Discard</button>
              <button
                onClick={
                  editingMode === 'header' ? handleSaveHeader :
                    editingMode === 'institutional' ? handleSaveInstitutional :
                      editingMode === 'academic' ? handleSaveAcademic :
                        handleSaveSkills
                }
                disabled={saving}
                className="order-1 md:order-2 flex-[2] py-3 bg-blue-600 text-white font-bold rounded-xl shadow-lg flex items-center justify-center gap-2 hover:bg-blue-700 transition-all text-sm disabled:opacity-50"
              >
                {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />} Confirm Changes
              </button>
            </div>
          </div>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="space-y-10 md:space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-1000 pb-24 pt-16 lg:pt-0">
      {/* 1. Header Section */}
      <div className="relative group max-w-5xl mx-auto w-full px-4 md:px-0">
        <div
          className="h-40 md:h-52 rounded-t-2xl md:rounded-t-3xl bg-gray-200 shadow-lg overflow-hidden relative cursor-pointer"
          onMouseEnter={() => setIsHoveringBanner(true)}
          onMouseLeave={() => setIsHoveringBanner(false)}
          onClick={() => bannerInputRef.current?.click()}
        >
          {profile.bannerUrl ? (
            <img src={profile.bannerUrl} alt="Banner" className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-blue-600 via-indigo-600 to-slate-900"></div>
          )}

          <div className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity duration-300 ${isHoveringBanner ? 'opacity-100' : 'opacity-0'}`}>
            <div className="bg-white/20 backdrop-blur-md p-3 rounded-full text-white border border-white/40 flex items-center gap-2 shadow-2xl scale-90 md:scale-100">
              <Camera size={20} />
              <span className="font-normal uppercase tracking-widest text-[10px]">Update Profile Theme</span>
            </div>
          </div>
          <input type="file" ref={bannerInputRef} className="hidden" onChange={(e) => handleFileUpload(e, 'banner')} />
        </div>

        <div className="px-4 md:px-8 -mt-6">
          <GlassCard className="!p-0 border-none shadow-xl overflow-visible relative">
            <div className="p-6 md:p-8 flex flex-col">

              <div className="flex flex-col lg:flex-row items-start lg:items-end gap-6 relative">
                <div className="relative -mt-16 md:-mt-20 lg:-mt-24 z-10 shrink-0 mx-auto lg:mx-0">
                  <div
                    className="w-24 h-24 md:w-32 md:h-32 lg:w-40 lg:h-40 rounded-2xl md:rounded-3xl border-[4px] md:border-[6px] border-white shadow-xl overflow-hidden bg-white group/pfp cursor-pointer relative transition-transform duration-500 hover:scale-105"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <img src={user?.avatar} alt={user?.name} className="w-full h-full object-cover group-hover/pfp:scale-105 transition-all duration-700" />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/pfp:opacity-100 transition-opacity bg-black/40 text-white">
                      <Camera size={20} />
                    </div>
                  </div>
                  <input type="file" ref={fileInputRef} className="hidden" onChange={(e) => handleFileUpload(e, 'avatar')} />
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 md:w-8 md:h-8 bg-green-500 border-2 md:border-4 border-white rounded-full shadow-lg flex items-center justify-center text-white">
                    <CheckCircle size={12} />
                  </div>
                </div>

                <div className="flex-1 w-full flex flex-col gap-4 text-center lg:text-left">
                  <div className="flex flex-col md:flex-row items-center lg:items-end justify-between w-full border-b border-gray-100/50 pb-4 gap-2">
                    <div className="flex-1 min-w-0 w-full">
                      <h1 className="text-xl md:text-3xl lg:text-4xl font-bold text-gray-900 tracking-tight uppercase leading-tight">
                        {user?.name}
                      </h1>
                      <div className="text-blue-600 font-normal tracking-widest text-xs md:text-sm uppercase whitespace-nowrap mt-1">
                        # {user?.rollNumber}
                      </div>
                    </div>
                    <button
                      onClick={() => enterEditMode('header')}
                      className="p-2 md:p-3 bg-blue-50 text-blue-600 border border-blue-100 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-sm active:scale-95"
                    >
                      <Edit3 size={18} />
                    </button>
                  </div>

                  <div className="flex flex-wrap justify-center lg:justify-start gap-2 md:gap-3">
                    <SocialLink type="linkedin" href={profile.socialLinks.linkedin} />
                    <SocialLink type="github" href={profile.socialLinks.github} />
                    <SocialLink type="portfolio" href={profile.socialLinks.portfolio} />
                  </div>
                </div>

                <div className="w-full lg:w-auto mt-2 lg:mt-0">
                  <div className="bg-slate-50/50 backdrop-blur-xl rounded-2xl p-3 md:p-4 flex flex-col sm:flex-row items-center gap-3 md:gap-4 border border-white shadow-inner">
                    {profile.resumeUrl ? (
                      <>
                        <div className="p-2 md:p-3 bg-blue-600 text-white rounded-xl shadow-lg shrink-0">
                          <FileText size={18} />
                        </div>
                        <div className="text-center sm:text-left min-w-0">
                          <p className="text-[8px] font-normal uppercase tracking-widest text-gray-400">Asset Repository</p>
                          <p className="text-[10px] md:text-xs font-normal text-gray-800 uppercase truncate">CV_ACTIVE_V2.PDF</p>
                        </div>
                        <div className="flex gap-2 ml-auto w-full sm:w-auto">
                          <a href={profile.resumeUrl} target="_blank" className="flex-1 sm:flex-none p-2 md:p-3 bg-white text-gray-600 rounded-xl hover:bg-gray-50 transition-all shadow-sm border border-gray-100 flex items-center justify-center"><Eye size={16} /></a>
                          <button onClick={() => resumeInputRef.current?.click()} className="flex-[2] sm:flex-none flex items-center justify-center gap-2 px-4 md:px-6 py-2 md:py-3 bg-gray-900 text-white font-bold rounded-xl shadow-lg hover:bg-black transition-all text-xs"><Upload size={14} /> SYNC</button>
                        </div>
                      </>
                    ) : (
                      <button onClick={() => resumeInputRef.current?.click()} className="w-full px-6 md:px-10 py-3 md:py-4 bg-red-600 text-white font-bold rounded-2xl hover:bg-red-700 transition-all shadow-xl flex items-center justify-center gap-3 text-sm">
                        <Upload size={18} /> UPLOAD CV
                      </button>
                    )}
                    <input type="file" ref={resumeInputRef} accept=".pdf" className="hidden" onChange={(e) => handleFileUpload(e, 'resume')} />
                  </div>

                  <div className="mt-4 flex justify-end w-full">
                    <button
                      onClick={() => {
                        const newPass = prompt("Enter new password:");
                        if (newPass) {
                          if (newPass.length < 6) return alert("Password must be at least 6 characters");
                          api.auth.changePassword(newPass)
                            .then(() => alert("Password updated successfully"))
                            .catch((err: any) => alert("Failed: " + err.message));
                        }
                      }}
                      className="text-[10px] font-bold text-gray-400 hover:text-blue-600 uppercase tracking-widest flex items-center gap-2 transition-colors border border-dashed border-gray-200 px-3 py-1.5 rounded-lg hover:bg-blue-50 hover:border-blue-200"
                    >
                      <ShieldCheck size={14} /> Update Credentials
                    </button>
                  </div>
                </div>
              </div>

              <div className="w-full border-t border-gray-100/50 mt-6 pt-6 text-center lg:text-left">
                <p className="text-sm md:text-base lg:text-lg text-gray-700 font-normal leading-relaxed w-full tracking-tight break-words">
                  {profile.bio || "Define your professional narrative. Use the edit function to build your bio."}
                </p>
              </div>
            </div>
          </GlassCard>
        </div>
      </div>

      {/* Main Content Area - Strictly Vertical Stack */}
      <div className="flex flex-col space-y-10 md:space-y-12 px-4 md:px-8 max-w-5xl mx-auto w-full">

        {/* 1. Academic Matrix - Full Width */}
        <Section title="Academic Matrix" accent="indigo" onEdit={() => enterEditMode('academic')}>
          <div className="flex flex-col space-y-6">
            <div className="relative overflow-hidden rounded-2xl md:rounded-3xl p-6 md:p-10 bg-gradient-to-br from-indigo-600 to-blue-900 text-white shadow-xl">
              <div className="relative z-10">
                <p className="text-[8px] md:text-[10px] font-normal uppercase tracking-[0.3em] opacity-70 mb-1">Aggregate CGPA</p>
                <h4 className="text-4xl md:text-6xl font-bold tracking-tighter leading-none mb-3 md:mb-6">{profile.academic.cgpa}</h4>
                <div className="flex items-center gap-2 text-[10px] font-normal bg-white/20 w-fit px-4 py-1.5 rounded-xl border border-white/30 uppercase tracking-widest shadow-lg">
                  <Award size={16} className="text-amber-400" /> Tier 1 Candidate Verified
                </div>
              </div>
              <ShieldCheck className="absolute -right-6 -bottom-6 w-32 h-32 md:w-56 md:h-56 opacity-10 rotate-12" />
            </div>
            {/* Flattened Stat Cards for strict single-column logic per user request */}
            <div className="flex flex-col space-y-4">
              <StatCard label="10th Percentage" value={`${profile.academic.tenthPercentage}%`} />
              <StatCard label="12th Percentage" value={`${profile.academic.twelfthPercentage}%`} />
              <StatCard label="Active Backlogs" value={profile.academic.activeBacklogs} status={profile.academic.activeBacklogs > 0 ? 'danger' : 'success'} />
              <StatCard label="Backlog History" value={profile.academic.totalBacklogs} />
            </div>
          </div>
        </Section>

        {/* 2. Skills Ecosystem - Full Width */}
        <Section title="Skills Ecosystem" accent="blue" onEdit={() => enterEditMode('skills')}>
          <div className="flex flex-wrap gap-2">
            {profile.skills.length > 0 ? profile.skills.map(skill => (
              <span key={skill} className="px-6 py-3 bg-blue-50/50 text-blue-600 rounded-2xl text-[11px] font-bold uppercase tracking-widest border border-blue-100 shadow-sm flex items-center gap-2 hover:bg-blue-600 hover:text-white transition-all duration-300">
                <Zap size={12} className="fill-current" />
                {skill}
              </span>
            )) : (
              <p className="text-xs text-gray-400 italic font-normal">Define your technical footprint...</p>
            )}
          </div>
        </Section>

        {/* 3. Certified Credentials - Full Width */}
        <Section title="Certified Credentials" accent="indigo">
          <div className="flex flex-col space-y-4">
            {profile.certifications.length > 0 ? profile.certifications.map(cert => (
              <div key={cert.id} className="p-6 bg-white border border-gray-100 rounded-3xl hover:shadow-xl transition-all group/cert flex items-center justify-between gap-6">
                <div className="flex items-center gap-6">
                  <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shrink-0 group-hover/cert:bg-indigo-600 group-hover/cert:text-white transition-all shadow-sm">
                    <Award size={28} />
                  </div>
                  <div>
                    <h4 className="text-sm md:text-base font-bold text-gray-900 uppercase tracking-tight mb-1">{cert.title}</h4>
                    <p className="text-[10px] md:text-xs font-normal text-gray-400 uppercase tracking-widest">{cert.organization} • Issued {cert.issueDate}</p>
                  </div>
                </div>
                {cert.credentialUrl && (
                  <a href={cert.credentialUrl} target="_blank" className="p-3 bg-gray-50 text-gray-400 hover:text-blue-600 hover:bg-white rounded-xl border border-transparent hover:border-blue-100 transition-all shadow-sm">
                    <ExternalLink size={20} />
                  </a>
                )}
              </div>
            )) : (
              <p className="text-xs text-gray-400 text-center py-4">No verified credentials</p>
            )}
            <button className="w-full py-5 bg-indigo-50 text-indigo-600 rounded-2xl text-[10px] font-bold uppercase tracking-widest border border-indigo-100 hover:bg-indigo-600 hover:text-white transition-all shadow-sm flex items-center justify-center gap-2">
              <Plus size={16} /> Register New Certificate
            </button>
          </div>
        </Section>

        {/* 4. Professional Narrative - Full Width */}
        <Section title="Professional Narrative" accent="slate">
          <div className="flex flex-col space-y-6">
            {profile.experiences.length > 0 ? profile.experiences.map(exp => (
              <div key={exp.id} className="p-8 bg-white border border-gray-100 rounded-3xl flex flex-col md:flex-row gap-6 hover:shadow-2xl transition-all group">
                <div className="w-16 h-16 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center shrink-0 border border-slate-100 group-hover:bg-slate-900 group-hover:text-white transition-all duration-500 shadow-sm">
                  <Briefcase size={32} />
                </div>
                <div className="flex-1">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2">
                    <h4 className="text-lg font-bold text-gray-900 uppercase tracking-tight">{exp.role}</h4>
                    <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-100 uppercase tracking-widest">{exp.employmentType}</span>
                  </div>
                  <p className="text-xs font-bold text-indigo-600 mb-4 uppercase tracking-widest">{exp.companyName} • {exp.startDate} - {exp.endDate || 'Present'}</p>
                  <p className="text-sm text-gray-600 font-normal mb-6 leading-relaxed">{exp.description}</p>
                  <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-50">
                    {exp.skillsUsed.map(s => <span key={s} className="text-[9px] font-bold text-gray-400 bg-gray-50 px-3 py-1 rounded-lg uppercase tracking-widest border border-gray-100">{s}</span>)}
                  </div>
                </div>
              </div>
            )) : (
              <div className="text-center py-12 glass rounded-3xl border-dashed border-2 border-gray-100">
                <p className="text-xs text-gray-400 uppercase tracking-widest font-normal">No professional history documented</p>
              </div>
            )}
            <button className="w-full py-6 border-2 border-dashed border-gray-100 rounded-3xl flex items-center justify-center gap-3 text-[11px] font-bold text-gray-400 uppercase tracking-[0.2em] hover:border-blue-300 hover:text-blue-500 hover:bg-blue-50/30 transition-all">
              <Plus size={20} /> Document Professional Experience
            </button>
          </div>
        </Section>

        {/* 5. Demographics - Full Width */}
        <Section title="Demographics" accent="blue" onEdit={() => enterEditMode('institutional')}>
          <div className="flex flex-col space-y-6">
            <div className="flex flex-col space-y-6">
              <InfoRow label="Institutional Dept." value={profile.academic.branch} />
              <div className="h-px bg-gray-100"></div>
              <InfoRow label="Gender Identity" value={profile.gender} />
              <div className="h-px bg-gray-100"></div>
              <InfoRow icon={<Mail size={16} />} label="Professional Email" value={user?.email || ''} copyable />
              <div className="h-px bg-gray-100"></div>
              <InfoRow icon={<Phone size={16} />} label="Contact String" value={profile.phone} />
              <div className="h-px bg-gray-100"></div>
              <InfoRow icon={<MapPin size={16} />} label="Base Location" value={`${profile.city}, ${profile.state}`} />
              <div className="p-6 bg-slate-50/50 rounded-3xl text-sm text-gray-500 font-normal leading-relaxed uppercase border border-slate-100 tracking-tight break-words shadow-inner">
                Residential Address: {profile.address}, {profile.pincode}
              </div>
            </div>
          </div>
        </Section>

        {/* 6. Innovation Portfolio - Strict Vertical Stack of Project Cards */}
        <Section title="Innovation Portfolio" accent="indigo">
          <div className="flex flex-col space-y-10">
            {profile.projects.length > 0 ? (
              <div className="flex flex-col space-y-10">
                {profile.projects.map((proj) => (
                  <GlassCard key={proj.id} className="group/proj relative flex flex-col !p-0 border border-white/40 overflow-hidden hover:shadow-2xl transition-all duration-500 hover:-translate-y-1">
                    <div className="aspect-[21/9] relative overflow-hidden bg-slate-900">
                      {proj.thumbnailUrl ? (
                        <img src={proj.thumbnailUrl} alt={proj.title} className="w-full h-full object-cover opacity-80 group-hover/proj:opacity-40 transition-all duration-700 group-hover/proj:scale-105" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-blue-600 to-indigo-900 flex items-center justify-center p-8">
                          <Terminal size={64} className="text-white/20 group-hover/proj:scale-110 transition-transform duration-500" />
                        </div>
                      )}
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/proj:opacity-100 transition-all duration-300">
                        <div className="flex gap-4">
                          <a href={proj.githubUrl} target="_blank" className="p-4 bg-white text-gray-900 rounded-2xl hover:bg-blue-600 hover:text-white transition-all shadow-2xl scale-110"><Github size={24} /></a>
                          {proj.liveUrl && <a href={proj.liveUrl} target="_blank" className="p-4 bg-blue-600 text-white rounded-2xl hover:bg-white hover:text-blue-600 transition-all shadow-2xl scale-110"><Globe size={24} /></a>}
                        </div>
                      </div>
                      <div className="absolute top-6 right-6 z-20">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDeleteProject(proj.id); }}
                          className="p-3 bg-red-500/90 backdrop-blur-md text-white rounded-xl shadow-xl opacity-0 group-hover/proj:opacity-100 transition-all hover:bg-red-600"
                        >
                          <Trash2 size={20} />
                        </button>
                      </div>
                    </div>

                    <div className="p-8 md:p-10">
                      <div className="flex items-center gap-3 mb-4">
                        <span className="text-[9px] font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-100 uppercase tracking-[0.2em]">Project Asset</span>
                        <span className="text-[9px] font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100 uppercase tracking-[0.2em]">{proj.startDate}</span>
                      </div>
                      <h4 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4 group-hover/proj:text-blue-600 transition-colors tracking-tight uppercase leading-none">{proj.title}</h4>
                      <p className="text-base text-gray-500 font-normal leading-relaxed mb-8">{proj.shortDescription}</p>

                      <div className="flex flex-wrap gap-2 pt-6 border-t border-gray-100">
                        {proj.techStack.map(tech => (
                          <span key={tech} className="text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-gray-50 px-4 py-1.5 rounded-xl border border-gray-100 group-hover/proj:text-indigo-600 group-hover/proj:bg-indigo-50 group-hover/proj:border-indigo-100 transition-all">
                            {tech}
                          </span>
                        ))}
                      </div>
                    </div>
                  </GlassCard>
                ))}
              </div>
            ) : (
              <div className="py-20 text-center glass border-2 border-dashed border-gray-100 rounded-[3rem]">
                <p className="text-gray-400 text-sm font-normal uppercase tracking-widest">No innovation assets registered in repository</p>
              </div>
            )}

            <button
              onClick={() => navigate('/student/projects/add')}
              className="w-full py-16 border-2 border-dashed border-gray-100 rounded-[3rem] flex flex-col items-center justify-center gap-6 group/add transition-all hover:border-blue-600 hover:bg-blue-50/50"
            >
              <div className="w-20 h-20 bg-white shadow-2xl rounded-[2rem] flex items-center justify-center text-gray-300 group-hover/add:text-blue-600 group-hover/add:scale-110 transition-all border border-gray-50">
                <Plus size={40} />
              </div>
              <span className="text-xs font-bold uppercase tracking-[0.4em] text-gray-400 group-hover/add:text-blue-600">Register New Deployment</span>
            </button>
          </div>
        </Section>

      </div>

      {saving && (
        <div className="fixed bottom-10 right-10 z-50 animate-in slide-in-from-bottom-10">
          <div className="bg-white/95 backdrop-blur-3xl shadow-[0_20px_50px_rgba(0,0,0,0.1)] rounded-full px-10 py-5 flex items-center gap-5 border border-blue-100">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            <span className="font-bold text-gray-900 uppercase tracking-[0.2em] text-[11px]">Encrypting & Persisting Securely...</span>
          </div>
        </div>
      )}

      {saveMessage && (
        <div className={`fixed bottom-10 right-10 z-50 animate-in slide-in-from-bottom-10 ${saveMessage.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
          <div className={`backdrop-blur-3xl shadow-[0_20px_50px_rgba(0,0,0,0.1)] rounded-full px-10 py-5 flex items-center gap-5 border ${saveMessage.type === 'success' ? 'bg-green-50/95 border-green-200' : 'bg-red-50/95 border-red-200'}`}>
            <span className="font-bold uppercase tracking-[0.2em] text-[11px]">{saveMessage.text}</span>
          </div>
        </div>
      )}
    </div>
  );
};

// --- REDESIGNED SUB-COMPONENTS FOR STRICT VERTICAL STACK ---

const Section: React.FC<{
  title: string;
  accent?: 'blue' | 'indigo' | 'slate';
  onEdit?: () => void;
  children: React.ReactNode
}> = ({ title, accent = 'blue', onEdit, children }) => {
  const colors = { blue: 'bg-blue-600', indigo: 'bg-indigo-600', slate: 'bg-slate-800' };
  return (
    <GlassCard className="relative group/sec !rounded-[2.5rem] md:!rounded-[3rem] !p-8 md:!p-12 shadow-2xl w-full border border-white/40">
      <div className="flex justify-between items-center mb-10 md:mb-12">
        <div className="flex items-center gap-4 md:gap-6">
          <div className={`w-3 md:w-4 h-8 md:h-12 ${colors[accent]} rounded-full shadow-lg`}></div>
          <h3 className="text-2xl md:text-3xl font-black text-gray-900 uppercase tracking-tighter leading-none">{title}</h3>
        </div>
        {onEdit && (
          <button onClick={onEdit} className="p-3 md:p-4 bg-blue-50 text-blue-600 border border-blue-100 rounded-2xl hover:bg-blue-600 hover:text-white transition-all shadow-md active:scale-95 flex items-center justify-center">
            <Edit3 size={24} />
          </button>
        )}
      </div>
      <div className="w-full">
        {children}
      </div>
    </GlassCard>
  );
};

const InfoRow: React.FC<{ icon?: React.ReactNode; label: string; value: string; copyable?: boolean }> = ({ icon, label, value, copyable }) => (
  <div className="flex items-start gap-6 md:gap-8 group/row w-full">
    {icon ? (
      <div className="p-4 bg-white border border-gray-100 rounded-2xl text-blue-600 group-hover/row:bg-blue-600 group-hover/row:text-white transition-all shadow-sm shrink-0 flex items-center justify-center">
        {/* Fixed: Use React.isValidElement and cast to any to avoid property 'size' error */}
        {React.isValidElement(icon) ? React.cloneElement(icon as React.ReactElement<any>, { size: 24 }) : icon}
      </div>
    ) : (
      <div className="w-3 h-3 bg-blue-200 rounded-full mt-4 shrink-0"></div>
    )}
    <div className="flex-1 min-w-0">
      <p className="text-[10px] font-bold uppercase text-gray-400 tracking-[0.2em] mb-2">{label}</p>
      <div className="flex items-center gap-4">
        <p className="text-base md:text-xl font-medium text-gray-900 truncate tracking-tight">{value || "NOT SYNC'D"}</p>
        {copyable && <button className="opacity-0 group-hover/row:opacity-100 p-2 text-blue-500 hover:scale-125 transition-all"><Plus size={18} /></button>}
      </div>
    </div>
  </div>
);

const EditField: React.FC<{ icon?: React.ReactNode, label: string, value: any, onChange: (v: string) => void, placeholder?: string }> = ({ icon, label, value, onChange, placeholder }) => (
  <div className="flex flex-col gap-2">
    <label className="text-[10px] font-bold uppercase text-gray-400 tracking-[0.2em] ml-2">{label}</label>
    <div className="relative flex items-center">
      {icon && <div className="absolute left-5 text-gray-400">{icon}</div>}
      <input
        className={`w-full bg-gray-50/50 border border-gray-100 rounded-2xl py-4 px-6 ${icon ? 'pl-14' : ''} text-gray-900 font-medium focus:border-blue-500 focus:bg-white focus:ring-8 focus:ring-blue-100/50 transition-all outline-none text-base shadow-sm`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  </div>
);

const StatCard: React.FC<{ label: string; value: any; status?: 'success' | 'danger' | 'default' }> = ({ label, value, status = 'default' }) => {
  const statusColors = { success: 'text-green-600', danger: 'text-red-600', default: 'text-gray-900' };
  return (
    <div className="p-6 md:p-8 bg-white border border-gray-50 rounded-3xl shadow-sm hover:shadow-xl transition-all group/stat hover:-translate-y-1 w-full flex items-center justify-between gap-4">
      <p className="text-[11px] font-bold uppercase text-gray-400 tracking-[0.2em] group-hover/stat:text-blue-500 transition-colors">{label}</p>
      <p className={`text-xl md:text-3xl font-black tracking-tighter ${statusColors[status]}`}>{value}</p>
    </div>
  );
};

const SocialLink: React.FC<{ type: 'linkedin' | 'github' | 'portfolio'; href?: string }> = ({ type, href }) => {
  const icons = { linkedin: <Linkedin size={24} />, github: <Github size={24} />, portfolio: <Globe size={24} /> };

  // Only render if href is provided and not empty
  if (!href || href.trim() === '') {
    return (
      <div className="p-4 md:p-5 bg-gray-100 rounded-2xl md:rounded-3xl border border-gray-100 shadow-sm text-gray-300 flex items-center justify-center cursor-not-allowed opacity-50" title={`${type} not added`}>
        {icons[type]}
      </div>
    );
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="p-4 md:p-5 bg-white rounded-2xl md:rounded-3xl border border-gray-100 shadow-sm text-blue-600 hover:shadow-xl hover:-translate-y-1 hover:border-blue-100 hover:bg-blue-50/10 transition-all active:scale-90 flex items-center justify-center"
      title={`Open ${type}`}
    >
      {icons[type]}
    </a>
  );
};
