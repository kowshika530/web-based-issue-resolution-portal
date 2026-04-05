export enum UserRole {
  STUDENT = 'STUDENT',
  ADMIN = 'ADMIN',
  FACULTY = 'FACULTY'
}

export enum IssueStatus {
  SUBMITTED = 'Submitted',
  ASSIGNED = 'Assigned',
  IN_PROGRESS = 'In Progress',
  RESOLVED = 'Resolved',
  REJECTED = 'Rejected'
}

export enum IssuePriority {
  LOW = 'Low',
  MEDIUM = 'Medium',
  HIGH = 'High',
  CRITICAL = 'Critical'
}

export enum IssueCategory {
  ACADEMIC = 'Academic',
  INFRASTRUCTURE = 'Infrastructure',
  TECHNICAL = 'Technical',
  MESS = 'Mess/Canteen',
  HOSTEL = 'Hostel',
  OTHER = 'Other'
}

export interface User {
  id: string;
  _id?: string;
  name: string;
  email?: string;
  studentId: string;
  role: UserRole;
  department?: string;
  avatar?: string;
  reputationScore?: number;
  trustScore?: number;
  achievements?: string[];
  totalIssuesRaised?: number;
  totalIssuesResolved?: number;
  fakeIssuesCount?: number;
  year?: string;
  bookmarks?: string[];
}

export interface Comment {
  id: string;
  _id?: string;
  authorId: string;
  authorName: string;
  text: string;
  timestamp: string;
  role: UserRole;
}

export interface Issue {
  id: string;
  _id?: string;
  title: string;
  description: string;
  category: IssueCategory;
  location: string;
  priority: IssuePriority;
  status: IssueStatus;
  studentId: string;
  studentName: string;
  assignedTo?: string; // Faculty/Staff name
  assignedFacultyId?: string;
  assignedAt?: string;
  votes: string[]; // Array of student IDs who voted
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  attachments?: string[];
  isAnonymous: boolean;
  isVerified?: boolean;
  isFlagged?: boolean;
  locationValidated?: boolean;
  trustScore?: number;
  comments: Comment[];
  isPinned?: boolean;
  staffNotes?: string;
  history?: Array<{ status: string; changedBy: string; timestamp: string }>;
}

export interface DashboardStats {
  total: number;
  pending: number;
  inProgress: number;
  resolved: number;
  escalated: number;
  avgResolutionTimeHours: number;
}

export interface CampusUpdate {
  id: string;
  _id?: string;
  title: string;
  date: string;
  type: 'maintenance' | 'event' | 'info';
}

export interface Notification {
  id: string;
  _id?: string;
  userId: string;
  issueId?: string;
  title: string;
  message: string;
  type: 'success' | 'info' | 'warning' | 'error';
  isRead: boolean;
  createdAt: string;
}