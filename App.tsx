import React, { useState, useEffect, createContext } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';

export const ThemeContext = createContext({
  isDark: false,
  toggleDark: () => {}
});
import { User, UserRole } from './types';
import { getCurrentUser, setCurrentUser } from './services/storage';
import { Login } from './pages/Login';
import { Sidebar } from './components/Sidebar';
import { StudentDashboard } from './pages/student/StudentDashboard';
import { RaiseIssue } from './pages/student/RaiseIssue';
import { MyProfile } from './pages/student/MyProfile';
import { Notifications } from './pages/student/Notifications';
import { Community } from './pages/student/Community';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { ManageIssues } from './pages/admin/ManageIssues';
import { FacultyDashboard } from './pages/faculty/FacultyDashboard';
import { AssignedIssues } from './pages/faculty/AssignedIssues';
import { HelpFAQ } from './pages/HelpFAQ';
import { Chatbot } from './components/Chatbot';
import { SocketProvider } from './components/SocketProvider';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  const [isDark, setIsDark] = useState(() => {
    return localStorage.getItem('theme') === 'dark';
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  const toggleDark = () => setIsDark(!isDark);

  useEffect(() => {
    const storedUser = getCurrentUser();
    if (storedUser && storedUser.token) {
      // Verify token validity with backend before logging in
      fetch('http://localhost:5000/api/auth/me', {
        headers: { 'Authorization': `Bearer ${storedUser.token}` }
      })
      .then(res => {
        if (res.ok) {
           setUser(storedUser);
           // if at explicit login page or root, move them to dashboard
           if (location.pathname === '/login' || location.pathname === '/') {
               navigate(storedUser.role === UserRole.STUDENT ? '/dashboard' : '/admin-dashboard', { replace: true });
           }
        } else {
           handleLogout();
        }
      })
      .catch(err => {
         console.error("Auth check failed:", err);
         handleLogout();
      })
      .finally(() => {
         setIsCheckingAuth(false);
      });
    } else {
      handleLogout();
      setIsCheckingAuth(false);
    }
  }, []);

  const handleLogin = (newUser: User) => {
    setUser(newUser);
    navigate(newUser.role === UserRole.STUDENT ? '/dashboard' : '/admin-dashboard', { replace: true });
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('edusolve_user');
    navigate('/login', { replace: true });
  };

  const handleUserUpdate = (updatedUser: User) => {
    setUser(updatedUser);
    setCurrentUser(updatedUser);
  };

  if (isCheckingAuth) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50 dark:bg-slate-950">
         <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 dark:border-indigo-400"></div>
      </div>
    );
  }

  // A tiny wrapper for protection
  const ProtectedRoute = ({ children, allowedRoles }: { children: React.ReactNode, allowedRoles?: UserRole[] }) => {
     if (!user) return <Navigate to="/login" replace />;
     if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to={user.role === UserRole.STUDENT ? '/dashboard' : user.role === UserRole.FACULTY ? '/faculty-dashboard' : '/admin-dashboard'} replace />;
     return <>{children}</>;
  };

  // Determine active tab purely from pathname for sidebar
  const activeTab = location.pathname.substring(1) || 'dashboard';

  return (
    <ThemeContext.Provider value={{ isDark, toggleDark }}>
      <SocketProvider user={user}>
        <div className="flex h-screen bg-gradient-to-br from-slate-50 to-indigo-50/50 dark:from-slate-950 dark:to-slate-900 text-slate-900 dark:text-slate-100 transition-colors duration-300">
          {user && location.pathname !== '/login' && (
          <Sidebar 
            role={user.role} 
            activeTab={activeTab} 
            onNavigate={(tab) => navigate(`/${tab}`)} 
            onLogout={handleLogout} 
          />
        )}
        <main className={`flex-1 overflow-y-auto animate-slide-up relative z-0 ${user && location.pathname !== '/login' ? 'ml-64' : ''}`}>
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03] pointer-events-none"></div>
          <div className="relative z-10">
            <Routes>
               <Route path="/login" element={!user ? <Login onLogin={handleLogin} /> : <Navigate to={user.role === UserRole.STUDENT ? '/dashboard' : user.role === UserRole.FACULTY ? '/faculty-dashboard' : '/admin-dashboard'} replace />} />
               
               {/* Student Routes */}
               <Route path="/dashboard" element={<ProtectedRoute allowedRoles={[UserRole.STUDENT]}><StudentDashboard user={user!} onNavigate={(tab) => navigate(`/${tab}`)} /></ProtectedRoute>} />
               <Route path="/raise-issue" element={<ProtectedRoute allowedRoles={[UserRole.STUDENT]}><RaiseIssue user={user!} onIssueRaised={() => navigate('/dashboard')} /></ProtectedRoute>} />
               <Route path="/profile" element={<ProtectedRoute allowedRoles={[UserRole.STUDENT, UserRole.FACULTY]}><MyProfile user={user!} onUpdateUser={handleUserUpdate} /></ProtectedRoute>} />
               <Route path="/notifications" element={<ProtectedRoute allowedRoles={[UserRole.STUDENT]}><Notifications user={user!} /></ProtectedRoute>} />
               <Route path="/community" element={<ProtectedRoute allowedRoles={[UserRole.STUDENT]}><Community user={user!} /></ProtectedRoute>} />
               
               {/* Admin Routes */}
               <Route path="/admin-dashboard" element={<ProtectedRoute allowedRoles={[UserRole.ADMIN]}><AdminDashboard /></ProtectedRoute>} />
               <Route path="/manage-issues" element={<ProtectedRoute allowedRoles={[UserRole.ADMIN]}><ManageIssues /></ProtectedRoute>} />

               {/* Faculty Routes */}
               <Route path="/faculty-dashboard" element={<ProtectedRoute allowedRoles={[UserRole.FACULTY]}><FacultyDashboard user={user!}/></ProtectedRoute>} />
               <Route path="/assigned-issues" element={<ProtectedRoute allowedRoles={[UserRole.FACULTY]}><AssignedIssues user={user!} /></ProtectedRoute>} />

               {/* Shared Routes */}
               <Route path="/help" element={<ProtectedRoute><HelpFAQ userRole={user?.role as UserRole} /></ProtectedRoute>} />
               <Route path="/" element={<Navigate to="/login" replace />} />
               <Route path="*" element={<Navigate to={user ? (user.role === UserRole.STUDENT ? '/dashboard' : user.role === UserRole.FACULTY ? '/faculty-dashboard' : '/admin-dashboard') : '/login'} replace />} />
            </Routes>
          </div>
        </main>
        
          {user?.role === UserRole.STUDENT && location.pathname !== '/login' && <Chatbot />}
        </div>
      </SocketProvider>
    </ThemeContext.Provider>
  );
};

export default App;