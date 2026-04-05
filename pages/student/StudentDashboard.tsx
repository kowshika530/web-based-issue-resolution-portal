import React, { useEffect, useState } from 'react';
import { User, Issue, IssueStatus, IssueCategory, Comment, UserRole } from '../../types';
import { getMyIssues, getPublicIssues, getCampusUpdates, saveIssue, deleteIssue, voteIssue, postComment, getLeaderboard, toggleBookmark } from '../../services/storage';
import { SLA_HOURS } from '../../constants';
import { Search, ThumbsUp, Clock, MessageSquare, Filter, ChevronDown, Bell, ChevronUp, Send, CheckCircle2, Circle, Image as ImageIcon, Edit2, Save, X, Trash2, Trophy, Target, Activity, Bookmark, Pin } from 'lucide-react';
import { StatusBadge } from '../../components/StatusBadge';

interface Props {
  user: User;
  onNavigate: (tab: string) => void;
}

export const StudentDashboard: React.FC<Props> = ({ user, onNavigate }) => {
  const [myIssues, setMyIssues] = useState<Issue[]>([]);
  const [allIssues, setAllIssues] = useState<Issue[]>([]);
  const [search, setSearch] = useState('');
  const [updates, setUpdates] = useState<any[]>([]);
  const [expandedIssueId, setExpandedIssueId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');
  const [editingIssueId, setEditingIssueId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{title: string, description: string}>({ title: '', description: '' });
  const [sortBy, setSortBy] = useState<'NEWEST' | 'VOTES'>('NEWEST');
  const [viewMode, setViewMode] = useState<'ALL' | 'MY' | 'BOOKMARKS'>('ALL');
  const [leaderboard, setLeaderboard] = useState<User[]>([]);
  const [bookmarks, setBookmarks] = useState<string[]>(user.bookmarks || []);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedPriority, setSelectedPriority] = useState<string>('ALL');

  const getPriorityColor = (priority: string) => {
      switch(priority) {
          case 'Critical': return 'text-red-700 bg-red-100 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800';
          case 'High': return 'text-orange-700 bg-orange-100 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800';
          case 'Medium': return 'text-yellow-700 bg-yellow-100 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800';
          case 'Low': return 'text-emerald-700 bg-emerald-100 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800';
          default: return 'text-slate-700 bg-slate-100 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';
      }
  };

  const handleBookmark = async (issueId: string) => {
    const isBookmarked = bookmarks.includes(issueId);
    setBookmarks(isBookmarked ? bookmarks.filter(id => id !== issueId) : [...bookmarks, issueId]);
    await toggleBookmark(issueId);
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const fetchedMyIssues = await getMyIssues();
    const fetchedAllIssues = await getPublicIssues();
    setMyIssues(fetchedMyIssues);
    setAllIssues(fetchedAllIssues);
    const fetchedUpdates = await getCampusUpdates();
    setUpdates(fetchedUpdates);
    const fetchedLeaders = await getLeaderboard();
    setLeaderboard(fetchedLeaders);
  };

  const handleVote = async (issueId: string) => {
    try {
        await voteIssue(issueId);
        // Optimistic update
        const updatedIssuesMaker = (list: Issue[]) => list.map(i => {
           const idStr = i.id || i._id;
           if (idStr === issueId) {
             const hasVoted = i.votes.includes(user.id || user._id);
             const newVotes = hasVoted 
                 ? i.votes.filter(id => id !== (user.id || user._id)) 
                 : [...i.votes, (user.id || user._id)];
             return { ...i, votes: newVotes };
           }
           return i;
         });
         setMyIssues(updatedIssuesMaker(myIssues));
         setAllIssues(updatedIssuesMaker(allIssues));
    } catch(e) {
        console.error(e);
        loadData(); // Revert on failure
    }
  };

  const toggleExpand = (id: string) => {
    if (expandedIssueId === id) {
        setExpandedIssueId(null);
    } else {
        setExpandedIssueId(id);
    }
  };

  const handlePostComment = async (issueId: string) => {
    if (!commentText.trim()) return;

    try {
        await postComment(issueId, commentText);
        setCommentText('');
        loadData(); // Reload issues to get fresh comments with proper IDs and formatting
    } catch(e) {
        console.error(e);
    }
  };

  const startEditing = (issue: Issue) => {
    setEditingIssueId(issue.id || issue._id);
    setEditForm({ title: issue.title, description: issue.description });
  };

  const cancelEditing = () => {
    setEditingIssueId(null);
    setEditForm({ title: '', description: '' });
  };

  const saveEditing = async (issueId: string) => {
    if (!editForm.title.trim() || !editForm.description.trim()) return;
    
    try {
        const updatedIssuesMaker = (list: Issue[]) => list.map(i => {
          const idStr = i.id || i._id;
          if (idStr === issueId) {
            return { ...i, title: editForm.title, description: editForm.description };
          }
          return i;
        });
        
        await saveIssue({ id: issueId, title: editForm.title, description: editForm.description } as any);
        setMyIssues(updatedIssuesMaker(myIssues));
        setAllIssues(updatedIssuesMaker(allIssues));
        setEditingIssueId(null);
    } catch(e) {
        console.error(e);
    }
  };

  const handleDelete = async (issueId: string) => {
    if (window.confirm('Are you sure you want to delete this issue?')) {
      try {
          await deleteIssue(issueId);
          setMyIssues(myIssues.filter(i => (i.id || i._id) !== issueId));
          setAllIssues(allIssues.filter(i => (i.id || i._id) !== issueId));
      } catch(e) {
          console.error(e);
      }
    }
  };

  const userId = user.id || user._id;

  const displayedIssues = viewMode === 'ALL' ? allIssues : (viewMode === 'MY' ? myIssues : allIssues.filter(i => bookmarks.includes(i.id || i._id as string)));

  const filteredIssues = displayedIssues
    .filter(i => i.title.toLowerCase().includes(search.toLowerCase()) || i.description.toLowerCase().includes(search.toLowerCase()))
    .filter(i => selectedCategory === 'ALL' || i.category === selectedCategory)
    .filter(i => selectedStatus === 'ALL' || i.status === selectedStatus)
    .filter(i => selectedPriority === 'ALL' || i.priority === selectedPriority)
    .sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        if (sortBy === 'NEWEST') {
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
        return b.votes.length - a.votes.length;
    });

  return (
    <div className="p-8 max-w-[1600px] mx-auto animate-in fade-in duration-500">
      {/* Welcome Banner */}
      <div className="mb-8 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 md:p-8 text-white shadow-lg relative overflow-hidden transition-all hover:shadow-indigo-500/25">
         <div className="absolute right-0 top-0 opacity-10 blur-2xl w-96 h-96 bg-white rounded-full -translate-y-1/2 translate-x-1/3"></div>
         <h1 className="text-3xl md:text-4xl font-black mb-2 relative z-10 tracking-tight">Welcome back, {user.name.split(' ')[0]}! 👋</h1>
         <p className="text-indigo-100 relative z-10 text-sm md:text-base max-w-2xl text-balance">
            You have raised <span className="font-bold text-white bg-white/20 px-2 py-0.5 rounded-md mx-1">{myIssues.length}</span> issues 
            and helped resolve <span className="font-bold text-white bg-white/20 px-2 py-0.5 rounded-md mx-1">{myIssues.filter(i => i.status === IssueStatus.RESOLVED).length}</span>. 
            Keep making the campus better!
         </p>
      </div>

      {/* Header Controls */}
      <div className="flex flex-col xl:flex-row xl:items-end justify-between mb-8 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white drop-shadow-sm transition-colors">Issue Dashboard</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1 transition-colors">Discover, track, and support campus improvements.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
            <div className="flex bg-slate-100 dark:bg-slate-900/50 rounded-lg p-1 border border-slate-200 dark:border-slate-800 transition-colors shadow-sm">
               <button 
                  onClick={() => setViewMode('ALL')}
                  className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-all ${viewMode === 'ALL' ? 'bg-white dark:bg-indigo-600 text-indigo-700 dark:text-white shadow font-bold' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800/50'}`}
               >
                  All Issues
               </button>
               <button 
                  onClick={() => setViewMode('MY')}
                  className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-all ${viewMode === 'MY' ? 'bg-white dark:bg-indigo-600 text-indigo-700 dark:text-white shadow font-bold' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800/50'}`}
               >
                  My Issues
               </button>
               <button 
                  onClick={() => setViewMode('BOOKMARKS')}
                  className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-all flex items-center ${viewMode === 'BOOKMARKS' ? 'bg-white dark:bg-indigo-600 text-indigo-700 dark:text-white shadow font-bold' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800/50'}`}
               >
                  <Bookmark className="w-4 h-4 mr-1" /> Saved
               </button>
            </div>
            <button  
                onClick={() => setSortBy(sortBy === 'NEWEST' ? 'VOTES' : 'NEWEST')}
                className="flex items-center space-x-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-4 py-2 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
                {sortBy === 'NEWEST' ? <Clock className="w-4 h-4 text-indigo-500" /> : <ThumbsUp className="w-4 h-4 text-emerald-500" />}
                <span>{sortBy === 'NEWEST' ? 'Newest First' : 'Most Voted'}</span>
                <ChevronDown className="w-3 h-3 ml-1" />
            </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Feed */}
        <div className="lg:col-span-2 space-y-6">
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1 group">
                    <Search className="absolute left-4 top-3.5 h-5 w-5 text-slate-400 dark:text-slate-500 group-focus-within:text-indigo-500 transition-colors" />
                    <input 
                        type="text" 
                        placeholder="Search issues by title or description..." 
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900/80 shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all dark:text-white"
                    />
                </div>
                
                <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0 hide-scrollbar">
                    <select 
                        value={selectedCategory} 
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="px-4 py-3 bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-300 outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm min-w-[130px]"
                    >
                        <option value="ALL">All Categories</option>
                        {Object.values(IssueCategory).map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                    
                    <select 
                        value={selectedStatus} 
                        onChange={(e) => setSelectedStatus(e.target.value)}
                        className="px-4 py-3 bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-300 outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm min-w-[130px]"
                    >
                        <option value="ALL">All Statuses</option>
                        {Object.values(IssueStatus).map(st => <option key={st} value={st}>{st}</option>)}
                    </select>

                    <select 
                        value={selectedPriority} 
                        onChange={(e) => setSelectedPriority(e.target.value)}
                        className="px-4 py-3 bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-300 outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm min-w-[130px]"
                    >
                        <option value="ALL">Any Priority</option>
                        <option value="Critical">Critical</option>
                        <option value="High">High</option>
                        <option value="Medium">Medium</option>
                        <option value="Low">Low</option>
                    </select>
                </div>
            </div>

            <div className="space-y-4">
                {filteredIssues.map(issue => {
                    const issueId = issue.id || issue._id;
                    const isExpanded = expandedIssueId === issueId;
                    const isEditing = editingIssueId === issueId;
                    const hasVoted = issue.votes.includes(userId);
                    const hasAttachments = issue.attachments && issue.attachments.length > 0;
                    const isOwner = (() => {
                      const issueOwnerId = String(issue.studentId);
                      return issueOwnerId === String(user.id) || issueOwnerId === String(user._id) || issueOwnerId === String(user.studentId);
                    })();

                    // Timeline logic
                    const steps = [
                        { status: IssueStatus.SUBMITTED, label: 'Submitted', date: issue.createdAt },
                        { status: IssueStatus.ASSIGNED, label: 'Assigned', date: issue.updatedAt }, // Simplified for demo
                        { status: IssueStatus.IN_PROGRESS, label: 'In Progress', date: issue.updatedAt },
                        { status: IssueStatus.RESOLVED, label: 'Resolved', date: issue.resolvedAt }
                    ];

                    const currentStepIndex = Object.values(IssueStatus).indexOf(issue.status);

                    return (
                    <div key={issueId} className={`relative bg-white dark:bg-slate-900/80 rounded-xl border transition-all duration-300 ${isExpanded ? 'border-indigo-300 dark:border-indigo-700 shadow-md ring-1 ring-indigo-100 dark:ring-indigo-900/50' : 'border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-indigo-200 dark:hover:border-indigo-800'} ${issue.isPinned ? 'ring-2 ring-indigo-400 dark:ring-indigo-500 shadow-indigo-100 dark:shadow-indigo-900/20 shadow-lg' : ''}`}>
                        {issue.isPinned && (
                            <div className="absolute -top-3 -right-3 bg-indigo-500 text-white p-1.5 rounded-full shadow-lg border-2 border-white dark:border-slate-900 z-10 animate-pulse">
                                <Pin className="w-4 h-4 fill-current" />
                            </div>
                        )}
                        <div className="p-6">
                            <div className="flex items-start justify-between">
                                <div className="flex-1 pr-6">
                                    <div className="flex items-center space-x-2 mb-2">
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800">
                                            {issue.category}
                                        </span>
                                        <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${getPriorityColor(issue.priority)}`}>
                                            {issue.priority} Priority
                                        </span>
                                        {issue.status === 'Rejected' ? <span className="text-xs font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded border border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800">Rejected</span> : <StatusBadge status={issue.status} />}
                                        {issue.isVerified && <span className="text-[10px] uppercase font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 flex items-center dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800"><CheckCircle2 className="w-3 h-3 mr-0.5" /> Verified</span>}
                                        {issue.isFlagged && <span className="text-[10px] uppercase font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded border border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800">Flagged</span>}
                                        <span className="text-xs text-slate-400 font-medium">• {new Date(issue.createdAt).toLocaleDateString()}</span>
                                    </div>
                                    
                                    {isEditing ? (
                                        <div className="mb-4 space-y-3">
                                            <input 
                                                type="text" 
                                                value={editForm.title}
                                                onChange={(e) => setEditForm({...editForm, title: e.target.value})}
                                                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-bold text-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white transition-colors"
                                                placeholder="Issue Title"
                                            />
                                            <textarea 
                                                value={editForm.description}
                                                onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                                                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white transition-colors"
                                                rows={3}
                                                placeholder="Description"
                                            />
                                            <div className="flex space-x-2">
                                                <button 
                                                    onClick={() => saveEditing(issueId)}
                                                    className="flex items-center px-3 py-1.5 bg-green-600 text-white rounded-md text-xs font-medium hover:bg-green-700"
                                                >
                                                    <Save className="w-3 h-3 mr-1" /> Save
                                                </button>
                                                <button 
                                                    onClick={cancelEditing}
                                                    className="flex items-center px-3 py-1.5 bg-slate-200 text-slate-700 rounded-md text-xs font-medium hover:bg-slate-300"
                                                >
                                                    <X className="w-3 h-3 mr-1" /> Cancel
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="flex justify-between items-start group">
                                                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-1 leading-tight">{issue.title}</h3>
                                                {isOwner && viewMode === 'MY' && (
                                                    <div className="flex space-x-2">
                                                        <button 
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                startEditing(issue);
                                                            }}
                                                            className="p-1 text-slate-400 hover:text-blue-600"
                                                            title="Edit Issue"
                                                        >
                                                            <Edit2 className="w-4 h-4 text-indigo-500" />
                                                        </button>
                                                        <button 
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleDelete(issueId);
                                                            }}
                                                            className="p-1 text-slate-400 hover:text-red-600"
                                                            title="Delete Issue"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                            <p className="text-slate-600 dark:text-slate-400 text-sm mb-4 leading-relaxed line-clamp-3">{issue.description}</p>
                                        </>
                                    )}
                                    
                                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-50">
                                        <div className="flex items-center space-x-3">
                                            <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-500">
                                                {issue.isAnonymous ? 'A' : (issue.studentName ? issue.studentName[0] : 'U')}
                                            </div>
                                            <span className="text-xs font-medium text-slate-500">{issue.isAnonymous ? 'Anonymous' : issue.studentName}</span>
                                            
                                            {issue.assignedTo && (
                                                <span className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-semibold px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-700">
                                                    Assignee: {issue.assignedTo}
                                                </span>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-4">
                                            {hasAttachments && (
                                                <div className="flex items-center text-xs text-slate-500" title="Has attachments">
                                                    <ImageIcon className="w-4 h-4 mr-1" />
                                                    {issue.attachments?.length}
                                                </div>
                                            )}
                                            <button 
                                                onClick={() => toggleExpand(issueId)}
                                                className="text-xs font-medium text-slate-500 hover:text-blue-600 flex items-center transition-colors px-2 py-1 rounded hover:bg-slate-50 dark:hover:bg-slate-800"
                                            >
                                                <MessageSquare className="w-4 h-4 mr-1" />
                                                {issue.comments?.length || 0} Comments
                                            </button>
                                            <button 
                                                onClick={() => handleBookmark(issueId)}
                                                className={`text-xs font-medium flex items-center transition-colors px-2 py-1 rounded hover:bg-slate-50 dark:hover:bg-slate-800 ${bookmarks.includes(issueId) ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500 hover:text-indigo-600'}`}
                                            >
                                                <Bookmark className={`w-4 h-4 mr-1 ${bookmarks.includes(issueId) ? 'fill-current' : ''}`} />
                                                Save
                                            </button>
                                        </div>
                                    </div>
                                    <div className="mt-2 text-right">
                                         <button 
                                            onClick={() => toggleExpand(issueId)}
                                            className="text-xs font-medium text-blue-600 hover:underline flex items-center ml-auto"
                                         >
                                            {isExpanded ? 'Hide Details' : 'View Timeline & Discussion'} 
                                            {isExpanded ? <ChevronUp className="w-3 h-3 ml-1"/> : <ChevronDown className="w-3 h-3 ml-1" />}
                                         </button>
                                    </div>
                                </div>
                                
                                <button 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleVote(issueId);
                                    }}
                                    className={`flex flex-col items-center justify-center min-w-[60px] h-[60px] rounded-lg border transition-all cursor-pointer hover:shadow-sm active:scale-95 ${
                                        hasVoted
                                        ? 'bg-blue-50 border-blue-200 text-blue-600'
                                        : 'bg-slate-50 border-slate-200 text-slate-400 hover:bg-slate-100 hover:text-slate-600'
                                    }`}
                                >
                                    <ThumbsUp className={`w-5 h-5 mb-1 ${hasVoted ? 'fill-current' : ''}`} />
                                    <span className="text-sm font-bold">{issue.votes?.length || 0}</span>
                                </button>
                            </div>
                        </div>

                        {/* Expanded Section */}
                        {isExpanded && (
                            <div className="border-t border-slate-100 bg-slate-50/50 p-6 rounded-b-xl grid grid-cols-1 md:grid-cols-2 gap-8 animate-in slide-in-from-top-2 duration-200">
                                {/* Timeline Column */}
                                <div>
                                    <h4 className="text-sm font-bold text-slate-800 mb-4 flex items-center">
                                        <Clock className="w-4 h-4 mr-2 text-slate-500" />
                                        Issue Timeline
                                    </h4>
                                    <div className="space-y-6 relative pl-2">
                                        <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-slate-200"></div>
                                        {steps.map((step, idx) => {
                                            const stepIndex = Object.values(IssueStatus).indexOf(step.status);
                                            const isCompleted = currentStepIndex >= stepIndex;
                                            
                                            return (
                                                <div key={idx} className="relative pl-8">
                                                    <div className={`absolute left-0 top-1 w-6 h-6 rounded-full border-2 flex items-center justify-center bg-white z-10 ${
                                                        isCompleted ? 'border-green-500 text-green-500' : 'border-slate-300 text-slate-300'
                                                    }`}>
                                                        {isCompleted ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Circle className="w-3.5 h-3.5" />}
                                                    </div>
                                                    <p className={`text-sm font-medium ${isCompleted ? 'text-slate-800' : 'text-slate-400'}`}>{step.label}</p>
                                                    {isCompleted && step.date && (
                                                        <p className="text-xs text-slate-500">{new Date(step.date).toLocaleString()}</p>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                    
                                    {/* Attachments Section in Expanded View */}
                                    {hasAttachments && (
                                        <div className="mt-8">
                                            <h4 className="text-sm font-bold text-slate-800 mb-3 flex items-center">
                                                <ImageIcon className="w-4 h-4 mr-2 text-slate-500" />
                                                Attachments
                                            </h4>
                                            <div className="grid grid-cols-3 gap-2">
                                                {issue.attachments?.map((img, idx) => (
                                                    <a key={idx} href={img} target="_blank" rel="noreferrer" className="block relative group">
                                                        <img 
                                                            src={img} 
                                                            alt={`Attachment ${idx + 1}`} 
                                                            className="h-20 w-full object-cover rounded-lg border border-slate-200 transition-transform group-hover:scale-105" 
                                                        />
                                                    </a>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Discussion Column */}
                                <div className="flex flex-col h-full">
                                    <h4 className="text-sm font-bold text-slate-800 mb-4 flex items-center">
                                        <MessageSquare className="w-4 h-4 mr-2 text-slate-500" />
                                        Discussion
                                    </h4>
                                    
                                    <div className="flex-1 space-y-4 max-h-[300px] overflow-y-auto mb-4 pr-2 custom-scrollbar">
                                        {!issue.comments || issue.comments.length === 0 ? (
                                            <p className="text-sm text-slate-400 italic text-center py-4">No comments yet. Start the discussion!</p>
                                        ) : (
                                            issue.comments.map((comment: any) => (
                                                <div key={comment.id || comment._id} className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
                                                    <div className="flex justify-between items-start mb-1">
                                                        <span className={`text-xs font-bold ${comment.role === UserRole.ADMIN ? 'text-blue-600' : 'text-slate-700'}`}>
                                                            {comment.authorName} {comment.role === UserRole.ADMIN && '(Admin)'}
                                                        </span>
                                                        <span className="text-[10px] text-slate-400">{new Date(comment.timestamp).toLocaleDateString()}</span>
                                                    </div>
                                                    <p className="text-sm text-slate-600">{comment.text}</p>
                                                </div>
                                            ))
                                        )}
                                    </div>

                                    <div className="relative">
                                        <input 
                                            type="text" 
                                            value={commentText}
                                            onChange={(e) => setCommentText(e.target.value)}
                                            onKeyPress={(e) => e.key === 'Enter' && handlePostComment(issueId)}
                                            placeholder="Add a comment..." 
                                            className="w-full pl-4 pr-10 py-2 text-sm border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white dark:bg-slate-800 text-slate-900 dark:text-white transition-colors"
                                        />
                                        <button 
                                            onClick={() => handlePostComment(issueId)}
                                            className="absolute right-2 top-1.5 text-blue-600 hover:text-blue-700 p-1"
                                        >
                                            <Send className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )})}

                {filteredIssues.length === 0 && (
                    <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-xl border border-dashed border-slate-300 dark:border-slate-800">
                        <p className="text-slate-500 dark:text-slate-400">No issues found matching your criteria.</p>
                    </div>
                )}
            </div>
        </div>

        {/* Right Sidebar Widgets */}
        <div className="space-y-6">
            {/* Campus Leaderboard Highlight */}
            <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-xl shadow-lg border border-indigo-500/30 overflow-hidden relative">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
                <div className="p-6 relative z-10">
                    <h3 className="font-bold text-white mb-4 flex items-center justify-between">
                        <span className="flex items-center"><Trophy className="w-5 h-5 mr-2 text-yellow-300" />Top Influencers</span>
                        <span className="text-[10px] uppercase tracking-wider text-indigo-200 bg-white/10 px-2 rounded-full">Campus Rankings</span>
                    </h3>
                    <div className="space-y-3">
                        {leaderboard.map((leader, i) => (
                            <div key={leader.id || leader._id} className="flex items-center justify-between bg-white/10 rounded-lg p-2 backdrop-blur-sm border border-white/5 transition-all hover:bg-white/20">
                                <div className="flex items-center gap-3">
                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                                        i === 0 ? 'bg-yellow-400 text-yellow-900 shadow-[0_0_10px_rgba(250,204,21,0.5)]' :
                                        i === 1 ? 'bg-slate-300 text-slate-800' :
                                        i === 2 ? 'bg-amber-600 text-amber-50' : 'bg-indigo-800 text-indigo-200'
                                    }`}>
                                        {i + 1}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-semibold text-white leading-tight">{leader.name}</span>
                                        <span className="text-[10px] text-indigo-200 leading-tight">{leader.department || 'Student'}</span>
                                    </div>
                                </div>
                                <div className="text-right flex flex-col items-end">
                                    <span className="text-sm font-black text-yellow-300">{leader.reputationScore} XP</span>
                                    {leader.achievements && leader.achievements.length > 0 && (
                                        <div className="flex -space-x-1 mt-0.5">
                                            {leader.achievements.slice(0,3).map(a => (
                                                <div key={a} className="w-3 h-3 rounded-full bg-white/20 border-border-indigo-400" title={a} />
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                        {leaderboard.length === 0 && (
                            <p className="text-indigo-200 text-sm italic">Loading ranks...</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Campus Updates */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 transition-colors">
                <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center">
                    <Bell className="w-4 h-4 mr-2 text-indigo-600 dark:text-indigo-400" />
                    Campus Updates
                </h3>
                <div className="space-y-6 relative">
                    {/* Vertical Line */}
                    <div className="absolute left-[5px] top-2 bottom-2 w-0.5 bg-slate-100"></div>
                    
                    {updates.map((update, index) => (
                        <div key={update.id || update._id || index} className="relative pl-6">
                            <div className="absolute left-0 top-1.5 w-2.5 h-2.5 rounded-full bg-blue-500 border-2 border-white ring-1 ring-blue-100"></div>
                            <p className="text-sm font-medium text-slate-800 leading-tight mb-1">{update.title}</p>
                            <p className="text-xs text-slate-400">{update.date}</p>
                        </div>
                    ))}
                    
                    <button 
                        onClick={() => onNavigate('notifications')}
                        className="text-xs font-medium text-blue-600 hover:text-blue-700 w-full text-right mt-2"
                    >
                        View All Notifications
                    </button>
                </div>
            </div>

            {/* Campus Health & Impact Stats */}
            <div className="bg-slate-800 dark:bg-slate-950 rounded-xl shadow-md border border-slate-700 p-6 text-white relative overflow-hidden transition-colors group">
                <div className="absolute -top-10 -right-10 p-4 opacity-5 bg-gradient-to-br from-indigo-500 to-purple-500 w-40 h-40 rounded-full blur-2xl group-hover:blur-3xl transition-all"></div>
                <div className="absolute top-0 right-0 p-4 opacity-10 transition-transform group-hover:rotate-12 duration-500">
                    <Target className="w-24 h-24" />
                </div>
                
                <h3 className="font-bold text-lg mb-4 relative z-10 flex items-center">
                    <Activity className="w-5 h-5 mr-2 text-indigo-400" />
                    Campus Health
                </h3>
                
                <div className="mb-6 relative z-10">
                    <div className="flex justify-between items-end mb-2">
                        <span className="text-3xl font-black text-white">
                            {allIssues.length > 0 ? Math.round((allIssues.filter(i => i.status === IssueStatus.RESOLVED).length / allIssues.length) * 100) : 100}%
                        </span>
                        <span className="text-xs text-indigo-300 font-medium pb-1 uppercase tracking-wider">Resolution Rate</span>
                    </div>
                    <div className="w-full bg-slate-700 rounded-full h-2.5 overflow-hidden border border-slate-600">
                        <div 
                            className="bg-gradient-to-r from-emerald-400 to-indigo-500 h-2.5 rounded-full relative transition-all duration-1000 ease-out" 
                            style={{width: `${allIssues.length > 0 ? Math.round((allIssues.filter(i => i.status === IssueStatus.RESOLVED).length / allIssues.length) * 100) : 100}%`}}
                        >
                            <div className="absolute top-0 right-0 bottom-0 left-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.15)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.15)_50%,rgba(255,255,255,0.15)_75%,transparent_75%,transparent)] bg-[length:1rem_1rem] animate-[progress-pulse_1s_linear_infinite]"></div>
                        </div>
                    </div>
                </div>
                
                <p className="text-slate-400 text-xs mb-3 relative z-10 uppercase tracking-wider font-bold">Your Impact</p>
                
                <div className="grid grid-cols-2 gap-4 relative z-10">
                    <div className="bg-slate-700/50 dark:bg-white/5 rounded-lg p-3 backdrop-blur-sm border border-slate-600/50 hover:border-indigo-500/50 transition-colors">
                        <span className="block text-2xl font-bold text-indigo-300 animate-pulse-soft">{allIssues.filter(i => i.votes.includes(userId)).length}</span>
                        <span className="text-[10px] text-slate-400 uppercase tracking-wide">Issues Voted</span>
                    </div>
                    <div className="bg-slate-700/50 dark:bg-white/5 rounded-lg p-3 backdrop-blur-sm border border-slate-600/50 hover:border-emerald-500/50 transition-colors">
                        <span className="block text-2xl font-bold text-emerald-400 animate-pulse-soft">{myIssues.filter(i => i.status === IssueStatus.RESOLVED).length}</span>
                        <span className="text-[10px] text-slate-400 uppercase tracking-wide">Issues Solved</span>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};