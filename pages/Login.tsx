import React, { useState } from 'react';
import { UserRole, User } from '../types';
import { loginUser, setCurrentUser } from '../services/storage';
import { ShieldCheck, ArrowRight, UserPlus, LogIn } from 'lucide-react';

interface Props {
  onLogin: (user: User) => void;
}

export const Login: React.FC<Props> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [role, setRole] = useState<UserRole>(UserRole.STUDENT);
  const [studentId, setStudentId] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [department, setDepartment] = useState('Technical');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const trimmedId = studentId.trim();
    const trimmedName = name.trim();
    const trimmedPass = password.trim();

    if (!trimmedId) {
      setError('Student ID / Staff ID is required');
      setLoading(false);
      return;
    }
    if (!trimmedPass) {
      setError('Password is required');
      setLoading(false);
      return;
    }
    if (!isLogin && !trimmedName) {
      setError('Full Name is required for registration');
      setLoading(false);
      return;
    }

    try {
      if (isLogin) {
        try {
            const user = await loginUser(trimmedId, trimmedPass);
            if (user) {
              setCurrentUser(user);
              onLogin(user);
            }
        } catch(err: any) {
            setError(err.message || 'Invalid credentials.');
        }
      } else {
        const API_URL = 'http://localhost:5000/api';
        const regRes = await fetch(`${API_URL}/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: trimmedName,
            studentId: trimmedId,
            password: trimmedPass,
            role,
            department: role === UserRole.FACULTY ? department : undefined
          })
        });
        
        const data = await regRes.json();
        
        if (regRes.ok) {
          setCurrentUser(data);
          onLogin(data);
        } else {
          setError(data.message || 'Registration failed.');
        }
      }
    } catch(err) {
      setError('Server error. Backend might be unreachable.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 border border-slate-100">
        <div className="flex flex-col items-center mb-6">
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4">
                <ShieldCheck className="w-8 h-8 text-blue-600" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">
              {isLogin ? 'Welcome Back' : 'Create Account'}
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              {isLogin ? 'Sign in to UniResolve Portal' : 'Register for UniResolve Portal'}
            </p>
        </div>

        <div className="flex justify-center space-x-4 mb-6">
          <button 
            type="button"
            onClick={() => { setIsLogin(true); setError(''); }} 
            className={`flex items-center space-x-2 pb-2 px-2 text-sm font-medium border-b-2 transition-colors ${isLogin ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
            <LogIn className="w-4 h-4" />
            <span>Login</span>
          </button>
          <button 
            type="button"
            onClick={() => { setIsLogin(false); setError(''); }} 
            className={`flex items-center space-x-2 pb-2 px-2 text-sm font-medium border-b-2 transition-colors ${!isLogin ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
            <UserPlus className="w-4 h-4" />
            <span>Register</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Role</label>
              <div className="grid grid-cols-3 gap-3">
                <button
                    type="button"
                    className={`flex items-center justify-center py-2.5 text-sm font-medium rounded-lg border transition-all ${
                    role === UserRole.STUDENT 
                        ? 'border-blue-600 bg-blue-50 text-blue-700' 
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                    onClick={() => setRole(UserRole.STUDENT)}
                >
                    Student
                </button>
                <button
                    type="button"
                    className={`flex items-center justify-center py-2.5 text-sm font-medium rounded-lg border transition-all ${
                    role === UserRole.FACULTY 
                        ? 'border-blue-600 bg-blue-50 text-blue-700' 
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                    onClick={() => setRole(UserRole.FACULTY)}
                >
                    Faculty
                </button>
                <button
                    type="button"
                    className={`flex items-center justify-center py-2.5 text-sm font-medium rounded-lg border transition-all ${
                    role === UserRole.ADMIN 
                        ? 'border-blue-600 bg-blue-50 text-blue-700' 
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                    onClick={() => setRole(UserRole.ADMIN)}
                >
                    Admin
                </button>
              </div>
          </div>

          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                className="w-full px-4 py-3 border border-slate-300 rounded-lg bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
              />
            </div>
          )}

          {!isLogin && role === UserRole.FACULTY && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Department / Specialty</label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
              >
                <option value="Facility">Facility Manager / Infrastructure</option>
                <option value="Technical">IT & WiFi Support</option>
                <option value="Hostel">Hostel Warden</option>
                <option value="Academic">Academic Dean / Admin</option>
                <option value="Mess">Food & Mess Supervisor</option>
                <option value="Admin">General Administrator</option>
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              {role === UserRole.STUDENT ? 'Student Registration ID' : 'Staff ID'}
            </label>
            <input 
              type="text" 
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              placeholder={role === UserRole.STUDENT ? 'e.g. STU12345' : 'e.g. ADM123'}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-3 border border-slate-300 rounded-lg bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
            />
          </div>

          {error && <p className="text-red-500 text-sm text-center">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-3 rounded-lg transition-all shadow-md shadow-blue-200 flex items-center justify-center group mt-2"
          >
            {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Account')} 
            {!loading && <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />}
          </button>
        </form>
      </div>
    </div>
  );
};