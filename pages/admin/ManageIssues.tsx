import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { getIssues, saveIssue, addNotification, getStaffUsers } from '../../services/storage';
import { Issue, IssueStatus, IssuePriority } from '../../types';
import { isIssueEscalated } from '../../constants';
import { StatusBadge } from '../../components/StatusBadge';
import { Filter, Search, LayoutGrid, List, MoreHorizontal, ArrowRight, Download, RefreshCw, UserPlus, Check, ChevronDown, Zap, Sparkles } from 'lucide-react';

const getSentiment = (desc: string) => {
    if (!desc) return 'Neutral 😐';
    const lower = desc.toLowerCase();
    if (/(emergency|urgent|immediate|danger|safety|critical|asap|broken|hazard)/.test(lower)) return 'Urgent 🚨';
    if (/(angry|frustrated|unacceptable|terrible|worst|hate|mad|ridiculous|annoying|sick)/.test(lower)) return 'Frustrated 😠';
    if (/(thanks|please|hoping|kindly|appreciate)/.test(lower)) return 'Polite ✨';
    return 'Neutral 😐';
};

const getAISummary = (desc: string, category: string) => {
    if (!desc || desc.length < 30) return desc;
    return `Student reported an issue related to ${category}. Needs attention.`;
};

interface SearchableSelectProps {
  options: { id: string; name: string; role: string }[];
  value: string | undefined;
  onChange: (value: string) => void;
  placeholder?: string;
}

const SearchableSelect: React.FC<SearchableSelectProps> = ({ options, value, onChange, placeholder = "Select..." }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = React.useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0, width: 0 });

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
         const portal = document.getElementById('searchable-select-portal');
         if (portal && portal.contains(event.target as Node)) return;
         setIsOpen(false);
      }
    };

    const handleScroll = () => {
        if(isOpen) setIsOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("scroll", handleScroll, true);
    window.addEventListener("resize", handleScroll);

    return () => {
        document.removeEventListener("mousedown", handleClickOutside);
        window.removeEventListener("scroll", handleScroll, true);
        window.removeEventListener("resize", handleScroll);
    };
  }, [isOpen]);

  const toggleDropdown = () => {
      if (!isOpen && dropdownRef.current) {
          const rect = dropdownRef.current.getBoundingClientRect();
          setPosition({
              top: rect.bottom + 4,
              left: rect.left,
              width: rect.width
          });
      }
      setIsOpen(!isOpen);
  };

  const filteredOptions = options.filter(option =>
    option.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    option.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedOption = options.find(o => o.name === value);

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <div
        className={`flex items-center justify-between w-full px-3 py-2 text-xs bg-white border rounded-md cursor-pointer transition-all ${
          isOpen ? 'border-indigo-500 ring-1 ring-indigo-500 shadow-sm' : 'border-slate-200 hover:border-slate-300'
        }`}
        onClick={toggleDropdown}
      >
        <div className="flex flex-col items-start overflow-hidden">
            <span className={`truncate font-medium ${!value ? 'text-slate-400' : 'text-slate-700'}`}>
            {value ? selectedOption?.name || value : placeholder}
            </span>
            {value && selectedOption && (
                <span className="text-[10px] text-slate-400">{selectedOption.role}</span>
            )}
        </div>
        <ChevronDown className={`w-3 h-3 text-slate-400 ml-2 flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </div>

      {isOpen && createPortal(
        <div 
            id="searchable-select-portal"
            className="fixed z-[9999] bg-white border border-slate-200 rounded-lg shadow-xl max-h-60 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-100"
            style={{ 
                top: `${position.top}px`, 
                left: `${position.left}px`, 
                width: `${position.width}px` 
            }}
        >
          <div className="p-2 border-b border-slate-100 bg-white">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-md focus:outline-none focus:border-indigo-500 bg-slate-50 focus:bg-white transition-colors"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                autoFocus
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>
          <div className="overflow-y-auto flex-1 p-1 custom-scrollbar">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => (
                <div
                  key={option.id}
                  className={`px-3 py-2 text-xs rounded-md cursor-pointer flex justify-between items-center group transition-colors ${
                    value === option.name ? 'bg-indigo-50 text-indigo-700' : 'text-slate-700 hover:bg-slate-50'
                  }`}
                  onClick={() => {
                    onChange(option.name);
                    setIsOpen(false);
                    setSearchTerm("");
                  }}
                >
                  <div className="flex flex-col">
                      <span className="font-medium">{option.name}</span>
                  </div>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded border ${
                      value === option.name 
                      ? 'bg-indigo-100 text-indigo-700 border-indigo-200' 
                      : 'bg-slate-100 text-slate-500 border-slate-200 group-hover:bg-white'
                  }`}>
                      {option.role}
                  </span>
                </div>
              ))
            ) : (
              <div className="px-3 py-8 text-center">
                <p className="text-xs text-slate-500 font-medium">No staff found</p>
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export const ManageIssues: React.FC = () => {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [staffList, setStaffList] = useState<{ id: string; name: string; role: string }[]>([]);
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isAutoTriaging, setIsAutoTriaging] = useState(false);
  const [summarizedIssues, setSummarizedIssues] = useState<Record<string, string>>({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsRefreshing(true);
    try {
        const fetchedIssues = await getIssues();
        setIssues(fetchedIssues);
        const staff = await getStaffUsers();
        setStaffList(staff);
    } finally {
        setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  const handleExportCSV = () => {
    const headers = ['ID', 'Title', 'Description', 'Category', 'Location', 'Priority', 'Status', 'Reporter', 'Assignee', 'Created At'];
    const csvContent = [
        headers.join(','),
        ...issues.map((i: any) => [
            i.id || i._id,
            `"${i.title.replace(/"/g, '""')}"`,
            `"${i.description.replace(/"/g, '""')}"`,
            i.category,
            `"${i.location.replace(/"/g, '""')}"`,
            i.priority,
            i.status,
            i.studentName,
            i.assignedTo || 'Unassigned',
            new Date(i.createdAt).toLocaleDateString()
        ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `issues_export_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
  };

  const handleAssignUser = async (issueId: string, staffName: string) => {
    const issueToUpdate = issues.find((i: any) => (i.id || i._id) === issueId);
    if (!issueToUpdate) return;

    try {
        const staffObj = staffList.find(s => s.name === staffName);
        const updated = { 
            ...issueToUpdate, 
            assignedTo: staffName, 
            assignedFacultyId: staffObj ? staffObj.id : undefined,
            status: issueToUpdate.status === IssueStatus.SUBMITTED ? IssueStatus.ASSIGNED : issueToUpdate.status 
        };
        await saveIssue(updated);
        
        // Notify student
        await addNotification({
            userId: updated.studentId,
            title: 'Issue Assigned',
            message: `Your issue "${updated.title}" has been assigned to ${staffName}.`,
            type: 'info',
            isRead: false
        });

        loadData();
    } catch(e) {
        console.error("Failed to assign user", e);
    }
  };

  const handleStatusUpdate = async (issueId: string, newStatus: IssueStatus) => {
    const issueToUpdate = issues.find((i: any) => (i.id || i._id) === issueId);
    if (!issueToUpdate) return;

    try {
        const updated = { ...issueToUpdate, status: newStatus, updatedAt: new Date().toISOString() };
        
        // Prepare Notification Data
        let notifTitle = '';
        let notifMessage = '';
        let notifType: 'success' | 'info' | 'warning' | 'error' = 'info';

        if (newStatus === IssueStatus.RESOLVED) {
            updated.resolvedAt = new Date().toISOString();
            notifTitle = 'Issue Resolved';
            notifMessage = `Your issue "${updated.title}" has been marked as resolved by the admin.`;
            notifType = 'success';
        } else if (newStatus === IssueStatus.ASSIGNED) {
            notifTitle = 'Issue Assigned';
            notifMessage = `Your issue "${updated.title}" has been assigned to a staff member.`;
            notifType = 'info';
        } else if (newStatus === IssueStatus.IN_PROGRESS) {
            notifTitle = 'Work Started';
            notifMessage = `Work has started on your issue "${updated.title}".`;
            notifType = 'info';
        }

        await saveIssue(updated);

        // Send Notification if applicable
        if (notifTitle) {
            await addNotification({
                userId: updated.studentId,
                title: notifTitle,
                message: notifMessage,
                type: notifType,
                isRead: false
            });
        }
        
        loadData();
    } catch(e) {
        console.error("Failed to update status", e);
    }
  };

  const handlePriorityUpdate = async (issueId: string, newPriority: IssuePriority) => {
    const issueToUpdate = issues.find((i: any) => (i.id || i._id) === issueId);
    if (!issueToUpdate) return;

    try {
        const updated = { ...issueToUpdate, priority: newPriority };
        await saveIssue(updated);
        loadData();
    } catch(e) {
        console.error("Failed to update priority", e);
    }
  }

  const handleTrustUpdate = async (issueId: string, action: 'verify' | 'fake') => {
      const issueToUpdate = issues.find((i: any) => (i.id || i._id) === issueId);
      if (!issueToUpdate) return;
      
      try {
          if (action === 'verify') {
              await saveIssue({ ...issueToUpdate, isVerified: true, isFlagged: false });
          } else {
              await saveIssue({ ...issueToUpdate, status: IssueStatus.RESOLVED, isFlagged: true, isVerified: false });
              // Status resolved triggers the backend rejection logic because it's marked as flagged. Wait, backend logic for rejection is status: 'Rejected'
              await saveIssue({ id: issueId, _id: issueId, status: 'Rejected', isFlagged: true } as any);
          }
          loadData();
      } catch (e) { console.error(e); }
  }

  const handleAutoTriage = async () => {
      setIsAutoTriaging(true);
      
      const categoryRoleMap: Record<string, string> = {
          'Infrastructure': 'Facility',
          'Technical': 'Technical',
          'Hostel': 'Hostel',
          'Academic': 'Academic',
          'Mess/Canteen': 'Mess',
          'Other': 'Admin'
      };

      const unassignedIssues = issues.filter(i => i.status === IssueStatus.SUBMITTED && !i.assignedTo);
      for (const issue of unassignedIssues) {
          const issueId = issue.id || issue._id;
          const roleNeeded = categoryRoleMap[issue.category] || 'Admin';
          const staffToAssign = staffList.find(s => s.role === roleNeeded)?.name;
          
          if (staffToAssign) {
              await handleAssignUser(issueId as string, staffToAssign);
              
              // Smart Priority logic
              if (issue.category === 'Infrastructure' || issue.category === 'Technical') {
                  const sentiment = getSentiment(issue.description);
                  if (sentiment.includes('Urgent') || sentiment.includes('Frustrated')) {
                      await handlePriorityUpdate(issueId as string, IssuePriority.HIGH);
                  }
              }
          }
      }
      
      setTimeout(() => {
          setIsAutoTriaging(false);
          loadData();
      }, 1500);
  };

  const handleSummarize = (issueId: string, desc: string, category: string) => {
      setSummarizedIssues(prev => ({ ...prev, [issueId]: getAISummary(desc, category) }));
  };

  const filteredIssues = issues.filter(i => {
    if (filter !== 'All' && i.status !== filter) return false;
    if (search && !i.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }).sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div className="p-8 max-w-[1600px] mx-auto h-full flex flex-col">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
            <h1 className="text-2xl font-bold text-slate-800">Issue Management</h1>
            <p className="text-slate-500 text-sm">Track, assign, and resolve campus issues.</p>
        </div>
        <div className="flex items-center space-x-3">
             <button 
                onClick={loadData}
                disabled={isRefreshing}
                className={`p-2 rounded-lg border border-slate-200 bg-white text-slate-500 hover:text-indigo-600 hover:border-indigo-200 transition-all ${isRefreshing ? 'opacity-50' : ''}`}
                title="Refresh Data"
             >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
             </button>
             <button 
                onClick={handleAutoTriage}
                disabled={isAutoTriaging}
                className="flex items-center space-x-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white border-0 px-4 py-2 rounded-lg text-sm font-medium shadow-md shadow-indigo-200 hover:shadow-lg hover:-translate-y-0.5 transition-all"
             >
                <Zap className={`w-4 h-4 ${isAutoTriaging ? 'animate-pulse text-yellow-300' : 'text-yellow-300'}`} />
                <span className="hidden sm:inline">{isAutoTriaging ? 'Analyzing Profiles...' : 'AI Auto-Triage'}</span>
             </button>
             <button 
                onClick={handleExportCSV}
                className="flex items-center space-x-2 bg-white border border-slate-200 px-4 py-2 rounded-lg text-sm font-medium text-slate-600 shadow-sm hover:bg-slate-50 hover:text-indigo-600 transition-colors"
             >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Export CSV</span>
             </button>
             <div className="bg-white border border-slate-200 rounded-lg p-1 flex">
                <button 
                    onClick={() => setViewMode('table')}
                    className={`p-2 rounded-md transition-colors ${viewMode === 'table' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
                >
                    <List className="w-4 h-4" />
                </button>
                <button 
                    onClick={() => setViewMode('kanban')}
                    className={`p-2 rounded-md transition-colors ${viewMode === 'kanban' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
                >
                    <LayoutGrid className="w-4 h-4" />
                </button>
             </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center mb-6">
        <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input 
                type="text" 
                placeholder="Search issues by ID, title or location..." 
                className="pl-10 pr-4 py-2 w-full border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm transition-all"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
            />
        </div>
        <div className="flex items-center space-x-2 w-full md:w-auto overflow-x-auto no-scrollbar">
            <Filter className="w-4 h-4 text-slate-500 mr-2" />
            {['All', IssueStatus.SUBMITTED, IssueStatus.ASSIGNED, IssueStatus.IN_PROGRESS, IssueStatus.RESOLVED].map(status => (
                <button
                    key={status}
                    onClick={() => setFilter(status)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors border ${
                        filter === status 
                        ? 'bg-indigo-50 text-indigo-700 border-indigo-200' 
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                >
                    {status}
                </button>
            ))}
        </div>
      </div>

      {/* View Modes */}
      {viewMode === 'table' ? (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex-1 animate-in fade-in">
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 text-sm">
                    <thead className="bg-slate-50">
                        <tr>
                            <th className="px-6 py-4 text-left font-semibold text-slate-500 uppercase tracking-wider text-xs">Issue Details</th>
                            <th className="px-6 py-4 text-left font-semibold text-slate-500 uppercase tracking-wider text-xs">Reporter</th>
                            <th className="px-6 py-4 text-left font-semibold text-slate-500 uppercase tracking-wider text-xs">Status</th>
                            <th className="px-6 py-4 text-left font-semibold text-slate-500 uppercase tracking-wider text-xs">Priority</th>
                            <th className="px-6 py-4 text-left font-semibold text-slate-500 uppercase tracking-wider text-xs">Assignee</th>
                            <th className="px-6 py-4 text-left font-semibold text-slate-500 uppercase tracking-wider text-xs">Workflow</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                        {filteredIssues.map((issue: any) => {
                            const issueId = issue.id || issue._id;
                            const isEscalated = isIssueEscalated(issue.createdAt, issue.status, issue.category);
                            return (
                            <tr key={issueId} className="hover:bg-slate-50 transition-colors group">
                                <td className="px-6 py-4 max-w-[250px]">
                                    <div className="font-semibold text-slate-900 mb-1 flex items-center gap-2">
                                        {issue.title}
                                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold whitespace-nowrap ${
                                            getSentiment(issue.description).includes('Urgent') ? 'bg-red-100 text-red-700' :
                                            getSentiment(issue.description).includes('Frustrated') ? 'bg-orange-100 text-orange-700' :
                                            'bg-slate-100 text-slate-600'
                                        }`}>
                                            {getSentiment(issue.description)}
                                        </span>
                                    </div>
                                    <div className="flex flex-col gap-1 mb-2">
                                        {summarizedIssues[issueId] ? (
                                            <p className="text-xs text-indigo-700 font-medium bg-indigo-50 p-2 rounded border border-indigo-100 whitespace-nowrap overflow-hidden text-ellipsis">
                                                <Sparkles className="w-3 h-3 inline mr-1" />
                                                {summarizedIssues[issueId]}
                                            </p>
                                        ) : (
                                            <button 
                                                onClick={() => handleSummarize(issueId, issue.description, issue.category)} 
                                                className="text-[10px] text-slate-400 hover:text-indigo-600 flex items-center transition-colors text-left"
                                            >
                                                <Sparkles className="w-3 h-3 mr-1" />
                                                Generate AI Summary
                                            </button>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2 text-[10px] text-slate-500">
                                        <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-600">{issue.category}</span>
                                        <span>•</span>
                                        <span>{issue.location}</span>
                                        <span>•</span>
                                        <span>{new Date(issue.createdAt).toLocaleDateString()}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center">
                                        <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-500 mr-2">
                                            {issue.isAnonymous ? 'A' : (issue.studentName ? issue.studentName[0] : 'U')}
                                        </div>
                                        <div>
                                            <p className="font-medium text-slate-700">{issue.isAnonymous ? 'Anonymous' : issue.studentName}</p>
                                            <div className="flex items-center mt-0.5">
                                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                                                    (issue.trustScore || 80) >= 80 ? 'bg-green-50 text-green-700 border-green-200' :
                                                    (issue.trustScore || 80) >= 50 ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                                                    'bg-red-50 text-red-700 border-red-200'
                                                }`}>
                                                    Trust: {issue.trustScore || 80}/100
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex flex-col items-start gap-1">
                                        {issue.status === 'Rejected' ? <span className="text-xs font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded">Rejected (Fake)</span> : <StatusBadge status={issue.status} />}
                                        {issue.isVerified && <span className="text-[10px] uppercase font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 flex items-center"><Check className="w-3 h-3 mr-0.5" /> Verified</span>}
                                        {issue.isFlagged && <span className="text-[10px] uppercase font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded border border-red-200 flex items-center">Flagged</span>}
                                        {isEscalated && (
                                            <span className="text-[10px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded border border-red-100 flex items-center">
                                                <div className="w-1.5 h-1.5 rounded-full bg-red-500 mr-1 animate-pulse"></div>
                                                SLA Breached
                                            </span>
                                        )}
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <select 
                                        value={issue.priority}
                                        onChange={(e) => handlePriorityUpdate(issueId, e.target.value as IssuePriority)}
                                        className={`text-xs border rounded-md px-2 py-1.5 font-medium focus:ring-2 focus:ring-indigo-100 outline-none cursor-pointer ${
                                            issue.priority === IssuePriority.HIGH ? 'text-red-700 bg-red-50 border-red-200' :
                                            issue.priority === IssuePriority.MEDIUM ? 'text-orange-700 bg-orange-50 border-orange-200' :
                                            'text-slate-700 bg-slate-50 border-slate-200'
                                        }`}
                                    >
                                        {Object.values(IssuePriority).map(p => (
                                            <option key={p} value={p}>{p}</option>
                                        ))}
                                    </select>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="relative min-w-[180px]">
                                        {issue.status !== IssueStatus.RESOLVED ? (
                                            <SearchableSelect 
                                                options={staffList}
                                                value={issue.assignedTo}
                                                onChange={(val) => handleAssignUser(issueId, val)}
                                                placeholder={staffList.length > 0 ? "Assign Staff..." : "No staff accounts found"}
                                            />
                                        ) : (
                                            <div className="flex items-center space-x-2 bg-slate-50 px-3 py-2 rounded-md border border-slate-200">
                                                <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-500">
                                                    {(issue.assignedTo || 'U')[0]}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-medium text-slate-700">
                                                        {issue.assignedTo || 'Unassigned'}
                                                    </span>
                                                    {issue.assignedTo && (
                                                        <span className="text-[10px] text-slate-400">
                                                            {staffList.find(s => s.name === issue.assignedTo)?.role || 'Staff'}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    {issue.status !== IssueStatus.RESOLVED && issue.status !== 'Rejected' ? (
                                        <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <div className="flex items-center gap-1">
                                                {!issue.isVerified && (
                                                    <button 
                                                        onClick={() => handleTrustUpdate(issueId, 'verify')}
                                                        className="text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-1 rounded hover:bg-emerald-100 transition"
                                                        title="Verify Issue (Marks as Genuine & High Priority)"
                                                    >
                                                        Verify
                                                    </button>
                                                )}
                                                {!issue.isFlagged && (
                                                    <button 
                                                        onClick={() => handleTrustUpdate(issueId, 'fake')}
                                                        className="text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 px-2 py-1 rounded hover:bg-rose-100 transition"
                                                        title="Mark as Fake (Drops user trust score & Rejects)"
                                                    >
                                                        Fake
                                                    </button>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-1">
                                                {issue.status === IssueStatus.SUBMITTED && (
                                                    <button 
                                                        onClick={() => handleStatusUpdate(issueId, IssueStatus.ASSIGNED)}
                                                        className="flex items-center text-xs bg-indigo-600 text-white px-2 py-1 rounded-md hover:bg-indigo-700 font-medium shadow-sm transition-colors"
                                                    >
                                                        Accept <Check className="w-3 h-3 ml-1" />
                                                    </button>
                                                )}
                                                {(issue.status === IssueStatus.ASSIGNED || issue.status === IssueStatus.IN_PROGRESS) && (
                                                    <div className="flex gap-2">
                                                         {issue.status === IssueStatus.ASSIGNED && (
                                                            <button 
                                                                onClick={() => handleStatusUpdate(issueId, IssueStatus.IN_PROGRESS)}
                                                                className="text-xs border border-blue-200 bg-blue-50 text-blue-700 px-2 py-1 rounded-md hover:bg-blue-100 font-medium transition-colors"
                                                            >
                                                                Start Work
                                                            </button> 
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ) : (
                                        <span className="text-xs text-slate-400 italic font-medium">{issue.status}</span>
                                    )}
                                </td>
                            </tr>
                        )})}
                    </tbody>
                </table>
            </div>
            {filteredIssues.length === 0 && (
                <div className="p-12 text-center text-slate-500">
                    No issues found matching your filters.
                </div>
            )}
          </div>
      ) : (
        <div className="flex-1 overflow-x-auto overflow-y-hidden">
            <div className="flex gap-6 h-full min-w-[1000px] pb-4">
                {[IssueStatus.SUBMITTED, IssueStatus.ASSIGNED, IssueStatus.IN_PROGRESS, IssueStatus.RESOLVED].map(status => {
                     const statusIssues = filteredIssues.filter(i => i.status === status);
                     const borderColor = 
                        status === IssueStatus.SUBMITTED ? 'border-t-slate-400' : 
                        status === IssueStatus.ASSIGNED ? 'border-t-blue-500' :
                        status === IssueStatus.IN_PROGRESS ? 'border-t-orange-500' : 'border-t-green-500';
                     
                     return (
                        <div key={status} className="flex-1 flex flex-col bg-slate-100/50 rounded-xl border border-slate-200 h-full max-h-full">
                            <div className={`p-4 border-t-4 ${borderColor} bg-white rounded-t-xl border-b border-slate-200 flex justify-between items-center`}>
                                <h3 className="font-bold text-slate-700 text-sm">{status}</h3>
                                <span className="bg-slate-100 text-slate-600 text-xs font-bold px-2 py-0.5 rounded-full">{statusIssues.length}</span>
                            </div>
                            <div className="p-4 flex-1 overflow-y-auto space-y-3 custom-scrollbar">
                                {statusIssues.map((issue: any) => (
                                    <div key={issue.id || issue._id} className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 hover:shadow-md transition-shadow group">
                                        <div className="flex justify-between items-start mb-2">
                                            <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded border ${
                                                issue.priority === IssuePriority.HIGH ? 'bg-red-50 text-red-600 border-red-100' :
                                                issue.priority === IssuePriority.MEDIUM ? 'bg-orange-50 text-orange-600 border-orange-100' :
                                                'bg-slate-50 text-slate-600 border-slate-100'
                                            }`}>
                                                {issue.priority}
                                            </span>
                                            <button className="text-slate-400 hover:text-slate-600">
                                                <MoreHorizontal className="w-4 h-4" />
                                            </button>
                                        </div>
                                        <h4 className="font-semibold text-slate-800 text-sm mb-1 line-clamp-2">{issue.title}</h4>
                                        <p className="text-xs text-slate-500 mb-3">{issue.category} • {issue.location}</p>
                                        
                                        <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-50">
                                            <div className="flex items-center space-x-2">
                                                <div className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-[10px] font-bold">
                                                    {issue.isAnonymous ? 'A' : (issue.studentName ? issue.studentName[0] : 'U')}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-xs text-slate-500 truncate max-w-[80px]">{issue.isAnonymous ? 'Anon' : (issue.studentName?.split(' ')[0] || 'Unknown')}</span>
                                                    {issue.assignedTo && <span className="text-[9px] text-blue-600 font-medium">→ {issue.assignedTo.split(' ')[0]}</span>}
                                                </div>
                                            </div>
                                            
                                            {/* Quick Actions in Kanban */}
                                            {status !== IssueStatus.RESOLVED && (
                                                <div className="flex gap-1">
                                                    {status !== IssueStatus.IN_PROGRESS && (
                                                        <button 
                                                            title="Move Forward"
                                                            onClick={() => handleStatusUpdate((issue.id || issue._id), status === IssueStatus.SUBMITTED ? IssueStatus.ASSIGNED : IssueStatus.IN_PROGRESS)}
                                                            className="p-1 rounded bg-slate-50 hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 border border-slate-200 transition-colors"
                                                        >
                                                            <ArrowRight className="w-3 h-3" />
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                     )
                })}
            </div>
        </div>
      )}
    </div>
  );
};