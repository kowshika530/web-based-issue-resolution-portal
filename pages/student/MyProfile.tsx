import React, { useState } from 'react';
import { User, IssueStatus } from '../../types';
import { getIssues, updateProfile } from '../../services/storage';
import { User as UserIcon, Mail, BookOpen, Calendar, Award, Hash, Edit2, Save, Camera, Clock, Star, Zap, Trophy, Target, Shield, CheckCircle2, ThumbsUp } from 'lucide-react';
import { StatusBadge } from '../../components/StatusBadge';

interface Props {
  user: User;
  onUpdateUser: (user: User) => void;
}

const LEVELS = [
    { level: 1, name: 'Novice', minPoints: 0 },
    { level: 2, name: 'Contributor', minPoints: 100 },
    { level: 3, name: 'Active Member', minPoints: 300 },
    { level: 4, name: 'Community Leader', minPoints: 600 },
    { level: 5, name: 'Campus Hero', minPoints: 1000 },
    { level: 6, name: 'Legend', minPoints: 2000 }
];

const BADGES = [
    { id: 'First Report', name: 'First Report', icon: Star, color: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-100 dark:bg-yellow-900/30', description: 'Raised your first issue' },
    { id: 'Active Reporter', name: 'Active Reporter', icon: Zap, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-100 dark:bg-blue-900/30', description: 'Raised 5+ issues' },
    { id: 'Problem Solver', name: 'Problem Solver', icon: CheckCircle2, color: 'text-green-600 dark:text-green-400', bg: 'bg-green-100 dark:bg-green-900/30', description: 'Had 5+ issues resolved' },
    { id: 'Trusted User', name: 'Trusted User', icon: Shield, color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-100 dark:bg-indigo-900/30', description: 'Reputation Score > 50' },
    { id: 'Smart Reporter', name: 'Smart Reporter', icon: Trophy, color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-100 dark:bg-orange-900/30', description: 'Raised issues with NO fakes' },
];



export const MyProfile: React.FC<Props> = ({ user, onUpdateUser }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
      department: user.department || '',
      year: user.year || '',
      email: user.email || ''
  });
  const [issues, setIssues] = useState<any[]>([]);
  
  React.useEffect(() => {
      getIssues().then(setIssues);
  }, []);

  const myIssues = issues.filter(i => i.studentId === user.id || i.studentId === user._id).sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const resolvedCount = user.totalIssuesResolved || myIssues.filter(i => i.status === IssueStatus.RESOLVED).length;
  const issuesRaised = user.totalIssuesRaised || myIssues.length;

  // Gamification Logic
  const currentPoints = user.reputationScore || 0;
  const currentLevelIndex = LEVELS.findIndex((l, index) => {
      const nextLevel = LEVELS[index + 1];
      return currentPoints >= l.minPoints && (!nextLevel || currentPoints < nextLevel.minPoints);
  });
  const currentLevel = LEVELS[currentLevelIndex] || LEVELS[0];
  const nextLevel = LEVELS[currentLevelIndex + 1];
  
  const pointsInLevel = currentPoints - currentLevel.minPoints;
  const pointsToNextLevel = nextLevel ? nextLevel.minPoints - currentLevel.minPoints : 0;
  const progressPercent = nextLevel ? Math.min(100, Math.max(0, (pointsInLevel / pointsToNextLevel) * 100)) : 100;

  const handleSave = async () => {
    try {
        const savedUser = await updateProfile(formData);
        if (savedUser) {
          onUpdateUser({ ...user, ...savedUser }); // Merge to ensure token stays
          setIsEditing(false);
        } else {
          alert('Failed to save profile to the database. Please try again.');
        }
    } catch(e) {
        console.error(e);
        alert('Server error while saving profile.');
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto animate-in fade-in duration-500">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Student Profile</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Profile Card */}
        <div className="lg:col-span-2 space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden relative transition-colors duration-300">
                {/* Cover Banner */}
                <div className="h-40 bg-gradient-to-r from-blue-600 to-indigo-700 relative overflow-hidden">
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20"></div>
                </div>
                
                <div className="px-8 pb-8">
                    <div className="relative flex justify-between items-end -mt-16 mb-6">
                        <div className="relative group">
                            <img 
                                src={user.avatar || 'https://via.placeholder.com/150'} 
                                alt="Profile" 
                                className="w-32 h-32 rounded-2xl border-4 border-white shadow-lg bg-white object-cover"
                            />
                            <div className="absolute bottom-1 right-1 w-6 h-6 bg-green-500 border-2 border-white rounded-full" title="Active"></div>
                            {isEditing && (
                                <button className="absolute inset-0 bg-black/40 flex items-center justify-center text-white rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Camera className="w-8 h-8" />
                                </button>
                            )}
                        </div>
                        <div className="flex space-x-6 mb-2">
                            <div className="text-center">
                                <span className="block text-2xl font-bold text-slate-800 dark:text-slate-100">{issuesRaised}</span>
                                <span className="text-xs text-slate-500 uppercase tracking-wide font-semibold">Issues</span>
                            </div>
                            <div className="text-center">
                                <span className="block text-2xl font-bold text-slate-800 dark:text-slate-100">{resolvedCount}</span>
                                <span className="text-xs text-slate-500 uppercase tracking-wide font-semibold">Solved</span>
                            </div>
                            <div className="text-center">
                                <span className="block text-2xl font-bold text-slate-800 dark:text-slate-100">{user.trustScore || 80}</span>
                                <span className="text-xs text-slate-500 uppercase tracking-wide font-semibold">Trust %</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-between items-start mb-8">
                        <div>
                            <h2 className="text-3xl font-bold text-slate-900 dark:text-white">{user.name}</h2>
                            <div className="flex items-center gap-2 mt-1">
                                <p className="text-slate-500 dark:text-slate-400 font-medium text-lg">{user.role}</p>
                                <span className="px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 text-xs font-bold border border-indigo-200 dark:border-indigo-800">
                                    {currentLevel.name}
                                </span>
                            </div>
                        </div>
                        <button 
                            onClick={() => isEditing ? handleSave() : setIsEditing(true)}
                            className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                isEditing 
                                ? 'bg-green-600 text-white hover:bg-green-700 shadow-sm'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                            }`}
                        >
                            {isEditing ? <Save className="w-4 h-4 mr-2" /> : <Edit2 className="w-4 h-4 mr-2" />}
                            {isEditing ? 'Save Changes' : 'Edit Profile'}
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 dark:bg-slate-950 p-6 rounded-xl border border-slate-100 dark:border-slate-800">
                        <div className="space-y-4">
                            <div className="flex items-start">
                                <div className="p-2.5 bg-white text-blue-600 rounded-lg mr-4 border border-blue-100 shadow-sm">
                                    <Hash className="w-5 h-5" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-xs text-slate-400 font-bold uppercase tracking-wide">Student ID</p>
                                    {isEditing ? (
                                        <input 
                                            value={user.studentId} 
                                            disabled
                                            className="w-full mt-1 px-2 py-1 border dark:border-slate-700 rounded text-sm bg-slate-100 dark:bg-slate-800 text-slate-500 cursor-not-allowed"
                                        />
                                    ) : (
                                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 mt-0.5">{user.studentId}</p>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-start">
                                <div className="p-2.5 bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 rounded-lg mr-4 border border-indigo-100 dark:border-indigo-900/40 shadow-sm">
                                    <BookOpen className="w-5 h-5" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-xs text-slate-400 font-bold uppercase tracking-wide">Department</p>
                                    {isEditing ? (
                                        <input 
                                            value={formData.department} 
                                            onChange={e => setFormData({...formData, department: e.target.value})}
                                            className="w-full mt-1 px-2 py-1 border dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded text-sm"
                                        />
                                    ) : (
                                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 mt-0.5">{user.department || 'Not Set'}</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-start">
                                <div className="p-2.5 bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 rounded-lg mr-4 border border-purple-100 dark:border-purple-900/40 shadow-sm">
                                    <Calendar className="w-5 h-5" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-xs text-slate-400 font-bold uppercase tracking-wide">Year / Batch</p>
                                    {isEditing ? (
                                        <input 
                                            value={formData.year} 
                                            onChange={e => setFormData({...formData, year: e.target.value})}
                                            className="w-full mt-1 px-2 py-1 border dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded text-sm"
                                        />
                                    ) : (
                                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 mt-0.5">{user.year || 'Not Set'}</p>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-start">
                                <div className="p-2.5 bg-white dark:bg-slate-900 text-orange-600 dark:text-orange-400 rounded-lg mr-4 border border-orange-100 dark:border-orange-900/40 shadow-sm">
                                    <Mail className="w-5 h-5" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-xs text-slate-400 font-bold uppercase tracking-wide">Email Address</p>
                                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 mt-0.5">{user.email}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

             {/* Recent Activity */}
             <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-8 transition-colors duration-300">
                <h3 className="font-bold text-slate-900 dark:text-slate-100 mb-6 flex items-center">
                    <Clock className="w-5 h-5 mr-2 text-slate-500" />
                    Recent Activity
                </h3>
                <div className="space-y-0 divide-y divide-slate-100 dark:divide-slate-800/50">
                    {myIssues.slice(0, 3).map(issue => (
                        <div key={issue.id} className="py-4 first:pt-0 last:pb-0">
                            <div className="flex justify-between items-start mb-1">
                                <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">{issue.title}</span>
                                <span className="text-xs text-slate-400">{new Date(issue.createdAt).toLocaleDateString()}</span>
                            </div>
                            <div className="flex justify-between items-center mt-2">
                                <StatusBadge status={issue.status} />
                                <span className="text-xs text-slate-500">{issue.votes?.length || 0} votes</span>
                            </div>
                        </div>
                    ))}
                    {myIssues.length === 0 && (
                        <p className="text-sm text-slate-500 italic">No activity yet. Raise an issue to get started!</p>
                    )}
                </div>
            </div>
        </div>

        {/* Right Column: Gamification */}
        <div className="space-y-6">
            <div className="bg-gradient-to-br from-indigo-900 to-indigo-800 rounded-2xl shadow-xl text-white p-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                    <Award className="w-32 h-32" />
                </div>
                
                <h3 className="text-indigo-200 font-bold text-sm tracking-widest uppercase mb-1">Reputation Score</h3>
                <div className="text-5xl font-black mb-4">{currentPoints}</div>
                
                <div className="space-y-4">
                    <div>
                        <div className="flex justify-between text-xs font-medium mb-1">
                            <span>{currentLevel.name} (Lvl {currentLevel.level})</span>
                            {nextLevel ? (
                                <span>{currentPoints} / {nextLevel.minPoints} XP</span>
                            ) : (
                                <span>Max Level</span>
                            )}
                        </div>
                        <div className="w-full bg-black/20 rounded-full h-2">
                            <div 
                                className="bg-green-400 h-2 rounded-full shadow-[0_0_10px_rgba(74,222,128,0.5)] transition-all duration-1000 ease-out" 
                                style={{ width: `${progressPercent}%` }}
                            ></div>
                        </div>
                        {nextLevel && (
                            <p className="text-[10px] text-indigo-300 mt-1 text-right">
                                {nextLevel.minPoints - currentPoints} XP to next level
                            </p>
                        )}
                    </div>
                    
                    <p className="text-sm text-indigo-100 leading-relaxed">
                        Keep raising valid issues and getting votes to earn more reputation and unlock new badges!
                    </p>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 transition-colors duration-300">
                <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center justify-between">
                    <span>Badges & Achievements</span>
                    <span className="text-xs font-normal text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-full">
                        {(user.achievements || []).length} / {BADGES.length}
                    </span>
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                     {BADGES.map(badge => {
                         const earnedAchievements = user.achievements || [];
                         const isUnlocked = earnedAchievements.includes(badge.id);
                         const Icon = badge.icon;
                         
                         return (
                            <div 
                                key={badge.id} 
                                className={`flex flex-col items-center text-center p-3 rounded-xl border transition-all ${
                                    isUnlocked 
                                    ? 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 opacity-100 transform hover:-translate-y-1 shadow-sm' 
                                    : 'bg-transparent border-slate-100 dark:border-slate-800 opacity-40 grayscale'
                                }`}
                                title={isUnlocked ? `Unlocked: ${badge.description}` : `Locked: ${badge.description}`}
                            >
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 shadow-sm ${isUnlocked ? badge.bg : 'bg-slate-200 dark:bg-slate-800'}`}>
                                    <Icon className={`w-5 h-5 ${isUnlocked ? badge.color : 'text-slate-500'}`} />
                                </div>
                                <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 leading-tight">{badge.name}</span>
                            </div>
                         );
                     })}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};