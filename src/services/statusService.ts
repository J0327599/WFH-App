import { StatusEntry } from '../types';
import { format } from 'date-fns';

const API_URL = 'http://localhost:3000/api';

// Define a basic User interface (align with AdminDashboard or backend schema)
export interface User {
  igg: string;
  fullName: string;
  jobTitle: string;
  area: string;
  email: string;
  reportsTo: string;
  // Add other fields if needed, e.g., created_at, updated_at
}

// Export functions directly
export const getMonthlyStatuses = async (date: Date): Promise<StatusEntry[]> => {
  const formattedDate = format(date, 'yyyy-MM-dd');
  const response = await fetch(`${API_URL}/status/monthly/${formattedDate}`);
  if (!response.ok) throw new Error('Failed to fetch monthly statuses');
  return response.json();
};

export const statusService = {
  async getMonthlyStatuses(date: Date): Promise<StatusEntry[]> {
    const formattedDate = format(date, 'yyyy-MM-dd');
    const response = await fetch(`${API_URL}/status/monthly/${formattedDate}`);
    if (!response.ok) throw new Error('Failed to fetch monthly statuses');
    return response.json();
  },

  async getUserStatus(email: string | null, date: Date): Promise<StatusEntry | null> {
    // Explicitly check for null or empty string email
    if (!email) {
        console.warn('getUserStatus called with invalid email:', email);
        return null;
    }
    const dateString = format(date, 'yyyy-MM-dd'); // Format date correctly
    try {
      // Use email and dateString in the URL
      const url = `${API_URL.replace(/\/$/, '')}/status/${email}/${dateString}`;
      console.log('Fetching status from URL:', url); // Debug log
      const response = await fetch(url);
      if (!response.ok) {
        if (response.status === 404) {
          // console.log(`No status found for ${email} on ${dateString}`);
          return null; // No status found for this date is okay
        }
        // Log the specific URL that failed
        console.error(`Failed fetch for URL: ${url}, Status: ${response.status}`);
        // Throwing might be okay if the caller handles it, but returning null might be safer for loops
        // throw new Error(`Failed to fetch user status: ${response.statusText}`);
        return null; // Return null on non-404 errors as well for now
      }
      const data: StatusEntry = await response.json();
      return data;
    } catch (error) {
      console.error(`Error in getUserStatus for ${email} on ${dateString}:`, error);
      return null; // Return null on fetch error
    }
  },

  async updateStatus(entry: StatusEntry): Promise<void> {
    const response = await fetch(`${API_URL}/status`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(entry)
    });
    if (!response.ok) throw new Error('Failed to update status');
  },

  async deleteStatus(email: string, date: string): Promise<void> {
    const response = await fetch(`${API_URL}/status/${email}/${date}`, {
      method: 'DELETE'
    });
    if (!response.ok) throw new Error('Failed to delete status');
  },

  async getAuditLogs(limit: number = 100): Promise<any[]> {
    const response = await fetch(`${API_URL}/audit-logs?limit=${limit}`);
    if (!response.ok) throw new Error('Failed to fetch audit logs');
    return response.json();
  },

  async getUsers(): Promise<User[]> {
    try {
      const response = await fetch(`${API_URL}/users`);
      if (!response.ok) {
        throw new Error(`Error fetching users: ${response.statusText}`);
      }
      const users: User[] = await response.json();
      return users;
    } catch (error) {
      console.error('Failed to get users:', error);
      throw error; // Re-throw the error to be handled by the caller
    }
  }
};

export type { StatusEntry };
