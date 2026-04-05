import React from 'react';
import { IssueStatus } from '../types';

interface Props {
  status: IssueStatus;
  isEscalated?: boolean;
}

export const StatusBadge: React.FC<Props> = ({ status, isEscalated }) => {
  if (isEscalated && status !== IssueStatus.RESOLVED) {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200 animate-pulse">
        Escalated
      </span>
    );
  }

  const styles = {
    [IssueStatus.SUBMITTED]: "bg-slate-100 text-slate-800 border-slate-200",
    [IssueStatus.ASSIGNED]: "bg-blue-100 text-blue-800 border-blue-200",
    [IssueStatus.IN_PROGRESS]: "bg-yellow-100 text-yellow-800 border-yellow-200",
    [IssueStatus.RESOLVED]: "bg-green-100 text-green-800 border-green-200",
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[status]}`}>
      {status}
    </span>
  );
};