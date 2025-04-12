export interface User {
  igg: string;
  fullName: string;
  jobTitle: string;
  area: string;
  email: string;
  reportsTo: string;
  password: string;
}

export interface StatusEntry {
  id?: number;
  email: string;
  date: string;
  status: string;
  comment?: string;
  created_at?: string;
  updated_at?: string;
}

export interface AuditLogEntry {
  id: number;
  timestamp: string;
  user_id: string;
  action: string;
  details: string;
  created_at: string;
}

export interface DashboardStats {
  totalUsers: number;
  workingFromHome: number;
  onLeave: number;
  offsite: number;
  inTraining: number;
}
