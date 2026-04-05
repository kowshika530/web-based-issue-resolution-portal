import React, { useEffect, useState } from 'react';
import { User, Issue, IssueStatus } from '../../types';
import { getCurrentUser, saveIssue } from '../../services/storage';
import { AlertCircle, Clock, MapPin, Search } from 'lucide-react';

interface Props {
  user: User;
}

export const AssignedIssues: React.FC<Props> = ({ user }) => {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchIssues();
  }, []);

  const fetchIssues = async () => {
    try {
      const storedUser = getCurrentUser();
      if (!storedUser?.token) return;

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

        let assignedData = data.filter((i: Issue) => {
             const mapsToDept = user.department && categoryRoleMap[i.category] === user.department;
             const assignedToMe = i.assignedFacultyId === user._id || i.assignedFacultyId === user.id;
             return i.isVerified && i.status !== IssueStatus.REJECTED && (assignedToMe || mapsToDept);
        });
        
        // Custom sort: highest priority and unacknowledged/recent issues first
        assignedData.sort((a: Issue, b: Issue) => {
           const priorityScore = (p: string) => {
             if (p === 'Critical') return 4;
             if (p === 'High') return 3;
             if (p === 'Medium') return 2;
             return 1;
           };
           
           if (priorityScore(a.priority) !== priorityScore(b.priority)) {
              return priorityScore(b.priority) - priorityScore(a.priority);
           }
           return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
        
        setIssues(assignedData);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toUpperCase()) {
      case 'CRITICAL': return 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300 ring-1 ring-red-500/20';
      case 'HIGH': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300 ring-1 ring-orange-500/20';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300 ring-1 ring-yellow-500/20';
      default: return 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300 ring-1 ring-green-500/20';
    }
  };
  
  const getStatusColor = (status: string) => {
     if (status === 'Resolved') return 'bg-green-100 text-green-800 dark:bg-green-500/10 dark:text-green-400';
     if (status === 'In Progress') return 'bg-blue-100 text-blue-800 dark:bg-blue-500/10 dark:text-blue-400';
     return 'bg-amber-100 text-amber-800 dark:bg-amber-500/10 dark:text-amber-400';
  }

  const handleOpenIssue = async (issue: Issue) => {
    // Basic interaction: In a real app we'd open a modal.
    // For now, we will just mark the notification read via API if possible.
    // Let's call an imaginary endpoint to mark the read status, or just expand it locally.
    console.log("Opened Issue", issue);
    alert(`Opened Issue: ${issue.title}\n\nDescription: ${issue.description}`);
  };

  const handleResolveIssue = async (e: React.MouseEvent, issueId: string | undefined) => {
    e.stopPropagation();
    if (!issueId) return;
    try {
      await saveIssue({ id: issueId, _id: issueId, status: IssueStatus.RESOLVED } as any);
      fetchIssues();
    } catch (err) {
      console.error('Error resolving issue', err);
      alert('Failed to resolve issue: ' + (err as Error).message);
    }
  };

  const urgentIssues = issues.filter(i => (i.priority === 'High' || i.priority === 'Critical') && i.status !== IssueStatus.RESOLVED && i.status !== IssueStatus.REJECTED);

  if (loading) {
     return <div className="p-8"><div className="animate-spin h-6 w-6 border-2 border-indigo-600 rounded-full border-t-transparent"></div></div>;
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6 animate-fade-in pt-24">
      <header>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent mb-2">
          Assigned Issues
        </h1>
        <p className="text-slate-500 dark:text-slate-400">View and manage issues assigned to you for resolution.</p>
      </header>
      
      {urgentIssues.length > 0 && (
         <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-4 rounded-r-xl flex items-start shadow-sm mb-6">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 mr-3 flex-shrink-0" />
            <div>
               <h3 className="font-semibold text-red-800 dark:text-red-300">Action Required</h3>
               <p className="text-red-700 dark:text-red-400/80 text-sm mt-1">
                  You have {urgentIssues.length} urgent/critical issue(s) awaiting resolution.
               </p>
            </div>
         </div>
      )}

      {issues.length === 0 ? (
        <div className="text-center py-16 bg-white/50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800">
           <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-4" />
           <h3 className="text-lg font-medium text-slate-600 dark:text-slate-300">No assigned issues</h3>
        </div>
      ) : (
        <div className="space-y-4">
           {issues.map(issue => (
              <div 
                 key={issue._id || issue.id} 
                 className="bg-white/80 dark:bg-slate-900/80 rounded-2xl p-6 border border-slate-200/50 dark:border-slate-800/50 shadow-sm hover:shadow-md transition-all backdrop-blur-xl group cursor-pointer"
                 onClick={() => handleOpenIssue(issue)}
              >
                 <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div className="space-y-3 flex-1">
                       <div className="flex items-center gap-3 flex-wrap">
                          <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                             {issue.title}
                          </h3>
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider ${getPriorityColor(issue.priority)}`}>
                             {issue.priority} Priority
                          </span>
                       </div>
                       <p className="text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                          {issue.description}
                       </p>
                       <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500 dark:text-slate-500">
                          <span className="flex items-center bg-slate-100 dark:bg-slate-800/50 px-3 py-1 rounded-lg">
                             <MapPin className="w-4 h-4 mr-2 text-indigo-500" />
                             {issue.location}
                          </span>
                          <span className="flex items-center">
                             <Clock className="w-4 h-4 mr-1" />
                             {new Date(issue.createdAt).toLocaleDateString()}
                          </span>
                       </div>
                    </div>
                    <div className="flex flex-col items-end justify-between h-full min-w-[120px] gap-2">
                       <span className={`px-3 py-1.5 rounded-xl text-xs font-semibold ${getStatusColor(issue.status)}`}>
                          {issue.status}
                       </span>
                       {issue.status !== IssueStatus.RESOLVED && issue.status !== IssueStatus.REJECTED && (
                          <button
                             onClick={(e) => handleResolveIssue(e, issue._id || issue.id)}
                             className="text-xs px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
                          >
                             Mark Resolved
                          </button>
                       )}
                    </div>
                 </div>
              </div>
           ))}
        </div>
      )}
    </div>
  );
};
