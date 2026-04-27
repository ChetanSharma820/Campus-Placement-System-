import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Lock, Loader2, ShieldCheck, User as UserIcon, Users, Hash, AtSign, Eye, EyeOff } from 'lucide-react';
import { supabase } from '../services/supabase';
import { UserRole } from '../types';
import { GlassCard } from '../components/common/GlassCard';

export const LoginPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const role = (searchParams.get('role') as UserRole) || UserRole.STUDENT;

  const [identifier, setIdentifier] = useState(''); // roll number for student, email/id for admin
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const roleConfig = {
    [UserRole.STUDENT]: {
      icon: <UserIcon size={24} />,
      title: 'Student Portal',
      subtitle: 'Login with your Roll Number',
      inputLabel: 'University Roll Number',
      inputPlaceholder: 'e.g., 21EGBCS001',
      bg: 'bg-blue-600',
      gradient: 'from-blue-600 to-blue-500',
      shadow: 'shadow-blue-200',
      ring: 'focus:ring-blue-100',
    },
    [UserRole.TPO]: {
      icon: <Users size={24} />,
      title: 'TPO Admin Portal',
      subtitle: 'Login with your Admin ID or Email',
      inputLabel: 'Admin ID / Email',
      inputPlaceholder: 'Admin@123 or tpo@email.com',
      bg: 'bg-indigo-600',
      gradient: 'from-indigo-600 to-indigo-500',
      shadow: 'shadow-indigo-200',
      ring: 'focus:ring-indigo-100',
    },
    [UserRole.MANAGER]: {
      icon: <ShieldCheck size={24} />,
      title: 'Super Manager',
      subtitle: 'Restricted access — authorized users only',
      inputLabel: 'Admin Email',
      inputPlaceholder: 'manager@domain.com',
      bg: 'bg-slate-800',
      gradient: 'from-slate-800 to-slate-700',
      shadow: 'shadow-slate-200',
      ring: 'focus:ring-slate-100',
    },
  };

  const cfg = roleConfig[role];

    // Build the Supabase email from identifier
    const buildEmail = (): string => {
      const id = identifier.trim().toLowerCase();
      
      // If it's already a full email (contains @ and a dot after it), return as is
      if (id.includes('@') && id.split('@')[1].includes('.')) {
        return id;
      }

      if (role === UserRole.STUDENT) {
        // student roll number => rollnumber@gitjaipur.com
        return `${id}@gitjaipur.com`;
      }
      
      // Handle special admin IDs
      // admin@123 -> admin@123.com
      if (id.includes('@')) {
        return `${id}.com`;
      }
      
      // raw "admin" -> admin@123.com
      return `${id}@123.com`;
    };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!identifier.trim()) {
      setError(role === UserRole.STUDENT ? 'Please enter your Roll Number.' : 'Please enter your Admin ID or Email.');
      return;
    }
    if (!password.trim()) {
      setError('Please enter your password.');
      return;
    }

    setLoading(true);
    try {
      // Clear any stuck sessions before attempting new login
      await supabase.auth.signOut();
      
      const loginEmail = buildEmail();
      console.log('Attempting login with:', loginEmail);

      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: password.trim(),
      });

      if (authError) {
        setLoading(false);
        // Map common cryptic errors to user-friendly messages
        if (authError.message.includes('querying schema')) {
          setError('System connection error. Please refresh the page and try again.');
        } else if (authError.message.includes('Invalid login credentials')) {
          setError('Invalid Roll Number or Password. Please check and try again.');
        } else {
          setError(authError.message);
        }
        return;
      }

      // REDIRECTION will be handled by the protected routes / useEffect in app
      // But for better UX, we can navigate here immediately based on the data we have
      const userRole = (data.user?.user_metadata?.role || 'student').toUpperCase();
      const routes: Record<string, string> = {
        STUDENT: '/student/dashboard',
        TPO: '/tpo/dashboard',
        MANAGER: '/manager/dashboard',
      };
      navigate(routes[userRole] || '/', { replace: true });

    } catch (err: any) {
      console.error('Unexpected login error:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute -top-40 -right-40 w-96 h-96 rounded-full bg-gradient-to-br ${cfg.gradient} opacity-5 blur-3xl`} />
        <div className={`absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-gradient-to-tr ${cfg.gradient} opacity-5 blur-3xl`} />
      </div>

      <div className="w-full max-w-md relative">
        <button
          onClick={() => navigate('/')}
          className="flex items-center text-gray-500 hover:text-gray-900 mb-8 transition-all group font-medium text-sm"
        >
          <ArrowLeft size={16} className="mr-2 group-hover:-translate-x-1 transition-transform" />
          Back to Role Selection
        </button>

        <GlassCard className="!p-0 overflow-hidden shadow-2xl border border-white/60">
          {/* Top gradient bar */}
          <div className={`h-1.5 bg-gradient-to-r ${cfg.gradient}`} />

          <div className="p-10">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${cfg.gradient} text-white flex items-center justify-center shadow-lg`}>
                {cfg.icon}
              </div>
              <div>
                <h1 className="text-2xl font-black text-gray-900 tracking-tight">{cfg.title}</h1>
                <p className="text-sm text-gray-500 mt-0.5 font-medium">{cfg.subtitle}</p>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm font-medium animate-in fade-in slide-in-from-top-2 duration-300 leading-relaxed">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Identifier input */}
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700 ml-1">
                  {cfg.inputLabel}
                </label>
                <div className="relative group">
                  {role === UserRole.STUDENT
                    ? <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={18} />
                    : <AtSign className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
                  }
                  <input
                    type="text"
                    required
                    autoFocus
                    value={identifier}
                    onChange={(e) => setIdentifier(role === UserRole.STUDENT ? e.target.value.toUpperCase() : e.target.value)}
                    placeholder={cfg.inputPlaceholder}
                    className={`w-full pl-12 pr-4 py-3.5 rounded-2xl border border-gray-100 bg-white/60 focus:bg-white focus:ring-4 ${cfg.ring} focus:outline-none transition-all placeholder:text-gray-300 font-semibold text-gray-900 shadow-sm`}
                  />
                </div>
                {role === UserRole.STUDENT && (
                  <p className="text-xs text-gray-400 ml-1">Your roll number as given by university</p>
                )}
              </div>

              {/* Password input */}
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700 ml-1">Password</label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={18} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className={`w-full pl-12 pr-12 py-3.5 rounded-2xl border border-gray-100 bg-white/60 focus:bg-white focus:ring-4 ${cfg.ring} focus:outline-none transition-all placeholder:text-gray-300 font-semibold text-gray-900 shadow-sm`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {role === UserRole.STUDENT && (
                  <p className="text-xs text-gray-400 ml-1">
                    Default: first 4 letters of name + @ + joining year &nbsp;
                    <span className="text-gray-500 font-semibold">(e.g., shub@2022)</span>
                  </p>
                )}
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className={`w-full bg-gradient-to-r ${cfg.gradient} text-white font-bold py-4 rounded-2xl shadow-xl ${cfg.shadow} hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-3 text-base mt-2`}
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin" size={20} />
                    <span>Signing In...</span>
                  </>
                ) : (
                  <span>Sign In to Dashboard</span>
                )}
              </button>
            </form>
          </div>
        </GlassCard>

        <p className="text-center text-xs text-gray-400 mt-6 font-medium">
          Authorized access only. All login attempts are monitored.
        </p>
      </div>
    </div>
  );
};
