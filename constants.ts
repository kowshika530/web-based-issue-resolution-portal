import { IssueCategory, IssuePriority, IssueStatus, UserRole } from './types';

// Service Level Agreement (SLA) in Hours
export const SLA_HOURS: Record<IssueCategory, number> = {
  [IssueCategory.ACADEMIC]: 48,
  [IssueCategory.INFRASTRUCTURE]: 72,
  [IssueCategory.TECHNICAL]: 24,
  [IssueCategory.MESS]: 24,
  [IssueCategory.HOSTEL]: 48,
  [IssueCategory.OTHER]: 96,
};



// Helper to calculate escalation
export const isIssueEscalated = (createdAt: string, status: IssueStatus, category: IssueCategory): boolean => {
  if (status === IssueStatus.RESOLVED) return false;
  const created = new Date(createdAt).getTime();
  const now = new Date().getTime();
  const slaMs = SLA_HOURS[category] * 60 * 60 * 1000;
  return (now - created) > slaMs;
};

// Keyword mapping for auto-prediction
export const KEYWORD_CATEGORY_MAP: Record<string, IssueCategory> = {
  'wifi': IssueCategory.TECHNICAL,
  'internet': IssueCategory.TECHNICAL,
  'network': IssueCategory.TECHNICAL,
  'login': IssueCategory.TECHNICAL,
  'server': IssueCategory.TECHNICAL,
  'food': IssueCategory.MESS,
  'meal': IssueCategory.MESS,
  'canteen': IssueCategory.MESS,
  'water': IssueCategory.INFRASTRUCTURE,
  'leak': IssueCategory.INFRASTRUCTURE,
  'broken': IssueCategory.INFRASTRUCTURE,
  'fan': IssueCategory.INFRASTRUCTURE,
  'ac': IssueCategory.INFRASTRUCTURE,
  'light': IssueCategory.INFRASTRUCTURE,
  'projector': IssueCategory.INFRASTRUCTURE,
  'exam': IssueCategory.ACADEMIC,
  'grade': IssueCategory.ACADEMIC,
  'class': IssueCategory.ACADEMIC,
  'faculty': IssueCategory.ACADEMIC,
  'room': IssueCategory.HOSTEL,
  'bed': IssueCategory.HOSTEL,
  'washroom': IssueCategory.HOSTEL,
};