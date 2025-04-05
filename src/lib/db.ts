import usersData from '../data/users.json';
import workStatusData from '../data/workStatus.json';

interface User {
  igg: string;
  fullName: string;
  jobTitle: string;
  area: string;
  email: string;
  reportsTo: string;
  password?: string;
}

interface WorkStatus {
  email: string;
  date: string;
  status: 'H' | 'O' | 'L' | 'T' | 'S';
}

class DB {
  private users: User[] = usersData.users;
  private workStatuses: WorkStatus[] = workStatusData.statuses;

  async signIn(email: string, password: string): Promise<User> {
    console.log('DB: Attempting to sign in with:', email);
    console.log('DB: Available users:', this.users.map(u => u.email));
    
    const user = this.users.find(u => u.email.toLowerCase() === email.toLowerCase());
    
    if (!user) {
      console.log('DB: User not found');
      throw new Error('Invalid email or password');
    }

    console.log('DB: User found, checking password');
    if (user.password !== password) {
      console.log('DB: Password mismatch');
      throw new Error('Invalid email or password');
    }

    console.log('DB: Sign in successful');
    // Remove password from returned user object
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async signUp(userData: Omit<User, 'password'> & { password: string }): Promise<User> {
    console.log('DB: Attempting to sign up:', userData.email);
    
    if (this.users.some(u => u.email.toLowerCase() === userData.email.toLowerCase())) {
      console.log('DB: User already exists');
      throw new Error('User already exists');
    }
    
    const newUser = { ...userData };
    this.users.push(newUser);
    
    console.log('DB: Sign up successful');
    // Remove password from returned user object
    const { password: _, ...userWithoutPassword } = newUser;
    return userWithoutPassword;
  }

  async getWorkStatus(email: string, startDate: string, endDate: string): Promise<WorkStatus[]> {
    return this.workStatuses.filter(status => 
      status.email === email && 
      status.date >= startDate && 
      status.date <= endDate
    );
  }

  async updateWorkStatus(status: WorkStatus): Promise<void> {
    const existingIndex = this.workStatuses.findIndex(s => 
      s.email === status.email && s.date === status.date
    );

    if (existingIndex >= 0) {
      this.workStatuses[existingIndex] = status;
    } else {
      this.workStatuses.push(status);
    }
  }
}

export const db = new DB();