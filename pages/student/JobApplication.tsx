
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, CheckCircle, AlertCircle, FileText, Send, Building2, Briefcase, GraduationCap, ShieldCheck, XCircle } from 'lucide-react';
import { api } from '../../services/api';
import { Job, StudentProfile, ApplicationStatus } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { GlassCard } from '../../components/common/GlassCard';

export const JobApplication: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [job, setJob] = useState<Job | null>(null);
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [applied, setApplied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Custom Form Fields
  const [hiringReason, setHiringReason] = useState('');
  const [coverLetter, setCoverLetter] = useState('');

  useEffect(() => {
    if (!id || !user) return;
    
    const loadData = async () => {
      try {
        const [jobData, profileData] = await Promise.all([
          api.jobs.getById(id),
          api.student.getProfile(user.id)
        ]);
        setJob(jobData || null);
        setProfile(profileData);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [id, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!job || !profile || !user) return;
    setError(null);

    setSubmitting(true);
    try {
      await api.student.applyToJob({
        jobId: job.id,
        studentId: user.id,
        companyName: job.companyName,
        role: job.role,
        hiringReason,
        coverLetter
      });
      setApplied(true);
      setTimeout(() => navigate('/student/applications'), 2000);
    } catch (err: any) {
      setError(err.message || 'Transmission error. Please verify network connectivity.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
        <p className="text-[10px] text-gray-400 font-normal uppercase tracking-widest">Synchronizing Transmission Buffer...</p>
      </div>
    );
  }

  if (!job || !profile) {
    return (
      <div className="max-w-2xl mx-auto text-center py-20 glass rounded-[2rem] border-red-100">
        <AlertCircle size={48} className="mx-auto text-red-500 mb-4" />
        <h2 className="text-xl font-bold text-gray-900 mb-2">Resource Mismatch</h2>
        <p className="text-gray-500 font-normal mb-8">The requested job parameters are no longer active in the ledger.</p>
        <button onClick={() => navigate('/student/jobs')} className="px-8 py-3 bg-gray-900 text-white font-bold rounded-xl shadow-lg">Return to Discover</button>
      </div>
    );
  }

  const isEligible = profile.academic.cgpa >= job.criteria.minCgpa && profile.academic.activeBacklogs <= job.criteria.backlogs;

  if (applied) {
    return (
      <div className="max-w-2xl mx-auto py-24 text-center animate-in zoom-in duration-500">
        <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl border-4 border-white">
          <CheckCircle size={48} />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2 tracking-tight">Application Transmitted</h2>
        <p className="text-gray-500 font-normal mb-8 uppercase tracking-widest text-[10px]">Your specialized dossier has been shared with {job.companyName}</p>
        <p className="text-blue-600 font-bold animate-pulse">Routing to Applications Dashboard...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-24 px-4 md:px-0">
      <button 
        onClick={() => navigate('/student/jobs')}
        className="flex items-center gap-2 text-gray-500 hover:text-blue-600 font-bold transition-all group text-sm"
      >
        <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
        Discard & Exit
      </button>

      {error && (
        <div className="p-5 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-4 text-red-700 animate-in slide-in-from-top-4">
          <XCircle size={20} className="shrink-0 mt-1" />
          <div>
            <p className="text-sm font-bold uppercase tracking-widest mb-1">Policy Violation</p>
            <p className="text-sm font-normal">{error}</p>
          </div>
        </div>
      )}

      {/* 1. Job Details Card */}
      <GlassCard className="border-none shadow-xl overflow-hidden relative !p-0">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 to-indigo-600"></div>
        <div className="p-8 md:p-10">
          <div className="flex flex-col md:flex-row gap-8 items-start">
            <div className="w-20 h-20 rounded-2xl bg-white border-2 border-gray-100 flex items-center justify-center shrink-0 shadow-lg p-2">
              <img src={job.logo} alt={job.companyName} className="w-full h-full object-contain" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
                  {job.domain}
                </span>
              </div>
              <h1 className="text-2xl md:text-4xl font-bold text-gray-900 tracking-tight leading-none mb-2">{job.role}</h1>
              <p className="text-lg font-normal text-gray-500 mb-6">{job.companyName}</p>
              
              <div className="flex flex-wrap gap-x-8 gap-y-4 border-t border-gray-100 pt-6">
                <InfoItem label="Compensation" value={job.package} />
                <InfoItem label="Location" value={job.location} />
                <InfoItem label="Deadline" value={job.deadline} isUrgent />
              </div>
            </div>
          </div>
          
          <div className="mt-8 space-y-4">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Professional Context</h3>
            <p className="text-gray-600 leading-relaxed font-normal text-sm md:text-base">{job.fullDescription}</p>
          </div>

          <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-4">
             <div className="p-5 bg-gray-50/50 rounded-2xl border border-gray-100">
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">Academic Benchmark</h4>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-normal text-gray-600">Required CGPA</span>
                  <span className="text-sm font-bold text-gray-900">{job.criteria.minCgpa}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-normal text-gray-600">Max Backlogs</span>
                  <span className="text-sm font-bold text-gray-900">{job.criteria.backlogs}</span>
                </div>
             </div>
             <div className={`p-5 rounded-2xl border ${isEligible ? 'bg-green-50/50 border-green-100 text-green-700' : 'bg-red-50/50 border-red-100 text-red-700'}`}>
                <div className="flex items-center gap-2 mb-3">
                  {isEligible ? <ShieldCheck size={16} /> : <AlertCircle size={16} />}
                  <h4 className="text-[10px] font-bold uppercase tracking-widest">Eligibility Status</h4>
                </div>
                <p className="text-sm font-bold">{isEligible ? 'Verified Candidate Match' : 'Academic Profile Mismatch'}</p>
                <p className="text-[10px] mt-1 font-normal opacity-70">Based on system academic verification</p>
             </div>
          </div>
        </div>
      </GlassCard>

      {/* 2. Application Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <GlassCard className="border-none shadow-xl !p-8 md:!p-10">
          <div className="flex items-center gap-4 mb-10 border-b border-gray-100 pb-6">
            <div className="w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-blue-100">
              <FileText size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Digital Submission Ledger</h2>
              <p className="text-xs text-gray-500 font-normal">Fields synchronized directly from your Secure Profile.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12 opacity-60">
            <StaticField label="Candidate Name" value={user?.name || 'N/A'} icon={<Building2 size={14}/>} />
            <StaticField label="Institutional UIN" value={user?.rollNumber || 'N/A'} icon={<Briefcase size={14}/>} />
            <StaticField label="Academic Stream" value={profile?.academic.branch || 'N/A'} icon={<GraduationCap size={14}/>} />
            <StaticField label="Verified CGPA" value={profile?.academic.cgpa.toString() || 'N/A'} icon={<ShieldCheck size={14}/>} />
          </div>

          <div className="space-y-8">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-bold uppercase text-gray-400 tracking-widest ml-1">Value Proposition (Hireability Statement)</label>
                <span className="text-[10px] font-bold text-blue-500 uppercase">Required</span>
              </div>
              <textarea 
                required
                className="w-full bg-gray-50/50 border border-gray-100 rounded-2xl p-5 md:p-6 text-gray-900 focus:border-blue-500 focus:bg-white transition-all h-36 outline-none font-normal text-sm shadow-inner"
                placeholder="Briefly state why you are the optimal choice for this specific company and role..."
                value={hiringReason}
                onChange={(e) => setHiringReason(e.target.value)}
              />
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-bold uppercase text-gray-400 tracking-widest ml-1">Professional Narrative / Intro Letter</label>
              <textarea 
                className="w-full bg-gray-50/50 border border-gray-100 rounded-2xl p-5 md:p-6 text-gray-900 focus:border-blue-500 focus:bg-white transition-all h-56 outline-none font-normal text-sm shadow-inner"
                placeholder="Expand on your journey, achievements, and how you align with corporate values..."
                value={coverLetter}
                onChange={(e) => setCoverLetter(e.target.value)}
              />
            </div>
          </div>

          <div className="mt-12 pt-10 border-t border-gray-100 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex items-center gap-4 text-gray-500 bg-gray-50/50 p-4 rounded-2xl border border-gray-100 flex-1 w-full md:w-auto">
               <div className="w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center shrink-0 border border-gray-100">
                  <FileText size={20} className="text-blue-600" />
               </div>
               <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Attached Asset</p>
                  <p className="text-xs font-bold text-gray-700 truncate">PROFESSIONAL_CV_2024.PDF</p>
               </div>
               <div className="ml-auto px-3 py-1 bg-green-50 text-green-600 text-[8px] font-bold uppercase rounded-md border border-green-100">
                  Synced
               </div>
            </div>
            
            <button 
              type="submit"
              disabled={submitting || !isEligible}
              className={`w-full md:w-auto px-16 py-4.5 bg-blue-600 text-white font-bold rounded-2xl shadow-2xl shadow-blue-100 flex items-center justify-center gap-4 hover:bg-blue-700 hover:-translate-y-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-[0.2em] text-xs group/submit`}
            >
              {submitting ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} className="group-hover:translate-x-1 transition-transform" />}
              Transmit Dossier
            </button>
          </div>
        </GlassCard>
      </form>
    </div>
  );
};

const InfoItem: React.FC<{ label: string, value: string, isUrgent?: boolean }> = ({ label, value, isUrgent }) => (
  <div className="flex flex-col gap-1">
    <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{label}</span>
    <span className={`text-sm font-bold ${isUrgent ? 'text-red-500' : 'text-gray-900'}`}>{value}</span>
  </div>
);

const StaticField: React.FC<{ label: string, value: string, icon: React.ReactNode }> = ({ label, value, icon }) => (
  <div className="space-y-2">
    <label className="text-[10px] font-bold uppercase text-gray-400 tracking-widest ml-1">{label}</label>
    <div className="relative flex items-center">
      <div className="absolute left-4 text-gray-300">{icon}</div>
      <input 
        disabled 
        value={value} 
        className="w-full bg-gray-50 border border-gray-100/50 rounded-xl py-3 px-4 pl-11 text-gray-500 font-bold text-xs shadow-sm" 
      />
    </div>
  </div>
);
