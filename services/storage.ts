import { Issue, IssueStatus, IssueCategory, IssuePriority, User, CampusUpdate, Notification } from '../types';

const API_URL = 'http://localhost:5000/api';
const CURRENT_USER_KEY = 'edusolve_user';

// Helper to get auth headers
const getHeaders = () => {
  const user = getCurrentUser();
  return {
    'Content-Type': 'application/json',
    ...(user?.token ? { Authorization: `Bearer ${user.token}` } : {})
  };
};

export const getCurrentUser = (): (User & { token?: string }) | null => {
  const data = localStorage.getItem(CURRENT_USER_KEY);
  return data ? JSON.parse(data) : null;
};

export const setCurrentUser = (user: (User & { token?: string }) | null): void => {
  if (user) {
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(CURRENT_USER_KEY);
  }
};

export const loginUser = async (studentId: string, password: string):Promise<(User & { token?: string }) | null> => {
  try {
    const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId, password })
    });
    if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || 'Login failed');
    }
    return await res.json();
  } catch(e: any) {
    throw e;
  }
};

export const updateProfile = async (userData: Partial<User>): Promise<User | null> => {
  try {
    const res = await fetch(`${API_URL}/auth/profile`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(userData)
    });
    if (!res.ok) {
    const errText = await res.text();
        console.error('Profile update failed:', res.status, errText);
        throw new Error(`Profile update failed: ${errText}`);
    }
    const updatedUser = await res.json();
    return updatedUser;
  } catch(e) {
    console.error(e);
    return null;
  }
};

export const getLeaderboard = async (): Promise<User[]> => {
  try {
    const res = await fetch(`${API_URL}/auth/leaderboard`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch leaderboard');
    return await res.json();
  } catch(e) {
    console.error(e);
    return [];
  }
};

export const getAllUsers = async (): Promise<User[]> => {
  try {
    const res = await fetch(`${API_URL}/auth/users`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch users');
    return await res.json();
  } catch(e) {
    console.error(e);
    return [];
  }
};

// Issues API
export const getIssues = async (): Promise<Issue[]> => {
  try {
    const res = await fetch(`${API_URL}/issues/all`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch issues');
    return await res.json();
  } catch (error) {
    console.error(error);
    return [];
  }
};

export const getPublicIssues = async (): Promise<Issue[]> => {
  try {
    const res = await fetch(`${API_URL}/issues/public`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch public issues');
    return await res.json();
  } catch (error) {
    console.error(error);
    return [];
  }
};

export const getMyIssues = async (): Promise<Issue[]> => {
  try {
    const res = await fetch(`${API_URL}/issues/my`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch my issues');
    return await res.json();
  } catch (error) {
    console.error(error);
    return [];
  }
};

export const saveIssue = async (issue: Partial<Issue>): Promise<void> => {
  const isNew = !issue.id && !issue._id; // _id from mongo
  
  let res;
  // Create new issue
  if (isNew) {
    res = await fetch(`${API_URL}/issues/create`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(issue)
    });
  } else {
    // Update existing issue (only status/assignedTo typically handled here by admin)
    const id = issue.id || issue._id;
    res = await fetch(`${API_URL}/issues/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(issue)
    });
  }

  if (!res.ok) {
     const text = await res.text();
     throw new Error(text || 'Failed to save issue');
  }
};

export const deleteIssue = async (issueId: string): Promise<void> => {
  const res = await fetch(`${API_URL}/issues/${issueId}`, {
    method: 'DELETE',
    headers: getHeaders()
  });
  if (!res.ok) {
    throw new Error('Failed to delete issue');
  }
};

export const voteIssue = async (issueId: string): Promise<void> => {
    try {
        await fetch(`${API_URL}/issues/${issueId}/vote`, {
            method: 'PUT',
            headers: getHeaders()
        });
    } catch (error) {
        console.error('Failed to vote', error);
    }
};

export const toggleBookmark = async (issueId: string): Promise<string[]> => {
    try {
        const res = await fetch(`${API_URL}/issues/${issueId}/bookmark`, {
            method: 'PUT',
            headers: getHeaders()
        });
        if (!res.ok) throw new Error('Failed to toggle bookmark');
        const updatedBookmarks = await res.json();
        const user = getCurrentUser();
        if (user) {
            user.bookmarks = updatedBookmarks;
            setCurrentUser(user);
        }
        return updatedBookmarks;
    } catch (error) {
        console.error('Failed to bookmark', error);
        return [];
    }
};

export const postComment = async (issueId: string, text: string): Promise<void> => {
    try {
        await fetch(`${API_URL}/issues/${issueId}/comment`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ text })
        });
    } catch (error) {
        console.error('Failed to post comment', error);
    }
};

// Notifications API
export const getNotifications = async (userId: string): Promise<Notification[]> => {
  try {
    const res = await fetch(`${API_URL}/notifications`, { headers: getHeaders() });
    if (!res.ok) return [];
    return await res.json();
  } catch (error) {
    console.error(error);
    return [];
  }
};

export const markNotificationsAsRead = async (userId: string): Promise<void> => {
  try {
    const notifs = await getNotifications(userId);
    for (const n of notifs.filter((n:any) => !n.isRead)) {
      await fetch(`${API_URL}/notifications/${n._id || n.id}/read`, {
        method: 'PUT',
        headers: getHeaders()
      });
    }
  } catch (error) {
    console.error('Failed to mark read', error);
  }
};

export const addNotification = async (notif: Partial<Notification>): Promise<void> => {
  try {
    await fetch(`${API_URL}/notifications`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(notif)
    });
  } catch (error) {
    console.error('Failed to add notification', error);
  }
};

// Updates API
export const getCampusUpdates = async (): Promise<CampusUpdate[]> => {
  try {
    const res = await fetch(`${API_URL}/updates`, { headers: getHeaders() });
    if (!res.ok) return [];
    return await res.json();
  } catch (error) {
    console.error(error);
    return [];
  }
};

export const saveCampusUpdate = async (update: Partial<CampusUpdate>): Promise<void> => {
  try {
    await fetch(`${API_URL}/updates`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(update)
    });
  } catch (error) {
    console.error('Failed to save update', error);
  }
};

export const getStaffUsers = async (): Promise<{ id: string; name: string; role: string }[]> => {
  try {
    const res = await fetch(`${API_URL}/auth/staff`, { headers: getHeaders() });
    if (!res.ok) return [];
    
    const staff = await res.json();
    return staff.map((s: any) => ({
       id: s._id,
       name: s.name,
       role: s.department || 'Staff'
    }));
  } catch (error) {
    console.error(error);
    return [];
  }
};