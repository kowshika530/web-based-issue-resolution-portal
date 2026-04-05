import React, { useEffect, useState, useMemo } from 'react';
import { isIssueEscalated, SLA_HOURS } from '../../constants';
import { getIssues as fetchIssues, saveCampusUpdate, getCampusUpdates, getAllUsers } from '../../services/storage';
import { Issue, IssueStatus, CampusUpdate, IssueCategory, User } from '../../types';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, BarChart, Bar } from 'recharts';
import { AlertCircle, Clock, ShieldAlert, CheckCircle2, Star, TrendingUp, Radio, Send, MapPin, Activity, Timer } from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [updates, setUpdates] = useState<CampusUpdate[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  
  // Broadcast State
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastType, setBroadcastType] = useState<'info' | 'maintenance' | 'event'>('info');
  const [showBroadcastSuccess, setShowBroadcastSuccess] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const fetchedIssues = await fetchIssues();
    setIssues(fetchedIssues);
    const fetchedUpdates = await getCampusUpdates();
    setUpdates(fetchedUpdates);
    const fetchedUsers = await getAllUsers();
    setUsers(fetchedUsers);
  };

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastTitle.trim()) return;

    const newUpdate: Partial<CampusUpdate> = {
        title: broadcastTitle,
        date: 'Just Now',
        type: broadcastType
    };

    await saveCampusUpdate(newUpdate);
    setUpdates(await getCampusUpdates());
    setBroadcastTitle('');
    setShowBroadcastSuccess(true);
    setTimeout(() => setShowBroadcastSuccess(false), 3000);
  };

  const total = issues.length;
  const escalated = issues.filter(i => isIssueEscalated(i.createdAt, i.status, i.category)).length;
  const resolved = issues.filter(i => i.status === IssueStatus.RESOLVED).length;
  const pending = total - resolved;

  // Chart Data Preparation
  const trendData = [
    { name: 'Mon', new: 4, resolved: 2 },
    { name: 'Tue', new: 6, resolved: 4 },
    { name: 'Wed', new: 8, resolved: 5 },
    { name: 'Thu', new: 5, resolved: 6 },
    { name: 'Fri', new: 10, resolved: 7 },
    { name: 'Sat', new: 3, resolved: 2 },
    { name: 'Sun', new: 2, resolved: 1 },
  ];

  // Category Distribution Data
  const categoryData = Object.values(IssueCategory).map(cat => ({
    name: cat,
    value: issues.filter(i => i.category === cat).length
  })).filter(item => item.value > 0);

  const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  // Top Problem Areas (Hotspots)
  const locationCounts: Record<string, number> = {};
  issues.forEach(i => {
    locationCounts[i.location] = (locationCounts[i.location] || 0) + 1;
  });
  const hotspots = Object.entries(locationCounts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 4);

  // SLA Metrics Calculation
  const slaMetrics = useMemo(() => {
    const resolvedIssues = issues.filter(i => i.status === IssueStatus.RESOLVED);
    if (resolvedIssues.length === 0) return { overall: 100, categories: [] };

    let metCount = 0;
    const catStats: Record<string, { total: number, met: number }> = {};

    resolvedIssues.forEach(issue => {
        if (!issue.resolvedAt) return;
        const created = new Date(issue.createdAt).getTime();
        const resolved = new Date(issue.resolvedAt).getTime();
        const hoursTaken = (resolved - created) / (1000 * 60 * 60);
        const sla = SLA_HOURS[issue.category];
        const met = hoursTaken <= sla;

        if (met) metCount++;

        if (!catStats[issue.category]) catStats[issue.category] = { total: 0, met: 0 };
        catStats[issue.category].total++;
        if (met) catStats[issue.category].met++;
    });

    const overall = Math.round((metCount / resolvedIssues.length) * 100);
    
    // Convert to array and sort by rate ascending (worst first)
    const categories = Object.entries(catStats).map(([name, stats]) => ({
        name,
        rate: Math.round((stats.met / stats.total) * 100),
        count: stats.total
    })).sort((a, b) => a.rate - b.rate);

    return { overall, categories };
  }, [issues]);

  // Resolution Time Analytics
  const resolutionStats = useMemo(() => {
    const resolvedIssues = issues.filter(i => i.status === IssueStatus.RESOLVED && i.resolvedAt);
    
    const byAssignee: Record<string, { totalTime: number; count: number }> = {};
    const byCategory: Record<string, { totalTime: number; count: number }> = {};

    resolvedIssues.forEach(issue => {
      const created = new Date(issue.createdAt).getTime();
      const resolved = new Date(issue.resolvedAt!).getTime();
      const hours = (resolved - created) / (1000 * 60 * 60);
      
      // By Assignee
      const assignee = issue.assignedTo || 'Unassigned';
      if (!byAssignee[assignee]) byAssignee[assignee] = { totalTime: 0, count: 0 };
      byAssignee[assignee].totalTime += hours;
      byAssignee[assignee].count++;

      // By Category
      const category = issue.category;
      if (!byCategory[category]) byCategory[category] = { totalTime: 0, count: 0 };
      byCategory[category].totalTime += hours;
      byCategory[category].count++;
    });

    const assigneeData = Object.entries(byAssignee).map(([name, stats]) => ({
      name,
      avgHours: Math.round(stats.totalTime / stats.count)
    })).sort((a, b) => b.avgHours - a.avgHours);

    const categoryData = Object.entries(byCategory).map(([name, stats]) => ({
      name,
      avgHours: Math.round(stats.totalTime / stats.count)
    })).sort((a, b) => b.avgHours - a.avgHours);

    return { assigneeData, categoryData };
  }, [issues]);

  return (
    <div className="p-8 max-w-[1600px] mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white transition-colors">Admin Command Center</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 transition-colors">Real-time overview of campus issues and performance.</p>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-start justify-between relative overflow-hidden group transition-colors">
           <div className="absolute right-0 top-0 w-24 h-24 bg-blue-50 dark:bg-blue-900/10 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
           <div className="relative z-10">
              <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Total Complaints</p>
              <h3 className="text-3xl font-bold text-slate-800 dark:text-white mt-2">{total}</h3>
              <p className="text-xs text-green-600 dark:text-green-400 mt-1 font-medium flex items-center">
                <TrendingUp className="w-3 h-3 mr-1" /> +12% this week
              </p>
           </div>
           <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg relative z-10">
                <ShieldAlert className="w-6 h-6 text-blue-600 dark:text-blue-400" />
           </div>
        </div>
        
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-start justify-between relative overflow-hidden group transition-colors">
           <div className="absolute right-0 top-0 w-24 h-24 bg-orange-50 dark:bg-orange-900/10 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
           <div className="relative z-10">
              <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Active Pending</p>
              <h3 className="text-3xl font-bold text-slate-800 dark:text-white mt-2">{pending}</h3>
              <p className="text-xs text-orange-600 dark:text-orange-400 mt-1 font-medium">{escalated} Escalated</p>
           </div>
           <div className="p-3 bg-orange-50 dark:bg-orange-900/30 rounded-lg relative z-10">
                <Clock className="w-6 h-6 text-orange-500 dark:text-orange-400" />
           </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-start justify-between relative overflow-hidden group transition-colors">
           <div className="absolute right-0 top-0 w-24 h-24 bg-purple-50 dark:bg-purple-900/10 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
           <div className="relative z-10">
              <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Avg. Resolution</p>
              <h3 className="text-3xl font-bold text-slate-800 dark:text-white mt-2">24h</h3>
              <p className="text-xs text-purple-600 dark:text-purple-400 mt-1 font-medium">Within SLA</p>
           </div>
           <div className="p-3 bg-purple-50 dark:bg-purple-900/30 rounded-lg relative z-10">
                <Star className="w-6 h-6 text-purple-600 dark:text-purple-400" />
           </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-start justify-between relative overflow-hidden group transition-colors">
           <div className="absolute right-0 top-0 w-24 h-24 bg-green-50 dark:bg-green-900/10 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
           <div className="relative z-10">
              <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Success Rate</p>
              <h3 className="text-3xl font-bold text-slate-800 dark:text-white mt-2">{total > 0 ? Math.round((resolved/total) * 100) : 0}%</h3>
              <p className="text-xs text-green-600 dark:text-green-400 mt-1 font-medium">Efficiency Score</p>
           </div>
           <div className="p-3 bg-green-50 dark:bg-green-900/30 rounded-lg relative z-10">
                <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400" />
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Trend Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
            <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-slate-800 dark:text-slate-100">Weekly Activity Trends</h3>
                <div className="flex items-center space-x-2">
                    <div className="flex items-center text-xs text-slate-500 dark:text-slate-400">
                        <span className="w-2 h-2 rounded-full bg-blue-500 mr-1"></span> New
                    </div>
                    <div className="flex items-center text-xs text-slate-500">
                        <span className="w-2 h-2 rounded-full bg-green-500 mr-1"></span> Resolved
                    </div>
                </div>
            </div>
            <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trendData}>
                        <defs>
                            <linearGradient id="colorNew" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                            </linearGradient>
                            <linearGradient id="colorResolved" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                        <Tooltip 
                            contentStyle={{backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} 
                            itemStyle={{fontSize: '12px', fontWeight: 500}}
                        />
                        <Area type="monotone" dataKey="new" name="New Issues" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorNew)" />
                        <Area type="monotone" dataKey="resolved" name="Resolved" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorResolved)" />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>

        {/* Category Distribution Pie Chart */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col transition-colors">
            <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-4">Issue Categories</h3>
            <div className="flex-1 min-h-[250px] relative">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={categoryData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                        >
                            {categoryData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip />
                        <Legend verticalAlign="bottom" height={36} iconType="circle" />
                    </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="text-center">
                        <span className="block text-2xl font-bold text-slate-800 dark:text-white">{total}</span>
                        <span className="text-xs text-slate-400 uppercase">Total</span>
                    </div>
                </div>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* User Trust Analytics */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
            <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center">
                <ShieldAlert className="w-5 h-5 mr-2 text-red-500" />
                User Trust & Spam Risk
            </h3>
            <div className="space-y-4 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                {users.filter(u => (u.fakeIssuesCount || 0) > 0).map((u, idx) => (
                    <div key={u.id || u._id} className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/10 rounded-lg border border-red-100 dark:border-red-900/50">
                        <div className="flex flex-col">
                            <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">{u.name}</span>
                            <span className="text-xs text-slate-500">{u.email}</span>
                        </div>
                        <div className="text-right">
                             <div className="text-sm font-bold text-red-600 dark:text-red-400">{u.fakeIssuesCount} Fake</div>
                             <div className="text-[10px] text-slate-500 dark:text-slate-400">Trust: {u.trustScore || 80}%</div>
                        </div>
                    </div>
                ))}
                {users.filter(u => (u.fakeIssuesCount || 0) > 0).length === 0 && (
                    <p className="text-slate-500 dark:text-slate-400 text-sm text-center py-4">No spam activity detected.</p>
                )}
            </div>
        </div>

        {/* Hotspot Analysis */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
            <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center">
                <MapPin className="w-5 h-5 mr-2 text-rose-500" />
                Problem Hotspots
            </h3>
            <div className="space-y-4">
                {hotspots.map(([location, count], idx) => (
                    <div key={location} className="flex items-center justify-between">
                        <div className="flex items-center">
                            <span className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold flex items-center justify-center mr-3">
                                {idx + 1}
                            </span>
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{location}</span>
                        </div>
                        <div className="flex items-center">
                            <div className="w-24 h-2 bg-slate-100 dark:bg-slate-800 rounded-full mr-3 overflow-hidden">
                                <div 
                                    className="h-full bg-rose-500 rounded-full" 
                                    style={{ width: `${(count / total) * 100}%` }}
                                ></div>
                            </div>
                            <span className="text-xs font-bold text-slate-600 dark:text-slate-400">{count}</span>
                        </div>
                    </div>
                ))}
                {hotspots.length === 0 && <p className="text-slate-400 text-sm">No data available.</p>}
            </div>
        </div>

        {/* Broadcast Center */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col transition-colors">
            <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center">
                <Radio className="w-5 h-5 mr-2 text-indigo-500" />
                Broadcast Center
            </h3>
            
            <form onSubmit={handleBroadcast} className="mb-6 space-y-4">
                <div>
                    <input 
                        type="text" 
                        value={broadcastTitle}
                        onChange={(e) => setBroadcastTitle(e.target.value)}
                        placeholder="Type announcement..."
                        className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                </div>
                
                <div className="flex items-center justify-between">
                    <div className="flex gap-2">
                        {(['info', 'maintenance', 'event'] as const).map(type => (
                            <button
                                key={type}
                                type="button"
                                onClick={() => setBroadcastType(type)}
                                className={`w-8 h-8 flex items-center justify-center rounded-lg border transition-all ${
                                    broadcastType === type
                                    ? 'bg-indigo-50 border-indigo-500 text-indigo-700'
                                    : 'border-slate-200 text-slate-400 hover:bg-slate-50'
                                }`}
                                title={type}
                            >
                                <div className={`w-2 h-2 rounded-full ${
                                    type === 'maintenance' ? 'bg-orange-500' : type === 'event' ? 'bg-purple-500' : 'bg-blue-500'
                                }`} />
                            </button>
                        ))}
                    </div>

                    <button 
                        type="submit"
                        className="bg-slate-800 dark:bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-900 dark:hover:bg-indigo-700 transition-colors flex items-center shadow-sm"
                    >
                        <Send className="w-3 h-3 mr-2" />
                        Send
                    </button>
                </div>
                {showBroadcastSuccess && (
                    <div className="text-xs text-green-600 dark:text-green-400 font-medium text-center bg-green-50 dark:bg-green-900/30 py-1 rounded">
                        Sent successfully!
                    </div>
                )}
            </form>

            <div className="border-t border-slate-100 dark:border-slate-800 pt-4 flex-1 overflow-hidden">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">Recent</p>
                <div className="space-y-3 overflow-y-auto max-h-[150px] pr-2 custom-scrollbar">
                    {updates.slice(0, 3).map((update: any) => (
                        <div key={update.id || update._id} className="p-3 bg-slate-50 rounded-lg border border-slate-100 flex items-start space-x-3">
                             <div className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${
                                    update.type === 'maintenance' ? 'bg-orange-500' :
                                    update.type === 'event' ? 'bg-purple-500' :
                                    'bg-blue-500'
                                }`}></div>
                             <div>
                                 <p className="text-sm font-medium text-slate-800 line-clamp-1">{update.title}</p>
                                 <p className="text-[10px] text-slate-400">{update.date}</p>
                             </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>

        {/* SLA Compliance Widget (Replaced System Health) */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col">
            <h3 className="font-bold text-slate-800 mb-1 flex items-center">
                <Timer className="w-5 h-5 mr-2 text-indigo-600" />
                SLA Compliance
            </h3>
            <p className="text-xs text-slate-500 mb-4">Adherence to resolution time limits.</p>
            
            <div className="flex items-center justify-between mb-4 bg-slate-50 p-3 rounded-lg border border-slate-100">
                <span className="text-sm font-medium text-slate-700">Overall Rate</span>
                <span className={`text-xl font-bold ${
                    slaMetrics.overall >= 90 ? 'text-green-600' : 
                    slaMetrics.overall >= 75 ? 'text-orange-500' : 'text-red-500'
                }`}>
                    {slaMetrics.overall}%
                </span>
            </div>

            <div className="space-y-3 flex-1 overflow-y-auto custom-scrollbar pr-1">
                {slaMetrics.categories.map(cat => (
                    <div key={cat.name} className="space-y-1">
                        <div className="flex justify-between text-xs">
                            <span className="font-medium text-slate-600">{cat.name}</span>
                            <span className={`font-bold ${cat.rate < 90 ? 'text-red-500' : 'text-slate-500'}`}>
                                {cat.rate}% {cat.rate < 90 && <AlertCircle className="w-3 h-3 inline ml-0.5" />}
                            </span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-1.5">
                            <div 
                                className={`h-1.5 rounded-full ${
                                    cat.rate >= 90 ? 'bg-green-500' : 
                                    cat.rate >= 75 ? 'bg-orange-400' : 'bg-red-500'
                                }`} 
                                style={{ width: `${cat.rate}%` }}
                            ></div>
                        </div>
                    </div>
                ))}
                {slaMetrics.categories.length === 0 && (
                     <p className="text-center text-xs text-slate-400 py-4">No resolved issues to analyze yet.</p>
                )}
            </div>
        </div>
      </div>
      {/* Resolution Time Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
              <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-4">Avg. Resolution Time by Assignee (Hours)</h3>
              <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={resolutionStats.assigneeData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#334155" />
                          <XAxis type="number" tick={{fill: '#94a3b8'}} />
                          <YAxis dataKey="name" type="category" width={100} tick={{fontSize: 12, fill: '#94a3b8'}} />
                          <Tooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} contentStyle={{backgroundColor: '#1e293b', border: 'none', color: '#fff'}} />
                          <Bar dataKey="avgHours" fill="#8884d8" radius={[0, 4, 4, 0]} barSize={20} name="Hours" />
                      </BarChart>
                  </ResponsiveContainer>
              </div>
              {resolutionStats.assigneeData.length === 0 && (
                  <p className="text-center text-xs text-slate-400 mt-2">No data available.</p>
              )}
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
              <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-4">Avg. Resolution Time by Category (Hours)</h3>
              <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={resolutionStats.categoryData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" />
                          <XAxis dataKey="name" tick={{fontSize: 12, fill: '#94a3b8'}} />
                          <YAxis tick={{fill: '#94a3b8'}} />
                          <Tooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} contentStyle={{backgroundColor: '#1e293b', border: 'none', color: '#fff'}} />
                          <Bar dataKey="avgHours" fill="#82ca9d" radius={[4, 4, 0, 0]} barSize={30} name="Hours" />
                      </BarChart>
                  </ResponsiveContainer>
              </div>
              {resolutionStats.categoryData.length === 0 && (
                  <p className="text-center text-xs text-slate-400 mt-2">No data available.</p>
              )}
          </div>
      </div>
    </div>
  );
};