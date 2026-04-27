
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Users, ShieldCheck, GraduationCap } from 'lucide-react';
import { UserRole } from '../types';
import { GlassCard } from '../components/common/GlassCard';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  const handleRoleSelection = (role: UserRole) => {
    navigate(`/login?role=${role}`);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-transparent">
      <div className="text-center mb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="inline-block p-4 rounded-3xl glass mb-6">
          <GraduationCap size={48} className="text-blue-600" />
        </div>
        <h1 className="text-5xl font-extrabold text-gray-900 mb-4 tracking-tight">
          Welcome to <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">Campus Connect Pro</span>
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto font-light">
          Bridge the gap between education and career. Choose your portal to begin your journey.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-6xl">
        <RoleCard 
          icon={<User size={32} />}
          title="Student"
          description="Explore jobs, manage applications, and jumpstart your career."
          onClick={() => handleRoleSelection(UserRole.STUDENT)}
          color="blue"
        />
        <RoleCard 
          icon={<Users size={32} />}
          title="TPO Admin"
          description="Manage placements, companies, and student registrations efficiently."
          onClick={() => handleRoleSelection(UserRole.TPO)}
          color="indigo"
        />
        <RoleCard 
          icon={<ShieldCheck size={32} />}
          title="Super Manager"
          description="System-wide administration, analytics, and policy management."
          onClick={() => handleRoleSelection(UserRole.MANAGER)}
          color="slate"
        />
      </div>

      <footer className="mt-20 text-gray-500 text-sm font-medium">
        &copy; 2024 Campus Connect Pro. All rights reserved.
      </footer>
    </div>
  );
};

const RoleCard: React.FC<{
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
  color: 'blue' | 'indigo' | 'slate';
}> = ({ icon, title, description, onClick, color }) => {
  const colorMap = {
    blue: 'text-blue-600 group-hover:bg-blue-600',
    indigo: 'text-indigo-600 group-hover:bg-indigo-600',
    slate: 'text-slate-600 group-hover:bg-slate-600',
  };

  return (
    <GlassCard onClick={onClick} className="group text-center">
      <div className={`mx-auto w-16 h-16 rounded-2xl flex items-center justify-center mb-6 transition-all duration-300 ${colorMap[color]} bg-white/50 group-hover:text-white shadow-sm`}>
        {icon}
      </div>
      <h3 className="text-2xl font-bold text-gray-800 mb-3">{title}</h3>
      <p className="text-gray-500 leading-relaxed">{description}</p>
    </GlassCard>
  );
};
