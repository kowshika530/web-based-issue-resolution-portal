import React, { useState, useEffect } from 'react';
import { getPublicIssues, saveIssue, voteIssue } from '../../services/storage';
import { Issue, IssueStatus, User } from '../../types';
import { ThumbsUp, MessageSquare } from 'lucide-react';
import { StatusBadge } from '../../components/StatusBadge';

interface Props {
  user: User;
}

export const Community: React.FC<Props> = ({ user }) => {
  const [issues, setIssues] = useState<Issue[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const all = await getPublicIssues();
    setIssues(all.sort((a, b) => b.votes.length - a.votes.length));
  };

  const handleVote = async (issueId: string) => {
    try {
        await voteIssue(issueId);
        // Optimistic update
        const updatedIssues = issues.map(i => {
          const idStr = i.id || i._id;
          const userId = user.id || user._id;
          if (idStr === issueId) {
            if (!i.votes.includes(userId as string)) {
                return { ...i, votes: [...i.votes, userId as string] };
            }
          }
          return i;
        });
        setIssues(updatedIssues.sort((a, b) => b.votes.length - a.votes.length)); 
    } catch(e) {
        console.error(e);
        loadData();
    }
  };

  const userId = user.id || user._id;

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-slate-800">Community Voice</h1>
        <p className="text-slate-500 mt-2">Trending issues voted by students. Higher votes get higher priority.</p>
      </div>

      <div className="space-y-6">
        {issues.map((issue: any, idx) => {
          const issueId = issue.id || issue._id;
          return (
          <div key={issueId} className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 hover:border-indigo-200 transition-all">
            <div className="flex items-start gap-4">
              <div className="flex flex-col items-center min-w-[60px]">
                <button 
                  onClick={() => handleVote(issueId)}
                  disabled={issue.votes.includes(userId)}
                  className={`flex flex-col items-center justify-center w-12 h-12 rounded-xl transition-colors ${
                      issue.votes.includes(userId) 
                      ? 'bg-indigo-100 text-indigo-600' 
                      : 'bg-slate-100 text-slate-500 hover:bg-indigo-50 hover:text-indigo-600'
                  }`}
                >
                  <ThumbsUp className={`w-5 h-5 mb-1 ${issue.votes.includes(userId) ? 'fill-current' : ''}`} />
                  <span className="text-xs font-bold">{issue.votes.length}</span>
                </button>
              </div>
              
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                   <h3 className="text-lg font-semibold text-slate-800">{issue.title}</h3>
                   <StatusBadge status={issue.status} />
                </div>
                <p className="text-slate-600 mb-4">{issue.description}</p>
                <div className="flex items-center text-xs text-slate-400 gap-4">
                    <span>Raised by {issue.isAnonymous ? 'Anonymous' : issue.studentName}</span>
                    <span>•</span>
                    <span>{issue.location}</span>
                    <span>•</span>
                    <span>{new Date(issue.createdAt).toLocaleDateString()}</span>
                </div>
              </div>

              {idx < 3 && (
                 <div className="hidden md:flex items-center justify-center w-8 h-8 rounded-full bg-yellow-100 text-yellow-700 font-bold text-xs">
                    #{idx + 1}
                 </div>
              )}
            </div>
          </div>
        )})}
      </div>
    </div>
  );
};