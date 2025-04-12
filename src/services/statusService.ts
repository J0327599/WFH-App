import { StatusEntry } from '../types';

const API_URL = 'http://localhost:3000/api';

// Export functions directly
export const getMonthlyStatuses = async (date: Date): Promise<StatusEntry[]> => {
  const response = await fetch(`${API_URL}/status/monthly/${date.toISOString()}`);
  if (!response.ok) throw new Error('Failed to fetch monthly statuses');
  return response.json();
};

export const statusService = {
  async getMonthlyStatuses(date: Date): Promise<StatusEntry[]> {
    const response = await fetch(`${API_URL}/status/monthly/${date.toISOString()}`);
    if (!response.ok) throw new Error('Failed to fetch monthly statuses');
    return response.json();
  },

  async getUserStatus(email: string, date: string): Promise<StatusEntry | undefined> {
    const response = await fetch(`${API_URL}/status/${email}/${date}`);
    if (!response.ok) throw new Error('Failed to fetch user status');
    const data = await response.json();
    return data || undefined;
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
  }
};

export type { StatusEntry };
