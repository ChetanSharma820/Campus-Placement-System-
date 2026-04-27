
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LogOut, ChevronRight, Settings, Menu, X, Bell } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { SIDEBAR_LINKS } from '../../constants';
import { UserRole } from '../../types';

export const Sidebar: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  if (!user) return null;

  const links = SIDEBAR_LINKS[user.role];

  const SidebarContent = () => (
    <>
      <div className="p-6 md:p-8 border-b border-white/20">
        <h1 className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 uppercase tracking-tighter">
          Campus Connect
        </h1>
        <p className="text-[9px] uppercase tracking-[0.3em] text-gray-400 font-black mt-1">Institutional Pro Suite</p>
      </div>

      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {links.map((link) => {
          const isActive = location.pathname === link.path;
          return (
            <Link
              key={link.path}
              to={link.path}
              onClick={() => setIsOpen(false)}
              className={`flex items-center justify-between p-4 rounded-2xl transition-all duration-300 group ${
                isActive 
                  ? 'bg-blue-600 text-white shadow-xl shadow-blue-100' 
                  : 'text-gray-500 hover:bg-white hover:text-blue-600'
              }`}
            >
              <div className="flex items-center space-x-4">
                <span className={isActive ? 'text-white' : 'text-blue-500 group-hover:scale-110 transition-transform'}>
                  {link.icon}
                </span>
                <span className="font-bold text-xs uppercase tracking-widest">{link.label}</span>
              </div>
              {isActive && <ChevronRight size={16} />}
            </Link>
          );
        })}
        
        {user.role === UserRole.STUDENT && (
          <Link
            to="/student/notifications"
            onClick={() => setIsOpen(false)}
            className={`flex items-center justify-between p-4 rounded-2xl transition-all duration-300 group ${
              location.pathname === '/student/notifications' 
                ? 'bg-blue-600 text-white shadow-xl shadow-blue-100' 
                : 'text-gray-500 hover:bg-white hover:text-blue-600'
            }`}
          >
            <div className="flex items-center space-x-4">
              <span className={location.pathname === '/student/notifications' ? 'text-white' : 'text-blue-500 group-hover:scale-110 transition-transform'}>
                <Bell size={20} />
              </span>
              <span className="font-bold text-xs uppercase tracking-widest">Notifications</span>
            </div>
            {location.pathname === '/student/notifications' && <ChevronRight size={16} />}
          </Link>
        )}
      </nav>

      <div className="p-6 border-t border-white/20 space-y-3">
        <div className="flex items-center space-x-4 mb-4 bg-white/40 p-3 rounded-2xl border border-white">
          <img src={user.avatar} alt="Avatar" className="w-12 h-12 rounded-2xl border-2 border-white shadow-sm object-cover" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-black truncate text-gray-900 uppercase tracking-tight">{user.name}</p>
            <p className="text-[9px] font-bold text-blue-600 uppercase tracking-widest">{user.role}</p>
          </div>
        </div>
        
        <button
          onClick={logout}
          className="w-full flex items-center justify-center space-x-3 p-4 text-red-600 hover:bg-red-50 rounded-2xl transition-all font-black text-[10px] uppercase tracking-widest border border-transparent hover:border-red-100"
        >
          <LogOut size={18} />
          <span>Terminate Session</span>
        </button>
      </div>
    </>
  );

  return (
    <>
      <aside className="hidden lg:flex fixed left-0 top-0 h-screen w-64 glass border-r flex-col z-40">
        <SidebarContent />
      </aside>

      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 glass z-50 px-4 flex items-center justify-between border-b border-white/20">
        <h1 className="text-xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 uppercase">
          Campus Connect
        </h1>
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 text-gray-600"
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {isOpen && (
        <div className="lg:hidden fixed inset-0 bg-black/20 backdrop-blur-sm z-[60]" onClick={() => setIsOpen(false)}>
          <aside className="absolute left-0 top-0 h-screen w-72 glass border-r flex flex-col animate-in slide-in-from-left duration-300" onClick={(e) => e.stopPropagation()}>
            <SidebarContent />
          </aside>
        </div>
      )}
    </>
  );
};
