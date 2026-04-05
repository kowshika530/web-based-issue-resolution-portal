import React, { useContext } from 'react';
import { UserRole } from '../types';
import { LayoutDashboard, PlusCircle, User, LogOut, ShieldAlert, BookOpen, Bell, HelpCircle, Moon, Sun } from 'lucide-react';
import { ThemeContext } from '../App';

interface Props {
  role: UserRole;
  activeTab: string;
  onNavigate: (tab: string) => void;
  onLogout: () => void;
}

export const Sidebar: React.FC<Props> = ({ role, activeTab, onNavigate, onLogout }) => {
  const { isDark, toggleDark } = useContext(ThemeContext);

  const menuItems = role === UserRole.STUDENT 
    ? [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'raise-issue', label: 'Raise Issue', icon: PlusCircle },
        { id: 'profile', label: 'My Profile', icon: User },
        { id: 'notifications', label: 'Notifications', icon: Bell },
        { id: 'help', label: 'Help & FAQ', icon: HelpCircle },
      ]
    : role === UserRole.FACULTY
      ? [
          { id: 'faculty-dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { id: 'assigned-issues', label: 'Assigned Issues', icon: ShieldAlert },
          { id: 'help', label: 'Help & FAQ', icon: HelpCircle },
        ]
      : [
          { id: 'admin-dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { id: 'manage-issues', label: 'Manage Issues', icon: ShieldAlert },
        ];

  return (
    <div className="w-64 bg-white/80 dark:bg-slate-950/80 border-r border-slate-200 dark:border-slate-800 h-screen flex flex-col fixed left-0 top-0 z-10 font-sans shadow-[4px_0_24px_rgba(0,0,0,0.02)] backdrop-blur-xl transition-colors duration-300">
      <div className="p-6 flex items-center space-x-3 mb-2">
        <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
          <ShieldAlert className="text-white w-5 h-5" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-slate-800 dark:text-slate-100 leading-tight">UniResolve</h1>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium tracking-wider uppercase">Issue Portal</p>
        </div>
      </div>
      
      <div className="px-6 mb-2">
        <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
            {role === UserRole.STUDENT ? 'Student Menu' : role === UserRole.FACULTY ? 'Faculty Portal' : 'Admin Console'}
        </p>
      </div>

      <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group ${
              activeTab === item.id
                ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900/50 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <div className="flex items-center space-x-3">
                <item.icon className={`w-5 h-5 transition-colors ${activeTab === item.id ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300'}`} />
                <span>{item.label}</span>
            </div>
          </button>
        ))}
      </nav>

      {/* User Mini Profile at bottom */}
      <div className="p-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
        <button
          onClick={toggleDark}
          className="w-full flex items-center justify-between space-x-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
        >
          <div className="flex items-center space-x-3">
             {isDark ? <Sun className="w-5 h-5 text-amber-500" /> : <Moon className="w-5 h-5 text-indigo-500" />}
             <span>{isDark ? 'Light Mode' : 'Dark Mode'}</span>
          </div>
          <div className="w-8 h-4 bg-slate-200 dark:bg-indigo-900 rounded-full relative transition-colors">
             <div className={`w-3 h-3 bg-white dark:bg-indigo-400 rounded-full absolute top-0.5 transition-transform ${isDark ? 'translate-x-4' : 'translate-x-0.5'}`}></div>
          </div>
        </button>
        <button
          onClick={onLogout}
          className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
};