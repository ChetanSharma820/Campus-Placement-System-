
import React, { useState } from 'react';
import { GlassCard } from '../../components/common/GlassCard';
import { Lock, Palette, MessageSquare, AlertCircle, Check, Loader2, Moon, Sun, Monitor } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSave = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSuccess('Settings updated successfully!');
      setTimeout(() => setSuccess(null), 3000);
    }, 1000);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700 pb-24">
      <div>
        <h2 className="text-3xl font-black text-gray-900 tracking-tight">Student Settings</h2>
        <p className="text-gray-500 mt-1">Customize your platform experience and security.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Security Section */}
        <GlassCard className="space-y-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
              <Lock size={20} />
            </div>
            <h3 className="text-xl font-bold text-gray-900">Security & Credentials</h3>
          </div>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-black uppercase text-gray-400 tracking-widest ml-1">Current Password</label>
              <input 
                type="password" 
                className="w-full mt-2 bg-gray-50/50 border border-gray-100 rounded-2xl p-4 focus:ring-4 focus:ring-blue-100 transition-all outline-none" 
                placeholder="••••••••"
              />
            </div>
            <div>
              <label className="text-xs font-black uppercase text-gray-400 tracking-widest ml-1">New Password</label>
              <input 
                type="password" 
                className="w-full mt-2 bg-gray-50/50 border border-gray-100 rounded-2xl p-4 focus:ring-4 focus:ring-blue-100 transition-all outline-none" 
                placeholder="••••••••"
              />
            </div>
          </div>
          <button 
            onClick={handleSave}
            className="w-full py-4 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"
          >
            Update Password
          </button>
        </GlassCard>

        {/* Appearance Section */}
        <GlassCard className="space-y-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
              <Palette size={20} />
            </div>
            <h3 className="text-xl font-bold text-gray-900">Appearance & Theme</h3>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <ThemeOption icon={<Sun size={20} />} label="Light" active />
            <ThemeOption icon={<Moon size={20} />} label="Dark" />
            <ThemeOption icon={<Monitor size={20} />} label="System" />
          </div>
          <div className="space-y-4 pt-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
              <div>
                <p className="font-bold text-gray-900">Compact Mode</p>
                <p className="text-xs text-gray-500">Show more information on dashboard</p>
              </div>
              <input type="checkbox" className="w-10 h-5 bg-gray-200 rounded-full appearance-none checked:bg-blue-600 transition-colors cursor-pointer relative after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:w-4 after:h-4 after:rounded-full after:transition-all checked:after:translate-x-5" />
            </div>
          </div>
        </GlassCard>

        {/* Feedback Section */}
        <GlassCard className="lg:col-span-2 space-y-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-green-100 text-green-600 rounded-lg">
              <MessageSquare size={20} />
            </div>
            <h3 className="text-xl font-bold text-gray-900">Student Corner - Feedback & Reports</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <p className="text-sm font-medium text-gray-600">Have suggestions to improve Campus Connect? We'd love to hear from you.</p>
              <textarea 
                className="w-full bg-gray-50/50 border border-gray-100 rounded-2xl p-4 h-32 focus:ring-4 focus:ring-green-100 transition-all outline-none"
                placeholder="Your suggestions here..."
              ></textarea>
              <button className="px-8 py-3 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition-all shadow-lg shadow-green-100">
                Send Feedback
              </button>
            </div>
            <div className="space-y-4 p-6 bg-red-50 rounded-2xl border border-red-100">
              <div className="flex items-center gap-2 text-red-600 mb-2">
                <AlertCircle size={20} />
                <p className="font-bold">Report an Issue</p>
              </div>
              <p className="text-sm text-red-600/70">Facing technical difficulties or noticed incorrect data? Report it immediately to the TPO admin team.</p>
              <select className="w-full bg-white border border-red-100 rounded-xl p-3 outline-none focus:ring-2 focus:ring-red-500">
                <option>Select Issue Category</option>
                <option>Profile Data Mismatch</option>
                <option>Resume Upload Failed</option>
                <option>Job Application Error</option>
                <option>UI/UX Glitch</option>
                <option>Other</option>
              </select>
              <button className="w-full py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-all">
                Submit Formal Report
              </button>
            </div>
          </div>
        </GlassCard>
      </div>

      {success && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-green-600 text-white px-8 py-4 rounded-full shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4">
          <Check size={20} />
          <span className="font-bold">{success}</span>
        </div>
      )}
      
      {loading && (
        <div className="fixed inset-0 bg-white/20 backdrop-blur-sm z-50 flex items-center justify-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
        </div>
      )}
    </div>
  );
};

const ThemeOption: React.FC<{ icon: React.ReactNode; label: string; active?: boolean }> = ({ icon, label, active }) => (
  <button className={`flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all ${
    active ? 'bg-white border-blue-500 text-blue-600 shadow-xl' : 'bg-gray-50 border-transparent text-gray-400 hover:bg-gray-100'
  }`}>
    {icon}
    <span className="text-xs font-black uppercase tracking-widest">{label}</span>
  </button>
);
