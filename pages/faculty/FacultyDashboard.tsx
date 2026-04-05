import React, { useEffect, useState } from 'react';
import { User, Issue, IssueStatus } from '../../types';
import { getCurrentUser } from '../../services/storage';
import { Clock, CheckCircle, AlertTriangle, ShieldAlert, MapPin, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Props {
  user: User;
}

export const FacultyDashboard: React.FC<Props> = ({ user }) => {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchIssues();
  }, []);

  const fetchIssues = async () => {
    try {
      const storedUser = getCurrentUser();
      if (!storedUser?.token) return;

      // Note: Reusing the admin all issues fetch for now. Real world would filter by assignedFacultyId 
      // directly on backend or here. Let's assume we fetch all and filter here for simplicity since 
      // faculty usually has high trust, or we wait for backend endpoint.
      // Better yet, we can fetch all issues and filter.
      
      const response = await fetch('http://localhost:5000/api/issues/all', {
        headers: { 'Authorization': `Bearer ${storedUser.token}` }
      });
      if (response.ok) {
        const data = await response.json();
        const categoryRoleMap: Record<string, string> = {
            'Infrastructure': 'Facility',
            'Technical': 'Technical',
            'Hostel': 'Hostel',
            'Academic': 'Academic',
            'Mess/Canteen': 'Mess',
            'Other': 'Admin'
        };

        const assignedData = data.filter((i: Issue) => {
             const mapsToDept = user.department && categoryRoleMap[i.category] === user.department;
             const assignedToMe = i.assignedFacultyId === user._id || i.assignedFacultyId === user.id;
             return i.isVerified && i.status !== IssueStatus.REJECTED && (assignedToMe || mapsToDept);
        });
        
        setIssues(assignedData);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const pending = issues.filter(i => i.status !== IssueStatus.RESOLVED && i.status !== IssueStatus.REJECTED);
  const resolvedCount = issues.filter(i => i.status === IssueStatus.RESOLVED).length;
  const urgent = issues.filter(i => (i.priority === 'High' || i.priority === 'Critical') && i.status !== IssueStatus.RESOLVED && i.status !== IssueStatus.REJECTED);

  const recentPending = pending.slice(0, 5); // Show up to 5 pending issues on dash

  if (loading) {
     return <div className="p-8"><div className="animate-spin h-6 w-6 border-2 border-indigo-600 rounded-full border-t-transparent"></div></div>;
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-fade-in pt-24">
      <header>
        <div className="flex flex-col items-start gap-2">
            <span className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 font-semibold text-xs tracking-wider uppercase rounded-full">
                {user.department || 'Faculty Member'}
            </span>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
              Welcome back, {user.name}
            </h1>
        </div>
        <p className="text-slate-500 dark:text-slate-400 mt-2">Here's the summary of your assigned tasks.</p>
      </header>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white/60 dark:bg-slate-900/60 p-6 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm backdrop-blur-xl">
           <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400">
                 <Clock className="w-6 h-6" />
              </div>
           </div>
           <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Pending Issues</p>
              <h3 className="text-3xl font-bold text-slate-800 dark:text-slate-100">{pending.length}</h3>
           </div>
        </div>

        <div className="bg-white/60 dark:bg-slate-900/60 p-6 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm backdrop-blur-xl">
           <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400">
                 <CheckCircle className="w-6 h-6" />
              </div>
           </div>
           <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Resolved</p>
              <h3 className="text-3xl font-bold text-slate-800 dark:text-slate-100">{resolvedCount}</h3>
           </div>
        </div>

        <div className="bg-white/60 dark:bg-slate-900/60 p-6 rounded-2xl border border-red-200/50 dark:border-red-900/30 shadow-[0_0_15px_rgba(239,68,68,0.1)] backdrop-blur-xl relative overflow-hidden group">
           <div className="absolute inset-0 bg-red-50 dark:bg-red-500/5 group-hover:bg-red-100 dark:group-hover:bg-red-500/10 transition-colors"></div>
           <div className="relative">
             <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-xl bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400">
                   <AlertTriangle className="w-6 h-6" />
                </div>
             </div>
             <div>
                <p className="text-sm font-medium text-red-600/80 dark:text-red-400/80">Urgent/Critical</p>
                <h3 className="text-3xl font-bold text-red-700 dark:text-red-300">{urgent.length}</h3>
             </div>
           </div>
        </div>
      </div>

      {/* Active Assignments List */}
      <div className="mt-8 bg-white/60 dark:bg-slate-900/60 p-6 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 shadow-lg backdrop-blur-xl">
         <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
                <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center">
                    <ShieldAlert className="w-5 h-5 mr-2 text-indigo-500" />
                    Pending Department Issues
                </h2>
                <p className="text-sm text-slate-500 mt-1">Issues assigned specifically to you or your department queue.</p>
            </div>
            <button 
                onClick={() => navigate('/assigned-issues')}
                className="bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 text-sm font-semibold hover:bg-indigo-100 dark:hover:bg-indigo-900/50 px-4 py-2 rounded-lg transition-colors flex items-center shadow-sm"
            >
                Start Resolving <ArrowRight className="w-4 h-4 ml-1.5" />
            </button>
         </div>

         {recentPending.length === 0 ? (
             <div className="bg-slate-50/50 dark:bg-slate-800/20 border border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-12 text-center text-slate-500 dark:text-slate-400 flex flex-col items-center">
               <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-full flex justify-center items-center mb-4 shadow-sm">
                   <ShieldAlert className="w-8 h-8 text-green-500" />
               </div>
               <h3 className="text-lg font-bold text-slate-700 dark:text-slate-200 mb-1">Queue is Clear!</h3>
               <p>Your department has successfully addressed all recorded issues.</p>
             </div>
         ) : (
             <div className="grid gap-4">
                {recentPending.map(issue => (
                    <div key={issue._id || issue.id} className="group bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5 shadow-sm hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-600 transition-all flex flex-col md:flex-row gap-4 justify-between items-start md:items-center relative overflow-hidden">
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500 scale-y-0 group-hover:scale-y-100 transition-transform origin-top"></div>
                        <div className="flex-1 pr-6 relative z-10">
                            <div className="flex items-center gap-3 mb-2 flex-wrap">
                                <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-lg">
                                    {issue.title}
                                </h3>
                                {issue.priority === 'Critical' || issue.priority === 'High' ? (
                                    <span className="px-2.5 py-0.5 rounded-full text-[10px] uppercase tracking-wider font-bold bg-red-100 text-red-700 border border-red-200 flex items-center">
                                       <span className="w-1.5 h-1.5 bg-red-500 rounded-full mr-1.5 animate-pulse"></span>
                                       {issue.priority}
                                    </span>
                                ) : (
                                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] uppercase tracking-wider font-bold ${issue.priority === 'Medium' ? 'bg-orange-100 text-orange-700 border-orange-200' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                                       {issue.priority}
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center text-xs font-medium text-slate-500 dark:text-slate-400 gap-3">
                                <span className="flex items-center bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded text-slate-600 dark:text-slate-300">
                                    <MapPin className="w-3.5 h-3.5 mr-1 text-indigo-500" /> {issue.location}
                                </span>
                                <span className="flex items-center"><Clock className="w-3.5 h-3.5 mr-1" />{new Date(issue.createdAt).toLocaleDateString()}</span>
                                <span className={`px-2 py-0.5 rounded border ${issue.status === 'Assigned' ? 'text-blue-700 bg-blue-50 border-blue-200' : 'text-amber-700 bg-amber-50 border-amber-200'}`}>
                                    {issue.status}
                                </span>
                            </div>
                        </div>
                        <button 
                            onClick={() => navigate('/assigned-issues')}
                            className="bg-indigo-600 text-white hover:bg-indigo-700 px-6 py-2.5 rounded-lg text-sm font-semibold transition-all shadow-sm hover:shadow-indigo-500/25 whitespace-nowrap min-w-[140px] text-center"
                        >
                            Open Details
                        </button>
                    </div>
                ))}
             </div>
         )}
      </div>
    </div>
  );
};
